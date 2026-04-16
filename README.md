# InterviewAI — Backend

> Node.js + Express backend for the InterviewAI multilingual AI mock interview platform.  
> Auth via Clerk · Database via MongoDB · Real-time via Socket.io · AI via Groq (free)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Auth | Clerk (JWT verification + webhooks) |
| Database | MongoDB (Mongoose ODM) |
| Cache | Redis (Upstash free tier) |
| Real-time | Socket.io |
| AI / LLM | Groq API — Llama 3 (free) |
| Job Queue | Bull + Redis |
| Validation | Joi |
| Logging | Winston + Morgan |

---

## Project Structure

```
interviewai-backend/
├── server.js                     # Entry point — HTTP server + Socket.io init
├── app.js                        # Express app — middleware + routes
├── .env.example                  # Environment variable template
├── package.json
│
├── scripts/
│   ├── seed.js                   # Seed initial admin user
│   └── seedQuestions.js          # Seed question bank with sample questions
│
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── clerk.js              # Clerk middleware setup
│   │   ├── redis.js              # Redis (Upstash) connection
│   │   └── index.js              # Centralised env config export
│   │
│   ├── controllers/
│   │   ├── webhook.controller.js # Clerk webhook → auto-create User in DB
│   │   ├── user.controller.js    # Get profile, update, stats
│   │   ├── session.controller.js # Create/manage interview sessions
│   │   ├── question.controller.js# Fetch questions by domain/difficulty
│   │   └── evaluation.controller.js # Trigger AI evaluation, get report
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js    # Clerk JWT verify → attach req.user
│   │   ├── error.middleware.js   # Global error handler
│   │   ├── validate.middleware.js# Joi schema validation
│   │   └── rateLimit.middleware.js# express-rate-limit configs
│   │
│   ├── models/
│   │   ├── User.model.js         # clerkId, email, role, plan, streak
│   │   ├── Session.model.js      # domain, language, transcript[], status
│   │   ├── Question.model.js     # domain, difficulty, question, tags
│   │   ├── Report.model.js       # scores, feedback, strengths, improvements
│   │   └── Organization.model.js # B2B company, plan, credits, members
│   │
│   ├── routes/
│   │   ├── index.js              # Mount all routes under /api/v1
│   │   ├── webhook.routes.js     # POST /webhooks/clerk
│   │   ├── user.routes.js        # GET/PUT /users/me
│   │   ├── session.routes.js     # CRUD /sessions
│   │   ├── question.routes.js    # GET /questions
│   │   └── evaluation.routes.js  # POST /evaluation/:sessionId
│   │
│   ├── services/
│   │   ├── ai.service.js         # Groq LLM — interviewer response generation
│   │   ├── evaluation.service.js # Groq LLM — structured evaluation + JSON scores
│   │   ├── question.service.js   # Question bank business logic
│   │   └── clerk.service.js      # Clerk user management helpers
│   │
│   ├── sockets/
│   │   ├── index.js              # Socket.io server init
│   │   └── interview.socket.js   # Real-time interview events (join, message, AI response)
│   │
│   ├── jobs/
│   │   ├── queue.js              # Bull queue setup
│   │   ├── evaluation.job.js     # Async evaluation processing
│   │   └── report.job.js         # Report generation job
│   │
│   └── utils/
│       ├── response.js           # sendSuccess / sendError helpers
│       ├── constants.js          # DOMAINS, LANGUAGES, STATUS enums
│       ├── logger.js             # Winston logger
│       └── validators.js         # Joi schemas
│
└── tests/                        # Jest test files
```

---

## API Reference

### Webhooks
| Method | Endpoint 
|---|---|---|
| POST | `/api/v1/webhooks/clerk` | Clerk webhook — auto-sync user to MongoDB |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | ✅ | Get current user profile |
| PUT | `/api/v1/users/me` | ✅ | Update profile (language, domain) |
| GET | `/api/v1/users/me/stats` | ✅ | Get interview count, streak, plan |

### Sessions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/sessions` | ✅ | Create a new interview session |
| GET | `/api/v1/sessions` | ✅ | Get all sessions for current user |
| GET | `/api/v1/sessions/:id` | ✅ | Get a single session with transcript |
| POST | `/api/v1/sessions/:id/turn` | ✅ | Append a conversation turn to transcript |
| PATCH | `/api/v1/sessions/:id/complete` | ✅ | Mark session as completed |

### Questions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/questions?domain=sde&difficulty=medium` | ✅ | Fetch random questions by filter |
| POST | `/api/v1/questions` | ✅ Admin | Create a new question |

