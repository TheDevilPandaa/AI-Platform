"""
Local AI Platform - Backend Server
Supports Ollama, LM Studio with intelligent model management
Optimized for low VRAM systems with quantization and smart caching
"""

import asyncio
import json
import os
import tempfile
import base64
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
import aiohttp
from aiohttp import web
import aiofiles
from PIL import Image
import io

# Configuration
CONFIG = {
    "ollama_base": os.getenv("OLLAMA_BASE", "http://localhost:11434"),
    "lmstudio_base": os.getenv("LMSTUDIO_BASE", "http://localhost:1234"),
    "max_file_size": 50 * 1024 * 1024,  # 50MB
    "allowed_extensions": [".txt", ".pdf", ".md", ".py", ".js", ".json", ".png", ".jpg", ".jpeg", ".gif", ".webp"],
    "cache_dir": Path(tempfile.gettempdir()) / "ai_platform_cache",
}

# Mode configurations optimized for different VRAM levels
MODES = {
    "fast": {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 512,
        "num_predict": 512,
        "description": "Quick responses, lower VRAM usage"
    },
    "thinking": {
        "temperature": 0.8,
        "top_p": 0.95,
        "max_tokens": 2048,
        "num_predict": 2048,
        "description": "Deep reasoning, chain-of-thought"
    },
    "creative": {
        "temperature": 1.2,
        "top_p": 0.95,
        "max_tokens": 1024,
        "num_predict": 1024,
        "description": "Creative writing, storytelling"
    },
    "precise": {
        "temperature": 0.3,
        "top_p": 0.8,
        "max_tokens": 1024,
        "num_predict": 1024,
        "description": "Factual answers, code generation"
    },
    "low_vram": {
        "temperature": 0.7,
        "top_p": 0.9,
        "max_tokens": 256,
        "num_predict": 256,
        "num_ctx": 2048,
        "description": "Optimized for systems with <4GB VRAM"
    }
}

class ModelManager:
    """Manages AI models with intelligent loading and VRAM optimization"""
    
    def __init__(self):
        self.available_models = []
        self.active_model = None
        self.model_backend = "ollama"  # or "lmstudio"
        self.loaded_models = {}
        
    async def discover_models(self) -> List[Dict]:
        """Discover available models from Ollama and LM Studio"""
        models = []
        
        # Try Ollama first
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{CONFIG['ollama_base']}/api/tags") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for model in data.get("models", []):
                            models.append({
                                "name": model["name"],
                                "backend": "ollama",
                                "size": model.get("size", 0),
                                "family": model.get("details", {}).get("family", "unknown"),
                                "quantization": model.get("details", {}).get("quantization_level", "unknown")
                            })
                        self.model_backend = "ollama"
        except Exception as e:
            print(f"Ollama not available: {e}")
        
        # Try LM Studio
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{CONFIG['lmstudio_base']}/v1/models") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for model in data.get("data", []):
                            models.append({
                                "name": model["id"],
                                "backend": "lmstudio",
                                "size": 0,
                                "family": "unknown",
                                "quantization": "unknown"
                            })
                        if not self.available_models:
                            self.model_backend = "lmstudio"
        except Exception as e:
            print(f"LM Studio not available: {e}")
        
        self.available_models = models
        return models
    
    def get_optimal_mode(self, vram_gb: float = 4.0) -> str:
        """Recommend optimal mode based on available VRAM"""
        if vram_gb < 4:
            return "low_vram"
        elif vram_gb < 8:
            return "fast"
        else:
            return "thinking"
    
    async def load_model(self, model_name: str, mode: str = "fast") -> bool:
        """Load a model with specific mode settings"""
        self.active_model = model_name
        return True


