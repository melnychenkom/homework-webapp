import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import JobDetail from './JobDetail'
import workflowImg from './assets/workflow.jpg'
import './App.css'

export function getCsrfToken(): string {
  return document.cookie.split('; ')
    .find(r => r.startsWith('csrftoken='))
    ?.split('=')[1] ?? ''
}

const MODELS: { value: string; label: string }[] = [
  { value: 'google_genai:gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
]

function AdvancedSettings() {
  return (
    <details className="advanced">
      <summary>Advanced settings</summary>
      <div className="advanced-fields">
        <div className="d-flex gap-3">
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" role="switch" name="filter_step" id="filter_step" />
            <label className="form-check-label small fw-medium" htmlFor="filter_step">Filter step</label>
          </div>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" role="switch" name="refine_step" id="refine_step" />
            <label className="form-check-label small fw-medium" htmlFor="refine_step">Refine step</label>
          </div>
        </div>
        <label className="form-label fw-medium small mb-0">
          Extraction model
          <select name="extraction_model" defaultValue={MODELS[0].value} className="form-select form-select-sm">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <label className="form-label fw-medium small mb-0">
          Filter model
          <select name="filter_model" defaultValue={MODELS[0].value} className="form-select form-select-sm">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <label className="form-label fw-medium small mb-0">
          Refine model
          <select name="refine_model" defaultValue={MODELS[0].value} className="form-select form-select-sm">
            {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
      </div>
    </details>
  )
}

type JobSummary = { job_id: string; target: string; job_type: string; status: string; created_at: string }

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge text-bg-warning',
  running: 'badge text-bg-primary',
  done:    'badge text-bg-success',
  failed:  'badge text-bg-danger',
}

function RecentJobs({ refreshKey }: { refreshKey: number }) {
  const [jobs, setJobs] = useState<JobSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setError(null)
    fetch('/jobs/')
      .then(r => r.json())
      .then(d => setJobs(d.jobs))
      .catch(() => setError('Could not load recent jobs.'))
  }, [refreshKey])

  return (
    <section className="mt-4">
      <h2 className="fs-6 fw-semibold mb-2">Recent jobs</h2>
      {error && <p className="text-muted small">{error}</p>}
      {!error && jobs === null && <p className="text-muted small">Loading…</p>}
      {!error && jobs !== null && jobs.length === 0 && <p className="text-muted small">No jobs yet.</p>}
      {!error && jobs !== null && jobs.length > 0 && (
        <div className="card">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="fw-medium small ps-3">Target</th>
                <th className="fw-medium small">Type</th>
                <th className="fw-medium small">Status</th>
                <th className="fw-medium small pe-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr
                  key={j.job_id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/jobs/${j.job_id}/`)}
                >
                  <td className="small ps-3">{j.target || '—'}</td>
                  <td className="small text-muted">{j.job_type === 'extract' ? 'LLM Extraction' : 'Pipeline'}</td>
                  <td><span className={STATUS_BADGE[j.status] ?? 'badge text-bg-secondary'}>{j.status}</span></td>
                  <td className="small text-muted pe-3">{new Date(j.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function PipelineForm({ onSuccess }: { onSuccess: () => void }) {
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
      onSuccess()
      navigate(`/jobs/${json.job_id}/`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="card p-3">
      <h2 className="fs-6 fw-semibold mb-1">Pipeline</h2>
      <p className="small text-secondary mb-2">Provide a PDB structure and a research article. Runs filter → LLM extraction → geometric mapping → volumetric pocket construction via fpocket.</p>
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
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

function ExtractForm({ onSuccess }: { onSuccess: () => void }) {
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
      onSuccess()
      navigate(`/jobs/${json.job_id}/`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="card p-3">
      <h2 className="fs-6 fw-semibold mb-1">LLM Extraction</h2>
      <p className="small text-secondary mb-2">Article-only extraction. The LLM reads the paper and outputs structured residue-level pocket annotations without geometric analysis.</p>
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
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

function HomePage() {
  const [tab, setTab] = useState<'pipeline' | 'extract'>('pipeline')
  const [refreshKey, setRefreshKey] = useState(0)
  const onSuccess = () => setRefreshKey(k => k + 1)

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

      <ul className="nav nav-underline mb-3">
        <li className="nav-item">
          <button className={`nav-link${tab === 'pipeline' ? ' active' : ''}`} onClick={() => setTab('pipeline')}>
            Pipeline
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link${tab === 'extract' ? ' active' : ''}`} onClick={() => setTab('extract')}>
            LLM Extraction
          </button>
        </li>
      </ul>

      {tab === 'pipeline' ? <PipelineForm onSuccess={onSuccess} /> : <ExtractForm onSuccess={onSuccess} />}

      <RecentJobs refreshKey={refreshKey} />
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
