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
export function renderCosts(data,{canEdit=false,filter='all'}={}){
  const costs=data.trip_expenses||[],summary=costSummary(costs),untracked=(data.bookings||[]).filter(b=>b.status!=='cancelled'&&b.amount!=null&&!costs.some(e=>e.booking_id===b.id));
  const cards=costs.filter(e=>filter!=='outstanding'||e.vendor_paid===null||Number(e.vendor_paid)<Number(e.amount)||(e.splits||[]).some(s=>Number(s.repaid)<Number(s.share)));
  return `<div class="section-head"><div><h2>Costs & repayments</h2><p>Vendor payments and repayments are separate. Names do not grant app access.</p></div>${canEdit?'<button class="button button-primary button-small" data-action="new-expense">+ Cost</button>':''}</div>
  <div class="cost-totals">${summary.currencies.map(g=>`<div class="panel"><p class="eyebrow">${esc(g.currency)} · tracked costs</p><h2>${money(g.total,g.currency)}</h2><dl class="cost-facts"><div><dt>Vendor paid</dt><dd>${money(g.paid,g.currency)}</dd></div><div><dt>Left to pay vendor${g.unknown?' (known)':''}</dt><dd>${money(g.vendorDue,g.currency)}</dd></div><div><dt>Repayments outstanding</dt><dd>${money(g.repayDue,g.currency)}</dd></div></dl>${g.unknown?`<p class="hint">${g.unknown} vendor payment status not recorded.</p>`:''}</div>`).join('')}</div>
  ${summary.people.length?`<div class="panel"><h3>Who still owes whom</h3>${summary.people.filter(p=>p.due>0).map(p=>`<p class="cost-balance"><span>${esc(p.person)} → ${esc(p.payer)}</span><strong>${money(p.due,p.currency)}</strong></p>`).join('')||'<p>All repayments settled.</p>'}</div>`:''}
  <div class="tabs cost-tabs"><button class="tab ${filter==='all'?'active':''}" data-cost-filter="all">All costs</button><button class="tab ${filter==='outstanding'?'active':''}" data-cost-filter="outstanding">Outstanding</button></div>
  <div class="stack">${cards.map(e=>{
    const c=e.currency,left=e.vendor_paid===null?null:Number(e.amount)-Number(e.vendor_paid),owed=(e.splits||[]).reduce((s,r)=>s+Number(r.share)-Number(r.repaid),0),booking=(data.bookings||[]).find(b=>b.id===e.booking_id);
    return `<details class="panel cost-card"><summary><div><strong>${esc(e.title)}</strong>${e.visibility==='private'?'<span class="pill private-badge">🔒 Private</span>':''}<small>${left===null?'Vendor status not recorded':left>0?'Vendor balance '+money(left,c):'✓ Vendor paid'} · ${owed>0?money(owed,c)+' to collect':'Repayments settled'}</small></div><b>${money(e.amount,c)}</b></summary><div class="cost-detail"><p>${booking?'Linked booking: '+esc(booking.title)+' · ':''}Vendor payer: <strong>${esc(e.paid_by)}</strong></p>${e.due_date?`<p>Vendor due: ${esc(e.due_date)}</p>`:''}<p>${left===null?'Vendor payment not recorded':money(e.vendor_paid,c)+' paid to vendor · '+money(left,c)+' left'}</p>${canEdit&&left!==0?`<button class="button button-small" data-action="settle-expense" data-id="${esc(e.id)}" data-part="vendor">Mark vendor fully paid</button>`:''}
    <h3>Split & repayments</h3><p>Own share (${esc(e.paid_by)}): ${money(Number(e.amount)-(e.splits||[]).reduce((s,r)=>s+Number(r.share),0),c)}</p>${(e.splits||[]).map((s,i)=>`<div class="cost-split-line"><p><strong>${esc(s.person)}</strong> · share ${money(s.share,c)}<small>${money(s.repaid,c)} repaid to ${esc(e.paid_by)} · ${money(Number(s.share)-Number(s.repaid),c)} left</small></p>${canEdit&&Number(s.repaid)<Number(s.share)?`<button class="button button-small" data-action="settle-expense" data-id="${esc(e.id)}" data-part="${i}">Mark repaid</button>`:''}</div>`).join('')||'<p class="muted">No other people splitting this cost.</p>'}${e.notes?`<p class="cost-notes">${esc(e.notes)}</p>`:''}${canEdit?`<button class="button button-small" data-action="edit-expense" data-id="${esc(e.id)}">Edit cost / partial payments</button>`:''}</div></details>`;
  }).join('')||'<div class="empty"><strong>No matching costs</strong><p>Add a cost or start tracking a booking below.</p></div>'}</div>
  ${canEdit&&untracked.length?`<details class="panel cost-untracked"><summary>Booking amounts not yet tracked (${untracked.length})</summary><p class="hint">Not included in totals above. Tracking copies the current amount; payment status starts as unknown.</p>${untracked.map(b=>`<div class="cost-split-line"><p>${esc(b.title)}<small>${money(b.amount,b.currency||'GBP')}</small></p><button class="button button-small" data-action="track-booking-cost" data-id="${esc(b.id)}">Track cost</button></div>`).join('')}</details>`:''}<p class="hint">Totals cover the costs visible to you. Currencies are kept separate. Payment entries record money you have paid outside the app.</p>`;
}
export function splitRow(s={},index=0){return `<div class="cost-split-editor" data-cost-split><div class="field"><label>Person<input data-split-person aria-label="Person ${index+1}" value="${esc(s.person||'')}" maxlength="100" required list="cost-person-names"></label></div><div class="field"><label>Share type<select data-split-mode aria-label="Share type ${index+1}"><option value="amount">Exact amount</option><option value="percent">Percentage</option></select></label></div><div class="field"><label>Share<input data-split-share aria-label="Share ${index+1}" type="number" min="0" step="any" value="${esc(s.share??'')}" required></label></div><div class="field"><label>Repaid so far<input data-split-repaid aria-label="Repaid so far ${index+1}" type="number" min="0" step="any" value="${esc(s.repaid??0)}" required></label></div><button type="button" class="button button-small" data-action="remove-cost-split">Remove person</button></div>`;}
