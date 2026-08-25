import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { messageService } from '../services/message.service.js';

const ctx = (req) => ({ user: req.user, companyId: req.companyId, supplierId: req.supplierId });

export const start = asyncHandler(async (req, res) =>
  created(res, await messageService.startOrGet(req.body, ctx(req)), 'Message sent'));

export const listConversations = asyncHandler(async (req, res) => {
  const { items, total, page, limit, totalUnread } =
    await messageService.listConversations(req.user._id, req.query);
  // `totalUnread` drives the sidebar badge, so it rides along in the meta.
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
      totalUnread,
    },
  });
});

export const getConversation = asyncHandler(async (req, res) =>
  ok(res, await messageService.getConversation(req.params.id, req.user._id)));

export const listMessages = asyncHandler(async (req, res) =>
  paginated(res, await messageService.listMessages(req.params.id, req.user._id, req.query)));

export const send = asyncHandler(async (req, res) =>
  created(res, await messageService.send(req.params.id, req.body, ctx(req)), 'Message sent'));
