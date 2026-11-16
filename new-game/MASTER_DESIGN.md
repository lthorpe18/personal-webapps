# New Game — Master Design

> **Canonical design source:** This file is authoritative for the game. Last consolidated: 16 November 2026. Earlier conversations are historical evidence, not competing specifications. Godot implementation has not started.

## How to read this document

- **LOCKED** — an agreed design principle or story fact. Change deliberately, not by accident.
- **DIRECTION** — the intended experience or promising implementation, adjustable through prototyping.
- **OPEN** — an unresolved question with meaningful consequences for narrative logic, gameplay, or scope.
- **EXPERIMENTAL** — optional ideas that must not drive initial architecture.
- **SUPERSEDED** — earlier proposals explicitly replaced by the current design.

These labels govern the named topics, not every incidental example. Illustrative scenes, creature behaviour, locations, and mechanical timings are not automatically requirements.

## 1. Core identity and theme

**LOCKED — Concept.** A stylised **3D isometric action-adventure** about a displaced traveller and a small causally attuned bird exploring a world across **two playable eras: Past and Present**. The player investigates in one era, discovers information unavailable in another, makes selective interventions in the Past, and sees their consequences in rewritten Presents. Direct action combat, exploration, relationships, and consequential decisions coexist.

The player fantasy is **historical hindsight and intervention**, not unrestricted time magic. There is one world and one history, which can be overwritten; no parallel universes exist alongside it. Most ordinary actions are absorbed over centuries, while plausible structural, ecological, political, social, and familial changes may persist.

**LOCKED — Central theme:**

> **History cannot record the disasters that didn't happen.**

The player may be remembered for the damage caused by averting a catastrophe, while the catastrophe itself leaves no historical record. The story asks what responsibility means when the costs are visible but the benefits are erased.

**DIRECTION — Tone.** Mystery, wild beauty, grounded danger, melancholy and occasional wonder. This is not a relentless apocalypse or a generic prophecy about a chosen hero.

## 2. Play experience and world structure

### Core loop — LOCKED

**Explore and survive → encounter a question, contradiction, obstacle, person, or conflict → learn more by crossing between eras → act using hindsight and a small, consistent set of world actions → return to see the consequences.**

Time travel is principally **investigation, information and consequence**, not a mandatory bespoke time puzzle at every turn. Present environments often reveal outcomes; Past environments allow context and interventions. Both should be playable, revisit-able places rather than alternate versions seen once.

### Level organisation — LOCKED principle / DIRECTION detail

- **Directed journeys** link important story locations and give a sense of moving through a continuous physical world.
- These lead to **bounded, authored, explorable level areas** with optional paths, landmarks, shortcuts, environmental hazards, clues, combat, and meaningful local discoveries.
- Levels are not selected from a disconnected stage menu. Regions should have believable geographic and narrative connections and be revisited in both eras.
- The story is broadly authored and sequential, but the player has room to explore within regions and pursue local causal variations.
- **DIRECTION:** Readable objectives, strong landmarks, restrained local verticality and exploratory rewards without turning the game into an undirected open world.
- **OPEN:** Typical region footprint, encounter frequency, backtracking and the balance of combat versus investigation.

### Physical movement and interaction — LOCKED principle / OPEN tuning

The protagonist is a physically grounded person, **not** a superhuman platforming character. Traversal may include running, sensible small jumps, vaulting, ladders, simple ledges and limited plausible climbing. Avoid large magical leaps, extravagant parkour or complex traversal mechanics until tested.

A small universal interaction vocabulary should support situations across the game. **Candidate** verbs: move/push/pull, carry/place, cut/break, open/close, repair/build, redirect, give/take, talk/persuade/choose, fight/spare/kill. These are **not** a locked full input list: choose the minimum useful subset through prototyping. Combat, social choices and physical interventions can all have historical consequences.

### Environmental causality — LOCKED rule / DIRECTION content

Century-scale effects must be understandable and plausible. Leaving a wooden door open is not automatically significant centuries later; changing a river course, stone foundation, ecology, institution, settlement, archive, migration or lineage plausibly could be.

