import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

const POLL_INTERVAL = 5000

type JobStatus = 'pending' | 'running' | 'done' | 'failed'

const TERMINAL: JobStatus[] = ['done', 'failed']

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
    <main>
      <Link to="/" className="back-link">← New job</Link>
      <div className="card job-card">
        {error && <p className="error">{error}</p>}
        {!job && !error && <p className="muted">Loading…</p>}
        {job && (
          <>
            <div className="job-meta">
              <h1>{job.target}</h1>
              <p className="muted">{job.article_filename} · submitted {new Date(job.created_at).toLocaleString()}</p>
            </div>
            <div className="status-row">
              <span className={`status status--${job.status}`}>{job.status}</span>
              {!TERMINAL.includes(job.status) && <span className="muted">Polling every 5s…</span>}
            </div>
            {job.poll_error && (
              <p className="error">Warning: {job.poll_error}</p>
            )}
            {job.status === 'done' && job.pockets_json && (
              <div className="result">
                <h3>Pockets</h3>
                <pre>{JSON.stringify(job.pockets_json, null, 2)}</pre>
              </div>
            )}
            {job.status === 'failed' && job.error && (
              <p className="error">{job.error}</p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
