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
- Levels are not selected from a disconnected stage menu. Regions should have believable geographic and narrative connections. **Not every region requires an equally extensive or fully explorable counterpart in both eras**; crossing areas should be authored where they serve a meaningful purpose.
- The story is broadly authored and sequential, but the player has room to explore within regions and pursue local causal variations.
- **LOCKED — selective regional revisiting (Option B):** The overall journey advances geographically and narratively, with **only deliberately selected earlier hubs/locations** accessible for important return visits, consequence discovery or revising still-accessible interventions. **Do not require every previous region to remain permanently accessible**, a seamless world map, or universal fast travel/backtracking. Before a major story transition, give players sufficient local opportunity to investigate and experiment; communicate meaningful loss of access clearly rather than trapping them with unexpected irreversible decisions. Exact return routes and transition warnings are later-level design.
- **DIRECTION:** Readable objectives, strong landmarks, restrained local verticality and exploratory rewards without turning the game into an undirected open world.
- **DIRECTION:** Exploration-led encounter pacing, with intermittent danger-heavy stretches rather than uniform enemy density. **OPEN:** Typical region footprint, exact encounter density, backtracking and tuning once playable.

### Physical movement and interaction — LOCKED principle / OPEN tuning

The protagonist is a physically grounded person, **not** a superhuman platforming character. Traversal may include running, sensible small jumps, vaulting, ladders, simple ledges and limited plausible climbing. Avoid large magical leaps, extravagant parkour or complex traversal mechanics until tested.

A small universal interaction vocabulary should support situations across the game. **Candidate** verbs: move/push/pull, carry/place, cut/break, open/close, repair/build, redirect, give/take, talk/persuade/choose, fight/spare/kill. These are **not** a locked full input list: choose the minimum useful subset through prototyping. Combat, social choices and physical interventions can all have historical consequences.

### Environmental causality — LOCKED rule / DIRECTION content

Century-scale effects must be understandable and plausible. Leaving a wooden door open is not automatically significant centuries later; changing a river course, stone foundation, ecology, institution, settlement, archive, migration or lineage plausibly could be.

- Prefer **authored causal states** and readable consequences to a simulation of all historical possibilities.
- **LOCKED — player experimentation vs authored presentation:** The player should be able to explore, cross eras, and revise most historical interventions *almost freely*. The world does not need to show every consequence immediately or through a seam. Only a **small, deliberately authored set of consequential changes** alters the environment visibly viewed through a seam; smaller changes may show consequences in dialogue, NPCs, objects, records, or when the player physically explores the updated Present. This is a scope boundary, **not** a rule that only large interventions matter.
- **LOCKED — authored updates visible through eligible seams:** Significant historical actions change the relevant authored Present state **as soon as the action is made**, including an updated glimpse seen from the Past side of an open seam where the changing feature lies in view. The effect can shimmer briefly to communicate cause and consequence; it is **not a live simulation of centuries passing**. Returning to the Present reveals wider consequences. Smaller effects need not be previewable and can appear via exploration, objects, records or dialogue. **DIRECTION for implementation:** A persistent causal flag/state selects prepared scenery, watercourse and route variants, with corresponding collisions and navigation updated safely when entering the affected era. Avoid combinatorial scene variants or a universal history simulator; test the visibility/presentation technique in the river puzzle prototype.
- **LOCKED — causal density:** A region built around historical intervention should usually have **one substantial, legible causal change** plus **several smaller optional interventions** or discoveries. These can affect exploration, characters, wildlife, or the environment, but should not require a combinatorial historical simulator. Not every region needs a mandatory causal puzzle: some focus primarily on movement, combat, atmosphere, or story.
- **LOCKED — first causal prototype target:** A **river / landslide / waterfall environmental causality puzzle** on the coastal approach to Harbour: in Present v1 a blocked gorge/path; in the accessible Past a physically understandable intervention redirects the river; after returning the Present landscape has an authored changed state and the Harbour route opens. The precise map, hydrology, interactions and level art remain **DIRECTION** until validated in a greybox prototype.
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

**LOCKED — no special origin-era tether required:** Natural seams already exist in the world and connect places with **causally significant historical moments**. The bird senses these connections and can subtly nudge an available seam's alignment; the displaced protagonist does not need a special tether to the original experiment to reach events earlier than their departure. The experiment explains the protagonist's arrival in Present v1 and causal severance, **not** the existence or selection of the natural seams. No exhaustive scientific explanation for historical alignment is required before development.

**OPEN — deferred details:** Why the failed displacement deposited the protagonist specifically on Land #1; how their severed existence remains consistent when the original experiment is prevented; which authored earlier connections persist across story milestones; and any later world-building explanation for exceptional deep-time connections. Keep two normally playable eras and avoid inventing arbitrary date selection.

### Seams and rips — LOCKED