- Prefer **authored causal states** and readable consequences to a simulation of all historical possibilities.
- **LOCKED — player experimentation vs authored presentation:** The player should be able to explore, cross eras, and revise most historical interventions *almost freely*. The world does not need to show every consequence immediately or through a seam. Only a **small, deliberately authored set of consequential changes** alters the environment visibly viewed through a seam; smaller changes may show consequences in dialogue, NPCs, objects, records, or when the player physically explores the updated Present. This is a scope boundary, **not** a rule that only large interventions matter.
- **DIRECTION — update timing:** Causal changes take effect in the current history when made, with seam views showing the relevant authored changed state where one exists. Returning to the Present reveals wider consequences; the seam need not preview them all. Avoid unbounded combinations of dynamically simulated future scenes. Exact implementation/update triggers await prototyping.
- **LOCKED — causal density:** A region built around historical intervention should usually have **one substantial, legible causal change** plus **several smaller optional interventions** or discoveries. These can affect exploration, characters, wildlife, or the environment, but should not require a combinatorial historical simulator. Not every region needs a mandatory causal puzzle: some focus primarily on movement, combat, atmosphere, or story.
- The **landslide / dam / river / waterfall** concept is a good **DIRECTION** for a prototype investigation: see a landscape's Present consequences, discover how the watercourse or blockage changed in the Past, intervene physically, and return to a credible altered route/ecology. Its exact geography, solution and inclusion in the finished game are **not locked**.
- **DIRECTION:** Important NPC families can carry authored causal consequences through survival, standing, vocation and memory/history. This is **not** a generational life simulator.
- **OPEN:** When to apply updated Present states (at crossings or sooner), how to communicate a change, and which consequences are persistent.

## 3. Time, history and temporal phenomena

### One history; two playable eras — LOCKED

The player accesses **Past and Present**, never an arbitrary date-picker or an unrestricted third era. **LOCKED — story-driven progression:** the accessible Past moves forward as major story events unfold, rather than ticking continuously while the player explores. This progression uses authored milestones/period states; it need not mean every region shifts on precisely the same schedule. The playable Past begins before the protagonist's original displacement late in that broader era. The current Present lies centuries later. **LOCKED — limited historical revisiting:** The Past normally advances with the story, but selected authored locations retain accessible connections to earlier moments. The companion bird may help the player re-align those particular seams. This permits revisiting and refining significant local interventions without allowing arbitrary date selection or requiring every region to support multiple interchangeable historical versions. Players should have ample room to experiment **before** major story milestones; after a milestone, only deliberately retained historical connections remain revisitable. **OPEN:** Which specific moments remain reachable, how to flag a forthcoming closure, and how revisits interact with continuity after broader timeline rewrites.

Each major region can have different authored Present versions as the player changes history:

| State | How it came about | What the player sees |
|---|---|---|
| **Present v1 — original** | Loom's catastrophic original collapse; Harbour fell | An inland descendant culture, ruined Harbour and a huge sea-creature skeleton; a mostly rewilded world with surviving temporal scars |
| **Present v2 — after Act 1** | Harbour populations cooperate and defeat the creature | A thriving integrated Harbour civilisation; great-bird lineage survives; historical records point east |
| **Present v3 — after Act 3** | Loom/main rupture is permanently resolved before the sea catastrophe | Harbour prospers without ever fighting the sea creature; familiar ancestral and cultural threads survive; history chiefly remembers the eastern destruction |

These are **successive rewrites of the same history**, not three coexisting worlds. The player's earlier Past actions persist into v3 **when still consistent** with the altered circumstances: rescuing the great bird and creating viable relationships need not be erased simply because the sea battle never occurs.

**LOCKED — Personal memory distinction.** The opening displacement leaves the protagonist without accessible **pre-opening autobiographical memories**: they do not know who they were, the Loom, the Curator or the experiment. Those events nonetheless **actually occurred** in the original history. From waking onward, the player forms new memories and retains experiences of overwritten Presents they personally visited. This asymmetry is central to investigation and mystery.

**DIRECTION — bird-guided temporal alignment:** The companion bird can instinctively **nudge which naturally accessible historical moment a seam aligns with**, sensing a consequential connection rather than deliberately selecting a calendar date. As the story advances, its growing attunement and the changing world help bring later Past moments into reach. The bird cannot choose arbitrary moments or visit the original experiment freely; these remain authored, location-bound connections. This supplies a plausible in-world complement to story-based progression, without turning the animal into a conscious navigator.

**OPEN — Time-access explanation.** Why the malfunction initially throws the protagonist to Present v1, why seams can reach an earlier Past before that experiment, how the bird's limited influence interacts with each seam's constraints, and how an erased original displacement can remain consistent with the player's severed existence. Keep exactly two normal playable eras; do not invent unrestricted travel to solve this.

### Seams and rips — LOCKED

