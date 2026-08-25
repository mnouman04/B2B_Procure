import { eventBus, DomainEvents } from './EventBus.js';
import { notificationService } from '../services/notification.service.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { userRepository, supplierRepository } from '../repositories/index.js';
import { logger } from '../config/logger.js';

const usersOfSupplier = async (supplierId) => {
  const users = await userRepository.find({ supplier: supplierId }, { lean: true });
  return users.map((u) => u._id);
};

/** Wires every domain event to its side effects. Called once at boot. */
export const registerEventListeners = () => {
  eventBus.subscribe(DomainEvents.RFQ_PUBLISHED, async ({ rfq, invited = [] }) => {
    for (const entry of invited) {
      const recipients = await usersOfSupplier(entry.supplier);
      await notificationService.notifyMany(recipients, {
        type: NOTIFICATION_TYPES.RFQ_INVITATION,
        title: `New RFQ: ${rfq.title}`,
        body: `${rfq.rfqNumber} · delivery to ${rfq.deliveryLocation?.city}. Match score ${entry.matchScore}%.`,
        link: `/supplier/rfqs/${rfq._id}`,
        meta: { rfqId: String(rfq._id), matchScore: entry.matchScore },
      });
    }
    logger.info(`RFQ ${rfq.rfqNumber} published to ${invited.length} supplier(s)`);
  });

  eventBus.subscribe(DomainEvents.QUOTATION_SUBMITTED, async ({ quotation, rfq, supplier }) => {
    await notificationService.notify(rfq.buyer, {
      type: NOTIFICATION_TYPES.QUOTE_RECEIVED,
      title: `New quote received for ${rfq.rfqNumber}`,
      body: `${supplier?.name ?? 'A supplier'} quoted ${quotation.currency} ${quotation.totalPrice.toLocaleString()}.`,
      link: `/buyer/rfqs/${rfq._id}/compare`,
      meta: { rfqId: String(rfq._id), quotationId: String(quotation._id) },
    });
  });

  eventBus.subscribe(DomainEvents.QUOTATION_ACCEPTED, async ({ quotation, rfq }) => {
    const recipients = await usersOfSupplier(quotation.supplier);
    await notificationService.notifyMany(recipients, {
      type: NOTIFICATION_TYPES.QUOTE_ACCEPTED,
      title: `Your quote ${quotation.quoteNumber} was accepted`,
      body: `${rfq.rfqNumber} — ${rfq.title}. A purchase order is on its way.`,
      link: `/supplier/quotations/${quotation._id}`,
      meta: { quotationId: String(quotation._id) },
    });
    await supplierRepository.updateById(quotation.supplier, { $inc: { 'stats.quotesWon': 1 } });
  });

  eventBus.subscribe(DomainEvents.QUOTATION_REJECTED, async ({ quotation, reason }) => {
    const recipients = await usersOfSupplier(quotation.supplier);
    await notificationService.notifyMany(recipients, {
      type: NOTIFICATION_TYPES.QUOTE_REJECTED,
      title: `Quote ${quotation.quoteNumber} was not selected`,
      body: reason || 'The buyer selected another offer.',
      link: `/supplier/quotations/${quotation._id}`,
    });
  });

  eventBus.subscribe(DomainEvents.PO_ISSUED, async ({ po }) => {
    const recipients = await usersOfSupplier(po.supplier);
    await notificationService.notifyMany(recipients, {
      type: NOTIFICATION_TYPES.PO_ISSUED,
      title: `Purchase order ${po.poNumber} issued`,
      body: `${po.currency} ${po.total.toLocaleString()} · deliver by ${new Date(po.expectedDeliveryDate).toDateString()}.`,
      link: `/supplier/orders/${po._id}`,
      meta: { poId: String(po._id) },
    });
  });

  eventBus.subscribe(DomainEvents.PO_STATUS_CHANGED, async ({ po, status }) => {
    const supplierUsers = await usersOfSupplier(po.supplier);
    const audience = [...new Set([String(po.buyer), ...supplierUsers.map(String)])];
    await notificationService.notifyMany(audience, {
      type:
        status === 'delivered' ? NOTIFICATION_TYPES.ORDER_DELIVERED : NOTIFICATION_TYPES.PO_STATUS_CHANGED,
      title: `${po.poNumber} is now ${status}`,
      body: `Order status updated to "${status}".`,
      link: `/orders/${po._id}`,
      meta: { poId: String(po._id), status },
    });
  });

  eventBus.subscribe(DomainEvents.MESSAGE_SENT, async ({ message, recipients, senderName }) => {
    await notificationService.notifyMany(recipients, {
      type: NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      title: `New message from ${senderName}`,
      body: message.body.slice(0, 120),
      link: `/messages/${message.conversation}`,
      meta: { conversationId: String(message.conversation) },
    });
  });

  eventBus.subscribe(DomainEvents.SUPPLIER_VERIFICATION_CHANGED, async ({ supplier, status, reason }) => {
    const recipients = await usersOfSupplier(supplier._id);
    const verified = status === 'verified';
    await notificationService.notifyMany(recipients, {
      type: verified ? NOTIFICATION_TYPES.SUPPLIER_VERIFIED : NOTIFICATION_TYPES.SUPPLIER_REJECTED,
      title: verified ? 'Your company is now verified' : 'Verification needs attention',
      body: verified
        ? 'You can now receive RFQs from buying companies on the platform.'
        : reason || 'Some of your documents need to be resubmitted.',
      link: '/supplier/verification',
    });
  });

  eventBus.subscribe(DomainEvents.REVIEW_CREATED, async ({ supplier }) => {
    logger.debug(`Rating recalculated for supplier ${supplier}`);
  });

  logger.info('Domain event listeners registered');
};
