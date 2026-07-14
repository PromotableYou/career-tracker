"""Silence detection and dead-air trimming."""

import re

from . import ffmpeg_utils

_SILENCE_START_RE = re.compile(r"silence_start:\s*(-?[\d.]+)")
_SILENCE_END_RE = re.compile(r"silence_end:\s*(-?[\d.]+)")


def parse_silence_output(stderr_text):
    """Parse ffmpeg silencedetect stderr output into a list of (start, end) tuples.

    A silence_start with no matching silence_end (silence runs to EOF) is dropped;
    the caller clips segments to the media duration instead.
    """
    intervals = []
    pending_start = None
    for line in stderr_text.splitlines():
        start_match = _SILENCE_START_RE.search(line)
        if start_match:
            pending_start = float(start_match.group(1))
            continue
        end_match = _SILENCE_END_RE.search(line)
        if end_match and pending_start is not None:
            intervals.append((pending_start, float(end_match.group(1))))
            pending_start = None
    return intervals


def detect_silence(input_path, noise_db="-30dB", min_silence=0.5):
    """Return silence intervals as a list of (start, end) tuples, in seconds."""
    result = ffmpeg_utils.run(
        [
            "ffmpeg",
            "-i",
            str(input_path),
            "-af",
            f"silencedetect=noise={noise_db}:d={min_silence}",
            "-f",
            "null",
            "-",
        ],
        check=False,
    )
    return parse_silence_output(result.stderr)


def compute_speech_segments(duration, silence_intervals, padding=0.15, min_gap=0.3):
    """Invert silence intervals into speech segments, padding cuts and merging near-adjacent ones.

    padding: seconds of silence to keep on each side of a cut, so speech isn't clipped.
    min_gap: segments separated by a gap smaller than this are merged into one.
    """
    if not silence_intervals:
        return [(0.0, duration)]

    silence_intervals = [
        (max(0.0, min(s, duration)), max(0.0, min(e, duration))) for s, e in sorted(silence_intervals)
    ]

    # Exact complement of the silence intervals: only real speech, no padding yet.
    raw_segments = []
    cursor = 0.0
    for start, end in silence_intervals:
        if start > cursor:
            raw_segments.append((cursor, start))
        cursor = max(cursor, end)
    if cursor < duration:
        raw_segments.append((cursor, duration))

    if not raw_segments:
        return []  # the entire clip was classified as silence

    # Pad each segment into its neighboring silence, then merge any that now overlap
    # or sit closer together than min_gap.
    padded = [(max(0.0, s - padding), min(duration, e + padding)) for s, e in raw_segments]

    merged = [padded[0]]
    for start, end in padded[1:]:
        prev_start, prev_end = merged[-1]
        if start - prev_end < min_gap:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


def trim_silence(
    input_path,
    output_path,
    noise_db="-30dB",
    min_silence=0.5,
    padding=0.15,
    min_gap=0.3,
    reencode=True,
    tmp_dir=None,
    dry_run=False,
):
    """Cut dead air out of input_path and write the result to output_path.

    Returns a dict summary: original_duration, new_duration, segments (list of kept ranges).
    """
    import os
    import tempfile

    duration = ffmpeg_utils.probe_duration(input_path)
    silence_intervals = detect_silence(input_path, noise_db=noise_db, min_silence=min_silence)
    segments = compute_speech_segments(duration, silence_intervals, padding=padding, min_gap=min_gap)
    new_duration = sum(e - s for s, e in segments)

    summary = {
        "original_duration": duration,
        "new_duration": new_duration,
        "removed": duration - new_duration,
        "segments": segments,
    }

    if dry_run:
        return summary

    work_dir = tmp_dir or tempfile.mkdtemp(prefix="coach_edit_")
    os.makedirs(work_dir, exist_ok=True)
    clip_paths = []
    try:
        for i, (start, end) in enumerate(segments):
            clip_path = os.path.join(work_dir, f"seg_{i:04d}.mp4")
            ffmpeg_utils.extract_clip(input_path, clip_path, start, end, reencode=reencode)
            clip_paths.append(clip_path)

        if len(clip_paths) == 1:
            import shutil

            shutil.copy(clip_paths[0], output_path)
        else:
            ffmpeg_utils.concat_clips(clip_paths, output_path)
    finally:
        if tmp_dir is None:
            import shutil

            shutil.rmtree(work_dir, ignore_errors=True)

    return summary
