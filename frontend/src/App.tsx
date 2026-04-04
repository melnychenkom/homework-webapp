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
        <label className="form-label fw-medium small mb-0">
          Filter step
          <select name="filter_step" defaultValue="true" className="form-select form-select-sm">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label className="form-label fw-medium small mb-0">
          Refine step
          <select name="refine_step" defaultValue="true" className="form-select form-select-sm">
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label className="form-label fw-medium small mb-0">
          Extraction model
          <input type="text" name="extraction_model" defaultValue={DEFAULT_MODEL} className="form-control form-control-sm" />
        </label>
        <label className="form-label fw-medium small mb-0">
          Filter model
          <input type="text" name="filter_model" defaultValue={DEFAULT_MODEL} className="form-control form-control-sm" />
        </label>
        <label className="form-label fw-medium small mb-0">
          Refine model
          <input type="text" name="refine_model" defaultValue={DEFAULT_MODEL} className="form-control form-control-sm" />
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
    <div className="card p-3 h-100">
      <h2 className="fs-6 fw-semibold mb-0">Pipeline</h2>
      <p className="small text-muted mb-0">Full pipeline — PDB structure + article</p>
      <form className="d-flex flex-column gap-2" onSubmit={handleSubmit}>
        <label className="form-label fw-medium small mb-0">
          Target
          <input type="text" name="target" required className="form-control form-control-sm" />
        </label>
        <label className="form-label fw-medium small mb-0">
          PDB file
          <input type="file" name="pdb_file" required className="form-control form-control-sm" />
        </label>
        <label className="form-label fw-medium small mb-0">
          Article file
          <input type="file" name="article_file" required className="form-control form-control-sm" />
        </label>
        {error && <div className="alert alert-danger py-2 px-3 small mb-0">{error}</div>}
        <AdvancedSettings />
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm align-self-start">
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
    <div className="card p-3 h-100">
      <h2 className="fs-6 fw-semibold mb-0">LLM Extraction</h2>
      <p className="small text-muted mb-0">Extract pockets from article only</p>
      <form className="d-flex flex-column gap-2" onSubmit={handleSubmit}>
        <label className="form-label fw-medium small mb-0">
          Target
          <input type="text" name="target" required className="form-control form-control-sm" />
        </label>
        <label className="form-label fw-medium small mb-0">
          Article file
          <input type="file" name="article_file" required className="form-control form-control-sm" />
        </label>
        {error && <div className="alert alert-danger py-2 px-3 small mb-0">{error}</div>}
        <AdvancedSettings />
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm align-self-start">
          {loading ? 'Submitting…' : 'Extract'}
        </button>
      </form>
    </div>
  )
}

function HomePage() {
  return (
    <main className="container py-4">
      <header className="hero">
        <h1 className="fw-semibold mb-1">Pocket Extractor</h1>
        <p className="lead text-secondary mb-2">
          Literature-driven prioritization of protein binding pockets using LLMs and geometric analysis.
        </p>
        <p className="hero-desc text-muted small mb-2">
          Combines <a href="https://github.com/Discngine/fpocket" target="_blank" rel="noreferrer">fpocket</a> geometric
          pocket detection with large language models to validate candidate pockets against published experimental data.
          LLMs extract residue-level binding site annotations from research articles; these are matched to fpocket
          alpha sphere clusters and used to construct volumetric pocket representations.
        </p>
        <p className="hero-cite text-muted">
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

      <section className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card p-3 h-100">
            <h3 className="fs-6 fw-semibold mb-1">Full Pipeline</h3>
            <p className="small text-secondary mb-0">Provide a PDB structure and a research article. Runs filter → LLM extraction → geometric mapping → volumetric pocket construction via fpocket.</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3 h-100">
            <h3 className="fs-6 fw-semibold mb-1">LLM Extraction</h3>
            <p className="small text-secondary mb-0">Article-only extraction. The LLM reads the paper and outputs structured residue-level pocket annotations without geometric analysis.</p>
          </div>
        </div>
      </section>

      <div className="row g-3">
        <div className="col-md-6">
          <PipelineForm />
        </div>
        <div className="col-md-6">
          <ExtractForm />
        </div>
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
