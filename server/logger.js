let isDebugEnabled = false;

export const logger = {
  init(debug) {
    isDebugEnabled = !!debug;
  },

  log(...args) {
    console.log(...args);
  },

  success(msg) {
    console.log(`✔ Success: ${msg}`);
  },

  failed(msg, reason) {
    const suffix = reason ? ` (Reason: ${reason})` : '';
    console.log(`✖ Failed: ${msg}${suffix}`);
  },

  debug(...args) {
    if (isDebugEnabled) {
      console.log('[DEBUG]', ...args);
    }
  },

  debugHttp({ method, url, headers, payload, status, responseBody, attempt }) {
    if (!isDebugEnabled) return;

    console.log('\n--- HTTP REQUEST ---');
    console.log(`${method} ${url}`);
    if (attempt && attempt > 1) {
      console.log(`Attempt: ${attempt}`);
    }
    if (headers) {
      console.log('Headers:', JSON.stringify(headers, null, 2));
    }
    if (payload) {
      console.log('Payload:', typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
    }
    console.log('--- HTTP RESPONSE ---');
    if (status !== undefined) {
      console.log(`Status Code: ${status}`);
    }
    if (responseBody !== undefined) {
      console.log(`Raw Response Body:\n${responseBody}`);
    }
    console.log('--------------------\n');
  }
};
