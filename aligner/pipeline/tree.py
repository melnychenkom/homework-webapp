import logging
import os
import subprocess
import tempfile
from io import StringIO

import numpy as np
from Bio import Phylo
from Bio.Phylo.TreeConstruction import DistanceMatrix, DistanceTreeConstructor
from biotite.sequence.align import Alignment

logger = logging.getLogger(__name__)


def _pairwise_distances(alignment: Alignment) -> np.ndarray:
    trace = alignment.trace  # shape (alignment_len, n_seqs)
    n = trace.shape[1]
    dist = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            col_i = trace[:, i]
            col_j = trace[:, j]
            valid = (col_i >= 0) & (col_j >= 0)
            if valid.sum() == 0:
                dist[i, j] = dist[j, i] = 1.0
                continue
            codes_i = alignment.sequences[i].code[col_i[valid]]
            codes_j = alignment.sequences[j].code[col_j[valid]]
            dist[i, j] = dist[j, i] = float(np.sum(codes_i != codes_j) / valid.sum())
    return dist


def _tree_to_newick(tree) -> str:
    buf = StringIO()
    Phylo.write(tree, buf, "newick")
    return buf.getvalue().strip()


def _ml_tree(alignment: Alignment, seq_ids: list[str]) -> str | None:
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.fasta', delete=False) as f:
            tmp_path = f.name
            for i, seq_id in enumerate(seq_ids):
                seq_str = str(alignment.sequences[i])
                aligned = ''.join(
                    seq_str[pos] if pos >= 0 else '-'
                    for pos in alignment.trace[:, i]
                )
                f.write(f'>{seq_id}\n{aligned}\n')
        result = subprocess.run(
            ['FastTree', '-nt', '-quiet', tmp_path],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode != 0:
            logger.warning('FastTree non-zero exit: %s', result.stderr[:200])
            return None
        newick = result.stdout.strip()
        if not newick or not newick.endswith(';'):
            logger.warning('FastTree produced unexpected output')
            return None
        return newick
    except FileNotFoundError:
        logger.warning('FastTree binary not found; ML tree skipped')
        return None
    except subprocess.TimeoutExpired:
        logger.warning('FastTree timed out; ML tree skipped')
        return None
    except Exception as exc:
        logger.warning('ML tree failed: %s', exc)
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def build_trees(alignment: Alignment, seq_ids: list[str]) -> dict[str, str | None]:
    n = len(seq_ids)
    if n < 2:
        return {"nj": None, "upgma": None, "ml": None}

    dist = _pairwise_distances(alignment)
    lower_tri = [[float(dist[i, j]) for j in range(i + 1)] for i in range(n)]
    dm = DistanceMatrix(seq_ids, lower_tri)
    constructor = DistanceTreeConstructor()

    nj_newick = None
    try:
        nj_newick = _tree_to_newick(constructor.nj(dm))
    except Exception as exc:
        logger.warning("NJ tree failed: %s", exc)

    upgma_newick = None
    try:
        upgma_newick = _tree_to_newick(constructor.upgma(dm))
    except Exception as exc:
        logger.warning("UPGMA tree failed: %s", exc)

    return {"nj": nj_newick, "upgma": upgma_newick, "ml": _ml_tree(alignment, seq_ids)}