- **Seam:** A relatively stable join where the two eras press close. The other era can sometimes be seen or heard through it before the player can cross.
- **Rip:** A damaged, widened or dangerously unstable join. It is visually stronger and less predictable.
- Seam/rip density and intensity communicate the world's causal condition **through the environment**, not primarily a numerical stability meter.
- Initial travel is **location-bound**. The bird first learns to widen an existing seam, not shift the player anywhere. **DIRECTION:** At later story milestones, its causal sensitivity may subtly adjust which compatible earlier moment the seam reaches; it does not precisely aim at any date the player requests.
- **DIRECTION — natural self-limiting behaviour:** A natural seam may narrow or close after a sufficiently significant intervention, or after multiple smaller disturbances. This acts as a natural limit on changing history, not a fixed numerical quota. **Agreed approach (A + C):** a consequential intervention normally allows the player a readable chance to return to the Present before the seam settles; the companion bird instinctively senses the closure and can briefly hold the crossing open. **LOCKED gameplay intention:** Most interventions remain practically explorable and revisable, so closures must be rare or designed around—never a routine trap or barrier to the agreed freedom to experiment. **OPEN:** Exact warning and hold duration, whether a closed seam later reforms, alternate crossings, and how to communicate truly consequential commitments. No automatic assumption that minor actions trigger closure.
- **DIRECTION:** Later bird abilities may stabilise rips, maintain openings or interact with weaker seams. The bird's temporal energy is spent when actively maintaining an unnatural or closing passage, linking seam traversal to combat/exploration ability availability.
- Exceptionally catastrophic **deep-time rips** can expose or permit intrusions from prehistoric eras, **without adding a playable prehistoric period**. Future-than-Present incursions are **EXPERIMENTAL**, not established lore.

### Present v1 — LOCKED

The opening world is **partially healed but permanently scarred after the original collapse**. With the Loom's continuous corrections largely ceased, nature and people have had centuries to recover. It is credible that the inland community has grown over generations. Most of Land #1 is inhabitable; particular sites have unsettling temporal behaviour. Land #2, nearer the Loom's heart, retains much worse scars. This balances wonder and danger without making the opening a constant visual apocalypse.

### The Loom and historical changes — LOCKED core / DIRECTION dynamics

**LOCKED:** The Concordance (placeholder name) built the Loom to exploit natural temporal seams. **Artificial anchors hold these passages open and usable**, allowing the Curator or other agents to travel through and transport objects and equipment into the Past. History changes through **actual interventions** at consequential events; the Loom does **not** directly impose a desired outcome on reality. The changes propagate forward through ordinary causality. The system prevented famine, epidemics, wars and other disasters, but eventually caused the **Unravelling**. The original eastern exodus resulted from the failing network, **before any later actions by the player**.

**LOCKED — two interacting sources of damage:** (1) Holding seams artificially open beyond their natural limits stresses the relationship between historical periods; (2) repeatedly forcing significant revisions creates accumulated contradictions between overwritten histories. These processes reinforce each other. The player and their bird interact with natural seams on a smaller scale; they are not intrinsically equivalent to industrial, continuously forced manipulation.

**DIRECTION — natural self-limitation:** After a sufficiently consequential historical change—or too many smaller changes—a natural seam tends to close or become inaccessible, giving the affected history time to settle. The Loom's anchors override this tendency to continue accessing turning points and imposing further revisions. There is **no locked numerical change limit** and no automatic expectation that every player intervention closes their exit route.

**DIRECTION — Anchor shutdown:** Deactivating an artificial anchor ends its forced connection and should relieve further temporal stress, but does **not** automatically undo history that already occurred. Communities may lose ongoing support, transport or protections and require evacuation. The proposed **main offshore anchor/gate**, built over a major marine temporal fault, is associated with the final deep-time rupture; its shutdown should end that artificial breach, rather than merely destroying a navigation beacon.

**OPEN — Detail, not the basic principle:** How the Curator identifies promising historical turning points; whether an anchor's sustained opening has an escalating cost; whether naturally closed seams reform; the precise timescale and visual process of healing; and how shutdowns avoid trapping travellers or instantly destabilising populated districts.

### The Unravelling — LOCKED

Overcorrection causes the landscape to fail to maintain one consistent history. Symptoms escalate from contradictory memories, phantom structures, altered maps and vanishing routes to physical rips and short-lived states of buildings or terrain from other pasts. In extreme regions objects and rare dangerous creatures can enter through very distant-past breaches. The Curator's efforts to protect the centre push damage outward, giving the apparent success of the core civilisation a tragic cost.

## 4. Birds: world role and gameplay

### Natural causal attunement — LOCKED

Birds are **instinctive animals**, not humanlike seers or deliberate time-travelling guardians. Their unusual senses let them react to causal significance and temporal disturbances. Great birds are especially attuned and can instinctively help maintain natural temporal stability; they do **not** consciously choose good futures or freely rewrite history.

