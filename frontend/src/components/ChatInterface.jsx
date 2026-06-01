import React, { useState } from 'react'
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Settings, 
  Plus, 
  Send, 
  Paperclip,
  X,
  Sparkles,
  Zap,
  Brain,
  Palette,
  Target,
  Cpu,
  Menu,
  Moon,
  Sun
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore } from '../store'

const MODE_ICONS = {
  fast: <Zap className="w-4 h-4" />,
  thinking: <Brain className="w-4 h-4" />,
  creative: <Palette className="w-4 h-4" />,
  precise: <Target className="w-4 h-4" />,
  low_vram: <Cpu className="w-4 h-4" />
}

const MODE_COLORS = {
  fast: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  thinking: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  creative: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  precise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low_vram: 'bg-green-500/20 text-green-400 border-green-500/30'
}

export default function ChatInterface() {
  const [input, setInput] = useState('')
  const [showImageGen, setShowImageGen] = useState(false)
  const [imagePrompt, setImagePrompt] = useState('')
  const [dragActive, setDragActive] = useState(false)
  
  const {
    messages,
    models,
    selectedModel,
    selectedMode,
    modes,
    isStreaming,
    uploadedFiles,
    generatedImages,
    sidebarOpen,
    darkMode,
    fetchModels,
    fetchModes,
    setSelectedModel,
    setSelectedMode,
    sendMessage,
    uploadFiles,
    clearUploadedFiles,
    toggleSidebar,
    generateImage,
    isGeneratingImage
  } = useStore()

  React.useEffect(() => {
    fetchModels()
    fetchModes()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    
    const files = uploadedFiles.length > 0 ? uploadedFiles : []
    await sendMessage(input, files)
    setInput('')
    if (files.length > 0) {
      clearUploadedFiles()
    }
  }

  const handleFileUpload = async (files) => {
    const fileArray = Array.from(files)
    await uploadFiles(fileArray)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleImageGenerate = async () => {
    if (!imagePrompt.trim()) return
    await generateImage(imagePrompt)
    setImagePrompt('')
    setShowImageGen(false)
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-dark-950' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className={`h-full ${darkMode ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'} border-r flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-inherit">
            <div className="flex items-center justify-between mb-4">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Sparkles className="inline w-5 h-5 mr-2 text-primary-500" />
                Local AI
              </h1>
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Mode Selector */}
            <div className="space-y-2">
              <label className={`text-xs font-medium ${darkMode ? 'text-dark-400' : 'text-gray-500'}`}>
                MODE
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(modes).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMode(key)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      selectedMode === key 
                        ? MODE_COLORS[key]
                        : darkMode 
                          ? 'bg-dark-800 border-dark-700 text-dark-400 hover:bg-dark-700'
                          : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {MODE_ICONS[key]}
                      <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="p-4 border-b border-inherit">
            <label className={`text-xs font-medium ${darkMode ? 'text-dark-400' : 'text-gray-500'}`}>
              MODEL
            </label>
            <select
              value={selectedModel || ''}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`mt-2 w-full p-2 rounded-lg border ${
                darkMode 
                  ? 'bg-dark-800 border-dark-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {models.length === 0 ? (
                <option>No models found</option>
              ) : (
                models.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name} ({model.backend})
                  </option>
                ))
              )}
            </select>
            {models.length === 0 && (
              <p className={`mt-2 text-xs ${darkMode ? 'text-dark-500' : 'text-gray-400'}`}>
                Start Ollama or LM Studio to discover models
              </p>
            )}
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="p-4 border-b border-inherit flex-1 overflow-y-auto">
              <label className={`text-xs font-medium ${darkMode ? 'text-dark-400' : 'text-gray-500'}`}>
                ATTACHED FILES
              </label>
              <div className="mt-2 space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-dark-800' : 'bg-gray-100'} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      {file.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-primary-500" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-primary-500" />
                      )}
                      <span className={`text-sm truncate max-w-[150px] ${darkMode ? 'text-dark-300' : 'text-gray-700'}`}>
                        {file.filename}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="p-4 flex-1 overflow-y-auto">
              <label className={`text-xs font-medium ${darkMode ? 'text-dark-400' : 'text-gray-500'}`}>
                GENERATED IMAGES
              </label>
              <div className="mt-2 space-y-2">
                {generatedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg ${darkMode ? 'bg-dark-800' : 'bg-gray-100'}`}
                  >
                    <p className={`text-xs truncate ${darkMode ? 'text-dark-400' : 'text-gray-600'}`}>
                      {img.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className={`h-14 ${darkMode ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-4`}>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-dark-400' : 'text-gray-600'}`}>
                {selectedModel || 'No model selected'}
              </span>
              {selectedMode && (
                <span className={`px-2 py-1 rounded-full text-xs border ${MODE_COLORS[selectedMode]}`}>
                  {selectedMode.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImageGen(!showImageGen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'} ${showImageGen ? 'text-primary-500' : ''}`}
              title="Generate Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Image Generation Panel */}
        {showImageGen && (
          <div className={`p-4 border-b ${darkMode ? 'bg-dark-900 border-dark-800' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className={`flex-1 p-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-dark-800 border-dark-700 text-white placeholder-dark-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleImageGenerate()}
              />
              <button
                onClick={handleImageGenerate}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isGeneratingImage ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Sparkles className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-dark-700' : 'text-gray-300'}`} />
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to Local AI Platform
                </h2>
                <p className={`${darkMode ? 'text-dark-400' : 'text-gray-600'}`}>
                  Select a model from the sidebar and start chatting. All processing happens locally on your machine.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-900' : 'bg-gray-100'}`}>
                    <Zap className={`w-6 h-6 mb-2 ${darkMode ? 'text-yellow-500' : 'text-yellow-600'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-dark-300' : 'text-gray-700'}`}>Fast Mode</p>
                    <p className={`text-xs ${darkMode ? 'text-dark-500' : 'text-gray-500'}`}>Quick responses</p>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-900' : 'bg-gray-100'}`}>
                    <Brain className={`w-6 h-6 mb-2 ${darkMode ? 'text-purple-500' : 'text-purple-600'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-dark-300' : 'text-gray-700'}`}>Thinking Mode</p>
                    <p className={`text-xs ${darkMode ? 'text-dark-500' : 'text-gray-500'}`}>Deep reasoning</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : darkMode
                        ? 'bg-dark-800 text-dark-100'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.files && msg.files.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {msg.files.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-sm opacity-80">
                          {file.type === 'image' ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <Paperclip className="w-4 h-4" />
                          )}
                          <span>{file.filename}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content || 'Thinking...'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 ${darkMode ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'} border-t`}>
          <form
            onSubmit={handleSubmit}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-500/10'
                : darkMode
                  ? 'border-dark-700 bg-dark-800'
                  : 'border-gray-300 bg-gray-50'
            }`}
          >
            {dragActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`text-center ${darkMode ? 'text-dark-300' : 'text-gray-600'}`}>
                  <Paperclip className="w-8 h-8 mx-auto mb-2" />
                  <p>Drop files here</p>
                </div>
              </div>
            )}
            
            <div className="flex items-end p-2">
              <label className={`p-2 cursor-pointer ${darkMode ? 'text-dark-400 hover:text-dark-300' : 'text-gray-500 hover:text-gray-600'}`}>
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  accept=".txt,.pdf,.md,.py,.js,.json,.png,.jpg,.jpeg,.gif,.webp"
                />
              </label>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className={`flex-1 mx-2 p-2 bg-transparent resize-none focus:outline-none ${
                  darkMode ? 'text-white placeholder-dark-500' : 'text-gray-900 placeholder-gray-400'
                }`}
                style={{ maxHeight: '200px', minHeight: '40px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="p-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          
          <p className={`mt-2 text-xs text-center ${darkMode ? 'text-dark-500' : 'text-gray-400'}`}>
            Press Enter to send, Shift+Enter for new line • Drag & drop files to attach
          </p>
        </div>
      </div>
    </div>
  )
}
