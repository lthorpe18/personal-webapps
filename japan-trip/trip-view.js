/* Presentation only: consumes records already authorised by Supabase. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=d=>d?new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}):'Date to confirm';
const fullDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
const clock=(v,tz)=>{try{return v?new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz||'UTC'}).format(new Date(v)):'';}catch{return '';}};
const safe=v=>{try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const norm=v=>String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const kindInfo={stay:['☾','Stay'],travel:['↗','Travel'],activity:['◇','Activity'],meal:['◉','Food'],document:['▤','Document']};
function iconFor(kind){const paths={stay:'<path d="M3 19V5m0 10h18v4M3 9h6v6m0-4h9a3 3 0 0 1 3 3v1M5 9V7h4v2"/>',travel:'<rect x="6" y="3" width="12" height="15" rx="3"/><path d="M6 10h12M9 21l2-3m4 3-2-3M9 14h.01M15 14h.01"/>',activity:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',meal:'<path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M19 21V3c-4 3-4 9 0 9"/>',document:'<path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4zM15 5v3m0 3v2m0 3v3"/>',tasks:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[kind]||paths.activity)+'</svg>';}
export const navigationIcon=key=>iconFor(({plan:'activity',wallet:'document'}[key]||key));
const source=(type,r)=>r?{type,id:r.id,row:r}:null;
const privateMark=records=>records.some(r=>r?.row.visibility==='private')?'<span class="privacy-mark">🔒 Private details</span>':'';
const statusLabel=s=>({booked:'Booked',confirmed:'Confirmed',pending:'To book',planned:'Planned',shortlisted:'Shortlisted',cancelled:'Cancelled',done:'Done',dropped:'Dropped',not_required:'No reservation needed'}[s]||s||'Planned');
function status(s){return '<span class="item-status '+esc(s||'planned')+'">'+(['booked','confirmed','done'].includes(s)?'✓ ':'')+esc(statusLabel(s))+'</span>';}
export function datesForTrip(trip){
  if(!trip?.start_date||!trip?.end_date)return [];
  const out=[];let t=Date.parse(trip.start_date+'T12:00:00Z'),end=Date.parse(trip.end_date+'T12:00:00Z');
  while(Number.isFinite(t)&&t<=end&&out.length<1500){out.push(new Date(t).toISOString().slice(0,10));t+=86400000;}
  return out;
}
function bookingForStop(stop,bookings){return bookings.find(b=>b.stop_id===stop.id)||bookings.find(b=>b.category==='accommodation'&&!b.stop_id&&b.start_date===stop.starts_on&&b.end_date===stop.ends_on)||null;}
function assetMatches(a,records){return records.some(r=>({activity:'activity_id',booking:'booking_id',stop:'stop_id',leg:'transport_leg_id'}[r.type])&&a[({activity:'activity_id',booking:'booking_id',stop:'stop_id',leg:'transport_leg_id'}[r.type])]===r.id);}
function attachAssets(item,assets){item.assets=assets.filter(a=>assetMatches(a,item.records));return item;}
function activityKind(a){return a.type==='transport'?'travel':a.type==='meal'?'meal':'activity';}
function bookingKind(b){return b.category==='accommodation'?'stay':['flight','transport','parking'].includes(b.category)?'travel':b.category==='activity'?'activity':'document';}
function routeMatch(activity,leg){
  if(activity.booking_id&&activity.booking_id===leg.booking_id)return true;
  const text=norm(activity.title+' '+(activity.location||''));
  // Match named endpoints, never a date alone: unrelated journeys stay separate.
  return [leg.departure_name,leg.arrival_name].some(name=>norm(name).split(' ').filter(w=>w.length>3&&!['airport','station','terminal','international'].includes(w)).some(word=>text.includes(word)));
}
function bookingMatchScore(b,i){
  if(!i.date||!b.start_date||i.date<b.start_date||i.date>(b.end_date||b.start_date)||bookingKind(b)!==i.kind)return 0;
  const ignored=new Set(['booking','reservation','return','flight','flights','ticket','tickets','pass','passes','admission','hotel','transport','journey','rail','train','railway','terminal','airport','international']);
  const words=v=>[...new Set(norm(v).split(' ').map(w=>w.endsWith('s')?w.slice(0,-1):w).filter(w=>w.length>3&&!ignored.has(w)))];
  const title=norm(b.title),text=norm([i.title,i.subtitle,...(i.legs||[]).flatMap(l=>[l.departure_name,l.arrival_name,l.operator])].join(' '));
  if(norm(i.title).length>8&&title.includes(norm(i.title)))return 100;
  const matches=words(title+' '+(b.provider||'')).filter(w=>words(text).includes(w));
  return matches.length>=2||matches.some(w=>w.length>=8)?matches.length:0;
}
export function buildTripView(trip,data){
  const rows=key=>data[key]||[],bookings=rows('bookings').filter(b=>b.status!=='cancelled'),assets=rows('trip_assets');
  const activities=rows('activities').filter(a=>a.status!=='dropped');
  const legs=rows('transport_legs').filter(l=>l.reservation_status!=='cancelled');
  const items=[],details=new Map(),stays=[],consumed=new Set();
  const add=i=>{attachAssets(i,assets);items.push(i);details.set(i.key,i);return i;};
  for(const s of rows('trip_stops').filter(s=>s.status!=='cancelled')){
    const b=bookingForStop(s,bookings),records=[source('stop',s),source('booking',b)].filter(Boolean);
    const stay=attachAssets({key:'stop:'+s.id,kind:'stay',title:s.accommodation_name||b?.title||s.location,subtitle:s.location,date:s.starts_on,endDate:s.ends_on,status:b?.status||s.status,stop:s,booking:b,records,legs:[]},assets);
    stays.push(stay);details.set(stay.key,stay);
  }
  for(const b of bookings.filter(b=>b.category==='accommodation'&&!stays.some(s=>s.booking?.id===b.id))){
    const stay=attachAssets({key:'booking:'+b.id,kind:'stay',title:b.title,subtitle:b.provider,date:b.start_date,endDate:b.end_date,status:b.status,booking:b,records:[source('booking',b)],legs:[]},assets);
    stays.push(stay);details.set(stay.key,stay);
  }
  stays.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
  for(const a of activities){
    let b=bookings.find(b=>b.id===a.booking_id)||null;
    const linked=a.type==='transport'?legs.filter(l=>!consumed.has(l.id)&&l.activity_date===a.activity_date&&routeMatch(a,l)):[];
    linked.sort((a,b)=>String(a.departs_at||'').localeCompare(String(b.departs_at||''))||(a.sort_order||0)-(b.sort_order||0));
    if(!b&&linked.length&&new Set(linked.map(l=>l.booking_id)).size===1)b=bookings.find(b=>b.id===linked[0].booking_id)||null;
    linked.forEach(l=>consumed.add(l.id));
    add({key:'activity:'+a.id,kind:activityKind(a),title:a.title,subtitle:a.location,date:a.activity_date,time:linked[0]?.departs_at||a.starts_at,status:b?.status||a.status,activity:a,booking:b,legs:linked,records:[source('activity',a),source('booking',b),...linked.map(l=>source('leg',l))].filter(Boolean)});
  }
  const remaining=legs.filter(l=>!consumed.has(l.id)).sort((a,b)=>String(a.activity_date).localeCompare(String(b.activity_date))||String(a.departs_at||'').localeCompare(String(b.departs_at||'')));
  for(const l of remaining){
    if(consumed.has(l.id))continue;
    const group=[l];consumed.add(l.id);
    for(const next of remaining){
      if(consumed.has(next.id)||next.activity_date!==l.activity_date)continue;
      const last=group[group.length-1];
      if((l.booking_id&&l.booking_id===next.booking_id)||(norm(last.arrival_name)===norm(next.departure_name)&&(!last.arrives_at||!next.departs_at||Date.parse(next.departs_at)>=Date.parse(last.arrives_at)))){group.push(next);consumed.add(next.id);}
    }
    const b=bookings.find(b=>b.id===l.booking_id)||null;
    add({key:'leg:'+l.id,kind:'travel',title:l.departure_name+' → '+group[group.length-1].arrival_name,subtitle:group.length>1?group.length+' connections':[l.operator,l.service_number].filter(Boolean).join(' · '),date:l.activity_date,time:l.departs_at,status:l.reservation_status==='planned'?'planned':l.reservation_status,booking:b,legs:group,records:[...group.map(l=>source('leg',l)),source('booking',b)].filter(Boolean)});
  }
  for(const b of bookings){
    if(stays.some(s=>s.booking?.id===b.id))continue;
    // Older/public records may lack foreign keys. Match only a unique, named
    // activity/journey on a compatible date; never combine by date alone.
    const candidates=items.filter(i=>!i.booking).map(i=>({i,score:bookingMatchScore(b,i)})).filter(x=>x.score>0);
    for(const candidate of candidates){
      const peers=candidates.filter(x=>x.i.date===candidate.i.date);
      if(peers.some(x=>x!==candidate&&x.score>=candidate.score))continue;
      const i=candidate.i;i.booking=b;i.status=b.status||i.status;i.records.push(source('booking',b));attachAssets(i,assets);
    }
    const linkedItems=items.filter(i=>i.booking?.id===b.id);
    if(!linkedItems.length)add({key:'booking:'+b.id,kind:bookingKind(b),title:b.title,subtitle:b.provider,date:b.start_date,endDate:b.end_date,status:b.status,booking:b,legs:[],records:[source('booking',b)]});
    else if(!details.has('booking:'+b.id))details.set('booking:'+b.id,attachAssets({key:'booking:'+b.id,kind:bookingKind(b),title:b.title,subtitle:b.provider,date:b.start_date,endDate:b.end_date,status:b.status,booking:b,legs:[...new Map([...legs.filter(l=>l.booking_id===b.id),...linkedItems.flatMap(i=>i.legs)].map(l=>[l.id,l])).values()],records:[source('booking',b),...linkedItems.flatMap(i=>i.records).filter(r=>r.type!=='booking')]},assets));
  }
  for(const a of assets){details.set('asset:'+a.id,{key:'asset:'+a.id,kind:'document',title:a.title,asset:a,assets:[a],records:[source('asset',a)],legs:[]});}
  const wallet=[];
  for(const b of bookings){
    const stay=stays.find(s=>s.booking?.id===b.id),linked=items.filter(i=>i.booking?.id===b.id);
    const i=stay||(linked.length===1?linked[0]:details.get('booking:'+b.id));
    if(i)wallet.push({...i,walletTitle:b.title});
  }
  for(const a of assets.filter(a=>!a.booking_id||!rows('bookings').some(b=>b.id===a.booking_id))){
    const i=items.find(i=>i.assets.some(x=>x.id===a.id))||stays.find(i=>i.assets.some(x=>x.id===a.id))||details.get('asset:'+a.id);
    if(i&&!wallet.some(w=>w.key===i.key))wallet.push(i);
  }
  for(const b of rows('bookings').filter(b=>b.status==='cancelled')){const i=attachAssets({key:'booking:'+b.id,kind:bookingKind(b),title:b.title,subtitle:b.provider,date:b.start_date,endDate:b.end_date,status:b.status,booking:b,legs:[],records:[source('booking',b)]},assets);details.set(i.key,i);wallet.push(i);}
  wallet.sort((a,b)=>Number(a.status==='cancelled')-Number(b.status==='cancelled')||String(a.date||'9999').localeCompare(String(b.date||'9999'))||a.title.localeCompare(b.title));
  const byDate=new Map();
  const extraDates=[...stays.flatMap(s=>[s.date,s.endDate]),...items.filter(i=>i.kind!=='document').map(i=>i.date)].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d||''));
  const bounds=[trip.start_date,trip.end_date,...extraDates].filter(Boolean).sort();
  for(const date of datesForTrip({...trip,start_date:bounds[0],end_date:bounds[bounds.length-1]})){
    const events=items.filter(i=>i.date===date);
    const arrivals=stays.filter(s=>s.date===date),departures=stays.filter(s=>s.endDate===date);
    for(const s of departures)events.push({...s,title:'Check out · '+s.title,time:localTimeStamp(date,s.booking?.check_out_time),stayAction:'Check out'});
    for(const s of arrivals)events.push({...s,title:'Check in · '+s.title,time:localTimeStamp(date,s.booking?.check_in_time),stayAction:'Check in'});
    // Local check-in/out times sort alongside trip-local event times.
    const sortClock=i=>i.time?eventClock(i,trip):i.stayAction==='Check out'?'00:00':i.stayAction==='Check in'?'99:99':'99:98';
    events.sort((a,b)=>sortClock(a).localeCompare(sortClock(b))||a.title.localeCompare(b.title));
    byDate.set(date,{events,stay:stays.find(s=>s.date&&s.endDate&&date>=s.date&&date<s.endDate)||null});
  }
  return {items,stays,details,wallet,byDate,flexible:items.filter(i=>!i.date)};
}
function localTimeStamp(date,time){return time?'local:'+date+'T'+String(time).slice(0,5):null;}
function eventClock(i,trip){return i.time?.startsWith('local:')?i.time.slice(-5):i.time?clock(i.time,i.legs?.[0]?.departure_timezone||trip.timezone):'99:99';}
function eventTime(i,trip){const c=eventClock(i,trip);return c==='99:99'?(i.stayAction?'Time to confirm':'Flexible'):c;}
function card(i,trip,compact=false){
  const [icon,label]=kindInfo[i.kind]||kindInfo.activity;
  return '<button type="button" class="trip-item kind-'+esc(i.kind)+(compact?' compact':'')+'" data-detail="'+esc(i.key)+'"><span class="item-icon" aria-hidden="true">'+iconFor(i.kind)+'</span><span class="item-main"><span class="item-kicker">'+esc(i.stayAction||label)+(compact?'':' · '+esc(eventTime(i,trip)))+'</span><strong>'+esc(i.walletTitle||i.title)+'</strong>'+(i.subtitle?'<span class="item-subtitle">'+esc(i.subtitle)+'</span>':'')+privateMark(i.records)+'</span><span class="item-end">'+status(i.status)+'<span class="item-chevron" aria-hidden="true">›</span></span></button>';
}
export function renderPlan(trip,data,{expandedDay=null,today='',canEdit=false,canShare=false,showTasks=true}={}){
  const model=buildTripView(trip,data),dates=[...model.byDate.keys()];
  const open=(data.tasks||[]).filter(t=>t.status!=='done').length;
  const before=today&&today<trip.start_date,days=before?Math.ceil((Date.parse(trip.start_date)-Date.parse(today))/86400000):null;
  const summary=before?days+' days to go':today>=trip.start_date&&today<=trip.end_date?'You’re travelling':'Your trip, day by day';
  const summaryHtml='<div class="plan-overview"><div><span class="eyebrow">'+esc(summary)+'</span><p>'+dates.length+' days · '+model.stays.length+' stays</p></div>'+(showTasks?'<button class="button button-small" data-tab="tasks">'+open+' to do ↗</button>':'')+'</div>';
  const controls='<div class="plan-toolbar"><button class="button button-small" data-plan-day="'+esc(dates.includes(today)?today:dates[0]||'')+'">'+(dates.includes(today)?'Today':'First day')+'</button>'+(canShare?'<button class="button button-small" data-action="share-itinerary">Share table</button>':'')+(canEdit?'<details class="add-menu"><summary class="button button-primary button-small">+ Add</summary><div><button data-action="new-activity">Activity</button><button data-action="new-stop">Stay</button><button data-action="new-booking">Booking</button><button data-action="new-leg">Journey</button></div></details>':'')+'</div>';
  let previous=null;
  const list=dates.map(date=>{
    const {events,stay}=model.byDate.get(date),base=stay?.subtitle||stay?.title||trip.destination||'Travel day';
    const heading=base!==previous?'<div class="plan-base"><span class="base-dot"></span>'+esc(base)+'</div>':'';previous=base;
    const highlights=events.filter(i=>i.kind!=='stay').slice(0,2).map(i=>i.title).join(' · ')||(events.length?events.map(i=>i.stayAction).filter(Boolean).join(' · '):'Time to explore');
    const selected=expandedDay===date,dayNumber=new Date(date+'T12:00Z').getUTCDate(),weekday=new Date(date+'T12:00Z').toLocaleDateString('en-GB',{weekday:'short',timeZone:'UTC'});
    const dots=[...new Set(events.map(i=>i.kind))].map(k=>'<span class="kind-dot kind-'+k+'" aria-label="'+kindInfo[k][1]+'"></span>').join('');
    const tonight=stay&&!events.some(i=>i.key===stay.key&&i.stayAction==='Check in')?'<div class="tonight-strip"><span>Tonight</span>'+card(stay,trip,true)+'</div>':'';
    return heading+'<section class="plan-day '+(selected?'expanded ':'')+(date===today?'is-today':'')+'"><button type="button" class="plan-day-toggle" data-plan-day="'+date+'" aria-expanded="'+selected+'" aria-controls="day-'+date+'"><span class="plan-date"><b>'+dayNumber+'</b><small>'+esc(weekday)+'</small></span><span class="plan-day-text"><strong>'+esc(day(date))+(date===today?' · Today':'')+'</strong><span>'+esc(highlights)+'</span></span><span class="day-dots">'+dots+'</span><span class="expand-icon" aria-hidden="true">'+(selected?'−':'+')+'</span></button>'+(selected?'<div class="plan-day-content" id="day-'+date+'"><h2 class="sr-only">'+esc(fullDay(date))+'</h2>'+(events.length?'<div class="plan-events">'+events.map(i=>card(i,trip)).join('')+'</div>':'<p class="open-day">No fixed plans. Enjoy some time to explore.</p>')+tonight+'</div>':'')+'</section>';
  }).join('');
  const legend='<div class="plan-legend" aria-label="Item colours">'+Object.entries(kindInfo).filter(([k])=>k!=='document').map(([k,[icon,label]])=>'<span><i class="kind-dot kind-'+k+'"></i>'+esc(label)+'</span>').join('')+'</div>';
  return summaryHtml+controls+legend+(dates.length?'<div class="plan-list">'+list+'</div>':'<div class="empty">Set your trip dates to start planning.</div>')+(model.flexible.length?'<section class="flexible-section"><h2>Flexible plans</h2><p>Choose a day when you’re ready.</p>'+model.flexible.map(i=>card(i,trip,true)).join('')+'</section>':'');
}
export function renderWallet(trip,data,{search='',filter='all',canEdit=false,isPublic=false}={}){
  const m=buildTripView(trip,data),labels=[['all','All'],['stay','Stays'],['travel','Travel'],['activity','Activities'],['document','Documents']];
  const rows=m.wallet.filter(i=>(filter==='all'||i.kind===filter||(filter==='activity'&&i.kind==='meal'))&&[i.title,i.walletTitle,i.subtitle,i.booking?.booking_reference,...i.assets.map(a=>a.title)].join(' ').toLowerCase().includes(search.toLowerCase()));
  return '<div class="wallet-heading"><p>'+(isPublic?'Booking dates and providers. Full confirmations are available to trip members.':'Your confirmations and tickets, ready when you need them.')+'</p>'+(canEdit?'<button class="button button-primary button-small" data-action="new-booking">+ Booking</button>':'')+'</div><label class="sr-only" for="wallet-search">Search wallet</label><input class="filter-search wallet-search" id="wallet-search" type="search" placeholder="Find a booking or ticket" value="'+esc(search)+'"><div class="wallet-filters" aria-label="Wallet categories">'+labels.map(([key,label])=>'<button class="filter-chip '+(filter===key?'active':'')+'" aria-pressed="'+(filter===key)+'" data-wallet-filter="'+key+'">'+label+'</button>').join('')+'</div><div class="wallet-list">'+(rows.length?rows.map(i=>'<div class="wallet-entry"><span class="wallet-date">'+esc(day(i.date))+'</span>'+card(i,trip,true)+'</div>').join(''):'<div class="empty"><strong>No matching bookings or tickets</strong><p>Try another category or search.</p></div>')+'</div>';
}
function fact(label,value){return value?'<div class="detail-fact"><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>':'';}
function buttonLink(url,label){const u=safe(url);return u?'<a class="button button-small" target="_blank" rel="noopener noreferrer" href="'+esc(u)+'">'+esc(label)+' ↗</a>':'';}
export function renderItemDetail(item,trip,{canEdit=false}={}){
  const [icon,label]=kindInfo[item.kind]||kindInfo.activity,b=item.booking,a=item.activity,s=item.stop;
  const address=b?.address||a?.address||'',map=b?.map_url||a?.map_url||(address?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address):'');
  const notes=[];for(const r of item.records){if(r.row.notes&&!notes.some(n=>n.text===r.row.notes))notes.push({text:r.row.notes,label:r.type==='booking'?'Booking':r.type==='stop'?'Stay':r.type==='leg'?'Journey':'Notes',private:r.row.visibility==='private'});}
  const distinctRecords=item.records.filter((r,i,arr)=>arr.findIndex(x=>x.type===r.type&&x.id===r.id)===i);
  return '<div class="detail-grip" aria-hidden="true"></div><div class="detail-heading"><div><span class="detail-kind kind-'+item.kind+'">'+iconFor(item.kind)+' '+label+'</span><h2 id="item-detail-title">'+esc(item.title)+'</h2>'+privateMark(item.records)+'</div><button class="icon-button" data-action="close-detail" aria-label="Close details">✕</button></div><div class="detail-status">'+status(item.status)+'</div><dl class="detail-facts">'+fact('When',item.date?day(item.date)+(item.endDate?' – '+day(item.endDate):''):'')+fact('Time',a?.starts_at?clock(a.starts_at,trip.timezone)+(a.ends_at?' – '+clock(a.ends_at,trip.timezone):''):'')+fact('Where',s?.location||a?.location||address||item.subtitle)+fact('Address',address)+fact('Check-in',b?.check_in_time?String(b.check_in_time).slice(0,5):'')+fact('Check-out',b?.check_out_time?String(b.check_out_time).slice(0,5):'')+fact('Reference',b?.booking_reference)+fact('Cost',b?.amount!=null?(b.currency||trip.currency||'')+' '+Number(b.amount).toLocaleString('en-GB',{minimumFractionDigits:2}):'')+'</dl><div class="detail-links">'+buttonLink(map,'Map')+(item.kind==='stay'?buttonLink(s?.listing_url||b?.listing_url,'Listing / website'):'')+buttonLink(b?.confirmation_url,'Confirmation')+'</div>'+(item.legs?.length?'<section class="detail-section"><h3>Journey connections</h3>'+item.legs.map(l=>'<div class="connection"><strong>'+esc(l.departure_name)+' → '+esc(l.arrival_name)+'</strong><span>'+esc([clock(l.departs_at,l.departure_timezone||trip.timezone),clock(l.arrives_at,l.arrival_timezone||trip.timezone)].filter(Boolean).join(' – '))+'</span><p>'+esc([l.operator,l.service_number,l.platform&&'Platform '+l.platform,l.carriage&&'Carriage '+l.carriage,l.seat&&'Seat '+l.seat].filter(Boolean).join(' · '))+'</p></div>').join('')+'</section>':'')+(item.assets.length?'<section class="detail-section"><h3>Tickets & documents</h3>'+item.assets.map(asset=>'<div class="asset-row"><div><strong>'+esc(asset.title)+'</strong>'+(asset.visibility==='private'?'<span class="privacy-mark">🔒 Private</span>':'')+'</div>'+((asset.mime_type==='application/x-qr-payload'||asset.data_url?.startsWith('data:image/'))?'<button class="button button-small" data-action="open-asset" data-id="'+esc(asset.id)+'">Show ticket</button>':buttonLink(asset.data_url,'Open document'))+'</div>').join('')+'</section>':'')+notes.map(n=>'<details class="detail-note"><summary>'+esc(n.label)+(n.private?' · 🔒 Private':'')+'</summary><p>'+esc(n.text)+'</p></details>').join('')+(canEdit?'<section class="detail-section detail-edit"><h3>Manage this item</h3>'+distinctRecords.map(r=>'<button class="button button-small" data-action="edit-'+r.type+'" data-id="'+esc(r.id)+'">Edit '+esc(({stop:'stay',leg:'journey',asset:'attachment'}[r.type]||r.type))+'</button>').join('')+'</section>':'');
}