The protagonist, transformed by catastrophic displacement, registers to these birds as an unusual causal anomaly. The small bird is initially drawn to that imprint; affection and loyalty are subsequently **earned through shared experience**, not destiny.

**LOCKED:** Harbour's belief that great birds offer protection is a **cultural tradition**, not an actual prophecy. In Past Harbour, some traditional bird-keepers defend birds while others exploit or kill them for navigation, prediction or other practical use. A survivor-descended Present v1 tradition preserves and distorts their observations. **DIRECTION:** A shaman-like keeper of bird knowledge helps teach the player these beliefs. **OPEN:** Whether such a human has any limited innate sensitivity; do not create a second fully gifted seer class by default.

### Small companion progression — LOCKED milestones / DIRECTION details

1. At the opening, the bird is weakened by the same failed displacement as the protagonist; it senses seams but cannot open them.
2. Relatively early, after a recovery event, it gains the ability to widen an existing seam so the player can cross.
3. During **Act 1**, the bird gains combat abilities **Foresee → Pin → Recall**, all available and meaningfully used by the Harbour creature climax.
4. **DIRECTION:** The rescued great bird may help the smaller bird develop or unlock the later powers, but the exact teaching mechanism and milestones remain flexible.
5. Other possible abilities include sensing causal echoes, scouting, holding difficult seams open and helping communicate priorities during major defence battles.

### Temporal energy and cooldowns — LOCKED principle / OPEN tuning

**LOCKED — One underlying bird resource:** The companion's short-time powers and its efforts to open or hold temporal seams draw on the same limited **temporal energy** (working term). It is the bird's exertion/capacity, not a separate magical mana pool assigned to the protagonist. **Foresee, Pin and Recall have cooldowns** for pacing; energy additionally provides a common limit and meaningful interaction across activities. **Holding an unstable or closing seam open costs energy over time**, leaving the bird less able to use its powers immediately afterwards. Opening, sensing and stabilising seams may have different costs, to be tested; passive sensing need not drain energy.

**LOCKED gameplay intention:** Temporal-energy limitations should make choices meaningful without routinely penalising curiosity or making experimentation cumbersome. A bird exhausted by combat must not irrecoverably strand the protagonist in the Past; any essential return crossing needs a safe fallback, protected reserve, or scripted escape opportunity. The exact safeguard remains **OPEN**.

**LOCKED — energy recovery:** Temporal energy **regenerates automatically over time** under ordinary conditions, so the player can experiment without seeking rest spots or consumables. Certain places or events may provide faster regeneration or an immediate refill as an optional benefit, reward or story beat; they are not mandatory routine recharge stations. **DIRECTION:** The bird can show fatigue or strain through animation, sound, and behaviour, reinforcing the player–bird relationship rather than only a HUD bar. **OPEN for prototypes:** Regeneration speed and potential variation during combat or seam strain, exact energy values, ability-specific cooldowns, optional refill triggers, and how an imminent seam closure behaves when the bird is low on energy. The required safe-return safeguard still applies. Great birds' own temporal exertion need not be part of the small companion's exact meter.

**EXPERIMENTAL:** Independently controlling the bird across eras, extensive bird-only puzzles or additional powers that would dictate architecture.

### Great bird and Harbour — LOCKED

In the original Past Harbour, one of the last local great birds is killed before or during the catastrophe. The survivor descendants retain a story of birds that failed to protect the shore, without a foreordained hero.

The player saves the bird, its habitat or the circumstances necessary for its survival. In the Act 1 battle it instinctively intervenes at a critical moment; the player and defenders must still fight the creature directly. This **preserves a great-bird lineage**. In Present v2, a great bird (not necessarily the same individual centuries later) recognises the player's causal imprint and becomes a mount, enabling the sea crossing to Land #2 and later offering aerial possibilities.

The contrast foreshadows the entire conflict: Harbour exploits causal birds crudely; the Concordance industrialises the same impulse through the Loom.

## 5. Combat and major encounters

### Ground combat — LOCKED

Direct combat is part of ordinary exploration. The player moves, positions, dodges, uses grounded melee and survives encounters with creatures and hostile people. Combat is physical, with temporal assistance from the bird, rather than a spell-driven replacement for action.

**LOCKED — Three distinct short-time abilities:**

| Ability | Function | Boundary |
|---|---|---|
| **Foresee** | Reveals an enemy's imminent attack or movement, e.g. a predictive ghost | Information, not an automatic dodge or historical rewrite |
| **Pin** | Briefly arrests or disrupts a predicted enemy action, creating an opening | Short/local effect, not globally freezing time |
| **Recall** | Returns an enemy along part of its recent path or action, allowing repositioning | Not a general undo of damage or every consequence |

