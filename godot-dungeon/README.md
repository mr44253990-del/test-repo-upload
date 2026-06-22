# RAKIB — Godot 4 Third-Person Maze Game

A complete, ready-to-run **Godot 4** game with the full flow:

**Splash screen → Main Menu → Settings/Play → Loading screen → Third-person 3D dungeon maze.**

### Features
- **Orbit camera** on a SpringArm3D — rotate freely with the mouse, and the
  camera automatically pulls in so it **never passes through walls**.
- **Procedural maze** rebuilt each run (rooms, loops, hidden passages).
- **Coins** to collect + an end **reward** score; **keys** to unlock the exit.
- **Player health** bar, **health pickups**, **traps** (damage + send to start)
  and **death → full restart** of the maze.
- **All sounds generated in code** (coins, keys, steps, jump/land, traps, win,
  death, UI clicks) plus an ambient music drone — no audio files needed.
- Stamina sprint, jump, toggleable flashlight, pause menu with live settings.

The maze is **procedurally generated** every run: hundreds of interconnected
cells, open rooms, looping passages (braided dead-ends), traps, scattered keys
and a single far-away exit portal — an "impossible labyrinth" that's different
each time and configurable in size and difficulty.

## How to run

1. Install **Godot 4.2+** (standard build): <https://godotengine.org/download>
2. Open Godot → **Import** → select this folder's `project.godot`.
3. Press **F5** (or the ▶ Play button). It boots at the splash screen.

> No external assets are required — all meshes, materials, lights and the maze
> are generated in code, so the project runs immediately.

## Game flow

| Stage | Scene | What it does |
|-------|-------|--------------|
| Splash | `scenes/Splash.tscn` | Animated logo + spinner + fake boot bar. Press any key to skip. |
| Main Menu | `scenes/MainMenu.tscn` | Play, Settings, Credits, Quit. |
| Play panel | (in MainMenu) | Choose difficulty, maze size (8–32), and an optional seed (number or word). |
| Settings | (in MainMenu / pause) | Graphics (fullscreen, vsync, resolution, quality, MSAA, render scale, FOV), audio (master/music/sfx), gameplay (sensitivity, invert-Y). Saved to disk. |
| Loading | `scenes/Loading.tscn` | Real threaded load of the game scene with a progress bar + tips. |
| Game | `scenes/Game.tscn` | First-person play in the generated maze. |

## Controls

| Action | Key |
|--------|-----|
| Move | `W A S D` / arrows |
| Look | Mouse |
| Sprint | `Shift` (uses stamina) |
| Jump | `Space` |
| Flashlight | `F` |
| Rotate camera | Mouse (orbits, wall-safe) |
| Pause / menu | `Esc` |

## Objective

Collect **all keys** (and grab **coins** for a bigger reward), then reach the
glowing **green portal** to escape. Red **traps** deal damage and send you to
the start; if your **health** hits zero the whole maze **restarts**. Pick up
red **health crates** to heal. Your time and coins are scored at the exit.

## Project structure

```
godot-dungeon/
├── project.godot              # engine config, input map, autoloads
├── default_bus_layout.tres    # Master / Music / SFX audio buses
├── icon.svg
├── assets/spinner.svg
├── scenes/
│   ├── Splash.tscn
│   ├── MainMenu.tscn
│   ├── Loading.tscn
│   └── Game.tscn
└── scripts/
    ├── Settings.gd            # autoload: persistent options
    ├── GameState.gd           # autoload: per-run data (seed, difficulty)
    ├── SceneSwitcher.gd       # autoload: fade transitions
    ├── Splash.gd
    ├── MainMenu.gd
    ├── PlayPanel.gd
    ├── SettingsPanel.gd
    ├── Loading.gd
    ├── MazeGenerator.gd       # recursive backtracker + braiding + rooms
    ├── MazeBuilder.gd         # turns the grid into 3D geometry
    ├── Player.gd              # first-person character controller
    └── Game.gd                # gameplay glue: HUD, pickups, traps, win/lose
```

## How the maze is generated

1. **Recursive backtracker** carves a *perfect* maze (one path between any two cells).
2. **Braiding** removes ~18% of dead-ends, creating loops and multiple routes.
3. **Rooms** knock out blocks of internal walls to form open chambers.
4. **Feature placement** uses BFS distance: the exit is the farthest cell from
   the start; keys and traps are scattered across the remaining cells.

`MazeBuilder` then instantiates floor, ceiling, wall colliders, torches, keys,
traps and the exit portal as real 3D nodes.

## Extending it

- Drop your own `.glb` wall/floor meshes and swap them in `MazeBuilder.gd`.
- Add enemies as `CharacterBody3D` with a `NavigationAgent3D` over the maze.
- Add a minimap by drawing the `MazeGenerator.cells` grid to a `SubViewport`.
- Hook real music/SFX into the `Music` / `SFX` audio buses.
