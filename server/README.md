# Prismatic AI Backend

Express.js backend server that acts as a proxy for the Claude API to avoid CORS issues.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Add your Claude API key to `.env`:
```
CLAUDE_API_KEY=sk-ant-your-actual-claude-api-key-here
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/claude` - Basic Claude API proxy
- `POST /api/claude/analyze` - Claude analysis of multiple AI responses
- `POST /api/claude/synthesize` - Claude synthesis of multiple responses
- `POST /api/claude/complete-analysis` - Complete workflow with Claude response + analysis

## Frontend Integration

Update your frontend's proxy service to call these endpoints instead of directly calling the Claude API.

## Deployment

This backend can be deployed to:
- Netlify Functions (recommended for static sites)
- Vercel Functions
- Railway
- Heroku
- Any Node.js hosting service

Make sure to set the `CLAUDE_API_KEY` environment variable in your deployment platform.