**LOCKED — consistent capabilities beyond combat:** Foresee, Pin and Recall should **feel like general-purpose abilities wherever they make physical sense**, including selected moving environmental objects or hazards (e.g., a rolling boulder, moving platform, swinging branch, or swaying tree). A stationary ordinary rock provides no meaningful recent motion to Recall. The underlying implementation need **not** support universal rewind of every object, environmental simulation or world state. Aim for a reusable temporal-interaction capability on eligible moving actors, with consistent affordances and clear feedback rather than conspicuous puzzle-only exceptions.

**DIRECTION — prototype implementation:** Distinguish (1) authored/animated motion, which can be previewed, held or reversed via a controlled timeline, from (2) dynamic moving actors, which may need a short transform/motion history. A swaying tree can reverse the relevant animated branch motion without physically rewinding an entire ecosystem; physics and collision consequences should be constrained and tested. Only entities that opt into/implement compatible temporal behaviour need participate. The limitation should be legible to the player rather than arbitrary.

**OPEN for prototypes:** Target selection, temporal eligibility/readability, moving-tree and physics collision edge cases, short history duration, costs and timings, enemy resistance, and which environmental motions warrant genuine gameplay support. The Harbour sea-creature fight must involve **all three** along with direct action and the great bird's intervention; its precise choreography remains **DIRECTION**.

### Community defence — LOCKED fantasy and frequency / DIRECTION examples

Important battles combine the player fighting on the ground with occasional broader decisions informed by a bird's overhead view. Local leaders retain command; the player is **not an RTS general**. Trust earned through past actions, rescues and warnings determines who heeds the bird-carried signals. Possible commands: defend a chokepoint, protect civilians, reposition a small group or prioritise a threat. Tribal defence can introduce the idea; Harbour is its major Act 1 expression.

**LOCKED — frequency:** **Occasional major set pieces (Option A)**, not recurring routine skirmishes with a strategy overlay or a second game-length strategy pillar. Direct weapon combat remains available in normal exploration; bird time powers augment **both** direct fighting and battlefield coordination. The same protagonist combat and enemy fundamentals should underpin defence battles rather than requiring an entirely separate RTS.

**DIRECTION — candidate encounter ladder (not five locked missions):**

| Act | Candidate scenario | Distinct defence problem | Status |
|---|---|---|---|
| **Act 1, Present v1** | **Inland village under attack**: the player helps the tribe against dangerous creatures | First earned trust, protect civilians, choose one defensive priority, then fight personally | **LOCKED story beat**, encounter specifics flexible |
| **Act 1, Past** | **Harbour's catastrophe**: refugees, defenders and the prehistoric marine creature collide | Several simultaneous fronts, de-escalate human conflict, save the great bird, and exploit all three temporal powers against the beast | **LOCKED story beat**, precise choreography open |
| **Act 2, Past** | **Loom containment failure**: assist workers and local defenders in keeping people safe while an artificial seam destabilises | Changing passages and hazards rather than a straightforward assault; a short-term success demonstrates why people still trust the Curator | **CANDIDATE** |
| **Act 3, Past** | **Evacuation of an anchor-dependent district**: protect a moving civilian withdrawal as maintained infrastructure fails and security forces oppose the operation | Manage routes, escorts, rearguards and minimal harm, rather than simply holding territory | **CANDIDATE** |
| **Act 3, Past** | **Marine fault / final departure**: protect the evacuation and gain access to the main gate before closing the deep-time breach | A moving, multi-location finale with limited aerial coordination; prevent the creature's arrival rather than fighting it a second time | **CANDIDATE** |

**ALTERNATIVES, not added required battles:** An Act 2 **Present** survivor camp defending against a temporary prehistoric incursion could replace the Past containment encounter; an Act 3 defence of an evacuation corridor against the Curator's forces could replace a more static anchor-district evacuation. Avoid adding all alternatives merely to fill every region.

**Design constraint:** Each major defence should test a **different tactical question**—hold ground, reconcile hostile groups, manage unstable terrain, protect a retreat, or prevent a final catastrophe. Protecting people and manipulating surroundings are often more interesting than counting killed enemies. The player issues a few consequential orders and returns to direct control, not micromanaging individuals.

The exact command set, force sizes, encounter choreography, final number (rough working target: **about five total**), and technical implementation remain **OPEN**. Do not let this subsystem dominate the first ground-combat prototype.

**EXPERIMENTAL:** A time-displacement weapon that temporarily sends enemies to another era. It is not part of the locked combat kit.

## 6. Geography, cultures, and presentation

### World geography — LOCKED

