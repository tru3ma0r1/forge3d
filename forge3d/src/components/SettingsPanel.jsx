import React, { useState, useEffect } from 'react'

const s = {
  wrap: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Space Mono, monospace',
    color: '#8b8fa8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  input: {
    background: '#0d0e11',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#f0f0f2',
    fontSize: 12,
    fontFamily: 'Space Mono, monospace',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  hint: {
    fontSize: 10,
    color: '#4a4e62',
    lineHeight: 1.6,
  },
  link: {
    color: '#f97316',
    textDecoration: 'none',
  },
  saveBtn: {
    padding: '8px 16px',
    background: '#f97316',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Space Grotesk, sans-serif',
    letterSpacing: '0.02em',
  },
  saved: {
    fontSize: 11,
    color: '#2dd4bf',
    fontFamily: 'Space Mono, monospace',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    margin: 0,
  }
}

export default function SettingsPanel({ onSave }) {
  const [hfToken, setHfToken] = useState('')
  const [meshyKey, setMeshyKey] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    setHfToken(localStorage.getItem('forge3d_hf_token') || '')
    setMeshyKey(localStorage.getItem('forge3d_meshy_key') || '')
  }, [])

  const save = () => {
    localStorage.setItem('forge3d_hf_token', hfToken)
    localStorage.setItem('forge3d_meshy_key', meshyKey)
    onSave?.({ hfToken, meshyKey })
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div style={s.wrap}>
      <div style={s.section}>
        <div style={s.label}>Hugging Face Token</div>
        <input
          style={s.input}
          type="password"
          placeholder="hf_xxxxxxxxxxxxxxxx"
          value={hfToken}
          onChange={e => setHfToken(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <div style={s.hint}>
          Free token from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer" style={s.link}>huggingface.co/settings/tokens</a>.
          Required for TRELLIS and Hunyuan3D. Read-only access is enough.
        </div>
      </div>

      <hr style={s.divider} />

      <div style={s.section}>
        <div style={s.label}>Meshy AI Key <span style={{ color: '#4a4e62', fontWeight: 400 }}>(optional)</span></div>
        <input
          style={s.input}
          type="password"
          placeholder="msy_xxxxxxxxxxxxxxxx"
          value={meshyKey}
          onChange={e => setMeshyKey(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <div style={s.hint}>
          Free tier at <a href="https://www.meshy.ai" target="_blank" rel="noreferrer" style={s.link}>meshy.ai</a> — 200 credits/month free. Only needed for the Meshy model.
        </div>
      </div>

      <hr style={s.divider} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={s.saveBtn} onClick={save}>Save Keys</button>
        {savedMsg && <span style={s.saved}>✓ Saved locally</span>}
      </div>

      <div style={s.hint}>
        Keys are stored only in your browser's local storage — never sent to any server other than the AI providers above.
      </div>
    </div>
  )
}
