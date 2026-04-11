import { useState, useEffect, useRef, useMemo } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

// ── World constants ──────────────────────────────────────────────────────────
const WORLD_COLS = 12
const WORLD_ROWS = 10
const TILE_SIZE  = 500
const WORLD_W    = WORLD_COLS * TILE_SIZE   // 6 000 px
const WORLD_H    = WORLD_ROWS * TILE_SIZE   // 5 000 px
const LAND_TILES = ['split_1.png', 'split_2.png', 'split_3.png', 'split_4.png']

// Figma asset URLs (served by Figma MCP desktop server)
const IMG_BG           = 'http://localhost:3845/assets/8bcda688fa73379f3451c159e120afbcb5a00aa2.png'
const IMG_ICON_SEARCH  = 'http://localhost:3845/assets/ffb2db3a8000e067d0e17680f68bd282983f5c28.png'
const IMG_ICON_CREATE  = 'http://localhost:3845/assets/971c7aa8a6fe7abab79ad54734139399a6eb5c94.png'
const IMG_ICON_JITS    = 'http://localhost:3845/assets/22eedd3bcbdc34d661ac313bc55be6535bf0b8db.png'
const IMG_AVATAR       = 'http://localhost:3845/assets/d36ef49c1584ec1b24a8e59963cb98d7ac481fee.png'
const IMG_DICE         = 'http://localhost:3845/assets/005c1fc54bd6887b555a3fc79fa4e46b6c227d10.png'
const IMG_TB_HOME      = 'http://localhost:3845/assets/4b53ce6d09feffb344771490ab6f08b8cfb7c270.png'
const IMG_TB_PRINTER   = 'http://localhost:3845/assets/93f31b5e097cb3753866508c105a45fe5594ee67.png'
const IMG_TB_FAVICON   = 'http://localhost:3845/assets/8472ac418b4cef1b82fd62d9559e6fed8b058aeb.png'
const IMG_TB_MUSIC     = 'http://localhost:3845/assets/cb75e9d3d8b4b4441e60a21e9a2796b8ab134126.png'
const IMG_SEARCH_GLASS = 'http://localhost:3845/assets/f314bae801b5a54cab04e43e51956eec99fd795b.png'
const IMG_CLOSE        = 'http://localhost:3845/assets/6923432ba0ba895f82ec519c1ecd93b00299c30f.png'

// Avatar layer image lists (served from /public/)
const HATS = [
  'Untitled92_20260411030109.png','Untitled92_20260411030111.png','Untitled92_20260411030112.png',
  'Untitled92_20260411030113.png','Untitled92_20260411030115.png','Untitled92_20260411030116.png',
  'Untitled92_20260411030117.png','Untitled92_20260411030119.png','Untitled92_20260411030122.png',
  'Untitled92_20260411030125.png','Untitled92_20260411030128.png','Untitled92_20260411030129.png',
  'Untitled92_20260411030130.png','Untitled92_20260411030133.png','Untitled92_20260411030135.png',
  'Untitled92_20260411030137.png','Untitled92_20260411030138.png','Untitled92_20260411030140.png',
  'Untitled92_20260411030141.png','Untitled92_20260411030142.png','Untitled92_20260411030143.png',
  'Untitled92_20260411030145.png','Untitled92_20260411030147.png','Untitled92_20260411030148.png',
]
const FACES = [
  'Untitled92_20260411030051.png','Untitled92_20260411030053.png','Untitled92_20260411030054.png',
  'Untitled92_20260411030056.png','Untitled92_20260411030100.png','Untitled92_20260411030101.png',
  'Untitled92_20260411030102.png',
]
const NECKS = [
  'Untitled92_20260411030153.png','Untitled92_20260411030154.png','Untitled92_20260411030156.png',
  'Untitled92_20260411030157.png','Untitled92_20260411030200.png','Untitled92_20260411030201.png',
  'Untitled92_20260411030202.png','Untitled92_20260411030203.png','Untitled92_20260411030207.png',
  'Untitled92_20260411030208.png','Untitled92_20260411030210.png','Untitled92_20260411030211.png',
  'Untitled92_20260411030214.png','Untitled92_20260411030215.png','Untitled92_20260411030216.png',
]
const BODIES = [
  'Untitled92_20260411030234.png','Untitled92_20260411030235.png','Untitled92_20260411030237.png',
]

