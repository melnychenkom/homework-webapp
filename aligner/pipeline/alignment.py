import biotite.sequence as seq_module
import biotite.sequence.align as align


def align_sequences(sequences: list[dict]):
    nuc_seqs = [seq_module.NucleotideSequence(s["sequence"]) for s in sequences]
    matrix = align.SubstitutionMatrix.std_nucleotide_matrix()
    alignment, *_ = align.align_multiple(nuc_seqs, matrix=matrix, gap_penalty=-6)  # type: ignore
    return alignment
