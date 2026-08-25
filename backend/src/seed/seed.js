import mongoose from 'mongoose';
import { database } from '../config/database.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import {
  User, Company, Supplier, Category, Product,
  RFQ, Quotation, PurchaseOrder, Review, Notification, Conversation, Message,
} from '../models/index.js';
import { nextSequence, resetSequences } from '../utils/sequence.js';
import { coordsForCity } from '../utils/geo.js';
import {
  ROLES, VERIFICATION_STATUS, RFQ_STATUS, QUOTATION_STATUS,
  PO_STATUS, NOTIFICATION_TYPES, DOCUMENT_TYPES,
} from '../config/constants.js';
import { QuotationScorer } from '../strategies/QuotationScorer.js';
import { matchingService } from '../services/matching.service.js';
import { categories, suppliers, companies, admin, DEMO_PASSWORD } from './data.js';

const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);
const pick = (arr, i) => arr[i % arr.length];

/**
 * Aligns the collections' indexes with the current schemas before seeding,
 * so an index definition that changed since the last run is rebuilt rather
 * than silently enforcing the old rule.
 */
const syncIndexes = async () => {
  const models = [
    User, Company, Supplier, Category, Product,
    RFQ, Quotation, PurchaseOrder, Review, Notification, Conversation, Message,
  ];
  await Promise.all(models.map((m) => m.syncIndexes()));
  logger.info('Indexes synchronised');
};

const wipe = async () => {
  await Promise.all([
    User.deleteMany({}), Company.deleteMany({}), Supplier.deleteMany({}),
    Category.deleteMany({}), Product.deleteMany({}), RFQ.deleteMany({}),
    Quotation.deleteMany({}), PurchaseOrder.deleteMany({}), Review.deleteMany({}),
    Notification.deleteMany({}), Conversation.deleteMany({}), Message.deleteMany({}),
    resetSequences(),
  ]);
  logger.info('Existing data cleared');
};

const seedCategories = async () => {
  const map = new Map();
  for (const root of categories) {
    const parent = await Category.create({
      name: root.name, nameAr: root.nameAr, icon: root.icon, order: root.order,
    });
    map.set(root.name, parent);
    for (const [i, child] of (root.children || []).entries()) {
      const doc = await Category.create({
        name: child.name, nameAr: child.nameAr, parent: parent._id, order: i, icon: root.icon,
      });
      map.set(child.name, doc);
    }
  }
  logger.info(`Seeded ${map.size} categories`);
  return map;
};

