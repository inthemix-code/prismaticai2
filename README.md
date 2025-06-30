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
VITE_GROQ_API_KEY=gsk_your-key-here
VITE_GEMINI_API_KEY=AIza-your-key-here
```

**Important Notes:**
- Use valid API keys from the respective providers
- For Groq API: Get your key from [Groq Console](https://console.groq.com/)
- For Gemini API: The app now uses `gemini-1.5-flash` and `gemini-1.5-pro` models
- Invalid or placeholder keys will automatically fall back to mock responses

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

### 3. Setting Up Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site Settings**
4. Click on **Environment Variables** in the left sidebar
5. Click **Add a variable**
6. Add:
   - Variable name: `CLAUDE_API_KEY`
   - Value: Your actual Claude API key (starts with `sk-ant-api`)
7. Click **Save**
8. Redeploy your site for changes to take effect

### 4. Netlify Functions

The project includes two Netlify Functions:
- `claude-proxy`: Handles direct Claude API queries
- `claude-synthesis`: Provides AI response synthesis

These functions automatically solve CORS issues and keep API keys secure.

### 5. Deploy

1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables as described above
5. Deploy!

## Troubleshooting

### Common Issues

1. **502 Error from Netlify Functions**
   - Ensure `CLAUDE_API_KEY` is set in Netlify environment variables
   - Check that the API key starts with `sk-ant-api`
   - Redeploy after setting environment variables

2. **401 Error from Groq API**
   - Verify your `VITE_GROQ_API_KEY` in `.env` file
   - Ensure the key starts with `gsk_`
   - Get a new key from [Groq Console](https://console.groq.com/)

3. **404 Error from Gemini API**
   - The app now uses updated model names: `gemini-1.5-flash` and `gemini-1.5-pro`
   - Verify your `VITE_GEMINI_API_KEY` is valid
   - Ensure the key starts with `AIza`

4. **Mock Data Fallbacks**
   - If API keys are invalid or missing, the app automatically uses mock responses
   - This ensures the app remains functional for demonstration purposes
   - Real API responses provide better synthesis quality

### Checking Netlify Function Logs

1. Go to your Netlify dashboard
2. Select your site
3. Click on **Functions** in the top navigation
4. Click on the function name (e.g., `claude-proxy`)
5. View the logs to see detailed error messages

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
- **APIs**: Claude, Groq (for Grok functionality), Gemini

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