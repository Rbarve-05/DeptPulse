import { Router } from 'express'
import Invoice from '../models/Invoice.js'
const router=Router()
const serialize=doc=>({
  id:doc.id, client:doc.client, email:doc.email, project:doc.project,
  amount:doc.amount, days:doc.days, active:doc.active, initials:doc.initials,
  color:doc.color, createdAt:doc.createdAt, updatedAt:doc.updatedAt,
  overdueSince:doc.overdueSince, automationEnabled:doc.automationEnabled,
  activatedAt:doc.activatedAt, remindersSent:doc.remindersSent || [],
})
router.get('/',async(_req,res,next)=>{try{const docs=await Invoice.find().sort({createdAt:-1});res.json(docs.map(serialize))}catch(e){next(e)}})
router.post('/',async(req,res,next)=>{try{
 const {client,email,amount,days,project}=req.body
 if(!client?.trim()||!email?.trim()||!Number.isFinite(Number(amount))||Number(amount)<1||!Number.isInteger(Number(days))||Number(days)<0)return res.status(400).json({message:'Enter a client, valid email, positive amount, and non-negative whole number of overdue days.'})
 const initials=client.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase()
 const id=`INV-${Date.now().toString().slice(-8)}`
 const overdueSince=new Date(Date.now()-Number(days)*24*60*60*1000)
 const doc=await Invoice.create({id,client,email,amount:Number(amount),days:Number(days),overdueSince,project:project||'New creative production project',initials})
 res.status(201).json(serialize(doc))
}catch(e){if(e.code===11000)return res.status(409).json({message:'Invoice number collision. Please try again.'});next(e)}})
router.patch('/:id/activate',async(req,res,next)=>{try{
 const doc=await Invoice.findOne({id:req.params.id})
 if(!doc)return res.status(404).json({message:'Invoice not found.'})
 if(!doc.overdueSince)doc.overdueSince=new Date(Date.now()-Number(doc.days||0)*24*60*60*1000)
 doc.active=true
 doc.automationEnabled=true
 doc.activatedAt=new Date()
 await doc.save()
 res.json(serialize(doc))
}catch(e){next(e)}})
export default router
