import { env } from './env.js';

const COLORS = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', debug: '\x1b[90m', reset: '\x1b[0m' };

/** Singleton logger. Swap the sink here to plug in pino/winston without touching call sites. */
class Logger {
  static #instance;
  static get instance() {
    if (!Logger.#instance) Logger.#instance = new Logger();
    return Logger.#instance;
  }
  #write(level, args) {
    if (level === 'debug' && env.isProd) return;
    const stamp = new Date().toISOString();
    const tag = `${COLORS[level]}[${level.toUpperCase()}]${COLORS.reset}`;
    console[level === 'debug' ? 'log' : level](`${COLORS.debug}${stamp}${COLORS.reset} ${tag}`, ...args);
  }
  info(...a) { this.#write('info', a); }
  warn(...a) { this.#write('warn', a); }
  error(...a) { this.#write('error', a); }
  debug(...a) { this.#write('debug', a); }
}

export const logger = Logger.instance;
