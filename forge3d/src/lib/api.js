// Forge3D — AI API wrapper
// Uses Hugging Face Spaces via Gradio API

export const MODELS = {
  trellis: {
    id: 'trellis',
    name: 'TRELLIS',
    label: 'TRELLIS.2 (Microsoft)',
    desc: 'Best for production-grade PBR assets. MIT licensed.',
    badge: 'BEST QUALITY',
    color: '#2dd4bf',
    spaceUrl: 'https://microsoft-trellis-2.hf.space',
  },
  hunyuan: {
    id: 'hunyuan',
    name: 'Hunyuan3D',
    label: 'Hunyuan3D 2.0 (Tencent)',
    desc: 'Best textures & PBR material generation.',
    badge: 'BEST TEXTURES',
    color: '#f97316',
    spaceUrl: 'https://tencent-hunyuan3d-2.hf.space',
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

// Helper: call a Gradio Space API
async function gradioCall(spaceUrl, apiName, data, hfToken) {
  const headers = {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {})
  }

  // First get the session hash
  const sessionRes = await fetch(`${spaceUrl}/queue/join`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data, fn_index: 0, session_hash: Math.random().toString(36).slice(2) })
  })

  if (!sessionRes.ok) {
    // Fall back to direct predict
    const res = await fetch(`${spaceUrl}/api/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data, fn_index: 0 })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`)
    }
    return await res.json()
  }

  return await sessionRes.json()
}

// TRELLIS — image to 3D (primary mode, text needs image input)
export async function generateWithTrellis({ prompt, imageBase64, hfToken }) {
  const spaceUrl = 'https://microsoft-trellis-2.hf.space'
  const headers = {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {})
  }

  // TRELLIS.2 works best with image input
  // For text-only, we'll use a placeholder approach via the /run/predict endpoint
  const payload = imageBase64
    ? {
        data: [
          { path: `data:image/png;base64,${imageBase64}` },
          [],    // multiimages
          0,     // seed
          12,    // ss_sampling_steps
          7.5,   // ss_guidance_strength
          12,    // slat_sampling_steps
          3,     // slat_guidance_strength
          'stochastic' // multiimage_algo
        ],
        fn_index: 0,
      }
    : {
        data: [
          prompt,
          0,     // seed
          12,    // steps
          7.5,   // guidance
        ],
        fn_index: 1,
      }

  const res = await fetch(`${spaceUrl}/run/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TRELLIS error: ${res.status} — ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return extractModelUrl(data, spaceUrl)
}

// Hunyuan3D
export async function generateWithHunyuan({ prompt, imageBase64, hfToken }) {
  const spaceUrl = 'https://tencent-hunyuan3d-2.hf.space'
  const headers = {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {})
  }

  const payload = imageBase64
    ? {
        data: [
          { path: `data:image/png;base64,${imageBase64}` },
          true,  // remove_background
          5,     // guidance_scale
          30,    // num_inference_steps
        ],
        fn_index: 1,
      }
    : {
        data: [
          prompt,
          true,
          5,
          30,
          'png'
        ],
        fn_index: 0,
      }

  const res = await fetch(`${spaceUrl}/run/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Hunyuan3D error: ${res.status} — ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return extractModelUrl(data, spaceUrl)
}

// Extract GLB/OBJ URL from Gradio response
function extractModelUrl(data, spaceUrl) {
  if (!data?.data) return null

  const flat = data.data.flat(Infinity)

  for (const item of flat) {
    if (typeof item === 'string') {
      if (item.endsWith('.glb') || item.endsWith('.obj') || item.endsWith('.ply')) {
        // If it's a relative path, prepend the space URL
        if (item.startsWith('/')) return `${spaceUrl}${item}`
        if (item.startsWith('http')) return item
        return `${spaceUrl}/file=${item}`
      }
    }
    if (typeof item === 'object' && item !== null) {
      const path = item.path || item.url || item.value
      if (typeof path === 'string' && (path.endsWith('.glb') || path.endsWith('.obj'))) {
        if (path.startsWith('/')) return `${spaceUrl}${path}`
        if (path.startsWith('http')) return path
        return `${spaceUrl}/file=${path}`
      }
    }
  }

  console.log('Full API response (for debugging):', JSON.stringify(data, null, 2))
  throw new Error('Model generated but could not extract download URL. Check browser console for the raw response.')
}

// Meshy AI
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
  return pollMeshyJob(data.result, meshyKey, !!imageUrl)
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
    if (data.status === 'SUCCEEDED') return { data: [data.model_urls?.glb] }
    if (data.status === 'FAILED') throw new Error('Meshy generation failed')
  }
  throw new Error('Meshy timed out after 5 minutes')
}

// Main dispatch
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
