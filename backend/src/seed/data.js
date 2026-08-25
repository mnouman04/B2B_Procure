import { DOCUMENT_TYPES } from '../config/constants.js';

/** Categories mirror the "Popular Categories" strip on the home page. */
export const categories = [
  {
    name: 'Construction Materials', nameAr: 'مواد البناء', icon: 'construction', order: 1,
    children: [
      { name: 'Interlock Pavers', nameAr: 'انترلوك' },
      { name: 'Ready Mix Concrete', nameAr: 'خرسانة جاهزة' },
      { name: 'Steel Rebar', nameAr: 'حديد تسليح' },
      { name: 'Cement & Aggregates', nameAr: 'أسمنت وركام' },
      { name: 'Ceramic & Tiles', nameAr: 'سيراميك وبلاط' },
      { name: 'Paints & Coatings', nameAr: 'دهانات وطلاءات' },
    ],
  },
  {
    name: 'Electrical & Electronics', nameAr: 'الكهرباء والإضاءة', icon: 'zap', order: 2,
    children: [
      { name: 'Cables & Wiring', nameAr: 'كابلات وأسلاك' },
      { name: 'Lighting Fixtures', nameAr: 'وحدات إنارة' },
      { name: 'Switchgear & Panels', nameAr: 'لوحات كهربائية' },
      { name: 'Generators', nameAr: 'مولدات' },
    ],
  },
  {
    name: 'Mechanical Equipment', nameAr: 'المعدات والآلات', icon: 'settings', order: 3,
    children: [
      { name: 'Pumps & Valves', nameAr: 'مضخات وصمامات' },
      { name: 'Compressors', nameAr: 'ضواغط' },
      { name: 'Heavy Machinery', nameAr: 'معدات ثقيلة' },
    ],
  },
  {
    name: 'Industrial Supplies', nameAr: 'التكييف والتبريد', icon: 'box', order: 4,
    children: [
      { name: 'HVAC Systems', nameAr: 'أنظمة تكييف' },
      { name: 'Chillers', nameAr: 'مبردات' },
      { name: 'PVC Pipes', nameAr: 'أنابيب PVC' },
    ],
  },
  {
    name: 'IT & Office Equipment', nameAr: 'تقنية المعلومات', icon: 'monitor', order: 5,
    children: [
      { name: 'Servers & Networking', nameAr: 'خوادم وشبكات' },
      { name: 'Office Furniture', nameAr: 'أثاث مكتبي' },
    ],
  },
  {
    name: 'Transportation & Logistics', nameAr: 'النقل واللوجستيات', icon: 'truck', order: 6,
    children: [
      { name: 'Fleet & Vehicles', nameAr: 'مركبات وأساطيل' },
      { name: 'Warehousing', nameAr: 'تخزين' },
    ],
  },
  {
    name: 'Facilities Management', nameAr: 'الخدمات المساندة', icon: 'building', order: 7,
    children: [
      { name: 'Safety Equipment', nameAr: 'أدوات السلامة' },
      { name: 'Cleaning Services', nameAr: 'خدمات نظافة' },
    ],
  },
];

const docs = (crNo) => [
  { type: DOCUMENT_TYPES.COMMERCIAL_REGISTRATION, name: 'Commercial Registration', url: '/uploads/samples/cr.pdf', number: crNo, status: 'verified' },
  { type: DOCUMENT_TYPES.VAT_CERTIFICATE, name: 'VAT Certificate', url: '/uploads/samples/vat.pdf', number: `3${crNo}00003`, status: 'verified' },
  { type: DOCUMENT_TYPES.IBAN_LETTER, name: 'IBAN Letter', url: '/uploads/samples/iban.pdf', status: 'verified' },
  { type: DOCUMENT_TYPES.ISO_CERTIFICATE, name: 'ISO 9001:2015', url: '/uploads/samples/iso.pdf', status: 'verified' },
];

