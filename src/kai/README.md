# Kai - Financial Intelligence Agent

A financial intelligence assistant built around Gemini Live research patterns, voice/video interaction, and multi-agent analysis.

## Features

- **Real-time Voice/Video AI**: Powered by Gemini 2.0 Flash Live API
- **Multi-Agent Architecture**: Three specialized AI agents (Fundamental, Sentiment, Valuation)
- **User Personas**: Tailored responses for Everyday Investors, Active Traders, and Professional Advisors
- **Live Market Data**: Google Search integration for real-time market information
- **Decision Cards**: Visual financial recommendations with confidence scores
- **Audio-Reactive Avatar**: 3D animated avatar that responds to voice input

## Tech Stack

- **AI**: Gemini 2.0 Flash Live API (`@google/genai`)
- **Audio**: Web Audio API (16kHz input, 24kHz output PCM)
- **Video**: MediaStream API for camera capture
- **UI**: React + TypeScript + Tailwind CSS
- **Animations**: CSS animations with audio-reactive visualization

## Project Structure

```
src/kai/
├── components/
│   ├── ControlPanel.tsx      # Connection controls UI
│   ├── DecisionCard.tsx      # Financial decision card display
│   ├── KaiAvatar.tsx         # 3D animated avatar
│   └── OnboardingScreen.tsx  # Persona selection screen
├── services/
│   └── geminiService.ts      # Gemini 2.0 Flash Live API integration
├── utils/
│   └── audioUtils.ts         # PCM audio processing utilities
├── pages/
│   └── index.tsx             # Route entry point
├── types.ts                   # Type definitions
├── App.tsx                    # Main application component
└── README.md                  # This file
```

## Configuration

Kai Live no longer accepts browser-visible Gemini keys.
The route now requires a secure server-brokered transport, which is still being completed.

## Usage

Navigate to `/kai` in your browser to access the Financial Intelligence Agent.

### User Flow

1. **Identity Calibration**: Select your investor persona
   - Everyday Investor: Long-term focused, plain English
   - Active Trader: High-frequency updates, technical signals
   - Professional Advisor: Deep research, compliance-ready

2. **Initiate Connection**: Click "INITIATE KAI" to start voice/video session

3. **Interact**: Speak naturally about stocks, markets, or financial topics

4. **Decision Cards**: Receive visual recommendations with:
   - Buy/Hold/Sell recommendation
   - Confidence score
   - Multi-agent insights
   - Evidence and sources

## API Integration

### Gemini 2.0 Flash Live API

The product design remains centered on Gemini's multimodal live API for real-time voice and video interaction:

```typescript
const session = await client.live.connect({
  model: 'gemini-2.0-flash-exp',
  config: {
    responseModalities: ['AUDIO'],
    systemInstruction: systemPrompt,
    tools: [displayDecisionCardTool, googleSearchTool]
  }
});
```

### Function Calling

The AI can trigger visual decision cards through function calling:

```typescript
const displayDecisionCardDeclaration = {
  name: 'displayDecisionCard',
  description: 'Display a financial decision card',
  parameters: {
    type: 'object',
    properties: {
      recommendation: { type: 'string' },
      confidence: { type: 'number' },
      // ... more fields
    }
  }
};
```

## Audio Processing

- **Input**: 16kHz mono PCM audio captured from microphone
- **Output**: 24kHz PCM audio played through speakers
- **Format**: Base64 encoded for transmission

## Development

```bash
# Start development server
npm run dev

# Access the Kai module
open http://localhost:5173/kai
```

## Security Considerations

- Browser-visible Gemini keys were removed from this repo baseline
- Camera and microphone access still require user permission
- Kai Live stays unavailable until the secure server-side transport is in place

## License

Part of the Hushh Technologies platform.
