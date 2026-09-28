/* Private, client-side itinerary PNG export. No analytics, uploads or booking data. */

const utcDay = iso => new Date(iso + "T12:00:00Z");
const isoDay = date => date.toISOString().slice(0,10);
const nextDay = iso => {
  const date = utcDay(iso);
  date.setUTCDate(date.getUTCDate() + 1);
  return isoDay(date);
};
const monthOf = iso => utcDay(iso).toLocaleDateString("en-GB",{month:"short",timeZone:"UTC"}).toUpperCase();
const dayOf = iso => utcDay(iso).getUTCDate();

function dateLabel(from,to){
  if(from===to)return dayOf(from)+" "+monthOf(from);
  const sameMonth=from.slice(0,7)===to.slice(0,7);
  if(sameMonth)return dayOf(from)+"–"+dayOf(to)+" "+monthOf(to);
  return dayOf(from)+" "+monthOf(from)+" – "+dayOf(to)+" "+monthOf(to);
}
function headingFor(trip){
  const start=trip.start_date,end=trip.end_date;
  const range=fromToHeading(start,end);
  return String(trip.destination||trip.title||"TRIP").toLocaleUpperCase("en-GB")+" • "+range;
}
function fromToHeading(from,to){
  if(from===to)return dayOf(from)+" "+monthOf(to)+" "+to.slice(0,4);
  if(from.slice(0,7)===to.slice(0,7))return dayOf(from)+"–"+dayOf(to)+" "+monthOf(to)+" "+to.slice(0,4);
  if(from.slice(0,4)===to.slice(0,4))return dayOf(from)+" "+monthOf(from)+" – "+dayOf(to)+" "+monthOf(to)+" "+to.slice(0,4);
  return dayOf(from)+" "+monthOf(from)+" "+from.slice(0,4)+" – "+dayOf(to)+" "+monthOf(to)+" "+to.slice(0,4);
}
function activityText(activity,{detailed,includeNotes}){
  const title=String(activity.title||"").trim();
  const location=String(activity.location||"").trim();
  const notes=String(activity.notes||"").trim();
  let text=title||"Activity";
  if(detailed&&location&&!title.toLocaleLowerCase().includes(location.toLocaleLowerCase()))text+=" — "+location;
  if(includeNotes&&notes)text+=". "+notes;
  return text;
}
function activeStop(stops,date){
  const matching=stops.filter(stop=>stop.starts_on<=date && date<stop.ends_on);
  matching.sort((a,b)=>String(b.starts_on).localeCompare(String(a.starts_on))||
    Number(b.status==="booked")-Number(a.status==="booked"));
  return matching[0]||null;
}
function baseForDate(date,stops,activities,tripEnd){
  const current=activeStop(stops,date);
  const previous=activeStop(stops,isoDay(new Date(utcDay(date).getTime()-86400000)));
  let base=current?.location||((date===tripEnd&&previous?.ends_on===date)?previous.location:"");
  // Use the destination overnight base; route labels come from explicitly entered transport locations.
  const travel=activities.find(a=>a.type==="transport"&&
    /[→➜]/.test(String(a.location||""))&&String(a.location).length<=65);
  if(travel)base=travel.location;
  if(!base)base=activities.find(a=>a.location)?.location||"Travel / flexible";
  return base;
}
function appendRow(rows,day,base,activities,options){
  rows.push({
    date:dateLabel(day,day),
    base,
    activities:activities.map(a=>activityText(a,options)).join("; ")
  });
}
/**
 * Derive a share-safe public-looking table from the CURRENT trip's data only.
 * No bookings, references, prices, tasks or decision notes are ever read here.
 * Activity notes are opt-in, with a separate warning in the UI.
 */
export function buildItineraryExportRows({trip,stops=[],activities=[],detailed=false,includeNotes=false}){
  if(!trip?.start_date||!trip?.end_date)throw new Error("Set trip dates before sharing your itinerary.");
  const start=trip.start_date,end=trip.end_date;
  const length=Math.round((Date.parse(end+"T12:00:00Z")-Date.parse(start+"T12:00:00Z"))/86400000)+1;
  if(!Number.isFinite(length)||length<1||length>100)throw new Error("Image export supports trips lasting 1–100 days.");
  const safeStops=stops.filter(s=>s&&s.status!=="cancelled"&&s.starts_on&&s.ends_on);
  const safeActivities=activities.filter(a=>a&&a.status!=="dropped"&&a.status!=="cancelled");
  const byDay=new Map();
  for(const activity of safeActivities){
    if(!activity.activity_date||activity.activity_date<start||activity.activity_date>end)continue;
    const list=byDay.get(activity.activity_date)||[];
    list.push(activity);byDay.set(activity.activity_date,list);
  }
  const rows=[];
  let day=start;
  while(day<=end){
    const dated=byDay.get(day)||[];
    const base=baseForDate(day,safeStops,dated,end);
    if(dated.length){
      appendRow(rows,day,base,dated,{detailed,includeNotes});
      day=nextDay(day);continue;
    }
    const first=day;
    let last=day;
    while(last<end){
      const next=nextDay(last);
      if((byDay.get(next)||[]).length||baseForDate(next,safeStops,[],end)!==base)break;
      last=next;
    }
    rows.push({date:dateLabel(first,last),base,activities:"Flexible day"+(first===last?"":"s")+" / plans to confirm"});
    day=nextDay(last);
  }
  // Undated ideas are clearly labelled; never claim an unconfirmed specific day.
  for(const activity of safeActivities.filter(a=>!a.activity_date)){
    rows.push({
      date:"FLEXIBLE",
      base:String(activity.location||"OPTION").trim(),
      activities:activityText(activity,{detailed,includeNotes})
    });
  }
  return rows;
}

