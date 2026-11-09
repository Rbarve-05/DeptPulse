import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Command, Download, FileText, Filter, Mail, MoreHorizontal,
  Plus, Search, Send, ShieldCheck, Sparkles, X, Zap, CalendarClock, CircleDollarSign,
  TrendingUp, AlertTriangle, CheckCircle2, Copy, ExternalLink
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const money = n => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n)
const stages = [
  { day:1, name:'The Gentle Nudge', short:'Gentle nudge', tone:'emerald', subject:'A quick note about your outstanding invoice', body:(name, amount) => `Hi ${name},\n\nHope you're doing well. Just a friendly nudge that invoice ${amount} is still showing as outstanding on our end.\n\nIf payment has already been arranged, please disregard this note. Otherwise, we'd really appreciate an update on the expected payment date.\n\nThanks so much for working with us.\n\nWarmly,\nThe Studio Team` },
  { day:5, name:'The Firm Reminder', short:'Firm reminder', tone:'amber', subject:'Following up — payment update requested', body:(name, amount) => `Hi ${name},\n\nWe're following up again regarding the outstanding invoice of ${amount}. As it is now past the agreed payment date, could you please confirm when we can expect settlement?\n\nIf there is anything holding this up on your side, let us know and we'll be happy to help resolve it.\n\nWe value the partnership and appreciate your prompt attention.\n\nBest,\nThe Studio Team` },
  { day:14, name:'The Final Notice', short:'Final notice', tone:'red', subject:'Final notice — outstanding invoice requires attention', body:(name, amount) => `Hi ${name},\n\nDespite our previous reminders, invoice ${amount} remains unpaid. Please arrange payment within 3 business days or contact us immediately to agree on a resolution.\n\nIf payment has been made, please share the remittance confirmation so we can update our records.\n\nWe hope to close this out promptly and continue our work together on good terms.\n\nRegards,\nThe Studio Team` },
]

function StagePill({days}) {
  const stage = days >= 14 ? stages[2] : days >= 5 ? stages[1] : stages[0]
  const cls = stage.tone === 'red' ? 'bg-rose-500/10 text-rose-300 ring-rose-500/20' : stage.tone === 'amber' ? 'bg-amber-500/10 text-amber-300 ring-amber-500/20' : 'bg-sky-500/10 text-sky-300 ring-sky-500/20'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current"/>{`Day ${days}: ${stage.short}`}</span>
}

