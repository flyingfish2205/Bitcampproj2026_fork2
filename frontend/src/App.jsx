import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
const initialCreateState = { name: '' }

function App() {
  const [view, setView] = useState('home')
  const [searchName, setSearchName] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [tamagotchis, setTamagotchis] = useState([])
  const [createData, setCreateData] = useState(initialCreateState)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (view === 'home') {
      fetchTamagotchis()
      setSearchResult(null)
      setError('')
      setMessage('')
    }
  }, [view])

  async function fetchTamagotchis() {
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_BASE}/api/tamagotchis`)
      if (!response.ok) throw new Error('Unable to load tamagotchis')
      const data = await response.json()
      setTamagotchis(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setTamagotchis([])
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!searchName.trim()) {
      setError('Please enter a name to search.')
      setSearchResult(null)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/tamagotchis`)
      if (!response.ok) throw new Error('Unable to search tamagotchi')
      const data = await response.json()
      const match = data.find((tama) =>
        tama.name.toLowerCase() === searchName.trim().toLowerCase(),
      )
      setSearchResult(match || null)
      if (!match) setError('No tamagotchi found with that name.')
    } catch (err) {
      setError(err.message)
      setSearchResult(null)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!createData.name.trim()) {
      setError('Name is required to create a tamagotchi.')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/tamagotchis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createData.name.trim() }),
      })
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body?.error || 'Unable to create tamagotchi')
      }

      const created = await response.json()
      setMessage(`Created tamagotchi: ${created.name}`)
      setCreateData(initialCreateState)
      if (view === 'home') fetchTamagotchis()
    } catch (err) {
      setError(err.message)
    }
  }

  const navItems = [
    { id: 'search', label: 'Search', description: 'Find a tamagotchi by name' },
    { id: 'create', label: 'Create', description: 'Add a new tamagotchi' },
    { id: 'home', label: 'Home', description: 'View all tamagotchis' },
  ]

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Tamagotchi Dashboard</p>
          <h1>Search · Create · Browse</h1>
          <p className="subtitle">
            Use the main buttons below to navigate the tamagotchi interface.
          </p>
        </div>
      </header>

      <section className="action-bar">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-card ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <span className="icon-placeholder" aria-hidden="true">
              {item.label.charAt(0)}
            </span>
            <div>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </div>
          </button>
        ))}
      </section>

      <section className="panel">
        {error && <div className="status error">{error}</div>}
        {message && <div className="status success">{message}</div>}

        {view === 'home' && (
          <div className="panel-card">
            <div className="panel-title">
              <h2>All Tamagotchis</h2>
              <button type="button" onClick={fetchTamagotchis} className="secondary-button">
                Refresh
              </button>
            </div>
            {tamagotchis.length === 0 ? (
              <p className="empty-state">No tamagotchis found yet.</p>
            ) : (
              <ul className="tama-list">
                {tamagotchis.map((tama) => (
                  <li key={tama.id} className="tama-item">
                    <span>{tama.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === 'search' && (
          <div className="panel-card">
            <h2>Search by Name</h2>
            <form className="form-grid" onSubmit={handleSearch}>
              <label className="form-field">
                <span>Name</span>
                <input
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder="Enter tamagotchi name"
                />
              </label>
              <button type="submit" className="primary-button">
                Search
              </button>
            </form>
            {searchResult ? (
              <div className="tama-card">
                <strong>{searchResult.name}</strong>
                <p>ID: {searchResult.id}</p>
              </div>
            ) : (
              searchName.trim() && <p className="empty-state">No matching tamagotchi found.</p>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="panel-card">
            <h2>Create a Tamagotchi</h2>
            <form className="form-grid" onSubmit={handleCreate}>
              <label className="form-field">
                <span>Name</span>
                <input
                  value={createData.name}
                  onChange={(event) => setCreateData({ name: event.target.value })}
                  placeholder="New tamagotchi name"
                />
              </label>
              <button type="submit" className="primary-button">
                Create
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
