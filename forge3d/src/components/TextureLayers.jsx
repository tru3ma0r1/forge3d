import React, { useState, useRef } from 'react'

const LAYER_TYPES = [
  {
    id: 'diffuse',
    label: 'Diffuse / Albedo',
    desc: 'Base color map',
    icon: '◉',
    color: '#f97316',
  },
  {
    id: 'normal',
    label: 'Normal Map',
    desc: 'Surface detail & bumps',
    icon: '⊞',
    color: '#2dd4bf',
    hasIntensity: true,
  },
  {
    id: 'roughness',
    label: 'Roughness',
    desc: 'Matte vs glossy surface',
    icon: '▦',
    color: '#a78bfa',
    hasIntensity: true,
  },
  {
    id: 'metalness',
    label: 'Metalness',
    desc: 'Metal vs non-metal',
    icon: '◈',
    color: '#60a5fa',
    hasIntensity: true,
  },
  {
    id: 'emissive',
    label: 'Emissive / Glow',
    desc: 'Self-illuminated areas',
    icon: '✦',
    color: '#facc15',
    hasIntensity: true,
    hasColor: true,
  },
]

const s = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    height: '100%',
    overflowY: 'auto',
  },
  header: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: 'Space Mono, monospace',
    letterSpacing: '0.1em',
    color: '#8b8fa8',
    textTransform: 'uppercase',
  },
  layer: (active) => ({
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: active ? 'rgba(255,255,255,0.02)' : 'transparent',
    transition: 'background 0.15s',
  }),
  layerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  layerIcon: (color) => ({
    fontSize: 16,
    color,
    flexShrink: 0,
    width: 20,
    textAlign: 'center',
  }),
  layerInfo: {
    flex: 1,
    minWidth: 0,
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#f0f0f2',
    lineHeight: 1.3,
  },
  layerDesc: {
    fontSize: 10,
    color: '#4a4e62',
    marginTop: 1,
  },
  layerToggle: (active, color) => ({
    width: 28,
    height: 16,
    borderRadius: 8,
    background: active ? color : '#20242d',
    border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  }),
  toggleDot: (active) => ({
    position: 'absolute',
    top: 2,
    left: active ? 12 : 2,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.2s',
  }),
  layerBody: {
    padding: '0 16px 12px 46px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  uploadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 12px',
    background: '#1a1d24',
    border: '1px dashed rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: '#8b8fa8',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'Space Grotesk, sans-serif',
  },
  uploadPreview: {
    width: 28,
    height: 28,
    borderRadius: 4,
    objectFit: 'cover',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    fontSize: 10,
    color: '#4a4e62',
    width: 60,
    fontFamily: 'Space Mono, monospace',
  },
  slider: {
    flex: 1,
    height: 3,
    appearance: 'none',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
  sliderVal: {
    fontSize: 10,
    color: '#8b8fa8',
    width: 28,
    textAlign: 'right',
    fontFamily: 'Space Mono, monospace',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorLabel: {
    fontSize: 10,
    color: '#4a4e62',
    fontFamily: 'Space Mono, monospace',
    width: 60,
  },
  colorInput: {
    width: 28,
    height: 20,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    padding: 0,
    background: 'transparent',
  },
  noModel: {
    padding: '20px 16px',
    color: '#4a4e62',
    fontSize: 11,
    fontFamily: 'Space Mono, monospace',
    textAlign: 'center',
    lineHeight: 1.7,
  }
}

export default function TextureLayers({ onChange, hasModel }) {
  const [layers, setLayers] = useState(
    Object.fromEntries(LAYER_TYPES.map(l => [l.id, { enabled: false, url: null, intensity: 0.5, color: '#ffffff' }]))
  )
  const [expanded, setExpanded] = useState(null)
  const fileRefs = useRef({})

  const update = (id, patch) => {
    const next = { ...layers, [id]: { ...layers[id], ...patch } }
    setLayers(next)
    const active = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v.enabled && v.url).map(([k, v]) => [k, v])
    )
    onChange?.(active)
  }

  const handleFile = (id, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    update(id, { url, enabled: true })
    setExpanded(id)
  }

  const toggleLayer = (id, color) => {
    update(id, { enabled: !layers[id].enabled })
  }

  if (!hasModel) {
    return (
      <div style={s.panel}>
        <div style={s.header}>
          <div style={s.headerTitle}>Texture Layers</div>
        </div>
        <div style={s.noModel}>
          Generate a model first,<br/>then add texture layers here.
        </div>
      </div>
    )
  }

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <div style={s.headerTitle}>Texture Layers</div>
      </div>

      {LAYER_TYPES.map(layer => {
        const state = layers[layer.id]
        const isOpen = expanded === layer.id

        return (
          <div key={layer.id} style={s.layer(state.enabled)}>
            <div style={s.layerHeader} onClick={() => setExpanded(isOpen ? null : layer.id)}>
              <span style={s.layerIcon(layer.color)}>{layer.icon}</span>
              <div style={s.layerInfo}>
                <div style={s.layerLabel}>{layer.label}</div>
                <div style={s.layerDesc}>{layer.desc}</div>
              </div>
              <div
                style={s.layerToggle(state.enabled, layer.color)}
                onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id, layer.color) }}
              >
                <div style={s.toggleDot(state.enabled)} />
              </div>
            </div>

            {isOpen && (
              <div style={s.layerBody}>
                {/* Upload texture */}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={el => fileRefs.current[layer.id] = el}
                  onChange={e => handleFile(layer.id, e)}
                />
                <button
                  style={s.uploadBtn}
                  onClick={() => fileRefs.current[layer.id]?.click()}
                >
                  {state.url
                    ? <img src={state.url} style={s.uploadPreview} alt="" />
                    : <span style={{ fontSize: 16 }}>+</span>
                  }
                  <span>{state.url ? 'Change texture' : 'Upload texture map'}</span>
                </button>

                {/* Intensity slider */}
                {layer.hasIntensity && (
                  <div style={s.sliderRow}>
                    <span style={s.sliderLabel}>Intensity</span>
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={state.intensity}
                      style={s.slider}
                      onChange={e => update(layer.id, { intensity: parseFloat(e.target.value) })}
                    />
                    <span style={s.sliderVal}>{(state.intensity * 100).toFixed(0)}%</span>
                  </div>
                )}

                {/* Emissive color */}
                {layer.hasColor && (
                  <div style={s.colorRow}>
                    <span style={s.colorLabel}>Glow Color</span>
                    <input
                      type="color"
                      value={state.color}
                      style={s.colorInput}
                      onChange={e => update(layer.id, { color: e.target.value })}
                    />
                    <span style={{ ...s.sliderVal, width: 'auto' }}>{state.color}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
