import { costEntries, renderCosts, splitRow, validateExpense, equalShares, percentShare } from "./costs.js?v=4";
import { navigationIcon, buildTripView, renderPlan as renderUnifiedPlan, renderWallet, renderItemDetail } from "./trip-view.js?v=3";
import { sharedData } from "./privacy-ui.js?v=1";
/* Trip Planner v1 — plain browser JavaScript; no private trip data in source control. */
import { buildItineraryExportRows, makeItineraryPng } from "./itinerary-export.js?v=2";
const $ = selector => document.querySelector(selector);
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const config = window.TRIP_PLANNER_CONFIG || {};
const isDemo = new URLSearchParams(location.search).get("demo") === "1";
const NAV = [["plan","◇","Plan"],["tasks","☑","Tasks"],["wallet","▤","Wallet"],["costs","£","Costs"],["more","⋯","More"]];
const TABLE = {task:"tasks",stop:"trip_stops",activity:"activities",booking:"bookings",decision:"decisions",trip:"trips",invite:"trip_invitations",leg:"transport_legs",asset:"trip_assets",expense:"trip_expenses"};
const PRIORITIES = [["1","Urgent"],["2","High"],["3","Normal"]];
const STATUSES = {
  task:[["todo","To do"],["doing","In progress"],["blocked","Blocked"],["done","Done"]],
  stop:[["planned","To book"],["shortlisted","Shortlisted"],["booked","Booked"],["cancelled","Cancelled"]],
  activity:[["planned","Planned"],["booked","Booked"],["done","Done"],["dropped","Dropped"]],
  booking:[["pending","To book"],["booked","Booked"],["cancelled","Cancelled"]],
  decision:[["open","Open"],["confirmed","Confirmed"],["dropped","Dropped"]]
};
const FIELD = (name,label,type="text",opts={}) => ({name,label,type,...opts});
const FIELDS = {
  trip:[FIELD("title","Trip name","text",{required:true,full:true}),FIELD("destination","Destination"),FIELD("start_date","Departure date","date",{required:true}),FIELD("end_date","Return date","date",{required:true}),FIELD("timezone","Time zone","text",{placeholder:"Asia/Tokyo"}),FIELD("currency","Default currency","text",{placeholder:"GBP"}),FIELD("notes","Notes","textarea",{full:true})],
  task:[FIELD("title","What needs doing?","text",{required:true,full:true}),FIELD("category","Category","text",{placeholder:"Accommodation",required:true}),FIELD("priority","Priority","select",{options:PRIORITIES}),FIELD("status","Status","select",{options:STATUSES.task}),FIELD("due_date","Target date","date"),FIELD("notes","Details","textarea",{full:true})],
  stop:[FIELD("location","Destination or overnight base","text",{required:true,full:true}),FIELD("starts_on","Arrive / check in","date",{required:true}),FIELD("ends_on","Leave / check out","date",{required:true}),FIELD("accommodation_name","Property or hotel","text",{full:true}),FIELD("status","Status","select",{options:STATUSES.stop}),FIELD("notes","Notes","textarea",{full:true})],
  activity:[FIELD("title","Activity or journey","text",{required:true,full:true}),FIELD("activity_date","Date","date"),FIELD("type","Type","select",{options:[["sightseeing","Sightseeing"],["theme_park","Theme park"],["transport","Transport"],["meal","Meal"],["other","Other"]]}),FIELD("location","Location","text",{full:true}),FIELD("status","Status","select",{options:STATUSES.activity}),FIELD("notes","Notes","textarea",{full:true})],
  booking:[FIELD("title","Booking name","text",{required:true,full:true}),FIELD("category","Type","select",{options:[["flight","Flight"],["accommodation","Accommodation"],["transport","Transport"],["activity","Activity"],["parking","Parking"],["insurance","Insurance"],["other","Other"]]}),FIELD("status","Status","select",{options:STATUSES.booking}),FIELD("provider","Provider","text",{full:true}),FIELD("start_date","From","date"),FIELD("end_date","To","date"),FIELD("amount","Amount","number",{step:"0.01",min:"0"}),FIELD("currency","Currency","text",{placeholder:"GBP"}),FIELD("booking_reference","Reference","text",{full:true}),FIELD("confirmation_url","Confirmation link","url",{full:true}),FIELD("notes","Details / what's included","textarea",{full:true})],
  decision:[FIELD("subject","Decision","text",{required:true,full:true}),FIELD("status","Status","select",{options:STATUSES.decision}),FIELD("outcome","Agreed outcome","textarea",{required:true,full:true}),FIELD("notes","Context or next steps","textarea",{full:true})],
  invite:[FIELD("email","Person's email","email",{required:true,full:true}),FIELD("role","Access","select",{options:[["viewer","Read only"],["editor","Can edit"]]})]
};
FIELDS.stop.push(FIELD("listing_url","Public listing / hotel website","url",{full:true,placeholder:"https://…"}));
FIELDS.booking.push(FIELD("listing_url","Public listing / website","url",{full:true,placeholder:"https://…"}));
FIELDS.leg=[FIELD("departure_name","From","text",{required:true}),FIELD("arrival_name","To","text",{required:true}),FIELD("activity_date","Date","date",{required:true}),FIELD("notes","Notes","textarea",{full:true})];
FIELDS.expense=[FIELD("title","Cost name","text",{required:true,full:true}),FIELD("amount","Total cost","number",{required:true,min:"0",step:"any"}),FIELD("currency","Currency","text",{required:true,placeholder:"GBP / JPY"}),FIELD("paid_by","Person paying the vendor","text",{required:true,full:true}),FIELD("vendor_paid","Paid to vendor so far","number",{min:"0",step:"any",placeholder:"Blank = not recorded"}),FIELD("due_date","Vendor payment due (optional)","date"),FIELD("notes","Notes","textarea",{full:true})];
FIELDS.asset=[FIELD("title","Attachment title","text",{required:true,full:true})];
for(const type of ["task","stop","activity","booking","decision","leg","asset","expense"]){
  FIELDS[type].push(FIELD("visibility","Visibility","select",{options:[["shared","Shared — trip members"],["private","Private — owner and selected members"]],full:true}));
}
const state={costSummaryOpen:localStorage.getItem('trip-planner-cost-summary-open')==='1',costCurrency:localStorage.getItem('trip-planner-cost-currency')==='JPY'?'JPY':'GBP',preview:false,members:[],client:null,user:null,trips:[],tripId:null,tab:"plan",moreTab:"decisions",filter:"open",category:"all",search:"",selectedDay:null,detailKey:null,walletSearch:"",walletFilter:"all",ticketIndex:0,data:{tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],trip_expenses:[]},invites:[],member:null,demo:isDemo,busy:false,refreshVersion:0,channel:null};
const day=date => date ? new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}) : "Date TBC";
const longDay=date => date ? new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}) : "Date TBC";
const nights=(from,to)=>from&&to?Math.max(0,Math.round((Date.parse(to+"T00:00:00Z")-Date.parse(from+"T00:00:00Z"))/86400000)):0;
const until=date=>{if(!date)return "—";const n=new Date();const t=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());return Math.max(0,Math.ceil((Date.parse(date+"T00:00:00Z")-t)/86400000));};
const uid=()=>crypto.randomUUID();
const trip=()=>state.trips.find(t=>t.id===state.tripId);
const canEdit=()=>!state.preview && (state.demo || !!(trip() && (trip().created_by===state.user?.id || state.member?.role==="owner" || state.member?.role==="editor")));
const isOwner=()=>state.demo || !!(trip() && trip().created_by===state.user?.id);
const item=(type,id)=>type==="trip"?trip():type==="invite"?state.invites.find(v=>v.id===id):type==='expense'&&id?.startsWith('booking:')?costEntries(state.data,{paidBy:state.demo?'Me':(state.user?.user_metadata?.full_name||'Trip owner')}).find(v=>v.id===id):state.data[TABLE[type]].find(v=>v.id===id);
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==="https:"||u.protocol==="http:"?u.href:"";}catch{return "";}};
const link=(url,label)=>{const safe=safeUrl(url);return safe?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safe)+'">'+esc(label)+" ↗</a>":"";};
const label=(type,value)=> (type==="priority"?PRIORITIES:STATUSES[type]||[]).find(x=>x[0]===String(value))?.[1]||String(value||"");
const pill=(value,type)=>'<span class="pill '+esc(value==="todo"?"planned":value===1?"urgent":value===2?"high":value)+'">'+esc(type?label(type,value):value)+'</span>';
let toastTimer;
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3500);}
function fail(error){console.error(error);toast(error?.message||"Something went wrong. Please try again.");}
function demoFixture(){
  const t={id:uid(),title:"Sample winter holiday",destination:"Japan",start_date:"2027-02-01",end_date:"2027-02-12",timezone:"Asia/Tokyo",currency:"GBP",notes:"Fictional example. Import your private trip data once cloud storage is connected.",created_by:"demo"};
  const d={tasks:[
    {id:uid(),title:"Find a family-friendly base",category:"Accommodation",priority:1,status:"todo",due_date:"",notes:"Compare locations and cancellation terms."},
    {id:uid(),title:"Plan the intercity rail journeys",category:"Transport",priority:2,status:"todo",due_date:"",notes:"Check routes before reserving."},
    {id:uid(),title:"Compare park ticket options",category:"Activities",priority:3,status:"done",due_date:"",notes:"Example completed task."}
  ],trip_stops:[
    {id:uid(),location:"Tokyo",starts_on:"2027-02-02",ends_on:"2027-02-07",status:"planned",accommodation_name:"",notes:"Example city stay."},
    {id:uid(),location:"Kyoto",starts_on:"2027-02-07",ends_on:"2027-02-11",status:"planned",accommodation_name:"",notes:"Example city stay."}
  ],activities:[{id:uid(),title:"Explore the old city",location:"Kyoto",activity_date:"2027-02-08",type:"sightseeing",status:"planned",notes:"Example activity."}],
  bookings:[],decisions:[{id:uid(),subject:"Which cities to visit?",outcome:"Tokyo and Kyoto",status:"confirmed",notes:"Example decision."}],transport_legs:[],trip_assets:[],trip_expenses:[]};
  d.trip_stops[0].accommodation_name="City apartment Tokyo";
  d.trip_stops[1].accommodation_name="Garden House Kyoto";
  const stayId=uid(),railId=uid(),activityId=uid();
  d.bookings=[{id:stayId,title:"Garden House Kyoto",category:"accommodation",provider:"Example host",start_date:"2027-02-07",end_date:"2027-02-11",status:"booked",stop_id:d.trip_stops[1].id,check_in_time:"16:00",check_out_time:"10:00",address:"Example address, Kyoto",booking_reference:"DEMO-ONLY",notes:"Fictional confirmation for exploring the app."},{id:railId,title:"Tokyo to Kyoto rail journey",category:"transport",provider:"Example railway",status:"booked",start_date:"2027-02-07",end_date:"2027-02-07",booking_reference:"DEMO-RAIL"}];
  d.activities.push({id:activityId,title:"Travel to Kyoto",type:"transport",activity_date:"2027-02-07",location:"Tokyo → Kyoto",status:"booked",booking_id:railId});
  d.transport_legs=[{id:uid(),activity_date:"2027-02-07",departure_name:"Tokyo",arrival_name:"Kyoto",departs_at:"2027-02-07T01:00:00Z",arrives_at:"2027-02-07T03:15:00Z",mode:"shinkansen",booking_id:railId,reservation_status:"booked",operator:"Example railway",service_number:"Demo service",seat:"12A",notes:"Illustrative times only."}];
  d.trip_assets=[{id:uid(),title:"Example rail ticket",kind:"ticket_qr",mime_type:"application/x-qr-payload",data_url:"qr:DEMO-ONLY-NOT-A-VALID-TICKET",booking_id:railId,activity_id:activityId}];
  d.bookings[0].amount=500;d.bookings[0].currency='GBP';
  d.trip_expenses=[{id:uid(),trip_id:t.id,title:'Example rail tickets',due_date:'2027-01-25',amount:240,currency:'GBP',paid_by:'Me',vendor_paid:240,visibility:'shared',splits:[{person:'Alex',share:80,repaid:30}]}];
  return {t,d};
}
async function init(){
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
    navigator.serviceWorker.register("./sw.js?v=20",{updateViaCache:"none"}).catch(()=>{});
  }
  if(state.demo){const v=demoFixture();state.trips=[v.t];state.tripId=v.t.id;state.data=v.d;render();return;}
  if(!(config.url && config.publishableKey)){
    $("#app").className="";
    $("#app").innerHTML='<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><h1>Update needed</h1><p>This device has not loaded the current app configuration. Connect to the internet and reload to access your private trips.</p><button class="button button-primary" onclick="location.reload()">Reload app</button></div></div>';
    return;
  }
  try{
    const module=await import("https://esm.sh/@supabase/supabase-js@2.117.1?bundle");
    state.client=module.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await state.client.auth.getSession();
    if(error)throw error;
    state.user=data.session?.user||null;
    state.client.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){closePrivateDialogs();state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],trip_expenses:[]};state.members=[];state.invites=[];state.preview=false;state.user=null;state.trips=[];state.tripId=null;state.channel&&state.client.removeChannel(state.channel);state.channel=null;render();return;}
      if(session?.user && state.user?.id!==session.user.id){state.user=session.user;setTimeout(()=>loadTrips().catch(fail),0);}
    });
    if(state.user)await loadTrips();
    else render();
  }catch(error){$("#app").innerHTML='<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><h1>Could not connect</h1><p>'+esc(error?.message||"Check your connection and browser configuration.")+'</p><button class="button button-primary" onclick="location.reload()">Retry</button></div></div>';}
}
async function authEmail(email){
  const {error}=await state.client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:true}});
  if(error)throw error;
}
async function claimInvitations(){
  const {error}=await state.client.rpc("claim_trip_invitations");
  if(error)throw error;
}
async function loadTrips(){
  if(!state.user)return;
  await claimInvitations();
  const {data,error}=await state.client.from("trips").select("*").order("start_date",{ascending:true});
  if(error)throw error;
  state.trips=data||[];
  const last=localStorage.getItem("trip-planner-last-trip");
  state.tripId=state.trips.some(t=>t.id===state.tripId)?state.tripId:(state.trips.find(t=>t.id===last)?.id||state.trips[0]?.id||null);
  if(state.tripId)await loadTrip();
  else{state.member=null;state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],trip_expenses:[]};render();}
}
async function loadTrip(){
  const id=state.tripId;if(!id)return;
  const current=++state.refreshVersion;
  if(state.preview){
    const snapshot=await state.client.rpc("preview_shared_trip",{p_trip_id:id});
    if(snapshot.error)throw snapshot.error;
    if(current!==state.refreshVersion||id!==state.tripId||!state.preview)return;
    state.data=snapshot.data;subscribe(id);render();return;
  }
  const jobs=[
    ...["tasks","trip_stops","activities","bookings","decisions","transport_legs","trip_assets","trip_expenses"].map(name=>state.client.from(name).select("*").eq("trip_id",id)),
    isOwner()?state.client.rpc("trip_member_directory",{p_trip_id:id}):state.client.from("trip_members").select("*").eq("trip_id",id)
  ];
  if(isOwner())jobs.push(state.client.from("trip_invitations").select("*").eq("trip_id",id).order("created_at",{ascending:false}));
  const results=await Promise.all(jobs);
  if(current!==state.refreshVersion||id!==state.tripId)return;
  for(const result of results)if(result.error)throw result.error;
  const loadedData=Object.fromEntries(["tasks","trip_stops","activities","bookings","decisions","transport_legs","trip_assets","trip_expenses"].map((key,i)=>[key,results[i].data||[]]));
  state.members=results[8].data||[];
  state.member=state.members.find(m=>m.user_id===state.user.id);
  state.data=loadedData;
  state.invites=isOwner()?results[9].data||[]:[];
  localStorage.setItem("trip-planner-last-trip",id);
  subscribe(id);
  render();
}
function subscribe(id){
  if(state.demo||!state.client)return;
  if(state.channel){state.client.removeChannel(state.channel);state.channel=null;}
  // Realtime is optional: visibility changes and a manual refresh also reload shared data.
  let schedule;
  const channel=state.client.channel("trip-"+id);
  ["tasks","trip_stops","activities","bookings","decisions","transport_legs","trip_assets","trip_expenses","trip_invitations"].forEach(table=>
    channel.on("postgres_changes",{event:"*",schema:"public",table,filter:"trip_id=eq."+id},()=>{
      clearTimeout(schedule);schedule=setTimeout(()=>{if(state.tripId===id)loadTrip().catch(fail);},450);
    })
  );
  state.channel=channel.subscribe();
}
function nav(){return NAV.map(([id,ico,title])=>'<button type="button" class="nav-link '+(state.tab===id?"active":"")+'" data-tab="'+id+'" aria-label="'+title+'" aria-current="'+(state.tab===id?"page":"false")+'"><span class="nav-ico">'+navigationIcon(id)+'</span><span class="nav-label">'+title+"</span></button>").join("");}
function render(){
  if(!state.demo&&!state.user){renderAuth();return;}
  const t=trip();
  const names={plan:"Your plan",tasks:"Checklist",wallet:"Travel wallet",costs:"Trip costs",more:"Trip details"};
  const title=t?names[state.tab]:"Your trips";
  const back=state.trips.length>1?'<button class="icon-button" data-action="trips" title="Switch trip" aria-label="Switch trip">⇄</button>':"";
  $("#app").className="";
  $("#app").innerHTML='<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><nav class="side-nav" aria-label="Main">'+nav()+'</nav><div class="side-foot"><small>'+esc(state.user?.email||"Demo mode")+'</small><button class="button button-small" data-action="trips">Switch / add trip</button></div></aside><main class="main view-'+esc(state.tab)+'"><div class="topline"><div class="topline-left"><p class="eyebrow">'+esc(t?.title||"TRIP PLANNER")+'</p><h1>'+esc(title)+'</h1><p class="sub">'+esc(t?.destination||"Plan your next adventure")+(t?.start_date?" · "+esc(day(t.start_date))+" – "+esc(day(t.end_date)):"")+'</p></div><div class="head-actions">'+back+'<button class="icon-button" data-action="refresh" title="Refresh" aria-label="Refresh">↻</button></div></div>'+
    (state.preview?'<div class="status-banner"><strong>Shared member preview</strong> — read-only access with no private grants. <button class="button button-small" data-action="preview-shared">Exit preview</button></div>':'')+
    (state.demo?'<div class="status-banner"><strong>Preview only.</strong> These are fictional examples. Changes are not saved and no personal information is stored. Connect your own Supabase project to activate private, shared trips.</div>':!navigator.onLine?'<div class="status-banner"><strong>Offline.</strong> Your private trip data needs a network connection.</div>':"")+
    (!t && state.tab!=="more"?renderNoTrips():state.tab==="plan"?renderPlanView():state.tab==="tasks"?renderTasks():state.tab==="wallet"?renderWallet(trip(),state.data,{search:state.walletSearch,filter:state.walletFilter,canEdit:canEdit()}):state.tab==="costs"?renderCosts(state.data,{canEdit:canEdit(),filter:state.costFilter||"all",today:tripToday(),expandedId:state.costOpen,summaryCurrency:state.costCurrency,summaryOpen:state.costSummaryOpen,paidBy:state.demo?"Me":(state.user?.user_metadata?.full_name||"Trip owner")}):renderMore())+
    '</main><nav class="bottom-nav" aria-label="Main">'+nav()+'</nav></div>';
  syncItemDetail();
}
function renderAuth(){
  $("#app").className="";
  $("#app").innerHTML='<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><p class="eyebrow">YOUR NEXT ADVENTURE</p><h1>Your trips, in one place.</h1><p>Sign in to access your private plans, bookings and shared checklists.</p>'+
    '<form id="auth-form"><div class="field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><button class="button button-primary" type="submit">Send sign-in email</button><p id="auth-message" class="hint" role="status"></p><div class="field" id="otp-section" hidden><label for="auth-token">Email code (if included)</label><input id="auth-token" name="token" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" placeholder="123456"><button class="button" type="button" id="verify-token">Verify code</button></div></form>'+
    '<details class="auth-password-details"><summary>Sign in with a password instead</summary><p class="hint">Already set a password? Use it here; you do not need email access on this device.</p><form id="password-auth-form"><div class="field"><label for="password-auth-email">Email address</label><input id="password-auth-email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required></div><div class="field"><label for="password-auth-password">Password</label><input id="password-auth-password" name="password" type="password" autocomplete="current-password" required></div><button class="button button-primary" type="submit">Sign in with password</button><p id="password-auth-message" class="hint" role="alert"></p></form><p class="hint">Need to set one? Open a sign-in email on your phone, then go to More → Settings → Account &amp; connection.</p></details>'+
    '<p class="hint">The sign-in email link opens on the device where you tap it. You can also sign in here with a password once you have set one.</p></div></div>';
}
function renderNoTrips(){return '<div class="empty"><strong>No trips yet</strong><p>Create a new holiday or import your private trip backup directly.</p><button class="button button-primary" data-action="new-trip">Create trip</button> <button class="button" data-action="import">Import trip JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div>';}
function taskSort(a,b){return Number(a.priority||3)-Number(b.priority||3)||String(a.due_date||"9999").localeCompare(String(b.due_date||"9999"))||String(a.title).localeCompare(String(b.title));}

