# System Architecture - Multi-Map Expansion

ForceBound is designed as a client-side HTML5 application. To facilitate a Pokemon-like progression, the system architecture has been updated to support a state-driven multi-map overworld.

## Multi-Map Framework

Instead of a single grid, the overworld is managed by a `MapManager` or dictionary structure. Each map contains a grid array, warp tiles, and NPC arrays.

```
+--------------------------------------------------------+
|                      GameManager                       |
|  - Tracks storyState ('WOKE_UP', 'TALKED_MOM', etc.)   |
|  - Coordinates Screen switching                        |
+---------------------------+----------------------------+
                            |
           +----------------v----------------+
           |         OverworldEngine         |
           |  - Draws active map to Canvas   |
           |  - Manages player coordinates   |
           |  - Handles collision detection   |
           +----------------+----------------+
                            |
           +----------------v----------------+
           |           MapManager            |
           |  - Holds MAPS config datasets   |
           |  - Triggers warps & NPC actions |
           +---------------------------------+
```

### Warping System (Doorways)
Warp tiles are coordinate pairs trigger-points. When the player walks onto a warp tile:
1. The engine intercepts movement.
2. Fades the screen (CSS transition).
3. Changes the active map instance.
4. Repositions player coordinates to the target offset.
5. Fades screen back in.

### NPC & Object Interactions
Interactive entities are indexed by grid coordinates:
- **Interactions**: Pressing `Space` or `Enter` checks if an NPC is directly in front of the player (based on player x/y and direction vector).
- **Dialogue Overlay**: A glassmorphic text box slides up over the bottom portion of the canvas, intercepting key inputs until dialogue is resolved.

---

## State Schema Upgrades

The `localStorage` save state schema is extended with story flags:

```json
{
  "resonatorName": "Resonator-01",
  "storyState": "TALKED_MOM",
  "activeMap": "town",
  "position": { "x": 5, "y": 7 },
  "team": [
    {
      "species": "Electron",
      "level": 5,
      "currentStability": 45,
      "maxStability": 45
    }
  ],
  "discovered": {
    "electron": "captured"
  }
}
```
