def to_results_json(sequences: list[dict], alignment) -> dict:
    gapped_strings = []
    for seq_idx in range(len(alignment.sequences)):
        seq_str = str(alignment.sequences[seq_idx])
        trace_col = alignment.trace[:, seq_idx]
        gapped = "".join("-" if pos == -1 else seq_str[pos] for pos in trace_col)
        gapped_strings.append(gapped)

    return {
        "sequences": [
            {
                "id": sequences[i]["id"],
                "description": sequences[i]["description"],
                "aligned": gapped_strings[i],
            }
            for i in range(len(sequences))
        ],
        "alignment_length": int(alignment.trace.shape[0]),
        "sequence_count": len(sequences),
    }
