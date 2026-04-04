import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

const POLL_INTERVAL = 5000

type JobStatus = 'pending' | 'running' | 'done' | 'failed'

const TERMINAL: JobStatus[] = ['done', 'failed']

const STATUS_CLASS: Record<JobStatus, string> = {
  pending: 'badge text-bg-warning',
  running: 'badge text-bg-primary',
  done:    'badge text-bg-success',
  failed:  'badge text-bg-danger',
}

interface Job {
  job_id: string
  target: string
  article_filename: string
  created_at: string
  status: JobStatus
  pockets_json: unknown
  output_path: string
  error: string
  poll_error: string | null
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  return (
    <main className="container py-4">
      <Link to="/" className="d-inline-block mb-3 small text-decoration-none">← New job</Link>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-body d-flex flex-column gap-3">
          {error && <div className="alert alert-danger py-2 px-3 small mb-0">{error}</div>}
          {!job && !error && <p className="text-muted small mb-0">Loading…</p>}
          {job && (
            <>
              <div>
                <h1 className="h5 mb-1">{job.target}</h1>
                <p className="text-muted small mb-0">{job.article_filename} · submitted {new Date(job.created_at).toLocaleString()}</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className={STATUS_CLASS[job.status]}>{job.status}</span>
                {!TERMINAL.includes(job.status) && <span className="text-muted small">Polling every 5s…</span>}
              </div>
              {job.poll_error && (
                <div className="alert alert-warning py-2 px-3 small mb-0">Warning: {job.poll_error}</div>
              )}
              {job.status === 'done' && job.pockets_json && (
                <div className="border-top pt-3">
                  <h3 className="small fw-semibold mb-2">Pockets</h3>
                  <pre className="small bg-light p-3 rounded">{JSON.stringify(job.pockets_json, null, 2)}</pre>
                </div>
              )}
              {job.status === 'failed' && job.error && (
                <div className="alert alert-danger py-2 px-3 small mb-0">{job.error}</div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
