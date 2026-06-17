// Forge3D — AI API wrapper
// Uses Hugging Face Spaces Gradio API v4 pattern:
// POST /gradio_api/call/{fn} → get event_id → GET /gradio_api/call/{fn}/{event_id}

export const MODELS = {
  trellis: {
    id: 'trellis',
    name: 'TRELLIS',
    label: 'TRELLIS.2 (Microsoft)',
    desc: 'Image → 3D with full PBR materials. MIT licensed.',
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

// Gradio v4 API: POST to get event_id, then poll GET for result
async function gradioPredict(spaceUrl, fnName, data, hfToken, onProgress) {
  const headers = {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {})
  }

  // Step 1: Submit job
  const submitRes = await fetch(`${spaceUrl}/gradio_api/call/${fnName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data })
  })

  if (!submitRes.ok) {
    const text = await submitRes.text()
    throw new Error(`Submit error ${submitRes.status}: ${text.slice(0, 300)}`)
  }

  const { event_id } = await submitRes.json()
  if (!event_id) throw new Error('No event_id returned from Space')

  onProgress?.('Waiting in queue…')

  // Step 2: Poll for result via SSE
  const resultRes = await fetch(`${spaceUrl}/gradio_api/call/${fnName}/${event_id}`, {
    headers: hfToken ? { Authorization: `Bearer ${hfToken}` } : {}
  })

  if (!resultRes.ok) {
    const text = await resultRes.text()
    throw new Error(`Poll error ${resultRes.status}: ${text.slice(0, 300)}`)
  }

  // Read SSE stream
  const text = await resultRes.text()
  const lines = text.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = line.slice(6).trim()
      if (!json || json === '[DONE]') continue
      try {
        const parsed = JSON.parse(json)
        if (Array.isArray(parsed)) return { data: parsed }
        if (parsed.error) throw new Error(`Space error: ${parsed.error}`)
      } catch (e) {
        if (e.message.startsWith('Space error:')) throw e
      }
    }
  }

  throw new Error('No result data received from Space')
}

// Extract model URL from Gradio response
function extractModelUrl(data, spaceUrl) {
  if (!data?.data) throw new Error('No data in response')

  const flat = JSON.parse(JSON.stringify(data.data))

  function search(obj) {
    if (typeof obj === 'string') {
      if (obj.match(/\.(glb|obj|ply)(\?|$)/i)) {
        if (obj.startsWith('http')) return obj
        if (obj.startsWith('/')) return `${spaceUrl}${obj}`
        return `${spaceUrl}/gradio_api/file=${obj}`
      }
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = search(item)
        if (result) return result
      }
    }
    if (obj && typeof obj === 'object') {
      for (const val of Object.values(obj)) {
        const result = search(val)
        if (result) return result
      }
    }
    return null
  }

  const url = search(flat)

  if (!url) {
    console.log('Full API response:', JSON.stringify(data, null, 2))
    throw new Error('Model generated but GLB URL not found. Check the browser console (F12) for the raw response to help debug.')
  }

  return url
}

// TRELLIS.2 — image to 3D
export async function generateWithTrellis({ prompt, imageBase64, hfToken, onProgress }) {
  const spaceUrl = 'https://microsoft-trellis-2.hf.space'

  // TRELLIS.2 is image-to-3D only
  // For text prompts, we still need an image — inform user
  if (!imageBase64) {
    throw new Error('TRELLIS works with images. Please switch to "Image to 3D" mode and upload a photo, or try Hunyuan3D for text prompts.')
  }

  onProgress?.('Sending image to TRELLIS.2…')

  const data = await gradioPredict(
    spaceUrl,
    'image_to_3d',
    [
      { path: `data:image/png;base64,${imageBase64}` },
      [],       // multiimages
      0,        // seed
      12,       // ss_sampling_steps
      7.5,      // ss_guidance_strength
      12,       // slat_sampling_steps
      3,        // slat_guidance_strength
      'stochastic' // multiimage_algo
    ],
    hfToken,
    onProgress
  )

  return extractModelUrl(data, spaceUrl)
}

// Hunyuan3D 2.0 — text or image to 3D
export async function generateWithHunyuan({ prompt, imageBase64, hfToken, onProgress }) {
  const spaceUrl = 'https://tencent-hunyuan3d-2.hf.space'

  onProgress?.('Sending to Hunyuan3D…')

  const fnName = imageBase64 ? 'image_to_3d' : 'text_to_3d'
  const data = imageBase64
    ? await gradioPredict(spaceUrl, fnName, [
        { path: `data:image/png;base64,${imageBase64}` },
        true, 5, 30
      ], hfToken, onProgress)
    : await gradioPredict(spaceUrl, fnName, [
        prompt, true, 5, 30, 'png'
      ], hfToken, onProgress)

  return extractModelUrl(data, spaceUrl)
}

// Meshy AI
export async function generateWithMeshy({ prompt, meshyKey, onProgress }) {
  if (!meshyKey) throw new Error('Meshy API key required. Get one free at meshy.ai')

  onProgress?.('Sending to Meshy AI…')

  const res = await fetch('https://api.meshy.ai/v2/text-to-3d', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${meshyKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      art_style: 'realistic',
      negative_prompt: 'low quality, low poly, ugly',
      enable_pbr: true
    })
  })

  if (!res.ok) throw new Error(`Meshy error: ${res.status}`)
  const { result: taskId } = await res.json()

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000))
    onProgress?.(`Meshy generating… (${(i + 1) * 5}s)`)
    const poll = await fetch(`https://api.meshy.ai/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${meshyKey}` }
    })
    const data = await poll.json()
    if (data.status === 'SUCCEEDED') return data.model_urls?.glb
    if (data.status === 'FAILED') throw new Error('Meshy generation failed')
  }
  throw new Error('Meshy timed out')
}

// Main dispatch
export async function generate3D({ model, prompt, imageBase64, hfToken, meshyKey, onProgress }) {
  switch (model) {
    case 'trellis':
      return generateWithTrellis({ prompt, imageBase64, hfToken, onProgress })
    case 'hunyuan':
      return generateWithHunyuan({ prompt, imageBase64, hfToken, onProgress })
    case 'meshy':
      return generateWithMeshy({ prompt, meshyKey, onProgress })
    default:
      throw new Error(`Unknown model: ${model}`)
  }
}
