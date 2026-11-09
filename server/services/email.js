const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[char]))

const templates = {
  1: {
    subject: 'A quick note about your outstanding invoice',
    message: (client, invoice) => `Hi ${client},\n\nHope you're doing well. Just a friendly nudge that invoice ${invoice} is still showing as outstanding on our end.\n\nIf payment has already been arranged, please disregard this note. Otherwise, we'd really appreciate an update on the expected payment date.\n\nThanks so much for working with us.\n\nWarmly,\nThe Studio Team`,
  },
  5: {
    subject: 'Following up — payment update requested',
    message: (client, invoice) => `Hi ${client},\n\nWe're following up again regarding outstanding invoice ${invoice}. As it is now past the agreed payment date, could you please confirm when we can expect settlement?\n\nIf anything is holding this up, let us know and we'll be happy to help resolve it.\n\nWe value the partnership and appreciate your prompt attention.\n\nBest,\nThe Studio Team`,
  },
  14: {
    subject: 'Final notice — outstanding invoice requires attention',
    message: (client, invoice) => `Hi ${client},\n\nDespite our previous reminders, invoice ${invoice} remains unpaid. Please arrange payment within 3 business days or contact us immediately to agree on a resolution.\n\nIf payment has been made, please share the remittance confirmation so we can update our records.\n\nRegards,\nThe Studio Team`,
  },
}

export async function sendReminderEmail(invoice, day) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) throw new Error('Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.')
  const template = templates[day]
  if (!template) throw new Error(`Unsupported reminder day: ${day}`)

  const invoiceLabel = `#${String(invoice.id).replace(/^INV-/, '')} — ₹${Number(invoice.amount).toLocaleString('en-IN')}`
  const message = template.message(invoice.client, invoiceLabel)
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#202124;white-space:pre-line">${escapeHtml(message)}</div>`

  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ from, to:[invoice.email], subject:template.subject, text:message, html }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || `Resend request failed with status ${response.status}`)
  return result.id || ''
}
