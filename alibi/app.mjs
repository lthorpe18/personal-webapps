import { LEADS, VERSION, makeCase, dailyCode, normaliseCode, newState, validState, investigate, accuse, candidates } from './engine.mjs';

const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modal-content');
let storageAvailable = true;
let toastTimer;
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { storageAvailable = false; } }
let code = normaliseCode(new URL(location.href).searchParams.get('case') || dailyCode());
let game, state;
function load(nextCode) {
  game = makeCase(nextCode); code = game.code;
  const saved = read(`alibi-v${VERSION}-${code}`, null);
  state = validState(saved,code) ? saved : newState(code);
  write(`alibi-v${VERSION}-${code}`, state);
  const url = new URL(location.href); url.searchParams.set('case', code); history.replaceState(null,'',url);
  if (modal.open) modal.close();
  render();
}
function save() { write(`alibi-v${VERSION}-${code}`, state); }
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.remove('visible'),2800); }
function icon(name, cls='lead-icon') {
  const paths = {
    camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m7 7 2-3h6l2 3"/><circle cx="12" cy="13" r="4"/>',
    key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    cup:'<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Zm13 1h2a3 3 0 1 1 0 6h-2M7 3v2m5-2v2M2 22h18"/>',
    fingerprint:'<path d="M5 13V9a7 7 0 0 1 14 0v5M2 12v-2M8 18V9a4 4 0 0 1 8 0v8m-4-8v11m-7-3v3m14-3v3"/>',
    door:'<path d="M4 21V3h13v18M1 21h21M8 3v18m5-9h1m5-5h3v10h-3"/>',
    file:'<path d="M5 2h10l4 4v16H5Zm10 0v5h4M8 11h8m-8 4h8m-8 4h5"/>',
  };
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
}
function portrait(s) {
  const hair = ['<path d="M13 26c-2-17 27-22 26 3l-6-10-16 8Z"/>','<path d="M13 23c0-15 26-15 26 0l-10-6-11 7Z"/>','<path d="M11 39V24c0-20 29-20 29 0v16l-8-11-14-5Z"/>','<path d="m12 22 3-13 8 4 10-5 6 15-15-5Z"/>','<path d="M12 26c-1-18 27-22 28-3l-14-7-11 16Z"/>','<path d="M13 23c0-18 27-18 26 1l-6-7-15 4Z"/>'][s.id];
  return `<div class="portrait" style="--portrait:${s.colour}" aria-hidden="true"><svg viewBox="0 0 52 60"><path d="M2 65c0-20 12-25 24-25s25 5 25 25" fill="#263b32"/><path d="m19 40 7 11 8-11" fill="#e9e7d9"/><rect x="22" y="33" width="9" height="11" rx="3" fill="#d0b394"/><ellipse cx="26" cy="27" rx="12" ry="15" fill="#e0c6a8"/><g fill="#354137">${hair}</g><path d="M21 29h1m9 0h1" stroke="#354137" stroke-width="2" stroke-linecap="round"/>${s.id===3||s.id===5?'<g fill="none" stroke="#354137"><rect x="16" y="25" width="9" height="7" rx="2"/><rect x="28" y="25" width="9" height="7" rx="2"/><path d="M25 27h3"/></g>':''}<path d="M24 35h5" stroke="#ad8167" stroke-linecap="round"/></svg></div>`;
}
function render() {
  const done = state.accused !== null;
  const won = state.accused === game.culprit;
  const remaining = 3-state.opened.length;
  const isDaily = code === dailyCode();
  const culprit = game.suspects[game.culprit];
  app.innerHTML = `
    <div class="case-toolbar"><span class="tag">${done?'CASE CLOSED':isDaily?'TODAY’S CASE':'OPEN CASE'}</span><div class="toolbar-right"><span class="case-number">FILE ${escape(code)}</span><button class="text-button" data-action="share">Share case ↗</button></div></div>
    <section class="hero" aria-labelledby="case-title"><div><div class="eyebrow">THE ${escape(game.venue.toUpperCase())} AFFAIR</div><h1>Every story has<br>a <em>loose thread.</em></h1><p>During a private viewing at ${game.venue}, ${game.object} vanished.<br>Six guests. Three leads. One thief. Can you find the story that holds up?</p></div><div class="hero-art" aria-hidden="true"><svg class="case-art" viewBox="0 0 200 170" fill="none" stroke="currentColor"><path fill="#e5e7d9" stroke="#b5beaa" d="M24 10h130l23 23v127H24Z"/><path d="M154 10v23h23M38 45h70M38 53h43M38 135h100M38 143h65" stroke="#b5beaa"/><circle cx="105" cy="91" r="32" stroke="#718667" stroke-width="3"/><circle cx="105" cy="91" r="25" stroke="#a4b199"/><path d="m127 115 24 26" stroke="#718667" stroke-width="9"/><path d="m94 91 8 9 15-19" stroke="#718667" stroke-width="2"/></svg><span class="stamp">CONFIDENTIAL</span></div></section>
    ${!storageAvailable?'<p class="error" role="status">Browser storage is unavailable. You can play, but progress will not survive a refresh.</p>':''}
    ${done?`<section class="result" aria-label="Case result"><div><div class="eyebrow">${won?'EXCELLENT WORK, DETECTIVE':'A LOOSE THREAD MISSED'}</div><h2>${won?'Case cracked.':'The thief slipped away.'}</h2><p>${culprit.name} stole ${game.object}. ${won?`You followed ${state.opened.length} ${state.opened.length===1?'lead':'leads'} to the truth.`:`You accused ${game.suspects[state.accused].name}. The evidence points to ${culprit.name}.`} The full explanation is below.</p></div><div class="result-score">${won?'✓':'×'}<small>${won?'SOLVED':'UNSOLVED'}</small></div></section>`:
    `<div class="briefing">${icon('file','brief-icon')}<div><strong>Investigate. Compare the records. Make your accusation.</strong><p>Opening a new lead costs one action. Dossiers and your notebook are free.</p></div><button class="text-button rules-link" data-action="help">How to play</button></div>`}
    <div class="workspace">
      <section class="leads-panel" aria-labelledby="leads-title"><div class="section-top"><div class="section-label"><span class="section-no">01 /</span><h2 id="leads-title">Follow a lead</h2></div><div class="action-counter" role="status" aria-label="${remaining} investigation actions remaining">${[0,1,2].map(i=>`<span class="pip ${i<state.opened.length?'used':''}"></span>`).join('')}<span>${done?'CASE CLOSED':`${remaining} ACTION${remaining===1?'':'S'} LEFT`}</span></div></div>
      <div class="leads">${LEADS.map((lead,i)=>{const opened=state.opened.includes(i);return `<button class="lead ${opened?'opened':!remaining&&!done?'locked':''}" data-action="lead" data-id="${i}" ${!opened&&!remaining&&!done?'disabled':''} aria-label="${lead.title}. ${done?'Read report':opened?'Review evidence':`Investigate for one action. ${lead.hint}`}"><div class="lead-top">${icon(lead.icon)}<span class="lead-time">${lead.time}</span></div><h3>${lead.title}</h3><p>${lead.hint}</p><span class="lead-foot">${done?'READ REPORT ↗':opened?'✓ EVIDENCE FILED':'INVESTIGATE ↗'}</span></button>`}).join('')}</div>
      <p class="investigation-note">${done?'All six reports are now available to review.':remaining?'Choose carefully. Each lead reveals one piece of the story.':'Your investigation is complete. Compare the three reports and accuse a suspect.'}</p>
      <div class="notebook"><div class="notebook-head"><h3>YOUR EVIDENCE BOARD</h3><span>${state.opened.length} / 3 reports collected</span></div>${state.opened.length?state.opened.map((i,n)=>`<article class="evidence-note"><span class="eyebrow">${String(n+1).padStart(2,'0')} / ${LEADS[i].type} · ${LEADS[i].time}</span><p>${LEADS[i].evidence[game.answers[i]]}</p></article>`).join(''):'<div class="empty-note">The truth is in the details. Start with a lead.</div>'}</div>
      ${done?explanation():''}</section>
      <section class="suspects-panel" aria-labelledby="suspects-title"><div class="section-top"><div class="section-label"><span class="section-no">02 /</span><h2 id="suspects-title">The usual suspects</h2></div><span class="eyebrow" style="font-size:9px;color:var(--muted)">6 GUESTS</span></div><div class="suspects-grid">${game.suspects.map(s=>`<article class="suspect ${state.ruledOut.includes(s.id)&&!done?'eliminated':''} ${done&&s.id===game.culprit?'culprit':''} ${done&&s.id===state.accused&&!won?'wrong':''}"><button class="suspect-main" data-action="dossier" data-id="${s.id}" aria-label="Open ${s.name}’s dossier">${portrait(s)}<div><h3>${s.name}</h3><p>${s.role}</p></div></button>${done?`<div class="record-label">${s.id===game.culprit?'THE THIEF':s.id===state.accused?'WRONGLY ACCUSED':'CLEARED'}</div>`:`<div class="suspect-controls"><button data-action="rule-out" data-id="${s.id}" aria-pressed="${state.ruledOut.includes(s.id)}" aria-label="${state.ruledOut.includes(s.id)?'Restore':'Rule out'} ${s.name}">${state.ruledOut.includes(s.id)?'↶ Restore':'× Rule out'}</button><button data-action="accuse" data-id="${s.id}" ${!state.opened.length?'disabled':''} aria-label="Accuse ${s.name}">Accuse ↗</button></div>`}</article>`).join('')}</div><p class="suspect-help">Tap a guest to open their dossier. ${done?'Green marks the culprit.':'Ruling someone out is a note, not a verdict.'}</p>
      <aside class="accuse-box"><h3>${done?'One consistent story.':'Who doesn’t add up?'}</h3><p>${done?'The thief is the only guest whose verified records match every piece of evidence.':`Dossiers contain <strong>verified reception records</strong>. Evidence is reliable, and there is exactly one thief acting alone. No disguises, stolen passes or swapped belongings. Any three leads are enough to solve the case.`}</p></aside>
      <div class="timeline"><div class="eyebrow">THE EVENING, PIECE BY PIECE</div><div class="timeline-track">${LEADS.map((l,i)=>`<div class="timeline-point ${state.opened.includes(i)||done?'active':''}"><span class="timeline-dot"></span><span>${l.time}</span></div>`).join('')}</div></div></section>
    </div>
    <div class="bottom-bar"><p>${done?'There’s always another story.':'A good detective notices what doesn’t fit.'}</p><div class="button-row"><button class="button secondary" data-action="select-case">Enter case code</button><button class="button" data-action="new-case">${done?'Next case':'Another case'} <span aria-hidden="true">→</span></button></div></div>`;
}
function explanation() {
  const culprit=game.suspects[game.culprit];
  return `<section class="deduction"><span class="eyebrow">THE RECONSTRUCTION</span><h3>${culprit.name} is the only match.</h3><p>${state.opened.map(i=>`${LEADS[i].field.toLowerCase()}: <strong>${LEADS[i].values[game.answers[i]].toLowerCase()}</strong>`).join(' · ')}.</p><p>${candidates(game,state.opened).length===1?'Your collected reports uniquely identify the thief.':'You accused before your evidence uniquely identified one guest. All six reports together identify the thief.'} Here is why each other guest can be cleared:</p><ul>${game.suspects.filter(s=>s.id!==game.culprit).map(s=>{const i=state.opened.find(i=>s.traits[i]!==game.answers[i])??LEADS.findIndex((_,i)=>s.traits[i]!==game.answers[i]);return `<li><strong>${s.name}</strong> — ${LEADS[i].field.toLowerCase()}: ${LEADS[i].values[s.traits[i]].toLowerCase()}; the thief’s was ${LEADS[i].values[game.answers[i]].toLowerCase()}.${state.opened.includes(i)?'':' (From an uncollected report.)'}</li>`}).join('')}</ul></section>`;
}
function openModal(title, content, eyebrow='CASE NOTES') {
  modalContent.innerHTML=`<div class="modal-inner"><div class="modal-top"><div><div class="eyebrow" style="margin-bottom:8px;color:var(--muted)">${eyebrow}</div><h2 id="modal-title">${title}</h2></div><button class="close-button" data-action="close" aria-label="Close dialog">×</button></div>${content}</div>`;
  if(!modal.open) modal.showModal();
}
function help() {
  openModal('A little detective work.',`<p>Find the guest who stole ${game.object}. There is one thief, and every case has a logical solution.</p><ol><li><strong>Read the dossiers.</strong> Tap any guest. Their six reception records are verified facts.</li><li><strong>Choose up to three leads.</strong> Each new report costs one action. Reports describe the thief; compare them with the dossiers.</li><li><strong>Cross off contradictions.</strong> Rule out guests whose records don’t fit. These notes are yours to change.</li><li><strong>Make your accusation.</strong> Choose the only guest consistent with the evidence. You can accuse early, but your choice is final.</li></ol><p>Any three leads identify exactly one suspect. Dossiers, rereading evidence and ruling people out cost nothing. All evidence is reliable: no disguises, shared passes or swapped belongings.</p><p>A new daily case appears at midnight UTC. Case codes let others play the same puzzle. Progress and results stay in this browser.</p><div class="button-row"><button class="button" data-action="close">Let’s investigate →</button></div>`,'HOW TO PLAY');
}
function dossier(id) {
  const s=game.suspects[id];
  openModal('Guest dossier',`<div class="dossier-head">${portrait(s)}<div><h3>${s.name}</h3><p>${s.role}</p></div></div><p>Verified at reception, 20:50. These records are facts, not the guest’s claims.</p>${LEADS.map((l,i)=>`<div class="fact-row"><span>${l.field}</span><strong>${l.values[s.traits[i]]}</strong></div>`).join('')}<div class="button-row">${state.accused===null?`<button class="button secondary" data-action="rule-dossier" data-id="${id}">${state.ruledOut.includes(id)?'Restore suspect':'Rule out suspect'}</button><button class="button" data-action="accuse" data-id="${id}" ${!state.opened.length?'disabled':''}>Accuse ${s.name.split(' ')[0]} ↗</button>`:'<button class="button secondary" data-action="close">Back to case</button>'}</div>`,'RECEPTION / VERIFIED RECORD');
}
function showLead(id) {
  if(!Number.isInteger(id)||id<0||id>5)return;
  const done=state.accused!==null;
  if(!done&&!state.opened.includes(id)) {
    if(state.opened.length>=3)return;
    state=investigate(state,id);save();render();
  }
  const lead=LEADS[id];
  openModal(lead.title,`<div class="clue-card"><span class="eyebrow">${lead.type} / ${lead.time}</span><p>${lead.evidence[game.answers[id]]}</p></div><p>Compare this report with the guests’ verified ${lead.field.toLowerCase()} records.</p><div class="button-row"><button class="button" data-action="close">Back to the case →</button></div>`,done?'CASE ARCHIVE':'EVIDENCE FILED');
}
function confirmAccusation(id) {
  if(state.accused!==null||!state.opened.length)return;
  const s=game.suspects[id];if(!s)return;
  openModal(`Accuse ${s.name.split(' ')[0]}?`,`<p>You believe <strong>${s.name}</strong> stole ${game.object}. You’ve collected ${state.opened.length} of three reports.</p><p>This closes the case and reveals the full explanation. Your accusation is final.</p><div class="button-row"><button class="button secondary" data-action="close">Keep thinking</button><button class="button" data-action="confirm" data-id="${id}">Make accusation →</button></div>`,'YOUR FINAL CALL');
}
function recordResult() {
  const old=read('alibi-record-v1',[]);
  const records=Array.isArray(old)?old.filter(r=>r&&typeof r.code==='string'&&typeof r.won==='boolean'&&Number.isInteger(r.leads)&&r.leads>=1&&r.leads<=3):[];
  if(!records.some(r=>r.code===code)) { records.unshift({code,won:state.accused===game.culprit,leads:state.opened.length});write('alibi-record-v1',records.slice(0,200)); }
}
function stats() {
  const old=read('alibi-record-v1',[]);
  const records=Array.isArray(old)?old.filter(r=>r&&typeof r.code==='string'&&typeof r.won==='boolean'&&Number.isInteger(r.leads)&&r.leads>=1&&r.leads<=3):[];
  const wins=records.filter(r=>r.won).length;
  openModal('Your detective record.',`<div class="stats-row"><div class="stat"><strong>${records.length}</strong><span>CASES CLOSED</span></div><div class="stat"><strong>${wins}</strong><span>CASES SOLVED</span></div><div class="stat"><strong>${records.length?Math.round(wins/records.length*100):0}%</strong><span>SUCCESS RATE</span></div></div>${records.length?records.slice(0,8).map(r=>`<div class="history-line"><span>${escape(r.code)}</span><span>${r.won?'✓ Solved':'× Unsolved'} · ${r.leads} leads</span></div>`).join(''):'<p>Your first case is waiting. Close it to start your record.</p>'}<p>Saved on this device. Each case counts once. No account needed.</p>`,'THE DETECTIVE’S DESK');
}
function selectCase() {
  openModal('Pick up a case.',`<p>Enter a code from a friend, return to today’s case, or start a fresh mystery. Your current progress is saved.</p><form id="case-form"><label class="field-label" for="case-code">CASE CODE</label><input class="modal-input" id="case-code" name="code" maxlength="32" placeholder="e.g. D-20261112" autocomplete="off" autocapitalize="characters" spellcheck="false" pattern="[A-Za-z0-9-]+" required><p id="code-error" class="error" role="alert"></p><div class="button-row"><button class="button" type="submit">Open case →</button><button class="button secondary" type="button" data-action="daily">Today’s case</button></div></form>`,'ANOTHER STORY');
}
async function share() {
  const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('case',code);
  try { await navigator.clipboard.writeText(url.href);toast('Case link copied. No spoilers included.'); }
  catch { openModal('Share this case.',`<p>Send this link to play the same mystery. Your evidence, accusation and notes are not shared.</p><label class="field-label" for="share-url">CASE LINK</label><input class="modal-input" id="share-url" value="${escape(url.href)}" readonly><p>Select and copy the link above.</p>`);document.querySelector('#share-url').select(); }
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]');if(!button||button.disabled)return;
  const id=Number(button.dataset.id);
  switch(button.dataset.action) {
    case 'help':help();break;
    case 'close':modal.close();break;
    case 'lead':showLead(id);break;
    case 'dossier':dossier(id);break;
    case 'rule-out':case 'rule-dossier': {
      if(state.accused!==null)return;
      const ruledOut=state.ruledOut.includes(id)?state.ruledOut.filter(i=>i!==id):[...state.ruledOut,id];
      state={...state,ruledOut};save();render();
      if(button.dataset.action==='rule-dossier')dossier(id);
      else { document.querySelector(`[data-action="rule-out"][data-id="${id}"]`)?.focus(); }
      break;
    }
    case 'accuse':confirmAccusation(id);break;
    case 'confirm':if(state.accused===null&&state.opened.length){state=accuse(state,id);save();recordResult();modal.close();render();window.scrollTo({top:0,behavior:'smooth'});const result=document.querySelector('.result');result.tabIndex=-1;result.focus({preventScroll:true});}break;
    case 'share':share();break;
    case 'select-case':selectCase();break;
    case 'daily':load(dailyCode());break;
    case 'new-case':load(`R-${Array.from(crypto.getRandomValues(new Uint8Array(4)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase()}`);toast('A new case is on your desk.');window.scrollTo({top:0,behavior:'smooth'});break;
  }
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='case-form')return;event.preventDefault();
  const raw=new FormData(event.target).get('code').trim();
  if(!/^[a-z0-9-]{1,32}$/i.test(raw)){document.querySelector('#code-error').textContent='Use 1–32 letters, numbers or hyphens.';return;}
  load(raw);toast('Case opened.');window.scrollTo({top:0,behavior:'smooth'});
});
document.querySelector('#help-button').addEventListener('click',help);
document.querySelector('#stats-button').addEventListener('click',stats);
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
load(code);
