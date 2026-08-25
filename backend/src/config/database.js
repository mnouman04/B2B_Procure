import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Singleton database connection.
 *
 * Order of preference:
 *   1. The configured MONGO_URI (local mongod or Atlas).
 *   2. An embedded MongoDB (mongodb-memory-server) whose data files live in
 *      `.mongo-data/`, so the platform runs with zero setup and still keeps
 *      its data between restarts.
 *
 * Only one process can hold the embedded data directory at a time — stop the
 * API before running `npm run seed`, or point MONGO_URI at a real server.
 */
class Database {
  static #instance;
  #connection = null;
  #embedded = null;

  static get instance() {
    if (!Database.#instance) Database.#instance = new Database();
    return Database.#instance;
  }

  get connection() { return this.#connection; }
  get isEmbedded() { return Boolean(this.#embedded); }

  async #startEmbedded() {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve(process.cwd(), '../.mongo-data');
    fs.mkdirSync(dbPath, { recursive: true });

    this.#embedded = await MongoMemoryServer.create({
      instance: { dbName: 'procurio', dbPath, storageEngine: 'wiredTiger' },
    });
    return `${this.#embedded.getUri()}procurio`;
  }

  async connect() {
    if (this.#connection) return this.#connection;
    mongoose.set('strictQuery', true);

    let uri = env.mongoUri;

    if (env.useEmbeddedDb) {
      logger.info('USE_EMBEDDED_DB=true — starting the embedded MongoDB.');
      uri = await this.#startEmbedded();
    } else {
      try {
        this.#connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      } catch (err) {
        if (env.isProd) throw err;
        logger.warn(`Could not reach MongoDB at ${uri} — ${err.message}`);
        logger.warn('Starting the embedded MongoDB instead (data persists in .mongo-data/).');
        uri = await this.#startEmbedded();
      }
    }

    if (!this.#connection) {
      this.#connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    }

    logger.info(`MongoDB connected → ${mongoose.connection.name}${this.isEmbedded ? ' (embedded)' : ''}`);
    mongoose.connection.on('error', (e) => logger.error('MongoDB error:', e.message));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    return this.#connection;
  }

  async disconnect() {
    await mongoose.disconnect();
    if (this.#embedded) await this.#embedded.stop();
    this.#connection = null;
    this.#embedded = null;
  }
}

export const database = Database.instance;
