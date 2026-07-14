"""Burned-in caption generation from word-level transcript timestamps."""


def _fmt_srt_time(seconds):
    seconds = max(0.0, seconds)
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def words_in_range(segments, start, end):
    """Flatten every word across segments that falls within [start, end)."""
    words = []
    for seg in segments:
        for w in seg.get("words", []):
            if w["start"] >= start and w["start"] < end:
                words.append(w)
    return words


def chunk_words(words, max_words=6, max_chars=32):
    """Group words into short caption cues, breaking on word/char limits.

    Returns a list of {"start", "end", "text"} cues, timestamps relative to the
    original media (not re-based to 0).
    """
    cues = []
    current = []
    for word in words:
        candidate_text = " ".join(w["word"] for w in current + [word])
        if current and (len(current) >= max_words or len(candidate_text) > max_chars):
            cues.append(
                {
                    "start": current[0]["start"],
                    "end": current[-1]["end"],
                    "text": " ".join(w["word"] for w in current),
                }
            )
            current = [word]
        else:
            current.append(word)
    if current:
        cues.append(
            {
                "start": current[0]["start"],
                "end": current[-1]["end"],
                "text": " ".join(w["word"] for w in current),
            }
        )
    return cues


def write_srt(cues, path, time_offset=0.0):
    """Write cues to an SRT file, shifting timestamps by -time_offset (e.g. to
    re-base a clip's captions to start at 0 after extraction)."""
    with open(path, "w") as f:
        for i, cue in enumerate(cues, start=1):
            start = cue["start"] - time_offset
            end = cue["end"] - time_offset
            f.write(f"{i}\n{_fmt_srt_time(start)} --> {_fmt_srt_time(end)}\n{cue['text']}\n\n")