function tripToday(){
  const t=trip();if(!t)return null;
  try{
    const parts=new Intl.DateTimeFormat("en-CA",{timeZone:t.timezone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));
    return p.year+"-"+p.month+"-"+p.day;
  }catch{return new Date().toISOString().slice(0,10);}
}
function tripDates(){
  const t=trip();if(!t?.start_date||!t?.end_date)return[];
  const out=[];let d=new Date(t.start_date+"T12:00:00Z"),end=new Date(t.end_date+"T12:00:00Z");
  while(d<=end){out.push(d.toISOString().slice(0,10));d=new Date(d.getTime()+86400000);}
  return out;
}
function activeDay(){
  const dates=tripDates(),t=trip();if(!dates.length)return null;
  if(state.selectedDay&&dates.includes(state.selectedDay))return state.selectedDay;
  const today=tripToday();
  state.selectedDay=dates.includes(today)?today:(today<t.start_date?t.start_date:t.end_date);
  return state.selectedDay;
}
function fullDay(date){
  return new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});
}
function shortWeekday(date){
  return new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",timeZone:"UTC"});
}
function clock(ts,tz){
  if(!ts)return "";
  try{return new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:tz||trip()?.timezone||"UTC"}).format(new Date(ts));}
  catch{return new Date(ts).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}
}
function dayStop(date){
  return state.data.trip_stops.find(s=>s.status!=="cancelled"&&date>=s.starts_on&&date<s.ends_on)||null;
}
function taskRow(v,isOverview=false){
  return '<div class="task-row '+(isOverview?'home-task':'')+'"><input class="task-check" type="checkbox" data-task-check="'+esc(v.id)+'" aria-label="Complete '+esc(v.title)+'" '+(v.status==="done"?"checked ":"")+(canEdit()?"":"disabled ")+'><div class="task-body"><span class="task-title '+(v.status==="done"?"complete":"")+'">'+esc(v.title)+privacyBadge(v)+'</span><div class="task-meta"><span>'+esc(v.category||"General")+'</span>'+pill(v.priority||3,"priority")+(v.due_date?'<span>Due '+esc(day(v.due_date))+'</span>':"")+(v.status==="blocked"?pill("blocked"):"")+'</div>'+(v.notes?'<details class="task-notes"><summary>Details</summary><p>'+esc(v.notes)+'</p></details>':"")+'</div>'+(canEdit()?'<div class="row-actions"><button class="icon-button" data-action="edit-task" data-id="'+esc(v.id)+'" aria-label="Edit task">✎</button></div>':"")+'</div>';
}
function renderTasks(){
  const cats=[...new Set(state.data.tasks.map(t=>t.category||"General"))].sort();
  let filtered=state.data.tasks.filter(t=>(state.filter==="all"||(state.filter==="open"?t.status!=="done":t.status===state.filter))&&(state.category==="all"||(t.category||"General")===state.category)&&(t.title+" "+(t.notes||"")).toLowerCase().includes(state.search.toLowerCase())).sort(taskSort);
  return '<div class="section-head"><div><h2>All tasks</h2><p>Search, tick off and prioritise everything.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-task">+ New task</button>':"")+'</div><div class="filters"><input class="filter-search" id="task-search" type="search" placeholder="Search checklist" aria-label="Search tasks" value="'+esc(state.search)+'"><select class="filter-select" data-filter="status" aria-label="Task status">'+[["open","Outstanding"],["all","All statuses"],["todo","To do"],["doing","In progress"],["blocked","Blocked"],["done","Completed"]].map(([id,n])=>'<option value="'+id+'" '+(state.filter===id?"selected":"")+'>'+n+'</option>').join("")+'</select><select class="filter-select" data-filter="category" aria-label="Task category"><option value="all">All categories</option>'+cats.map(c=>'<option '+(state.category===c?"selected":"")+' value="'+esc(c)+'">'+esc(c)+'</option>').join("")+'</select></div><div class="stack">'+(filtered.length?filtered.map(taskRow).join(""):emptySmall("No matching tasks","Try another filter or add a task.",canEdit()?"new-task":"",canEdit()?"Add task":""))+'</div>';
}
function renderPlanView(){if(state.planTrip!==state.tripId){state.planTrip=state.tripId;const today=tripToday();if(tripDates().includes(today))state.selectedDay=today;}return renderUnifiedPlan(trip(),state.data,{expandedDay:state.selectedDay,today:tripToday(),canEdit:canEdit(),canShare:true});}
function openItemDetail(key){
  const model=buildTripView(trip(),state.data),record=model.details.get(key);if(!record)return toast("This item is no longer available.");
  state.detailKey=key;$("#item-detail-body").innerHTML=renderItemDetail(record,trip(),{canEdit:canEdit()});
  if(!$("#item-detail").open)$("#item-detail").showModal();
}
function closeItemDetail(){state.detailKey=null;$("#item-detail")?.close();$("#item-detail-body").innerHTML="";}
function syncItemDetail(){
  if(state.detailKey){const record=trip()&&buildTripView(trip(),state.data).details.get(state.detailKey);if(record)$("#item-detail-body").innerHTML=renderItemDetail(record,trip(),{canEdit:canEdit()});else closeItemDetail();}
  if(activeTicketAssets.some(a=>!state.data.trip_assets.some(x=>x.id===a.id))){activeTicketAssets=[];ticketRenderVersion++;$("#ticket-dialog")?.close();$("#ticket-dialog-image")?.removeAttribute("src");}
}
function renderMore(){
  if(!trip())state.moreTab="settings";
  const subtabs=[["decisions","Decisions"],["settings","Settings"]];
  return '<div class="tabs">'+subtabs.map(([id,label])=>'<button class="tab '+(state.moreTab===id?"active":"")+'" data-more="'+id+'">'+label+"</button>").join("")+'</div>'+(state.moreTab==="decisions"?renderDecisions():renderSettings());
}
function renderDecisions(){
  const ordered=[...state.data.decisions].sort((a,b)=>({open:0,confirmed:1,dropped:2}[a.status]||0)-({open:0,confirmed:1,dropped:2}[b.status]||0));
  return '<div class="section-head"><div><h2>Decisions log</h2><p>The agreed plan and what you ruled out.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-decision">+ Decision</button>':"")+'</div><div class="stack">'+(ordered.length?ordered.map(v=>'<div class="panel decision-card"><div class="panel-head"><h3>'+esc(v.subject)+privacyBadge(v)+'</h3>'+pill(v.status||"open","decision")+'</div><p>'+esc(v.outcome)+'</p>'+(v.notes?'<p class="muted">'+esc(v.notes)+'</p>':"")+(canEdit()?'<div><button class="button button-small" data-action="edit-decision" data-id="'+esc(v.id)+'">Edit</button></div>':"")+'</div>').join(""):emptySmall("No decisions recorded","Log a decision when plans change.",canEdit()?"new-decision":"",canEdit()?"Add decision":""))+'</div>';
}
function sharedOnlyData(){return sharedData(state.data);}
function privacyBadge(v){return v.visibility==="private"?'<span class="pill private-badge">🔒 Private</span>':'';}
function closePrivateDialogs(){state.walletSearch="";state.walletFilter="all";state.costFilter="all";state.costOpen=null;state.search="";closeItemDetail();for(const selector of ["#editor","#ticket-dialog","#itinerary-share-dialog"]){const el=$(selector);if(el?.open)el.close();}releaseItineraryPreview();activeTicketAssets=[];ticketRenderVersion++;$("#ticket-dialog-image")?.removeAttribute("src");state.ticketIndex=0;}
function renderPrivacySettings(){
  if(!isOwner()||state.preview)return '';
  const types={tasks:"task",trip_stops:"stop",activities:"activity",bookings:"booking",decisions:"decision",transport_legs:"leg",trip_assets:"asset",trip_expenses:"expense"};
  return '<div class="panel settings-section"><h2>Privacy & access</h2><p>Shared items are visible to trip members. Private items are visible to you and members you select. Linked items inherit their parent’s restrictions. Trip overview notes are shared; put confidential notes in a Private decision.</p><button class="button button-primary" data-action="preview-shared">Preview shared member view</button> <button class="button" data-action="private-note">+ Private note</button><details class="privacy-list"><summary>Manage item privacy</summary>'+Object.entries(types).map(([table,type])=>'<h3>'+esc(table.replaceAll('_',' '))+'</h3>'+(state.data[table]||[]).map(v=>'<div class="task-row"><div class="task-body">'+esc(v.title||v.subject||v.location||[v.departure_name,v.arrival_name].filter(Boolean).join(' → '))+privacyBadge(v)+'<small> '+esc(v.visibility||'shared')+'</small></div><button class="button button-small" data-action="edit-'+type+'" data-id="'+esc(v.id)+'">Edit</button></div>').join('')).join('')+'</details><h3>Current members</h3>'+state.members.filter(m=>m.user_id!==state.user?.id).map(m=>'<div class="task-row"><div class="task-body">Member '+esc(m.email||m.user_id.slice(0,8))+' · '+esc(m.role)+'</div><button class="button button-small" data-action="member-role" data-id="'+esc(m.user_id)+'">'+(m.role==='viewer'?'Allow editing':'Make read only')+'</button><button class="button button-small" data-action="member-remove" data-id="'+esc(m.user_id)+'">Remove</button></div>').join('')+'</div>';
}
async function manageMember(action,id){
  if(!isOwner()||state.preview)return;
  const m=state.members.find(m=>m.user_id===id);if(!m||id===state.user.id)return;
  if(action==='member-remove'&&!confirm('Remove this member’s access to this trip?'))return;
  const q=state.client.from('trip_members');const r=action==='member-remove'?await q.delete().eq('trip_id',state.tripId).eq('user_id',id):await q.update({role:m.role==='viewer'?'editor':'viewer'}).eq('trip_id',state.tripId).eq('user_id',id);
  if(r.error)fail(r.error);else await loadTrip();
}
function renderSettings(){
  if(state.preview)return '<div class="panel"><p>Shared member preview is read only.</p><button class="button" data-action="preview-shared">Exit preview</button></div>';
  const t=trip();
  const trips=state.trips.map(v=>'<button type="button" class="trip-option '+(v.id===state.tripId?"active":"")+'" data-trip="'+esc(v.id)+'"><p class="eyebrow">'+esc(v.destination||"Trip")+'</p><h3>'+esc(v.title)+'</h3><p>'+esc(day(v.start_date))+' – '+esc(day(v.end_date))+'</p></button>').join("");
  return '<div class="panel settings-section"><h2>Your trips</h2><p>Switch trips or create a new holiday using the same planner.</p><div class="trip-list">'+trips+'</div><button class="button button-primary" data-action="new-trip">+ New trip</button> '+(isOwner()?'<button class="button" data-action="edit-trip">Edit current trip</button>':"")+'</div>'+
    renderPrivacySettings()+'<div class="panel settings-section"><h2>Share this trip</h2>'+(!t?'<p>Create a trip before inviting others.</p>':state.demo?'<p>Cloud storage must be connected before inviting other people.</p>':isOwner()?'<p>Invite somebody by email. They can sign in with that exact address and select this trip. No automatic invitation email is sent: share the app link with them yourself.</p><button class="button" data-action="new-invite">+ Invite person</button>'+(state.invites.length?'<div class="stack" style="margin-top:14px">'+state.invites.map(v=>'<div class="task-row"><div class="task-body"><span class="task-title">'+esc(v.email)+'</span><div class="task-meta">'+esc(v.role)+" · "+(v.accepted_at?"Joined":"Pending")+' <button class="button button-small" data-action="cancel-invite" data-id="'+esc(v.id)+'">Remove invitation</button>'+'</div></div></div>').join("")+"</div>":""):'<p>Your trip owner manages invitations. You have '+esc(state.member?.role||"member")+' access.</p>')+'</div>'+
    '<div class="panel settings-section"><h2>Back up and import</h2><p>Exports and itinerary images exclude private records and anything linked to them. Booking references in shared records are included. Cost tracking and repayments are not included in general trip exports or public pages. Import creates a new trip; it never overwrites another holiday.</p><button class="button" data-action="export">Export shared trip</button> <button class="button" data-action="import">Import trip JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div>'+
    '<div class="panel settings-section"><h2>Account & connection</h2><p>'+esc(state.user?.email||"Preview mode")+'</p>'+(state.demo?'<p>This site is a fictional preview. Changes are not saved.</p>':'<form id="account-password-form" class="stack" autocomplete="on"><p class="panel-sub">Set or change your password. Once saved, you can sign in on another device without opening email there.</p><div class="field"><label for="account-new-password">New password (at least 12 characters)</label><input id="account-new-password" type="password" name="password" autocomplete="new-password" minlength="12" required></div><div class="field"><label for="account-confirm-password">Confirm new password</label><input id="account-confirm-password" type="password" name="confirm_password" autocomplete="new-password" minlength="12" required></div><button class="button button-primary" type="submit">Save password</button><p class="hint" id="account-password-message" role="status"></p></form><button class="button" data-action="signout">Sign out</button>')+'</div>';
}
function emptySmall(title,description,action,button){return '<div class="empty"><strong>'+esc(title)+'</strong><p>'+esc(description)+'</p>'+(action?'<button class="button" data-action="'+esc(action)+'">'+esc(button)+'</button>':"")+'</div>';}
function openEditor(type,id){
  closeItemDetail();
  if(state.preview)return toast("Exit preview to make changes.");
  if(!canEdit()&&type!=="trip")return toast("You have read-only access.");
  if(type==="invite"&&!isOwner())return toast("Only the trip owner can invite people.");
  if(type==="trip"&&id&&!isOwner())return toast("Only the trip owner can edit trip details.");
  const virtual=type==='expense'&&id?.startsWith('booking:');
  const v=id?item(type,id):{};if(!v)return;if(virtual)id=null;
  if(type==="expense"&&!id)v.paid_by=state.demo?"Me":(state.user?.user_metadata?.full_name||"Trip owner");
  if(!id&&state.selectedDay){if(type==="activity")v.activity_date=state.selectedDay;if(type==="leg")v.activity_date=state.selectedDay;if(type==="booking")v.start_date=state.selectedDay;if(type==="stop")v.starts_on=state.selectedDay;}
  const stay=!id?null:type==="stop"?buildTripView(trip(),state.data).stays.find(s=>s.stop?.id===id):type==="booking"?buildTripView(trip(),state.data).stays.find(s=>s.booking?.id===id):null;
  const listingOnStay=!!stay?.stop?.listing_url;
  const fields=FIELDS[type]?.filter(f=>(f.name!=="visibility"||isOwner())&&(f.name!=="listing_url"||!(type==="stop"&&stay?.booking&&!listingOnStay)&&!(type==="booking"&&listingOnStay)));if(!fields)return;
  const titles={trip:"Trip",task:"Task",stop:"Stay",activity:"Activity or journey",booking:"Booking",decision:"Decision",invite:"Invitation",leg:"Journey",asset:"Attachment",expense:"Cost"};
  $("#editor-title").textContent=(id||virtual?"Edit ":"Add ")+titles[type];
  $("#editor-form").dataset.type=type;$("#editor-form").dataset.id=id||"";
  $("#editor-fields").innerHTML=fields.map(f=>{
    const value=v?.[f.name]??(f.name==="priority"?"2":f.name==="currency"?(trip()?.currency||"GBP"):f.name==="timezone"?"Asia/Tokyo":f.options?.[0]?.[0]||"");
    const attrs=' name="'+esc(f.name)+'" id="field-'+esc(f.name)+'" '+(f.required?"required ":"")+(f.step?'step="'+esc(f.step)+'" ':"")+(f.min?'min="'+esc(f.min)+'" ':"")+(f.placeholder?'placeholder="'+esc(f.placeholder)+'" ':"");
    const control=f.type==="textarea"?'<textarea'+attrs+' rows="3">'+esc(value)+'</textarea>':f.type==="select"?'<select'+attrs+'>'+f.options.map(([k,n])=>'<option value="'+esc(k)+'" '+(String(k)===String(value)?"selected":"")+'>'+esc(n)+'</option>').join("")+'</select>':'<input type="'+esc(f.type)+'"'+attrs+' value="'+esc(value)+'">';
    return '<div class="field '+(f.full?"full":"")+'"><label for="field-'+esc(f.name)+'">'+esc(f.label)+'</label>'+control+'</div>';
  }).join("");
  if(stay&&(type==="stop"&&stay.booking&&!listingOnStay||type==="booking"&&listingOnStay))$("#editor-fields").insertAdjacentHTML("beforeend",'<p class="hint full">The listing link is managed on the linked '+(listingOnStay?'stay':'booking')+'.</p>');
  if(isOwner()&&FIELDS[type]?.some(f=>f.name==="visibility")){
    $("#editor-fields").insertAdjacentHTML("beforeend",'<fieldset class="field full"><legend>Private access (optional)</legend><p class="hint">The owner always has access. Selected people also need access to any linked private parent. Shared items are visible to every member.</p>'+state.members.filter(m=>m.user_id!==state.user?.id).map(m=>'<label><input type="checkbox" name="private_user_ids" value="'+esc(m.user_id)+'" '+(v?.private_user_ids?.includes(m.user_id)?'checked':'')+'> Member '+esc(m.email||m.user_id.slice(0,8))+' · '+esc(m.role)+'</label>').join('')+'</fieldset>');
  }
  if(type==="expense"){
    const names=[...new Set((state.data.trip_expenses||[]).flatMap(e=>[e.paid_by,...(e.splits||[]).map(s=>s.person)]))];
    $("#editor-fields").insertAdjacentHTML("beforeend",'<section class="full cost-splits-section"><h3>Split this cost</h3><p class="hint">Add the other people sharing this cost. The remainder is the vendor payer’s own share. Repayments go to the person paying the vendor.</p><div id="cost-split-rows">'+(v.splits||[]).map(splitRow).join('')+'</div><datalist id="cost-person-names">'+names.map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist><div class="cost-tools"><button type="button" class="button button-small" data-action="add-cost-split">+ Person</button><button type="button" class="button button-small" data-action="equal-cost-split">Split equally incl. payer</button></div><p class="hint">For percentages, enter 20 for a 20% share. Equal splits assign any rounding remainder to the payer.</p></section>');
    const form=$("#editor-form");form.dataset.bookingId=v.booking_id||"";form.dataset.updatedAt=v.updated_at||"";
  }
  if(type==="expense"){
    const extra=document.createElement('details');extra.className='cost-editor-options full';
    const heading=document.createElement('summary');heading.textContent='Payment details, notes & privacy';extra.append(heading);
    const group=document.createElement('div');group.className='editor-fields';extra.append(group);
    for(const name of ['paid_by','vendor_paid','notes','visibility']){const field=$('#field-'+name)?.closest('.field');if(field)group.append(field);}
    const grants=$('#editor-fields fieldset');if(grants)group.append(grants);
    $('#editor-fields').append(extra);if(id||virtual)extra.open=true;
  }
  $("#editor-error").hidden=true;
  $("#editor-delete").hidden=!id;
  $("#editor").showModal();
  $("#editor-fields").querySelector("input,textarea,select")?.focus();
}
function closeEditor(){$("#editor").close();}
async function saveEditor(event){
  event.preventDefault();
  if(state.busy)return;
  // The submit listener is delegated from document: currentTarget is document, target is the form.
  const form=event.target,type=form.dataset.type,id=form.dataset.id;
  const fd=new FormData(form),data=Object.fromEntries(fd.entries());
  if(isOwner()&&FIELDS[type]?.some(f=>f.name==="visibility"))data.private_user_ids=fd.getAll("private_user_ids");
  if(data.listing_url){const url=safeUrl(data.listing_url.trim());if(!url)return editorError("Use an http or https website link.");data.listing_url=url;}
  if(data.email)data.email=data.email.trim().toLowerCase();
  if(data.start_date&&data.end_date&&data.end_date<data.start_date)return editorError("End date cannot be before the start date.");
  if(data.starts_on&&data.ends_on&&data.ends_on<=data.starts_on)return editorError("Departure must be after arrival.");
  for(const f of FIELDS[type])if(f.type==="date"&&!data[f.name])data[f.name]=null;
  if(type==="task")data.priority=Number(data.priority);
  if(type==="booking")data.amount=data.amount===""?null:Number(data.amount);
  if(type==="expense"){
    try{
      data.vendor_paid=data.vendor_paid===""?null:Number(data.vendor_paid);
      data.booking_id=form.dataset.bookingId||null;
      data.splits=[...$("#cost-split-rows").querySelectorAll('[data-cost-split]')].map(row=>({person:row.querySelector('[data-split-person]').value,share:row.querySelector('[data-split-mode]').value==='percent'?percentShare(data.amount,String(data.currency).trim().toUpperCase(),row.querySelector('[data-split-share]').value):row.querySelector('[data-split-share]').value,repaid:row.querySelector('[data-split-repaid]').value}));
      Object.assign(data,validateExpense(data));
    }catch(error){return editorError(error.message);}
  }
  state.busy=true;$("#editor-submit").disabled=true;
  try{
    if(state.demo){
      if(type==="invite")throw new Error("Connect Supabase to invite people.");
      if(type==="trip"&&!id){const newTrip={...data,id:uid(),created_by:"demo"};state.trips.push(newTrip);state.tripId=newTrip.id;state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],trip_expenses:[]};}
      else if(type==="trip")Object.assign(trip(),data);
      else if(id)Object.assign(item(type,id),data);
      else state.data[TABLE[type]].push({...data,id:uid(),trip_id:state.tripId});
    }else if(type==="invite"){
      const payload={trip_id:state.tripId,email:data.email,role:data.role,created_by:state.user.id};
      const result=await state.client.from("trip_invitations").upsert(payload,{onConflict:"trip_id,email"});if(result.error)throw result.error;
    }else{
      const name=TABLE[type];
      if(type!=="trip")data.trip_id=state.tripId;
      let update=id?state.client.from(name).update(data).eq("id",id):null;
      if(update&&type==="expense"&&form.dataset.updatedAt)update=update.eq("updated_at",form.dataset.updatedAt);
      const result=id?await update.select("id").single():await state.client.from(name).insert(data).select("id").single();
      if(result.error)throw result.error;
      if(type==="trip"&&!id)state.tripId=result.data.id;
    }
    closeEditor();
    if(!state.demo){if(type==="trip")await loadTrips();else await loadTrip();}
    else render();
    toast((id?"Updated ":"Added ")+(type==="invite"?"invitation":type==="expense"?"cost":type));
  }catch(error){editorError(error?.message||"Could not save.");console.error(error);}
  finally{state.busy=false;$("#editor-submit").disabled=false;}
}
function editorError(msg){const el=$("#editor-error");el.textContent=msg;el.hidden=false;}
async function toggleTask(id,checked){
  if(!canEdit())return;
  const old=item("task",id);if(!old)return;
  if(state.demo){old.status=checked?"done":"todo";render();return;}
  try{
    const {error}=await state.client.from("tasks").update({status:checked?"done":"todo"}).eq("id",id).eq("trip_id",state.tripId).select("id").single();
    if(error)throw error;await loadTrip();toast(checked?"Task completed":"Task reopened");
  }catch(error){fail(error);render();}
}
async function remove(type,id){
  if(!canEdit()||type==="trip"&&!isOwner())return;
  const v=item(type,id);if(!v)return;
  if(!confirm("Delete "+(v.title||v.location||v.subject||"this item")+"? This cannot be undone."))return;
  try{
    if(state.demo){if(type==="trip"){state.trips=state.trips.filter(x=>x.id!==id);state.tripId=state.trips[0]?.id||null;}else state.data[TABLE[type]]=state.data[TABLE[type]].filter(x=>x.id!==id);render();}
    else {const {error}=await state.client.from(TABLE[type]).delete().eq("id",id).select("id").single();if(error)throw error;if(type==="trip")await loadTrips();else await loadTrip();}
    toast("Deleted");
  }catch(error){fail(error);}
}
function stripRow(type,v){const allowed=[...FIELDS[type].map(f=>f.name),"private_user_ids"];return Object.fromEntries(allowed.filter(k=>v[k]!==undefined).map(k=>[k,v[k]]));}
function exportTrip(){
  if(!trip())return;
  const payload={format:"trip-planner/v1",exported_at:new Date().toISOString(),trip:stripRow("trip",trip())};
  for(const [type,key] of [["task","tasks"],["stop","trip_stops"],["activity","activities"],["booking","bookings"],["decision","decisions"]])payload[key]=sharedOnlyData()[key].map(row=>({...stripRow(type,row),private_user_ids:[]}));
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const href=URL.createObjectURL(blob);const a=document.createElement("a");a.href=href;a.download=(trip().title||"trip").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
  toast("Shared trip export downloaded");
}
async function importTrip(file){
  if(!file||file.size>1024*1024)throw new Error("Choose a JSON trip file smaller than 1 MB.");
  const payload=JSON.parse(await file.text());
  if(payload.format!=="trip-planner/v1"||!payload.trip?.title||!payload.trip?.start_date||!payload.trip?.end_date)throw new Error("This is not a valid Trip Planner backup.");
  const keys=[["task","tasks"],["stop","trip_stops"],["activity","activities"],["booking","bookings"],["decision","decisions"]];
  for(const [,key] of keys)if(payload[key]&&!Array.isArray(payload[key]))throw new Error("Invalid "+key+" section.");
  const total=keys.reduce((sum,[,key])=>sum+(payload[key]?.length||0),0);
  if(total>500)throw new Error("Import is limited to 500 entries per trip.");
  if(!confirm("Import \""+payload.trip.title+"\" as a NEW trip? This will not overwrite any existing trip."))return;
  const data=stripRow("trip",payload.trip);let newId;
  try{
    if(state.demo){
      newId=uid();state.trips.push({...data,id:newId,created_by:"demo"});state.tripId=newId;
      state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],trip_expenses:[]};
      for(const [type,key] of keys)state.data[key]=(payload[key]||[]).map(v=>({...stripRow(type,v),id:uid(),trip_id:newId}));
      render();
    }else{
      const created=await state.client.from("trips").insert(data).select("id").single();
      if(created.error)throw created.error;newId=created.data.id;
      for(const [type,key] of keys){
        if(!payload[key]?.length)continue;
        const records=payload[key].map(v=>({...stripRow(type,v),private_user_ids:[],trip_id:newId}));
        const result=await state.client.from(key).insert(records);
        if(result.error)throw result.error;
      }
      state.tripId=newId;await loadTrips();state.tab="plan";render();
    }
    toast("Trip imported successfully");
  }catch(error){
    if(newId&&!state.demo){const result=await state.client.from("trips").delete().eq("id",newId);if(result.error)console.error("Partial import cleanup failed",result.error);}
    throw error;
  }
}
function changeTrip(id){state.preview=false;closePrivateDialogs();if(!state.trips.some(t=>t.id===id))return;state.tripId=id;state.tab="plan";state.moreTab="decisions";state.selectedDay=null;if(state.demo){state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],trip_expenses:[]};render();}else loadTrip().catch(fail);}
async function refresh(){if(state.demo){render();toast("Preview mode — changes are not saved.");return;}try{await loadTrips();toast("Up to date");}catch(error){fail(error);}}
function attachEvents(){
  document.addEventListener('toggle',e=>{const el=e.target;if(el.id==='cost-summary'){state.costSummaryOpen=el.open;localStorage.setItem('trip-planner-cost-summary-open',el.open?'1':'0');return;}if(!el.matches?.('details[data-cost-id]'))return;if(el.open)state.costOpen=el.dataset.costId;else if(state.costOpen===el.dataset.costId)state.costOpen=null;},true);
  document.addEventListener("click",async e=>{
    const navEl=e.target.closest("[data-tab]");if(navEl){e.preventDefault();state.tab=navEl.dataset.tab;if(navEl.dataset.more)state.moreTab=navEl.dataset.more;state.search="";render();window.scrollTo({top:0,behavior:"instant"});return;}
    const costCurrency=e.target.closest('[data-cost-currency]');if(costCurrency){state.costCurrency=costCurrency.dataset.costCurrency==='JPY'?'JPY':'GBP';state.costSummaryOpen=true;localStorage.setItem('trip-planner-cost-currency',state.costCurrency);render();return;}
    const costFilter=e.target.closest('[data-cost-filter]');if(costFilter){state.costFilter=costFilter.dataset.costFilter;render();return;}
    const planDay=e.target.closest("[data-plan-day]");if(planDay){const date=planDay.dataset.planDay;const toggle=planDay.hasAttribute("aria-expanded");state.selectedDay=toggle&&state.selectedDay===date?null:date;render();const target=document.querySelector('[data-plan-day="'+date+'"][aria-expanded]');target?.focus({preventScroll:true});if(!toggle)target?.scrollIntoView({behavior:"smooth",block:"start"});return;}
    const detail=e.target.closest("[data-detail]");if(detail){openItemDetail(detail.dataset.detail);return;}
    const walletFilter=e.target.closest("[data-wallet-filter]");if(walletFilter){state.walletFilter=walletFilter.dataset.walletFilter;render();return;}
    const dayEl=e.target.closest("[data-day]");if(dayEl){state.selectedDay=dayEl.dataset.day;render();requestAnimationFrame(()=>document.querySelector('.day-chip.active')?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"}));return;}
    const ticketEl=e.target.closest("[data-ticket-index]");if(ticketEl){state.ticketIndex=Number(ticketEl.dataset.ticketIndex)||0;return renderTicketWallet();}
    const more=e.target.closest("[data-more]");if(more){state.moreTab=more.dataset.more;render();return;}
    const t=e.target.closest("[data-trip]");if(t){changeTrip(t.dataset.trip);return;}
    const action=e.target.closest("[data-action]");if(!action)return;
    const name=action.dataset.action,id=action.dataset.id;
    if(name==="add-cost-split"){if(!canEdit())return;$('#cost-split-rows').insertAdjacentHTML('beforeend',splitRow({},$('#cost-split-rows').querySelectorAll('[data-cost-split]').length));return;}
    if(name==="remove-cost-split"){action.closest('[data-cost-split]').remove();return;}
    if(name==="equal-cost-split"){
      try{const rows=[...$('#cost-split-rows').querySelectorAll('[data-cost-split]')];if(!rows.length)throw new Error('Add at least one person first.');const share=equalShares($('#field-amount').value,$('#field-currency').value.trim().toUpperCase(),rows.length);for(const row of rows){row.querySelector('[data-split-mode]').value='amount';row.querySelector('[data-split-share]').value=share;}}catch(error){editorError(error.message);}return;
    }
    if(name==="settle-expense")return settleExpense(id,action.dataset.part);
    if(name==="close-detail")return closeItemDetail();
    if(name==="open-asset"){const asset=state.data.trip_assets.find(a=>a.id===id);if(!asset)return;activeTicketAssets=[asset];state.ticketIndex=0;$("#ticket-dialog").showModal();renderTicketWallet();return;}
    if(name==="preview-shared"){
      if(!isOwner())return;
      state.preview=!state.preview;closePrivateDialogs();state.tab="plan";
      if(state.demo){if(state.preview){state.demoFullData=state.data;state.data=sharedOnlyData();}else state.data=state.demoFullData;render();return;}
      state.data=Object.fromEntries(Object.keys(state.data).map(k=>[k,[]]));render();await loadTrip().catch(fail);return;
    }
    if(name==="private-note"){openEditor("decision");$("#field-visibility").value="private";$("#editor-title").textContent="Add private note";return;}
    if(name==="member-role"||name==="member-remove")return manageMember(name,id);
    if(name==="cancel-invite"){const r=await state.client.from("trip_invitations").delete().eq("id",id);if(r.error)fail(r.error);else await loadTrip();return;}
    if(name==="share-itinerary")return openItineraryShare();
    if(name==="tickets")return openTicketWallet(action.dataset.bookingId,action.dataset.activityId);
    if(name==="refresh")return refresh();
    if(name==="trips"){state.tab="more";state.moreTab="settings";return render();}
    if(name==="signout"){const {error}=await state.client.auth.signOut();if(error)fail(error);return;}
    if(name==="export")return exportTrip();
    if(name==="import"){let input=$("#import-file");if(!input){state.tab="more";state.moreTab="settings";render();input=$("#import-file");}input?.click();return;}
    if(name.startsWith("new-"))return openEditor(name.slice(4));
    if(name.startsWith("edit-"))return openEditor(name.slice(5),id||state.tripId);
    if(name.startsWith("delete-"))return remove(name.slice(7),id);
  });
  document.addEventListener("change",async e=>{
    if(e.target.matches("[data-task-check]"))return toggleTask(e.target.dataset.taskCheck,e.target.checked);
    if(e.target.matches("[data-filter]")){if(e.target.dataset.filter==="status")state.filter=e.target.value;else state.category=e.target.value;render();return;}
    if(e.target.id==="import-file"){const file=e.target.files?.[0];if(file){try{await importTrip(file);}catch(error){fail(error);}}e.target.value="";}
  });
  document.addEventListener("input",e=>{
    if(e.target.id==="wallet-search"){const start=e.target.selectionStart;state.walletSearch=e.target.value;render();const input=$("#wallet-search");input?.focus();if(input&&start!=null)input.setSelectionRange(start,start);return;}
    if(e.target.id==="task-search"){const start=e.target.selectionStart;state.search=e.target.value;render();const input=$("#task-search");input?.focus();if(input&&start!=null)input.setSelectionRange(start,start);}
  });
  document.addEventListener("submit",async e=>{
    if(e.target.id==="editor-form")return saveEditor(e);
    if(e.target.id==="account-password-form"){
      e.preventDefault();
      const form=e.target,message=$("#account-password-message");
      if(state.demo || !state.user || !state.client){message.textContent="Sign in before setting a password.";return;}
      const values=new FormData(form),password=String(values.get("password")||""),confirmation=String(values.get("confirm_password")||"");
      if(password.length<12){message.textContent="Use at least 12 characters.";return;}
      if(password!==confirmation){message.textContent="The passwords do not match.";return;}
      const button=form.querySelector('button[type="submit"]');button.disabled=true;message.textContent="";
      try{
        const {error}=await state.client.auth.updateUser({password});
        if(error)throw error;
        form.reset();
        message.textContent="Password saved. You can now sign in on your other devices.";
        toast("Password saved");
      }catch(error){message.textContent=error?.message||"Could not save password. Try again.";}
      finally{button.disabled=false;}
      return;
    }
    if(e.target.id==="password-auth-form"){
      e.preventDefault();
      const form=e.target,message=$("#password-auth-message");
      const values=new FormData(form),email=String(values.get("email")||"").trim(),password=String(values.get("password")||"");
      const button=form.querySelector('button[type="submit"]');button.disabled=true;message.textContent="";
      try{
        const {data,error}=await state.client.auth.signInWithPassword({email,password});
        if(error)throw error;
        if(!data.user)throw new Error("Sign-in did not complete. Try again.");
        form.querySelector('[name="password"]').value="";
        state.user=data.user;
        await loadTrips();
      }catch(error){
        message.textContent=error?.message||"Could not sign in. Check your email and password.";
        form.querySelector('[name="password"]').value="";
      }finally{button.disabled=false;}
      return;
    }
    if(e.target.id==="auth-form"){
      e.preventDefault();const email=new FormData(e.target).get("email");const button=e.target.querySelector('button[type="submit"]');button.disabled=true;
      try{await authEmail(email);$("#auth-message").textContent="Email sent. Check your inbox for the link or code.";$("#otp-section").hidden=false;}catch(error){$("#auth-message").textContent=error.message;}finally{button.disabled=false;}
    }
  });
  document.addEventListener("click",async e=>{
    if(e.target.id!=="verify-token")return;
    const email=$("#auth-email").value,token=$("#auth-token").value;
    e.target.disabled=true;
    try{const {data,error}=await state.client.auth.verifyOtp({email,token,type:"email"});if(error)throw error;state.user=data.user;await loadTrips();}catch(error){$("#auth-message").textContent=error.message;}finally{e.target.disabled=false;}
  });
  $("#item-detail").addEventListener("click",e=>{if(e.target===$("#item-detail"))closeItemDetail();});
  $("#item-detail").addEventListener("cancel",()=>{state.detailKey=null;});
  $("#editor-close").addEventListener("click",closeEditor);
  $("#editor-cancel").addEventListener("click",closeEditor);
  $("#editor-delete").addEventListener("click",()=>{const form=$("#editor-form");const type=form.dataset.type,id=form.dataset.id;closeEditor();if(id)remove(type,id);});
  $("#editor").addEventListener("click",e=>{if(e.target===$("#editor"))closeEditor();});
  $("#ticket-dialog-close")?.addEventListener("click",()=>$("#ticket-dialog")?.close());
  $("#ticket-dialog")?.addEventListener("click",e=>{if(e.target===$("#ticket-dialog"))$("#ticket-dialog").close();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.user&&!state.demo)loadTrips().catch(fail);});
  window.addEventListener("online",()=>{if(state.user&&!state.demo)loadTrips().catch(fail);});
}


let activeTicketAssets=[];
let ticketRenderVersion=0;
async function ticketSrc(asset){
  const value=String(asset?.data_url||"");
  if(value.startsWith("data:image/"))return value;
  if(value.startsWith("qr:")){
    try{
      const qr=await import("https://esm.sh/qrcode@1.5.4?bundle");
      return await qr.toDataURL(value.slice(3),{width:520,margin:2,errorCorrectionLevel:"M"});
    }catch(error){console.error(error);return "";}
  }
  return "";
}
async function renderTicketWallet(){
  const dialog=$("#ticket-dialog");if(!dialog?.open||!activeTicketAssets.length)return;
  const index=Math.max(0,Math.min(state.ticketIndex,activeTicketAssets.length-1));
  state.ticketIndex=index;
  const request=++ticketRenderVersion;
  const asset=activeTicketAssets[index],src=await ticketSrc(asset);
  if(request!==ticketRenderVersion||!dialog.open)return;
  $("#ticket-dialog-title").textContent=(asset.title||"Ticket")+(asset.visibility==="private"?" (Private)":"");
  $("#ticket-dialog-count").textContent=(index+1)+" of "+activeTicketAssets.length;
  const image=$("#ticket-dialog-image");
  if(src){image.src=src;image.hidden=false;}else{image.removeAttribute("src");image.hidden=true;}
  $("#ticket-dialog-empty").hidden=!!src;
  $("#ticket-dialog-pager").innerHTML=activeTicketAssets.map((a,i)=>'<button class="ticket-dot '+(i===index?"active":"")+'" data-ticket-index="'+i+'" aria-label="Show ticket '+(i+1)+'"></button>').join("");
  $("#ticket-prev").disabled=index===0;
  $("#ticket-next").disabled=index===activeTicketAssets.length-1;
  $("#ticket-prev").onclick=()=>{if(state.ticketIndex>0){state.ticketIndex--;renderTicketWallet();}};
  $("#ticket-next").onclick=()=>{if(state.ticketIndex<activeTicketAssets.length-1){state.ticketIndex++;renderTicketWallet();}};
}
function openTicketWallet(bookingId,activityId){
  activeTicketAssets=state.data.trip_assets.filter(a=>a.kind==="ticket_qr"&&((bookingId&&a.booking_id===bookingId)||(activityId&&a.activity_id===activityId))).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)||String(a.title).localeCompare(String(b.title)));
  if(!activeTicketAssets.length)return toast("No ticket QR codes are stored for this item yet.");
  state.ticketIndex=0;
  const dialog=$("#ticket-dialog");dialog.showModal();renderTicketWallet();
}

