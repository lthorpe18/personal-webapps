import assert from 'node:assert/strict';
import {makeCase,candidates,newState,investigate,accuse,validState,normaliseCode,dailyCode} from './engine.mjs';

for(let n=0;n<10000;n++) {
  const g=makeCase(`TEST-${n}`);
  assert.deepEqual(candidates(g,[0,1,2,3,4,5]),[g.culprit]);
  for(let a=0;a<6;a++) {
    assert.ok(candidates(g,[a]).length>=2,'No single report gives away the answer');
    for(let b=a+1;b<6;b++)for(let c=b+1;c<6;c++)assert.deepEqual(candidates(g,[a,b,c]),[g.culprit],`Ambiguous triple ${n}: ${a},${b},${c}`);
  }
  for(const s of g.suspects)assert.equal(s.traits.filter((t,i)=>t===g.answers[i]).length,s.id===g.culprit?6:2);
}
assert.deepEqual(makeCase('FRIENDS'),makeCase(' friends '));
assert.notDeepEqual(makeCase('FRIENDS'),makeCase('FRIENDS-2'));
assert.equal(normaliseCode('<script>code!'), 'SCRIPTCODE');
assert.equal(dailyCode(new Date('2026-11-12T23:59:59Z')),'D-20261112');
assert.equal(dailyCode(new Date('2026-11-13T00:00:00Z')),'D-20261113');
let s=newState('TEST');
assert.ok(validState(s,'TEST'));
assert.equal(accuse(s,0),s,'No accusation before collecting evidence');
assert.equal(investigate(s,-1),s);
assert.equal(investigate(s,6),s);
assert.equal(investigate(s,0.5),s);
s=investigate(s,0);assert.equal(investigate(s,0),s);
s=investigate(investigate(s,2),4);assert.equal(investigate(s,5),s);
assert.deepEqual(s.opened,[0,2,4]);
s=accuse(s,3);assert.equal(accuse(s,1),s);assert.equal(investigate(s,5),s);
assert.ok(validState(JSON.parse(JSON.stringify(s)),'TEST'));
assert.ok(!validState({...s,opened:[0,0]},'TEST'));
assert.ok(!validState({...s,opened:[0,1,2,3]},'TEST'));
assert.ok(!validState({...s,version:99},'TEST'));
assert.ok(!validState({...s,accused:6},'TEST'));
assert.ok(!validState({...s,ruledOut:[-1]},'TEST'));
assert.ok(!validState({...s,opened:[]},'TEST'));
assert.ok(!validState({...s,finishedAt:null},'TEST'));
assert.ok(!validState(s,'OTHER'));
console.log('Passed: 10,000 cases, 200,000 lead triples, deterministic generation, action rules and save validation.');
