import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#0a0b0e',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  empty: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#4a4e62',
    pointerEvents: 'none',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Space Grotesk, sans-serif',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  controls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    display: 'flex',
    gap: 6,
  },
  controlBtn: {
    background: 'rgba(26,29,36,0.9)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#8b8fa8',
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'Space Mono, monospace',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.15s',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    background: 'rgba(249,115,22,0.12)',
    border: '1px solid rgba(249,115,22,0.25)',
    color: '#f97316',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: 10,
    fontFamily: 'Space Mono, monospace',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
}

export default function Viewer3D({ modelUrl, modelType = 'glb', textureLayers = {}, modelName }) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const meshRef = useRef(null)
  const animFrameRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [wireframe, setWireframe] = useState(false)

  const initScene = useCallback(() => {
    const el = mountRef.current
    if (!el) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0b0e')
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.01, 1000)
    camera.position.set(0, 1.5, 3.5)
    cameraRef.current = camera

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.5
    controls.maxDistance = 20
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 2.5)
    keyLight.position.set(3, 5, 3)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xd4f0ff, 0.8)
    fillLight.position.set(-3, 2, -2)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xf97316, 0.5)
    rimLight.position.set(0, -2, -4)
    scene.add(rimLight)

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(10, 10)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d0e11,
      roughness: 0.8,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.2
    ground.receiveShadow = true
    scene.add(ground)

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x1a1d24, 0x1a1d24)
    grid.position.y = -1.19
    scene.add(grid)

    // Demo geometry if no model
    if (!modelUrl) {
      const geo = new THREE.IcosahedronGeometry(1, 1)
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2a2e3a,
        roughness: 0.4,
        metalness: 0.6,
        wireframe: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.castShadow = true
      scene.add(mesh)
      meshRef.current = mesh
    }

    // Animate
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      if (meshRef.current && !modelUrl) {
        meshRef.current.rotation.y += 0.003
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    const cleanup = initScene()
    return cleanup
  }, [initScene])

  // Load model when URL changes
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return

    // Remove previous mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current)
      meshRef.current = null
    }

    const scene = sceneRef.current
    setLoaded(false)

    if (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf') || modelType === 'glb') {
      const loader = new GLTFLoader()
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene
          // Auto-center and scale
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const scale = 2 / maxDim
          model.scale.setScalar(scale)
          model.position.sub(center.multiplyScalar(scale))
          model.castShadow = true
          scene.add(model)
          meshRef.current = model
          setLoaded(true)
        },
        undefined,
        (err) => console.error('GLB load error:', err)
      )
    } else if (modelType === 'obj' || modelUrl.endsWith('.obj')) {
      const loader = new OBJLoader()
      loader.load(modelUrl, (obj) => {
        const box = new THREE.Box3().setFromObject(obj)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        obj.scale.setScalar(scale)
        obj.position.sub(center.multiplyScalar(scale))
        scene.add(obj)
        meshRef.current = obj
        setLoaded(true)
      })
    }
  }, [modelUrl, modelType])

  // Apply texture layers
  useEffect(() => {
    if (!meshRef.current) return
    const textureLoader = new THREE.TextureLoader()

    meshRef.current.traverse((child) => {
      if (!child.isMesh) return

      if (textureLayers.diffuse?.url) {
        const tex = textureLoader.load(textureLayers.diffuse.url)
        tex.colorSpace = THREE.SRGBColorSpace
        child.material.map = tex
      }
      if (textureLayers.roughness?.url) {
        child.material.roughnessMap = textureLoader.load(textureLayers.roughness.url)
        child.material.roughness = textureLayers.roughness.intensity ?? 0.5
      }
      if (textureLayers.normal?.url) {
        child.material.normalMap = textureLoader.load(textureLayers.normal.url)
        child.material.normalScale = new THREE.Vector2(
          textureLayers.normal.intensity ?? 1,
          textureLayers.normal.intensity ?? 1
        )
      }
      if (textureLayers.metalness?.url) {
        child.material.metalnessMap = textureLoader.load(textureLayers.metalness.url)
        child.material.metalness = textureLayers.metalness.intensity ?? 0.5
      }
      if (textureLayers.emissive?.url) {
        child.material.emissiveMap = textureLoader.load(textureLayers.emissive.url)
        child.material.emissive = new THREE.Color(textureLayers.emissive.color ?? '#ffffff')
        child.material.emissiveIntensity = textureLayers.emissive.intensity ?? 1
      }

      child.material.needsUpdate = true
    })
  }, [textureLayers])

  // Wireframe toggle
  useEffect(() => {
    if (!meshRef.current) return
    meshRef.current.traverse((child) => {
      if (child.isMesh) child.material.wireframe = wireframe
    })
  }, [wireframe])

  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(0, 1.5, 3.5)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }

  return (
    <div style={styles.wrapper}>
      <div ref={mountRef} style={styles.canvas} />

      {!modelUrl && (
        <div style={styles.empty}>
          <svg style={styles.emptyIcon} viewBox="0 0 64 64" fill="none">
            <path d="M32 8L56 20V44L32 56L8 44V20L32 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M32 8V56M8 20L32 32L56 20" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span style={styles.emptyText}>Generate a model to preview</span>
        </div>
      )}

      {modelName && (
        <div style={styles.badge}>{modelName}</div>
      )}

      <div style={styles.controls}>
        <button
          style={{
            ...styles.controlBtn,
            ...(wireframe ? { color: '#f97316', borderColor: 'rgba(249,115,22,0.4)' } : {})
          }}
          onClick={() => setWireframe(w => !w)}
        >
          WIRE
        </button>
        <button style={styles.controlBtn} onClick={resetCamera}>
          RESET
        </button>
      </div>
    </div>
  )
}
