
# Architecture Documentation

## Overview

Sky Metropolis is a client-side React application that combines a standard DOM-based UI with a WebGL 3D canvas. It uses a hybrid architecture where React manages the UI state, and Zustand manages the game simulation state, bridging the gap between the 2D interface and the 3D world.

## Design Decisions

### 1. State Management (Zustand)
- **Why**: Redux was deemed too boilerplate-heavy for a game loop. Context API causes too many re-renders for high-frequency updates (60fps game loop).
- **Implementation**: `useGameStore` is split into slices (`Grid`, `Economy`, `AI`) to organize logic but exposed as a single hook for ease of consumption.
- **Persistence**: `zustand/persist` middleware saves the city state to `localStorage`, enabling session continuity.

### 2. 3D Rendering (R3F)
- **Why**: React Three Fiber allows declarative definition of the 3D scene, making it easy to map the `Grid` state directly to 3D components (`<GroundTile />`, `<ProceduralBuilding />`).
- **Optimization**: 
  - **InstancedMesh**: Used for traffic/pedestrians to render thousands of entities with a single draw call.
  - **Memoization**: `React.memo` is aggressively used on the `CityLayer` to prevent re-rendering static buildings on every game tick.

### 3. Feature-Based Folder Structure
- **Why**: To prevent a "drawer" structure (controllers/, components/, services/) where related code is far apart.
- **Structure**:
  - `features/city`: Contains everything related to the simulation and 3D world.
  - `features/advisor`: Encapsulates the AI logic.
  - `features/ui`: Holds the HUD and game menus.

### 4. AI Integration (Gemini)
- **Pattern**: The AI is treated as an asynchronous service (`advisorService`).
- **Safety**: Zod schemas validate all LLM outputs at runtime. If the AI returns malformed JSON, the game fails gracefully without crashing.

## Data Flow

1. **Game Loop**: A `setInterval` in `useGameLoop` calls `store.tick()` every 2000ms.
2. **Simulation**: `calculateNextDay` (Pure Function) computes the new state (money, population).
3. **State Update**: Zustand updates the store.
4. **Render**: 
   - React UI updates DOM elements (Stats bar).
   - R3F updates dynamic 3D elements (Sun position, cars).

## Security Model

- **API Keys**: Injected via process.env. The client communicates directly with Google's API. Note: In a production MMO, this would be proxied through a backend to hide the key.
- **Input Sanitization**: AI output is strictly typed and sanitized before display.