- **Land #1 (west):** Wild, scarred but largely habitable in Present v1. Contains the inland descendant community, Harbour Village and the enormous skeleton in its ruined original future.
- **Land #2 (east):** Refugees' homeland and centre of the Concordance/Loom. Explored in its badly scarred Present and in its technologically sophisticated but increasingly threatened Past.
- **Sea between them:** Contains a major natural temporal fault; the ancient creature does **not** ordinarily live in the human era.

### Visual identity — DIRECTION

Stylised low-complexity 3D isometric presentation, simple readable geometry and silhouettes, expressive but limited animation, authored Past/Present environment variants, and a scope suitable for a solo or small-team project. Avoid photorealism and generic fantasy without unique identifiers.

Recognisable world motifs: natural great birds versus exploited bird traditions, temporal seams and rips, contradictory historical architecture, reclaimed ruins, the monumental sea-creature skeleton, and eastern infrastructure dependent on artificial causal intervention. The two landmasses should have distinctive wildlife, settlement forms, cultures and characters. **OPEN:** Specific art bible, architecture, creature roster, character designs and final place names; not prerequisites for the first gameplay tests.

## 7. Story and chronology

### The original history, before the player's interventions — LOCKED outline

1. The eastern civilisation uses the Loom for repeated beneficial corrections. Accumulating instability becomes the Unravelling.
2. In the **terminal crisis**, two developments occur, with their **relative order still OPEN**:
   - A desperate experiment linked to the Curator's final attempt to save the realm severs the protagonist from ordinary causality. It fails to deliver them to the intended destination, instead throwing them centuries forward with lost memories and a weakened small bird.
   - The Loom's accumulating failure makes the eastern homeland untenable, forcing refugees westward toward Harbour. This original exodus does **not** depend on the protagonist's later interventions.
3. The fleeing fleet encounters or triggers a severe marine temporal rupture. A gigantic prehistoric creature enters the human era; refugees and Harbour's defenders mistake each other for attackers.
4. Harbour is devastated. The creature dies there, leaving the vast skeleton; survivors flee inland and develop the descendant culture encountered in Present v1.
5. The Loom's repeated corrections eventually cease; nature and societies partly recover over centuries, though temporal scars persist. The displaced protagonist awakens in this later Present v1.

**OPEN:** The experiment's exact timing relative to the evacuation and precisely what triggers the marine breach. This is the **original causal history**, not the order in which the player experiences these scenes.

### Origin and failed experiment — LOCKED premise / DIRECTION revelation

The protagonist was a real person in the **later Past of the original history**, not a foretold Chosen One. A desperate experiment was intended to put someone outside the Loom's power so they could help save the world. **DIRECTION:** It was meant to reach an earlier decisive point, but malfunctioned and sent them centuries forward instead. The reason for arrival on Land #1, specific intended destination and who selected the person are **OPEN**.

**DIRECTION — Late-game reveal:** Researchers have only recently discovered/recovered the unusual **small bird**, believe its instincts may help, and **deliberately choose to send it alongside the protagonist**. This scene from the original, late-collapse history may be discovered by the player/audience late in the game; how to show a lost timeline without giving the player unexplained memories or a third explorable era is **OPEN**.

The playable **earlier Curator** has not lived through that last desperate phase. They believe the Loom can be fixed, may try to recruit the player, and have reason to resist dismantling its anchors. They do **not** recognise the protagonist as an individual they previously dispatched; faint familiarity is optional foreshadowing, not an established relationship. Exactly how involved the **later original-history Curator** was in the experiment is **OPEN**.

### Act 1 — Harbour Village — LOCKED narrative beats

The traveller wakes on Land #1 in **Present v1** with no personal history and a temporally weakened small bird. The wilderness is dangerous, with monsters beyond settlement defences, but is not universally apocalyptic. Odd seams reveal alternate views of familiar places. The player encounters a small inland community descended from survivors of Harbour's catastrophe; its oral history speaks of an attacking fleet, a sea beast and birds that failed to protect the shore. A keeper of the older bird beliefs may help interpret these clues.

**Opening sequence:** Wake → survive/explore → detect seams and the bird's reaction → glimpse the inaccessible Past → help the bird recover → widen the first seam → deliberate crossing. This happens **early**, so the game's main mechanic isn't withheld for an entire act.

At ruined Harbour, the colossal skeleton's ribs and skull dominate the landscape. Crossing to Past Harbour reveals a living settlement preparing for invasion, a divided community that hunts great birds for their abilities, and the approaching fleet. Investigation reveals **refugees**, not invaders, fleeing Land #2's catastrophic instability. Their route intersects a deep marine rupture that admits a huge **prehistoric** creature into this era. Neither the refugees nor the creature are malicious invaders.

