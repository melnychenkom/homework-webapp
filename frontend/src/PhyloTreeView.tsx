import { useState, useMemo } from "react";
import Tree from "react-d3-tree";
import type { RawNodeDatum } from "react-d3-tree";

export interface Trees {
  nj: string | null;
  upgma: string | null;
  ml: string | null;
}

type Method = "nj" | "upgma" | "ml";
type Orientation = "horizontal" | "vertical";

const METHOD_LABELS: Record<Method, string> = { nj: "NJ", upgma: "UPGMA", ml: "ML" };

function parseNewick(s: string): RawNodeDatum {
  let pos = 0;
  const str = s.trim().replace(/;$/, "");

  function parseNode(): RawNodeDatum {
    const children: RawNodeDatum[] = [];
    if (str[pos] === "(") {
      pos++;
      do {
        children.push(parseNode());
      } while (str[pos] === "," && ++pos);
      pos++; // skip )
    }
    const nameStart = pos;
    while (pos < str.length && !"(),:;".includes(str[pos])) pos++;
    const name = str.slice(nameStart, pos);
    const node: RawNodeDatum = { name, ...(children.length ? { children } : {}) };
    if (str[pos] === ":") {
      pos++;
      const lenStart = pos;
      while (pos < str.length && !"(),;".includes(str[pos])) pos++;
      const len = parseFloat(str.slice(lenStart, pos));
      if (!isNaN(len)) node.attributes = { length: len.toFixed(4) };
    }
    return node;
  }

  return parseNode();
}

export default function PhyloTreeView({ trees }: { trees: Trees }) {
  const [method, setMethod] = useState<Method>("nj");
  const [orientation, setOrientation] = useState<Orientation>("horizontal");

  const newick = trees[method];

  const treeData = useMemo(() => {
    if (!newick) return null;
    try {
      return parseNewick(newick);
    } catch {
      return null;
    }
  }, [newick]);

  const downloadHref = newick
    ? `data:text/plain;charset=utf-8,${encodeURIComponent(newick)}`
    : "#";

  return (
    <div className="card p-3 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <h2 className="fs-6 fw-semibold mb-0">Phylogenetic tree</h2>
        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group btn-group-sm">
            {(["horizontal", "vertical"] as Orientation[]).map((o) => (
              <button
                key={o}
                className={`btn btn-outline-secondary${orientation === o ? " active" : ""}`}
                onClick={() => setOrientation(o)}
              >
                {o === "horizontal" ? "Horizontal" : "Vertical"}
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

      {treeData ? (
        <div style={{ width: "100%", height: "420px" }}>
          <Tree
            data={treeData}
            orientation={orientation}
            translate={orientation === "horizontal" ? { x: 80, y: 210 } : { x: 400, y: 40 }}
            pathFunc="step"
            zoom={0.8}
            initialDepth={Infinity}
          />
        </div>
      ) : (
        <p className="text-muted small mb-0">Not available</p>
      )}
    </div>
  );
}
