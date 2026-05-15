# D&D Combat Context

This context defines the canonical language for running D&D 5e combat encounters in this toolkit. It exists to keep turn management, recovery behavior, and resource tracking unambiguous.

## Language

**Creature**:
A combat participant represented in an encounter, including player characters and non-player creatures.
_Avoid_: Monster, unit, actor

**Encounter**:
The active combat session containing creatures and turn progression state.
_Avoid_: Battle state, match

**Initiative Order**:
The deterministic sequence of creatures sorted by initiative descending, then name ascending.
_Avoid_: Turn queue, random order

**Active Creature**:
The creature whose turn is currently in progress.
_Avoid_: Selected creature, focused creature

**Turn Lifecycle**:
The ordered flow of one turn: identify active creature, perform actions, apply resource effects, then request transition.
_Avoid_: Turn lifestyle, turn flow

**Round**:
The encounter cycle counter that changes only through valid initiative boundary transitions.
_Avoid_: Phase, wave

**Combat Time**:
The elapsed in-encounter time derived from round progression at 6 seconds per round.
_Avoid_: Wall-clock time, real time

**Local Session**:
An anonymous browser-only usage model where encounter and library data remain on-device and are persisted in local storage.
_Avoid_: Account session, cloud session

**Authentication Boundary**:
The explicit rule that encounter usage has no login, no user identity, and no account state.
_Avoid_: Optional login shell, hidden account mode

**Anonymous Interface**:
All combat and settings interfaces operate without user-bound props, profile data, or sign-out controls.
_Avoid_: currentUser state, session-aware UI

**Round Transition**:
The event where round count increments on a valid wrap from the last creature to the first creature in initiative order.
_Avoid_: Auto increment, implicit tick

**Invalid Boundary Transition**:
A blocked turn transition where initiative-boundary continuity cannot be proven in either direction.
_Avoid_: Invalid wrap, minor glitch, UI bug

**Turn Transition Error**:
A user-visible state indicating turn progression was blocked by an **Invalid Boundary Transition**.
_Avoid_: Generic error, crash

**Validated Initiative Snapshot**:
The most recent trusted record of ordered creature IDs and initiatives captured before a transition failure.
_Avoid_: Temp state, previous list

**Recalculate Initiative**:
A recovery action that restores turn order from the validated snapshot when possible and re-establishes deterministic active-turn state by setting active creature to first in initiative order.
_Avoid_: Soft reset, refresh page

**Order Drift**:
A partial-recovery condition where the validated snapshot cannot be fully restored because one or more snapshot creatures no longer exist.
_Avoid_: Full recovery, normal recalculation

**Drift Acknowledgement**:
An explicit user confirmation that accepts continuing the encounter after **Order Drift**.
_Avoid_: Implicit continue, silent accept

**Turn Start Refresh**:
A resource refresh that happens when a creature becomes the active creature at the start of its own turn.
_Avoid_: Global refresh, round refresh

**Legendary Actions**:
A creature-specific tracked resource consumed by legendary features and refreshed only at that creature's turn start.
_Avoid_: Shared pool, per-round global counter

**Effect**:
A tracked combat modifier on a creature that may be expiring or non-expiring.
_Avoid_: Buff, timer note

**Effect Source**:
The origin of an effect, either `baseline` (from creature data) or `encounter` (added during play).
_Avoid_: Effect type, implicit origin

**Defense Effect Category**:
The defense modifier kind of an effect: `resistance`, `immunity`, or `vulnerability`.
_Avoid_: Generic defense tag

**Defense Effect Scope**:
The required target scope for a defense effect: either one damage type or `all damage types`.
_Avoid_: Empty scope, implicit scope

**Defense Conflict**:
The state where active defense effects with incompatible categories exist on the same defense scope.
_Avoid_: Auto-resolved defense, hidden overlap

**Effect Anchor Round**:
The round number recorded when an expiring effect is added, used as the baseline for duration counting.
_Avoid_: Created timestamp, guess start

