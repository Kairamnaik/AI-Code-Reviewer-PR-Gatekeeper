import { Queue as BullQueue, Worker as BullWorker } from 'bullmq';
import Redis from 'ioredis';

let useLocalQueue = false;
let redisConnection = null;
let prQueue = null;
let prWorker = null;

// Simple in-memory fallback queue matching BullMQ behavior
class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.processors = [];
  }

  async add(jobName, data) {
    const job = {
      id: `job_${Math.random().toString(36).substring(2, 11)}`,
      name: jobName,
      data,
      attemptsMade: 0,
      timestamp: Date.now(),
      log: (msg) => console.log(`[Job ${job.id} Log] ${msg}`),
      updateProgress: (p) => console.log(`[Job ${job.id} Progress] ${p}%`)
    };

    console.log(`[InMemoryQueue] Enqueued job: ${job.id} (${jobName})`);

    // Process asynchronously in background (simulate network/db delay)
    setTimeout(async () => {
      console.log(`[InMemoryQueue] Processing job: ${job.id}`);
      for (const processor of this.processors) {
        try {
          job.attemptsMade++;
          await processor(job);
          console.log(`[InMemoryQueue] Job completed: ${job.id}`);
        } catch (err) {
          console.error(`[InMemoryQueue] Job ${job.id} failed:`, err);
          if (job.attemptsMade < 3) {
            console.log(`[InMemoryQueue] Retrying job: ${job.id} (Attempt ${job.attemptsMade + 1})`);
            // Put it back in the queue
            this.add(jobName, data);
          }
        }
      }
    }, 1000);

    return job;
  }

  process(processor) {
    this.processors.push(processor);
  }
}

export const initQueue = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL is not set. Falling back to in-memory queue.');
    useLocalQueue = true;
    prQueue = new InMemoryQueue('pr-reviews');
    return;
  }

  try {
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      connectTimeout: 3000
    });

    redisConnection.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    // Check connection by pinging
    await redisConnection.ping();
    console.log('✅ Redis Connected. Initializing BullMQ.');

    prQueue = new BullQueue('pr-reviews', { connection: redisConnection });
  } catch (err) {
    console.error('❌ Redis Initialization Failed:', err.message);
    console.warn('⚠️ Falling back to in-memory queue.');
    useLocalQueue = true;
    prQueue = new InMemoryQueue('pr-reviews');
  }
};

export const addReviewJob = async (prData) => {
  if (!prQueue) {
    throw new Error('Queue is not initialized. Call initQueue() first.');
  }

  if (useLocalQueue) {
    return await prQueue.add('review-pr', prData);
  } else {
    return await prQueue.add('review-pr', prData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
  }
};

export const registerWorker = (processor) => {
  if (useLocalQueue) {
    prQueue.process(processor);
    console.log('✅ Registered In-Memory Queue Worker.');
  } else {
    prWorker = new BullWorker('pr-reviews', async (job) => {
      return await processor(job);
    }, {
      connection: redisConnection,
      concurrency: 1
    });

    prWorker.on('completed', (job) => {
      console.log(`[BullMQ] Job completed: ${job.id}`);
    });

    prWorker.on('failed', (job, err) => {
      console.error(`[BullMQ] Job failed: ${job?.id}. Error:`, err);
    });

    console.log('✅ Registered BullMQ Worker.');
  }
};

export const isLocalQueue = () => useLocalQueue;
