/* Shared-only filtering also protects owner-created exports and images. */
export function sharedData(data){
  const out={}, tables=Object.keys(data);
  for(const table of tables)out[table]=(data[table]||[]).filter(r=>r.visibility!=="private");
  const links={stop_id:"trip_stops",booking_id:"bookings",activity_id:"activities",transport_leg_id:"transport_legs"};
  let changed=true;
  while(changed){changed=false;for(const table of tables){const before=out[table].length;out[table]=out[table].filter(r=>Object.entries(links).every(([key,parent])=>!r[key]||out[parent]?.some(p=>p.id===r[key]&&p.trip_id===r.trip_id)));if(out[table].length!==before)changed=true;}}
  return out;
}
