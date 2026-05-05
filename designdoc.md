# Letterfall — Game Design Document

## 1. High Concept

**Letterfall** is a word-puzzle falling-block game that combines the pressure and spatial planning of *Tetris* with the vocabulary-building satisfaction of word games like *Boggle*, *SpellTower*, and *Scrabble*.

Letters fall from the top of a vertical grid. The player places them strategically to form words horizontally and vertically. Completed words clear from the board, score points, and create space for future letters. Longer words, rare letters, combos, and clever delayed setups reward advanced play.

The game should feel easy to understand, satisfying to master, and tense as the board fills up.

---

## 2. Design Pillars

### 2.1 Simple Inputs, Deep Decisions

The player should only need a few controls: move, drop, rotate/change orientation if applicable, and maybe hold/swap. The complexity should come from word placement and board management, not control difficulty.

### 2.2 Word Building as Spatial Strategy

The player is not just spelling words; they are arranging letters to create future opportunities. A player may intentionally leave gaps to later complete a stronger word.

Example:

* Player has `T H _ N` on the board.
* Later they drop `E` into the gap to form `THEN`.
* This scores more than immediately clearing `THE`.

### 2.3 Constant Forward Pressure

Like Tetris, the game should create urgency. The board fills up over time. The player must choose between quick clears and higher-scoring setups.

### 2.4 Reward Vocabulary and Pattern Recognition

Players should feel smart when they spot a word, extend an existing partial word, or trigger a chain reaction.

### 2.5 Short Sessions, High Replayability

A single run should be playable in 3–10 minutes, making it suitable for mobile play.

---

## 3. Target Platform

### Primary Platform

* iPhone / iOS

### Recommended Development Path

* Build a web prototype first using HTML/CSS/JavaScript or React.
* Validate the core mechanics quickly.
* Convert or rebuild for iOS later using React Native, Swift, or a mobile game framework.

### Why Web First

* Faster iteration.
* Easier debugging.
* Easier playtesting.
* Can test grid size, scoring, word detection, letter frequency, and game speed before committing to native mobile complexity.

---

## 4. Target Audience

### Primary Audience

* Casual puzzle players.
* Word game fans.
* Mobile players looking for short, replayable sessions.

### Secondary Audience

* Competitive score chasers.
* Players who enjoy optimization, combos, and risk/reward decisions.

### Player Fantasy

“I am building words under pressure while keeping the board alive. Every letter matters.”

---

## 5. Genre

* Falling-block puzzle game.
* Word puzzle game.
* Score attack / survival game.

---

## 6. Core Gameplay Summary

Letters or letter pieces fall from the top of the grid. The player moves them left and right, drops them into position, and tries to form valid dictionary words.

When a valid word is formed, it can be cleared from the board. Cleared letters disappear, gravity resolves the board, and new opportunities may form.

The game ends when letters stack to the top and no new piece can enter the board.

---

## 7. Core Game Loop

1. A new letter or letter piece appears at the top of the board.
2. The player moves it horizontally while it falls.
3. The player places the letter/piece on the board.
4. The game checks for valid words.
5. Valid words are cleared, scored, or highlighted depending on rules.
6. Remaining letters fall downward due to gravity.
7. Combos or chain reactions are scored.
8. A new piece appears.
9. The game speed gradually increases.
10. The player survives as long as possible and tries to beat their high score.

---

## 8. Board Design

### Recommended Grid Size

**8 columns × 14 rows** for the first prototype.

### Why 8 Columns

* Wide enough to form common 3–7 letter words.
* Narrow enough to maintain pressure.
* Works well on mobile screens.
* Encourages both horizontal and vertical word building.

### Alternative Grid Sizes

#### 7 × 14

* More intense.
* Faster board pressure.
* Better for quick arcade sessions.

#### 8 × 16

* Slightly more forgiving.
* Better for casual players.
* Allows longer word setup.

#### 10 × 18

* More strategic.
* May feel too roomy and slow on mobile.
* Harder to balance.

### Prototype Recommendation

Start with **8 × 14**, then test:

* Average run length.
* Whether players can create 4–6 letter words consistently.
* Whether the board feels too cramped or too forgiving.

---

## 9. Falling Pieces

There are several possible piece systems. The MVP should start simple.

### 9.1 MVP Piece System: Single Letters

Each falling piece is a single letter tile.

#### Advantages

* Easiest to code.
* Easy for players to understand.
* Word-building is clean and direct.
* Best for validating the core idea.