- **Seam:** A relatively stable join where the two eras press close. The other era can sometimes be seen or heard through it before the player can cross.
- **Rip:** A damaged, widened or dangerously unstable join. It is visually stronger and less predictable.
- Seam/rip density and intensity communicate the world's causal condition **through the environment**, not primarily a numerical stability meter.
- Initial travel is **location-bound**. The bird first learns to widen an existing seam, not shift the player anywhere. **DIRECTION:** At later story milestones, its causal sensitivity may subtly adjust which compatible earlier moment the seam reaches; it does not precisely aim at any date the player requests.
- **LOCKED — selective, bounded cross-era areas:** A seam generally gives access to a **limited, authored portion** of the other era, sized for its investigation, intervention, exploration or story purpose—not unrestricted access to an entire second map. The main playable region may be larger in one era, while its counterpart is a smaller temporal pocket; major historical events (e.g. Harbour and the Loom's inhabited Past) can justify larger spaces. **DIRECTION — boundary presentation:** The accessible overlap could visibly soften, haze or **fade away** at its edges, providing an in-world sense that the seam does not connect farther, rather than an arbitrary invisible wall. Exact edge visuals and collision/return behaviour should be validated in a prototype. Do not allow an edge to trap players, trigger accidental era changes, or imply arbitrary travel beyond the authored area.
- **DIRECTION — hybrid seam traversal feel (A + B):** The intended experience combines **walking bodily through a visible seam** with a **very brief bird-widening / visual-distortion transition** as the other era takes over. The transition is a deliberate sensation of crossing time, **not a requirement for a loading screen or a long fade-to-black**. Smaller authored temporal pockets can keep both era variants loaded/ready, enabling very fast or apparently continuous swaps; larger story spaces can preload the target in advance or hide a necessary scene handoff under the same short effect. Preserve a clear before/after spatial relationship and readable glimpse of the other era wherever feasible. **OPEN for Godot prototyping:** full live portal preview vs authored/camera trick, streaming/performance on mobile, what happens to player movement/collision during the shift, and whether exceptionally large scenes occasionally need an explicit load. Do not promise zero loading on every supported device until tested.
- **LOCKED — free repeat crossings while open:** Once the bird has opened a traversable seam, the player can **walk back and forth freely** while it remains open; no repeated ability activation, energy charge or transition confirmation per crossing. Exceptional closing/unstable seams still follow their separate bird-assisted safe-return rules. **LOCKED experiential goal:** Where a substantial historical intervention has an authored visible Present consequence inside the seam's view, the player can witness that other-era view update **while remaining on the Past side**, then cross into the new state. Use a brief shimmer/distortion if helpful, not a mandatory load or a claim that every minor consequence is visible. **OPEN technical design:** real-time portal render versus pre-authored perspective/scene swap, synchronous updated collision and safe return placement if terrain on the other side changes; never block or strand the player as a surprise result of a historical edit.
- **DIRECTION — natural self-limiting behaviour:** A natural seam may narrow or close after a sufficiently significant intervention, or after multiple smaller disturbances. This acts as a natural limit on changing history, not a fixed numerical quota. **Agreed approach (A + C):** a consequential intervention normally allows the player a readable chance to return to the Present before the seam settles; the companion bird instinctively senses the closure and can briefly hold the crossing open. **LOCKED gameplay intention:** Most interventions remain practically explorable and revisable, so closures must be rare or designed around—never a routine trap or barrier to the agreed freedom to experiment. **OPEN:** Exact warning and hold duration, whether a closed seam later reforms, alternate crossings, and how to communicate truly consequential commitments. No automatic assumption that minor actions trigger closure.
- **DIRECTION:** Later bird abilities may stabilise rips, maintain openings or interact with weaker seams. The bird's temporal energy is spent when actively maintaining an unnatural or closing passage, linking seam traversal to combat/exploration ability availability.
- Exceptionally catastrophic **deep-time rips** can expose or permit intrusions from prehistoric eras, **without adding a playable prehistoric period**. **OPEN for later world-building:** Why some exceptional seams/faults reach much further back than ordinary historical connections; major natural faults compounded by artificial Loom damage are a possible explanation, not a settled scientific rule. The established marine fault and neglected-anchor incursion remain valid. Future-than-Present incursions are **EXPERIMENTAL**, not established lore.

### Present v1 — LOCKED

The opening world is **partially healed but permanently scarred after the original collapse**. With the Loom's continuous corrections largely ceased, nature and people have had centuries to recover. It is credible that the inland community has grown over generations. Most of Land #1 is inhabitable; particular sites have unsettling temporal behaviour. Land #2, nearer the Loom's heart, retains much worse scars. This balances wonder and danger without making the opening a constant visual apocalypse.

### The Loom and historical changes — LOCKED core / DIRECTION dynamics

**LOCKED:** The Concordance (placeholder name) built the Loom to exploit natural temporal seams. **Artificial anchors hold these passages open and usable**, allowing the Curator or other agents to travel through and transport objects and equipment into the Past. History changes through **actual interventions** at consequential events; the Loom does **not** directly impose a desired outcome on reality. The changes propagate forward through ordinary causality. The system prevented famine, epidemics, wars and other disasters, but eventually caused the **Unravelling**. The original eastern exodus resulted from the failing network, **before any later actions by the player**.

**LOCKED — two interacting sources of damage:** (1) Holding seams artificially open beyond their natural limits stresses the relationship between historical periods; (2) repeatedly forcing significant revisions creates accumulated contradictions between overwritten histories. These processes reinforce each other. The player and their bird interact with natural seams on a smaller scale; they are not intrinsically equivalent to industrial, continuously forced manipulation.

**DIRECTION — How the Loom maintains the status quo:** The system began as a way to perform infrequent, targeted historical corrections (preventing famines, wars and disasters), but its custodians gradually began correcting increasingly ordinary setbacks rather than adapting to them. Over generations, a comfortable and politically entrenched civilisation grew dependent on continued interventions. The Curator seeks to preserve this civilisation and its institutions—not literally freeze every detail of history. Every correction can create further side effects requiring new corrections, making the network progressively harder to abandon.

**DIRECTION — Extraction and outsourced consequences:** A further developed dependency is physically **taking resources from the Past** through maintained gateways—food, timber, minerals, building materials, useful machinery or other supplies—rather than producing them sustainably in the centre. The network's distributed anchors and ordinary journeys/transport permit expeditions to operate in **increasingly geographically remote** regions, where exploited communities and ecosystems are less visible to the people benefiting. This is not arbitrary spatial teleportation: actual personnel and goods must travel by plausible routes or through available anchored crossings. Harvesting from earlier periods alters the subsequent history of those places; the consequences can accumulate far from the apparent prosperity of the core. Some citizens see it as efficient provisioning, not theft. Some leaders know the harms; others have become wilfully insulated. **Do not make every user of the Loom knowingly malicious or make the Curator a simple caricature.**

**DIRECTION — Natural self-limitation:** After a sufficiently consequential historical change—or too many smaller changes—a natural seam tends to close or become inaccessible, giving the affected history time to settle. The Loom's anchors override this tendency to continue accessing turning points and imposing further revisions. There is **no locked numerical change limit** and no automatic expectation that every player intervention closes their exit route.

**DIRECTION — Anchor shutdown:** Deactivating an artificial anchor ends its forced connection and should relieve further temporal stress, but does **not** automatically undo history that already occurred. **Act 2's neglected-anchor incursion** is the first playable proof: the artificial deep-time rip closes upon shutdown, but prehistoric animals already through it remain in the world. A still-used transport/supply link also closes, directly hurting people who depend upon it. Communities elsewhere may similarly lose ongoing support, transport or protections and require evacuation. The proposed **main offshore anchor/gate**, built over a major marine temporal fault, is associated with the final deep-time rupture; its shutdown should end that artificial breach, rather than merely destroying a navigation beacon.

**DIRECTION — Cascading regional consequences of sequential shutdowns:** The anchor network is connected operationally and socially. As the player closes one passage after another across Land #2, remaining anchor hubs must absorb displaced travellers, supplies, maintenance demand and/or increased temporal throughput as the Concordance reroutes its dependencies. This can **concentrate local stresses and make a still-active, heavily dependent evacuation-region anchor increasingly unstable**, even while each properly closed anchor stops adding its own long-term damage. The player therefore both addresses the systemic crisis and **visibly accelerates a local emergency**. People in that region have grounded reasons to think the feared Bird-Rider's actions are forcing them from their home. This does **not** mean the player's actions created the original Loom catastrophe or that closing passages universally makes the Unravelling worse; the underlying network was already doomed, and the dramatic effects are local, temporary/network-dependent and physically or causally traceable. **OPEN:** Exact rerouting/overload mechanism, whether the player can prepare or mitigate it, number and ordering of anchors, and which shutdowns affect the evacuation hub.

**OPEN — Site-specific Loom dependencies and consequences:** The overarching status-quo model is a **DIRECTION**: escalating historical corrections plus practical logistics and increasingly remote extraction. During later mission/region design, specify **for each important Loom/anchor** (1) what event it was originally built to correct, (2) who/what now depends on its open passage, (3) what it extracts or diverts, if anything, (4) which remote people or places suffer the consequences, (5) what closes or changes when it is deactivated, and (6) what viable alternatives the player can establish. Earlier successful corrections remain real history; they do **not** automatically unravel when their anchor closes. Also open: how the Curator identifies turning points, whether sustained opening has an escalating cost, whether closed natural seams reform, healing timescale, and safe shutdown/return paths.

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

**LOCKED — moderate combat challenge, rapid retries (Option B):** Encounters should reward positioning, blocking, dodging and creative bird-power use without demanding punishing action-game mastery. **Combat areas and major set pieces must be immediately retryable** after failure, restarting from a checkpoint at the **start of the relevant encounter/area or a short internal phase**, with no compulsory replay of lengthy exploration, travel, dialogue or cinematics. The exact checkpoint granularity can vary by encounter, but failure should never force repetition of a whole preceding journey. For multi-stage battles, checkpoints should preserve sensible story progress and restore combat resources/states consistently; do not create softlocks. **DIRECTION:** Optional combat difficulty settings may be considered later, not required for the first prototype.

**LOCKED — moderate-depth weapon moveset (Option B):** The foundational direct combat actions are **light attack, heavy attack, block and dodge**. Movement and positioning matter; bird powers create openings and augment this core rather than replace it. Avoid committing to a combo-heavy system or multiple weapon trees for the first prototype. **LOCKED — assisted melee targeting (Option B):** Ordinary attacks favour a nearby eligible opponent broadly in the character's facing/attack direction, preserving positioning without demanding precise manual targeting on touch or controller. **DIRECTION:** Optional lock-on or stronger focus for large enemies/bosses may be tested, not assumed mandatory.

**LOCKED — crowd-control sweep:** Include a physical **wide-arc area attack** (approximately 180° to 360°, exact arc **OPEN**) that pushes nearby enemies backwards, creating roughly **1–2 seconds of breathing room** in a crowd. It is primarily a defensive spacing/recovery tool rather than the strongest damage attack, and should be visually readable and satisfying on both touch and controller. It should complement—not duplicate—the bird's Pin/Recall powers. **LOCKED input intention:** On mobile, sweep is triggered by a horizontal swipe across the shared melee gesture area (in either direction), while light attack uses a tap and heavy attack a hold. Controller uses readily accessible distinct inputs rather than replicating a touch gesture. **OPEN for prototyping:** exact arc, range, wind-up, knockback, cooldown/stamina cost, and which large/anchored enemies resist it. Do not assume it consumes the bird's temporal energy if it is purely physical.

**LOCKED — mobile melee gesture area:** One generously sized, fixed on-screen combat area substitutes for separate light/heavy/sweep attack buttons: **tap = light attack; hold = heavy attack; horizontal swipe left or right = wide sweep**. The player should be able to use it without looking down, including while moving with the other thumb. Distinguish tap, hold and swipe reliably; do not force small precision gestures. **DIRECTION:** Horizontal swipe can commit immediately on exceeding a clear movement threshold; long-press should only commit once it is clearly not a swipe. Provide visual/tactile feedback and allow mobile layout adjustment if necessary. Controller mappings can use separate buttons for the three attacks; all inputs activate the same attack actions and cooldowns.

**DIRECTION — initial mobile defensive controls:** Use a left-side virtual movement stick and **two distinct right-side buttons for Block and Dodge**, positioned within reach of the melee gesture area. The right thumb triggers dodge while the left thumb continues indicating the direction to dodge, preserving simultaneous movement and defence. Keep the area reachable without covering critical combat action. **EXPERIMENTAL alternative:** A sharp joystick flick could trigger dodge, but only if hands-on tests show it is reliable and does not cause accidental dodges; it is not the default mapping.

**OPEN for testing:** Gesture thresholds and cancellation, attack chaining, hit recovery/commitment, stamina (if any), block and dodge touch inputs, defensive timing, whether a parry emerges naturally from a well-timed block, and how assisted targeting feels on touch and controller. A distinct parry button or mandatory parry mechanic is **not locked**.

**DIRECTION — exploration-led combat frequency (A leaning toward B):** Ordinary exploration is primarily about discovery, navigating spaces, investigating the two eras, and changing history. Combat is not ubiquitous or a mandatory checkpoint between every discovery. Some routes, wilderness areas, hostile districts, and especially story crises contain **clusters of more regular, meaningful skirmishes**, so the world still feels dangerous and weapon/bird mastery matters. Safe or conversational spaces should often allow uninterrupted exploration. Avoid filler waves, routine enemy respawns that discourage revisiting, or an arbitrary percentage of playtime reserved for fighting. The six major community-defence events remain distinct set pieces, not the default encounter format.

**LOCKED — Three distinct short-time abilities:**

| Ability | Function | Boundary |
|---|---|---|
| **Foresee** | Reveals an enemy's imminent attack or movement, e.g. a predictive ghost | Information, not an automatic dodge or historical rewrite |
| **Pin** | Briefly arrests or disrupts a predicted enemy action, creating an opening | Short/local effect, not globally freezing time |
| **Recall** | Returns an enemy along part of its recent path or action, allowing repositioning | Not a general undo of damage or every consequence |

**LOCKED — drag-to-target powers with slow-motion aiming (Option B):** On touch, press a bird-ability icon and **drag toward an eligible target**, then release to apply the effect. **Combat slows significantly during selection rather than stopping completely**; the same slowdown/targeting behaviour should be available with controller or mouse targeting. **Temporal energy is consumed on successful ability activation, not merely while aiming.** Provide clear highlight, a generous selection area, easy cancellation, and feedback on eligible targets. This should feel like applying a power to the world, not choosing a scripted puzzle button. **OPEN for prototype:** exact slowdown rate, whether there is an aim-duration limit, how to handle unsafe positioning while aiming, and whether "Pause" is simply another name for the currently defined **Pin** (do not add a fourth power without an explicit decision). Controller uses hold-to-select + directional/stick aiming + release rather than requiring touch gestures.

**LOCKED — consistent capabilities beyond combat:** Foresee, Pin and Recall should **feel like general-purpose abilities wherever they make physical sense**, including selected moving environmental objects or hazards (e.g., a rolling boulder, moving platform, swinging branch, or swaying tree). A stationary ordinary rock provides no meaningful recent motion to Recall. The underlying implementation need **not** support universal rewind of every object, environmental simulation or world state. Aim for a reusable temporal-interaction capability on eligible moving actors, with consistent affordances and clear feedback rather than conspicuous puzzle-only exceptions.

**DIRECTION — prototype implementation:** Distinguish (1) authored/animated motion, which can be previewed, held or reversed via a controlled timeline, from (2) dynamic moving actors, which may need a short transform/motion history. A swaying tree can reverse the relevant animated branch motion without physically rewinding an entire ecosystem; physics and collision consequences should be constrained and tested. Only entities that opt into/implement compatible temporal behaviour need participate. The limitation should be legible to the player rather than arbitrary.

**OPEN for prototypes:** Target selection, temporal eligibility/readability, moving-tree and physics collision edge cases, short history duration, costs and timings, enemy resistance, and which environmental motions warrant genuine gameplay support. The Harbour sea-creature fight must involve **all three** along with direct action and the great bird's intervention; its precise choreography remains **DIRECTION**.

### Community defence — LOCKED fantasy and frequency / DIRECTION encounter details

Important battles combine the protagonist's direct fighting with occasional broader decisions informed by the small bird's overhead view. Local leaders retain command; the player is **not an RTS general**. Trust earned through past actions, rescues and warnings determines who heeds bird-carried signals. Orders are limited to a few consequential priorities: protect civilians, shift defenders, reinforce a choke point or prioritise a threat.

**LOCKED — Occasional major set pieces (Option A).** The player uses the same core movement, weapon combat, enemy behaviour and bird temporal abilities in exploration and defence. The bird's Foresee, Pin and Recall augment both direct combat and battlefield coordination; they are not a separate combat mode. These encounters should feel distinct and significant, not like a regular strategy minigame.

**LOCKED — Six agreed defence encounters across the three-act outline.** The first two are established story beats; the other four have agreed *roles*, while names, locations, NPCs, choreography and technical complexity remain **DIRECTION**, not immovable mission scripts.

| Act | Defence encounter | Distinct tactical / narrative purpose | Status |
|---|---|---|---|
| **Act 1, Present v1** | **Inland village defence** against attacking wild creatures | Introductory position defence, earn tribe's trust, protect vulnerable villagers while fighting personally | Established |
| **Act 1, Past** | **Harbour catastrophe**: refugees, defenders, and prehistoric marine creature | Multiple fronts, avert conflict between humans, save the great bird, deploy all three temporal powers and direct combat to defeat the creature before Harbour falls | Established |
| **Act 2, Past** | **Loom containment failure**: work alongside technicians and defenders to contain an artificial seam disturbance | React to changing hazards and threatened routes; demonstrate why people trust the Curator and believe the network can be saved | Agreed candidate |
| **Act 2, Past — DIRECTION for placement** | **Prehistoric incursion at a neglected anchor**: smaller prehistoric creatures enter through a dangerous rip still forced open by an old or poorly maintained installation | Defend civilians against roaming threats, then **deactivate the anchor and observe the forced seam close**; learn the decisive shutdown mechanic at a real human cost | Agreed candidate |
| **Act 3, Past** | **Evacuation of an overloaded anchor-dependent district** | Earlier shutdowns have concentrated strain and/or displaced traffic into this remaining hub. Protect a moving withdrawal; inhabitants may credibly blame the Bird-Rider for making their emergency immediate | Agreed candidate; causal escalation DIRECTION |
| **Act 3, Past** | **Last Crossing / marine fault**: safeguard the refugee departure and reach the main gate | Multi-location finale, possibly aerial support, close the deep-time breach before the enormous creature can enter this history | Agreed candidate |

**DIRECTION — Incursion encounter narrative design.** A peripheral anchor has been abandoned by official maintainers, neglected, misused, or kept running well past its intended limits. Its artificially held-open seam deteriorates into an exceptional deep-time rip. A wave of **smaller** prehistoric animals crosses into the human era and threatens a nearby settlement; this is not a second encounter with Harbour's singular giant sea beast. During the fight, the player helps defenders hold routes and shelter civilians while finding a path to the damaged installation. Deactivating the anchor visibly closes the **artificially sustained opening**, proving that shutdown works. **Animals already physically through the breach remain** and must be dealt with; closure does not magically erase them or undo history.

**DIRECTION — Essential moral cost and systemic objection.** Despite its neglect, the same passage has been serving a real, useful purpose—e.g. a remote community receives indispensable food, medicine or other supplies through an earlier-era corridor, or it is the only practical evacuation/transport link. Closing the anchor stops further intrusions **and** severs this lifeline. **LOCKED — longer-term consequence (Option B):** The immediate creature threat ends, and the people remain in their settlement rather than being forced into an instant evacuation. But closing the passage cuts off an essential regular supply/transport route, creating a persistent medium-term problem the player can investigate and help resolve through an alternative route or credible local provision. The place becomes worth revisiting; this avoids duplicating Act 3's mass evacuations. The locals are divided rather than universally grateful. Curator loyalists can plausibly argue that **this one faulty installation** should have been repaired, and that it does not justify taking the entire civilisation's working network apart. This prefigures Act 3's much larger evacuation problem. The specifics of the dependency must be shown in gameplay and should not rely on anchors mysteriously sustaining cities merely by existing.

**Story and pacing principle:** The two Act 2 battles must do different work: the earlier **containment** encounter shows why the Loom is worth defending, while the later **incursion/shutdown** proves closing an anchor can stop an ongoing tear but carries serious costs. The second need not immediately convert the protagonist or the Curator to total dismantlement; that larger conclusion requires investigation of the network's systemic damage.

**Design constraint:** Across the six encounters, test different challenges—hold, coordinate, adapt, contain/close, escort, prevent catastrophe—rather than six escalating siege waves. The exact command set, force count and implementation are **OPEN**. Do not build the whole defence framework before validating direct combat and bird powers.

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

**DIRECTION — playable opening sequence (16 November 2026):** The opening is structured as a short chain of varied play, not a long tutorial. The exact scene work and unlock timing are provisional:

1. **Wake in Present v1.** Confused, without autobiographical memories, in a beautiful but strangely scarred world. The temporally weakened small bird is already nearby. The player explores and notices an unsettling seam/temporal glimpse.
2. **Wild-animal encounter.** Introduce grounded movement and weapon combat. The bird's first weak **Foresee** manifestation warns of an imminent attack, suggesting its ability to perceive very short-term motion despite its inability yet to open seams. The exact power tutorial and recovery cause are **OPEN**.
3. **Meet the inland villagers.** Learn their lived view of the world, stories of fallen Harbour and old bird-keeper beliefs, and a practical reason to want to visit the coast. Establish that the coastal route is difficult/blocked and that the tribe is wary of outsiders.
4. **Defend the village.** First small community-defence set piece: protect people, issue one or two limited tactical priorities and earn trust. **DIRECTION:** The bird's second power, **Pin**, may manifest during this crisis. Avoid overloading the first defence/tutorial with too many distinct systems.
5. **Journey toward ruined Harbour.** The coastal geography funnels travel through a specific blocked valley/cliff route; no arbitrary mountain or coastline bypass should invalidate the obstacle. The player comes upon an old river diversion/landslide and waterfall which, over centuries, has made the Present route impassable. Here the bird must recover enough to **open a natural seam**, creating the first deliberate Past crossing. The player investigates and makes an **authored physical river redirection in the Past**, returns safely as the bird can hold the seam when it begins closing, and discovers that the Present waterfall/gorge/route has changed. This is the first major **environmental causality puzzle** and first causal prototype target.
6. **OPEN / DEFERRED — possible companion:** A villager might accompany the player or appear on the coastal journey, but this is **not an agreed requirement**. No identity, crossing rules, motivations, or story role should be designed until the larger Act 1 experience requires it. The journey and Harbour approach must work without a human companion.

**LOCKED existing progression protected:** The first deliberate seam crossing still happens early, **before reaching Harbour**; Foresee → Pin → Recall must all be available by the later Harbour sea-creature battle. The early animal encounter does not require the bird to be fully recovered, and the village defence should not become an overly complex RTS mission. A blocked coastal passage should be believable in geography and explain why the villagers do not simply use a convenient alternative trail.

**OPEN — Later continuity checks:** Keep the first river puzzle locally legible, preserving the tribe's broad history. The obstruction may be relatively recent (e.g. erosion or storm damage), even though its underlying river configuration is centuries old. A settlement on the far side is a possible secondary consequence, not locked. Character/guide details are explicitly deferred. 

At ruined Harbour, the colossal skeleton's ribs and skull dominate the landscape. Crossing to Past Harbour reveals a living settlement preparing for invasion, a divided community that hunts great birds for their abilities, and the approaching fleet. Investigation reveals **refugees**, not invaders, fleeing Land #2's catastrophic instability. Their route intersects a deep marine rupture that admits a huge **prehistoric** creature into this era. Neither the refugees nor the creature are malicious invaders.

The player saves the threatened great bird, builds trust and uses historical knowledge to avert armed conflict between the two populations. The sea creature still emerges: a major physical defence battle requires Foresee, Pin and Recall, active ground combat, the small bird's awareness and the great bird's decisive intervention. The beast is defeated **before Harbour is destroyed**. The great bird never wins alone.

Returning to **Present v2**, the old inland tribe no longer exists in exactly the known form, but its ancestral people and cultural threads persist within a prosperous combined Harbour society. The great-bird lineage survives. Records and bird responses to powerful disturbances in the east reveal that Harbour's tragedy was only a consequence of a larger disaster. The player mounts a great bird of the surviving lineage and crosses the sea to investigate the refugees' homeland.

### Act 2 — Across the Sea — LOCKED revelation / DIRECTION gameplay

Land #2's **Present v2** is far more heavily scarred: abandoned or altered cities, impossible memories, structures flickering between prior states, unstable routes and occasional intrusions from the distant Past. The player explores these environments, fights, meets survivors and investigates local historical contradictions, crossing to the **earlier Past** of the same regions. There they discover the prosperous Concordance civilisation and the functioning Loom.

**DIRECTION — A playable journey, not an exposition tour:** Several bounded regions offer distinct investigations, environmental causal changes, people to protect, enemies, shortcuts and consequences. The player initially tries to understand and sometimes repair particular disturbances. They learn that local solutions cannot resolve the network-wide catastrophe and that the Loom's past successes created its present danger.

**LOCKED — varied anchor encounters (Option B):** Act 2's anchor sites do **not** all require a mandatory Past/Present causality puzzle. Across the main journey, vary the primary activity: a few significant historical interventions, investigation across eras, physical environmental navigation, local conversations/choices, small skirmishes, and the two distinct large crisis encounters. Natural seams between anchors remain opportunities for exploration and discoveries. The player should regularly use time travel, but its use should arise naturally from a site's story or geography rather than a repeated gate-puzzle formula. **Scope guardrail:** Prioritise a few memorable authored causal changes over large numbers of interchangeable bespoke puzzles; reuse core seam, interaction and combat systems.

**LOCKED — Act 2's exploration-led anchor structure:** The **anchor network supplies the principal narrative events and destinations** across Land #2, including the two significant battle/crisis encounters (Loom containment and prehistoric incursion). The story should unfold primarily through **travelling the land and interacting with communities, places, the Past and the damaged Present**, not through extended exposition or a sequence of identical gate-switch missions. The world also includes exploration spaces and **smaller naturally occurring, non-anchored seams** that the bird senses; these can reveal local historical mysteries, offer environmental/casual consequences and optional discoveries without always advancing the main anchor plot. Not every seam is a Loom installation or needs a bespoke puzzle. **LOCKED — bounded regional hubs (Option B):** Land #2 consists of a **directed journey between relatively small, connected hub-like regions** rather than a seamless open world. Within each hub, players can explore two or three accessible locations, settlements, natural seams and optional paths in a flexible order; key anchor events and major story milestones remain authored and ordered. Believable cliffs, coastline, terrain, structures or route constraints bound exploration so players cannot simply run indefinitely in any direction. Regions can be revisitable where useful, but there is no requirement to simulate continuous geography or provide arbitrary cross-country traversal. **OPEN:** exact region topology, number of minor anchors/natural seams, how hubs connect and which optional discoveries feed back into the principal narrative.

**DIRECTION — Anchor journey spanning Acts 2–3:** Travelling Land #2 and dealing with multiple distinct anchors is a substantial part of play, not only the setting for a handful of big battles. In Act 2, the player encounters different anchor uses, repairs and local interventions, including the **first deliberate shutdown** at the neglected incursion site; further small-site closures may arise through exploration and investigation before the wider decision. In Act 3, this becomes an intentional regional dismantling campaign. **Most anchor encounters should be compact exploration, environmental, investigation or social problems**, not standalone siege battles or lengthy bespoke story arcs. Reserve major defence set pieces for the agreed high-stakes turning points; reuse core gameplay systems and make each anchor's effects comprehensible.

**DIRECTION — Two complementary Act 2 defence beats:** First, collaborate with local workers to contain an unstable Loom facility and witness a genuine short-term benefit. Later, defend a community from prehistoric creatures escaping an exceptional rip sustained by a neglected anchor, then deactivate that anchor and see the rip close. Its closure also cuts off a vital supply/transport lifeline, complicating any conclusion that all anchors can simply be destroyed. The supply loss is a **longer-term problem**, not an immediate forced evacuation: the player can help establish a viable independent route or means of provision and revisit the consequences. The Curator can still see the incident as a failure of upkeep rather than proof the network must end. This encounter is the player's first clear, deliberate test of anchor shutdown, **not** the start of the full Act 3 dismantling campaign.

The Curator's argument is credible: the Loom prevented famine, disease, war and suffering, and millions now depend on it. In the earlier era, they believe it can still be repaired. They attempt to recruit or stop the protagonist, not because they are simply evil but because pulling down the network appears to condemn people **now**. The player learns that further forced corrections only increase future instability. Act 2 ends with a decision: the Loom must be dismantled.

### Act 3 — The Bird-Rider — LOCKED stakes / DIRECTION specifics

The player deactivates major causal anchors on Land #2. The intention is **not to destroy cities**: it is to prevent systemic collapse while organising warnings, routes, shelter, defence and evacuation. When artificial supports fail, infrastructure may stop functioning, districts become unsafe and communities must move. Some forces oppose the player because they see actual losses, not the avoided disaster.

**DIRECTION — The evacuation target as a downstream consequence:** One inhabited, anchor-dependent hub becomes **progressively more vulnerable as other passages are deactivated**: traffic and essential supplies are diverted through it, remaining operators push the system harder, and the still-open local connection becomes less stable. The player may see these warnings accumulating while travelling between simpler anchor sites. Eventually this community faces evacuation. **Its inhabitants are not merely ignorant of the larger threat:** their immediate situation has genuinely worsened in the wake of the Bird-Rider's closures, even though leaving the Loom operating would be disastrous over time. This makes the penultimate evacuation personal, politically credible and distinct from the final marine-gate mission. Preserve enough variety and geographic logic that the player does not seem to be aimlessly destroying installations.

**LOCKED — scope boundary for evacuation consequences:** The anchor-closure cascade and evacuation are an **authored, largely fixed story progression**, not a dynamic network simulation or a branching preparedness system. Do **not** build optional routes, advance-warning states, resource-provision choices or alternate evacuation outcomes that modify how the major encounter unfolds. Players express agency through the shared core combat, movement and time powers **within the encounter**, but preparation choices should not create combinatorial scenario variants. Environmental foreshadowing can change at authored milestones without separate gameplay state systems.

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

**LOCKED — light, tangible player progression (Option B):** The protagonist should feel **noticeably stronger and more capable as the story advances**, without an XP-grind loop, character-level treadmill or conventional branching skill tree. Progression comes through a **small number of meaningful weapon/equipment improvements and upgrades to established combat actions**, acquired through discoveries, exploration rewards or authored story milestones. Upgrades should make existing tools feel more effective or versatile, while player mastery of positioning, defensive timing, bird powers and causality remains important. Avoid a complex statistics/inventory-management game. The exact upgrades, pacing, equipment types and whether improvements are automatic or selectable are **OPEN**; no additional player combat abilities are implied until chosen.

**LOCKED — hybrid upgrade acquisition (Option C):** Core upgrades needed for story completion and baseline combat competence arrive through **authored story milestones** and cannot be permanently missed. **Optional equipment or improvements** reward exploring side paths, investigating local consequences and making discoveries, but never become hidden requirements to finish the main game. Optional upgrades may make fights more comfortable or open tactical possibilities without forcing completionist play. **OPEN:** exact reward types, how to communicate missed opportunities, whether some upgrades can be revisited, and how optional power is balanced against mandatory encounters.

**LOCKED — regional return scope:** Selected previous locations can be revisited when the story or a meaningful local consequence warrants it, but there is no requirement to return everywhere; player experimentation is supported within each region before progressing, and some authored earlier seam connections may remain accessible at chosen return points.

**OPEN:** Number and variety of optional choices per region, replay incentives, authored state combinations, progression of aerial capabilities, exact upgrade sources/choices, detailed save/state representation and effects of earlier choices late in the story.

**EXPERIMENTAL:** A formal run-based or roguelike structure. A separate grand-strategy spin-off could explore deeper generational social simulation; it is **not part of this action-adventure's scope**.

## 9. Development guardrails

**LOCKED current project choice:** **Godot**; Git/version control; develop through narrow, testable prototypes before any full-scale production.

**DIRECTION:** Stylised 3D, bounded levels, **GDScript unless testing reveals a compelling reason otherwise**, editable/tunable values and authored states rather than hard-coded one-off puzzles or premature generalized historical simulation.

**LOCKED — dual-platform design target:** The intended experience is **genuinely both touch/mobile and controller/PC-console compatible**, with neither relegated to an afterthought. There is one shared game and set of abilities, but **two tailored control and HUD presentations**. **Mobile melee uses a single gesture circle/area** (tap light, hold heavy, horizontal swipe either way for sweep), distinct from drag-to-target bird abilities; movement can use a virtual stick. **Controller melee uses separate inputs** for the corresponding actions, with a shoulder-button/selection/aiming equivalent for bird powers. Mouse may support pointing/dragging. Attack, block, dodge, exploration, and the bird's tactical overview must remain practical and readable on a phone screen as well as with a controller. Do not require precise mouse pointing or an excessive number of simultaneous buttons for core play.

**DIRECTION — development validation:** Prototype a small identical encounter with **both** touch and gamepad input from the outset, alongside adaptable UI/screen layouts and reasonable performance targets. Keep gameplay, targeting rules and temporal powers input-agnostic under the hood. Avoid treating a single desktop prototype as proof of mobile usability. **OPEN:** Which platform is published first, concrete device/performance targets, and exact input mappings; release order does not redefine the core design.

Initial architectural decisions should be driven by prototypes for (a) isometric movement/level exploration, (b) visible and crossable seams, (c) paired Past/Present authoring, (d) one legible authored causal intervention, (e) bird companionship and (f) Foresee/Pin/Recall in compact direct combat. Community defence, aerial traversal, full story content and broad lineage permutations should **not** be built into the first prototype.

Dedicated prototype and technical planning belong in **PROTOTYPE_PLAN.md** and **TECHNICAL_DIRECTION.md** once the remaining consequential questions are settled; those are supporting plans, not alternate masters.

## 10. Open questions, prioritised

### OPEN — Important before / during earliest prototypes

1. **Natural seam closure and anchor shutdown:** The Loom's physical interventions through artificially maintained seams, and the combined damage from held-open passages plus repeated rewrites, are **LOCKED**. Clarify the natural closing tendency, what happens to travellers when a seam closes, and the safe consequences of deactivating a main anchor. Detailed mechanics can be prototyped later.
2. **Era anchoring and chronology:** **LOCKED:** Natural seams already connect causally significant historical moments; no special tether to the protagonist's displacement is needed. The Past progresses by authored milestones with limited revisits, and the bird may nudge natural alignment. **Deferred:** exact origin arrival location, specific revisitable connections, the causal-severance paradox after the original experiment is averted, and why exceptional damaged faults may reach prehistoric time.
3. **Dual input and combat feel:** Both touch/mobile and controller/PC-console support, **light/heavy attack + block + dodge**, **assisted melee targeting**, and a **wide crowd-control knockback sweep** are **LOCKED**. Mobile melee uses **tap, hold and horizontal swipe** in one gesture area; initial touch controls place **separate Block and Dodge buttons on the right** and a movement/dodge-direction virtual stick on the left (**DIRECTION**). Controller can use separate attack inputs. Prototype both schemes; test gesture discrimination, sweep arc/crowd control, right-thumb defensive reach, optional boss lock-on, defensive timing, enemy challenge and bounded level size.
4. **Bird abilities and energy:** Foresee, Pin and Recall **should feel broadly applicable to meaningful motion** and have cooldowns. They draw from the same temporal-energy reserve that is drained by holding seams open. Determine regeneration and safe return-crossing behaviour; prototype a shared temporal-interaction interface, one animated environmental object and one moving physics object, and test readability, reverse motion and collisions.
5. **First causal prototype — selected:** Greybox the blocked coastal valley / river / waterfall puzzle: glimpse its Present state, use the bird to cross, redirect a Past watercourse through physical action, and reveal a changed Present coastal route. Keep environmental state changes authored and limited, add optional interactions only after the main loop works, and test whether a seam preview communicates the important effect clearly. Resolve the exact causal geometry and how the return route is never softlocked.

### OPEN — Can safely wait until later

- Exact bird recovery incident, power unlock beats and great-bird teaching interaction.
- Exact research/experiment personnel, Curator's late involvement, and how the player/audience sees that erased-history scene.
- Specific landslide/river puzzle, NPC lineages, cultural keeper's possible sensitivity, names and character biographies.
- Exact shape of Harbour defence commands and trust mechanics; amount of aerial exploration and combat.
- Full enemy/creature roster, precise map sizes, artwork, sound and cinematic approach.
- Final sacrifice's physical form; save architecture and long-term replay/run structure.
- Define the original function, evolved use, beneficiaries, displaced costs and player shutdown alternatives of each major Loom/anchor when authoring its region; avoid locking individual sites or extraction examples during early prototyping.

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
