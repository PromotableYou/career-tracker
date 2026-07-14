"""Highlight/clip extraction: rank spoken segments and export the best ones."""

import os

from . import ffmpeg_utils
from .silence import compute_speech_segments, detect_silence


def _fit_to_bounds(start, end, min_clip, max_clip, duration):
    """Clamp a segment's length into [min_clip, max_clip], centered on the original."""
    length = end - start
    if length < min_clip:
        return None  # too short to bother with
    if length > max_clip:
        center = (start + end) / 2
        start = max(0.0, center - max_clip / 2)
        end = min(duration, start + max_clip)
        start = max(0.0, end - max_clip)
    return (start, end)


def find_highlights(
    input_path,
    count=5,
    min_clip=15.0,
    max_clip=90.0,
    noise_db="-30dB",
    min_silence=0.5,
):
    """Score spoken segments by loudness and return the top `count` as (start, end, score).

    Segments shorter than min_clip are skipped; longer ones are cropped (centered) to max_clip.
    """
    duration = ffmpeg_utils.probe_duration(input_path)
    silence_intervals = detect_silence(input_path, noise_db=noise_db, min_silence=min_silence)
    speech_segments = compute_speech_segments(duration, silence_intervals, padding=0.15, min_gap=min_clip / 4)

    candidates = []
    for start, end in speech_segments:
        fitted = _fit_to_bounds(start, end, min_clip, max_clip, duration)
        if fitted is None:
            continue
        score = ffmpeg_utils.mean_volume(input_path, *fitted)
        candidates.append((fitted[0], fitted[1], score))

    candidates.sort(key=lambda c: c[2], reverse=True)
    top = candidates[:count]
    return sorted(top, key=lambda c: c[0])  # chronological order for output


def extract_highlights(input_path, segments, outdir, reencode=True, prefix="highlight"):
    """Extract each (start, end[, score]) segment from input_path into outdir. Returns clip paths."""
    os.makedirs(outdir, exist_ok=True)
    clip_paths = []
    for i, seg in enumerate(segments, start=1):
        start, end = seg[0], seg[1]
        clip_path = os.path.join(outdir, f"{prefix}_{i:02d}.mp4")
        ffmpeg_utils.extract_clip(input_path, clip_path, start, end, reencode=reencode)
        clip_paths.append(clip_path)
    return clip_paths
