import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import JobDetail from './JobDetail'
import workflowImg from './assets/workflow.jpg'
import './App.css'

export function getCsrfToken(): string {
  return document.cookie.split('; ')
    .find(r => r.startsWith('csrftoken='))
    ?.split('=')[1] ?? ''
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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
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
  const navigate = useNavigate()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = new FormData(e.currentTarget)
    try {
      const res = await fetch('/extract/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCsrfToken() },
        body: data,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Extraction failed')
      navigate(`/jobs/${json.job_id}/`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
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
          {loading ? 'Submitting…' : 'Extract'}
        </button>
      </form>
    </div>
  )
}

function HomePage() {
  return (
    <main>
      <header className="hero">
        <h1>Pocket Extractor</h1>
        <p className="hero-sub">
          Literature-driven prioritization of protein binding pockets using LLMs and geometric analysis.
        </p>
        <p className="hero-desc">
          Combines <a href="https://github.com/Discngine/fpocket" target="_blank" rel="noreferrer">fpocket</a> geometric
          pocket detection with large language models to validate candidate pockets against published experimental data.
          LLMs extract residue-level binding site annotations from research articles; these are matched to fpocket
          alpha sphere clusters and used to construct volumetric pocket representations.
        </p>
        <p className="hero-cite">
          Based on:{' '}
          <a href="https://academic.oup.com/bioinformatics/article/41/8/btaf449/8225722" target="_blank" rel="noreferrer">
            Leveraging large language models for literature-driven prioritization of protein binding pockets
          </a>
          {' '}— <em>Bioinformatics</em>, 2025.
        </p>
      </header>

      <figure className="workflow-diagram">
        <img src={workflowImg} alt="Pocket Extractor workflow diagram" />
      </figure>

      <section className="workflows">
        <div className="workflow">
          <h3>Full Pipeline</h3>
          <p>Provide a PDB structure and a research article. Runs filter → LLM extraction → geometric mapping → volumetric pocket construction via fpocket.</p>
        </div>
        <div className="workflow">
          <h3>LLM Extraction</h3>
          <p>Article-only extraction. The LLM reads the paper and outputs structured residue-level pocket annotations without geometric analysis.</p>
        </div>
      </section>

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