#### Disadvantages

* May feel less like Tetris.
* Less spatial complexity.

### 9.2 Advanced Piece System: Letter Pairs

Pieces contain two connected letters.

Examples:

* Horizontal pair: `A T`
* Vertical pair:

  * `A`
  * `T`

The player can rotate the pair before placing it.

#### Advantages

* Feels more like a falling-block game.
* Adds tactical placement decisions.
* Makes the game more visually active.

#### Disadvantages

* More complex to code.
* Harder to balance.
* Can make word formation feel random if not tuned carefully.

### 9.3 Advanced Piece System: Letter Blocks

Pieces are shaped like simple Tetris-style forms, each cell containing a letter.

This should not be used in the MVP.

#### Reason

It creates too much complexity too early. The core word-clearing mechanic should be proven first.

---

## 10. Letter Distribution

Letter frequency should be inspired by English letter usage, but tuned for fun rather than strict realism.

### Common Letters

Common letters should appear more often:

* E
* A
* R
* I
* O
* T
* N
* S
* L

### Uncommon Letters

Uncommon letters should appear less often but score more:

* J
* Q
* X
* Z
* K
* V

### Recommended Letter Values

| Letter                       | Value |
| ---------------------------- | ----: |
| A, E, I, O, U, L, N, S, T, R |     1 |
| D, G                         |     2 |
| B, C, M, P                   |     3 |
| F, H, V, W, Y                |     4 |
| K                            |     5 |
| J, X                         |     8 |
| Q, Z                         |    10 |

### Vowel Management

The game must avoid starving the player of vowels.

Recommended rule:

* At least 35–45% of generated letters should be vowels.
* If the board contains too few vowels, increase vowel spawn chance temporarily.
* If the board contains too many vowels, reduce vowel spawn chance temporarily.

---

## 11. Word Formation Rules

### 11.1 Valid Word Directions

For MVP:

* Horizontal words, left to right.
* Vertical words, top to bottom.

For later versions:

* Diagonal words may be added as a special mode, not the default.

### 11.2 Minimum Word Length

Recommended MVP minimum: **3 letters**.

### Why 3 Letters

* Keeps the game approachable.
* Allows frequent clears.
* Prevents the board from clogging too quickly.

### Optional Advanced Rule

Increase minimum length as difficulty rises:

* Levels 1–3: 3-letter minimum.
* Levels 4–6: 4-letter bonus emphasis.
* Later levels: 3-letter words still clear, but score poorly.

### 11.3 Word Detection

After each placement, the game scans:

* The row containing the placed letter.
* The column containing the placed letter.
* Any affected rows/columns after gravity resolves.

The game identifies all valid contiguous letter sequences of length 3 or more.

Example row:

`C A T S _ E R`

Detected possible words:

* CAT
* CATS
* AT
* ATS

Only words meeting the minimum length and dictionary validation rules count.

---

## 12. Word Clearing Rules

This is a key design decision.

### Recommended Rule: Player-Confirmed Clearing

Words do **not** instantly disappear the moment they form. Instead, valid words are highlighted and the player can choose to clear them.

### Why

This solves the “THE disappears before I can make THEN” problem.

The player should be allowed to build longer words intentionally.

### Clearing Options

#### Option A: Auto-Clear Longest Word Only

When a word forms, the game automatically clears the longest valid word.

Example:

* Board contains `T H E N`.
* Game clears `THEN`, not `THE`.

This is simple, but it still removes some player control.

#### Option B: Manual Tap-to-Clear

Valid words glow. The player taps the word they want to clear.

This is recommended for mobile.

#### Option C: Timed Confirmation Window

When a word forms, it glows for a short time. If the player does nothing, it clears automatically.

This adds pressure but may frustrate players.

### MVP Recommendation

Use **manual tap-to-clear** with a limit:

* Valid words remain highlighted.
* Player can tap to clear them any time before the board fills.
* A word can be extended if new letters are placed adjacent to it.

This creates strategy and solves premature clearing.

---

## 13. Word Selection and Overlap

### 13.1 Multiple Valid Words

If multiple words exist, the player can choose which one to clear.

Example:

`S T A R T`

Possible words:

* STAR
* START
* ART

The UI should prioritize showing the longest valid word, but allow selecting shorter words if useful.

### 13.2 Overlapping Words

If a placed letter completes both a horizontal and vertical word, clearing both should be possible.

