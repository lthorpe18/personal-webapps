import {costEntries,renderCosts,splitRow,validateExpense,equalShares,percentShare} from './costs.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sharedData} from './privacy-ui.js';
import {navigationIcon,buildTripView,renderPlan as renderUnifiedPlan,renderWallet,renderItemDetail} from './trip-view.js';
const fixture={bookings:[{id:'b',trip_id:'t',visibility:'private'}],activities:[{id:'a',trip_id:'t',booking_id:'b',visibility:'shared'},{id:'safe',trip_id:'t',visibility:'shared'}],trip_assets:[{id:'ticket',trip_id:'t',activity_id:'a'}],trip_stops:[]};
assert.deepEqual(sharedData(fixture).activities.map(a=>a.id),['safe']);
assert.equal(sharedData(fixture).trip_assets.length,0);
assert.equal(fixture.activities.length,2,'Filter must not alter original trip data');
const nodes=new Map();
const element=()=>({innerHTML:'',textContent:'',hidden:false,dataset:{},classList:{add(){},remove(){}},querySelector(){return {focus(){}}},insertAdjacentHTML(_,html){this.innerHTML+=html},showModal(){this.open=true},close(){this.open=false},removeAttribute(){},addEventListener(){}});
const context={console,URL,URLSearchParams,crypto:globalThis.crypto,setTimeout,clearTimeout,location:{search:'',protocol:'http:',hostname:'test'},navigator:{onLine:true},window:{TRIP_PLANNER_CONFIG:{},addEventListener(){}},document:{querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)},addEventListener(){}},localStorage:{getItem(){return null},setItem(){}},Blob};
vm.createContext(context);
let source=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^init\(\);$/m,'');
Object.assign(context,{costEntries,renderCosts,splitRow,validateExpense,equalShares,percentShare,sharedData,navigationIcon,buildTripView,renderUnifiedPlan,renderWallet,renderItemDetail});
vm.runInContext(source,context);
vm.runInContext(`
const sample=demoFixture();state.demo=true;state.trips=[sample.t];state.tripId=sample.t.id;state.data={transport_legs:[],trip_assets:[],...sample.d};state.members=[];
for(const tab of ['plan','tasks','wallet','costs','more']){state.tab=tab;render();if(!$('#app').innerHTML.includes('layout'))throw new Error('Render failed: '+tab);}
openEditor('task');if(!$('#editor-fields').innerHTML.includes('Visibility'))throw new Error('Missing visibility control');
state.tab='plan';state.demo=false;state.user={id:'viewer'};state.trips[0].created_by='owner';state.member={role:'viewer'};if(canEdit())throw new Error('Viewer can edit');
state.user.id='owner';state.preview=true;if(canEdit())throw new Error('Preview can edit');render();if($('#app').innerHTML.includes('data-action="new-task"'))throw new Error('Preview shows an edit action');if(!$('#app').innerHTML.includes('Shared member preview'))throw new Error('Missing preview banner');
state.preview=false;state.data.tasks[0].visibility='private';if(!privacyBadge(state.data.tasks[0]).includes('Private'))throw new Error('Private badge missing');
`,context);
await vm.runInContext(`(async()=>{
  state.preview=true;state.data={tasks:[],trip_stops:[],activities:[],bookings:[],decisions:[],transport_legs:[],trip_assets:[]};
  let requested=false,resolveSnapshot;
  const snapshot=new Promise(resolve=>resolveSnapshot=resolve);
  state.client={from(table){return {select(){return this},eq(){return this},order(){return this},then(resolve){return Promise.resolve({data:table==='tasks'?[{id:'private-fetch',visibility:'private'}]:[]}).then(resolve)}}},rpc(name){if(name==='preview_shared_trip'){requested=true;return snapshot;}return Promise.resolve({data:[{user_id:'owner',role:'owner'}]});}};
  const pending=loadTrip();while(!requested)await Promise.resolve();
  if(state.data.tasks.length)throw new Error('Owner records entered preview before server filtering');
  state.preview=false;state.refreshVersion++;resolveSnapshot({data:{tasks:[{id:'stale'}]}});await pending;
  if(state.data.tasks.length)throw new Error('Stale preview overwrote the current view');
})()`,context);
console.log('PASS: export parent filtering, immutability, main view rendering, privacy editor, read-only controls and asynchronous preview isolation');

await vm.runInContext(`(async()=>{
 const sample=demoFixture();state.demo=true;state.preview=false;state.trips=[sample.t];state.tripId=sample.t.id;state.data=sample.d;
 const booking=state.data.bookings.find(b=>b.amount!=null),key='booking:'+booking.id;
 if(!item('expense',key)?.from_booking)throw new Error('Automatic booking lookup missing');
 const count=costEntries(state.data).length;
 await settleExpense(key,'vendor');
 if(costEntries(state.data).length!==count)throw new Error('First payment duplicated booking cost');
 const saved=state.data.trip_expenses.find(e=>e.booking_id===booking.id);
 if(!saved||saved.vendor_paid!==booking.amount)throw new Error('First payment was not saved');
 if(booking.vendor_paid!==undefined)throw new Error('Booking record modified');
})()`,context);
console.log('PASS: first booking payment persists as one cost without modifying the booking');