/**
 * Suppliers reproduce the names, ratings and locations shown on the
 * "Top Rated Suppliers" and "Supplier Matching" screens.
 */
export const suppliers = [
  {
    name: 'BuildPro Supplies', nameAr: 'مؤسسة البناء المتقدم', crNumber: '1010234501',
    tagline: 'High-grade construction materials since 2010',
    about: 'A specialist supplier of high-quality construction materials for government and private projects since 2010. We commit to quality, specification compliance and on-time delivery.',
    aboutAr: 'مؤسسة متخصصة في توريد مواد البناء عالية الجودة للمشاريع الحكومية والخاصة منذ عام 2010. نلتزم بالجودة والالتزام بالمواصفات والمواعيد.',
    categoryPath: ['Construction Materials', 'Interlock Pavers', 'Ready Mix Concrete', 'Cement & Aggregates'],
    city: 'Jazan', coverageAreas: ['Jazan', 'Abha', 'Najran', 'Jeddah'],
    rating: 4.8, ratingCount: 126, onTime: 98, compliance: 100, priceIndex: 92,
    leadTime: 7, employees: 150, projects: 350, founded: 2010, featured: true,
    documents: docs('1010234501'),
    certifications: [{ name: 'ISO 9001:2015', issuer: 'SGS', year: 2021 }, { name: 'Saudi Building Code', issuer: 'SBC', year: 2022 }],
    pastProjects: [
      { name: 'Jazan Waterfront Development', client: 'Jazan Municipality', year: 2023, value: 4_200_000 },
      { name: 'King Abdullah Economic City Roads', client: 'KAEC', year: 2022, value: 2_800_000 },
    ],
    products: [
      { name: 'Interlock Paver 8cm Grey', category: 'Interlock Pavers', unit: 'm2', priceFrom: 16, priceTo: 22, lead: 7 },
      { name: 'Ready Mix Concrete C40', category: 'Ready Mix Concrete', unit: 'm3', priceFrom: 280, priceTo: 340, lead: 3 },
      { name: 'Portland Cement Type I', category: 'Cement & Aggregates', unit: 'ton', priceFrom: 240, priceTo: 280, lead: 5 },
    ],
  },
  {
    name: 'StoneTech Manufacturing', nameAr: 'أسمنت الجنوب', crNumber: '4030198722',
    tagline: 'Precast and paving solutions at industrial scale',
    about: 'Industrial manufacturer of precast concrete, kerbstones and paving systems serving the western region.',
    categoryPath: ['Construction Materials', 'Interlock Pavers', 'Cement & Aggregates'],
    city: 'Jeddah', coverageAreas: ['Jeddah', 'Makkah', 'Taif', 'Jazan'],
    rating: 4.6, ratingCount: 89, onTime: 95, compliance: 95, priceIndex: 104,
    leadTime: 10, employees: 320, projects: 210, founded: 2005,
    documents: docs('4030198722'),
    certifications: [{ name: 'ISO 14001', issuer: 'BV', year: 2020 }],
    products: [
      { name: 'Interlock Paver 8cm Multi-colour', category: 'Interlock Pavers', unit: 'm2', priceFrom: 18, priceTo: 26, lead: 10 },
      { name: 'Precast Kerbstone', category: 'Cement & Aggregates', unit: 'm', priceFrom: 32, priceTo: 45, lead: 12 },
    ],
  },
  {
    name: 'Interlock Experts Co.', nameAr: 'الوطنية للمقاولات', crNumber: '1010556677',
    tagline: 'Paving specialists for large-scale infrastructure',
    about: 'Dedicated interlock and hardscape contractor with a nationwide installation crew.',
    categoryPath: ['Construction Materials', 'Interlock Pavers'],
    city: 'Riyadh', coverageAreas: ['Riyadh', 'Buraidah', 'Hail', 'Jazan'],
    rating: 4.7, ratingCount: 74, onTime: 93, compliance: 98, priceIndex: 99,
    leadTime: 8, employees: 210, projects: 180, founded: 2012,
    documents: docs('1010556677'),
    products: [
      { name: 'Interlock Paver 8cm Heavy Duty', category: 'Interlock Pavers', unit: 'm2', priceFrom: 17, priceTo: 24, lead: 8 },
    ],
  },
  {
    name: 'ElectroGear Co.', nameAr: 'إنارة الشرق', crNumber: '2050334455',
    tagline: 'Electrical distribution and lighting systems',
    about: 'Authorised distributor for leading electrical brands, covering the Eastern Province and beyond.',
    categoryPath: ['Electrical & Electronics', 'Cables & Wiring', 'Lighting Fixtures', 'Switchgear & Panels'],
    city: 'Riyadh', coverageAreas: ['Riyadh', 'Dammam', 'Khobar', 'Jubail'],
    rating: 4.7, ratingCount: 98, onTime: 96, compliance: 97, priceIndex: 96,
    leadTime: 12, employees: 180, projects: 260, founded: 2008, featured: true,
    documents: docs('2050334455'),
    certifications: [{ name: 'SASO Certified', issuer: 'SASO', year: 2023 }],
    products: [
      { name: 'XLPE Power Cable 4x95mm', category: 'Cables & Wiring', unit: 'm', priceFrom: 95, priceTo: 130, lead: 14 },
      { name: 'LED High Bay 150W', category: 'Lighting Fixtures', unit: 'pcs', priceFrom: 210, priceTo: 320, lead: 10 },
    ],
  },
  {
    name: 'MechLine Solutions', nameAr: 'آلات المستقبل', crNumber: '3070445566',
    tagline: 'Pumps, valves and rotating equipment',
    about: 'Supplier and service partner for industrial pumps, valves and compressors.',
    categoryPath: ['Mechanical Equipment', 'Pumps & Valves', 'Compressors', 'Heavy Machinery'],
    city: 'Dammam', coverageAreas: ['Dammam', 'Khobar', 'Jubail', 'Riyadh'],
    rating: 4.9, ratingCount: 74, onTime: 97, compliance: 99, priceIndex: 108,
    leadTime: 18, employees: 240, projects: 320, founded: 2003, featured: true,
    documents: docs('3070445566'),
    products: [
      { name: 'Centrifugal Pump 200 m3/h', category: 'Pumps & Valves', unit: 'pcs', priceFrom: 18_000, priceTo: 26_000, lead: 21 },
    ],
  },
  {
    name: 'SupplyMax Global', nameAr: 'تبريد الخليج', crNumber: '4030778899',
    tagline: 'HVAC, chillers and industrial supplies',
    about: 'End-to-end HVAC supply and installation for commercial and industrial facilities.',
    categoryPath: ['Industrial Supplies', 'HVAC Systems', 'Chillers', 'PVC Pipes'],
    city: 'Jeddah', coverageAreas: ['Jeddah', 'Makkah', 'Riyadh', 'Yanbu'],
    rating: 4.8, ratingCount: 112, onTime: 94, compliance: 96, priceIndex: 101,
    leadTime: 15, employees: 190, projects: 240, founded: 2011,
    documents: docs('4030778899'),
    products: [
      { name: 'Air-Cooled Chiller 200 TR', category: 'Chillers', unit: 'pcs', priceFrom: 320_000, priceTo: 420_000, lead: 45 },
      { name: 'PVC Pipe 200mm PN10', category: 'PVC Pipes', unit: 'm', priceFrom: 78, priceTo: 96, lead: 7 },
    ],
  },
  {
    name: 'SafeGuard Industrial', nameAr: 'الحارس الصناعي', crNumber: '1010889900',
    tagline: 'Certified safety and PPE supplier',
    about: 'PPE, fire protection and site safety equipment with full certification traceability.',
    categoryPath: ['Facilities Management', 'Safety Equipment'],
    city: 'Riyadh', coverageAreas: ['All'],
    rating: 4.5, ratingCount: 63, onTime: 92, compliance: 94, priceIndex: 95,
    leadTime: 9, employees: 90, projects: 140, founded: 2015,
    documents: docs('1010889900'),
    products: [
      { name: 'Safety Helmet Class E', category: 'Safety Equipment', unit: 'pcs', priceFrom: 38, priceTo: 55, lead: 5 },
    ],
  },
  {
    name: 'TransFleet Logistics', nameAr: 'النقل السريع', crNumber: '2050991122',
    tagline: 'Heavy haulage and site logistics',
    about: 'Fleet and logistics partner for construction and industrial projects nationwide.',
    categoryPath: ['Transportation & Logistics', 'Fleet & Vehicles', 'Warehousing'],
    city: 'Dammam', coverageAreas: ['All'],
    rating: 4.4, ratingCount: 51, onTime: 90, compliance: 92, priceIndex: 98,
    leadTime: 4, employees: 130, projects: 190, founded: 2014,
    documents: docs('2050991122'),
    products: [],
  },
  {
    name: 'NetCore Systems', nameAr: 'نت كور', crNumber: '1010223344',
    tagline: 'Enterprise IT infrastructure',
    about: 'Servers, networking and workplace IT for enterprise procurement.',
    categoryPath: ['IT & Office Equipment', 'Servers & Networking', 'Office Furniture'],
    city: 'Riyadh', coverageAreas: ['Riyadh', 'Jeddah', 'Dammam'],
    rating: 4.6, ratingCount: 44, onTime: 95, compliance: 97, priceIndex: 103,
    leadTime: 20, employees: 75, projects: 95, founded: 2016,
    documents: docs('1010223344'),
    products: [],
  },
  {
    name: 'Gulf Rebar Industries', nameAr: 'حديد الخليج', crNumber: '2050667788',
    tagline: 'Steel rebar and structural steel',
    about: 'Rolling mill and rebar fabricator supplying major contractors.',
    categoryPath: ['Construction Materials', 'Steel Rebar'],
    city: 'Jubail', coverageAreas: ['All'],
    rating: 4.7, ratingCount: 158, onTime: 96, compliance: 99, priceIndex: 94,
    leadTime: 11, employees: 480, projects: 420, founded: 2001,
    documents: docs('2050667788'),
    products: [
      { name: 'Deformed Steel Bar 16mm B500B', category: 'Steel Rebar', unit: 'ton', priceFrom: 2_650, priceTo: 2_950, lead: 11 },
    ],
  },
];

