import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { notificationService } from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, total, page, limit, unreadCount } = await notificationService.list(req.user._id, req.query);
  // The bell badge needs `unreadCount`, so this endpoint extends the standard
  // pagination envelope rather than using `paginated()` directly.
  return res.status(200).json({
    success: true,
    message: 'OK',
    data: items,
    meta: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
      unreadCount,
    },
  });
});

export const unreadCount = asyncHandler(async (req, res) =>
  ok(res, { count: await notificationService.unreadCount(req.user._id) }));

export const markRead = asyncHandler(async (req, res) =>
  ok(res, await notificationService.markRead(req.user._id, req.params.id), 'Marked as read'));

export const markAllRead = asyncHandler(async (req, res) =>
  ok(res, await notificationService.markAllRead(req.user._id), 'All notifications marked as read'));

export const remove = asyncHandler(async (req, res) =>
  ok(res, await notificationService.remove(req.user._id, req.params.id), 'Notification removed'));
