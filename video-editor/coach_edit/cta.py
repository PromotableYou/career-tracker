"""Call-to-action detection from a transcript."""

CTA_KEYWORDS = [
    "link below", "link in", "check out", "click the link", "click here",
    "sign up", "book a call", "book your", "dm me", "message me",
    "comment below", "subscribe", "follow for more", "grab your",
    "download the", "join", "swipe up", "tap the link", "learn more",
    "get started", "apply now", "schedule a call", "in the description",
    "in the show notes", "visit", "head to", "go to",
]


def find_cta(segments, duration, tail_window=45.0, fallback_seconds=20.0):
    """Find the call-to-action range in a transcript.

    Searches segments within the last `tail_window` seconds of the video for CTA
    keywords; the CTA is assumed to run from the first match to the end of the
    transcript. Falls back to the last `fallback_seconds` of the video (flagged
    as a heuristic guess) if no keyword match is found.

    Returns {"start": float, "end": float, "text": str, "matched": bool}.
    """
    if not segments:
        start = max(0.0, duration - fallback_seconds)
        return {"start": start, "end": duration, "text": "", "matched": False}

    search_start = max(0.0, duration - tail_window)
    cta_start_index = None
    for i, seg in enumerate(segments):
        if seg["start"] < search_start:
            continue
        text_lower = seg["text"].lower()
        if any(keyword in text_lower for keyword in CTA_KEYWORDS):
            cta_start_index = i
            break

    if cta_start_index is not None:
        cta_segments = segments[cta_start_index:]
        return {
            "start": cta_segments[0]["start"],
            "end": cta_segments[-1]["end"],
            "text": " ".join(seg["text"] for seg in cta_segments),
            "matched": True,
        }

    # Fallback: last `fallback_seconds` of the video, whatever was said.
    fallback_start = max(0.0, duration - fallback_seconds)
    fallback_segments = [seg for seg in segments if seg["end"] > fallback_start]
    return {
        "start": fallback_start,
        "end": duration,
        "text": " ".join(seg["text"] for seg in fallback_segments),
        "matched": False,
    }
