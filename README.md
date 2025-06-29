# Prismatic AI

Multi-AI query platform that orchestrates Claude, Grok, and Gemini to provide comprehensive, synthesized responses with advanced analytics.

## Features

- **Multi-AI Integration**: Query Claude, Grok, and Gemini simultaneously
- **AI Response Synthesis**: Intelligent combination of responses using Claude
- **Advanced Analytics**: Sentiment analysis, keyword extraction, confidence scoring
- **Real-time Processing**: Progressive loading with visual feedback
- **Production Ready**: Netlify Functions for secure API proxy

## Quick Start

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and add your API keys
4. Start development server: `npm run dev`

### API Keys Setup

Create a `.env` file with your API keys:

```env
# Copy from .env.example and add your actual keys
VITE_CLAUDE_API_KEY=sk-ant-api-your-key-here
VITE_GROK_API_KEY=xai-your-key-here
VITE_GEMINI_API_KEY=AIza-your-key-here
VITE_GROQ_API_KEY=gsk_your-groq-key-here
```

## Deployment to Netlify

### 1. Build Setup

The project includes a `netlify.toml` configuration file that handles:
- Build commands and output directory
- Netlify Functions configuration
- SPA routing redirects
- CORS headers

### 2. Environment Variables

In your Netlify dashboard, go to **Site Settings > Environment Variables** and add:

```
CLAUDE_API_KEY=sk-ant-api-your-actual-key-here
```

**Important**: 
- Use `CLAUDE_API_KEY` (not `VITE_CLAUDE_API_KEY`) for the Netlify Function
- Don't expose real API keys in frontend environment variables
- The Netlify Function will securely handle Claude API calls

### 3. Netlify Functions

The project includes two Netlify Functions:
- `claude-proxy`: Handles direct Claude API queries
- `claude-synthesis`: Provides AI response synthesis

These functions automatically solve CORS issues and keep API keys secure.

### 4. Deploy

1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!

## Architecture

### CORS Solution

When deployed to Netlify:
- Frontend calls Netlify Functions (same domain - no CORS)
- Netlify Functions call external APIs (server-to-server - no CORS)
- API keys stored securely in Netlify environment variables

### Local Development

For local development with real APIs:
- Direct API calls (may have CORS issues)
- Fallback to enhanced mock responses
- Toggle between real/mock data via API Status panel

## Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **UI Components**: shadcn/ui, Lucide React icons
- **State Management**: Zustand
- **Charts**: Recharts
- **Deployment**: Netlify with Functions
- **APIs**: Claude, Grok/Groq, Gemini

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Local Testing with Netlify CLI

To test Netlify Functions locally:

```bash
npm install -g netlify-cli
netlify dev
```

This will start the project with Netlify Functions available at `http://localhost:8888/.netlify/functions/`