import { notificationRepository } from '../repositories/index.js';
import { parsePagination } from '../utils/pagination.js';

/**
 * Notification facade. Listeners call `notify`/`notifyMany`; the rest of the
 * app never constructs notification documents by hand.
 */
class NotificationService {
  async notify(userId, payload) {
    if (!userId) return null;
    return notificationRepository.create({ user: userId, ...payload });
  }

  async notifyMany(userIds = [], payload) {
    const unique = [...new Set(userIds.filter(Boolean).map(String))];
    if (!unique.length) return [];
    return notificationRepository.insertMany(unique.map((user) => ({ user, ...payload })));
  }

  async list(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = { user: userId };
    if (query.unread === 'true' || query.unread === true) filter.read = false;
    const result = await notificationRepository.paginate(filter, { page, limit, skip });
    const unreadCount = await notificationRepository.unreadCount(userId);
    return { ...result, unreadCount };
  }

  unreadCount(userId) {
    return notificationRepository.unreadCount(userId);
  }

  markRead(userId, notificationId) {
    return notificationRepository.updateOne(
      { _id: notificationId, user: userId },
      { read: true, readAt: new Date() },
    );
  }

  markAllRead(userId) {
    return notificationRepository.markAllRead(userId);
  }

  remove(userId, notificationId) {
    return notificationRepository.deleteMany({ _id: notificationId, user: userId });
  }
}

export const notificationService = new NotificationService();
