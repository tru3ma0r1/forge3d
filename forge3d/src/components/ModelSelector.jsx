import React from 'react'
import { MODELS } from '../lib/api.js'

const s = {
  wrap: {
    display: 'flex',
    gap: 8,
  },
  card: (active, color) => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.06)'}`,
    background: active ? color + '11' : '#13151a',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
  }),
  badge: (color) => ({
    display: 'inline-block',
    fontSize: 9,
    fontFamily: 'Space Mono, monospace',
    letterSpacing: '0.08em',
    color,
    border: `1px solid ${color}44`,
    borderRadius: 3,
    padding: '1px 5px',
    marginBottom: 5,
  }),
  name: (active, color) => ({
    fontSize: 12,
    fontWeight: 600,
    color: active ? color : '#f0f0f2',
    lineHeight: 1.3,
    marginBottom: 2,
  }),
  desc: {
    fontSize: 10,
    color: '#4a4e62',
    lineHeight: 1.4,
  },
}

export default function ModelSelector({ selected, onChange }) {
  return (
    <div style={s.wrap}>
      {Object.values(MODELS).map(model => {
        const active = selected === model.id
        return (
          <div
            key={model.id}
            style={s.card(active, model.color)}
            onClick={() => onChange(model.id)}
          >
            <div style={s.badge(model.color)}>{model.badge}</div>
            <div style={s.name(active, model.color)}>{model.label}</div>
            <div style={s.desc}>{model.desc}</div>
          </div>
        )
      })}
    </div>
  )
}
