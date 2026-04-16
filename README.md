# Fight Swipe

Fight Swipe is an Expo + React Native app for drilling Brazilian Jiu-Jitsu (BJJ) decision trees.  
You can build or load a flow chart, then swipe through connected moves to practice transitions, options, and submissions.

## What the app does

- **Flow-based training:** Navigate your technique graph by swiping left/right/up/down between connected nodes.
- **Built-in BJJ move data:** Seed flows from predefined move relationships.
- **Saved flow charts:** Create, open, autosave, and delete game/flow saves.
- **Overview map:** Visual graph view with pan + pinch zoom to inspect your full flow.
- **Create mode:** Build your own custom flow chart structure.
- **Technique media support:** Nodes can reference local video/image content.

## Tech stack

- **Expo SDK 54**
- **React Native 0.81 / React 19**
- **Expo Router** for navigation
- **React Native Gesture Handler** for swipe/pan/pinch interactions
- **React Native Paper** for UI elements

## Project structure

```text
app/
  _layout.tsx                  # Root tabs/navigation shell + providers
  index.tsx                    # Redirects root route to /tabs
  tabs/
    index.tsx                  # Main Fight Swipe training screen
    overview.tsx               # Graph overview canvas
    components/                # Shared tab UI pieces
    utils/                     # Graph/media helpers
  create/
    CreateSystem.tsx           # Create mode interaction screen
    CreateSystemLobby.tsx      # Create mode lobby
  components/
    HamburgerMenu.tsx          # App-wide drawer menu
  BjjData.ts                   # Technique nodes/edges seed data
  FlowStore.tsx                # Global flow state
  gameSaves.ts                 # Save/autosave persistence helpers
```

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Run the app

```bash
npm run start
```

Then launch on your target platform from Expo:

- Android emulator/device (`a` in Expo CLI, or `npm run android`)
- iOS simulator/device (`i` in Expo CLI, or `npm run ios`)
- Web (`w` in Expo CLI, or `npm run web`)

## Available scripts

- `npm run start` – Start Expo dev server
- `npm run android` – Start with Android target
- `npm run ios` – Start with iOS target
- `npm run web` – Start with Web target
- `npm run lint` – Run Expo lint checks
- `npm run reset-project` – Reset app scaffolding (from Expo template workflow)

## Core user flows

1. Open the app and enter **Fight Flow**.
2. Create or open a flow chart from the **Lobby**.
3. Swipe between connected nodes to train transitions.
4. Open **Overview** to see the full branching structure.
5. Use **Create** to build/edit a custom sequence tree.

## Notes

- This repository currently includes placeholder screens for **Explore** and **Settings** while those sections are being expanded.
- Local media assets live under `assets/Move Videos` and can be mapped to technique nodes.

---

If you’re contributing, please keep this README updated whenever routes, major features, or setup steps change.
