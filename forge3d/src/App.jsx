import React, { useState, useRef, useCallback, useEffect } from 'react'
import Viewer3D from './components/Viewer3D.jsx'
import TextureLayers from './components/TextureLayers.jsx'
import ModelSelector from './components/ModelSelector.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { generate3D, MODELS } from './lib/api.js'

// ─── Styles ────────────────────────────────────────────────────────────────

const s = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: '#0d0e11',
  },

  // Top bar
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 52,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: '#13151a',
    flexShrink: 0,
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 28,
    height: 28,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f0f0f2',
    letterSpacing: '-0.02em',
  },
  logoAccent: {
    color: '#f97316',
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  topBtn: (active) => ({
    padding: '5px 12px',
    borderRadius: 6,
    border: `1px solid ${active ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(249,115,22,0.1)' : 'transparent',
    color: active ? '#f97316' : '#8b8fa8',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'Space Grotesk, sans-serif',
    transition: 'all 0.15s',
  }),

  // Main layout
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  // Left sidebar: controls
  sidebar: {
    width: 320,
    flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.06)',
    background: '#13151a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  // Viewer center
  viewerArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  viewerPad: {
    flex: 1,
    padding: 12,
  },

  // Right sidebar: texture layers
  rightSidebar: {
    width: 240,
    flexShrink: 0,
    borderLeft: '1px solid rgba(255,255,255,0.06)',
    background: '#13151a',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  // Section labels
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Space Mono, monospace',
    color: '#4a4e62',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Prompt area
  promptWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  modeToggle: {
    display: 'flex',
    gap: 4,
    background: '#0d0e11',
    borderRadius: 6,
    padding: 3,
  },
  modeBtn: (active) => ({
    flex: 1,
    padding: '5px 0',
    borderRadius: 4,
    border: 'none',
    background: active ? '#1a1d24' : 'transparent',
    color: active ? '#f0f0f2' : '#4a4e62',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: active ? 500 : 400,
    transition: 'all 0.15s',
  }),
  promptTextarea: {
    background: '#0d0e11',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#f0f0f2',
    fontSize: 13,
    fontFamily: 'Space Grotesk, sans-serif',
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
    width: '100%',
    minHeight: 90,
    transition: 'border-color 0.15s',
  },

  // Image upload
  imageUpload: (hasImg) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 120,
    borderRadius: 8,
    border: `1px dashed ${hasImg ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)'}`,
    background: hasImg ? 'rgba(249,115,22,0.04)' : '#0d0e11',
    cursor: 'pointer',
    transition: 'all 0.15s',
    position: 'relative',
    overflow: 'hidden',
  }),
  imagePreview: {
    position: 'absolute',
    inset: 0,
    objectFit: 'cover',
    opacity: 0.6,
    borderRadius: 7,
  },
  uploadOverlay: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  uploadText: {
    fontSize: 11,
    color: '#8b8fa8',
    fontFamily: 'Space Grotesk, sans-serif',
  },

  // Generate button
  generateBtn: (loading) => ({
    width: '100%',
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: loading
      ? '#3d1f0a'
      : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: loading ? '#f97316' : '#fff',
    fontSize: 13,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    fontFamily: 'Space Grotesk, sans-serif',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }),

  // Progress
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  progressBar: {
    height: 2,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: 'linear-gradient(90deg, #f97316, #2dd4bf)',
    borderRadius: 1,
    transition: 'width 0.5s ease',
  }),
  progressText: {
    fontSize: 10,
    color: '#8b8fa8',
    fontFamily: 'Space Mono, monospace',
  },

  // Error
  error: {
    padding: '10px 12px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 6,
    color: '#f87171',
    fontSize: 11,
    fontFamily: 'Space Grotesk, sans-serif',
    lineHeight: 1.5,
  },

  // Export buttons
  exportRow: {
    display: 'flex',
    gap: 6,
  },
  exportBtn: {
    flex: 1,
    padding: '7px 0',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#1a1d24',
    color: '#8b8fa8',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'Space Mono, monospace',
    letterSpacing: '0.04em',
    transition: 'all 0.15s',
    textAlign: 'center',
  },

  // Bottom status bar
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '0 16px',
    height: 32,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: '#0d0e11',
    flexShrink: 0,
  },
  statusDot: (color) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }),
  statusText: {
    fontSize: 10,
    color: '#4a4e62',
    fontFamily: 'Space Mono, monospace',
  },
  divider: {
    height: '100%',
    width: 1,
    background: 'rgba(255,255,255,0.04)',
  },
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState('text') // 'text' | 'image'
  const [prompt, setPrompt] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedModel, setSelectedModel] = useState('trellis')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState(null)
  const [modelUrl, setModelUrl] = useState(null)
  const [modelName, setModelName] = useState(null)
  const [textureLayers, setTextureLayers] = useState({})
  const [activeTab, setActiveTab] = useState('generate') // 'generate' | 'settings'
  const [apiKeys, setApiKeys] = useState({
    hfToken: localStorage.getItem('forge3d_hf_token') || '',
    meshyKey: localStorage.getItem('forge3d_meshy_key') || '',
  })

  const imageInputRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleGenerate = useCallback(async () => {
    if (loading) return
    if (mode === 'text' && !prompt.trim()) {
      setError('Enter a prompt to generate a 3D model.')
      return
    }
    if (mode === 'image' && !imageFile) {
      setError('Upload an image to convert to 3D.')
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)
    setProgressMsg('Preparing request…')

    try {
      let imageBase64 = null
      if (mode === 'image' && imageFile) {
        setProgressMsg('Processing image…')
        setProgress(10)
        imageBase64 = await toBase64(imageFile)
      }

      setProgressMsg(`Sending to ${MODELS[selectedModel].name}…`)
      setProgress(20)

      // Simulate progress ticks while waiting
      const tick = setInterval(() => {
        setProgress(p => Math.min(p + 2, 85))
      }, 2000)

      const result = await generate3D({
        model: selectedModel,
        prompt: prompt.trim(),
        imageBase64,
        hfToken: apiKeys.hfToken,
        meshyKey: apiKeys.meshyKey,
      })

      clearInterval(tick)
      setProgress(95)
      setProgressMsg('Processing output…')

      // Extract model URL from result
      // Different models return different structures
      let url = null
      if (result?.data) {
        // Gradio response — look for GLB file path
        const files = result.data.flat(Infinity)
        const glb = files.find(f => typeof f === 'string' && (f.includes('.glb') || f.includes('.obj')))
        url = glb
      } else if (result?.model_urls?.glb) {
        url = result.model_urls.glb
      } else if (result?.model_url) {
        url = result.model_url
      }

      if (!url) {
        // For demo: show raw result info
        console.log('Raw result:', result)
        throw new Error('Model generated but URL extraction needs tuning for this model version. Check console for raw output.')
      }

      setProgress(100)
      setProgressMsg('Done!')
      setModelUrl(url)
      setModelName(`${MODELS[selectedModel].name} — ${mode === 'text' ? prompt.slice(0, 30) : 'Image'}`)

    } catch (err) {
      setError(err.message || 'Generation failed. Check your API keys in Settings.')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 1500)
    }
  }, [loading, mode, prompt, imageFile, selectedModel, apiKeys])

  const handleExport = (format) => {
    if (!modelUrl) return
    const a = document.createElement('a')
    a.href = modelUrl
    a.download = `forge3d-model.${format}`
    a.click()
  }

  return (
    <div style={s.app}>
      {/* Top Bar */}
      <div style={s.topbar}>
        <div style={s.logo}>
          <svg style={s.logoMark} viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 8.5V19.5L14 26L2 19.5V8.5L14 2Z" fill="#f97316" fillOpacity="0.15" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M14 2V26M2 8.5L14 15L26 8.5" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="14" cy="15" r="3" fill="#f97316"/>
          </svg>
          <span style={s.logoText}>
            Forge<span style={s.logoAccent}>3D</span>
          </span>
        </div>

        <div style={s.topbarRight}>
          <button
            style={s.topBtn(activeTab === 'generate')}
            onClick={() => setActiveTab('generate')}
          >Generate</button>
          <button
            style={s.topBtn(activeTab === 'settings')}
            onClick={() => setActiveTab('settings')}
          >⚙ Settings</button>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* Left Sidebar */}
        <div style={s.sidebar}>
          {activeTab === 'settings' ? (
            <SettingsPanel onSave={setApiKeys} />
          ) : (
            <div style={s.sidebarScroll}>

              {/* Model Selection */}
              <div>
                <div style={s.sectionLabel}>AI Engine</div>
                <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
              </div>

              {/* Input mode */}
              <div style={s.promptWrap}>
                <div style={s.sectionLabel}>Input</div>
                <div style={s.modeToggle}>
                  <button style={s.modeBtn(mode === 'text')} onClick={() => setMode('text')}>
                    ✦ Text prompt
                  </button>
                  <button style={s.modeBtn(mode === 'image')} onClick={() => setMode('image')}>
                    ⊡ Image to 3D
                  </button>
                </div>

                {mode === 'text' ? (
                  <textarea
                    style={s.promptTextarea}
                    placeholder="A weathered stone gargoyle perched on a ledge, mossy, medieval, detailed…"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={4}
                    onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                    />
                    <div
                      style={s.imageUpload(!!imagePreview)}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {imagePreview && (
                        <img src={imagePreview} style={s.imagePreview} alt="" />
                      )}
                      <div style={s.uploadOverlay}>
                        <span style={{ fontSize: 24, opacity: 0.5 }}>⊡</span>
                        <span style={s.uploadText}>
                          {imagePreview ? 'Click to change image' : 'Click to upload image'}
                        </span>
                        <span style={{ ...s.uploadText, fontSize: 10, color: '#4a4e62' }}>
                          PNG, JPG, WEBP
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={s.error}>
                  {error}
                </div>
              )}

              {/* Progress */}
              {loading && (
                <div style={s.progress}>
                  <div style={s.progressBar}>
                    <div style={s.progressFill(progress)} />
                  </div>
                  <div style={s.progressText}>{progressMsg}</div>
                </div>
              )}

              {/* Generate */}
              <button
                style={s.generateBtn(loading)}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Generating…
                  </>
                ) : (
                  '⬡ Generate 3D Model'
                )}
              </button>

              {/* Export */}
              {modelUrl && (
                <div>
                  <div style={s.sectionLabel}>Export</div>
                  <div style={s.exportRow}>
                    {['glb', 'obj'].map(fmt => (
                      <div
                        key={fmt}
                        style={s.exportBtn}
                        onClick={() => handleExport(fmt)}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f0f0f2'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#8b8fa8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      >
                        .{fmt.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* 3D Viewport */}
        <div style={s.viewerArea}>
          <div style={s.viewerPad}>
            <Viewer3D
              modelUrl={modelUrl}
              textureLayers={textureLayers}
              modelName={modelName}
            />
          </div>
        </div>

        {/* Right Sidebar — Texture Layers */}
        <div style={s.rightSidebar}>
          <TextureLayers
            hasModel={!!modelUrl}
            onChange={setTextureLayers}
          />
        </div>

      </div>

      {/* Status Bar */}
      <div style={s.statusBar}>
        <div style={s.statusDot(modelUrl ? '#2dd4bf' : '#4a4e62')} />
        <span style={s.statusText}>
          {modelUrl ? `Model loaded — ${MODELS[selectedModel]?.name}` : 'Ready'}
        </span>
        <div style={s.divider} />
        <span style={s.statusText}>Orbit: drag  ·  Zoom: scroll  ·  Pan: right-click</span>
        <div style={s.divider} />
        <span style={{ ...s.statusText, marginLeft: 'auto' }}>
          {apiKeys.hfToken ? '🟢 HF Connected' : '🔴 No HF Token — add in Settings'}
        </span>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 15" />
    </svg>
  )
}
