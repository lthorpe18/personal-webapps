/* Trip Planner v1 — plain browser JavaScript; no private trip data in source control. */
const $ = selector => document.querySelector(selector);
const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const config = window.TRIP_PLANNER_CONFIG || {};
const isDemo = !(config.url && config.publishableKey);
const NAV = [["home","⌂","Home"],["tasks","☑","Tasks"],["itinerary","◇","Itinerary"],["bookings","▣","Bookings"],["more","⋯","More"]];
const TABLE = {task:"tasks",stop:"trip_stops",activity:"activities",booking:"bookings",decision:"decisions",trip:"trips",invite:"trip_invitations"};
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
  invite:[FIELD("email","Person's email","email",{required:true,full:true}),FIELD("role","Access","select",{options:[["editor","Can edit"],["viewer","Read only"]]})]
};
const state={client:null,user:null,trips:[],tripId:null,tab:"home",moreTab:"decisions",filter:"open",category:"all",search:"",data:{tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[]},invites:[],member:null,demo:isDemo,busy:false,refreshVersion:0,channel:null};
const day=date => date ? new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}) : "Date TBC";
const longDay=date => date ? new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}) : "Date TBC";
const nights=(from,to)=>from&&to?Math.max(0,Math.round((Date.parse(to+"T00:00:00Z")-Date.parse(from+"T00:00:00Z"))/86400000)):0;
const until=date=>{if(!date)return "—";const n=new Date();const t=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());return Math.max(0,Math.ceil((Date.parse(date+"T00:00:00Z")-t)/86400000));};
const uid=()=>crypto.randomUUID();
const trip=()=>state.trips.find(t=>t.id===state.tripId);
const canEdit=()=>state.demo || !!(trip() && (trip().created_by===state.user?.id || state.member?.role==="owner" || state.member?.role==="editor"));
const isOwner=()=>state.demo || !!(trip() && trip().created_by===state.user?.id);
const item=(type,id)=>type==="trip"?trip():type==="invite"?state.invites.find(v=>v.id===id):state.data[TABLE[type]].find(v=>v.id===id);
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
  bookings:[],decisions:[{id:uid(),subject:"Which cities to visit?",outcome:"Tokyo and Kyoto",status:"confirmed",notes:"Example decision."}]};
  return {t,d};
}
async function init(){
  if("serviceWorker" in navigator && (location.protocol==="https:"||location.hostname==="localhost")){
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  }
  if(state.demo){const v=demoFixture();state.trips=[v.t];state.tripId=v.t.id;state.data=v.d;render();return;}
  try{
    const module=await import("https://esm.sh/@supabase/supabase-js@2.117.1?bundle");
    state.client=module.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data,error}=await state.client.auth.getSession();
    if(error)throw error;
    state.user=data.session?.user||null;
    state.client.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){state.user=null;state.trips=[];state.tripId=null;state.channel&&state.client.removeChannel(state.channel);state.channel=null;render();return;}
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
  else{state.member=null;state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[]};render();}
}
async function loadTrip(){
  const id=state.tripId;if(!id)return;
  const current=++state.refreshVersion;
  const jobs=[
    ...["tasks","trip_stops","activities","bookings","decisions"].map(name=>state.client.from(name).select("*").eq("trip_id",id)),
    state.client.from("trip_members").select("role").eq("trip_id",id).eq("user_id",state.user.id).maybeSingle()
  ];
  if(isOwner())jobs.push(state.client.from("trip_invitations").select("*").eq("trip_id",id).order("created_at",{ascending:false}));
  const results=await Promise.all(jobs);
  if(current!==state.refreshVersion||id!==state.tripId)return;
  for(const result of results)if(result.error)throw result.error;
  ["tasks","trip_stops","activities","bookings","decisions"].forEach((key,i)=>state.data[key]=results[i].data||[]);
  state.member=results[5].data;
  state.invites=isOwner()?results[6].data||[]:[];
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
  ["tasks","trip_stops","activities","bookings","decisions","trip_invitations"].forEach(table=>
    channel.on("postgres_changes",{event:"*",schema:"public",table,filter:"trip_id=eq."+id},()=>{
      clearTimeout(schedule);schedule=setTimeout(()=>{if(state.tripId===id)loadTrip().catch(fail);},450);
    })
  );
  state.channel=channel.subscribe();
}
function nav(){return NAV.map(([id,ico,title])=>'<button type="button" class="nav-link '+(state.tab===id?"active":"")+'" data-tab="'+id+'" aria-label="'+title+'" aria-current="'+(state.tab===id?"page":"false")+'"><span class="nav-ico">'+ico+'</span><span class="nav-label">'+title+"</span></button>").join("");}
function render(){
  if(!state.demo&&!state.user){renderAuth();return;}
  const t=trip();
  const names={home:"Overview",tasks:"Checklist",itinerary:"Itinerary",bookings:"Bookings",more:"Trip details"};
  const title=t?names[state.tab]:"Your trips";
  const back=state.trips.length>1?'<button class="icon-button" data-action="trips" title="Switch trip" aria-label="Switch trip">⇄</button>':"";
  $("#app").className="";
  $("#app").innerHTML='<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><nav class="side-nav" aria-label="Main">'+nav()+'</nav><div class="side-foot"><small>'+esc(state.user?.email||"Demo mode")+'</small><button class="button button-small" data-action="trips">Switch / add trip</button></div></aside><main class="main"><div class="topline"><div class="topline-left"><p class="eyebrow">'+esc(t?.title||"TRIP PLANNER")+'</p><h1>'+esc(title)+'</h1><p class="sub">'+esc(t?.destination||"Plan your next adventure")+(t?.start_date?" · "+esc(day(t.start_date))+" – "+esc(day(t.end_date)):"")+'</p></div><div class="head-actions">'+back+'<button class="icon-button" data-action="refresh" title="Refresh" aria-label="Refresh">↻</button></div></div>'+
    (state.demo?'<div class="status-banner"><strong>Preview only.</strong> These are fictional examples. Changes are not saved and no personal information is stored. Connect your own Supabase project to activate private, shared trips.</div>':!navigator.onLine?'<div class="status-banner"><strong>Offline.</strong> Your private trip data needs a network connection.</div>':"")+
    (!t?renderNoTrips():state.tab==="home"?renderHome():state.tab==="tasks"?renderTasks():state.tab==="itinerary"?renderItinerary():state.tab==="bookings"?renderBookings():renderMore())+
    '</main><nav class="bottom-nav" aria-label="Main">'+nav()+'</nav></div>';
}
function renderAuth(){
  $("#app").className="";
  $("#app").innerHTML='<div class="auth-wrap"><div class="auth-card"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><p class="eyebrow">YOUR NEXT ADVENTURE</p><h1>Your trips, in one place.</h1><p>Sign in with your email to access your private plans, bookings and shared checklists.</p><form id="auth-form"><div class="field"><label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><button class="button button-primary" type="submit">Send sign-in link / code</button><p id="auth-message" class="hint" role="status"></p><div class="field" id="otp-section" hidden><label for="auth-token">Email code (if one was included)</label><input id="auth-token" name="token" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" placeholder="123456"><button class="button" type="button" id="verify-token">Verify code</button></div></form><p class="hint">Open the email link on this device, or enter the one-time code if your email contains one.</p></div></div>';
}
function renderNoTrips(){return '<div class="empty"><strong>No trips yet</strong><p>Create a trip, or import a private JSON backup in More after creating one.</p><button class="button button-primary" data-action="new-trip">Create trip</button> <button class="button" data-action="import">Import trip JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div>';}
function renderHome(){
  const t=trip();const open=state.data.tasks.filter(x=>x.status!=="done").sort(taskSort);
  const confirmed=state.data.bookings.filter(x=>x.status==="booked").length;
  const done=state.data.tasks.filter(x=>x.status==="done").length;
  const stays=[...state.data.trip_stops].sort((a,b)=>String(a.starts_on).localeCompare(String(b.starts_on)));
  return '<section class="hero"><div><p class="eyebrow">YOUR NEXT ADVENTURE</p><h2>'+esc(t.destination||t.title)+'</h2><p>'+esc(longDay(t.start_date))+' – '+esc(longDay(t.end_date))+'</p></div><div class="hero-stat"><b>'+until(t.start_date)+'</b><span>Days to go</span></div></section>'+
    '<div class="stats"><div class="stat"><b>'+open.length+'</b><span>Tasks remaining</span></div><div class="stat"><b>'+confirmed+'</b><span>Bookings confirmed</span></div><div class="stat"><b>'+done+'/'+state.data.tasks.length+'</b><span>Tasks complete</span></div></div>'+
    '<div class="section-head"><div><h2>Up next</h2><p>Highest priority outstanding tasks</p></div><a href="#" data-tab="tasks">View all →</a></div><div class="stack">'+(open.length?open.slice(0,4).map(taskRow).join(""):emptySmall("All caught up","There are no outstanding tasks.","new-task","Add task"))+'</div>'+
    '<div class="section-head"><div><h2>Where you’ll be</h2><p>Your planned overnight bases</p></div><a href="#" data-tab="itinerary">Full itinerary →</a></div><div class="stack">'+(stays.length?stays.slice(0,4).map(stopRow).join(""):emptySmall("Build your route","Add your first overnight stop.","new-stop","Add stop"))+'</div>'+
    '<div class="section-head"><div><h2>Useful shortcuts</h2></div></div><div class="panel"><button class="button button-primary" data-action="new-task">+ Add task</button> <button class="button" data-action="new-booking">+ Add booking</button> <button class="button" data-tab="more" data-more="decisions">Decisions →</button></div>';
}
function taskSort(a,b){return Number(a.priority||3)-Number(b.priority||3)||String(a.due_date||"9999").localeCompare(String(b.due_date||"9999"))||String(a.title).localeCompare(String(b.title));}
function taskRow(v){
  return '<div class="task-row"><input class="task-check" type="checkbox" data-task-check="'+esc(v.id)+'" aria-label="Complete '+esc(v.title)+'" '+(v.status==="done"?"checked ":"")+(canEdit()?"":"disabled ")+'><div class="task-body"><span class="task-title '+(v.status==="done"?"complete":"")+'">'+esc(v.title)+'</span><div class="task-meta"><span>'+esc(v.category||"General")+'</span>'+pill(v.priority||3,"priority")+(v.due_date?'<span>Due '+esc(day(v.due_date))+'</span>':"")+(v.status==="blocked"?pill("blocked"):"")+'</div>'+(v.notes?'<p class="panel-sub">'+esc(v.notes)+'</p>':"")+'</div>'+(canEdit()?'<div class="row-actions"><button class="icon-button" data-action="edit-task" data-id="'+esc(v.id)+'" aria-label="Edit task">✎</button></div>':"")+'</div>';
}
function renderTasks(){
  const cats=[...new Set(state.data.tasks.map(t=>t.category||"General"))].sort();
  let filtered=state.data.tasks.filter(t=>(state.filter==="all"||(state.filter==="open"?t.status!=="done":t.status===state.filter))&&(state.category==="all"||(t.category||"General")===state.category)&&(t.title+" "+(t.notes||"")).toLowerCase().includes(state.search.toLowerCase())).sort(taskSort);
  return '<div class="section-head"><div><h2>All tasks</h2><p>Search, tick off and prioritise everything.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-task">+ New task</button>':"")+'</div><div class="filters"><input class="filter-search" id="task-search" type="search" placeholder="Search checklist" aria-label="Search tasks" value="'+esc(state.search)+'"><select class="filter-select" data-filter="status" aria-label="Task status">'+[["open","Outstanding"],["all","All statuses"],["todo","To do"],["doing","In progress"],["blocked","Blocked"],["done","Completed"]].map(([id,n])=>'<option value="'+id+'" '+(state.filter===id?"selected":"")+'>'+n+'</option>').join("")+'</select><select class="filter-select" data-filter="category" aria-label="Task category"><option value="all">All categories</option>'+cats.map(c=>'<option '+(state.category===c?"selected":"")+' value="'+esc(c)+'">'+esc(c)+'</option>').join("")+'</select></div><div class="stack">'+(filtered.length?filtered.map(taskRow).join(""):emptySmall("No matching tasks","Try another filter or add a task.",canEdit()?"new-task":"",canEdit()?"Add task":""))+'</div>';
}
function stopRow(v){
  return '<div class="panel stop-card"><div class="stop-date"><b>'+esc(new Date(v.starts_on+"T12:00:00Z").toLocaleDateString("en-GB",{day:"2-digit",timeZone:"UTC"}))+'</b><span>'+esc(new Date(v.starts_on+"T12:00:00Z").toLocaleDateString("en-GB",{month:"short",timeZone:"UTC"}).toUpperCase())+'</span></div><div class="stop-main"><h3>'+esc(v.location)+'</h3><p>'+esc(day(v.starts_on))+' – '+esc(day(v.ends_on))+' · '+nights(v.starts_on,v.ends_on)+' nights'+(v.accommodation_name?" · "+esc(v.accommodation_name):"")+'</p>'+pill(v.status||"planned","stop")+'</div>'+(canEdit()?'<button class="icon-button" data-action="edit-stop" data-id="'+esc(v.id)+'" aria-label="Edit stop">✎</button>':"")+'</div>';
}
function renderItinerary(){
  const stops=[...state.data.trip_stops].sort((a,b)=>String(a.starts_on).localeCompare(String(b.starts_on)));
  const activities=[...state.data.activities].sort((a,b)=>String(a.activity_date||"9999").localeCompare(String(b.activity_date||"9999")));
  return '<div class="section-head"><div><h2>Overnight bases</h2><p>Where you stay, in travel order.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-stop">+ Stay</button>':"")+'</div><div class="timeline">'+(stops.length?stops.map(stopRow).join(""):emptySmall("No stays yet","Add your first overnight base.",canEdit()?"new-stop":"",canEdit()?"Add stay":""))+'</div><div class="section-head"><div><h2>Activities & journeys</h2><p>Day trips, transport and tickets.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-activity">+ Activity</button>':"")+'</div><div class="panel">'+(activities.length?activities.map(v=>'<div class="activity-row"><div class="activity-date">'+esc(day(v.activity_date))+'</div><div><div class="activity-title">'+esc(v.title)+'</div><div class="activity-sub">'+esc(v.location||label("activity",v.type)||"")+' · '+esc(v.type?.replaceAll("_"," ")||"Activity")+'</div>'+pill(v.status||"planned","activity")+(v.notes?'<p class="panel-sub">'+esc(v.notes)+'</p>':"")+'</div>'+(canEdit()?'<button class="icon-button" data-action="edit-activity" data-id="'+esc(v.id)+'" aria-label="Edit activity">✎</button>':"")+'</div>').join(""):emptySmall("No activities yet","Add sightseeing, park days or transport.",canEdit()?"new-activity":"",canEdit()?"Add activity":""))+'</div>';
}
function renderBookings(){
  const bookings=[...state.data.bookings].sort((a,b)=>String(a.start_date||"9999").localeCompare(String(b.start_date||"9999")));
  return '<div class="section-head"><div><h2>Bookings & confirmations</h2><p>References and links are visible only to your trip members.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-booking">+ Booking</button>':"")+'</div><div class="book-grid">'+(bookings.length?bookings.map(v=>'<article class="panel booking-card"><div class="panel-head"><div><p class="eyebrow">'+esc(v.category||"OTHER")+'</p><h3>'+esc(v.title)+'</h3></div>'+pill(v.status||"pending","booking")+'</div><div class="details">'+(v.provider?esc(v.provider)+"<br>":"")+(v.start_date?esc(day(v.start_date))+(v.end_date?" – "+esc(day(v.end_date)):""):"Date TBC")+(v.notes?'<p class="note-text">'+esc(v.notes)+'</p>':"")+'</div>'+(v.booking_reference?'<div class="booking-ref">Reference: <strong>'+esc(v.booking_reference)+'</strong></div>':"")+'<div class="booking-bottom"><span class="muted">'+(v.amount!=null?esc(v.currency||"GBP")+" "+Number(v.amount).toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}):"")+'</span><div class="row-actions">'+link(v.confirmation_url,"Open")+(canEdit()?'<button class="icon-button" data-action="edit-booking" data-id="'+esc(v.id)+'" aria-label="Edit booking">✎</button>':"")+'</div></div></article>').join(""):emptySmall("No bookings yet","Add reservations once they are confirmed.",canEdit()?"new-booking":"",canEdit()?"Add booking":""))+'</div>';
}
function renderMore(){
  const subtabs=[["decisions","Decisions"],["settings","Settings"]];
  return '<div class="tabs">'+subtabs.map(([id,label])=>'<button class="tab '+(state.moreTab===id?"active":"")+'" data-more="'+id+'">'+label+"</button>").join("")+'</div>'+(state.moreTab==="decisions"?renderDecisions():renderSettings());
}
function renderDecisions(){
  const ordered=[...state.data.decisions].sort((a,b)=>({open:0,confirmed:1,dropped:2}[a.status]||0)-({open:0,confirmed:1,dropped:2}[b.status]||0));
  return '<div class="section-head"><div><h2>Decisions log</h2><p>The agreed plan and what you ruled out.</p></div>'+(canEdit()?'<button class="button button-primary button-small" data-action="new-decision">+ Decision</button>':"")+'</div><div class="stack">'+(ordered.length?ordered.map(v=>'<div class="panel decision-card"><div class="panel-head"><h3>'+esc(v.subject)+'</h3>'+pill(v.status||"open","decision")+'</div><p>'+esc(v.outcome)+'</p>'+(v.notes?'<p class="muted">'+esc(v.notes)+'</p>':"")+(canEdit()?'<div><button class="button button-small" data-action="edit-decision" data-id="'+esc(v.id)+'">Edit</button></div>':"")+'</div>').join(""):emptySmall("No decisions recorded","Log a decision when plans change.",canEdit()?"new-decision":"",canEdit()?"Add decision":""))+'</div>';
}
function renderSettings(){
  const t=trip();
  const trips=state.trips.map(v=>'<button type="button" class="trip-option '+(v.id===state.tripId?"active":"")+'" data-trip="'+esc(v.id)+'"><p class="eyebrow">'+esc(v.destination||"Trip")+'</p><h3>'+esc(v.title)+'</h3><p>'+esc(day(v.start_date))+' – '+esc(day(v.end_date))+'</p></button>').join("");
  return '<div class="panel settings-section"><h2>Your trips</h2><p>Switch trips or create a new holiday using the same planner.</p><div class="trip-list">'+trips+'</div><button class="button button-primary" data-action="new-trip">+ New trip</button> '+(isOwner()?'<button class="button" data-action="edit-trip">Edit current trip</button>':"")+'</div>'+
    '<div class="panel settings-section"><h2>Share this trip</h2>'+(state.demo?'<p>Cloud storage must be connected before inviting other people.</p>':isOwner()?'<p>Invite somebody by email. They can sign in with that exact address and select this trip. No automatic invitation email is sent: share the app link with them yourself.</p><button class="button" data-action="new-invite">+ Invite person</button>'+(state.invites.length?'<div class="stack" style="margin-top:14px">'+state.invites.map(v=>'<div class="task-row"><div class="task-body"><span class="task-title">'+esc(v.email)+'</span><div class="task-meta">'+esc(v.role)+" · "+(v.accepted_at?"Joined":"Pending")+'</div></div></div>').join("")+"</div>":""):'<p>Your trip owner manages invitations. You have '+esc(state.member?.role||"member")+' access.</p>')+'</div>'+
    '<div class="panel settings-section"><h2>Back up and import</h2><p>Export includes private booking information. Keep the JSON file somewhere secure. Import creates a new trip; it never overwrites another holiday.</p><button class="button" data-action="export">Export current trip</button> <button class="button" data-action="import">Import trip JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div>'+
    '<div class="panel settings-section"><h2>Account & connection</h2><p>'+esc(state.user?.email||"Preview mode")+'</p>'+(state.demo?'<p>This site is in preview mode because its Supabase project has not been configured.</p>':'<button class="button" data-action="signout">Sign out</button>')+'</div>';
}
function emptySmall(title,description,action,button){return '<div class="empty"><strong>'+esc(title)+'</strong><p>'+esc(description)+'</p>'+(action?'<button class="button" data-action="'+esc(action)+'">'+esc(button)+'</button>':"")+'</div>';}
function openEditor(type,id){
  if(!canEdit()&&type!=="trip")return toast("You have read-only access.");
  if(type==="invite"&&!isOwner())return toast("Only the trip owner can invite people.");
  if(type==="trip"&&id&&!isOwner())return toast("Only the trip owner can edit trip details.");
  const v=id?item(type,id):{};
  const fields=FIELDS[type];if(!fields)return;
  const titles={trip:"Trip",task:"Task",stop:"Stay",activity:"Activity or journey",booking:"Booking",decision:"Decision",invite:"Invitation"};
  $("#editor-title").textContent=(id?"Edit ":"Add ")+titles[type];
  $("#editor-form").dataset.type=type;$("#editor-form").dataset.id=id||"";
  $("#editor-fields").innerHTML=fields.map(f=>{
    const value=v?.[f.name]??(f.name==="priority"?"2":f.name==="currency"?(trip()?.currency||"GBP"):f.name==="timezone"?"Asia/Tokyo":f.options?.[0]?.[0]||"");
    const attrs=' name="'+esc(f.name)+'" id="field-'+esc(f.name)+'" '+(f.required?"required ":"")+(f.step?'step="'+esc(f.step)+'" ':"")+(f.min?'min="'+esc(f.min)+'" ':"")+(f.placeholder?'placeholder="'+esc(f.placeholder)+'" ':"");
    const control=f.type==="textarea"?'<textarea'+attrs+' rows="3">'+esc(value)+'</textarea>':f.type==="select"?'<select'+attrs+'>'+f.options.map(([k,n])=>'<option value="'+esc(k)+'" '+(String(k)===String(value)?"selected":"")+'>'+esc(n)+'</option>').join("")+'</select>':'<input type="'+esc(f.type)+'"'+attrs+' value="'+esc(value)+'">';
    return '<div class="field '+(f.full?"full":"")+'"><label for="field-'+esc(f.name)+'">'+esc(f.label)+'</label>'+control+'</div>';
  }).join("");
  $("#editor-error").hidden=true;
  $("#editor-delete").hidden=!id;
  $("#editor").showModal();
  $("#editor-fields").querySelector("input,textarea,select")?.focus();
}
function closeEditor(){$("#editor").close();}
async function saveEditor(event){
  event.preventDefault();
  if(state.busy)return;
  const form=event.currentTarget,type=form.dataset.type,id=form.dataset.id;
  const data=Object.fromEntries(new FormData(form).entries());
  if(data.email)data.email=data.email.trim().toLowerCase();
  if(data.start_date&&data.end_date&&data.end_date<data.start_date)return editorError("End date cannot be before the start date.");
  if(data.starts_on&&data.ends_on&&data.ends_on<=data.starts_on)return editorError("Departure must be after arrival.");
  for(const f of FIELDS[type])if(f.type==="date"&&!data[f.name])data[f.name]=null;
  if(type==="task")data.priority=Number(data.priority);
  if(type==="booking")data.amount=data.amount===""?null:Number(data.amount);
  state.busy=true;$("#editor-submit").disabled=true;
  try{
    if(state.demo){
      if(type==="invite")throw new Error("Connect Supabase to invite people.");
      if(type==="trip"&&!id){const newTrip={...data,id:uid(),created_by:"demo"};state.trips.push(newTrip);state.tripId=newTrip.id;state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[]};}
      else if(type==="trip")Object.assign(trip(),data);
      else if(id)Object.assign(item(type,id),data);
      else state.data[TABLE[type]].push({...data,id:uid(),trip_id:state.tripId});
    }else if(type==="invite"){
      const payload={trip_id:state.tripId,email:data.email,role:data.role,created_by:state.user.id};
      const result=await state.client.from("trip_invitations").upsert(payload,{onConflict:"trip_id,email"});if(result.error)throw result.error;
    }else{
      const name=TABLE[type];
      if(type!=="trip")data.trip_id=state.tripId;
      const result=id?await state.client.from(name).update(data).eq("id",id).select("id").single():await state.client.from(name).insert(data).select("id").single();
      if(result.error)throw result.error;
      if(type==="trip"&&!id)state.tripId=result.data.id;
    }
    closeEditor();
    if(!state.demo){if(type==="trip")await loadTrips();else await loadTrip();}
    else render();
    toast((id?"Updated ":"Added ")+(type==="invite"?"invitation":type));
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
function stripRow(type,v){const allowed=FIELDS[type].map(f=>f.name);return Object.fromEntries(allowed.filter(k=>v[k]!==undefined).map(k=>[k,v[k]]));}
function exportTrip(){
  if(!trip())return;
  const payload={format:"trip-planner/v1",exported_at:new Date().toISOString(),trip:stripRow("trip",trip())};
  for(const [type,key] of [["task","tasks"],["stop","trip_stops"],["activity","activities"],["booking","bookings"],["decision","decisions"]])payload[key]=state.data[key].map(row=>stripRow(type,row));
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const href=URL.createObjectURL(blob);const a=document.createElement("a");a.href=href;a.download=(trip().title||"trip").toLowerCase().replace(/[^a-z0-9]+/g,"-")+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
  toast("Private backup downloaded");
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
      state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[]};
      for(const [type,key] of keys)state.data[key]=(payload[key]||[]).map(v=>({...stripRow(type,v),id:uid(),trip_id:newId}));
      render();
    }else{
      const created=await state.client.from("trips").insert(data).select("id").single();
      if(created.error)throw created.error;newId=created.data.id;
      for(const [type,key] of keys){
        if(!payload[key]?.length)continue;
        const records=payload[key].map(v=>({...stripRow(type,v),trip_id:newId}));
        const result=await state.client.from(key).insert(records);
        if(result.error)throw result.error;
      }
      state.tripId=newId;await loadTrips();state.tab="home";render();
    }
    toast("Trip imported successfully");
  }catch(error){
    if(newId&&!state.demo){const result=await state.client.from("trips").delete().eq("id",newId);if(result.error)console.error("Partial import cleanup failed",result.error);}
    throw error;
  }
}
function changeTrip(id){if(!state.trips.some(t=>t.id===id))return;state.tripId=id;state.tab="home";state.moreTab="decisions";if(state.demo){state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[]};render();}else loadTrip().catch(fail);}
async function refresh(){if(state.demo){render();toast("Preview mode — changes are not saved.");return;}try{await loadTrips();toast("Up to date");}catch(error){fail(error);}}
function attachEvents(){
  document.addEventListener("click",async e=>{
    const navEl=e.target.closest("[data-tab]");if(navEl){e.preventDefault();state.tab=navEl.dataset.tab;if(navEl.dataset.more)state.moreTab=navEl.dataset.more;state.search="";render();window.scrollTo({top:0,behavior:"instant"});return;}
    const more=e.target.closest("[data-more]");if(more){state.moreTab=more.dataset.more;render();return;}
    const t=e.target.closest("[data-trip]");if(t){changeTrip(t.dataset.trip);return;}
    const action=e.target.closest("[data-action]");if(!action)return;
    const name=action.dataset.action,id=action.dataset.id;
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
    if(e.target.id==="task-search"){const start=e.target.selectionStart;state.search=e.target.value;render();const input=$("#task-search");input?.focus();if(input&&start!=null)input.setSelectionRange(start,start);}
  });
  document.addEventListener("submit",async e=>{
    if(e.target.id==="editor-form")return saveEditor(e);
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
  $("#editor-close").addEventListener("click",closeEditor);
  $("#editor-cancel").addEventListener("click",closeEditor);
  $("#editor-delete").addEventListener("click",()=>{const form=$("#editor-form");const type=form.dataset.type,id=form.dataset.id;closeEditor();if(id)remove(type,id);});
  $("#editor").addEventListener("click",e=>{if(e.target===$("#editor"))closeEditor();});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.user&&!state.demo)loadTrips().catch(fail);});
  window.addEventListener("online",()=>{if(state.user&&!state.demo)loadTrips().catch(fail);});
}
attachEvents();
init();
