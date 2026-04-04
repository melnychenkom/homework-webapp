import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import JobDetail from './JobDetail'
import './App.css'

export function getCsrfToken(): string {
  return document.cookie.split('; ')
    .find(r => r.startsWith('csrftoken='))
    ?.split('=')[1] ?? ''
}

interface Pocket {
  id: number
  score: number
  residues: string[]
}

interface ExtractResult {
  status: string
  target: string
  pockets: Pocket[]
}

const DEFAULT_MODEL = 'google_genai:gemini-2.5-flash'

function AdvancedSettings() {
  return (
    <details className="advanced">
      <summary>Advanced settings</summary>
      <div className="advanced-fields">
        <label>
          Filter step
          <select name="filter_step" defaultValue="true">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label>
          Refine step
          <select name="refine_step" defaultValue="true">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label>
          Extraction model
          <input type="text" name="extraction_model" defaultValue={DEFAULT_MODEL} />
        </label>
        <label>
          Filter model
          <input type="text" name="filter_model" defaultValue={DEFAULT_MODEL} />
        </label>
        <label>
          Refine model
          <input type="text" name="refine_model" defaultValue={DEFAULT_MODEL} />
        </label>
      </div>
    </details>
  )
}

function PipelineForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = new FormData(e.currentTarget)
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
      setError(err instanceof Error ? err.message : 'Unknown error')
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
        <AdvancedSettings />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit pipeline'}
        </button>
      </form>
    </div>
  )
}

function ExtractForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractResult | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const data = new FormData(e.currentTarget)
    try {
      const res = await fetch('/extract/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCsrfToken() },
        body: data,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Extraction failed')
      setResult(json as ExtractResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
        <AdvancedSettings />
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
