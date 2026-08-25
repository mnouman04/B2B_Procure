import { EventEmitter } from 'node:events';
import { logger } from '../config/logger.js';

/**
 * Observer pattern — a singleton domain event bus.
 *
 * Services publish facts ("a quotation was submitted"); listeners decide what
 * that means (notify the buyer, bump a counter, send an email later). Neither
 * side knows about the other, so new side effects never touch business logic.
 */
export const DomainEvents = Object.freeze({
  RFQ_PUBLISHED: 'rfq.published',
  RFQ_AWARDED: 'rfq.awarded',
  RFQ_CLOSED: 'rfq.closed',
  QUOTATION_SUBMITTED: 'quotation.submitted',
  QUOTATION_ACCEPTED: 'quotation.accepted',
  QUOTATION_REJECTED: 'quotation.rejected',
  PO_ISSUED: 'po.issued',
  PO_STATUS_CHANGED: 'po.statusChanged',
  MESSAGE_SENT: 'message.sent',
  SUPPLIER_VERIFICATION_CHANGED: 'supplier.verificationChanged',
  REVIEW_CREATED: 'review.created',
});

class EventBus extends EventEmitter {
  static #instance;
  static get instance() {
    if (!EventBus.#instance) {
      EventBus.#instance = new EventBus();
      EventBus.#instance.setMaxListeners(50);
    }
    return EventBus.#instance;
  }

  /** Fire-and-forget: a failing listener must never break the request. */
  publish(event, payload) {
    logger.debug(`event → ${event}`);
    setImmediate(() => {
      try {
        this.emit(event, payload);
      } catch (err) {
        logger.error(`Listener for "${event}" threw:`, err.message);
      }
    });
  }

  subscribe(event, handler) {
    const safe = async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error(`Handler for "${event}" failed:`, err.message);
      }
    };
    this.on(event, safe);
    return () => this.off(event, safe);
  }
}

export const eventBus = EventBus.instance;