function wrapText(ctx,text,maxWidth){
  const lines=[];
  for(const paragraph of String(text??"").replace(/\r/g,"").split("\n")){
    const words=paragraph.split(/\s+/).filter(Boolean);
    if(!words.length){lines.push("");continue;}
    let line="";
    for(const word of words){
      if(line&&ctx.measureText(line+" "+word).width<=maxWidth){line+=" "+word;continue;}
      if(line){lines.push(line);line="";}
      // Split unbroken URLs and other long tokens before they overflow a cell.
      for(const char of Array.from(word)){
        if(line&&ctx.measureText(line+char).width>maxWidth){lines.push(line);line="";}
        line+=char;
      }
    }
    if(line)lines.push(line);
  }
  return lines.length?lines:[""];
}
function fontFor(index){return (index===2?"400":"700")+" 25px Arial, Helvetica, sans-serif";}
function preparedRow(ctx,row,widths,padX,lineHeight,padY){
  const values=[row.date,row.base,row.activities];
  const lines=values.map((v,i)=>{
    ctx.font=fontFor(i);
    return wrapText(ctx,v,widths[i]-padX*2);
  });
  const maxLines=Math.max(...lines.map(x=>x.length));
  return {lines,height:Math.max(72,maxLines*lineHeight+padY*2)};
}
function canvasBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Could not create a PNG image.")),"image/png"));
}
export async function makeItineraryPng({trip,rows}){
  if(!rows?.length)throw new Error("There is no itinerary to share.");
  const width=1320,margin=26,columns=[225,340,width-margin*2-565];
  const tableWidth=width-margin*2,headerHeight=65,padX=16,padY=14,lineHeight=36;
  const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
  if(!ctx)throw new Error("Image export is not available in this browser.");
  const prepared=rows.map(row=>preparedRow(ctx,row,columns,padX,lineHeight,padY));
  const title=headingFor(trip),titleHeight=120;
  const height=titleHeight+headerHeight+prepared.reduce((n,r)=>n+r.height,0)+35;
  if(height>12000)throw new Error("This itinerary is too long for a single image.");
  canvas.width=width;canvas.height=height;
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,width,height);
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#111111";
  let titleSize=46;
  do{ctx.font="800 "+titleSize+"px Arial, Helvetica, sans-serif";if(ctx.measureText(title).width<=tableWidth-20)break;titleSize-=2;}while(titleSize>24);
  const titleLines=wrapText(ctx,title,tableWidth-20).slice(0,2);
  const titleY=titleLines.length===1?59:42;
  titleLines.forEach((line,i)=>ctx.fillText(line,width/2,titleY+i*(titleSize+4)));
  let y=titleHeight;
  ctx.fillStyle="#deedfc";ctx.fillRect(margin,y,tableWidth,headerHeight);
  ctx.fillStyle="#101010";ctx.font="800 26px Arial, Helvetica, sans-serif";
  const headers=["DATE","BASE / ROUTE","ACTIVITIES"];
  let x=margin;
  headers.forEach((h,i)=>{ctx.fillText(h,x+columns[i]/2,y+headerHeight/2);x+=columns[i];});
  ctx.strokeStyle="#1b1b1b";ctx.lineWidth=1.5;
  ctx.strokeRect(margin+.5,y+.5,tableWidth,headerHeight);
  y+=headerHeight;
  for(const entry of prepared){
    ctx.strokeRect(margin+.5,y+.5,tableWidth,entry.height);
    let colX=margin;
    for(let i=0;i<3;i++){
      ctx.fillStyle="#161616";ctx.font=fontFor(i);
      ctx.textAlign="left";ctx.textBaseline="top";
      entry.lines[i].forEach((line,j)=>ctx.fillText(line,colX+padX,y+padY+j*lineHeight));
      colX+=columns[i];
      if(i<2){ctx.beginPath();ctx.moveTo(colX+.5,y);ctx.lineTo(colX+.5,y+entry.height);ctx.stroke();}
    }
    y+=entry.height;
  }
  x=margin+columns[0];
  ctx.beginPath();ctx.moveTo(x+.5,titleHeight);ctx.lineTo(x+.5,y);ctx.stroke();
  x+=columns[1];
  ctx.beginPath();ctx.moveTo(x+.5,titleHeight);ctx.lineTo(x+.5,y);ctx.stroke();
  return canvasBlob(canvas);
}
