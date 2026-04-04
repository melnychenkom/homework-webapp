import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import JobDetail from './JobDetail.jsx'
import './App.css'

export function getCsrfToken() {
  return document.cookie.split('; ')
    .find(r => r.startsWith('csrftoken='))
    ?.split('=')[1] ?? ''
}

function PipelineForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = new FormData(e.target)
    try {
      const res = await fetch('/pipeline/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCsrfToken() },
        body: data,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')
      navigate(`/jobs/${json.job_id}/`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Pipeline</h2>
      <p className="card-desc">Full pipeline — PDB structure + article</p>
      <form onSubmit={handleSubmit}>
        <label>
          Target
          <input type="text" name="target" required />
        </label>
        <label>
          PDB file
          <input type="file" name="pdb_file" required />
        </label>
        <label>
          Article file
          <input type="file" name="article_file" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit pipeline'}
        </button>
      </form>
    </div>
  )
}

function ExtractForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const data = new FormData(e.target)
    try {
      const res = await fetch('/extract/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCsrfToken() },
        body: data,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Extraction failed')
      setResult(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>LLM Extraction</h2>
      <p className="card-desc">Extract pockets from article only</p>
      <form onSubmit={handleSubmit}>
        <label>
          Target
          <input type="text" name="target" required />
        </label>
        <label>
          Article file
          <input type="file" name="article_file" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Extracting…' : 'Extract'}
        </button>
      </form>
      {result && (
        <div className="result">
          <h3>Result — {result.target}</h3>
          <ul>
            {result.pockets.map(p => (
              <li key={p.id}>
                Pocket {p.id} — score {p.score} — {p.residues.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function HomePage() {
  return (
    <main>
      <h1>Pocket Extractor</h1>
      <div className="forms">
        <PipelineForm />
        <ExtractForm />
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/jobs/:jobId/" element={<JobDetail />} />
    </Routes>
  )
}
