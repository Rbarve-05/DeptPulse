import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema({
  id:{ type:String, required:true, unique:true, trim:true },
  client:{ type:String, required:true, trim:true, maxlength:120 },
  email:{ type:String, required:true, trim:true, lowercase:true, maxlength:254 },
  project:{ type:String, default:'Creative production project', trim:true, maxlength:180 },
  amount:{ type:Number, required:true, min:1 },
  days:{ type:Number, required:true, min:0 },
  active:{ type:Boolean, default:false },
  initials:{ type:String, default:'' },
  color:{ type:String, default:'from-emerald-500/20 to-teal-500/10' },
},{ timestamps:true, versionKey:false })
export default mongoose.model('Invoice', invoiceSchema)
