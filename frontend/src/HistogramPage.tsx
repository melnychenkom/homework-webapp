import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Nucleotides { A: number; C: number; G: number; T: number }

interface Sequence {
  id: string
  length: number
  sequence: string
  nucleotides: Nucleotides
}

interface HistogramData {
  sequences: Sequence[]
  plot_svg: string
  r_code: string
}

export default function HistogramPage() {
  const [data, setData] = useState<HistogramData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/histogram/data/')
      const json = await res.json()
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Server error')
      setData(json as HistogramData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData() }, [])

  return (
    <main className="container py-4">
      <Link to="/" className="d-inline-block mb-3 small text-decoration-none">← Home</Link>
      <div className="d-flex align-items-center gap-3 mb-4">
        <h1 className="h4 fw-semibold mb-0">Sequence Length Histogram</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => void fetchData()}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}
      {loading && !data && <p className="text-muted small">Running R script…</p>}

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center py-2">
          <span className="small fw-semibold">R Code</span>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => void navigator.clipboard.writeText(data?.r_code ?? '').catch(() => {})}
          >
            Copy
          </button>
        </div>
        <pre
          className="card-body font-monospace small mb-0"
          style={{ overflowX: 'auto', whiteSpace: 'pre', maxHeight: '400px', overflowY: 'auto' }}
        >{data?.r_code ?? ''}</pre>
      </div>

      {data && (
        <>
          <div className="card mb-4 p-3">
            <h2 className="fs-6 fw-semibold mb-3">Histogram</h2>
            <img
              src={`data:image/svg+xml,${encodeURIComponent(data.plot_svg)}`}
              alt="Sequence Length Histogram"
              className="img-fluid"
            />
          </div>

          <div className="card p-3">
            <h2 className="fs-6 fw-semibold mb-2">
              Generated sequences
              <span className="text-muted fw-normal ms-2 small">{data.sequences.length} sequences</span>
            </h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th className="fw-medium small">ID</th>
                    <th className="fw-medium small">Length</th>
                    <th className="fw-medium small">A</th>
                    <th className="fw-medium small">C</th>
                    <th className="fw-medium small">G</th>
                    <th className="fw-medium small">T</th>
                    <th className="fw-medium small">Sequence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sequences.map(seq => (
                    <tr key={seq.id}>
                      <td className="small">{seq.id}</td>
                      <td className="small">{seq.length}</td>
                      <td className="small">{seq.nucleotides.A}</td>
                      <td className="small">{seq.nucleotides.C}</td>
                      <td className="small">{seq.nucleotides.G}</td>
                      <td className="small">{seq.nucleotides.T}</td>
                      <td className="font-monospace small" style={{ wordBreak: 'break-all' }}>{seq.sequence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