Example:

Horizontal: `C A T`
Vertical through `A`: `B A R`

The `A` belongs to both words.

### Recommended Rule

If selected words share letters, those shared letters are cleared once. The player receives score credit for both words.

This rewards crosswords and advanced placement.

---

## 14. Gravity Rules

After letters clear, all unsupported letters fall downward.

### Gravity Type

Use standard column gravity:

* Each column collapses independently.
* Letters fall straight down into empty spaces.

### Why

* Easy to understand.
* Easy to implement.
* Creates chain reaction opportunities.

### Chain Reactions

After gravity resolves, the game checks again for newly formed words.

If new valid words are formed, they are highlighted or automatically included in a combo depending on game mode.

---

## 15. Scoring System

Scoring should reward:

* Longer words.
* Rare letters.
* Multiple words cleared together.
* Chain reactions.
* Survival.

### 15.1 Base Word Score

Base score = sum of letter values × word length multiplier.

Recommended multiplier:

| Word Length | Multiplier |
| ----------: | ---------: |
|           3 |         ×1 |
|           4 |         ×2 |
|           5 |         ×3 |
|           6 |         ×5 |
|           7 |         ×8 |
|          8+ |        ×12 |

### Example

Word: `QUIZ`

Letter values:

* Q = 10
* U = 1
* I = 1
* Z = 10

Sum = 22
Length = 4
Multiplier = ×2

Score = 44

### 15.2 Combo Bonus

If multiple words are cleared in one move:

| Words Cleared |    Bonus |
| ------------: | -------: |
|             1 | No bonus |
|             2 |     +25% |
|             3 |     +50% |
|            4+ |    +100% |

### 15.3 Chain Bonus

If gravity creates another word after a clear:

|    Chain Step | Bonus |
| ------------: | ----: |
|   First clear |    ×1 |
|  Second chain |  ×1.5 |
|   Third chain |    ×2 |
| Fourth chain+ |    ×3 |

### 15.4 Survival Bonus

Every level or every fixed number of pieces placed grants a small survival bonus.

Example:

* +100 points every 25 letters placed.
* +500 points when advancing a level.

---

## 16. Difficulty Progression

Difficulty should increase gradually.

### Variables to Adjust

* Falling speed.
* Spawn delay.
* Frequency of difficult letters.
* Minimum clear expectations.
* Garbage tiles or locked tiles in advanced modes.

### Recommended MVP Level Progression

Advance one level every 20 placed letters or every 5 cleared words.

| Level | Speed       | Notes              |
| ----: | ----------- | ------------------ |
|     1 | Slow        | Learn the game     |
|     2 | Slow-medium | Slight pressure    |
|     3 | Medium      | Normal play        |
|     4 | Medium-fast | More urgency       |
|    5+ | Fast        | Survival challenge |

### Avoid Early Frustration

Do not make the game too fast too soon. Word games require thinking time. The pressure should come from board state first and speed second.

---

## 17. Game Modes

### 17.1 Classic Survival

The main mode.

Goal:

* Survive as long as possible.
* Score as high as possible.
* Game ends when the board reaches the top.

### 17.2 Timed Score Attack

A 2-minute or 3-minute mode.

Goal:

* Score as many points as possible before time runs out.

Good for mobile and leaderboards.

### 17.3 Daily Puzzle

A fixed letter sequence is shared by all players each day.

Goal:

* Achieve the highest score from the same sequence.

This encourages replay and social sharing.

### 17.4 Zen Mode

No falling timer.

Goal:

* Relaxed word-building.
* Good for casual players and accessibility.

### 17.5 Challenge Mode

Specific objectives:

* Clear 10 four-letter words.
* Use the letter Q three times.
* Create a 3-word combo.
* Survive with a 7-column board.

---

## 18. Controls

### Mobile Controls

#### Tap / Drag

* Drag falling letter left or right.
* Swipe down to fast drop.
* Tap highlighted word to clear.

#### Buttons

* Left arrow.
* Right arrow.
* Soft drop.
* Hard drop.
* Hold/swap letter, optional.

### Recommended MVP Controls

* Drag left/right to move the falling letter.
* Swipe down to drop quickly.
* Tap highlighted word to clear.
* Optional: tap a “hold” button to save one letter for later.

### Desktop/Web Prototype Controls

* Left arrow / A: move left.
* Right arrow / D: move right.
* Down arrow / S: soft drop.
* Space: hard drop.
* Mouse click: select highlighted word.
* Shift or C: hold letter.

