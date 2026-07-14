"""Vertical (9:16) short-form clip extraction, with optional burned-in captions."""

import os
import tempfile

from . import captions, ffmpeg_utils, highlights

VERTICAL_WIDTH = 1080
VERTICAL_HEIGHT = 1920


def _build_filter(vertical, srt_path=None):
    parts = []
    if vertical:
        # Assumes a landscape source: crop to a 9:16 slice around the horizontal
        # center, then scale to a standard vertical resolution.
        parts.append(f"crop=ih*{VERTICAL_WIDTH}/{VERTICAL_HEIGHT}:ih")
        parts.append(f"scale={VERTICAL_WIDTH}:{VERTICAL_HEIGHT}")
    if srt_path is not None:
        parts.append(f"subtitles={ffmpeg_utils.escape_filter_path(srt_path)}")
    return ",".join(parts) if parts else "null"


def extract_shorts(
    input_path,
    outdir,
    transcript_segments=None,
    count=5,
    min_clip=15.0,
    max_clip=90.0,
    noise_db="-30dB",
    min_silence=0.5,
    vertical=True,
    burn_captions=True,
    prefix="short",
):
    """Find highlight-worthy segments and export each as a vertical, optionally captioned clip.

    Returns a list of {"start", "end", "score", "path"} dicts.
    """
    segments = highlights.find_highlights(
        input_path,
        count=count,
        min_clip=min_clip,
        max_clip=max_clip,
        noise_db=noise_db,
        min_silence=min_silence,
    )

    os.makedirs(outdir, exist_ok=True)
    results = []
    tmp_dir = tempfile.mkdtemp(prefix="coach_edit_srt_") if (burn_captions and transcript_segments) else None

    try:
        for i, (start, end, score) in enumerate(segments, start=1):
            srt_path = None
            if burn_captions and transcript_segments:
                words = captions.words_in_range(transcript_segments, start, end)
                if words:
                    cues = captions.chunk_words(words)
                    srt_path = os.path.join(tmp_dir, f"{prefix}_{i:02d}.srt")
                    captions.write_srt(cues, srt_path, time_offset=start)

            clip_path = os.path.join(outdir, f"{prefix}_{i:02d}.mp4")
            vf = _build_filter(vertical, srt_path)
            ffmpeg_utils.extract_clip_with_filter(input_path, clip_path, start, end, vf)
            results.append({"start": start, "end": end, "score": score, "path": clip_path})
    finally:
        if tmp_dir is not None:
            import shutil

            shutil.rmtree(tmp_dir, ignore_errors=True)

    return results
