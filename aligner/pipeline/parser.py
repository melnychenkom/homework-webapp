from pathlib import Path

import biotite.sequence.io.fasta as fasta_io


_VALID_BASES = frozenset("ATCG")


def parse_fasta(file_path: str | Path) -> list[dict]:
    ff = fasta_io.FastaFile.read(str(file_path))
    result = []
    for header, sequence in ff.items():
        seq_id = header.split()[0]
        seq_str = str(sequence).upper()
        invalid = sorted(set(seq_str) - _VALID_BASES)
        if invalid:
            raise ValueError(
                f"Sequence '{seq_id}' contains invalid characters: {', '.join(invalid)}. Only A, T, C, G are allowed."
            )
        result.append({
            "id": seq_id,
            "description": header,
            "sequence": seq_str,
        })
    if len(result) < 2:
        raise ValueError("FASTA must contain at least 2 sequences to align")
    return result
