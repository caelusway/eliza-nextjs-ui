# BioAgents UI

A customizable Next.js UI for ElizaOS agents. Each BioAgent has its own UI instance (this repo) which can be easily customized to match the agent's branding and functionality.

## 🚀 Features

- **Agent-Specific UI**: Each agent gets its own customizable interface
- **Real-time Communication**: Full Socket.IO integration with ElizaOS messaging system
- **Speech-to-Text**: Built-in voice input with ElevenLabs transcription
- **Easy Customization**: Configure branding, prompts, and behavior via environment variables
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling & Recovery**: Robust connection management with proper error states

## 🎨 Customization Options

All customization is done through environment variables in your `.env` file:

### Agent Branding
```env
NEXT_PUBLIC_AGENT_NAME="Your Agent Name"
NEXT_PUBLIC_AGENT_LOGO="/assets/your-logo.png"
NEXT_PUBLIC_AGENT_BANNER_LOGO="/assets/your-banner.png"
NEXT_PUBLIC_AGENT_SHORT_DESCRIPTION="Brief description of your agent"
```

### Social Links
```env
NEXT_PUBLIC_AGENT_X_USERNAME="your_twitter_handle"
NEXT_PUBLIC_AGENT_DISCORD_SERVER="https://discord.gg/your-server"
```

### Example Prompts
```env
NEXT_PUBLIC_EXAMPLE_PROMPTS="What is gene therapy?,Explain CRISPR technology,How do vaccines work?"
```

### Server Configuration
```env
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_AGENT_ID=your-agent-id-here
NEXT_PUBLIC_WORLD_ID=00000000-0000-0000-0000-000000000000
```

### Optional Features
```env
# Enable speech-to-text with ElevenLabs
ELEVENLABS_API_KEY=sk_...

# Enable debug mode for development
NEXT_PUBLIC_DEBUG=true

# Repository context for agent knowledge
REPO_DIR_NAME=your-repo-name
REPO_URL=https://github.com/your-org/your-repo.git
REPO_BRANCH=main
```

## 🛠️ Quick Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd eliza-nextjs-ui
bun install  # or npm install
```

### 2. Configure Your Agent
Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Edit `.env` with your agent's details:
- Set `NEXT_PUBLIC_AGENT_ID` to your agent's ID
- Customize `NEXT_PUBLIC_AGENT_NAME` and description
- Add your logos to the `public/assets/` folder
- Configure example prompts relevant to your agent

### 3. Start Development Server
```bash
bun run dev  # or npm run dev
```

Visit [http://localhost:4000](http://localhost:4000)

## 🏗️ Architecture

This UI implements the complete ElizaOS messaging flow:

```
[Next.js Client] → [API Proxy] → [ElizaOS Server] → [Message Bus] → [Agent Runtime]
       ↑                                                                    ↓
[Socket.IO UI] ← [ElizaOS Socket.IO] ← [Message Bus] ← [Agent Response] ← [Agent Processing]
```

### Key Features
- **Agent Participation Management**: Automatic agent registration to channels
- **CORS-Friendly Architecture**: API proxy pattern for seamless communication
- **Real-time Updates**: Socket.IO integration for instant message delivery
- **Session Management**: Persistent chat sessions with history

## 📋 Prerequisites

- **Node.js 18+** or **Bun**
- **ElizaOS Server** running on localhost:3000 (or configured URL)
- **Active ElizaOS Agent** with valid agent ID

## 🎯 Agent-Specific Customization

### Branding Your Agent

1. **Add your logos** to `public/assets/`:
   - Agent logo (square format recommended)
   - Banner logo (wide format for header)

2. **Configure agent details** in `.env`:
   ```env
   NEXT_PUBLIC_AGENT_NAME="Dr. BioBot"
   NEXT_PUBLIC_AGENT_SHORT_DESCRIPTION="AI assistant specializing in biotechnology and life sciences research."
   ```

3. **Set relevant example prompts**:
   ```env
   NEXT_PUBLIC_EXAMPLE_PROMPTS="Explain gene editing,What is synthetic biology?,How do mRNA vaccines work?"
   ```

### Custom Styling

The UI uses Tailwind CSS for easy customization. You can:

- Modify colors in `tailwind.config.js`
- Add custom CSS in `src/app/globals.css`
- Update component styles in individual component files

## 🔧 Development Commands

```bash
# Development
bun run dev                    # Start development server
bun run build                  # Build for production
bun start                     # Start production server

# Code Quality
bun run lint                  # Format code with Prettier
bun run format                # Same as lint
bun run format:check          # Check formatting without changes
```

## 🚨 Common Issues & Solutions

### 1. "Agent not responding"
**Cause**: Agent not added to channel or incorrect agent ID
**Solution**: Check `NEXT_PUBLIC_AGENT_ID` in `.env` and ensure ElizaOS server is running

### 2. "CORS errors"
**Cause**: Direct browser-to-ElizaOS requests blocked
**Solution**: All requests automatically proxied via `/api/eliza/*`

### 3. "Speech-to-text not working"
**Cause**: Missing ElevenLabs API key
**Solution**: Add `ELEVENLABS_API_KEY` to your `.env` file

### 4. "Images not loading"
**Cause**: Incorrect logo paths
**Solution**: Ensure logos are in `public/assets/` and paths match `.env` configuration

## 🔍 Debug Mode

Enable debug mode for development:

```env
NEXT_PUBLIC_DEBUG=true
```

Debug mode provides:
- Connection status indicators
- Agent participation status
- Message flow logs in browser console
- Environment variable display

## 🚀 Production Deployment

### Environment Variables for Production

```env
NEXT_PUBLIC_APP_URL=https://your-agent-domain.com
NEXT_PUBLIC_SERVER_URL=https://your-elizaos-server.com
NEXT_PUBLIC_AGENT_ID=your-production-agent-id
NEXT_TELEMETRY_DISABLED=true
NEXT_PUBLIC_NODE_ENV="production"
```

### Deploy to Vercel

1. Push your customized code to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ElizaOS](https://github.com/elizaos/eliza) - The agent framework this integrates with
- [Next.js](https://nextjs.org/) - React framework
- [Socket.IO](https://socket.io/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [ElevenLabs](https://elevenlabs.io/) - Speech-to-text functionality

---

**Built with ❤️ for the BioAgents community**