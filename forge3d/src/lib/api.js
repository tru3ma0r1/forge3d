// Hugging Face Inference API wrapper
// Models: TRELLIS (Microsoft) and Hunyuan3D (Tencent)
// Meshy AI fallback (requires free API key from meshy.ai)

const HF_API = 'https://api-inference.huggingface.co'

// TRELLIS Space endpoint (runs on HF Spaces — free, no GPU needed locally)
const TRELLIS_SPACE = 'https://jeffreyxiang-trellis.hf.space'
// Hunyuan3D Space endpoint
const HUNYUAN_SPACE = 'https://tencent-hunyuan3d-2.hf.space'

export const MODELS = {
  trellis: {
    id: 'trellis',
    name: 'TRELLIS',
    label: 'TRELLIS.2 (Microsoft)',
    desc: 'Best for production-grade PBR assets. MIT licensed.',
    badge: 'BEST QUALITY',
    color: '#2dd4bf',
    spaceUrl: TRELLIS_SPACE,
  },
  hunyuan: {
    id: 'hunyuan',
    name: 'Hunyuan3D',
    label: 'Hunyuan3D 2.0 (Tencent)',
    desc: 'Best textures & PBR material generation.',
    badge: 'BEST TEXTURES',
    color: '#f97316',
    spaceUrl: HUNYUAN_SPACE,
  },
  meshy: {
    id: 'meshy',
    name: 'Meshy',
    label: 'Meshy AI',
    desc: 'Fast, polished. Requires free API key from meshy.ai',
    badge: 'PREMIUM',
    color: '#a78bfa',
    apiKeyRequired: true,
  }
}

/**
 * Call TRELLIS via Hugging Face Spaces API (Gradio)
 * Returns a polling job or direct result
 */
export async function generateWithTrellis({ prompt, imageBase64, hfToken }) {
  const headers = {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {})
  }

  // Use text-to-3D endpoint
  const endpoint = imageBase64
    ? `${TRELLIS_SPACE}/api/predict`
    : `${TRELLIS_SPACE}/api/predict`

  const payload = imageBase64
    ? {
        fn_index: 0,
        data: [`data:image/png;base64,${imageBase64}`]
      }
    : {
        fn_index: 1,
        data: [prompt, 42, 12, 7.5, 6]
      }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TRELLIS error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data
}

/**
 * Call Hunyuan3D via Hugging Face Spaces
 */
export async function generateWithHunyuan({ prompt, imageBase64, hfToken }) {
  const headers = {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {})
  }

  const payload = imageBase64
    ? {
        fn_index: 1,
        data: [`data:image/png;base64,${imageBase64}`, true, 5, 30]
      }
    : {
        fn_index: 0,
        data: [prompt, true, 5, 30, 'png']
      }

  const res = await fetch(`${HUNYUAN_SPACE}/api/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Hunyuan3D error: ${res.status} — ${err}`)
  }

  return await res.json()
}

/**
 * Call Meshy AI (requires free API key from meshy.ai)
 */
export async function generateWithMeshy({ prompt, imageUrl, meshyKey }) {
  if (!meshyKey) throw new Error('Meshy API key required. Get one free at meshy.ai')

  const body = imageUrl
    ? { image_url: imageUrl, enable_pbr: true }
    : {
        mode: 'preview',
        prompt,
        art_style: 'realistic',
        negative_prompt: 'low quality, low resolution, low poly, ugly',
        enable_pbr: true
      }

  const endpoint = imageUrl
    ? 'https://api.meshy.ai/v1/image-to-3d'
    : 'https://api.meshy.ai/v2/text-to-3d'

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${meshyKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) throw new Error(`Meshy error: ${res.status}`)
  const data = await res.json()

  // Poll until complete
  return pollMeshyJob(data.result, meshyKey, imageUrl)
}

async function pollMeshyJob(taskId, meshyKey, isImage) {
  const base = isImage
    ? 'https://api.meshy.ai/v1/image-to-3d'
    : 'https://api.meshy.ai/v2/text-to-3d'

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const res = await fetch(`${base}/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey}` }
    })
    const data = await res.json()
    if (data.status === 'SUCCEEDED') return data
    if (data.status === 'FAILED') throw new Error('Meshy generation failed')
  }
  throw new Error('Meshy timed out after 5 minutes')
}

/**
 * Main dispatch function
 */
export async function generate3D({ model, prompt, imageBase64, hfToken, meshyKey }) {
  switch (model) {
    case 'trellis':
      return generateWithTrellis({ prompt, imageBase64, hfToken })
    case 'hunyuan':
      return generateWithHunyuan({ prompt, imageBase64, hfToken })
    case 'meshy':
      return generateWithMeshy({ prompt, meshyKey })
    default:
      throw new Error(`Unknown model: ${model}`)
  }
}