/* The export dialog lives outside #app so a regular refresh never removes its controls. */
let itineraryShareReady=null;
let itineraryShareRequest=0;
const itineraryName=tripData=>{
  const name=String(tripData?.title||tripData?.destination||"trip").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50)||"trip";
  return name+"-itinerary.png";
};
function releaseItineraryPreview(){
  itineraryShareRequest++;
  if(itineraryShareReady?.url)URL.revokeObjectURL(itineraryShareReady.url);
  itineraryShareReady=null;
  const image=$("#itinerary-share-image");
  image.hidden=true;
  image.removeAttribute("src");
}
async function updateItineraryShare(){
  const dialog=$("#itinerary-share-dialog");
  if(!dialog.open)return;
  const request=++itineraryShareRequest;
  const image=$("#itinerary-share-image");
  const status=$("#itinerary-share-status");
  const download=$("#itinerary-share-download"),share=$("#itinerary-share-native");
  download.disabled=true;share.disabled=true;
  status.textContent="Preparing image…";
  const detailed=$("#itinerary-share-style").value==="detailed";
  const includeNotes=$("#itinerary-share-notes").checked;
  $("#itinerary-share-privacy").textContent=includeNotes?
    "Activity notes are included. Review them for private links and references before sharing. Booking records and costs are not used.":
    "Booking records, costs, tasks and accommodation notes are not used. Check activity titles and places before sharing.";
  try{
    const currentTrip=trip();
    if(!currentTrip)throw new Error("Choose a trip before sharing its itinerary.");
    const rows=buildItineraryExportRows({
      trip:currentTrip,stops:sharedOnlyData().trip_stops,activities:sharedOnlyData().activities,
      detailed,includeNotes
    });
    const blob=await makeItineraryPng({trip:currentTrip,rows});
    if(request!==itineraryShareRequest||!dialog.open)return;
    const url=URL.createObjectURL(blob);
    const filename=itineraryName(currentTrip);
    let file=null,canShare=false;
    if(typeof File!=="undefined"){
      file=new File([blob],filename,{type:"image/png"});
      try{canShare=!!(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]}));}catch{canShare=false;}
    }
    if(itineraryShareReady?.url)URL.revokeObjectURL(itineraryShareReady.url);
    itineraryShareReady={url,blob,file,filename,title:currentTrip.title||currentTrip.destination||"Trip"};
    image.src=url;image.hidden=false;
    share.hidden=!canShare;
    status.textContent=rows.length+" itinerary rows · Preview exactly what you will share.";
    download.disabled=false;share.disabled=!canShare;
  }catch(error){
    if(request!==itineraryShareRequest)return;
    status.textContent=error?.message||"Could not prepare the itinerary image.";
    image.hidden=true;
    toast("Could not prepare itinerary image.");
  }
}
function openItineraryShare(){
  if(!trip())return toast("Choose a trip before sharing its itinerary.");
  const dialog=$("#itinerary-share-dialog");
  if(!dialog.open)dialog.showModal();
  return updateItineraryShare();
}
function downloadItineraryShare(){
  const ready=itineraryShareReady;
  if(!ready)return;
  const a=document.createElement("a");
  a.href=ready.url;a.download=ready.filename;
  document.body.appendChild(a);a.click();a.remove();
}
async function shareItineraryReady(){
  const ready=itineraryShareReady;
  if(!ready)return;
  if(!(ready.file&&navigator.share))return downloadItineraryShare();
  const button=$("#itinerary-share-native");
  try{
    // Call navigator.share during the original click, before any await, for iOS user activation.
    const sharing=navigator.share({title:ready.title+" itinerary",files:[ready.file]});
    button.disabled=true;
    await sharing;
  }catch(error){
    if(error?.name!=="AbortError"){
      $("#itinerary-share-status").textContent="Could not open the share sheet. You can download the PNG instead.";
    }
  }finally{button.disabled=false;}
}
function bindItineraryShare(){
  const dialog=$("#itinerary-share-dialog");
  $("#itinerary-share-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",releaseItineraryPreview);
  dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
  $("#itinerary-share-style").addEventListener("change",updateItineraryShare);
  $("#itinerary-share-notes").addEventListener("change",updateItineraryShare);
  $("#itinerary-share-download").addEventListener("click",downloadItineraryShare);
  $("#itinerary-share-native").addEventListener("click",shareItineraryReady);
}

