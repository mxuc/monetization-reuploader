import test from 'node:test';
import assert from 'node:assert';
import { TaskQueue, HttpError } from '../server/queue.js';
import { HttpStatus } from '../shared/types.js';

test('Task Queue and Retry Logic', async (t) => {
  await t.test('should run tasks concurrently up to concurrency limit', async () => {
    const queue = new TaskQueue(2);
    let running = 0;
    let maxRunning = 0;

    const createTask = () => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 50));
      running--;
    };

    const tasks = Array.from({ length: 5 }, () => queue.add(createTask()));
    await Promise.all(tasks);

    assert.strictEqual(maxRunning, 2, 'Should not exceed concurrency limit of 2');
  });

  await t.test('should retry on transient failures (429) and succeed', async () => {
    const queue = new TaskQueue(1);
    let attempts = 0;

    const task = async () => {
      attempts++;
      if (attempts === 1) {
        throw new HttpError(HttpStatus.TOO_MANY_REQUESTS, 'Too Many Requests', '');
      }
      return 'success';
    };

    const result = await queue.add(task);
    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 2, 'Should succeed on second attempt after retry');
  });

  await t.test('should not retry and immediately fail on non-transient failures (400)', async () => {
    const queue = new TaskQueue(1);
    let attempts = 0;

    const task = async () => {
      attempts++;
      throw new HttpError(HttpStatus.BAD_REQUEST, 'Bad Request', '');
    };

    await assert.rejects(
      async () => {
        await queue.add(task);
      },
      (err) => {
        return err instanceof HttpError && err.status === HttpStatus.BAD_REQUEST;
      }
    );

    assert.strictEqual(attempts, 1, 'Should fail immediately without retrying');
  });
});
