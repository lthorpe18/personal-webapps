import {navigationIcon,buildTripView,renderPlan,renderWallet,renderItemDetail} from './trip-view.js?v=3';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const config=window.TRIP_PLANNER_CONFIG||{};
const state={tab:'plan',selectedDay:null,detailKey:null,walletSearch:'',walletFilter:'all',trip:null,data:{tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[]}};
const NAV=[['plan','◇','Plan'],['tasks','☑','Tasks'],['wallet','▤','Wallet'],['more','⋯','More']];
const day=d=>d?new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}):'Date to confirm';
const today=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:state.trip?.timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),v=Object.fromEntries(parts.map(x=>[x.type,x.value]));return v.year+'-'+v.month+'-'+v.day;};
function nav(){return NAV.map(([key,icon,title])=>'<button class="nav-link '+(state.tab===key?'active':'')+'" data-tab="'+key+'" aria-current="'+(state.tab===key?'page':'false')+'"><span class="nav-ico">'+navigationIcon(key)+'</span><span class="nav-label">'+title+'</span></button>').join('');}
function renderTasks(){return '<div class="section-head"><div><h2>Trip checklist</h2><p>Read only</p></div></div><div class="stack">'+[...state.data.tasks].sort((a,b)=>(a.priority||3)-(b.priority||3)).map(t=>'<div class="task-row"><input class="task-check" type="checkbox" disabled '+(t.status==='done'?'checked':'')+' aria-label="'+esc(t.title)+'"><div class="task-body"><span class="task-title '+(t.status==='done'?'complete':'')+'">'+esc(t.title)+'</span><div class="task-meta">'+esc(t.category)+' · '+esc(t.status==='done'?'Done':t.status==='todo'?'To do':t.status)+(t.due_date?' · '+esc(day(t.due_date)):'')+'</div></div></div>').join('')+'</div>';}
function renderMore(){return '<div class="section-head"><h2>Decisions & notes</h2></div><div class="stack">'+state.data.decisions.map(d=>'<article class="panel"><h3>'+esc(d.subject)+'</h3><p>'+esc(d.outcome)+'</p></article>').join('')+'</div>';}
function render(){
 const t=state.trip;if(!t)return;const title={plan:'Your plan',tasks:'Checklist',wallet:'Travel wallet',more:'Trip details'}[state.tab];
 $('#app').className='public-view';$('#app').innerHTML='<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">✦</span><span>Trip Planner</span></div><nav class="side-nav">'+nav()+'</nav><div class="side-foot"><small>Public read-only view</small></div></aside><main class="main view-'+state.tab+'"><div class="topline"><div><p class="eyebrow">'+esc(t.title)+'</p><h1>'+title+'</h1><p class="sub">'+esc(t.destination)+' · '+esc(day(t.start_date))+' – '+esc(day(t.end_date))+'</p></div><button class="icon-button" data-action="refresh" aria-label="Refresh">↻</button></div><div class="public-note">Public read-only trip view</div>'+(state.tab==='plan'?renderPlan(t,state.data,{expandedDay:state.selectedDay,today:today()}):state.tab==='wallet'?renderWallet(t,state.data,{search:state.walletSearch,filter:state.walletFilter,isPublic:true}):state.tab==='tasks'?renderTasks():renderMore())+'</main><nav class="bottom-nav">'+nav()+'</nav></div>';
 if(state.detailKey){const i=buildTripView(t,state.data).details.get(state.detailKey);if(i)$('#item-detail-body').innerHTML=renderItemDetail(i,t);else closeDetail();}
}
function closeDetail(){state.detailKey=null;$('#item-detail').close();$('#item-detail-body').innerHTML='';}
async function load(){
 if(!config.url||!config.publishableKey)throw new Error('Trip service configuration missing.');
 const mod=await import('https://esm.sh/@supabase/supabase-js@2.117.1?bundle'),client=mod.createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.from('shared_japan_2026').select('*').single();if(error)throw error;
 state.trip={id:data.id,title:data.title,destination:data.destination,start_date:data.start_date,end_date:data.end_date,timezone:data.timezone||'UTC'};
 state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[],...(data.data||{})};render();
}
function fail(error){console.error(error);$('#app').innerHTML='<div class="auth-wrap"><div class="auth-card"><h1>Could not load the trip</h1><p>'+esc(error.message||'Please try again.')+'</p><button class="button" data-action="refresh">Retry</button></div></div>';}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-tab]');if(nav){state.tab=nav.dataset.tab;render();window.scrollTo({top:0,behavior:'instant'});return;}
 const day=e.target.closest('[data-plan-day]');if(day){state.selectedDay=day.hasAttribute("aria-expanded")&&state.selectedDay===day.dataset.planDay?null:day.dataset.planDay;render();return;}
 const filter=e.target.closest('[data-wallet-filter]');if(filter){state.walletFilter=filter.dataset.walletFilter;render();return;}
 const detail=e.target.closest('[data-detail]');if(detail){const i=buildTripView(state.trip,state.data).details.get(detail.dataset.detail);if(!i)return;state.detailKey=i.key;$('#item-detail-body').innerHTML=renderItemDetail(i,state.trip);if(!$('#item-detail').open)$('#item-detail').showModal();return;}
 const action=e.target.closest('[data-action]');if(action?.dataset.action==='close-detail')closeDetail();if(action?.dataset.action==='refresh')load().catch(fail);
});
document.addEventListener('input',e=>{if(e.target.id==='wallet-search'){const start=e.target.selectionStart;state.walletSearch=e.target.value;render();$('#wallet-search').focus();if(start!=null)$('#wallet-search').setSelectionRange(start,start);}});
$('#item-detail').addEventListener('cancel',()=>{state.detailKey=null;});$('#item-detail').addEventListener('click',e=>{if(e.target===$('#item-detail'))closeDetail();});
load().catch(fail);
