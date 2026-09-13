import { logger } from './logger.js';
import { HttpStatus } from '../shared/types.js';

export class HttpError extends Error {
  constructor(status, statusText, body) {
    super(`HTTP Error ${status}: ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export function isTransientError(error) {
  if (error instanceof HttpError) {
    const retriableStatuses = [
      HttpStatus.TOO_MANY_REQUESTS,
      HttpStatus.INTERNAL_SERVER_ERROR,
      HttpStatus.BAD_GATEWAY,
      HttpStatus.SERVICE_UNAVAILABLE,
      HttpStatus.GATEWAY_TIMEOUT
    ];
    return retriableStatuses.includes(error.status);
  }

  const message = error && error.message ? error.message : '';
  const name = error && error.name ? error.name : '';
  const code = error && error.code ? error.code : '';
  return (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout') ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT'
  );
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function executeWithRetry(fn, maxRetries = 3, initialDelay = 1000) {
  let attempt = 1;
  while (true) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt > maxRetries || !isTransientError(error)) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
      logger.debug(`Transient error encountered: ${error.message}. Retrying attempt ${attempt + 1}/${maxRetries + 1} after ${Math.round(delay)}ms...`);
      await sleep(delay);
      attempt++;
    }
  }
}

export class TaskQueue {
  constructor(concurrency = 2) {
    this.concurrency = Math.min(3, Math.max(1, concurrency));
    this.running = 0;
    this.queue = [];
  }

  add(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this._next();
    });
  }

  _next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { taskFn, resolve, reject } = this.queue.shift();
    this.running++;

    executeWithRetry(taskFn)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      })
      .finally(() => {
        this.running--;
        this._next();
      });
  }
}