The player saves the threatened great bird, builds trust and uses historical knowledge to avert armed conflict between the two populations. The sea creature still emerges: a major physical defence battle requires Foresee, Pin and Recall, active ground combat, the small bird's awareness and the great bird's decisive intervention. The beast is defeated **before Harbour is destroyed**. The great bird never wins alone.

Returning to **Present v2**, the old inland tribe no longer exists in exactly the known form, but its ancestral people and cultural threads persist within a prosperous combined Harbour society. The great-bird lineage survives. Records and bird responses to powerful disturbances in the east reveal that Harbour's tragedy was only a consequence of a larger disaster. The player mounts a great bird of the surviving lineage and crosses the sea to investigate the refugees' homeland.

### Act 2 — Across the Sea — LOCKED revelation / DIRECTION gameplay

Land #2's **Present v2** is far more heavily scarred: abandoned or altered cities, impossible memories, structures flickering between prior states, unstable routes and occasional intrusions from the distant Past. The player explores these environments, fights, meets survivors and investigates local historical contradictions, crossing to the **earlier Past** of the same regions. There they discover the prosperous Concordance civilisation and the functioning Loom.

**DIRECTION — A playable journey, not an exposition tour:** Several bounded regions offer distinct investigations, environmental causal changes, people to protect, enemies, shortcuts and consequences. The player initially tries to understand and sometimes repair particular disturbances. They learn that local solutions cannot resolve the network-wide catastrophe and that the Loom's past successes created its present danger.

The Curator's argument is credible: the Loom prevented famine, disease, war and suffering, and millions now depend on it. In the earlier era, they believe it can still be repaired. They attempt to recruit or stop the protagonist, not because they are simply evil but because pulling down the network appears to condemn people **now**. The player learns that further forced corrections only increase future instability. Act 2 ends with a decision: the Loom must be dismantled.

### Act 3 — The Bird-Rider — LOCKED stakes / DIRECTION specifics

The player deactivates major causal anchors on Land #2. The intention is **not to destroy cities**: it is to prevent systemic collapse while organising warnings, routes, shelter, defence and evacuation. When artificial supports fail, infrastructure may stop functioning, districts become unsafe and communities must move. Some forces oppose the player because they see actual losses, not the avoided disaster.

The original refugees fled because **the Loom was already failing catastrophically**. In the changed history, the player's deliberate shutdown accelerates the loss of artificial supports but makes a more organised evacuation possible. The player recognises the westbound refugees they encountered in Act 1, now in altered circumstances. They are increasingly remembered as the feared **Bird-Rider**; the Curator may appear the last defender of the old world.

**DIRECTION — Final anchor:** The main anchor/gate exploits the deep natural marine fault. The player's final intervention closes the artificial deep-time breach **before the creature can emerge into this history**; simply destroying a navigation beacon is no longer the intended resolution. People witnessing their last great system dismantled may interpret it as one final hostile act. The exact gate construction, timing, safe shutdown method, confrontation and whether a diversion is also needed remain **OPEN**.

### Final Present v3 and sacrifice — LOCKED thematic ending / OPEN implementation

The refugees reach Harbour without the sea-monster catastrophe, and the two populations create a prosperous shared civilisation. The great-bird lineage and other earlier valid interventions remain part of history. Ancestral families and traditions recognizable from the original inland tribe provide an emotional callback, although the individuals and social form may differ. There is **no sea-creature skeleton**: in this history the creature never entered the human era, and its prehistoric environment is no longer connected by the catastrophic breach.

The Loom has ceased destabilising history. The player's actions to prevent catastrophes may leave no positive historical record: the Harbour defence never happened, while loss and flight from the east did. The Bird-Rider may be remembered as the destroyer; the Curator may be remembered as a tragic guardian.

**LOCKED — Sacrificial principle:** The player's causally severed existence is implicated in stabilising the final resolution, and they cannot simply return to an untouched ordinary life and receive an uncomplicated heroic legacy. **OPEN:** Whether this means being anchored in the Past, losing a future, sacrificing identity or another precise cost. The ending must reinforce:

> **History cannot record the disasters that didn't happen.**

## 8. Progression and replayability

**LOCKED milestones:** Early seam crossing; Foresee → Pin → Recall within Act 1; saved great-bird lineage and mount at end of Act 1; increasingly difficult historical investigations across Land #2; final main-anchor resolution.

**DIRECTION:** Local causal permutations arise through physical, combat and social decisions. The macro-story is authored and coherent, rather than allowing a free simulation of arbitrary civilisations. Changes may affect routes, ecology, buildings, survivors, descendants, recorded history, dialogue and institution states; not every choice needs a centuries-long consequence.

