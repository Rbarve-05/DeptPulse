import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import invoiceRoutes from './routes/invoices.js'
import Invoice from './models/Invoice.js'

const app = express()
const PORT = process.env.PORT || 5000
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (_req, res) => res.json({ status:'ok', database:mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
app.use('/api/invoices', invoiceRoutes)
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message:'Unexpected server error.' }) })

const demoInvoices = [
  { id:'INV-2049', client:'PixelCraft Cinema', email:'accounts@pixelcraftcinema.com', project:'Music Video Post-Production', amount:68000, days:14, active:true, initials:'PC', color:'from-violet-500/25 to-indigo-500/10' },
  { id:'INV-2046', client:'Apex Marketing Group', email:'finance@apexmarketinggroup.co', project:'3D Brand Animation Campaign', amount:42500, days:7, active:true, initials:'AM', color:'from-amber-500/20 to-orange-500/10' },
  { id:'INV-2044', client:'Vanguard Fashion Film Co.', email:'production@vanguardfashionfilm.co', project:'Luxury Collection Campaign Film', amount:34500, days:2, active:false, initials:'VF', color:'from-cyan-500/20 to-sky-500/10' },
]

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Add it to your .env file.')
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')
  if (await Invoice.countDocuments() === 0) { await Invoice.insertMany(demoInvoices); console.log('Inserted starter demo invoices') }
  app.listen(PORT, () => console.log(`DebtPulse API listening on http://localhost:${PORT}`))
}
start().catch(error => { console.error('Server startup failed:', error.message); process.exit(1) })