const seedSuppliers = async (categoryMap) => {
  const created = [];
  for (const s of suppliers) {
    const cats = s.categoryPath.map((n) => categoryMap.get(n)).filter(Boolean);
    const coords = coordsForCity(s.city) || {};

    const supplier = await Supplier.create({
      name: s.name,
      nameAr: s.nameAr,
      crNumber: s.crNumber,
      vatNumber: `3${s.crNumber}00003`,
      iban: `SA${s.crNumber}0000${s.crNumber.slice(0, 6)}`,
      tagline: s.tagline,
      about: s.about,
      aboutAr: s.aboutAr || '',
      categories: cats.map((c) => c._id),
      primaryCategory: cats[0]?._id,
      tags: s.categoryPath,
      documents: s.documents,
      certifications: s.certifications || [],
      pastProjects: s.pastProjects || [],
      contact: {
        email: `sales@${s.name.toLowerCase().replace(/[^a-z]/g, '')}.sa`,
        phone: '+96613' + s.crNumber.slice(0, 7),
        website: `https://${s.name.toLowerCase().replace(/[^a-z]/g, '')}.sa`,
        contactPerson: 'Sales Department',
      },
      location: {
        city: s.city, region: s.city, country: 'Saudi Arabia',
        lat: coords.lat ?? null, lng: coords.lng ?? null,
      },
      coverageAreas: s.coverageAreas,
      rating: {
        average: s.rating,
        count: s.ratingCount,
        breakdown: {
          quality: +(s.rating + 0.1).toFixed(1) > 5 ? 5 : +(s.rating + 0.1).toFixed(1),
          delivery: +(s.rating - 0.1).toFixed(1),
          communication: s.rating,
          pricing: +(s.rating - 0.2).toFixed(1),
        },
      },
      onTimeDeliveryRate: s.onTime,
      complianceRate: s.compliance,
      priceIndex: s.priceIndex,
      avgLeadTimeDays: s.leadTime,
      responseTimeHours: 6,
      foundedYear: s.founded,
      employees: s.employees,
      projectsCompleted: s.projects,
      featured: Boolean(s.featured),
      verified: true,
      status: VERIFICATION_STATUS.VERIFIED,
      verifiedAt: daysAgo(120),
      stats: {
        quotesSubmitted: 40 + (s.ratingCount % 40),
        quotesWon: 12 + (s.ratingCount % 15),
        ordersCompleted: s.projects % 60,
        totalSales: s.projects * 12_500,
      },
    });

    const owner = await User.create({
      firstName: s.name.split(' ')[0],
      lastName: 'Sales',
      email: `supplier${created.length + 1}@procurio.sa`,
      password: DEMO_PASSWORD,
      phone: '+96650' + s.crNumber.slice(0, 7),
      role: ROLES.SUPPLIER,
      jobTitle: 'Sales Manager',
      supplier: supplier._id,
      emailVerified: true,
    });
    supplier.owner = owner._id;
    await supplier.save();

    for (const p of s.products || []) {
      await Product.create({
        supplier: supplier._id,
        category: categoryMap.get(p.category)?._id ?? cats[0]._id,
        name: p.name,
        description: `${p.name} supplied by ${s.name}, compliant with Saudi Building Code.`,
        unit: p.unit,
        priceFrom: p.priceFrom,
        priceTo: p.priceTo,
        leadTimeDays: p.lead,
        minOrderQuantity: 1,
        specifications: [
          { key: 'Origin', value: 'Saudi Arabia' },
          { key: 'Warranty', value: '5', unit: 'years' },
        ],
      });
    }

    created.push(supplier);
  }

  // One supplier still waiting in the verification queue, for the admin screen.
  const pending = await Supplier.create({
    name: 'Desert Rock Quarries',
    nameAr: 'محاجر الصخور',
    crNumber: '1010445599',
    about: 'Aggregate and crushed stone supplier applying for platform verification.',
    categories: [categoryMap.get('Cement & Aggregates')._id, categoryMap.get('Construction Materials')._id],
    primaryCategory: categoryMap.get('Construction Materials')._id,
    contact: { email: 'info@desertrock.sa', phone: '+966138889999', contactPerson: 'Operations' },
    location: { city: 'Abha', country: 'Saudi Arabia', ...(coordsForCity('Abha') || {}) },
    coverageAreas: ['Abha', 'Jazan', 'Najran'],
    documents: [
      { type: DOCUMENT_TYPES.COMMERCIAL_REGISTRATION, name: 'Commercial Registration', url: '/uploads/samples/cr.pdf', number: '1010445599' },
      { type: DOCUMENT_TYPES.VAT_CERTIFICATE, name: 'VAT Certificate', url: '/uploads/samples/vat.pdf' },
      { type: DOCUMENT_TYPES.IBAN_LETTER, name: 'IBAN Letter', url: '/uploads/samples/iban.pdf' },
    ],
    foundedYear: 2019,
    employees: 45,
    status: VERIFICATION_STATUS.UNDER_REVIEW,
    avgLeadTimeDays: 12,
  });
  await User.create({
    firstName: 'Desert', lastName: 'Rock', email: 'pending@procurio.sa',
    password: DEMO_PASSWORD, phone: '+966501112233', role: ROLES.SUPPLIER,
    jobTitle: 'General Manager', supplier: pending._id,
  });

  logger.info(`Seeded ${created.length} verified suppliers + 1 pending verification`);
  return created;
};

