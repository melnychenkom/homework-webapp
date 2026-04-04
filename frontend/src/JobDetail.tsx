import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Clipboard, ClipboardCheck, FileJson, FileCode2 } from 'lucide-react'
import type { JobFiles } from './MolstarViewer'

const MolstarViewer = lazy(() => import('./MolstarViewer'))

const POLL_INTERVAL = 5000

type JobStatus = 'pending' | 'running' | 'done' | 'failed'

const TERMINAL: JobStatus[] = ['done', 'failed']

const STATUS_CLASS: Record<JobStatus, string> = {
  pending: 'badge text-bg-warning',
  running: 'badge text-bg-primary',
  done:    'badge text-bg-success',
  failed:  'badge text-bg-danger',
}

interface Residue {
  chain_id: string | null
  res_name: string
  res_id: number
}

interface Pocket {
  pocket_id: string
  description: string
  amino_acids: Residue[]
}

interface PocketResult {
  pockets: Pocket[]
  output_path?: string    // pipeline only
  is_relevant?: boolean   // extract only
}

interface Job {
  job_id: string
  target: string
  article_filename: string
  job_type: string
  created_at: string
  status: JobStatus
  pockets_json: PocketResult | null
  output_path: string
  error: string
  poll_error: string | null
}

function RunInfoCard({ job, jobId }: { job: Job; jobId: string }) {
  return (
    <div className="card bg-body-tertiary mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h1 className="h5 mb-0">{job.target}</h1>
            <p className="text-muted small mb-0">{job.article_filename}</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-secondary">
              {job.job_type === 'extract' ? 'LLM Extraction' : 'Pipeline'}
            </span>
            <span className={STATUS_CLASS[job.status]}>{job.status}</span>
            {!TERMINAL.includes(job.status) && (
              <span className="text-muted small">Polling every 5s…</span>
            )}
          </div>
        </div>
        <p className="text-muted small mb-0">
          Submitted {new Date(job.created_at).toLocaleString()}
          {' · '}
          <span className="font-monospace">{jobId}</span>
        </p>
        {job.poll_error && (
          <div className="alert alert-warning py-1 px-2 small mt-2 mb-0">
            Warning: {job.poll_error}
          </div>
        )}
        {job.status === 'failed' && job.error && (
          <div className="alert alert-danger py-1 px-2 small mt-2 mb-0">
            {job.error}
          </div>
        )}
        {job.status === 'done' && job.job_type !== 'extract' && (
          <div className="d-flex gap-2 mt-3">
            <a
              href={`/jobs/${jobId}/files/config.json/`}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            >
              <FileJson size={14} /> Config JSON
            </a>
            <a
              href={`/jobs/${jobId}/files/pockets/pocket0.mol2/`}
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            >
              <FileCode2 size={14} /> Pocket MOL2
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function PocketCard({ pocket }: { pocket: Pocket }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(JSON.stringify(pocket, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="card p-3">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h4 className="small fw-semibold mb-0">{pocket.pocket_id}</h4>
        <button
          className="btn btn-outline-secondary btn-sm py-0 px-2 d-flex align-items-center"
          style={{ minWidth: 28 }}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy JSON'}
        >
          {copied ? <ClipboardCheck size={13} /> : <Clipboard size={13} />}
        </button>
      </div>
      <p className="small text-secondary mb-2">{pocket.description}</p>
      <div className="d-flex flex-wrap gap-1">
        {pocket.amino_acids.map((r, i) => (
          <span
            key={i}
            className="badge text-bg-light border text-dark font-monospace"
            style={{ fontSize: '0.7rem' }}
          >
            {r.chain_id ? `${r.chain_id}:` : ''}{r.res_name}{r.res_id}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [viewerFiles, setViewerFiles] = useState<JobFiles | null>(null)

  useEffect(() => {
    if (job?.status === 'done' && job.job_type !== 'extract' && !viewerFiles) {
      fetch(`/jobs/${jobId}/files/`)
        .then(r => r.ok ? r.json() as Promise<JobFiles> : null)
        .then(data => { if (data) setViewerFiles(data) })
        .catch(() => {})
    }
  }, [job?.status, job?.job_type])

  async function fetchStatus() {
    try {
      const res = await fetch(`/jobs/${jobId}/status/`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json() as Job
      setJob(data)
      if (TERMINAL.includes(data.status)) {
        clearInterval(intervalRef.current ?? undefined)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      clearInterval(intervalRef.current ?? undefined)
    }
  }

  useEffect(() => {
    void fetchStatus()
    intervalRef.current = setInterval(() => void fetchStatus(), POLL_INTERVAL)
    return () => clearInterval(intervalRef.current ?? undefined)
  }, [jobId])

  const pockets = job?.pockets_json?.pockets ?? []

  return (
    <main className="container py-4">
      <Link to="/" className="d-inline-block mb-3 small text-decoration-none">← New job</Link>

      {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}
      {!job && !error && <p className="text-muted small">Loading…</p>}

      {job && (
        <>
          <RunInfoCard job={job} jobId={jobId!} />

          {job.status === 'done' && pockets.length > 0 && (
            <>
              <h2 className="fs-6 fw-semibold mb-2">Pockets ({pockets.length})</h2>
              <div className="d-flex flex-column gap-2 mb-3">
                {pockets.map(pocket => (
                  <PocketCard key={pocket.pocket_id} pocket={pocket} />
                ))}
              </div>
            </>
          )}
          {job.status === 'done' && pockets.length === 0 && (
            <p className="text-muted small">No pockets found.</p>
          )}

          {viewerFiles && (
            <Suspense fallback={<p className="text-muted small">Loading viewer…</p>}>
              <MolstarViewer jobId={jobId!} files={viewerFiles} height={520} />
            </Suspense>
          )}
        </>
      )}
    </main>
  )
}
