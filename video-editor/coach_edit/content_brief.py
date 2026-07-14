"""Draft a repurposing brief (hook, key quotes, CTA, carousel slides, post caption)
from a video transcript. Output is a starting point for you (or Claude, e.g. via
Canva) to build the actual carousel/post assets -- this module only drafts text."""

import re

_STAT_PATTERN = re.compile(r"\d[\d,.]*\s*(%|percent|million|thousand|x\b)", re.IGNORECASE)


def _hook_text(segments, window=10.0):
    hook_segments = [seg for seg in segments if seg["start"] < window]
    return " ".join(seg["text"] for seg in hook_segments).strip()


def _stat_quotes(segments, limit=5):
    quotes = [seg["text"].strip() for seg in segments if _STAT_PATTERN.search(seg["text"])]
    return quotes[:limit]


def build_brief(segments, duration, cta, highlight_segments=None, title=None):
    """Return a markdown content brief string.

    segments: full transcript (list of {"start","end","text",...})
    cta: result of cta.find_cta(...)
    highlight_segments: optional list of (start, end, score) from highlights.find_highlights,
        used to surface likely-quotable moments beyond pure stat-matching.
    """
    hook = _hook_text(segments) or (segments[0]["text"] if segments else "")
    stat_quotes = _stat_quotes(segments)

    highlight_quotes = []
    if highlight_segments:
        for start, end, _score in highlight_segments:
            text = " ".join(
                seg["text"] for seg in segments if seg["start"] >= start and seg["start"] < end
            ).strip()
            overlaps_existing = any(
                text in existing or existing in text for existing in stat_quotes + highlight_quotes
            )
            if text and not overlaps_existing:
                highlight_quotes.append(text)

    key_points = (stat_quotes + highlight_quotes)[:6] or [hook]

    lines = []
    title_line = title or "Content Brief"
    lines.append(f"# {title_line}")
    lines.append("")
    lines.append(f"Source duration: {duration:.0f}s")
    lines.append("")
    lines.append("## Hook")
    lines.append(hook or "(no speech detected in the first 10s)")
    lines.append("")
    lines.append("## Key points / quotable lines")
    for point in key_points:
        lines.append(f"- {point}")
    lines.append("")
    lines.append("## Call to action")
    cta_note = "" if cta.get("matched") else " (heuristic guess - no CTA keyword matched, review this)"
    lines.append(f"{cta['text'] or '(none detected)'}{cta_note}")
    lines.append("")
    lines.append("## Suggested carousel slides")
    lines.append(f"1. Hook: \"{hook}\"")
    for i, point in enumerate(key_points, start=2):
        lines.append(f"{i}. {point}")
    lines.append(f"{len(key_points) + 2}. CTA: \"{cta['text'] or hook}\"")
    lines.append("")
    lines.append("## Draft post caption")
    lead = key_points[0] if key_points else hook
    lines.append(f"{hook}")
    lines.append("")
    lines.append(f"{lead}")
    lines.append("")
    lines.append(cta["text"] or "")
    lines.append("")
    lines.append("[Add relevant hashtags]")

    return "\n".join(lines)
