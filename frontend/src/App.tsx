import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import JobDetail from './JobDetail'
import './App.css'

export function getCsrfToken(): string {
  return document.cookie.split('; ')
    .find(r => r.startsWith('csrftoken='))
    ?.split('=')[1] ?? ''
}

type JobSummary = { job_id: string; name: string; status: string; created_at: string }

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
                <th className="fw-medium small ps-3">Name</th>
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
                  <td className="small ps-3">{j.name || '—'}</td>
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

function UploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const navigate = useNavigate()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = new FormData(e.currentTarget)
    try {
      const res = await fetch('/upload/', {
        method: 'POST',
        headers: { 'X-CSRFToken': getCsrfToken() },
        body: data,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onSuccess()
      navigate(`/jobs/${json.job_id}/`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="card p-3">
      <h2 className="fs-6 fw-semibold mb-1">Phylogenetic Analysis</h2>
      <p className="small text-secondary mb-2">Upload a FASTA file or paste sequences to align and build a phylogenetic tree.</p>
      <form className="d-flex flex-column gap-2" onSubmit={handleSubmit}>
        <label className="form-label fw-medium small mb-0">
          Analysis name
          <input type="text" name="name" required className="form-control form-control-sm" />
        </label>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-medium small">Sequences</span>
            <div className="btn-group btn-group-sm ms-auto" role="group">
              <button type="button" className={`btn btn-outline-secondary${mode === 'file' ? ' active' : ''}`} onClick={() => setMode('file')}>File</button>
              <button type="button" className={`btn btn-outline-secondary${mode === 'text' ? ' active' : ''}`} onClick={() => setMode('text')}>Text</button>
            </div>
          </div>
          {mode === 'file' ? (
            <input type="file" name="fasta_file" accept=".fasta,.fa,.fna,.txt" className="form-control form-control-sm" />
          ) : (
            <textarea
              name="fasta_text"
              rows={6}
              placeholder={'>seq1\nATCGATCG...\n>seq2\nATCGATCG...'}
              className="form-control form-control-sm font-monospace"
              style={{ fontSize: '0.75rem' }}
            />
          )}
        </div>
        {error && <div className="alert alert-danger py-2 px-3 small mb-0">{error}</div>}
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm align-self-start">
          {loading ? 'Uploading…' : 'Analyse'}
        </button>
      </form>
    </div>
  )
}

function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const onSuccess = () => setRefreshKey(k => k + 1)

  return (
    <main className="container py-4">
      <header className="hero">
        <h1 className="fw-semibold mb-1">DNA Phylogenetics</h1>
        <p className="lead text-secondary mb-2">
          Align DNA sequences and build interactive phylogenetic trees from FASTA files.
        </p>
      </header>

      <UploadForm onSuccess={onSuccess} />
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
