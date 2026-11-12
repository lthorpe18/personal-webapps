export const VERSION = 1;
export const PEOPLE = [
  { name: 'Ada Sterling', role: 'The curator', initials: 'AS', colour: '#9fae91' },
  { name: 'Felix March', role: 'The illusionist', initials: 'FM', colour: '#c5a078' },
  { name: 'Iris Vale', role: 'The botanist', initials: 'IV', colour: '#b3a1b7' },
  { name: 'Jasper Reed', role: 'The journalist', initials: 'JR', colour: '#86a6b2' },
  { name: 'Nora Finch', role: 'The architect', initials: 'NF', colour: '#c18f86' },
  { name: 'Oscar Bell', role: 'The collector', initials: 'OB', colour: '#b6ae80' },
];
export const LEADS = [
  { id: 'camera', icon: 'camera', title: 'Recover the camera', type: 'CCTV', time: '21:04', field: 'Coat', values: ['Dark wool', 'Light linen'],
    hint: 'A partial silhouette at the gallery door.',
    evidence: ['The gallery camera shows the thief in a dark wool coat. The face is out of frame.', 'The gallery camera shows the thief in a light linen coat. The face is out of frame.'] },
  { id: 'access', icon: 'key', title: 'Check the access log', type: 'ACCESS LOG', time: '21:06', field: 'Badge', values: ['Circle emblem', 'Triangle emblem'],
    hint: 'The display-room reader logged a badge type.',
    evidence: ['The stolen display was opened with a circle-emblem guest badge. The reader did not save its individual number.', 'The stolen display was opened with a triangle-emblem guest badge. The reader did not save its individual number.'] },
  { id: 'witness', icon: 'eye', title: 'Interview the porter', type: 'WITNESS', time: '21:08', field: 'Arrival route', values: ['East staircase', 'West corridor'],
    hint: 'Someone saw the thief approach the display.',
    evidence: ['The porter saw the thief arrive by the east staircase, still wearing their issued route ribbon. Guest route allocations were enforced tonight.', 'The porter saw the thief arrive by the west corridor, still wearing their issued route ribbon. Guest route allocations were enforced tonight.'] },
  { id: 'glass', icon: 'cup', title: 'Examine the cup', type: 'LAB REPORT', time: '21:10', field: 'Drink', values: ['Black coffee', 'Jasmine tea'],
    hint: 'The thief left a freshly used cup by the case.',
    evidence: ['The thief’s cup contains black coffee. Staff confirm each guest kept their own pre-ordered drink; there were no swaps or refills.', 'The thief’s cup contains jasmine tea. Staff confirm each guest kept their own pre-ordered drink; there were no swaps or refills.'] },
  { id: 'fibre', icon: 'fingerprint', title: 'Analyse the fibres', type: 'FORENSICS', time: '21:12', field: 'Gloves', values: ['Leather gloves', 'Cotton gloves'],
    hint: 'A glove brushed the broken display seal.',
    evidence: ['The display seal caught leather fibres from the thief’s gloves. Each guest wore the pair recorded at reception throughout the evening.', 'The display seal caught cotton fibres from the thief’s gloves. Each guest wore the pair recorded at reception throughout the evening.'] },
  { id: 'gate', icon: 'door', title: 'Trace the exit', type: 'SECURITY', time: '21:16', field: 'Exit pass', values: ['Garden gate', 'Courtyard gate'],
    hint: 'The thief left through a pass-controlled gate.',
    evidence: ['Security tracked the thief leaving through the garden gate. Only a garden-gate pass opens it, and every guest retained their own pass.', 'Security tracked the thief leaving through the courtyard gate. Only a courtyard-gate pass opens it, and every guest retained their own pass.'] },
];
function hash(input) {
  let h = 2166136261;
  for (const c of input) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function random(seed) {
  let n = hash(seed);
  return () => { n += 0x6d2b79f5; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function normaliseCode(code) {
  return String(code).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
}
export function dailyCode(date = new Date()) {
  return `D-${date.getUTCFullYear()}${String(date.getUTCMonth()+1).padStart(2,'0')}${String(date.getUTCDate()).padStart(2,'0')}`;
}
export function makeCase(rawCode) {
  const code = normaliseCode(rawCode) || dailyCode();
  const rng = random(`alibi-${VERSION}-${code}`);
  const culprit = Math.floor(rng() * 6);
  const answers = LEADS.map(() => Math.floor(rng() * 2));
  // A shuffled six-cycle with one edge removed gives five distinct pairs.
  // Each innocent matches exactly two leads; any three leads exclude them.
  // Every lead retains at least one innocent, so no single lead solves a case.
  const cycle = shuffle([0,1,2,3,4,5], rng);
  const pairs = shuffle(cycle.slice(0,5).map((n,i) => [n, cycle[i+1]]), rng);
  let p = 0;
  const suspects = PEOPLE.map((person, id) => {
    const matches = id === culprit ? [0,1,2,3,4,5] : pairs[p++];
    return { ...person, id, traits: answers.map((a,i) => matches.includes(i) ? a : 1-a) };
  });
  const venues = ['Briar House', 'The Ashcombe Gallery', 'Wrenwood Hall', 'The Glasshouse', 'Blackthorn Manor', 'The Bellweather Club'];
  const objects = ['the Moonstone brooch', 'the silver nightingale', 'the emerald compass', 'the sapphire moth', 'the golden fox', 'the opal locket'];
  return { version: VERSION, code, culprit, answers, suspects, venue: venues[Math.floor(rng()*venues.length)], object: objects[Math.floor(rng()*objects.length)] };
}
export function candidates(game, opened) {
  return game.suspects.filter(s => opened.every(i => s.traits[i] === game.answers[i])).map(s => s.id);
}
export function newState(code) {
  const game = makeCase(code);
  return { version: VERSION, code: game.code, opened: [], ruledOut: [], accused: null, startedAt: Date.now(), finishedAt: null };
}
export function validState(value, code) {
  return value && value.version === VERSION && value.code === code && Array.isArray(value.opened) && value.opened.length <= 3 && new Set(value.opened).size === value.opened.length && value.opened.every(i=>Number.isInteger(i)&&i>=0&&i<6) && Array.isArray(value.ruledOut) && new Set(value.ruledOut).size === value.ruledOut.length && value.ruledOut.every(i=>Number.isInteger(i)&&i>=0&&i<6) && (value.accused === null || (Number.isInteger(value.accused)&&value.accused>=0&&value.accused<6&&value.opened.length>0)) && Number.isFinite(value.startedAt) && (value.accused === null ? value.finishedAt === null : Number.isFinite(value.finishedAt));
}
export function investigate(state, index) {
  if (state.accused !== null || state.opened.length >= 3 || state.opened.includes(index) || !Number.isInteger(index) || index<0 || index>=6) return state;
  return { ...state, opened: [...state.opened, index] };
}
export function accuse(state, id) {
  if (state.accused !== null || !state.opened.length || !Number.isInteger(id) || id<0 || id>=6) return state;
  return { ...state, accused: id, finishedAt: Date.now() };
}
