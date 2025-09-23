# Nodots Backgammon

A comprehensive backgammon ecosystem built with TypeScript, featuring core game logic, AI capabilities, REST API, and type definitions. This monorepo contains all the components needed to build modern backgammon applications.

## 🎯 Overview

Nodots Backgammon is a complete backgammon platform that provides:

- **Core Game Logic** - Complete backgammon rules implementation
- **AI Engine** - Integration with GNU Backgammon for intelligent gameplay
- **REST API** - Full-featured backend for multiplayer games
- **Type Definitions** - Comprehensive TypeScript types for all components
- **Web Client** - Modern React-based frontend application

## 🔧 Open Lint Tasks

- Core: packages/core lint failures – parser config + rule violations (see issue #148)
- AI: packages/ai lint failures – test env + Function type usage (see issue #149)

## 📦 Packages

### [@nodots-llc/backgammon-core](nodots-backgammon-core/)

The foundation of the entire ecosystem - implements all backgammon game mechanics and rules.

**Key Features:**

- Complete backgammon rules implementation
- **Robot Automation** - Fully functional AI opponents that actually move pieces
- Board state management and move validation
- Support for doubles, bar entry, and bearing off
- GNU Position ID support for board serialization
- ASCII board display capabilities
- Comprehensive test coverage (85%+)

**Installation:**

```bash
npm install @nodots-llc/backgammon-core
```

**Usage:**

```typescript
import { Board, Game, Robot } from '@nodots-llc/backgammon-core'

// Initialize a new game
const board = Board.initialize()
const game = Game.initialize(players)

// Robot automation (v3.7.0+)
const robotResult = await Robot.makeOptimalMove(game, 'intermediate')
if (robotResult.success) {
  console.log('Robot completed turn successfully!')
  // robotResult.game contains updated board with robot's moves
}
```

### [@nodots-llc/backgammon-types](nodots-backgammon-types/)

TypeScript type definitions shared across all packages in the ecosystem.

**Key Features:**

- Complete type definitions for game states
- Board representation and checker movements
- Dice rolls and cube decisions
- Player information and game rules
- Move validation interfaces

**Installation:**

```bash
npm install @nodots-llc/backgammon-types
```

**Usage:**

```typescript
import { Game, Move, Player, Board } from '@nodots-llc/backgammon-types'
```

### [@nodots-llc/backgammon-ai](nodots-backgammon-ai/)

AI capabilities powered by GNU Backgammon engine integration.

**Key Features:**

- Integration with GNU Backgammon (gnubg) engine
- TypeScript support with full type definitions
- Plugin-based analyzer system
- Built on top of @nodots-llc/backgammon-core

**Prerequisites:**

- GNU Backgammon (gnubg) must be installed on your system

**Installation:**

```bash
npm install @nodots-llc/backgammon-ai
```

**Usage:**

```typescript
import { BackgammonAI } from '@nodots-llc/backgammon-ai'

const ai = new BackgammonAI()
const move = await ai.getBestMove(gameState)
```

### [nodots-backgammon-api](nodots-backgammon-api/)

REST API backend for multiplayer backgammon games.

**Key Features:**

- User management and authentication
- Game state persistence
- Real-time game updates
- Database integration with Drizzle ORM
- Comprehensive API documentation

**API Endpoints:**

- `GET/POST /users` - User management
- `GET/POST/PUT /games` - Game CRUD operations
- `POST /games/:id/roll` - Dice rolling
- `POST /games/:id/players` - Player management

**Setup:**

```bash
cd nodots-backgammon-api
npm install
npm run start:dev
```

### [nodots-backgammon-client](nodots-backgammon-client/)

Modern React-based web client for playing backgammon.

**Key Features:**

- Beautiful, responsive UI
- Real-time game updates
- Multi-language support
- Authentication integration
- Activity tracking

## 🚀 Quick Start

### For Developers

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nodots/nodots-backgammon.git
   cd nodots-backgammon
   ```

2. **Install dependencies for all packages:**

   ```bash
   # Install core dependencies
   cd nodots-backgammon-core && npm install
   cd ../nodots-backgammon-types && npm install
   cd ../nodots-backgammon-ai && npm install
   cd ../nodots-backgammon-api && npm install
   cd ../nodots-backgammon-client && npm install
   ```

3. **Start the API server:**

   ```bash
   cd nodots-backgammon-api
   npm run start:dev
   ```

4. **Start the client:**
   ```bash
   cd nodots-backgammon-client
   npm start
   ```

### For Package Users

If you're building with the packages:

```bash
# Install the packages you need
npm install @nodots-llc/backgammon-core
npm install @nodots-llc/backgammon-types
npm install @nodots-llc/backgammon-ai
```

## 🏗️ Architecture

```
           ┌────────────────────┐      ┌────────────────────┐
           │   Client App       │      │    API Server      │
           │     (React)        │      │    (Express)       │
           └─────────┬──────────┘      └─────────┬──────────┘
                     │                           │
                     └────────────┬──────────────┘
                                  │
                    ┌───────────────────────────────┐
                    │        Core Packages          │
                    │  ┌────────┬────────┬────────┐ │
                    │  │  Core  │ Types  │   AI   │ │
                    │  │(Game   │(TS     │ (GNU   │ │
                    │  │Logic)  │Types)  │Backgam.)│ │
                    │  └────────┴────────┴────────┘ │
                    └───────────────────────────────┘
```

## 🤖 Robot Automation (v3.7.0+)

The robot automation system provides fully functional AI opponents:

**Features:**
- **Functional Programming Architecture** - Uses discriminated unions and pure functions
- **Three Difficulty Levels** - Beginner, Intermediate, Advanced
- **Complete Turn Automation** - Handles rolling, moving, and turn completion
- **Real Piece Movement** - Actually moves checkers on the board (fixed in v3.7.0)

**Usage:**
```typescript
import { Robot } from '@nodots-llc/backgammon-core'

// Execute complete robot turn
const result = await Robot.makeOptimalMove(game, 'intermediate')

if (result.success) {
  // Robot successfully completed turn and moved pieces
  const updatedGame = result.game
} else {
  console.error('Robot turn failed:', result.error)
}
```

**E2E Testing:**
```bash
# Test robot automation end-to-end
cd packages/api
NODE_ENV=test node test-robot-automation-e2e.js
```

## 🧪 Testing

Each package includes comprehensive test suites:

```bash
# Run tests for a specific package
cd nodots-backgammon-core && npm test
cd nodots-backgammon-ai && npm test
cd nodots-backgammon-api && npm test
cd nodots-backgammon-client && npm test
```

## 📚 Documentation

- **API Documentation**: [API Reference](nodots-backgammon-api/README.api.md)
- **Core Library**: [Core Documentation](nodots-backgammon-core/README.md)
- **Type Definitions**: [Types Documentation](nodots-backgammon-types/README.md)
- **AI Engine**: [AI Documentation](nodots-backgammon-ai/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ken Riley** <kenr@nodots.com>

## 🔗 Links

- **Website**: [https://nodots.com](https://nodots.com)
- **GitHub**: [https://github.com/nodots/nodots-backgammon](https://github.com/nodots/nodots-backgammon)
- **NPM Packages**:
  - [@nodots-llc/backgammon-core](https://www.npmjs.com/package/@nodots-llc/backgammon-core)
  - [@nodots-llc/backgammon-types](https://www.npmjs.com/package/@nodots-llc/backgammon-types)
  - [@nodots-llc/backgammon-ai](https://www.npmjs.com/package/@nodots-llc/backgammon-ai)