const seedCompanies = async () => {
  const created = [];
  for (const c of companies) {
    const coords = coordsForCity(c.city) || {};
    const company = await Company.create({
      name: c.name, nameAr: c.nameAr, crNumber: c.crNumber, vatNumber: `3${c.crNumber}00003`,
      sector: c.sector, size: c.size, email: c.owner.email, phone: c.owner.phone,
      address: { city: c.city, region: c.city, country: 'Saudi Arabia', ...coords },
      status: VERIFICATION_STATUS.VERIFIED, verified: true,
    });

    const owner = await User.create({
      ...c.owner, password: DEMO_PASSWORD, role: ROLES.BUYER,
      company: company._id, emailVerified: true,
    });
    company.owner = owner._id;
    await company.save();

    for (const member of c.team) {
      await User.create({
        ...member, phone: c.owner.phone, password: DEMO_PASSWORD,
        role: ROLES.BUYER, company: company._id, emailVerified: true,
      });
    }
    created.push({ company, owner });
  }
  logger.info(`Seeded ${created.length} buying companies`);
  return created;
};

/** RFQs mirroring the "Recent RFQs" list from the Buyer Dashboard mockup. */
const RFQ_BLUEPRINTS = [
  {
    title: 'Supply of Interlock Pavers', category: 'Construction Materials', sub: 'Interlock Pavers',
    project: 'Jazan Waterfront Project', city: 'Jazan', ageDays: 3, deliverIn: 20,
    items: [
      {
        name: 'Interlock Paver 8cm', quantity: 10_000, unit: 'm2', targetPrice: 18,
        specifications: [
          { key: 'Thickness', value: '8', unit: 'cm' },
          { key: 'Colour', value: 'Grey' },
          { key: 'Load bearing', value: '50', unit: 'MPa' },
          { key: 'Standard', value: 'SASO 1607' },
        ],
      },
      {
        name: 'Precast Kerbstone', quantity: 1_200, unit: 'm', targetPrice: 38,
        specifications: [{ key: 'Profile', value: 'Half battered' }, { key: 'Colour', value: 'Grey' }],
      },
    ],
  },
  {
    title: 'Ready Mix Concrete C40', category: 'Construction Materials', sub: 'Ready Mix Concrete',
    project: 'Riyadh Tower Foundations', city: 'Riyadh', ageDays: 5, deliverIn: 7,
    items: [
      {
        name: 'Ready Mix Concrete', quantity: 500, unit: 'm3', targetPrice: 310,
        specifications: [
          { key: 'Grade', value: 'C40' },
          { key: 'Slump', value: '150', unit: 'mm' },
          { key: 'Aggregate', value: '20mm' },
        ],
      },
    ],
  },
  {
    title: 'Electrical Cables Package', category: 'Electrical & Electronics', sub: 'Cables & Wiring',
    project: 'Dammam Logistics Hub', city: 'Dammam', ageDays: 8, deliverIn: 25,
    items: [
      {
        name: 'XLPE Power Cable 4x95mm', quantity: 4_000, unit: 'm', targetPrice: 110,
        specifications: [{ key: 'Voltage', value: '0.6/1', unit: 'kV' }, { key: 'Conductor', value: 'Copper' }],
      },
    ],
  },
  {
    title: 'Safety Equipment Bundle', category: 'Facilities Management', sub: 'Safety Equipment',
    project: 'Site Safety Programme 2026', city: 'Riyadh', ageDays: 11, deliverIn: 14,
    items: [
      {
        name: 'Safety Helmet Class E', quantity: 1_500, unit: 'pcs', targetPrice: 45,
        specifications: [{ key: 'Standard', value: 'ANSI Z89.1' }, { key: 'Colour', value: 'White' }],
      },
    ],
  },
  {
    title: 'HVAC Systems for Warehouse', category: 'Industrial Supplies', sub: 'HVAC Systems',
    project: 'Jeddah Cold Store', city: 'Jeddah', ageDays: 14, deliverIn: 45,
    items: [
      {
        name: 'Air-Cooled Chiller 200 TR', quantity: 2, unit: 'pcs', targetPrice: 380_000,
        specifications: [{ key: 'Capacity', value: '200', unit: 'TR' }, { key: 'Refrigerant', value: 'R134a' }],
      },
    ],
  },
  {
    title: 'Steel Rebar Supply', category: 'Construction Materials', sub: 'Steel Rebar',
    project: 'Jazan Waterfront Project', city: 'Jazan', ageDays: 18, deliverIn: 30,
    items: [
      {
        name: 'Deformed Steel Bar 16mm', quantity: 320, unit: 'ton', targetPrice: 2_800,
        specifications: [{ key: 'Grade', value: 'B500B' }, { key: 'Length', value: '12', unit: 'm' }],
      },
    ],
  },
];