---

## 19. Hold Mechanic

### Description

The player may store one current letter for later and swap it with the active falling letter.

### Why It Helps

* Reduces randomness.
* Enables strategic word completion.
* Makes rare letters less frustrating.

### Rule

The player can use hold once per falling piece.

### MVP Status

Optional. Add after the base game works.

---

## 20. Power-Ups

Power-ups should be introduced later, not in the first prototype.

### Possible Power-Ups

#### Bomb Tile

Clears a small area.

#### Wildcard Tile

Can represent any letter.

#### Vowel Swap

Changes the current letter into a random vowel.

#### Shuffle Column

Rearranges letters in a selected column.

#### Freeze Time

Temporarily slows falling speed.

#### Dictionary Hint

Highlights the best available word.

### Design Warning

Power-ups can make the game feel less pure. Use them carefully and keep Classic Mode clean.

---

## 21. Special Tiles

### Wildcard Letter

Represented as `?`.

Can be used as any letter when forming a word.

### Locked Tile

Cannot be cleared unless part of a word of 5+ letters.

### Bonus Tile

Doubles the score of any word using it.

### Garbage Tile

Blocks space and cannot form words.

These should be reserved for advanced modes.

---

## 22. Dictionary System

### MVP Dictionary Requirements

The game needs a list of valid English words.

Recommended rules:

* Minimum 3 letters.
* No proper nouns.
* No abbreviations.
* No offensive slurs.
* Common words preferred.

### Word List Needs

The dictionary should support:

* Fast lookup of complete words.
* Optional lookup of prefixes for hints and future AI assistance.

### Technical Approach

Use a Set for valid words:

* `validWords.has(word)`

Use another Set for prefixes if needed:

* `validPrefixes.has(prefix)`

### Curation

The word list should be curated. A raw dictionary may contain obscure words that feel unfair or fake to players.

---

## 23. User Interface

### Main Game Screen

Elements:

* Game board.
* Current falling letter/piece.
* Next letter preview.
* Hold letter slot.
* Score.
* Level.
* Words found / combo indicator.
* Pause button.

### Word Highlighting

Valid words should be visually highlighted.

Important:

* Longest word should be emphasized.
* Overlapping words should be selectable without confusion.
* Tapping a highlighted word should preview score before clearing, if possible.

### Clear Animation

When a word clears:

* Letters pulse or glow.
* Score pops up near the word.
* Letters disappear.
* Remaining letters fall smoothly.

### Board Danger State

When the board is near the top:

* Add visual warning.
* Slight screen shake or warning sound.
* Do not overdo it; clarity matters.

---

## 24. Visual Style

### Recommended Style

Clean, colorful, readable, and mobile-friendly.

### Tile Design

Each letter tile should show:

* Large letter.
* Small point value.
* Optional bonus marker.

### Mood

The game should feel clever and satisfying, not childish.

### Possible Themes

* Minimal modern tiles.
* Notebook / word puzzle style.
* Arcade neon letters.
* Wooden letter tiles.
* Falling paper blocks.

---

## 25. Audio Design

### Core Sounds

* Letter lands.
* Word found.
* Word cleared.
* Combo triggered.
* Level up.
* Danger warning.
* Game over.

### Music

Light, looping background music that does not distract from thinking.

### Audio Principle

The player should get satisfying feedback without being overwhelmed.

---

## 26. Game Feel

The game should feel:

* Snappy.
* Fair.
* Clever.
* Slightly tense.
* Rewarding when words clear.

Important moments:

* Completing a long word.
* Dropping a letter into a gap to extend a word.
* Clearing multiple crossing words.
* Chain reaction after gravity.
* Saving the board with a last-second clear.

---

## 27. Failure Conditions

The game ends when a new falling piece cannot spawn because the top row is blocked.

Optional additional fail rule:

* If any letter remains above the visible board after placement, game over.

---

## 28. Win Conditions

Classic Survival has no final win state.

Other modes may have objectives:

* Reach a target score.
* Clear a required number of words.
* Survive a fixed number of levels.
* Complete daily challenge goals.

---

## 29. Progression and Rewards

### Player Progression

The player can unlock:

* Board themes.
* Tile styles.
* Sound packs.
* Daily challenge badges.
* Statistics milestones.

### Statistics to Track

