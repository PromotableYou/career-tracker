# coach-edit

A standalone command-line tool for editing local coaching video files. It does not
touch the career-tracker web app — it's a separate Python CLI you run against video
files on your own machine.

Six commands:

- `trim-silence` — cuts dead air / long silences out of a recording.
- `highlights` — picks the loudest/most substantive spoken segments and exports them
  as individual clips (optionally combined into one highlight reel).
- `transcribe` — runs local speech-to-text (no cloud API) to get a timestamped transcript.
- `cta` — finds and extracts the call-to-action moment from the transcript.
- `shorts` — extracts vertical (9:16), captioned short-form clips for Reels/TikTok/Shorts.
- `brief` — drafts a content brief (hook, key quotes, CTA, carousel slide text, post caption)
  for you to build into an actual carousel/post (e.g. in Canva).

## Requirements

- Python 3.8+
- [ffmpeg](https://ffmpeg.org/) and `ffprobe` on your `PATH`
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `apt-get install ffmpeg`
- For `transcribe`, `cta`, `shorts`, and `brief`: the `transcribe` extra (see below). These
  all run local, offline speech-to-text on CPU — no API key or cloud service required, but
  the first run downloads a speech model and processing takes noticeably longer than
  `trim-silence`/`highlights`.

## Install

```bash
cd video-editor
pip install -e .                  # trim-silence, highlights only
pip install -e ".[transcribe]"    # adds transcribe, cta, shorts, brief
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

### Transcribe

```bash
coach-edit transcribe session.mp4 -o session.transcript.json
```

Runs locally via [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (CPU, `int8`).
`--model` picks the model size (`tiny`/`base`/`small`/`medium`, default `base` — bigger is
more accurate but slower). The other commands below will transcribe automatically and cache
the result next to your video (`session.transcript.json`) unless you pass `--transcript` to
reuse one, or `--no-cache` to skip caching.

### Extract the call-to-action

```bash
coach-edit cta session.mp4 -o session.cta.mp4
```

Searches the transcript for CTA phrasing ("link below", "check out", "book a call", "sign
up", etc.) within the last `--tail-window` seconds (default 45s) and extracts from there to
the end of the video. Falls back to the last `--fallback-seconds` (default 20s) — flagged
as a heuristic guess — if nothing matches, so always sanity-check the printed text.

### Extract short-form clips

```bash
coach-edit shorts session.mp4 -o shorts/ -n 5
```

Same segment selection as `highlights`, but crops to vertical 9:16 (assumes a landscape
source) and burns in captions from the transcript. Use `--no-vertical` to keep the original
aspect ratio, or `--no-captions` to skip captions (and skip transcribing entirely).

### Draft a content brief

```bash
coach-edit brief session.mp4 -o session.brief.md --title "Session title"
```

Writes a markdown brief with the hook line, quotable/stat-bearing lines, the detected CTA,
and draft carousel slide text + a post caption built from them. This is a starting draft —
review and edit the copy before turning it into an actual carousel or post (e.g. in Canva).

## How it works

`trim-silence` and `highlights` use `ffmpeg`'s `silencedetect` filter to find silent
stretches, then treat everything else as spoken segments; `highlights` additionally scores
each segment's mean volume (`volumedetect`) and ranks by that score. `shorts` reuses the
same segment selection. None of that involves speech-to-text — it's a loudness/activity
heuristic, not a "smart" summary.

`transcribe`, `cta`, `shorts` (captions), and `brief` add local speech-to-text on top, so
they can reason about what's actually being said — matching CTA phrasing, timing captions
to words, and picking out quotable/stat-bearing lines for the brief.

## Running tests

```bash
cd video-editor
pip install pytest
PYTHONPATH=. pytest tests/
```

Tests cover the pure segment-math and parsing logic and don't require ffmpeg or real
video files.