const seedRfqsAndQuotes = async (categoryMap, buyers, supplierDocs) => {
  const [primary] = buyers;
  const rfqs = [];

  for (const [index, bp] of RFQ_BLUEPRINTS.entries()) {
    const buyer = index % 3 === 2 && buyers[1] ? buyers[1] : primary;
    const coords = coordsForCity(bp.city) || {};

    const rfq = await RFQ.create({
      rfqNumber: await nextSequence('RFQ'),
      title: bp.title,
      buyer: buyer.owner._id,
      company: buyer.company._id,
      category: categoryMap.get(bp.category)._id,
      subCategory: categoryMap.get(bp.sub)?._id ?? null,
      projectName: bp.project,
      deliveryLocation: {
        city: bp.city, region: bp.city, country: 'Saudi Arabia',
        address: `${bp.project} site`, lat: coords.lat ?? null, lng: coords.lng ?? null,
      },
      requiredDeliveryDate: daysFromNow(bp.deliverIn),
      quotationDeadline: daysFromNow(Math.max(3, Math.round(bp.deliverIn / 3))),
      items: bp.items,
      notes: 'Please provide best price with all delivery and installation terms.',
      paymentTerms: '30 Days',
      warrantyRequired: 3,
      estimatedValue: bp.items.reduce((s, i) => s + (i.targetPrice || 0) * i.quantity, 0),
      status: RFQ_STATUS.PUBLISHED,
      publishedAt: daysAgo(bp.ageDays),
      createdAt: daysAgo(bp.ageDays),
    });

    const invited = await matchingService.autoInvite(rfq, { limit: 8 });
    rfq.invitedSuppliers = invited;
    await rfq.save();
    rfqs.push(rfq);
  }

  // Quote the first four RFQs so Compare Quotations has data to render.
  const quotesByRfq = new Map();
  for (const rfq of rfqs.slice(0, 4)) {
    const bidders = rfq.invitedSuppliers.slice(0, 3);
    const quotes = [];

    for (const [i, invite] of bidders.entries()) {
      const supplier = supplierDocs.find((s) => String(s._id) === String(invite.supplier));
      if (!supplier) continue;

      const factor = [0.96, 1.06, 1.01][i] ?? 1;
      const quote = await Quotation.create({
        quoteNumber: await nextSequence('QT'),
        rfq: rfq._id,
        supplier: supplier._id,
        submittedBy: supplier.owner,
        items: rfq.items.map((item) => ({
          rfqItemId: item._id,
          name: item.name,
          brand: pick(['Al Rajhi', 'Saudi Ceramics', 'Zamil', 'Generic'], i),
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: +((item.targetPrice || 100) * factor * (supplier.priceIndex / 100)).toFixed(2),
          specCompliance: [100, 95, 98][i] ?? 96,
        })),
        deliveryDays: [7, 10, 8][i] ?? supplier.avgLeadTimeDays,
        warrantyYears: [5, 3, 4][i] ?? 3,
        paymentTerms: ['30 Days', '30 Days', '45 Days'][i] ?? '30 Days',
        validUntil: daysFromNow(30),
        vatRate: env.vatRate,
        terms: 'Prices include delivery to site. Offloading by the client.',
        status: QUOTATION_STATUS.SUBMITTED,
        submittedAt: daysAgo(1),
      });
      quotes.push(quote);
    }

    rfq.quotesCount = quotes.length;
    rfq.status = RFQ_STATUS.QUOTED;
    await rfq.save();

    const hydrated = await Quotation.find({ rfq: rfq._id }).populate('supplier');
    const scored = QuotationScorer.score(hydrated);
    await Promise.all(
      scored.map((q) =>
        Quotation.updateOne({ _id: q._id }, { matchScore: q.matchScore, scoreBreakdown: q.scoreBreakdown }),
      ),
    );
    quotesByRfq.set(String(rfq._id), scored);
  }

  logger.info(`Seeded ${rfqs.length} RFQs with quotations`);
  return { rfqs, quotesByRfq };
};

