import { asyncHandler } from '../utils/asyncHandler.js';
import { created } from '../utils/ApiResponse.js';
import { toAttachments } from '../middleware/upload.middleware.js';
import { ApiError } from '../utils/ApiError.js';

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = req.files?.length ? req.files : [];
  if (req.file) files.push(req.file);
  if (!files.length) throw ApiError.badRequest('No files were uploaded');
  return created(res, toAttachments(files), `${files.length} file(s) uploaded`);
});
