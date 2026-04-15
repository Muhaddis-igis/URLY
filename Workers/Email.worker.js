import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { sendEmail } from '../lib/Send-mail.js'

const redisConnection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
})

const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    if (job.name !== 'send-verification-email') {
      return
    }

    const { email, token } = job.data
    const baseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, '')
    const verificationUrl = `${baseUrl}/verify-email/${encodeURIComponent(token)}`

    await sendEmail({
      to: email,
      subject: 'Verify your URLly email',
      html: `
        <h1>Verify your email</h1>
        <p>Click the link below to verify your account.</p>
        <p><a href="${verificationUrl}">Verify Email</a></p>
      `,
    })
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
)

emailWorker.on('completed', (job) => {
  console.log(`[email-worker] Completed job ${job.id} (${job.name})`)
})

emailWorker.on('failed', (job, err) => {
  const jobId = job?.id || 'unknown'
  const jobName = job?.name || 'unknown'
  console.error(`[email-worker] Failed job ${jobId} (${jobName}):`, err.message)
})

export default emailWorker