const seedOrders = async (rfqs, quotesByRfq, buyers) => {
  const orders = [];
  const statuses = [PO_STATUS.DELIVERED, PO_STATUS.SHIPPED, PO_STATUS.PROCESSING, PO_STATUS.APPROVED];

  for (const [i, rfq] of rfqs.slice(0, 4).entries()) {
    const scored = quotesByRfq.get(String(rfq._id)) || [];
    const winner = scored[0];
    if (!winner) continue;

    const quotation = await Quotation.findById(winner._id);
    const status = statuses[i];

    // The award must land after the RFQ was published, otherwise the
    // sourcing-cycle metric goes negative.
    const publishedAt = new Date(rfq.publishedAt);
    const awardedAt = new Date(Math.min(Date.now(), publishedAt.getTime() + 2 * 86_400_000));

    const flow = [PO_STATUS.ISSUED, PO_STATUS.APPROVED, PO_STATUS.PROCESSING, PO_STATUS.SHIPPED, PO_STATUS.DELIVERED];
    const timeline = [];
    for (const step of flow) {
      // One step per day from the award date, never in the future.
      const at = new Date(
        Math.min(Date.now(), awardedAt.getTime() + flow.indexOf(step) * 86_400_000),
      );
      timeline.push({ status: step, note: `Order ${step}`, at });
      if (step === status) break;
    }

    const po = await PurchaseOrder.create({
      poNumber: await nextSequence('PO'),
      rfq: rfq._id,
      quotation: quotation._id,
      buyer: rfq.buyer,
      company: rfq.company,
      supplier: quotation.supplier,
      items: quotation.items.map((it) => ({
        name: it.name, brand: it.brand, quantity: it.quantity, unit: it.unit,
        unitPrice: it.unitPrice, totalPrice: it.totalPrice,
        deliveredQuantity: status === PO_STATUS.DELIVERED ? it.quantity : 0,
      })),
      subtotal: quotation.subtotal,
      vatRate: quotation.vatRate,
      vatAmount: quotation.vatAmount,
      total: quotation.totalPrice,
      commission: +(quotation.totalPrice * env.commissionRate).toFixed(2),
      paymentTerms: quotation.paymentTerms,
      warrantyYears: quotation.warrantyYears,
      deliveryLocation: {
        city: rfq.deliveryLocation.city,
        region: rfq.deliveryLocation.region,
        country: 'Saudi Arabia',
        address: rfq.deliveryLocation.address,
      },
      expectedDeliveryDate: daysFromNow(quotation.deliveryDays),
      actualDeliveryDate: status === PO_STATUS.DELIVERED ? timeline.at(-1).at : null,
      shipment:
        [PO_STATUS.SHIPPED, PO_STATUS.DELIVERED].includes(status)
          ? {
              carrier: 'Aramex Freight',
              trackingNumber: `TRK${100000 + i}`,
              shippedAt: timeline.find((t) => t.status === PO_STATUS.SHIPPED)?.at ?? awardedAt,
            }
          : {},
      status,
      timeline,
      createdAt: awardedAt,
    });

    await Quotation.updateOne({ _id: quotation._id }, { status: QUOTATION_STATUS.ACCEPTED, decidedAt: awardedAt });
    await Quotation.updateMany(
      { rfq: rfq._id, _id: { $ne: quotation._id } },
      { status: QUOTATION_STATUS.REJECTED, rejectionReason: 'Another supplier was selected' },
    );
    await RFQ.updateOne({ _id: rfq._id }, {
      status: RFQ_STATUS.AWARDED, awardedQuotation: quotation._id, closedAt: awardedAt,
    });

    const savings = QuotationScorer.savingsAgainstHighest(scored, winner);
    await Company.updateOne({ _id: rfq.company }, {
      $inc: { 'stats.orderCount': 1, 'stats.totalSpend': po.total, 'stats.savings': savings },
    });

    orders.push(po);
  }

  // A completed, rated order so supplier profiles show real reviews.
  const [first] = orders;
  if (first) {
    await PurchaseOrder.updateOne({ _id: first._id }, { status: PO_STATUS.COMPLETED, rated: true });
    await Review.create({
      supplier: first.supplier,
      company: first.company,
      author: first.buyer,
      purchaseOrder: first._id,
      scores: { quality: 5, delivery: 5, communication: 5, pricing: 4 },
      title: 'Delivered ahead of schedule',
      comment: 'Specifications matched exactly and the delivery arrived three days early. Would order again.',
    });
  }

  await Company.updateMany({}, [{ $set: { 'stats.rfqCount': { $literal: rfqs.length } } }]);
  logger.info(`Seeded ${orders.length} purchase orders`);
  return orders;
};

