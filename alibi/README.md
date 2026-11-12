# Alibi

A five-minute, browser-only deduction game. Six guests, up to three investigation actions, one thief. No build step, account, API or database.

**Play:** https://lthorpe18.github.io/personal-webapps/alibi/

## Play

Read the guests’ verified reception dossiers, investigate up to three leads, compare the evidence, and accuse a guest. Rule-out marks are editable notes. Reading dossiers and reopening reports cost no actions. An accusation closes the case and explains how the evidence clears each innocent guest.

The daily case changes at midnight UTC. Random cases and shareable `?case=` codes use the same versioned deterministic generator. Local browser storage saves each case’s progress and up to 200 first-attempt results. Clearing browser data clears the record. Storage failures do not block play and show a warning.

## Fairness

The culprit matches all six evidence attributes. Each innocent matches a distinct pair of attributes, assigned from a shuffled six-vertex path. Each lead retains at least one innocent, and any three different leads uniquely identify the culprit. Some pairs already solve the case, allowing early accusations. A premature accusation can succeed by chance; the reconstruction explicitly flags an ambiguous collected evidence set.

All reception records and evidence are reliable. The closed-world rules are visible in the interface: the thief acted alone, with no disguises, borrowed passes or swapped belongings. This prototype uses attribute-based deductions, not a general natural-language mystery solver.

`engine.mjs` is independent of the DOM. `app.mjs` handles UI, local saves and sharing. Styles and icons are local; optional Google fonts fall back to Georgia/Arial. No analytics or backend calls. GitHub Pages serves this folder directly through the repository’s existing deployment.

## Verification

Run `node alibi/engine.test.mjs` from the repository root. It checks the uniqueness guarantee across 10,000 generated cases and all lead triples, determinism, normalization, action limits, finality, and save validation.
