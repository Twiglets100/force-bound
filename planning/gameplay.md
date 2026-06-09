# Gameplay Systems - Multi-Map Expansion

This document details the maps, storyline events, and interactive elements introduced in the ForceBound Outlands expansion.

## 1. Storyline & Game States

The game progresses through sequential story states:

1. **`WOKE_UP`**
   - Player starts inside **`home`**.
   - Must interact with Companion M-0T (acting as the player's mother/guide).
   - Dialog: *"Dr. Aris is expecting you in the Lab. Sector Alpha is experiencing stability fluctuations."*
   
2. **`TALKED_MOM`**
   - Player can now exit `home` into `town`.
   - **Guard Kyle** blocks the northern exit of `town` leading to Route 1.
   - Dialog: *"Danger! The Outlands are experiencing quantum anomalies. No access allowed without a Bound Force."*
   
3. **`HAS_STARTER`**
   - Player visits the **`lab`** and selects one of the three glowing starter pods on the desk.
   - Dr. Aris congratulates the player and unlocks their credentials.
   - Dialog: *"Fascinating choice! Go north to Route 1 and locate the Resonance Node. It has collapsed and must be recalibrated."*
   - Guard Kyle now steps aside, allowing the player to pass.
   
4. **`NODE_STABILIZED`**
   - Player reaches the end of Route 1.
   - Interacts with the collapsing **Resonance Node**.
   - Triggers the Siphon Oscilloscope minigame. Upon successful frequency matching, the node stabilizes.
   - Player returns to Dr. Aris.
   - Dialog: *"Incredible work! Spacetime stability restored. You are now a certified Senior Resonator!"*
   - Game concludes with a victory banner.

---

## 2. Interactive Map Directory

### Map 1: Player Home (`home`)
- **Dimensions**: 12x10 grid.
- **Warp**: Exit tile (6, 9) warps to `town` (5, 7).
- **NPCs**:
  - `mom` (Companion M-0T): Heals active forces (restores Stability to 100%) and updates initial quest line.

### Map 2: Vector Station Alpha (`town`)
- **Dimensions**: 30x25 grid.
- **Warps**:
  - Door at (5, 6) warps to `home` (6, 8).
  - Door at (18, 12) warps to `lab` (6, 8).
  - Northern exit (15, 0) warps to `route1` (10, 38).
- **NPCs**:
  - `guard` (Kyle): Blocks (15, 0) if player's team is empty.
  - `scientist`: Explains elemental type interactions (e.g. Gravity bends Electromagnetism).

### Map 3: Dr. Aris's Lab (`lab`)
- **Dimensions**: 14x10 grid.
- **Warp**: Exit at (6, 9) warps to `town` (18, 13).
- **NPCs**:
  - `aris`: Gives final mission to stabilize the node.
- **Objects**:
  - 3 Starter pods (Graviton, Electron, Entropist). Selecting one prompts player to bond. Once selected, other pods lock and team is populated.

### Map 4: Route 1 - The Outlands (`route1`)
- **Dimensions**: 20x40 grid.
- **Warp**: Exit at (10, 39) warps to `town` (15, 1).
- **Encounters**: Swirling anomaly zone tiles enable wild encounters (Tachyon, Photon, Quark).
- **Boss Event**:
  - `resonance_node` (at 10, 5): Interacting with it triggers an oscilloscope matching event. Must achieve >90% harmonic match within 5 seconds to stabilize the area.