/**
 * Back-fills historical reviews so every supplier's rating average and count
 * are computed from real documents rather than hard-coded numbers — the same
 * aggregation the app runs after each new rating.
 */
const seedHistoricalReviews = async (supplierDocs, buyers) => {
  const COMMENTS = [
    'Specifications matched exactly and delivery arrived on schedule.',
    'Competitive pricing and a responsive sales team.',
    'Good quality overall; documentation could be faster.',
    'Delivered ahead of schedule on a tight programme.',
    'Reliable partner across several projects.',
  ];

  for (const supplier of supplierDocs) {
    const target = supplier.rating.count;
    const average = supplier.rating.average;
    const docs = [];

    // Distribute integer scores so their mean lands on the intended average:
    // for 4.8 that is 80% fives and 20% fours, spread deterministically.
    const lo = Math.floor(average);
    const hi = Math.min(5, lo + 1);
    const hiOutOfTen = Math.round((average - lo) * 10);
    const scoreAt = (n) => (n % 10 < hiOutOfTen ? hi : lo);

    for (let i = 0; i < target; i += 1) {
      const buyer = buyers[i % buyers.length];
      docs.push({
        supplier: supplier._id,
        company: buyer.company._id,
        author: buyer.owner._id,
        purchaseOrder: null,
        scores: {
          quality: scoreAt(i * 4),
          delivery: scoreAt(i * 4 + 1),
          communication: scoreAt(i * 4 + 2),
          pricing: scoreAt(i * 4 + 3),
        },
        rating: 0,
        title: '',
        comment: i % 4 === 0 ? COMMENTS[i % COMMENTS.length] : '',
        isPublic: i % 4 === 0,
        createdAt: daysAgo(10 + i * 3),
      });
    }

    // `rating` is derived in a pre-save hook, so compute it for the bulk insert.
    docs.forEach((d) => {
      const sc = d.scores;
      d.rating = +((sc.quality + sc.delivery + sc.communication + sc.pricing) / 4).toFixed(1);
    });

    if (docs.length) await Review.insertMany(docs);

    const [agg] = await Review.aggregate([
      { $match: { supplier: supplier._id } },
      {
        $group: {
          _id: '$supplier',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          quality: { $avg: '$scores.quality' },
          delivery: { $avg: '$scores.delivery' },
          communication: { $avg: '$scores.communication' },
          pricing: { $avg: '$scores.pricing' },
        },
      },
    ]);

    if (agg) {
      await Supplier.updateOne({ _id: supplier._id }, {
        'rating.average': +agg.average.toFixed(1),
        'rating.count': agg.count,
        'rating.breakdown.quality': +agg.quality.toFixed(1),
        'rating.breakdown.delivery': +agg.delivery.toFixed(1),
        'rating.breakdown.communication': +agg.communication.toFixed(1),
        'rating.breakdown.pricing': +agg.pricing.toFixed(1),
      });
    }
  }

  logger.info('Seeded historical supplier reviews');
};

