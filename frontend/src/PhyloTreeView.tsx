import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – phylocanvas.gl ships CJS without bundled types
import PhylocanvasGL from "@phylocanvas/phylocanvas.gl";

export interface Trees {
  nj: string | null;
  upgma: string | null;
  ml: string | null;
}

type Method = "nj" | "upgma" | "ml";
type Layout = "rc" | "cr";

const METHOD_LABELS: Record<Method, string> = { nj: "NJ", upgma: "UPGMA", ml: "ML" };

export default function PhyloTreeView({ trees }: { trees: Trees }) {
  const [method, setMethod] = useState<Method>("nj");
  const [layout, setLayout] = useState<Layout>("rc");
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<ReturnType<typeof PhylocanvasGL> | null>(null);

  const newick = trees[method];

  useEffect(() => {
    if (!containerRef.current || !newick) return;
    treeRef.current?.destroy();
    treeRef.current = new PhylocanvasGL(containerRef.current, {
      source: newick,
      size: {
        width: containerRef.current.getBoundingClientRect().width || 800,
        height: 420,
      },
      type: layout,
    });
    return () => {
      treeRef.current?.destroy();
      treeRef.current = null;
    };
  }, [newick, layout]);

  const downloadHref = newick
    ? `data:text/plain;charset=utf-8,${encodeURIComponent(newick)}`
    : "#";

  return (
    <div className="card p-3 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h2 className="fs-6 fw-semibold mb-0">Phylogenetic tree</h2>
        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group btn-group-sm">
            {(["rc", "cr"] as Layout[]).map((l) => (
              <button
                key={l}
                className={`btn btn-outline-secondary${layout === l ? " active" : ""}`}
                onClick={() => setLayout(l)}
              >
                {l === "rc" ? "Rectangular" : "Circular"}
              </button>
            ))}
          </div>
          {newick && (
            <a
              href={downloadHref}
              download={`tree_${method}.nwk`}
              className="btn btn-sm btn-outline-primary"
            >
              Download Newick
            </a>
          )}
        </div>
      </div>

      <ul className="nav nav-tabs mb-2">
        {(["nj", "upgma", "ml"] as Method[]).map((m) => (
          <li key={m} className="nav-item">
            <button
              className={`nav-link${method === m ? " active" : ""}${trees[m] === null ? " disabled text-muted" : ""}`}
              onClick={() => trees[m] !== null && setMethod(m)}
            >
              {METHOD_LABELS[m]}
            </button>
          </li>
        ))}
      </ul>

      {newick ? (
        <div ref={containerRef} style={{ width: "100%", height: "420px" }} />
      ) : (
        <p className="text-muted small mb-0">Not available</p>
      )}
    </div>
  );
}