function StatCard({label,value,detail,icon:Icon,accent='emerald',trend}) {
  const colors = { emerald:'text-emerald-400 bg-emerald-400/10', amber:'text-amber-400 bg-amber-400/10', rose:'text-rose-400 bg-rose-400/10', zinc:'text-zinc-300 bg-zinc-700/40' }
  return <div className="panel rounded-2xl p-5 transition hover:border-zinc-600/80">
    <div className="flex items-center justify-between"><span className="text-[12px] font-medium tracking-wide text-zinc-400">{label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[accent]}`}><Icon size={17}/></span></div>
    <div className="mt-4 flex items-end justify-between gap-2"><div className="font-display text-[27px] font-semibold tracking-tight text-zinc-100">{value}</div>{trend && <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-emerald-400"><ArrowDownRight size={13}/>{trend}</span>}</div>
    {label === 'TOTAL OUTSTANDING BALANCE' ? <><svg viewBox="0 0 260 34" className="mt-3 h-8 w-full overflow-visible" preserveAspectRatio="none" aria-label="30 day outstanding balance trend"><defs><linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity=".22"/><stop offset="100%" stopColor="#34d399" stopOpacity="0"/></linearGradient></defs><path d="M0 27 C12 26 14 18 27 20 S45 27 57 17 S75 14 87 18 S105 10 117 13 S135 21 147 12 S164 9 177 13 S195 5 207 9 S230 6 260 2 L260 34 L0 34Z" fill="url(#sparkFill)"/><path d="M0 27 C12 26 14 18 27 20 S45 27 57 17 S75 14 87 18 S105 10 117 13 S135 21 147 12 S164 9 177 13 S195 5 207 9 S230 6 260 2" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke"/></svg><p className="mt-1 text-[10px] text-zinc-500">{detail} <span className="text-zinc-700">·</span> 30-day trend</p></> : <p className="mt-1.5 text-[11px] text-zinc-500">{detail}</p>}
  </div>
}

function App() {
  const [invoices,setInvoices] = useState([])
  const [selectedId,setSelectedId] = useState(null)
  const [loading,setLoading] = useState(true)
  const [apiError,setApiError] = useState('')
  const [tab,setTab] = useState(0)
  const [modal,setModal] = useState(false)
  const [toast,setToast] = useState('')
  const [search,setSearch] = useState('')
  const [filter,setFilter] = useState('all')
  const [form,setForm] = useState({client:'',email:'',amount:'',days:''})
  const [copied,setCopied] = useState(false)
  const selected = invoices.find(x=>x.id===selectedId) || invoices[0] || null
  const total = invoices.reduce((s,x)=>s+x.amount,0)
  const overdue = invoices.length
  const avg = invoices.length ? Math.round(invoices.reduce((s,x)=>s+x.days,0)/invoices.length) : 0
  const filtered = useMemo(()=>invoices.filter(x=>(x.client.toLowerCase().includes(search.toLowerCase()) || x.id.toLowerCase().includes(search.toLowerCase())) && (filter==='all' || (filter==='active'?x.active:!x.active))),[invoices,search,filter])
  const currentStage = stages[tab]
  const emailBody = selected ? currentStage.body(selected.client,money(selected.amount)).replace(/invoice /i, `invoice #${selected.id.replace('INV-','')} `) : ''
  const notify = msg => { setToast(msg); window.clearTimeout(window.__debtToast); window.__debtToast = window.setTimeout(()=>setToast(''),3800) }

  useEffect(() => {
    let cancelled = false
    async function loadInvoices() {
      try {
        const response = await fetch(`${API_URL}/invoices`)
        if (!response.ok) throw new Error('Could not load invoices from the server.')
        const data = await response.json()
        if (!cancelled) { setInvoices(data); setSelectedId(data[0]?.id || null); setApiError('') }
      } catch (error) { if (!cancelled) setApiError(error.message || 'Unable to connect to the DebtPulse API.') }
      finally { if (!cancelled) setLoading(false) }
    }
    loadInvoices()
    return () => { cancelled = true }
  }, [])

  async function addInvoice(e) {
    e.preventDefault()
    setApiError('')
    try {
      const response = await fetch(`${API_URL}/invoices`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ client:form.client.trim(), email:form.email.trim(), amount:Number(form.amount), days:Number(form.days), project:'New creative production project' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not save this invoice.')
      setInvoices(old=>[data,...old]); setSelectedId(data.id); setTab(0); setModal(false); setForm({client:'',email:'',amount:'',days:''})
      notify('Invoice saved to your database. Your chase sequence is ready to review.')
    } catch (error) { setApiError(error.message || 'Unable to save invoice.') }
  }
  async function activate() {
    if (!selected) return
    try {
      const response = await fetch(`${API_URL}/invoices/${selected.id}/activate`, { method:'PATCH' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Could not activate sequence.')
      setInvoices(old=>old.map(x=>x.id===data.id?data:x))
      notify('Sequence status saved. Automated email delivery is not connected yet.')
    } catch (error) { setApiError(error.message || 'Unable to update sequence.') }
  }
  function copyEmail() {
    navigator.clipboard?.writeText(`Subject: ${currentStage.subject}\n\n${emailBody}`)
    setCopied(true); window.setTimeout(()=>setCopied(false),1800)
  }

  return <div className="min-h-screen bg-[#09090b] text-zinc-100">
    <div className="pointer-events-none fixed inset-0 grid-glow opacity-[.18] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"/>
    <div className="relative mx-auto max-w-[1440px] px-4 pb-12 sm:px-7 lg:px-10">
      <header className="flex h-[76px] items-center justify-between border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-zinc-950 shadow-[0_0_28px_rgba(52,211,153,.2)]"><Activity size={20} strokeWidth={2.7}/></div>
          <div><div className="font-display text-[17px] font-bold tracking-tight">DebtPulse<span className="text-emerald-400">.</span></div><div className="text-[9px] font-semibold tracking-[.06em] text-zinc-500">Automated Accounts Receivable for Creative Studios</div></div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[11px] text-zinc-400 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"/> Workspace live <span className="mx-1 text-zinc-700">·</span> Demo mode</div>
        <div className="flex items-center gap-3"><button className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-800"><Bell size={16}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400"/></button><div className="grid h-9 w-9 place-items-center rounded-full border border-zinc-700 bg-gradient-to-br from-zinc-600 to-zinc-800 text-[11px] font-bold">ST</div></div>
      </header>

      <main className="pt-9">
        {apiError && <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[.07] px-4 py-3 text-[11px] text-rose-200"><span>{apiError} Check that the API server is running and MongoDB is connected.</span><button onClick={()=>setApiError('')} aria-label="Dismiss error"><X size={14}/></button></div>}
        {loading && <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-[11px] text-zinc-400">Loading invoices from your database…</div>}
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-400"><span className="h-px w-5 bg-emerald-400"/> Monday, 09 November 2026</div><div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-[32px] font-semibold tracking-[-.04em] text-white sm:text-[38px]">Good afternoon, Studio team<span className="text-emerald-400">.</span></h1><span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[.07] px-3 py-1.5 text-[10px] font-medium text-emerald-300"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50"/><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"/></span>System Status: Active Monitoring <span className="text-emerald-700">·</span> 4 webhooks connected</span></div><p className="mt-1.5 text-sm text-zinc-500">A clear view of what’s owed, what’s overdue, and what happens next.</p></div>
          <button onClick={()=>setModal(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-[12px] font-bold text-zinc-950 shadow-[0_8px_28px_rgba(52,211,153,.13)] transition hover:bg-emerald-300 active:scale-[.98]"><Plus size={16} strokeWidth={2.5}/> Add new late invoice</button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="TOTAL OUTSTANDING BALANCE" value={money(total)} detail="Across all tracked overdue invoices" icon={CircleDollarSign} accent="emerald" trend="8.2%"/>
          <StatCard label="OVERDUE INVOICES" value={`${overdue.toString().padStart(2,'0')} invoices`} detail="Active and pending chase sequences" icon={AlertTriangle} accent="amber"/>
          <StatCard label="AVG. DAYS DELINQUENT" value={`${avg} days`} detail="Average time past the due date" icon={Clock3} accent="zinc"/>
        </section>

        <section className="mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,.92fr)]">
          <div className="panel overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-4 border-b border-zinc-800/80 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2"><h2 className="font-display text-[16px] font-semibold">The chase queue</h2><span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">{invoices.length}</span></div><p className="mt-1 text-[11px] text-zinc-500">Every outstanding conversation, in one place.</p></div>
              <button onClick={()=>setFilter(filter==='all'?'active':filter==='active'?'pending':'all')} className="inline-flex items-center gap-2 self-start rounded-lg border border-zinc-700/80 px-3 py-2 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800 sm:self-auto"><Filter size={13}/>{filter==='all'?'All invoices':filter==='active'?'Active sequences':'Pending'}<ChevronDown size={13}/></button>
            </div>
            <div className="border-b border-zinc-800/70 px-5 py-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients or invoice ID..." className="w-full bg-transparent py-1 pl-8 text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/></div></div>
            <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(100px,.7fr)_minmax(130px,1fr)_32px] gap-3 px-5 py-3 text-[9px] font-bold uppercase tracking-[.15em] text-zinc-600 sm:grid"><span>Client / invoice</span><span>Amount</span><span>Escalation status</span><span/></div>
            <div className="divide-y divide-zinc-800/70">
              {filtered.map(item=><button key={item.id} onClick={()=>{setSelectedId(item.id);setTab(0)}} className={`group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left transition hover:bg-zinc-800/35 sm:grid-cols-[minmax(0,1.3fr)_minmax(100px,.7fr)_minmax(130px,1fr)_32px] ${selectedId===item.id?'bg-emerald-400/[.045]':''}`}>
                <div className="flex min-w-0 items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.color} text-[11px] font-bold text-zinc-200 ring-1 ring-white/5`}>{item.initials}</div><div className="min-w-0"><div className="truncate text-[12px] font-semibold text-zinc-200">{item.client}</div><div className="mt-1 truncate text-[10px] text-zinc-500">{item.project || 'Creative production'} <span className="px-1 text-zinc-700">·</span> <span className="text-zinc-600">{item.id}</span></div></div></div>
                <div className="text-right sm:text-left"><div className="text-[12px] font-semibold tabular-nums text-zinc-200">{money(item.amount)}</div><div className="mt-1 text-[10px] text-zinc-600 sm:hidden">Amount due</div></div>
                <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:block"><StagePill days={item.days}/><span className={`mt-1.5 block text-[10px] ${item.active?'text-emerald-500':'text-zinc-600'}`}>{item.active?'● Sequence active':'○ Awaiting activation'}</span></div>
                <ChevronRight size={15} className="hidden text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400 sm:block"/>
              </button>)}
              {!loading && filtered.length===0&&<div className="px-5 py-12 text-center text-xs text-zinc-500">No invoices match your search.</div>}
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800/70 px-5 py-3"><span className="text-[10px] text-zinc-600">Showing {filtered.length} of {invoices.length} invoices</span><span className="flex items-center gap-1 text-[10px] text-zinc-600"><ShieldCheck size={12} className="text-emerald-500"/> Persisted in MongoDB</span></div>
          </div>

          <div className="panel overflow-hidden rounded-2xl">
            <div className="flex items-start justify-between border-b border-zinc-800/80 p-5">
              <div><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-emerald-400"><Sparkles size={13}/> Smart follow-up studio</div><h2 className="mt-2 font-display text-[17px] font-semibold">Escalation plan</h2><p className="mt-1 text-[11px] text-zinc-500">Personalized emails, ready when you are.</p></div>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[.06] px-2.5 py-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/><span className="text-[9px] font-semibold text-emerald-300">Database connected</span></div>
            </div>
            {selected ? <>
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 bg-zinc-900/40 px-5 py-3"><div className="min-w-0"><div className="truncate text-[12px] font-semibold">{selected.client}</div><div className="mt-0.5 truncate text-[10px] text-zinc-500">{selected.email}</div></div><div className="shrink-0 text-right"><div className="text-[13px] font-bold tabular-nums">{money(selected.amount)}</div><div className="text-[9px] text-zinc-500">Outstanding</div></div></div>
              <div className="grid grid-cols-3 gap-2 px-5 pt-4">
                {stages.map((s,i)=><button key={s.day} onClick={()=>setTab(i)} className={`rounded-xl border px-2 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800/70 ${tab===i?(i===0?'border-emerald-400/60 bg-emerald-400/[.10] shadow-[inset_0_0_0_1px_rgba(52,211,153,.08)]':i===1?'border-amber-400/60 bg-amber-400/[.08] shadow-[inset_0_0_0_1px_rgba(251,191,36,.08)]':'border-rose-400/60 bg-rose-400/[.08] shadow-[inset_0_0_0_1px_rgba(251,113,133,.08)]'):'border-zinc-800 bg-zinc-900/40 hover:border-zinc-600'}`} ><div className={`mb-2 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${tab===i?'bg-emerald-400 text-zinc-950':'bg-zinc-800 text-zinc-400'}`}>{i+1}</div><div className={`text-[10px] font-semibold ${tab===i?(i===0?'text-emerald-300':i===1?'text-amber-300':'text-rose-300'):'text-zinc-200'}`}>Step {i+1}</div><div className="mt-0.5 text-[9px] text-zinc-500">Day {s.day}</div></button>)}
              </div>
              <div className="px-5 pb-5 pt-4">
                <div className="mb-3 flex items-center justify-between"><div><div className="text-[12px] font-semibold text-zinc-200">{currentStage.name}</div><div className="mt-0.5 text-[10px] text-zinc-500">Send {currentStage.day} day{currentStage.day>1?'s':''} after due date</div></div><span className={`rounded-md px-2 py-1 text-[9px] font-semibold ${tab===0?'bg-emerald-500/10 text-emerald-300':tab===1?'bg-amber-500/10 text-amber-300':'bg-rose-500/10 text-rose-300'}`}>EMAIL TEMPLATE</span></div>
                <div className="rounded-xl border border-zinc-800 bg-[#0d0d10]">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-3.5 py-3"><div className="flex min-w-0 items-center gap-2 text-[10px] text-zinc-500"><Mail size={13}/><span className="truncate">To: {selected.email}</span></div><button onClick={copyEmail} className="flex shrink-0 items-center gap-1 text-[10px] text-zinc-500 hover:text-emerald-400">{copied?<Check size={12}/>:<Copy size={12}/>} {copied?'Copied':'Copy'}</button></div>
                  <div className="px-3.5 py-3"><div className="text-[10px] font-semibold text-zinc-300">Subject: <span className="font-normal text-zinc-400">{tab===0?`Quick heads-up regarding invoice #${selected.id.replace('INV-','')} for ${selected.client}`:currentStage.subject}</span></div><pre className="mt-3 whitespace-pre-wrap font-sans text-[10.5px] leading-[1.75] text-zinc-400">{emailBody}</pre></div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-3"><CalendarClock size={14} className="mt-0.5 shrink-0 text-emerald-400"/><p className="text-[10px] leading-relaxed text-zinc-500">Sequence timing is based on the invoice due date. You can review each message before activating.</p></div>
                <button onClick={activate} disabled={selected.active} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-[11px] font-bold text-zinc-950 shadow-[0_8px_28px_rgba(52,211,153,.12)] transition hover:bg-emerald-300 disabled:cursor-default disabled:bg-emerald-400/15 disabled:text-emerald-300"><Zap size={15} fill="currentColor"/>{selected.active?'Sequence is active':'Activate automated sequence'}</button>
                <p className="mt-2 text-center text-[9px] text-zinc-600">Invoice and sequence status are saved · Email delivery is not connected</p>
              </div>
            </>:<div className="p-8 text-center text-xs text-zinc-500">Add an invoice to build an escalation plan.</div>}
          </div>
        </section>
        <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-zinc-800/70 pt-5 text-[10px] text-zinc-600 sm:flex-row"><span>© 2026 DebtPulse. Less chasing. More creating.</span><span className="flex items-center gap-3"><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> All systems operational</span><span>Built for creative teams</span></span></footer>
      </main>
    </div>

    {modal&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#141417] shadow-2xl shadow-black/60">
      <div className="flex items-start justify-between border-b border-zinc-800 p-5"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-400"><Plus size={13}/> New receivable</div><h3 className="mt-2 font-display text-xl font-semibold">Add late invoice</h3><p className="mt-1 text-[11px] text-zinc-500">We’ll prepare a tailored follow-up sequence.</p></div><button onClick={()=>setModal(false)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-white"><X size={17}/></button></div>
      <form onSubmit={addInvoice} className="space-y-4 p-5">
        <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-zinc-400">CLIENT BUSINESS NAME</span><input required value={form.client} onChange={e=>setForm({...form,client:e.target.value})} placeholder="e.g. Northstar Films" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70"/></label>
        <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-zinc-400">CLIENT CONTACT EMAIL</span><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="accounts@client.com" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70"/></label>
        <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-zinc-400">INVOICE AMOUNT (₹)</span><input required min="1" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="50000" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70"/></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-zinc-400">DAYS OVERDUE</span><input required min="1" type="number" value={form.days} onChange={e=>setForm({...form,days:e.target.value})} placeholder="5" className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/70"/></label></div>
        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[.05] p-3 text-[10px] leading-relaxed text-zinc-400"><Sparkles size={13} className="mr-1 inline text-emerald-400"/> Three professional email templates will be personalized using the client and invoice details.</div>
        <div className="flex gap-2 pt-1"><button type="button" onClick={()=>setModal(false)} className="h-11 flex-1 rounded-xl border border-zinc-700 text-[11px] font-semibold text-zinc-300 hover:bg-zinc-800">Cancel</button><button type="submit" disabled={loading} className="flex h-11 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-emerald-400 text-[11px] font-bold text-zinc-950 hover:bg-emerald-300">Generate chase sequence <ChevronRight size={14}/></button></div>
      </form>
    </div></div>}
    {toast&&<div className="fixed bottom-5 right-5 z-[60] flex max-w-[min(440px,calc(100vw-40px))] items-start gap-3 rounded-xl border border-emerald-500/25 bg-[#111815] px-4 py-3.5 shadow-2xl shadow-black/50"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-400"><CheckCircle2 size={16}/></div><div><div className="text-[11px] font-semibold text-emerald-300">All set</div><p className="mt-0.5 text-[11px] leading-relaxed text-zinc-300">{toast}</p></div><button onClick={()=>setToast('')} className="ml-1 text-zinc-600 hover:text-white"><X size={14}/></button></div>}
  </div>
}

export default App