const seedConversationsAndNotifications = async (buyers, supplierDocs, rfqs) => {
  const [primary] = buyers;
  const supplier = supplierDocs[0];
  const supplierUser = await User.findOne({ supplier: supplier._id });

  const conversation = await Conversation.create({
    participants: [primary.owner._id, supplierUser._id],
    company: primary.company._id,
    supplier: supplier._id,
    rfq: rfqs[0]._id,
    subject: `${rfqs[0].rfqNumber} — ${rfqs[0].title}`,
  });

  const thread = [
    { sender: primary.owner._id, body: 'Can you confirm the pavers meet SASO 1607 and share the test certificate?' },
    { sender: supplierUser._id, body: 'Yes — all batches are SASO 1607 certified. I have attached the latest test report to our quotation.' },
    { sender: primary.owner._id, body: 'Great. Is a 7-day delivery to Jazan realistic for the full 10,000 m2?' },
    { sender: supplierUser._id, body: 'It is. We hold stock in Jazan and can start delivering within 48 hours of the PO.' },
  ];

  let last;
  for (const [i, m] of thread.entries()) {
    last = await Message.create({
      conversation: conversation._id, sender: m.sender, body: m.body,
      readBy: [m.sender], createdAt: daysAgo(2 - i * 0.4),
    });
  }
  conversation.lastMessage = { body: last.body, sender: last.sender, at: last.createdAt };
  conversation.unread = new Map([[String(primary.owner._id), 1]]);
  await conversation.save();

  await Notification.insertMany([
    {
      user: primary.owner._id, type: NOTIFICATION_TYPES.QUOTE_RECEIVED,
      title: `New quote received for ${rfqs[0].rfqNumber}`,
      body: 'BuildPro Supplies submitted a quotation.',
      link: `/buyer/rfqs/${rfqs[0]._id}/compare`, createdAt: daysAgo(0.01),
    },
    {
      user: primary.owner._id, type: NOTIFICATION_TYPES.PO_STATUS_CHANGED,
      title: 'PO-2026-0001 has been delivered',
      body: 'Order status updated to "delivered".', link: '/buyer/orders', createdAt: daysAgo(0.05),
    },
    {
      user: primary.owner._id, type: NOTIFICATION_TYPES.RFQ_PUBLISHED,
      title: `Your ${rfqs[1].rfqNumber} has been published`,
      body: 'Invitations were sent to matched suppliers.', link: '/buyer/rfqs', read: true, createdAt: daysAgo(0.15),
    },
    {
      user: supplierUser._id, type: NOTIFICATION_TYPES.RFQ_INVITATION,
      title: `New RFQ: ${rfqs[0].title}`,
      body: `${rfqs[0].rfqNumber} · delivery to Jazan.`,
      link: `/supplier/rfqs/${rfqs[0]._id}`, createdAt: daysAgo(0.2),
    },
  ]);

  logger.info('Seeded conversations and notifications');
};

const run = async () => {
  await database.connect();
  await wipe();
  await syncIndexes();

  const categoryMap = await seedCategories();
  const supplierDocs = await seedSuppliers(categoryMap);
  const buyers = await seedCompanies();

  await User.create({
    ...admin, password: DEMO_PASSWORD, role: ROLES.ADMIN, emailVerified: true,
  });

  await seedHistoricalReviews(supplierDocs, buyers);

  const { rfqs, quotesByRfq } = await seedRfqsAndQuotes(categoryMap, buyers, supplierDocs);
  await seedOrders(rfqs, quotesByRfq, buyers);
  await seedConversationsAndNotifications(buyers, supplierDocs, rfqs);

  // Refresh supplier counters on categories.
  for (const [, category] of categoryMap) {
    const count = await Supplier.countDocuments({ categories: category._id, status: VERIFICATION_STATUS.VERIFIED });
    await Category.updateOne({ _id: category._id }, { supplierCount: count });
  }

  logger.info('─'.repeat(62));
  logger.info('Seed complete. Demo accounts (password: %s)', DEMO_PASSWORD);
  logger.info('  Buyer    → buyer@procurio.sa      (Al Falah Construction Co.)');
  logger.info('  Buyer 2  → khalid@northerndev.sa  (Northern Development Group)');
  logger.info('  Supplier → supplier1@procurio.sa  (BuildPro Supplies)');
  logger.info('  Supplier → supplier2@procurio.sa  (StoneTech Manufacturing)');
  logger.info('  Pending  → pending@procurio.sa    (Desert Rock Quarries)');
  logger.info('  Admin    → admin@procurio.sa');
  logger.info('─'.repeat(62));

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