function Window({ title, onClose, className = '', children, defaultX = 200, defaultY = 60 }) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const dragging = useRef(false)
  const start = useRef({ mx: 0, my: 0, px: 0, py: 0 })

  function onTitleMouseDown(e) {
    if (e.target.classList.contains('w95-close-btn') || e.target.classList.contains('w95-close-img')) return
    dragging.current = true
    start.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    function onMove(e) {
      if (!dragging.current) return
      setPos({ x: start.current.px + e.clientX - start.current.mx, y: start.current.py + e.clientY - start.current.my })
    }
    function onUp() {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className={`w95-window ${className}`} style={{ left: pos.x, top: pos.y }}>
      <div className="w95-titlebar" onMouseDown={onTitleMouseDown}>
        <span className="w95-title">{title}</span>
        <button className="w95-close-btn" onClick={onClose}>
          <img src={IMG_CLOSE} alt="✕" className="w95-close-img" />
        </button>
      </div>
      <div className="w95-content">{children}</div>
    </div>
  )
}

export default function App() {
  const [activeWindow, setActiveWindow] = useState(null)
  const [time, setTime] = useState('')
  const [jits, setJits] = useState([])
  const [activities, setActivities] = useState([])
  const [jitPositions, setJitPositions] = useState({})
  const [highlightedJit, setHighlightedJit] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [createName, setCreateName] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [camera, setCamera] = useState({ x: 0, y: 0 })
  const [profileData, setProfileData] = useState(null) // { jit, details, activities, x, y }
  const cameraRef = useRef({ x: 0, y: 0 })

  // Avatar layer indices (-1 = none for optional layers)
  const [hatIdx, setHatIdx] = useState(-1)
  const [faceIdx, setFaceIdx] = useState(-1)
  const [neckIdx, setNeckIdx] = useState(-1)
  const [bodyIdx, setBodyIdx] = useState(0)

  const highlightTimer = useRef(null)
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const cameraInitialized = useRef(false)
  const jitPositionsRef = useRef({})

  // Stable random tilemap — generated once
  const tilemap = useMemo(() =>
    Array.from({ length: WORLD_ROWS }, () =>
      Array.from({ length: WORLD_COLS }, () =>
        LAND_TILES[Math.floor(Math.random() * LAND_TILES.length)]
      )
    ), [])

  const cycle = (setter, list, dir) =>
    setter(i => (i + dir + list.length) % list.length)
  const cycleLayer = (setter, list, dir) =>
    setter(i => ((i + 1 + dir + list.length + 1) % (list.length + 1)) - 1)

  function randomize() {
    setHatIdx(Math.floor(Math.random() * HATS.length))
    setFaceIdx(Math.floor(Math.random() * FACES.length))
    setNeckIdx(Math.floor(Math.random() * NECKS.length))
    setBodyIdx(Math.floor(Math.random() * BODIES.length))
  }

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours()
      const m = String(d.getMinutes()).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = (h % 12) || 12
      setTime(`${h}:${m}${ampm}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Socket.io — real-time activity feed + new JIT broadcasts
  useEffect(() => {
    const socket = io(API_BASE)
    socket.on('new_activity', activity => {
      setActivities(prev => [activity, ...prev].slice(0, 30))
    })
    socket.on('jit_created', jit => {
      setJits(prev => prev.find(j => j.id === jit.id) ? prev : [...prev, jit])
    })
    return () => socket.disconnect()
  }, [])

  // Fetch data + center camera on first open
  useEffect(() => {
    if (activeWindow === 'jitcamp' || activeWindow === 'search') {
      fetchJits()
      fetchActivities()
      if (!cameraInitialized.current) {
        cameraInitialized.current = true
        setTimeout(() => {
          if (viewportRef.current) {
            const vpW = viewportRef.current.offsetWidth
            const vpH = viewportRef.current.offsetHeight
            setCamera({
              x: Math.min(0, Math.max(-(WORLD_W - vpW), -WORLD_W / 2 + vpW / 2)),
              y: Math.min(0, Math.max(-(WORLD_H - vpH), -WORLD_H / 2 + vpH / 2)),
            })
          }
        }, 30)
      }
    }
  }, [activeWindow])

  // Keep refs in sync for use in async callbacks / event handlers
  useEffect(() => { jitPositionsRef.current = jitPositions }, [jitPositions])
  useEffect(() => { cameraRef.current = camera }, [camera])

  function randomVelocity() {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 3
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
  }

  // Initialize JIT positions in world-pixel coordinates
  useEffect(() => {
    setJitPositions(prev => {
      const next = { ...prev }
      for (const jit of jits) {
        if (!next[jit.id]) {
          const { vx, vy } = randomVelocity()
          next[jit.id] = {
            x: (jit.location_x != null ? jit.location_x : Math.random()) * WORLD_W,
            y: (jit.location_y != null ? jit.location_y : Math.random()) * WORLD_H,
            vx, vy,
          }
        }
      }
      return next
    })
  }, [jits])

  // Movement animation — runs only while JIT_CAMP is visible
  useEffect(() => {
    if (activeWindow !== 'jitcamp' && activeWindow !== 'search') return
    const interval = setInterval(() => {
      setJitPositions(prev => {
        const next = {}
        for (const [id, pos] of Object.entries(prev)) {
          let { x, y, vx, vy } = pos
          // Randomly pick a new direction
          if (Math.random() < 0.02) {
            const { vx: nvx, vy: nvy } = randomVelocity()
            vx = nvx; vy = nvy
          }
          x += vx
          y += vy
          // Bounce off world edges with a new random angle
          if (x < 20)           { x = 20;           const v = randomVelocity(); vx = Math.abs(v.vx);  vy = v.vy }
          if (x > WORLD_W - 20) { x = WORLD_W - 20; const v = randomVelocity(); vx = -Math.abs(v.vx); vy = v.vy }
          if (y < 20)           { y = 20;            const v = randomVelocity(); vy = Math.abs(v.vy);  vx = v.vx }
          if (y > WORLD_H - 20) { y = WORLD_H - 20;  const v = randomVelocity(); vy = -Math.abs(v.vy); vx = v.vx }
          next[id] = { x, y, vx, vy }
        }
        return next
      })
    }, 120)
    return () => clearInterval(interval)
  }, [activeWindow])

  // Camera drag — attach to window so drag continues past viewport edge
  useEffect(() => {
    function onMouseMove(e) {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const vp = viewportRef.current
      const vpW = vp?.offsetWidth ?? 800
      const vpH = vp?.offsetHeight ?? 600
      setCamera({
        x: Math.min(0, Math.max(-(WORLD_W - vpW), dragRef.current.camX + dx)),
        y: Math.min(0, Math.max(-(WORLD_H - vpH), dragRef.current.camY + dy)),
      })
    }
    function onMouseUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function onViewportMouseDown(e) {
    if (e.button !== 0) return
    // Don't hijack clicks on overlay UI
    if (e.target.closest('.feed-box') || e.target.closest('.search-overlay')) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, camX: camera.x, camY: camera.y }
  }

  async function fetchJits() {
    try {
      const res = await fetch(`${API_BASE}/api/tamagotchis`)
      const data = await res.json()
      setJits(Array.isArray(data) ? data : [])
    } catch { setJits([]) }
  }

  async function fetchActivities() {
    try {
      const res = await fetch(`${API_BASE}/api/activities?limit=25`)
      const data = await res.json()
      setActivities(Array.isArray(data) ? data : [])
    } catch { setActivities([]) }
  }

  function panToJit(jit) {
    setActiveWindow('jitcamp')
    setSearchQuery('')
    setSearchResults(null)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    setHighlightedJit(jit.id)
    highlightTimer.current = setTimeout(() => setHighlightedJit(null), 4000)
    const pos = jitPositionsRef.current[jit.id]
    if (pos && viewportRef.current) {
      const vpW = viewportRef.current.offsetWidth
      const vpH = viewportRef.current.offsetHeight
      setCamera({
        x: Math.min(0, Math.max(-(WORLD_W - vpW), -pos.x + vpW / 2)),
        y: Math.min(0, Math.max(-(WORLD_H - vpH), -pos.y + vpH / 2)),
      })
    }
  }

  function onSearchChange(e) {
    const q = e.target.value
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults(null); return }
    const lower = q.trim().toLowerCase()
    const matches = jits
      .filter(j => j.name.toLowerCase().includes(lower))
      .sort((a, b) => {
        const al = a.name.toLowerCase(), bl = b.name.toLowerCase()
        if (al === lower) return -1
        if (bl === lower) return 1
        if (al.startsWith(lower) && !bl.startsWith(lower)) return -1
        if (!al.startsWith(lower) && bl.startsWith(lower)) return 1
        return al.localeCompare(bl)
      })
      .slice(0, 6)
    setSearchResults(matches)
  }

  function handleSearch(e) {
    e.preventDefault()
    if (searchResults && searchResults.length > 0) {
      panToJit(searchResults[0])
    }
  }

  async function handleJitClick(jit, e) {
    e.stopPropagation()
    const pos = jitPositionsRef.current[jit.id]
    const cam = cameraRef.current
    const rect = viewportRef.current?.getBoundingClientRect()
    // World → screen coordinates
    const sx = rect ? rect.left + pos.x + cam.x : 400
    const sy = rect ? rect.top  + pos.y + cam.y : 300
    // Position window above the sprite; clamp so it stays on screen
    const wx = Math.max(10, Math.min(window.innerWidth - 300, sx - 140))
    const wy = Math.max(10, sy - 300)

    try {
      const [detailRes, actRes] = await Promise.all([
        fetch(`${API_BASE}/api/tamagotchis/${jit.id}`),
        fetch(`${API_BASE}/api/tamagotchis/${jit.id}/activities`),
      ])
      const details = await detailRes.json()
      const acts    = await actRes.json()
      setProfileData({ jit, details, activities: Array.isArray(acts) ? acts : [], x: wx, y: wy })
    } catch {
      setProfileData({ jit, details: jit, activities: [], x: wx, y: wy })
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!createName.trim()) return
    try {
      const res = await fetch(`${API_BASE}/api/tamagotchis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          body_url: `/jitbody/${BODIES[bodyIdx]}`,
          hat_url:  hatIdx  >= 0 ? `/jithats/${HATS[hatIdx]}`   : null,
          face_url: faceIdx >= 0 ? `/jitface/${FACES[faceIdx]}` : null,
          neck_url: neckIdx >= 0 ? `/jitneck/${NECKS[neckIdx]}` : null,
          location_x: Math.random() * 0.8 + 0.1,
          location_y: Math.random() * 0.65 + 0.1,
        }),
      })
      if (res.status === 409) {
        setStatusMsg('That name is already taken!')
        return
      }
      if (!res.ok) throw new Error()
      const created = await res.json()
      setStatusMsg(`${created.name} joined the camp!`)
      setCreateName('')
      setJits(prev => [...prev, created])
    } catch {
      setStatusMsg('Error creating JIT.')
    }
  }

  function open(name) {
    setActiveWindow(name)
    setStatusMsg('')
    setSearchResults(null)
    setSearchQuery('')
  }

  return (
    <div className="desktop" style={{ backgroundImage: `url(${IMG_BG})` }}>

      {/* ── Desktop Icons ── */}
      <div className="desktop-icons">
        <button className="desktop-icon" onClick={() => open('search')}>
          <div className="icon-img"><img src={IMG_ICON_SEARCH} alt="Search" /></div>
          <span className="icon-label">SEARCH</span>
        </button>
        <button className="desktop-icon" onClick={() => open('creator')}>
          <div className="icon-img"><img src={IMG_ICON_CREATE} alt="Create" /></div>
          <span className="icon-label">CREATE</span>
        </button>
        <button className="desktop-icon" onClick={() => open('jitcamp')}>
          <div className="icon-img"><img src={IMG_ICON_JITS} alt="Jits" /></div>
          <span className="icon-label">JITS</span>
        </button>
      </div>

      {/* ── JIT_CAMP.exe ── */}
      {(activeWindow === 'jitcamp' || activeWindow === 'search') && (
        <Window
          title="JIT_CAMP.exe"
          onClose={() => setActiveWindow(null)}
          className="jitcamp-win"
          defaultX={170}
          defaultY={10}
        >
          <div
            className="jitcamp-content-wrapper"
            ref={viewportRef}
            onMouseDown={onViewportMouseDown}
          >
            {/* ── Scrollable world ── */}
            <div
              className="jitcamp-world"
              style={{ transform: `translate(${camera.x}px, ${camera.y}px)` }}
            >
              {/* Terrain tiles */}
              {tilemap.map((row, ry) =>
                row.map((tile, cx) => (
                  <img
                    key={`${ry}-${cx}`}
                    src={`/land/${tile}`}
                    alt=""
                    className="world-tile"
                    style={{ left: cx * TILE_SIZE, top: ry * TILE_SIZE }}
                    draggable={false}
                  />
                ))
              )}

              {/* JIT sprites */}
              {jits.map(jit => {
                const pos = jitPositions[jit.id]
                if (!pos) return null
                return (
                  <div
                    key={jit.id}
                    className={`jit-sprite${highlightedJit === jit.id ? ' jit-sprite-highlight' : ''}`}
                    style={{ left: pos.x, top: pos.y }}
                    title={jit.name}
                    onClick={e => handleJitClick(jit, e)}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <div className="jit-sprite-avatar">
                      {jit.body_url && <img src={jit.body_url} alt="" className="jit-sprite-layer" />}
                      {jit.neck_url && <img src={jit.neck_url} alt="" className="jit-sprite-layer" />}
                      {jit.face_url && <img src={jit.face_url} alt="" className="jit-sprite-layer" />}
                      {jit.hat_url  && <img src={jit.hat_url}  alt="" className="jit-sprite-layer" />}
                    </div>
                    <div className="jit-sprite-name">{jit.name}</div>
                  </div>
                )
              })}
            </div>

            {/* ── Activity feed — fixed to viewport bottom-left ── */}
            <div className="feed-box">
              {activities.length === 0 ? (
                <div className="w95-empty">No activities yet.</div>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="feed-row">
                    <span className="feed-bullet">▪</span>
                    <span>{a.description}</span>
                  </div>
                ))
              )}
            </div>

            {/* ── Search overlay — fixed to viewport top-left ── */}
            {activeWindow === 'search' && (
              <div className="search-overlay">
                <form onSubmit={handleSearch} className="search-bar-row">
                  <div className="search-glass-icon">
                    <img src={IMG_SEARCH_GLASS} alt="" />
                  </div>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={onSearchChange}
                    placeholder="Search JITs..."
                    className="w95-text-input"
                  />
                  <button type="button" className="search-x-btn" onClick={() => setActiveWindow('jitcamp')}>✕</button>
                </form>
                <div className="w95-inset-box search-results-area">
                  {searchResults === null ? (
                    <div className="w95-empty">Type a name to search</div>
                  ) : searchResults.length === 0 ? (
                    <div className="w95-empty">No JIT found with that name.</div>
                  ) : (
                    searchResults.map(jit => (
                      <div key={jit.id} className="search-result-row" onClick={() => panToJit(jit)}>
                        <span className="feed-bullet">▪</span>
                        <span>{jit.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Window>
      )}

      {/* ── JIT_CREATOR.exe ── */}
      {activeWindow === 'creator' && (
        <Window
          title="JIT_CREATOR.exe"
          onClose={() => setActiveWindow(null)}
          className="creator-win"
          defaultX={160}
          defaultY={45}
        >
          <div className="creator-layout">
            {/* Left arrows: cycle each layer backward */}
            <div className="avatar-col">
              {[
                [setHatIdx,  HATS,  'hat',  true],
                [setFaceIdx, FACES, 'face', true],
                [setNeckIdx, NECKS, 'neck', true],
                [setBodyIdx, BODIES,'body', false],
              ].map(([setter, list, label, optional]) => (
                <button
                  key={label}
                  className="avatar-card"
                  onClick={() => optional ? cycleLayer(setter, list, -1) : cycle(setter, list, -1)}
                  title={`Previous ${label}`}
                >
                  <img src={IMG_AVATAR} alt="◀" className="avatar-img" />
                </button>
              ))}
            </div>

            <div className="creator-center">
              {/* Layered avatar preview */}
              <div className="creator-mascot">
                <div className="avatar-composition">
                  <img src={`/jitbody/${BODIES[bodyIdx]}`} alt="" className="avatar-layer" />
                  {neckIdx >= 0 && <img src={`/jitneck/${NECKS[neckIdx]}`} alt="" className="avatar-layer" />}
                  {faceIdx >= 0 && <img src={`/jitface/${FACES[faceIdx]}`} alt="" className="avatar-layer" />}
                  {hatIdx  >= 0 && <img src={`/jithats/${HATS[hatIdx]}`}   alt="" className="avatar-layer" />}
                </div>
              </div>
              <div className="creator-bottom">
                <input
                  autoFocus
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate(e)}
                  placeholder="Name your Jit!"
                  className="creator-name-input"
                />
                <button className="creator-dice-btn" onClick={randomize} title="Randomize">
                  <img src={IMG_DICE} alt="Randomize" className="creator-dice" />
                </button>
              </div>
              {statusMsg && <div className="creator-status">{statusMsg}</div>}
              <button className="w95-btn creator-create-btn" onClick={handleCreate}>
                CREATE JIT
              </button>
            </div>

            {/* Right arrows: cycle each layer forward */}
            <div className="avatar-col avatar-col-right">
              {[
                [setHatIdx,  HATS,  'hat',  true],
                [setFaceIdx, FACES, 'face', true],
                [setNeckIdx, NECKS, 'neck', true],
                [setBodyIdx, BODIES,'body', false],
              ].map(([setter, list, label, optional]) => (
                <button
                  key={label}
                  className="avatar-card"
                  onClick={() => optional ? cycleLayer(setter, list, 1) : cycle(setter, list, 1)}
                  title={`Next ${label}`}
                >
                  <img src={IMG_AVATAR} alt="▶" className="avatar-img avatar-img-flip" />
                </button>
              ))}
            </div>
          </div>
        </Window>
      )}

      {/* ── JIT Profile Window ── */}
      {profileData && (
        <Window
          key={profileData.jit.id}
          title={profileData.jit.name}
          onClose={() => setProfileData(null)}
          className="profile-win"
          defaultX={profileData.x}
          defaultY={profileData.y}
        >
          <div className="profile-content">
            {/* Header: mini avatar + name + best friend */}
            <div className="profile-header">
              <div className="profile-avatar-mini">
                {profileData.jit.body_url && <img src={profileData.jit.body_url} alt="" className="profile-avatar-layer" />}
                {profileData.jit.neck_url && <img src={profileData.jit.neck_url} alt="" className="profile-avatar-layer" />}
                {profileData.jit.face_url && <img src={profileData.jit.face_url} alt="" className="profile-avatar-layer" />}
                {profileData.jit.hat_url  && <img src={profileData.jit.hat_url}  alt="" className="profile-avatar-layer" />}
              </div>
              <div className="profile-meta">
                <div className="profile-name">{profileData.details.name ?? profileData.jit.name}</div>
                <div className="profile-bff">
                  BFF: {profileData.details.best_friend?.name ?? 'None yet'}
                </div>
              </div>
            </div>

            {/* Activity log */}
            <div className="profile-log-label">Activity Log</div>
            <div className="w95-inset-box profile-log">
              {profileData.activities.length === 0 ? (
                <div className="w95-empty">No activities yet.</div>
              ) : (
                profileData.activities.map(a => (
                  <div key={a.id} className="feed-row">
                    <span className="feed-bullet">▪</span>
                    <span>{a.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Window>
      )}

      {/* ── Taskbar ── */}
      <div className="taskbar">
        <div className="taskbar-left">
          <button className="tb-icon-btn" title="Home">
            <img src={IMG_TB_HOME} alt="home" className="tb-img" />
          </button>
          <div className="tb-sep" />
          <button className="tb-icon-btn" title="Print">
            <img src={IMG_TB_PRINTER} alt="print" className="tb-img" />
          </button>
          <button className="tb-icon-btn" title="Favicon">
            <img src={IMG_TB_FAVICON} alt="favicon" className="tb-img" />
          </button>
          <button className="tb-icon-btn" title="Music">
            <img src={IMG_TB_MUSIC} alt="music" className="tb-img" />
          </button>
          {(activeWindow === 'jitcamp' || activeWindow === 'search') && (
            <>
              <div className="tb-sep" />
              <button className="tb-task-btn" onClick={() => setActiveWindow(null)}>JIT_CAMP.exe</button>
            </>
          )}
          {activeWindow === 'creator' && (
            <>
              <div className="tb-sep" />
              <button className="tb-task-btn" onClick={() => setActiveWindow(null)}>JIT_CREATOR.exe</button>
            </>
          )}
        </div>
        <div className="taskbar-clock">{time}</div>
      </div>
    </div>
  )
}
