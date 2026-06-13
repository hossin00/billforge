import { useState } from 'react';
import { FileText, Plus, Trash2, Download, Edit2, Check, X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
interface Line { id:string; desc:string; qty:number; rate:number; }
interface Invoice { id:string; number:string; client:string; email:string; date:string; due:string; items:Line[]; notes:string; status:'draft'|'sent'|'paid'|'overdue'; createdAt:number; }
const SAVE='bf_invoices_v1';
const load=():Invoice[]=>{try{return JSON.parse(localStorage.getItem(SAVE)||'[]')}catch{return[]}};
const persist=(items:Invoice[])=>localStorage.setItem(SAVE,JSON.stringify(items));
const ac='#10b981';
export default function App() {
  const [invoices,setInvoices]=useState<Invoice[]>(load);
  const [view,setView]=useState<'list'|'create'|'edit'>('list');
  const [current,setCurrent]=useState<Invoice|null>(null);
  const save=(items:Invoice[])=>{setInvoices(items);persist(items);};
  if(view!=='list')return <InvoiceForm invoice={current} onSave={inv=>{const u=invoices.find(i=>i.id===inv.id)?invoices.map(i=>i.id===inv.id?inv:i):[inv,...invoices];save(u);setView('list');}} onBack={()=>setView('list')}/>;
  const totals=invoices.reduce((s,i)=>{const t=i.items.reduce((x,l)=>x+l.qty*l.rate,0);return{total:s.total+t,paid:s.paid+(i.status==='paid'?t:0),pending:s.pending+(i.status!=='paid'?t:0)};},{total:0,paid:0,pending:0});
  return(
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',flexDirection:'column'}}>
      <header style={{padding:'14px 20px',borderBottom:'1px solid #052e1c',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'9px',background:`linear-gradient(135deg,${ac},#059669)`,display:'flex',alignItems:'center',justifyContent:'center'}}><FileText size={15} color="white"/></div>
          <div><div style={{fontWeight:'700',fontSize:'15px',color:'white',lineHeight:1}}>BillForge</div><div style={{fontSize:'10px',color:'#065f46',marginTop:'2px'}}>{invoices.length} invoices</div></div>
        </div>
        <button onClick={()=>{setCurrent(null);setView('create');}} style={{display:'flex',alignItems:'center',gap:'5px',padding:'7px 12px',borderRadius:'8px',background:ac,border:'none',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:`0 3px 10px ${ac}35`}}>
          <Plus size={13}/> New
        </button>
      </header>
      {invoices.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',margin:'12px 20px 0'}}>
        {[{l:'Invoiced',v:'$'+totals.total.toFixed(0),c:ac},{l:'Paid',v:'$'+totals.paid.toFixed(0),c:'#34d399'},{l:'Pending',v:'$'+totals.pending.toFixed(0),c:'#f59e0b'}].map(s=>(
          <div key={s.l} style={{background:'#0a1a0a',border:'1px solid #052e1c',borderRadius:'10px',padding:'11px',textAlign:'center'}}>
            <div style={{fontSize:'16px',fontWeight:'700',color:s.c}}>{s.v}</div>
            <div style={{fontSize:'10px',color:'#065f46',marginTop:'2px'}}>{s.l}</div>
          </div>
        ))}
      </div>}
      <div style={{flex:1,overflow:'auto',padding:'12px 20px',display:'flex',flexDirection:'column',gap:'7px'}}>
        {invoices.length===0?(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:'48px',marginBottom:'14px'}}>📄</div>
            <h3 style={{fontSize:'18px',fontWeight:'700',color:'white',marginBottom:'8px'}}>No invoices yet</h3>
            <p style={{color:'#065f46',fontSize:'13px',lineHeight:'1.6',maxWidth:'220px',margin:'0 auto 18px'}}>Create professional invoices and export them as PDF.</p>
            <button onClick={()=>{setCurrent(null);setView('create');}} style={{padding:'10px 22px',borderRadius:'9px',background:ac,border:'none',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',boxShadow:`0 4px 14px ${ac}35`}}>Create first invoice</button>
          </div>
        ):[...invoices].sort((a,b)=>b.createdAt-a.createdAt).map(inv=>{
          const total=inv.items.reduce((s,l)=>s+l.qty*l.rate,0);
          const sc={draft:'#94a3b8',sent:'#3b82f6',paid:'#10b981',overdue:'#ef4444'}[inv.status];
          return(
            <div key={inv.id} style={{background:'#0a1a0a',border:'1px solid #052e1c',borderRadius:'11px',padding:'13px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',transition:'all 0.2s'}}
              onClick={()=>{setCurrent(inv);setView('edit');}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=ac+'30'} onMouseLeave={e=>e.currentTarget.style.borderColor='#052e1c'}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'7px',marginBottom:'3px'}}>
                  <span style={{color:'white',fontSize:'13px',fontWeight:'500'}}>{inv.client}</span>
                  <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'4px',background:sc+'20',color:sc}}>{inv.status}</span>
                </div>
                <div style={{color:'#065f46',fontSize:'11px'}}>#{inv.number} · Due {inv.due}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'7px',flexShrink:0}}>
                <span style={{fontSize:'15px',fontWeight:'700',color:'#34d399'}}>${total.toFixed(2)}</span>
                <button onClick={e=>{e.stopPropagation();const u=invoices.filter(i=>i.id!==inv.id);save(u);}} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#065f46'}}><Trash2 size={12}/></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function InvoiceForm({invoice,onSave,onBack}:{invoice:Invoice|null;onSave:(i:Invoice)=>void;onBack:()=>void}) {
  const today=new Date().toISOString().split('T')[0];
  const due=new Date(Date.now()+30*86400000).toISOString().split('T')[0];
  const [client,setClient]=useState(invoice?.client||'');
  const [email,setEmail]=useState(invoice?.email||'');
  const [date,setDate]=useState(invoice?.date||today);
  const [dueDate,setDue]=useState(invoice?.due||due);
  const [items,setItems]=useState<Line[]>(invoice?.items||[{id:crypto.randomUUID(),desc:'',qty:1,rate:0}]);
  const [notes,setNotes]=useState(invoice?.notes||'');
  const [status,setStatus]=useState<Invoice['status']>(invoice?.status||'draft');
  const total=items.reduce((s,l)=>s+l.qty*l.rate,0);
  const num=invoice?.number||'INV-'+Date.now().toString().slice(-5);
  const inp={width:'100%',background:'#040a04',border:'1px solid #052e1c',borderRadius:'10px',padding:'10px 13px',color:'white',fontSize:'13px',outline:'none',fontFamily:'Inter',transition:'border-color 0.2s'};
  const exportPDF=()=>{
    const win=window.open('','_blank');if(!win)return;
    win.document.write('<html><head><title>Invoice '+num+'</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,-apple-system,sans-serif;padding:48px;color:#111}h1{font-size:28px;font-weight:700;color:#10b981}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #f0f0f0}th{background:#f9fafb;font-size:12px;color:#6b7280}.total{font-weight:700;font-size:15px;color:#10b981}</style></head><body>');
    win.document.write('<div style="display:flex;justify-content:space-between;margin-bottom:32px"><div><h1>INVOICE</h1><div style="color:#9ca3af">#'+num+'</div></div><div style="text-align:right"><div style="font-size:12px;color:#9ca3af;margin-bottom:4px">Status</div><span style="background:'+({draft:'#f1f5f9',sent:'#eff6ff',paid:'#f0fdf4',overdue:'#fef2f2'}[status])+';color:'+({draft:'#64748b',sent:'#3b82f6',paid:'#10b981',overdue:'#ef4444'}[status])+';padding:4px 10px;border-radius:20px;font-size:12px">'+status.toUpperCase()+'</span></div>');
    win.document.write('<p style="margin-bottom:4px"><strong>'+client+'</strong></p><p style="color:#6b7280;font-size:13px">'+email+'</p><p style="color:#6b7280;font-size:12px;margin-top:8px">Invoice: '+date+' · Due: '+dueDate+'</p>');
    win.document.write('<table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>');
    items.filter(l=>l.desc).forEach(l=>{win.document.write('<tr><td>'+l.desc+'</td><td>'+l.qty+'</td><td>$'+l.rate.toFixed(2)+'</td><td>$'+(l.qty*l.rate).toFixed(2)+'</td></tr>');});
    win.document.write('<tr class="total"><td colspan="3" style="text-align:right">Total</td><td>$'+total.toFixed(2)+'</td></tr></tbody></table>');
    if(notes)win.document.write('<p style="background:#f9fafb;padding:14px;border-radius:8px;font-size:13px;color:#6b7280">'+notes+'</p>');
    win.document.write('</body></html>');win.document.close();setTimeout(()=>win.print(),500);
  };
  return(
    <div style={{minHeight:'100vh',background:'#080f08',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'13px 20px',borderBottom:'1px solid #052e1c',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button onClick={onBack} style={{color:'#6ee7b7',background:'none',border:'none',cursor:'pointer',fontSize:'14px',fontFamily:'Inter'}}>← Back</button>
        <span style={{color:'white',fontSize:'13px',fontWeight:'600'}}>#{num}</span>
        <div style={{display:'flex',gap:'6px'}}>
          <button onClick={exportPDF} style={{padding:'6px',borderRadius:'7px',background:'none',border:'none',cursor:'pointer',color:'#065f46'}}><Download size={14}/></button>
          <button onClick={()=>{if(!client.trim())return;onSave({id:invoice?.id||crypto.randomUUID(),number:num,client,email,date,due:dueDate,items:items.filter(l=>l.desc),notes,status,createdAt:invoice?.createdAt||Date.now()});}} style={{padding:'6px 13px',borderRadius:'8px',background:'#10b981',border:'none',color:'white',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter'}}>Save</button>
        </div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        <div style={{maxWidth:'560px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'10px'}}>
          <div style={{display:'flex',gap:'6px'}}>{(['draft','sent','paid','overdue'] as const).map(s=><button key={s} onClick={()=>setStatus(s)} style={{flex:1,padding:'7px',borderRadius:'8px',border:`1px solid ${status===s?{draft:'#94a3b8',sent:'#3b82f6',paid:'#10b981',overdue:'#ef4444'}[s]:'#052e1c'}`,background:status===s?({draft:'#94a3b820',sent:'#3b82f620',paid:'#10b98120',overdue:'#ef444420'}[s]):'transparent',color:status===s?({draft:'#94a3b8',sent:'#60a5fa',paid:'#34d399',overdue:'#f87171'}[s]):'#065f46',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'Inter',textTransform:'capitalize'}}>{s}</button>)}</div>
          <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Client name *" style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Client email" style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
            <input type="date" value={dueDate} onChange={e=>setDue(e.target.value)} style={inp} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
          </div>
          <div style={{background:'#0a1a0a',border:'1px solid #052e1c',borderRadius:'12px',padding:'14px'}}>
            <div style={{fontSize:'11px',color:'#065f46',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:'10px'}}>Line Items</div>
            {items.map((item,i)=>(
              <div key={item.id} style={{display:'grid',gridTemplateColumns:'1fr 56px 72px 28px',gap:'5px',marginBottom:'6px',alignItems:'center'}}>
                <input value={item.desc} onChange={e=>{const u=[...items];u[i]={...u[i],desc:e.target.value};setItems(u);}} placeholder="Description" style={{...inp,padding:'7px 10px'}} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
                <input type="number" value={item.qty} onChange={e=>{const u=[...items];u[i]={...u[i],qty:+e.target.value};setItems(u);}} style={{...inp,padding:'7px 8px',textAlign:'center'}} min="1" onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
                <input type="number" value={item.rate} onChange={e=>{const u=[...items];u[i]={...u[i],rate:+e.target.value};setItems(u);}} placeholder="Rate" style={{...inp,padding:'7px 8px'}} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
                <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{padding:'4px',background:'none',border:'none',cursor:'pointer',color:'#065f46'}}><X size={12}/></button>
              </div>
            ))}
            <button onClick={()=>setItems([...items,{id:crypto.randomUUID(),desc:'',qty:1,rate:0}])} style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 10px',borderRadius:'7px',background:'transparent',border:'1px dashed #10b98130',color:'#34d399',fontSize:'11px',cursor:'pointer',fontFamily:'Inter',marginTop:'4px'}}>
              <Plus size={10}/> Add item
            </button>
            <div style={{textAlign:'right',marginTop:'10px',paddingTop:'10px',borderTop:'1px solid #052e1c'}}>
              <span style={{color:'#34d399',fontSize:'17px',fontWeight:'700'}}>Total: ${total.toFixed(2)}</span>
            </div>
          </div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} style={{...inp,resize:'none',lineHeight:'1.6'}} onFocus={e=>e.target.style.borderColor='#10b981'} onBlur={e=>e.target.style.borderColor='#052e1c'}/>
        </div>
      </div>
    </div>
  );
}