* Highest score.
* Longest word.
* Most words in one clear.
* Best chain reaction.
* Total words cleared.
* Favorite word used.
* Most used letter.
* Average word length.

### Monetization-Friendly Rewards

Cosmetic unlocks are safest and least intrusive.

---

## 30. Monetization Options

### Recommended Monetization

* Free with ads between runs.
* Paid ad removal.
* Cosmetic themes.
* Optional daily challenge pack.

### Avoid

* Pay-to-win power-ups.
* Interrupting gameplay with ads.
* Energy systems that stop play.

### Best Approach

Make the core game fair and complete. Monetize convenience and cosmetics.

---

## 31. Accessibility

### Required Accessibility Features

* Colorblind-safe highlights.
* Large readable letters.
* Adjustable fall speed.
* Reduced motion option.
* Sound toggle.
* Haptic toggle.

### Useful Modes

* Zen Mode for no time pressure.
* Larger board option for casual play.

---

## 32. Tutorial

The tutorial should be interactive and short.

### Tutorial Steps

1. Move a falling letter left and right.
2. Drop a letter into place.
3. Form a 3-letter word.
4. Tap the highlighted word to clear it.
5. Show gravity after clearing.
6. Demonstrate extending a word.
7. Demonstrate game-over danger.

### Key Lesson

Do not clear every word immediately. Sometimes it is better to wait and build a longer word.

---

## 33. Example Gameplay Scenario

The board contains:

`T H _ N`

The player receives the letter `E`.

Instead of dropping `E` elsewhere to make a simple 3-letter word, the player places it in the gap:

`T H E N`

The game highlights `THE` and `THEN`, but emphasizes `THEN` as the better scoring option.

The player taps `THEN`.

The four letters clear, the player receives a length bonus, and letters above fall into the open space.

If the falling letters create another word after gravity, a chain bonus is awarded.

---

## 34. Key Design Problem: Premature Word Clearing

### Problem

If words automatically disappear as soon as they form, players lose the ability to extend words.

Example:

* Player creates `THE`.
* The game instantly clears it.
* Player can no longer extend it into `THEN`, `THEM`, or `THEY`.

### Solution

Use manual tap-to-clear.

### Result

Players can decide:

* Clear now for safety.
* Wait for a longer word.
* Build crossing words.
* Risk board space for higher score.

This decision is central to the game’s strategy.

---

## 35. MVP Feature Set

### Must Have

* 8 × 14 board.
* Single falling letter pieces.
* Letter movement and dropping.
* Letter placement and gravity.
* Dictionary validation.
* Horizontal and vertical word detection.
* Manual tap/click word clearing.
* Basic scoring.
* Increasing speed.
* Game over condition.
* Restart button.

### Should Have

* Next letter preview.
* Highlight valid words.
* Longest word priority.
* Basic sound effects.
* Local high score.
* Simple tutorial overlay.

### Could Have

* Hold letter.
* Daily challenge seed.
* Combo animations.
* Themes.
* Power-ups.

### Not MVP

* Multiplayer.
* Complex Tetris-shaped pieces.
* Account system.
* Online leaderboards.
* Monetization.
* Advanced story/progression.

---

## 36. Prototype Milestones

### Milestone 1: Static Board and Letter Placement

* Render board.
* Spawn one letter.
* Move left/right.
* Drop letter.
* Lock letter into grid.

### Milestone 2: Gravity

* Clear manual test cells.
* Make letters fall into empty spaces.
* Confirm column collapse behavior.

### Milestone 3: Word Detection

* Load dictionary.
* Scan rows and columns.
* Highlight valid words.

### Milestone 4: Word Clearing and Scoring

* Tap/click highlighted word.
* Remove letters.
* Apply gravity.
* Add score.

### Milestone 5: Game Loop

* Continuous falling letters.
* Next letter preview.
* Speed increases.
* Game-over condition.

### Milestone 6: Polish

* Animations.
* Sound.
* Tutorial.
* High score.
* Mobile controls.

---

## 37. Technical Design Notes

### Board Data Structure

Represent the board as a 2D array.

Example:

```js
board[row][col] = {
  letter: 'A',
  value: 1,
  id: 'unique-tile-id',
  modifiers: []
}
```

Empty cells are `null`.

### Word Scan Logic

For every row:

* Read contiguous sequences of letters.
* Check every substring of length 3+.
* Validate against dictionary.

For every column:

* Do the same vertically.

### Optimization

For MVP, full board scanning after each placement is acceptable.

