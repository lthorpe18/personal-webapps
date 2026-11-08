import assert from 'node:assert/strict';
import {buildTripView,renderPlan,renderWallet,renderItemDetail} from './trip-view.js';
import {sharedData} from './privacy-ui.js';
const trip={id:'t',title:'Example holiday',destination:'Example country',start_date:'2027-02-01',end_date:'2027-02-03',timezone:'Asia/Tokyo'};
const data={
 trip_stops:[{id:'s',trip_id:'t',location:'City B',accommodation_name:'Guest house',starts_on:'2027-02-02',ends_on:'2027-02-03',status:'booked'}],
 bookings:[{id:'hotel',trip_id:'t',title:'House reservation',category:'accommodation',stop_id:'s',start_date:'2027-02-02',end_date:'2027-02-03',status:'booked',check_in_time:'16:00',check_out_time:'10:00',booking_reference:'SECRET-REFERENCE',notes:'<script>unsafe</script>'},{id:'rail',trip_id:'t',title:'Rail reservation',category:'transport',start_date:'2027-02-02',status:'booked'}],
 activities:[{id:'a',trip_id:'t',title:'Travel to City B',type:'transport',activity_date:'2027-02-02',booking_id:'rail'},{id:'unrelated',trip_id:'t',title:'Evening transfer',type:'transport',location:'Other place',activity_date:'2027-02-02'},{id:'flex',trip_id:'t',title:'Walk in the park',type:'sightseeing'}],
 transport_legs:[{id:'l1',trip_id:'t',activity_date:'2027-02-02',departure_name:'City A',arrival_name:'Interchange',booking_id:'rail',departs_at:'2027-02-02T00:00:00Z',arrives_at:'2027-02-02T00:30:00Z',reservation_status:'booked'},{id:'l2',trip_id:'t',activity_date:'2027-02-02',departure_name:'Interchange',arrival_name:'City B',booking_id:'rail',departs_at:'2027-02-02T01:00:00Z',arrives_at:'2027-02-02T02:00:00Z',reservation_status:'booked'}],
 trip_assets:[{id:'qr',trip_id:'t',title:'Rail ticket',booking_id:'rail',data_url:'qr:EXAMPLE',mime_type:'application/x-qr-payload'}],tasks:[],decisions:[]
};
const before=JSON.stringify(data),m=buildTripView(trip,data);
assert.equal(m.items.filter(i=>i.kind==='travel').length,2,'One grouped journey and one unrelated activity');
assert.equal(m.details.get('activity:a').legs.length,2);
assert.equal(m.wallet.find(i=>i.booking?.id==='rail').key,'activity:a','Wallet and Plan open the same item');
assert.equal(m.wallet.find(i=>i.booking?.id==='hotel').key,'stop:s','Stay and reservation are combined');
assert.equal(m.byDate.get('2027-02-02').events.filter(i=>i.kind==='stay').length,1);
assert.equal(m.byDate.get('2027-02-03').events[0].stayAction,'Check out');
assert.equal(m.flexible.length,1);
const collapsed=renderPlan(trip,data);
assert.ok(!collapsed.includes('SECRET-REFERENCE'),'References stay behind the detail sheet');
assert.ok(!collapsed.includes('unsafe'),'Notes stay behind the detail sheet');
const detail=renderItemDetail(m.details.get('stop:s'),trip,{canEdit:true});
assert.ok(detail.includes('SECRET-REFERENCE'));
assert.ok(!detail.includes('<script>'));
assert.ok(detail.includes('Edit stay')&&detail.includes('Edit booking'));
const wallet=renderWallet(trip,data,{search:'Rail ticket'});
assert.ok(wallet.includes('data-detail="activity:a"'));
assert.ok(!wallet.includes('Guest house'));
assert.equal(JSON.stringify(data),before,'Presentation must never mutate source records');
const legacy=structuredClone(data);delete legacy.activities[0].booking_id;
legacy.activities[0].title='Harborview → Hillcrest';legacy.bookings[1].title='Harborview to Hillcrest rail reservation';
legacy.transport_legs[0].departure_name='Harborview';legacy.transport_legs[1].arrival_name='Hillcrest';
for(const l of legacy.transport_legs)delete l.booking_id;
const legacyModel=buildTripView(trip,legacy);
assert.equal(legacyModel.items.filter(i=>i.kind==='travel').length,2,'Legacy/public data must not duplicate the reservation');
assert.equal(legacyModel.wallet.find(i=>i.booking?.id==='rail').key,'activity:a');
const archived=structuredClone(data);archived.bookings.push({id:'cancelled',title:'Old reservation',category:'other',status:'cancelled'});
assert.ok(buildTripView(trip,archived).details.has('booking:cancelled'),'Cancelled bookings remain accessible');
const privateData=structuredClone(data);privateData.bookings[1].visibility='private';
const visible=sharedData(privateData),filtered=buildTripView(trip,visible);
assert.ok(!filtered.details.has('activity:a'));
assert.ok(!filtered.details.has('asset:qr'));
assert.ok(!renderPlan(trip,visible,{expandedDay:'2027-02-02'}).includes('Rail ticket'));
// Sparse anonymous public projections contain no notes, references or assets.
const publicData={trip_stops:data.trip_stops,bookings:[{id:'public',title:'Public stay',category:'accommodation',start_date:'2027-02-02',end_date:'2027-02-03',status:'booked'}]};
assert.ok(renderPlan(trip,publicData,{expandedDay:'2027-02-02'}).includes('Guest house'));
assert.ok(!renderWallet(trip,publicData,{isPublic:true}).includes('data-action="edit-'));
assert.ok(renderItemDetail(buildTripView(trip,publicData).stays[0],trip).includes('Guest house'));
console.log('PASS: journey/stay consolidation, shared detail identity, wallet ticket search, check-in/out, flexible plans, privacy, sparse public data, escaping and immutability');
