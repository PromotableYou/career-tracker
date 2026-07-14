"""Thin wrappers around the ffmpeg/ffprobe CLIs."""

import shutil
import subprocess


class FfmpegNotFoundError(RuntimeError):
    pass


class FfmpegError(RuntimeError):
    pass


def check_tools():
    """Raise FfmpegNotFoundError if ffmpeg/ffprobe are not on PATH."""
    missing = [tool for tool in ("ffmpeg", "ffprobe") if shutil.which(tool) is None]
    if missing:
        raise FfmpegNotFoundError(
            f"Required tool(s) not found on PATH: {', '.join(missing)}. "
            "Install ffmpeg (e.g. `apt-get install ffmpeg` or `brew install ffmpeg`)."
        )


def run(args, check=True):
    """Run a command, returning the completed process (stdout/stderr captured as text)."""
    result = subprocess.run(args, capture_output=True, text=True)
    if check and result.returncode != 0:
        raise FfmpegError(
            f"Command failed ({result.returncode}): {' '.join(args)}\n{result.stderr}"
        )
    return result


def probe_duration(path):
    """Return the duration of a media file in seconds, as a float."""
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    )
    try:
        return float(result.stdout.strip())
    except ValueError as exc:
        raise FfmpegError(f"Could not determine duration of {path}") from exc


def extract_clip(input_path, output_path, start, end, reencode=False):
    """Extract [start, end) seconds from input_path into output_path."""
    duration = max(end - start, 0)
    args = ["ffmpeg", "-y", "-ss", f"{start:.3f}", "-i", str(input_path), "-t", f"{duration:.3f}"]
    if reencode:
        args += ["-c:v", "libx264", "-c:a", "aac"]
    else:
        args += ["-c", "copy"]
    args += [str(output_path)]
    run(args)


def escape_filter_path(path):
    """Escape a filesystem path for embedding as a filter option value (e.g. subtitles=...)."""
    escaped = str(path).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    return f"'{escaped}'"


def extract_clip_with_filter(input_path, output_path, start, end, vf):
    """Extract [start, end) seconds from input_path, applying a video filtergraph (e.g. crop+scale+subtitles)."""
    duration = max(end - start, 0)
    run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start:.3f}",
            "-i",
            str(input_path),
            "-t",
            f"{duration:.3f}",
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            str(output_path),
        ]
    )


def concat_clips(clip_paths, output_path):
    """Concatenate a list of clip files (same codec/params) into output_path."""
    import tempfile
    import os

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, dir=os.path.dirname(str(output_path)) or "."
    ) as f:
        list_path = f.name
        for clip in clip_paths:
            f.write(f"file '{os.path.abspath(str(clip))}'\n")

    try:
        run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                list_path,
                "-c",
                "copy",
                str(output_path),
            ]
        )
    finally:
        os.unlink(list_path)


def mean_volume(input_path, start, end):
    """Return the mean volume (dBFS, a float <= 0) of [start, end) seconds of input_path."""
    duration = max(end - start, 0)
    result = run(
        [
            "ffmpeg",
            "-ss",
            f"{start:.3f}",
            "-i",
            str(input_path),
            "-t",
            f"{duration:.3f}",
            "-af",
            "volumedetect",
            "-vn",
            "-f",
            "null",
            "-",
        ],
        check=False,
    )
    for line in result.stderr.splitlines():
        line = line.strip()
        if "mean_volume:" in line:
            try:
                return float(line.split("mean_volume:")[1].split("dB")[0].strip())
            except (ValueError, IndexError):
                continue
    return float("-inf")
