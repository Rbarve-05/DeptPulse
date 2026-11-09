import Invoice from '../models/Invoice.js'
import { sendReminderEmail } from './email.js'

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_DAYS = [1, 5, 14]
let running = false

export async function processDueReminders() {
  if (running || process.env.EMAIL_AUTOMATION_ENABLED !== 'true') return
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return
  running = true
  try {
    const invoices = await Invoice.find({ active:true, automationEnabled:true })
    for (const invoice of invoices) {
      const overdueSince = invoice.overdueSince || new Date(Date.now() - Number(invoice.days || 0) * DAY_MS)
      const overdueDays = Math.max(0, Math.floor((Date.now() - new Date(overdueSince).getTime()) / DAY_MS))
      const sentDays = new Set((invoice.remindersSent || []).map(item => item.day))
      const highestSentDay = Math.max(0, ...sentDays)
      // If a sequence is enabled late, send only its highest currently due stage.
      // Never send an older stage after a later stage has already gone out.
      const dueStage = REMINDER_DAYS.filter(day => overdueDays >= day && day > highestSentDay).at(-1)
      if (!dueStage) continue

      try {
        const emailId = await sendReminderEmail(invoice, dueStage)
        invoice.remindersSent.push({ day:dueStage, sentAt:new Date(), emailId })
        await invoice.save()
        console.log(`Reminder day ${dueStage} sent for ${invoice.id} to ${invoice.email}`)
      } catch (error) {
        console.error(`Reminder failed for ${invoice.id}:`, error.message)
      }
    }
  } finally {
    running = false
  }
}

export function startReminderScheduler() {
  // Check once at startup, then every 15 minutes. Sends only after explicit
  // per-invoice activation and an explicit EMAIL_AUTOMATION_ENABLED=true opt-in.
  processDueReminders()
  setInterval(processDueReminders, 15 * 60 * 1000).unref()
}