/** Buying companies. Al Falah Construction is the one shown in the mockups. */
export const companies = [
  {
    name: 'Al Falah Construction Co.', nameAr: 'شركة الفلاح للمقاولات', crNumber: '1010111222',
    sector: 'Construction', size: '501-1000', city: 'Riyadh',
    owner: {
      firstName: 'Ahmed', lastName: 'Al Otaibi', email: 'buyer@procurio.sa',
      phone: '+966501234567', jobTitle: 'Procurement Manager',
    },
    team: [
      { firstName: 'Sara', lastName: 'Al Harbi', email: 'sara@procurio.sa', jobTitle: 'Procurement Specialist' },
    ],
  },
  {
    name: 'Northern Development Group', nameAr: 'مجموعة التطوير الشمالية', crNumber: '1010333444',
    sector: 'Real Estate', size: '201-500', city: 'Jeddah',
    owner: {
      firstName: 'Khalid', lastName: 'Al Zahrani', email: 'khalid@northerndev.sa',
      phone: '+966555556677', jobTitle: 'Supply Chain Manager',
    },
    team: [],
  },
];

export const admin = {
  firstName: 'Platform', lastName: 'Admin', email: 'admin@procurio.sa',
  phone: '+966500000000', jobTitle: 'Platform Administrator',
};

export const DEMO_PASSWORD = 'Procurio2026';
