/* Cost accounting is kept in currency minor units; no implicit FX conversions. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const digits=currency=>new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;
export function minor(value,currency){
  const n=Number(value),scale=10**digits(currency),units=Math.round(n*scale);
  if(String(value).trim()===''||!Number.isFinite(n)||n<0||!Number.isSafeInteger(units)||Math.abs(n*scale-units)>0.00001)throw new Error('Enter a valid amount for '+currency+'.');
  return units;
}
export const money=(v,c)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:c}).format(Number(v||0));
export function validateExpense(v){
  v={...v,currency:String(v.currency||'').trim().toUpperCase(),title:String(v.title||'').trim(),paid_by:String(v.paid_by||'').trim()};
  if(!/^[A-Z]{3}$/.test(v.currency))throw new Error('Use a three-letter currency, such as GBP or JPY.');
  if(!v.title||!v.paid_by)throw new Error('Enter a cost name and the person paying the vendor.');
  const total=minor(v.amount,v.currency),seen=new Set([v.paid_by.toLocaleLowerCase()]);let allocated=0;
  if(v.vendor_paid!==null&&minor(v.vendor_paid,v.currency)>total)throw new Error('Vendor payments cannot exceed the total cost.');
  if(!Array.isArray(v.splits)||v.splits.length>30)throw new Error('Use up to 30 people per cost.');
  v.splits=v.splits.map(s=>{
    const person=String(s.person||'').trim(),key=person.toLocaleLowerCase();
    if(!person||seen.has(key))throw new Error('Give each person a different name, excluding the vendor payer.');
    seen.add(key);const share=minor(s.share,v.currency),repaid=minor(s.repaid,v.currency);allocated+=share;
    if(repaid>share)throw new Error(person+' cannot have repaid more than their share.');
    return {person,share:share/10**digits(v.currency),repaid:repaid/10**digits(v.currency)};
  });
  if(allocated>total)throw new Error('Other people’s shares cannot exceed the total cost. The remainder is the payer’s share.');
  return v;
}
export function equalShares(amount,currency,count){const total=minor(amount,currency);return Math.floor(total/(count+1))/10**digits(currency);}
export function percentShare(amount,currency,percent){const p=Number(percent);if(!Number.isFinite(p)||p<0||p>100)throw new Error('Percentages must be from 0 to 100.');return Math.round(minor(amount,currency)*p/100)/10**digits(currency);}
export function costSummary(expenses){
  const currencies=new Map(),people=new Map();
  for(const e of expenses){
    const c=e.currency,scale=10**digits(c),total=minor(e.amount,c),paid=e.vendor_paid===null?null:minor(e.vendor_paid,c);
    const g=currencies.get(c)||{currency:c,total:0,paid:0,vendorDue:0,unknown:0,repayDue:0};
    g.total+=total;g.paid+=paid||0;if(paid===null)g.unknown++;else g.vendorDue+=total-paid;
    for(const s of e.splits||[]){const due=minor(s.share,c)-minor(s.repaid,c);g.repayDue+=due;const key=JSON.stringify([s.person.trim().toLowerCase(),e.paid_by.trim().toLowerCase(),c]);const p=people.get(key)||{person:s.person,payer:e.paid_by,currency:c,due:0};p.due+=due;people.set(key,p);}
    currencies.set(c,g);
  }
  return {currencies:[...currencies.values()].map(g=>({...g,total:g.total/10**digits(g.currency),paid:g.paid/10**digits(g.currency),vendorDue:g.vendorDue/10**digits(g.currency),repayDue:g.repayDue/10**digits(g.currency)})),people:[...people.values()].map(p=>({...p,due:p.due/10**digits(p.currency)}))};
}
export function paymentDue(e,today=new Date().toISOString().slice(0,10)){
  if(!e.due_date)return {label:'',kind:''};
  const date=new Date(e.due_date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',...(e.due_date.slice(0,4)!==today.slice(0,4)?{year:'numeric'}:{}),timeZone:'UTC'});
  if(e.vendor_paid!==null&&Number(e.vendor_paid)>=Number(e.amount))return {label:'Due date: '+date,kind:'paid'};
  if(e.due_date<today)return {label:'Overdue · '+date,kind:'overdue'};
  if(e.due_date===today)return {label:'Due today',kind:'soon'};
  const days=(Date.parse(e.due_date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000;
  return {label:'Due '+date,kind:days<=7?'soon':'upcoming'};
}
// Booking amounts appear immediately; payment records are created only on edit/payment.
export function costEntries(data,{paidBy='Trip owner'}={}){
  const saved=data.trip_expenses||[],linked=new Set(saved.map(e=>e.booking_id).filter(Boolean));
  return [...saved,...(data.bookings||[]).filter(b=>b.status!=='cancelled'&&b.amount!=null&&!linked.has(b.id)).map(b=>({id:'booking:'+b.id,trip_id:b.trip_id,booking_id:b.id,title:b.title,amount:b.amount,currency:b.currency||'GBP',paid_by:paidBy,vendor_paid:null,splits:[],due_date:null,notes:null,visibility:b.visibility||'shared',private_user_ids:b.private_user_ids||[],from_booking:true}))];
}
export function renderCosts(data,{canEdit=false,filter='all',today,expandedId,paidBy}={}){
  const costs=costEntries(data,{paidBy}),summary=costSummary(costs);
  const cards=costs.filter(e=>filter!=='outstanding'||e.vendor_paid===null||Number(e.vendor_paid)<Number(e.amount)||(e.splits||[]).some(s=>Number(s.repaid)<Number(s.share)));
  return `<div class="cost-simple-head"><p>Payments & repayments</p>${canEdit?'<button class="button button-primary button-small" data-action="new-expense">+ Add</button>':''}</div>
  <div class="cost-overviews">${summary.currencies.map(g=>`<section class="cost-overview" aria-label="${esc(g.currency)} balances">${summary.currencies.length>1?`<p class="eyebrow">${esc(g.currency)}</p>`:''}<div class="cost-two-totals"><div><span>Left to pay vendors${g.unknown&&g.unknown<costs.filter(e=>e.currency===g.currency).length?' (known)':''}</span><strong>${g.unknown&&g.unknown===costs.filter(e=>e.currency===g.currency).length?'Not recorded':money(g.vendorDue,g.currency)}</strong></div><div><span>Repayments owed</span><strong>${money(g.repayDue,g.currency)}</strong></div></div>${g.unknown?`<p class="hint">${g.unknown} payment status${g.unknown===1?'':'es'} to confirm.</p>`:''}</section>`).join('')}</div>
  <div class="cost-list-toolbar"><div class="cost-switch" aria-label="Cost filter"><button class="${filter==='all'?'active':''}" data-cost-filter="all" aria-pressed="${filter==='all'}">All costs</button><button class="${filter==='outstanding'?'active':''}" data-cost-filter="outstanding" aria-pressed="${filter==='outstanding'}">Outstanding</button></div><span>Tap to manage</span></div>
  <div class="cost-simple-list">${cards.map(e=>{
    const c=e.currency,left=e.vendor_paid===null?null:Number(e.amount)-Number(e.vendor_paid),booking=(data.bookings||[]).find(b=>b.id===e.booking_id),due=paymentDue(e,today);
    const repays=(e.splits||[]).map(s=>{const remaining=Number(s.share)-Number(s.repaid);return `<span class="cost-chip ${remaining>0?'owing':'settled'}">${remaining>0?esc(s.person)+' owes '+money(remaining,c):'✓ '+esc(s.person)+' repaid'}</span>`;}).join('')||'<span class="cost-chip neutral">Not split</span>';
    return `<details class="cost-card cost-simple-card" name="trip-cost" data-cost-id="${esc(e.id)}" ${expandedId===e.id?'open':''}><summary><div class="cost-row-heading"><strong>${esc(e.title)}</strong><span class="cost-row-amount">${money(e.amount,c)}</span></div><div class="cost-chips"><span class="cost-chip ${left===0?'settled':left===null?'neutral':'owing'}">${left===null?'Payment not recorded':left>0?'Vendor: '+money(left,c)+' left':'✓ Vendor paid'}</span>${repays}${e.visibility==='private'?'<span class="cost-chip neutral">🔒 Private</span>':''}</div>${due.label&&due.kind!=='paid'?`<p class="cost-due ${due.kind}">${esc(due.label)}</p>`:''}</summary>
    <div class="cost-simple-detail"><div class="cost-payment-line"><div><strong>Vendor payment</strong><small>${left===null?'Amount paid not recorded':money(e.vendor_paid,c)+' of '+money(e.amount,c)+' paid'}${due.label?' · '+esc(due.label):''}</small></div>${canEdit?(left!==0?`<button class="button button-small" data-action="settle-expense" data-id="${esc(e.id)}" data-part="vendor">Vendor paid</button>`:'<span class="cost-paid-label">✓ Paid</span>'):''}</div>
    ${(e.splits||[]).map((s,i)=>`<div class="cost-payment-line"><div><strong>${esc(s.person)}’s share · ${money(s.share,c)}</strong><small>${money(s.repaid,c)} repaid to ${esc(e.paid_by)}</small></div>${canEdit?(Number(s.repaid)<Number(s.share)?`<button class="button button-primary button-small" data-action="settle-expense" data-id="${esc(e.id)}" data-part="${i}">${esc(s.person)} repaid</button>`:'<span class="cost-paid-label">✓ Repaid</span>'):''}</div>`).join('')}
    ${canEdit?`<button class="cost-edit-link" data-action="edit-expense" data-id="${esc(e.id)}">Edit amounts, due date or part payments</button>`:''}
    <details class="cost-extra-details"><summary>More details</summary><p>Vendor payer: ${esc(e.paid_by)} · own share ${money(Number(e.amount)-(e.splits||[]).reduce((s,r)=>s+Number(r.share),0),c)}</p>${booking?`<p>Linked booking: ${esc(booking.title)}</p>`:''}${e.notes?`<p class="cost-notes">${esc(e.notes)}</p>`:''}</details></div></details>`;
  }).join('')||`<div class="empty"><strong>${costs.length?'No outstanding costs':'No costs yet'}</strong><p>${costs.length?'All recorded payments and repayments are settled.':'Booking amounts appear here automatically. Add other costs with + Add.'}</p></div>`}</div>
  <details class="cost-footer-details"><summary>Totals & balances by person</summary>${summary.currencies.map(g=>`<p>${money(g.total,g.currency)} total · ${money(g.paid,g.currency)} paid to vendors</p>`).join('')}${summary.people.filter(p=>p.due>0).map(p=>`<p class="cost-balance"><span>${esc(p.person)} → ${esc(p.payer)}</span><strong>${money(p.due,p.currency)}</strong></p>`).join('')}<p>Visible booking amounts and saved costs are counted. Payment status starts as not recorded. Currencies stay separate. Naming a person does not grant app access.</p></details>`;
}
export function splitRow(s={},index=0){return `<div class="cost-split-editor" data-cost-split><div class="field"><label>Person<input data-split-person aria-label="Person ${index+1}" value="${esc(s.person||'')}" maxlength="100" required list="cost-person-names"></label></div><div class="field"><label>Share type<select data-split-mode aria-label="Share type ${index+1}"><option value="amount">Exact amount</option><option value="percent">Percentage</option></select></label></div><div class="field"><label>Share<input data-split-share aria-label="Share ${index+1}" type="number" min="0" step="any" value="${esc(s.share??'')}" required></label></div><div class="field"><label>Repaid so far<input data-split-repaid aria-label="Repaid so far ${index+1}" type="number" min="0" step="any" value="${esc(s.repaid??0)}" required></label></div><button type="button" class="button button-small" data-action="remove-cost-split">Remove person</button></div>`;}
