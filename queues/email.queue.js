import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const redisConnection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
})

export const emailQueue = new Queue('email-queue', {
  connection: redisConnection,
})

export const enqueueVerificationEmailJob = async ({ email, token }) => {
  await emailQueue.add(
    'send-verification-email',
    { email, token },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  )
}