### Evaluation
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/evaluation/:sessionId` | ✅ | Generate AI evaluation report for a session |
| GET | `/api/v1/evaluation/report/:reportId` | ✅ | Fetch an evaluation report |

### Socket Events
| Event (Client → Server) | Payload | Description |
|---|---|---|
| `join_session` | `{ sessionId }` | Join a session room |
| `user_message` | `{ sessionId, message, domain, language, history }` | Send candidate message, get AI response |

| Event (Server → Client) | Payload | Description |
|---|---|---|
| `session_joined` | `{ sessionId }` | Confirmed join |
| `ai_response` | `{ text, sessionId }` | AI interviewer reply |
| `error` | `{ message }` | Error event |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Clerk account (free) — [clerk.com](https://clerk.com)
- Groq API key (free) — [console.groq.com](https://console.groq.com)
- Upstash Redis (free) — [upstash.com](https://upstash.com)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/interviewai-backend.git
cd interviewai-backend
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```
Fill in your `.env` file:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/interviewai

REDIS_URL=redis://default:<pass>@<host>.upstash.io:6379

CLERK_SECRET_KEY=sk_test_xxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_WEBHOOK_SECRET=whsec_xxxx

GROQ_API_KEY=gsk_xxxx

ML_SERVICE_URL=http://localhost:8000
```

### 3. Setup Clerk Webhook
1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-domain.com/api/v1/webhooks/clerk`
3. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** → paste as `CLERK_WEBHOOK_SECRET` in `.env`

### 4. Seed the Database
```bash
npm run seed:questions
```

### 5. Run Development Server
```bash
npm run dev
```
Server starts at `http://localhost:5000`

### 6. Health Check
```bash
curl http://localhost:5000/health
# { "status": "ok", "timestamp": "..." }
```

---

## Authentication Flow

```
1. User signs up / logs in via Clerk (handled on frontend)
2. Clerk issues a JWT token
3. Frontend stores token and sends it in every request:
   Authorization: Bearer <clerk_jwt_token>
4. Backend auth.middleware.js verifies token with Clerk
5. Middleware fetches User from MongoDB and attaches to req.user
6. Controller runs with req.user available
```

When a user signs up for the first time, Clerk fires a `user.created` webhook to `/api/v1/webhooks/clerk` which automatically creates their MongoDB document. You never need to manually create users.

---

## Data Models

### User
```js
{
  clerkId, email, firstName, lastName, profileImage,
  role: "candidate" | "hr" | "admin",
  preferredLanguage: "en" | "hi" | "ta" | "te" ...,
  domain: "sde" | "data_analyst" | "hr" | "marketing" | "finance" | "product",
  streak, lastActive, organization, plan, interviewsUsed, interviewsLimit
}
```

### Session
```js
{
  userId, clerkId, domain, language,
  status: "active" | "completed" | "abandoned",
  mode: "text" | "voice" | "live",
  transcript: [{ speaker, text, language, audioUrl, timestamp }],
  reportId, duration, startedAt, completedAt
}
```

### Report
```js
{
  sessionId, userId,
  scores: { communication, technicalAccuracy, confidence, clarity, overall },
  feedback, strengths[], improvements[],
  fillerWords: { count, words[] }, language
}
```

---

## 4–5 Day Web Build Plan

### Day 1 — Foundation
- [ ] Initialize repo, install all dependencies
- [ ] Setup MongoDB Atlas + connect
- [ ] Setup Clerk + webhook endpoint
- [ ] Test: sign up → user auto-created in MongoDB

### Day 2 — Core APIs
- [ ] User routes: GET /me, PUT /me, GET /me/stats
- [ ] Session routes: create, list, get, add turn, complete
- [ ] Question routes: fetch by domain/difficulty + seed DB
- [ ] Test all routes in Postman

### Day 3 — AI Integration
- [ ] AI service with Groq — domain-aware interviewer prompts
- [ ] Socket.io interview flow — join_session, user_message, ai_response
- [ ] Evaluation service — structured JSON scoring via Groq
- [ ] Evaluation route + Report model

### Day 4 — Polish & Reliability
- [ ] Rate limiting on all routes
- [ ] Global error handler
- [ ] Input validation with Joi
- [ ] Environment config cleanup
- [ ] Deploy to Render.com

### Day 5 — Integration with Frontend
- [ ] Test with React frontend (Clerk frontend SDK)
- [ ] Fix CORS issues
- [ ] End-to-end test: signup → session → AI interview → evaluation report
- [ ] Write basic Jest tests for controllers

---

## Deployment (Render.com — Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Add all environment variables from `.env`
7. Deploy

> Note: Render free tier sleeps after 15 min inactivity. Use Railway.app ($5/month) for always-on.

---

## Supported Languages

| Code | Language |
|---|---|
| `en` | English |
| `hi` | Hindi |
| `ta` | Tamil |
| `te` | Telugu |
| `bn` | Bengali |
| `mr` | Marathi |
| `gu` | Gujarati |
| `kn` | Kannada |
| `ml` | Malayalam |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add voice session support"`
4. Push and open a PR

---

## License

MIT © InterviewAI Team