The board is small, so performance should be fine.

### Dictionary Lookup

Use a JavaScript `Set` for fast lookup.

```js
const isValidWord = validWords.has(candidate.toLowerCase());
```

### Random Letter Generation

Use weighted randomness based on tuned letter frequency.

---

## 38. Balancing Questions

These must be tested through playtesting:

1. Is 8 × 14 the right board size?
2. Should words clear manually or automatically after a delay?
3. Are 3-letter words too easy?
4. Does the game need a hold letter mechanic?
5. Are vowels too common or too rare?
6. Do rare letters feel exciting or annoying?
7. How long should an average run last?
8. Should diagonals exist?
9. Should clearing short words be penalized at higher levels?
10. Is the game more fun with single letters or letter pairs?

---

## 39. Main Risks

### Risk 1: The Game Feels Too Random

Mitigation:

* Use smart letter generation.
* Add hold letter.
* Ensure vowel balance.

### Risk 2: The Game Feels Too Slow

Mitigation:

* Increase falling speed gradually.
* Add score attack mode.
* Reward combos and fast clears.

### Risk 3: Word Detection Feels Confusing

Mitigation:

* Highlight words clearly.
* Prioritize longest word.
* Show score preview.

### Risk 4: Players Only Make 3-Letter Words

Mitigation:

* Strong multiplier for longer words.
* Achievements for long words.
* Lower score value for repeated short words.

### Risk 5: Dictionary Feels Unfair

Mitigation:

* Use curated common-word list.
* Allow players to tap rejected words and see why they do not count.
* Avoid obscure Scrabble-only words in casual mode.

---

## 40. Competitive Differentiation

Letterfall differs from other word games because:

* It uses falling-block pressure.
* Words are built spatially over time.
* Players can delay clears to extend words.
* Cross-word clears and chain reactions create dramatic moments.
* It combines vocabulary skill with board survival strategy.

---

## 41. Possible Names

Working title:

* Letterfall

Other options:

* Word Drop
* LexiDrop
* SpellStack
* WordStack
* Glyphfall
* DropWords
* Letterwell
* Lexicon Drop
* Tower of Words
* Falling Letters
* Wordfall
* Spellfall
* Letterlock
* Stack & Spell
* Vocablock

Best current candidates:

1. Letterfall
2. SpellStack
3. WordStack
4. LexiDrop
5. Glyphfall

---

## 42. Recommended First Version

The first version should be brutally focused:

* Single letters only.
* 8 × 14 board.
* Horizontal and vertical words only.
* 3-letter minimum.
* Manual tap-to-clear.
* Basic scoring.
* No power-ups.
* No complex pieces.
* No monetization.

The goal is to answer one question:

**Is placing falling letters to build and clear words fun?**

If the answer is yes, then add polish, modes, progression, and mobile-specific features.

---

## 43. Open Design Decisions

These decisions should be made after prototype testing:

1. Should the game use single letters permanently, or evolve into letter pairs?
2. Should clearing be fully manual, semi-automatic, or mode-dependent?
3. Should valid words remain highlighted forever or decay over time?
4. Should players be able to clear multiple selected words at once?
5. Should the dictionary be casual-only or Scrabble-style?
6. Should diagonal words be allowed in a separate mode?
7. Should the game support portrait only or both orientations?
8. Should there be a campaign mode with increasingly difficult boards?
9. Should rare letters have special visual treatment?
10. Should players be able to undo in Zen Mode?

---

## 44. One-Sentence Pitch

**Letterfall is a falling-block word puzzle where players stack letters, build words under pressure, and decide whether to clear quick words now or risk waiting for bigger, smarter plays.**

---

## 45. MVP Success Criteria

The prototype is successful if:

* New players understand the game within 60 seconds.
* Players can consistently form words without frustration.
* Players naturally discover the strategy of delaying clears.
* Average sessions last at least 3 minutes.
* Players want to immediately retry after losing.
* Long words and combos feel exciting.
* The board pressure feels fair, not random.

---

## 46. Next Step

Build a web prototype with the following sequence:

1. Create the board.
2. Spawn falling single letters.
3. Add keyboard controls.
4. Lock letters into place.
5. Implement dictionary word detection.
6. Highlight valid words.
7. Clear selected words.
8. Add scoring and game over.
9. Playtest and tune board size, speed, and letter distribution.

Do not start with native iOS, monetization, online accounts, or complex visuals. Prove the core mechanic first.
