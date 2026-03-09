# Badminton Scheduler — Backend API

Express.js + MongoDB backend for the badminton match scheduler.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/badminton?retryWrites=true&w=majority
   PORT=5000
   ```

3. Start the server:
   ```bash
   npm run dev   # development (with nodemon)
   npm start     # production
   ```

## API Endpoints

### Players
| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /api/players      | List active players  |
| POST   | /api/players      | Add player `{name}`  |
| DELETE | /api/players/:id  | Deactivate player    |

### Sessions
| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | /api/sessions               | List all sessions              |
| GET    | /api/sessions/:id           | Get session detail             |
| POST   | /api/sessions               | Create session `{players, rounds, totalRounds}` |
| POST   | /api/sessions/:id/result    | Set match winner `{roundNumber, matchIndex, winner}` |

### Statistics
| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | /api/stats/players          | Per-player win/loss stats      |
| GET    | /api/stats/duos             | Per-duo win/loss stats         |
| GET    | /api/stats/players/trend    | Per-session win rate trend     |

## MongoDB Models

### Player
- `name` (String, unique, required)
- `active` (Boolean, default: true)
- `createdAt` (Date)

### MatchSession
- `players` [String]
- `rounds` [{ roundNumber, matches: [{ teamA, teamB, winner }], sittingOut }]
- `totalRounds` (Number)
- `createdAt`, `completedAt` (Date)
