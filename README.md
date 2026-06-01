# Local AI Platform

A sophisticated, beautiful, and secure local AI platform inspired by OpenCoder. Run AI models locally with an intuitive UI, supporting multiple backends (Ollama, LM Studio) with optimized performance for low VRAM systems.

![Local AI Platform](./docs/screenshot.png)

## ✨ Features

### 🚀 Multi-Backend Support
- **Ollama** integration (port 11434)
- **LM Studio** integration (port 1234)
- Automatic model discovery from both backends
- Seamless switching between models

### 🎯 Smart Modes
Optimized for different use cases and hardware:
- ⚡ **Fast Mode**: Quick responses, lower VRAM usage
- 🧠 **Thinking Mode**: Deep reasoning, chain-of-thought
- 🎨 **Creative Mode**: Creative writing, storytelling
- 🎯 **Precise Mode**: Factual answers, code generation
- 💚 **Low VRAM Mode**: Optimized for systems with <4GB VRAM

### 📁 File Upload & Analysis
- Drag & drop file upload
- Support for images (PNG, JPG, GIF, WebP)
- Document support (TXT, PDF, MD, PY, JS, JSON)
- Multimodal AI conversations with images

### 🖼️ Image Generation
- Generate images using local stable-diffusion models
- Integrated image generation panel
- Prompt-based image creation

### 🎨 Beautiful UI
- Modern, clean interface inspired by OpenCoder
- Dark/Light mode toggle
- Responsive design
- Smooth animations and transitions
- Real-time streaming responses
- Markdown rendering with syntax highlighting

### 🔒 Security & Privacy
- 100% local processing - no data leaves your machine
- No API keys required
- No cloud dependencies
- Secure file handling with size limits

### ⚡ Performance Optimizations
- Intelligent model loading
- Context window management for low VRAM
- Streaming responses for better UX
- Efficient memory management

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** for backend
- **Node.js 18+** for frontend
- **Ollama** or **LM Studio** installed with models

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/local-ai-platform.git
cd local-ai-platform

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install

# Start Ollama or LM Studio with your models
ollama serve  # or start LM Studio server

# Run the platform
./start.sh  # or manually:
# Terminal 1: cd backend && python main.py
# Terminal 2: cd frontend && npm run dev
```

### Using Docker (Coming Soon)

```bash
docker-compose up
```

## 📖 Usage

### 1. Select a Model
- Open the sidebar (☰ menu)
- Choose from discovered models in the dropdown
- Models are auto-detected from Ollama/LM Studio

### 2. Choose a Mode
Select the appropriate mode for your task:
- **Fast**: Quick questions, simple tasks
- **Thinking**: Complex reasoning, math, logic
- **Creative**: Writing, brainstorming, stories
- **Precise**: Code, facts, technical answers
- **Low VRAM**: For systems with limited graphics memory

### 3. Chat
- Type your message in the input box
- Press Enter to send (Shift+Enter for new line)
- Watch responses stream in real-time

### 4. Upload Files
- Click the paperclip icon
- Or drag & drop files directly into the chat
- Supported: Images, text files, code files, PDFs

### 5. Generate Images
- Click the image icon in the top bar
- Enter your prompt
- Click "Generate"

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React + Vite)       │
│  ┌─────────────────────────────────┐    │
│  │   Chat Interface Component      │    │
│  │   - Real-time streaming         │    │
│  │   - Markdown rendering          │    │
│  │   - File upload                 │    │
│  └─────────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼───────────────────────┐
│         Backend (Python + aiohttp)      │
│  ┌─────────────────────────────────┐    │
│  │   Chat Engine                   │    │
│  │   - Model Manager               │    │
│  │   - File Processor              │    │
│  │   - Stream Handler              │    │
│  └─────────────────────────────────┘    │
└─────────────────┬───────────────────────┘
                  │ API
┌─────────────────▼───────────────────────┐
│     AI Backends (Ollama / LM Studio)    │
│  - Model inference                       │
│  - Image generation                      │
└─────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE` | `http://localhost:11434` | Ollama API endpoint |
| `LMSTUDIO_BASE` | `http://localhost:1234` | LM Studio API endpoint |

### Mode Configuration

Modes are configured in `backend/main.py`:

```python
MODES = {
    "fast": {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 512,
    },
    # ... more modes
}
```

## 🛡️ Security Features

- **File Size Limits**: Maximum 50MB per file
- **Extension Whitelist**: Only safe file types allowed
- **Local Processing**: No data sent to external servers
- **Input Validation**: All inputs sanitized
- **CORS Protection**: Configured for localhost only

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [OpenCoder](https://github.com/opencode-ai/opencode)
- Built with [Ollama](https://ollama.ai/)
- Powered by [LM Studio](https://lmstudio.ai/)
- UI components from [Lucide Icons](https://lucide.dev/)

## 📞 Support

- Open an issue for bugs or feature requests
- Join our community discussions

---

Made with ❤️ for the local AI community