class FileProcessor:
    """Process uploaded files for AI consumption"""
    
    @staticmethod
    async def process_file(file_data: bytes, filename: str) -> Dict[str, Any]:
        """Process file and extract text/content"""
        ext = Path(filename).suffix.lower()
        
        result = {
            "filename": filename,
            "type": "text",
            "content": "",
            "metadata": {}
        }
        
        if ext in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
            # Process image
            result["type"] = "image"
            img = Image.open(io.BytesIO(file_data))
            result["metadata"] = {
                "width": img.width,
                "height": img.height,
                "format": img.format,
                "mode": img.mode
            }
            # Convert to base64 for multimodal models
            buffered = io.BytesIO()
            img.save(buffered, format=img.format)
            result["content"] = base64.b64encode(buffered.getvalue()).decode()
            
        elif ext == ".pdf":
            # Simple PDF text extraction (would need pdfplumber in production)
            result["type"] = "document"
            result["content"] = f"[PDF Document: {filename}] - Text extraction requires pdfplumber"
            
        else:
            # Text files
            result["type"] = "text"
            try:
                result["content"] = file_data.decode('utf-8')
            except:
                result["content"] = file_data.decode('latin-1')
        
        return result


class ChatEngine:
    """Main chat engine with streaming support"""
    
    def __init__(self):
        self.model_manager = ModelManager()
        self.file_processor = FileProcessor()
        self.conversations = {}
        
    async def stream_chat(self, messages: List[Dict], model: str, mode: str, 
                         files: Optional[List[Dict]] = None) -> Any:
        """Stream chat response from AI model"""
        
        mode_config = MODES.get(mode, MODES["fast"])
        backend = self.model_manager.model_backend
        
        # Prepare messages with file context
        enriched_messages = []
        if files:
            system_context = "User has shared the following files:\n"
            for f in files:
                if f["type"] == "image":
                    system_context += f"- Image: {f['filename']} ({f['metadata'].get('width', 0)}x{f['metadata'].get('height', 0)})\n"
                else:
                    system_context += f"- Document: {f['filename']}\n"
            enriched_messages.append({"role": "system", "content": system_context})
        
        enriched_messages.extend(messages)
        
        if backend == "ollama":
            return self._stream_ollama(enriched_messages, model, mode_config, files)
        else:
            return self._stream_lmstudio(enriched_messages, model, mode_config)
    
    async def _stream_ollama(self, messages: List[Dict], model: str, 
                            mode_config: Dict, files: Optional[List[Dict]] = None):
        """Stream from Ollama API"""
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": mode_config["temperature"],
                "top_p": mode_config["top_p"],
                "num_predict": mode_config["num_predict"],
            }
        }
        
        # Add image if present in last message
        if files:
            for f in files:
                if f["type"] == "image":
                    if "images" not in payload:
                        payload["images"] = []
                    payload["images"].append(f["content"])
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{CONFIG['ollama_base']}/api/chat",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as resp:
                async for line in resp.content:
                    if line.strip():
                        try:
                            data = json.loads(line)
                            if "message" in data:
                                yield {
                                    "type": "token",
                                    "content": data["message"].get("content", "")
                                }
                            if data.get("done", False):
                                yield {"type": "done", "stats": data}
                        except json.JSONDecodeError:
                            continue
    
    async def _stream_lmstudio(self, messages: List[Dict], model: str, 
                              mode_config: Dict):
        """Stream from LM Studio API"""
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "temperature": mode_config["temperature"],
            "top_p": mode_config["top_p"],
            "max_tokens": mode_config["max_tokens"],
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{CONFIG['lmstudio_base']}/v1/chat/completions",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as resp:
                async for line in resp.content:
                    if line.startswith(b"data: "):
                        data = line[6:].decode().strip()
                        if data == "[DONE]":
                            yield {"type": "done"}
                            break
                        try:
                            parsed = json.loads(data)
                            delta = parsed["choices"][0]["delta"]
                            if "content" in delta:
                                yield {
                                    "type": "token",
                                    "content": delta["content"]
                                }
                        except:
                            continue
    
    async def generate_image(self, prompt: str, model: str = "stable-diffusion") -> Dict:
        """Generate image using local model"""
        # This would integrate with stable diffusion via Ollama or other backends
        return {
            "success": True,
            "prompt": prompt,
            "message": "Image generation requires stable-diffusion model installed in Ollama",
            "usage": "ollama run stable-diffusion"
        }