attachEvents();
bindItineraryShare();
init();

async function settleExpense(id,part){
  if(!canEdit()||state.busy)return;
  const original=item('expense',id);if(!original)return;
  const data={vendor_paid:original.vendor_paid,splits:(original.splits||[]).map(s=>({...s}))};
  if(part==='vendor')data.vendor_paid=original.amount;else if(data.splits[Number(part)])data.splits[Number(part)].repaid=data.splits[Number(part)].share;else return;
  const payload=original.from_booking?{trip_id:state.tripId,booking_id:original.booking_id,title:original.title,amount:original.amount,currency:original.currency,paid_by:original.paid_by,due_date:null,visibility:isOwner()?original.visibility:'shared',private_user_ids:isOwner()?original.private_user_ids:[],...data}:data;
  state.busy=true;
  try{
    if(state.demo){if(original.from_booking){const row={...payload,id:uid()};state.data.trip_expenses.push(row);state.costOpen=row.id;}else Object.assign(original,data);render();}
    else{
      let q=original.from_booking?state.client.from('trip_expenses').insert(payload):state.client.from('trip_expenses').update(data).eq('id',id).eq('trip_id',state.tripId);
      if(!original.from_booking&&original.updated_at)q=q.eq('updated_at',original.updated_at);
      const r=await q.select('id').single();
      if(r.error){if(r.error.code==='23505'){await loadTrip();throw new Error('This booking already has a cost. Review the refreshed payment details.');}throw new Error('Could not update this cost. Refresh to check for changes, then try again.');}
      state.costOpen=r.data.id;await loadTrip();
    }
    toast(part==='vendor'?'Vendor payment recorded':'Repayment recorded');
  }catch(error){fail(error);}finally{state.busy=false;}
}
