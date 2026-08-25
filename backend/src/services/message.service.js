import { ApiError } from '../utils/ApiError.js';
import { parsePagination } from '../utils/pagination.js';
import {
  conversationRepository, messageRepository, userRepository,
  supplierRepository, companyRepository,
} from '../repositories/index.js';
import { ROLES } from '../config/constants.js';
import { eventBus, DomainEvents } from '../events/EventBus.js';

const CONVERSATION_POPULATE = [
  { path: 'participants', select: 'firstName lastName avatar role jobTitle' },
  { path: 'supplier', select: 'name nameAr logo slug' },
  { path: 'company', select: 'name nameAr logo' },
  { path: 'rfq', select: 'rfqNumber title' },
];

/** Messages — conversations between a buying company and a supplier, saved in full. */
class MessageService {
  async startOrGet(dto, { user, companyId, supplierId }) {
    const counterpartUserId = await this.#resolveCounterpart(dto, { user });
    if (!counterpartUserId) throw ApiError.badRequest('Could not determine who to message');
    if (String(counterpartUserId) === String(user._id)) {
      throw ApiError.badRequest('You cannot start a conversation with yourself');
    }

    const participants = [user._id, counterpartUserId];
    let conversation = await conversationRepository.findBetween(participants, { rfq: dto.rfqId || null });

    if (!conversation) {
      const counterpart = await userRepository.findById(counterpartUserId);
      conversation = await conversationRepository.create({
        participants,
        rfq: dto.rfqId || null,
        purchaseOrder: dto.purchaseOrderId || null,
        subject: dto.subject || '',
        company: user.role === ROLES.BUYER ? companyId : counterpart?.company ?? null,
        supplier: user.role === ROLES.SUPPLIER ? supplierId : counterpart?.supplier ?? null,
      });
    }

    const message = await this.send(conversation._id, { body: dto.body, attachments: [] }, { user });
    return { conversation: await this.getConversation(conversation._id, user._id), message };
  }

  async send(conversationId, dto, { user }) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation');
    if (!conversation.participants.some((p) => String(p) === String(user._id))) {
      throw ApiError.forbidden('You are not part of this conversation');
    }

    const message = await messageRepository.create({
      conversation: conversation._id,
      sender: user._id,
      body: dto.body,
      attachments: dto.attachments || [],
      readBy: [user._id],
    });

    const recipients = conversation.participants.filter((p) => String(p) !== String(user._id));
    conversation.lastMessage = { body: dto.body, sender: user._id, at: message.createdAt };
    recipients.forEach((r) => {
      const key = String(r);
      conversation.unread.set(key, (conversation.unread.get(key) || 0) + 1);
    });
    await conversation.save();

    eventBus.publish(DomainEvents.MESSAGE_SENT, {
      message,
      recipients,
      senderName: `${user.firstName} ${user.lastName}`,
    });

    return message;
  }

  async listConversations(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const result = await conversationRepository.paginate(
      { participants: userId, isArchived: false },
      { page, limit, skip, sort: '-updatedAt', populate: CONVERSATION_POPULATE, lean: true },
    );
    result.items = result.items.map((c) => ({
      ...c,
      unreadCount: c.unread?.[String(userId)] ?? 0,
      counterpart: (c.participants || []).find((p) => String(p._id) !== String(userId)) ?? null,
    }));
    result.totalUnread = result.items.reduce((s, c) => s + c.unreadCount, 0);
    return result;
  }

  async getConversation(conversationId, userId) {
    const conversation = await conversationRepository.findById(conversationId, {
      populate: CONVERSATION_POPULATE,
    });
    if (!conversation) throw ApiError.notFound('Conversation');
    if (!conversation.participants.some((p) => String(p._id) === String(userId))) {
      throw ApiError.forbidden('You are not part of this conversation');
    }
    return conversation;
  }

  async listMessages(conversationId, userId, query = {}) {
    await this.getConversation(conversationId, userId);
    const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 50 });

    const result = await messageRepository.paginate(
      { conversation: conversationId },
      {
        page, limit, skip, sort: 'createdAt', lean: true,
        populate: [{ path: 'sender', select: 'firstName lastName avatar role' }],
      },
    );

    await messageRepository.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );
    await conversationRepository.updateById(conversationId, { $set: { [`unread.${userId}`]: 0 } });

    return result;
  }

  async #resolveCounterpart(dto, { user }) {
    if (dto.participantId) return dto.participantId;

    if (dto.supplierId) {
      const supplier = await supplierRepository.findById(dto.supplierId, { lean: true });
      if (!supplier) throw ApiError.notFound('Supplier');
      if (supplier.owner) return supplier.owner;
      const fallback = await userRepository.findOne({ supplier: dto.supplierId }, { lean: true });
      return fallback?._id ?? null;
    }

    if (dto.companyId) {
      const company = await companyRepository.findById(dto.companyId, { lean: true });
      if (!company) throw ApiError.notFound('Company');
      if (company.owner) return company.owner;
      const fallback = await userRepository.findOne({ company: dto.companyId }, { lean: true });
      return fallback?._id ?? null;
    }

    return null;
  }
}

export const messageService = new MessageService();