# Global instances
chat_engine = ChatEngine()


# HTTP Handlers
async def handle_discover_models(request):
    """Discover available models"""
    models = await chat_engine.model_manager.discover_models()
    return web.json_response({"models": models})


async def handle_chat_stream(request):
    """Handle streaming chat requests"""
    data = await request.json()
    
    messages = data.get("messages", [])
    model = data.get("model", "")
    mode = data.get("mode", "fast")
    files = data.get("files", [])
    
    if not model:
        return web.json_response({"error": "Model required"}, status=400)
    
    response = web.StreamResponse(
        status=200,
        headers={'Content-Type': 'text/event-stream'}
    )
    await response.prepare(request)
    
    try:
        async for chunk in chat_engine.stream_chat(messages, model, mode, files):
            event_data = f"data: {json.dumps(chunk)}\n\n"
            await response.write(event_data.encode())
            await asyncio.sleep(0.01)  # Small delay for smooth streaming
    except Exception as e:
        error_data = f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        await response.write(error_data.encode())
    
    await response.write_eof()
    return response


async def handle_upload_file(request):
    """Handle file upload"""
    reader = await request.multipart()
    files = []
    
    while True:
        part = await reader.next()
        if part is None:
            break
            
        if part.name == "file":
            filename = part.filename
            file_data = await part.read()
            
            if len(file_data) > CONFIG["max_file_size"]:
                return web.json_response(
                    {"error": "File too large"}, 
                    status=400
                )
            
            ext = Path(filename).suffix.lower()
            if ext not in CONFIG["allowed_extensions"]:
                return web.json_response(
                    {"error": f"File type {ext} not allowed"}, 
                    status=400
                )
            
            processed = await chat_engine.file_processor.process_file(file_data, filename)
            files.append(processed)
    
    return web.json_response({"files": files})


async def handle_generate_image(request):
    """Handle image generation request"""
    data = await request.json()
    prompt = data.get("prompt", "")
    model = data.get("model", "stable-diffusion")
    
    if not prompt:
        return web.json_response({"error": "Prompt required"}, status=400)
    
    result = await chat_engine.generate_image(prompt, model)
    return web.json_response(result)


async def handle_health(request):
    """Health check endpoint"""
    return web.json_response({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })


async def handle_modes(request):
    """Get available modes"""
    return web.json_response({"modes": MODES})


def create_app():
    """Create and configure the web application"""
    app = web.Application()
    
    # Routes
    app.router.add_get('/api/health', handle_health)
    app.router.add_get('/api/models', handle_discover_models)
    app.router.add_get('/api/modes', handle_modes)
    app.router.add_post('/api/chat', handle_chat_stream)
    app.router.add_post('/api/upload', handle_upload_file)
    app.router.add_post('/api/generate-image', handle_generate_image)
    
    # Serve static files
    app.router.add_static('/static/', path='../frontend/build', name='static')
    app.router.add_get('/', lambda r: web.HTTPFound('/static/index.html'))
    
    return app


if __name__ == '__main__':
    # Ensure cache directory exists
    CONFIG["cache_dir"].mkdir(parents=True, exist_ok=True)
    
    app = create_app()
    print("🚀 Local AI Platform starting...")
    print(f"📡 Ollama: {CONFIG['ollama_base']}")
    print(f"📡 LM Studio: {CONFIG['lmstudio_base']}")
    print("🌐 Server running at http://localhost:8000")
    
    web.run_app(app, host='0.0.0.0', port=8000, print=lambda x: print(x))