**Effect Elapsed Rounds**:
The elapsed duration value computed as `currentRound - effectAnchorRound` for expiring effects.
_Avoid_: Inclusive round count, guessed elapsed

**Effect Expiry Boundary**:
The round-transition checkpoint where effect expiration is evaluated after full duration has elapsed.
_Avoid_: Mid-turn expiry, early cutoff

## Relationships

- An **Encounter** contains one or more **Creature** records
- The toolkit runs as a **Local Session** with no login requirement
- A **Local Session** does not provide cloud sync or account-based recovery
- The **Authentication Boundary** forbids auth-gated combat access
- The **Anonymous Interface** removes user identity and sign-out interactions from UI components
- An **Encounter** maintains exactly one **Initiative Order** when creatures exist
- An **Encounter** has zero or one **Active Creature**
- The **Turn Lifecycle** operates on exactly one **Active Creature** at a time
- A **Round Transition** occurs only when the **Turn Lifecycle** advances across the **Initiative Order** boundary (last to first)
- **Combat Time** equals completed rounds multiplied by 6 seconds
- An **Invalid Boundary Transition** produces a **Turn Transition Error**
- A **Turn Transition Error** is resolved by **Recalculate Initiative**
- **Recalculate Initiative** uses one **Validated Initiative Snapshot** as recovery source
- **Validated Initiative Snapshot** updates only after successful `Next Turn` transitions
- **Validated Initiative Snapshot** does not update during transition errors or recovery flows
- **Recalculate Initiative** sets **Active Creature** to first in restored **Initiative Order**
- A failed full restore from the snapshot yields **Order Drift**
- **Order Drift** requires **Drift Acknowledgement** before turn progression resumes
- **Legendary Actions** are updated via **Turn Start Refresh** for the same creature
- An **Effect** stores one **Effect Anchor Round** for duration calculations
- Every **Effect** has exactly one **Effect Source**
- `baseline` effects are locked during encounter play
- `encounter` effects are user-editable during encounter play
- A defense **Effect** has one **Defense Effect Category**
- A defense **Effect** has one required **Defense Effect Scope**
- A **Defense Conflict** occurs when incompatible defense categories overlap on the same **Defense Effect Scope**
- A non-expiring **Effect** has no expiry boundary
- **Effect Elapsed Rounds** is calculated as `currentRound - Effect Anchor Round`
- Effect expiry is evaluated only at the **Effect Expiry Boundary** (round transition)
- An effect with duration `N` rounds expires when **Effect Elapsed Rounds** is `>= N` at that boundary

## Example dialogue

> **Dev:** "We hit next turn from the last creature; should **Round** increment now?"
> **Domain expert:** "Only if last-to-first continuity is proven in **Initiative Order**."
> **Dev:** "If continuity is broken, do we still move forward?"
> **Domain expert:** "No, raise **Turn Transition Error** and run **Recalculate Initiative** from the **Validated Initiative Snapshot**."
> **Dev:** "After recalculation, do legendary points reset for everyone?"
> **Domain expert:** "No, **Legendary Actions** refresh only through **Turn Start Refresh** on that creature's own turn."

## Flagged ambiguities

- "turn lifestyle" was used to mean **Turn Lifecycle**; resolved to **Turn Lifecycle**.
- "original turn order" was ambiguous; resolved to restoration from **Validated Initiative Snapshot**.
- "recovery succeeded" was ambiguous; resolved to distinguish full restore vs **Order Drift**.
- "resume prior turn" conflicted with deterministic recovery; resolved: **Recalculate Initiative** restarts at first in order.
- "persistent warning" was too rigid; resolved: **Order Drift** warning is dismissible by user.
- "invalid wrap" was too narrow once reverse validation was added; resolved to **Invalid Boundary Transition**.
- "resistance/immunity/vulnerability meaning" was ambiguous; resolved as locked `baseline` **Effect** entries.
- "no scope" for defense effects was ambiguous; resolved to required scope with explicit `all damage types`.
- contradictory defense effects are allowed and surfaced as **Defense Conflict** for manual adjudication.
