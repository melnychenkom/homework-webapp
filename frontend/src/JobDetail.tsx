import { useState, useEffect, useRef, type JSX } from "react";
import { useParams, Link } from "react-router-dom";
import PhyloTreeView, { type Trees } from "./PhyloTreeView";

const POLL_INTERVAL = 5000;
const BLOCK = 10;
const COLS_PER_LINE = 80;

type JobStatus = "pending" | "running" | "done" | "failed";

const TERMINAL: JobStatus[] = ["done", "failed"];

const STATUS_CLASS: Record<JobStatus, string> = {
  pending: "badge text-bg-warning",
  running: "badge text-bg-primary",
  done: "badge text-bg-success",
  failed: "badge text-bg-danger",
};

interface AlignedSeq {
  id: string;
  description: string;
  aligned: string;
}

interface Results {
  sequences: AlignedSeq[];
  alignment_length: number;
  sequence_count: number;
  trees?: Trees | null;
}

interface Job {
  job_id: string;
  name: string;
  fasta_filename: string;
  created_at: string;
  status: JobStatus;
  results_json: Results | null;
  output_path: string;
  error: string;
}

function RunInfoCard({ job, jobId }: { job: Job; jobId: string }) {
  return (
    <div className="card bg-body-tertiary mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h1 className="h5 mb-0">{job.name}</h1>
            <p className="text-muted small mb-0">{job.fasta_filename}</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className={STATUS_CLASS[job.status]}>{job.status}</span>
            {!TERMINAL.includes(job.status) && (
              <span className="text-muted small">Polling every 5s…</span>
            )}
          </div>
        </div>
        <p className="text-muted small mb-0">
          Submitted {new Date(job.created_at).toLocaleString()}
          {" · "}
          <span className="font-monospace">{jobId}</span>
        </p>
        {job.status === "failed" && job.error && (
          <div className="alert alert-danger py-1 px-2 small mt-2 mb-0">
            {job.error}
          </div>
        )}
      </div>
    </div>
  );
}

function AlignmentView({ results }: { results: Results }) {
  const idWidth = Math.max(...results.sequences.map((s) => s.id.length));

  const lines: JSX.Element[] = [];
  for (let col = 0; col < results.alignment_length; col += COLS_PER_LINE) {
    const end = Math.min(col + COLS_PER_LINE, results.alignment_length);
    lines.push(
      <div key={col} className="mb-3">
        <div
          className="text-muted small mb-1"
          style={{ paddingLeft: `${idWidth + 2}ch` }}
        >
          {Array.from({ length: Math.ceil((end - col) / BLOCK) }, (_, i) => {
            const pos = col + i * BLOCK + BLOCK;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: `${BLOCK}ch`,
                  textAlign: "right",
                }}
              >
                {pos}
              </span>
            );
          })}
        </div>
        {results.sequences.map((seq) => (
          <div key={seq.id} className="d-flex align-items-baseline gap-1">
            <span
              className="text-muted small text-end flex-shrink-0"
              style={{ width: `${idWidth}ch`, fontFamily: "monospace" }}
              title={seq.description}
            >
              {seq.id}
            </span>
            <span className="font-monospace small">
              &nbsp;{seq.aligned.slice(col, end)}
            </span>
          </div>
        ))}
      </div>,
    );
  }

  return (
    <div className="card p-3">
      <h2 className="fs-6 fw-semibold mb-1">
        Multiple sequence alignment
        <span className="text-muted fw-normal ms-2 small">
          {results.sequence_count} sequences · {results.alignment_length} bp
        </span>
      </h2>
      <div className="mt-2" style={{ overflowY: "auto", maxHeight: "400px" }}>
        {lines}
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch(`/jobs/${jobId}/status/`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as Job;
      setJob(data);
      if (TERMINAL.includes(data.status)) {
        clearInterval(intervalRef.current ?? undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      clearInterval(intervalRef.current ?? undefined);
    }
  }

  useEffect(() => {
    void fetchStatus();
    intervalRef.current = setInterval(() => void fetchStatus(), POLL_INTERVAL);
    return () => clearInterval(intervalRef.current ?? undefined);
  }, [jobId]);

  return (
    <main className="container py-4">
      <Link to="/" className="d-inline-block mb-3 small text-decoration-none">
        ← New job
      </Link>

      {error && (
        <div className="alert alert-danger py-2 px-3 small">{error}</div>
      )}
      {!job && !error && <p className="text-muted small">Loading…</p>}

      {job && (
        <>
          <RunInfoCard job={job} jobId={jobId!} />
          {job.status === "done" && job.results_json && (
            <>
              <AlignmentView results={job.results_json} />
              {job.results_json.trees && (
                <PhyloTreeView trees={job.results_json.trees} />
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
