# NOTES.md - Working Notes for Orange Development

## Standing Rules (from MQTT channel)
- [ ] Prefix every message with `[mistal]`
- [ ] Write 'not tested, no browser' in commit message and report when true
- [ ] Never reference a `window.*` global without grepping that it is assigned
- [ ] Never use innerHTML with remote strings (XSS risk)
- [ ] Always pull before editing

## Open Items from Reviews
- [x] c9fed69 defeated counter issues - FIXED in 57ea629
  - [x] Use multiplayer.name instead of multiplayer.playerName (Promise issue)
  - [x] Add window.handleDefeated = handleDefeated for remote defeat events
  - [x] Replace innerHTML with document.createElement/textContent for XSS safety
  - [x] Add healthBarHidden class and showDefeatedCounter() for game mode visibility
  - [x] Remove screenshots from repo, add to .gitignore
- [ ] Canvas does not fill window
  - Fix: body { margin: 0; overflow: hidden; }
  - Fix: renderer.setSize(innerWidth, innerHeight) (not innerHeight-30)
  - Add window resize handler: update renderer size and camera.aspect + camera.updateProjectionMatrix()
  - Status: ASSIGNED, not started

## Last Commit
- Hash: 57ea629f8888f8d9f8633bf98f83dcd347b891b9
- Message: Fix defeated counter issues per Claude review of c9fed69
- Date: 2026-09-27T01:09:15+0200
- Changes: Addressed all 5 issues from Claude's c9fed69 review
- Tested: No (not tested, no browser)

## Current Branch
- Branch: goodVibes_Usi
- Base: master