**LOCKED — level causal pattern:** Typically one major change with smaller optional interactions in intervention-focused regions, but not as a rigid formula for every region.

**OPEN:** Number and variety of optional choices per region, replay incentives, authored state combinations, progression of aerial capabilities, detailed save/state representation and effects of earlier choices late in the story.

**EXPERIMENTAL:** A formal run-based or roguelike structure. A separate grand-strategy spin-off could explore deeper generational social simulation; it is **not part of this action-adventure's scope**.

## 9. Development guardrails

**LOCKED current project choice:** **Godot**; Git/version control; develop through narrow, testable prototypes before any full-scale production.

**DIRECTION:** Stylised 3D, bounded levels, **GDScript unless testing reveals a compelling reason otherwise**, editable/tunable values and authored states rather than hard-coded one-off puzzles or premature generalized historical simulation.

Initial architectural decisions should be driven by prototypes for (a) isometric movement/level exploration, (b) visible and crossable seams, (c) paired Past/Present authoring, (d) one legible authored causal intervention, (e) bird companionship and (f) Foresee/Pin/Recall in compact direct combat. Community defence, aerial traversal, full story content and broad lineage permutations should **not** be built into the first prototype.

Dedicated prototype and technical planning belong in **PROTOTYPE_PLAN.md** and **TECHNICAL_DIRECTION.md** once the remaining consequential questions are settled; those are supporting plans, not alternate masters.

## 10. Open questions, prioritised

### OPEN — Important before / during earliest prototypes

1. **Natural seam closure and anchor shutdown:** The Loom's physical interventions through artificially maintained seams, and the combined damage from held-open passages plus repeated rewrites, are **LOCKED**. Clarify the natural closing tendency, what happens to travellers when a seam closes, and the safe consequences of deactivating a main anchor. Detailed mechanics can be prototyped later.
2. **Era anchoring and chronology:** Story-driven forward progression of the playable Past and **limited revisiting of deliberately retained earlier connections** are **LOCKED**; bird-guided seam alignment is **DIRECTION**. Still resolve why the failed experiment displaced someone to Present v1 yet seams connect to earlier moments; which few return points to author; and how rewrites coexist with only two ordinary playable eras.
3. **Core gameplay balance and feel:** How frequent and challenging should ground combat be relative to investigation and exploration? What is the minimum grounded movement kit and the typical bounded level size? Use hands-on tests for most tuning.
4. **Bird abilities and energy:** Foresee, Pin and Recall **should feel broadly applicable to meaningful motion** and have cooldowns. They draw from the same temporal-energy reserve that is drained by holding seams open. Determine regeneration and safe return-crossing behaviour; prototype a shared temporal-interaction interface, one animated environmental object and one moving physics object, and test readability, reverse motion and collisions.
5. **One understandable causal prototype:** Define a small authored Past change and clear Present effect, with optional minor interventions if useful. The player should be able to revise ordinary interventions. Prototype a **limited authored seam preview** for the most important visual change and discover other effects by exploring the Present; test when updates are applied and how much visual information is useful.

### OPEN — Can safely wait until later

- Exact bird recovery incident, power unlock beats and great-bird teaching interaction.
- Exact research/experiment personnel, Curator's late involvement, and how the player/audience sees that erased-history scene.
- Specific landslide/river puzzle, NPC lineages, cultural keeper's possible sensitivity, names and character biographies.
- Exact shape of Harbour defence commands and trust mechanics; amount of aerial exploration and combat.
- Full enemy/creature roster, precise map sizes, artwork, sound and cinematic approach.
- Final sacrifice's physical form; save architecture and long-term replay/run structure.

### EXPERIMENTAL — Do not design around yet

- Independent bird crossing/control and large bird-only puzzle chains.
- Time-displacement weapon beyond Foresee/Pin/Recall.
- Incursions from a time later than the playable Present.
- Fully simulated lineage, economy or arbitrary causal histories.
- Roguelike runs and an expanded RTS/commander layer.

### SUPERSEDED — Do not silently reinstate

- A literal great-bird prophecy or predestined Chosen One.
- Three normal playable eras, arbitrary time-jumping, or simultaneous multiverse branches.
- The earlier Curator knowingly sending and recognising the protagonist.
- The player having useful memories of the original late-collapse crisis on waking.
- The player causing the **original** refugee exodus in an unavoidable causal loop.
- A sea monster living for centuries beside the inland tribe; the skeleton is from a creature that died in the original Harbour catastrophe.
- A navigation beacon alone being the intended final solution.
- The complete disappearance of all ancestral people and cultural threads from the inland tribe after Harbour is rewritten.
