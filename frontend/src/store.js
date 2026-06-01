import { create } from 'zustand'

const API_BASE = '/api'

export const useStore = create((set, get) => ({
  // Models
  models: [],
  selectedModel: null,
  
  // Modes
  modes: {},
  selectedMode: 'fast',
  
  // Chat
  messages: [],
  isStreaming: false,
  uploadedFiles: [],
  
  // Image Generation
  isGeneratingImage: false,
  generatedImages: [],
  
  // UI State
  sidebarOpen: true,
  darkMode: true,
  
  // Actions
  fetchModels: async () => {
    try {
      const res = await fetch(`${API_BASE}/models`)
      const data = await res.json()
      set({ models: data.models || [] })
      if (data.models?.length > 0 && !get().selectedModel) {
        set({ selectedModel: data.models[0].name })
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
    }
  },
  
  fetchModes: async () => {
    try {
      const res = await fetch(`${API_BASE}/modes`)
      const data = await res.json()
      set({ modes: data.modes || {} })
    } catch (error) {
      console.error('Failed to fetch modes:', error)
    }
  },
  
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages]
    const lastIdx = messages.length - 1
    if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
      messages[lastIdx] = {
        ...messages[lastIdx],
        content: messages[lastIdx].content + content
      }
    }
    return { messages }
  }),
  
  clearMessages: () => set({ messages: [] }),
  
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  
  uploadFiles: async (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('file', file))
    
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      set((state) => ({ 
        uploadedFiles: [...state.uploadedFiles, ...(data.files || [])] 
      }))
      return data.files
    } catch (error) {
      console.error('Upload failed:', error)
      return []
    }
  },
  
  clearUploadedFiles: () => set({ uploadedFiles: [] }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  
  // Chat with streaming
  sendMessage: async (content, files = []) => {
    const { selectedModel, selectedMode, messages } = get()
    
    if (!selectedModel) {
      alert('Please select a model first')
      return
    }
    
    // Add user message
    set((state) => ({
      messages: [...state.messages, { 
        role: 'user', 
        content,
        files,
        timestamp: new Date().toISOString()
      }]
    }))
    
    // Add placeholder for assistant response
    set((state) => ({
      messages: [...state.messages, { 
        role: 'assistant', 
        content: '',
        timestamp: new Date().toISOString()
      }],
      isStreaming: true
    }))
    
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          model: selectedModel,
          mode: selectedMode,
          files: files.length > 0 ? get().uploadedFiles : []
        })
      })
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'token') {
                get().updateLastMessage(data.content)
              } else if (data.type === 'done') {
                set({ isStreaming: false })
              } else if (data.type === 'error') {
                set({ isStreaming: false })
                console.error('Stream error:', data.message)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      set({ isStreaming: false })
      console.error('Chat error:', error)
    }
  },
  
  // Generate image
  generateImage: async (prompt) => {
    const { selectedModel } = get()
    set({ isGeneratingImage: true })
    
    try {
      const res = await fetch(`${API_BASE}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: selectedModel || 'stable-diffusion'
        })
      })
      const data = await res.json()
      
      if (data.success) {
        set((state) => ({
          generatedImages: [...state.generatedImages, {
            prompt,
            timestamp: new Date().toISOString(),
            ...data
          }]
        }))
      }
      
      return data
    } catch (error) {
      console.error('Image generation failed:', error)
      return { success: false, error: error.message }
    } finally {
      set({ isGeneratingImage: false })
    }
  }
}))
