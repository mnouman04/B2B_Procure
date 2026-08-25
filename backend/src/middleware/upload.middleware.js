import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const root = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(root, { recursive: true });

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const bucket = req.uploadBucket || 'general';
    const dir = path.join(root, bucket);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    return cb(null, true);
  },
});

/** Chooses the sub-folder files land in, e.g. `bucket('verification')`. */
export const bucket = (name) => (req, _res, next) => {
  req.uploadBucket = name;
  next();
};

/** Maps multer files into the attachment shape stored on documents. */
export const toAttachments = (files = []) =>
  files.map((f) => ({
    name: f.originalname,
    url: `/uploads/${path.relative(root, f.path).split(path.sep).join('/')}`,
    size: f.size,
    mimeType: f.mimetype,
  }));
