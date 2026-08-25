import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const bool = (v, fallback = false) =>
  v === undefined ? fallback : ['true', '1', 'yes'].includes(String(v).toLowerCase());
const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v));

/**
 * Single, validated source of truth for configuration.
 * Nothing else in the codebase reads `process.env` directly.
 */
export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/procurio',
  useEmbeddedDb: bool(process.env.USE_EMBEDDED_DB, false),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '1d',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
  },
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 10),

  uploadDir: process.env.UPLOAD_DIR || 'src/uploads',
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 10),

  vatRate: num(process.env.VAT_RATE, 0.15),
  currency: process.env.DEFAULT_CURRENCY || 'SAR',
  commissionRate: num(process.env.PLATFORM_COMMISSION_RATE, 0.02),
});
