# coach-edit

A standalone command-line tool for editing local coaching video files. It does not
touch the career-tracker web app — it's a separate Python CLI you run against video
files on your own machine.

Two commands:

- `trim-silence` — cuts dead air / long silences out of a recording.
- `highlights` — picks the loudest/most substantive spoken segments and exports them
  as individual clips (optionally combined into one highlight reel).

## Requirements

- Python 3.8+
- [ffmpeg](https://ffmpeg.org/) and `ffprobe` on your `PATH`
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `apt-get install ffmpeg`

## Install

```bash
cd video-editor
pip install -e .
```

This installs a `coach-edit` command. Alternatively, run it without installing:

```bash
cd video-editor
python -m coach_edit.cli <command> ...
```

## Usage

### Trim dead air

```bash
coach-edit trim-silence session.mp4 -o session.trimmed.mp4
```

Preview what would be cut without writing a file:

```bash
coach-edit trim-silence session.mp4 --dry-run
```

Useful flags:

- `--noise -30dB` — how quiet counts as silence (more negative = stricter).
- `--min-silence 0.5` — minimum length of a silent stretch to cut, in seconds.
- `--padding 0.15` — seconds of silence kept on each side of a cut so speech isn't clipped.
- `--min-gap 0.3` — merges kept segments if the gap being cut between them is smaller than this.
- `--copy` — use stream copy instead of re-encoding (faster, but cuts snap to the nearest keyframe).

### Extract highlight clips

```bash
coach-edit highlights session.mp4 -o highlights/ -n 5 --reel
```

Ranks spoken segments (found the same way as `trim-silence`) by loudness, keeps the top
`-n`, and writes each as its own clip. Pass `--reel` to also concatenate the chosen clips
into `highlight_reel.mp4`.

Useful flags:

- `-n / --count` — how many highlight clips to extract (default 5).
- `--min-clip` / `--max-clip` — clip length bounds in seconds (default 15-90); segments
  shorter than the minimum are skipped, longer ones are center-cropped to the maximum.
- `--dry-run` — list the chosen clips (timestamps + volume score) without extracting them.

## How it works

Both commands use `ffmpeg`'s `silencedetect` filter to find silent stretches, then treat
everything else as spoken segments. `highlights` additionally scores each segment's mean
volume (`volumedetect`) and ranks by that score. There's no speech-to-text or content
understanding involved — it's a loudness/activity heuristic, not a "smart" summary.

## Running tests

```bash
cd video-editor
pip install pytest
PYTHONPATH=. pytest tests/
```

Tests cover the pure segment-math and parsing logic and don't require ffmpeg or real
video files.
