"""coach-edit: a CLI for trimming dead air and pulling highlight clips from coaching videos."""

import argparse
import os
import sys

from . import content_brief, cta as cta_module, ffmpeg_utils, highlights, shorts, silence, transcribe


def _fmt_hms(seconds):
    seconds = max(0, int(seconds))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:d}:{s:02d}"


def _get_transcript(args):
    """Load a transcript from --transcript if given, else transcribe --input (and cache it)."""
    if args.transcript:
        return transcribe.load_transcript(args.transcript)

    default_cache = os.path.splitext(args.input)[0] + ".transcript.json"
    if not args.no_cache and os.path.exists(default_cache):
        print(f"Using cached transcript {default_cache} (pass --no-cache to re-transcribe)")
        return transcribe.load_transcript(default_cache)

    print(f"Transcribing {args.input} (model={args.model})... this can take a while on CPU.")
    segments = transcribe.transcribe(args.input, model_size=args.model)
    if not args.no_cache:
        transcribe.save_transcript(segments, default_cache)
        print(f"Cached transcript to {default_cache}")
    return segments


def cmd_transcribe(args):
    segments = transcribe.transcribe(args.input, model_size=args.model, language=args.language)
    output = args.output or (os.path.splitext(args.input)[0] + ".transcript.json")
    transcribe.save_transcript(segments, output)
    print(f"Wrote transcript ({len(segments)} segment(s)) to {output}")


def cmd_cta(args):
    duration = ffmpeg_utils.probe_duration(args.input)
    segments = _get_transcript(args)
    result = cta_module.find_cta(
        segments, duration, tail_window=args.tail_window, fallback_seconds=args.fallback_seconds
    )

    status = "keyword match" if result["matched"] else "heuristic guess (no keyword match found)"
    print(f"CTA ({status}): {_fmt_hms(result['start'])} - {_fmt_hms(result['end'])}")
    print(f"Text: {result['text'] or '(none)'}")

    if args.dry_run:
        print("\n(dry run — no clip extracted)")
        return

    output = args.output or (os.path.splitext(args.input)[0] + ".cta.mp4")
    ffmpeg_utils.extract_clip(args.input, output, result["start"], result["end"], reencode=not args.copy)
    print(f"\nWrote {output}")


def cmd_shorts(args):
    transcript_segments = None if args.no_captions else _get_transcript(args)
    results = shorts.extract_shorts(
        args.input,
        args.outdir,
        transcript_segments=transcript_segments,
        count=args.count,
        min_clip=args.min_clip,
        max_clip=args.max_clip,
        noise_db=args.noise,
        min_silence=args.min_silence,
        vertical=not args.no_vertical,
        burn_captions=not args.no_captions,
    )

    if not results:
        print("No candidate segments found — try lowering --min-clip or --noise.")
        return

    print(f"Wrote {len(results)} short(s) to {args.outdir}/:")
    for i, r in enumerate(results, start=1):
        print(f"  {i:2d}. {_fmt_hms(r['start'])} - {_fmt_hms(r['end'])}  -> {r['path']}")


def cmd_brief(args):
    duration = ffmpeg_utils.probe_duration(args.input)
    segments = _get_transcript(args)
    cta_result = cta_module.find_cta(segments, duration)
    highlight_segments = highlights.find_highlights(
        args.input, count=args.count, min_clip=args.min_clip, max_clip=args.max_clip
    )
    brief = content_brief.build_brief(
        segments, duration, cta_result, highlight_segments=highlight_segments, title=args.title
    )

    output = args.output or (os.path.splitext(args.input)[0] + ".brief.md")
    with open(output, "w") as f:
        f.write(brief)
    print(f"Wrote content brief to {output}")


def cmd_trim_silence(args):
    output = args.output or (os.path.splitext(args.input)[0] + ".trimmed.mp4")
    summary = silence.trim_silence(
        args.input,
        output if not args.dry_run else None,
        noise_db=args.noise,
        min_silence=args.min_silence,
        padding=args.padding,
        min_gap=args.min_gap,
        reencode=not args.copy,
        dry_run=args.dry_run,
    )

    print(f"Original duration: {_fmt_hms(summary['original_duration'])}")
    print(f"Trimmed duration:  {_fmt_hms(summary['new_duration'])}")
    print(f"Removed:           {_fmt_hms(summary['removed'])} across {len(summary['segments'])} kept segment(s)")

    if args.dry_run:
        print("\n(dry run — no file written)")
    else:
        print(f"\nWrote {output}")


def cmd_highlights(args):
    segments = highlights.find_highlights(
        args.input,
        count=args.count,
        min_clip=args.min_clip,
        max_clip=args.max_clip,
        noise_db=args.noise,
        min_silence=args.min_silence,
    )

    if not segments:
        print("No candidate segments found — try lowering --min-clip or --noise.")
        return

    print(f"Found {len(segments)} highlight(s):")
    for i, (start, end, score) in enumerate(segments, start=1):
        print(f"  {i:2d}. {_fmt_hms(start)} - {_fmt_hms(end)}  (volume score: {score:.1f} dB)")

    if args.dry_run:
        print("\n(dry run — no clips extracted)")
        return

    clip_paths = highlights.extract_highlights(
        args.input, segments, args.outdir, reencode=not args.copy
    )
    print(f"\nWrote {len(clip_paths)} clip(s) to {args.outdir}/")

    if args.reel:
        reel_path = os.path.join(args.outdir, "highlight_reel.mp4")
        ffmpeg_utils.concat_clips(clip_paths, reel_path)
        print(f"Wrote combined reel to {reel_path}")


def build_parser():
    parser = argparse.ArgumentParser(
        prog="coach-edit",
        description="Trim dead air and pull highlight clips from local coaching video files.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    trim = subparsers.add_parser("trim-silence", help="Cut silence/dead air out of a video")
    trim.add_argument("input", help="Path to the source video file")
    trim.add_argument("-o", "--output", help="Output path (default: <input>.trimmed.mp4)")
    trim.add_argument("--noise", default="-30dB", help="Silence threshold, e.g. -30dB (default: -30dB)")
    trim.add_argument(
        "--min-silence", type=float, default=0.5, help="Minimum silence duration to cut, in seconds (default: 0.5)"
    )
    trim.add_argument(
        "--padding", type=float, default=0.15, help="Seconds of silence to keep around each cut (default: 0.15)"
    )
    trim.add_argument(
        "--min-gap",
        type=float,
        default=0.3,
        help="Merge kept segments separated by less than this many seconds (default: 0.3)",
    )
    trim.add_argument("--copy", action="store_true", help="Use stream copy instead of re-encoding (faster, less precise cuts)")
    trim.add_argument("--dry-run", action="store_true", help="Report what would be cut without writing a file")
    trim.set_defaults(func=cmd_trim_silence)

    hl = subparsers.add_parser("highlights", help="Extract the best clips from a video")
    hl.add_argument("input", help="Path to the source video file")
    hl.add_argument("-o", "--outdir", default="highlights", help="Directory to write clips into (default: ./highlights)")
    hl.add_argument("-n", "--count", type=int, default=5, help="Number of highlight clips to extract (default: 5)")
    hl.add_argument("--min-clip", type=float, default=15.0, help="Minimum clip length in seconds (default: 15)")
    hl.add_argument("--max-clip", type=float, default=90.0, help="Maximum clip length in seconds (default: 90)")
    hl.add_argument("--noise", default="-30dB", help="Silence threshold, e.g. -30dB (default: -30dB)")
    hl.add_argument(
        "--min-silence", type=float, default=0.5, help="Minimum silence duration used to split segments (default: 0.5)"
    )
    hl.add_argument("--reel", action="store_true", help="Also concatenate the chosen clips into one highlight reel")
    hl.add_argument("--copy", action="store_true", help="Use stream copy instead of re-encoding (faster, less precise cuts)")
    hl.add_argument("--dry-run", action="store_true", help="Report the chosen clips without extracting them")
    hl.set_defaults(func=cmd_highlights)

    tr = subparsers.add_parser(
        "transcribe", help="Transcribe a video locally (requires the [transcribe] extra)"
    )
    tr.add_argument("input", help="Path to the source video file")
    tr.add_argument("-o", "--output", help="Output path (default: <input>.transcript.json)")
    tr.add_argument("--model", default="base", help="faster-whisper model size, e.g. tiny/base/small/medium (default: base)")
    tr.add_argument("--language", help="Force a language code (e.g. en); default: auto-detect")
    tr.set_defaults(func=cmd_transcribe)

    def add_transcript_args(p):
        p.add_argument("--transcript", help="Path to an existing transcript JSON (skips re-transcribing)")
        p.add_argument("--model", default="base", help="faster-whisper model size if transcribing (default: base)")
        p.add_argument("--no-cache", action="store_true", help="Don't read/write the <input>.transcript.json cache")

    cta_cmd = subparsers.add_parser("cta", help="Find and extract the call-to-action from a video")
    cta_cmd.add_argument("input", help="Path to the source video file")
    cta_cmd.add_argument("-o", "--output", help="Output path (default: <input>.cta.mp4)")
    add_transcript_args(cta_cmd)
    cta_cmd.add_argument("--tail-window", type=float, default=45.0, help="Search the last N seconds for CTA keywords (default: 45)")
    cta_cmd.add_argument("--fallback-seconds", type=float, default=20.0, help="Fallback CTA length if no keyword match (default: 20)")
    cta_cmd.add_argument("--copy", action="store_true", help="Use stream copy instead of re-encoding")
    cta_cmd.add_argument("--dry-run", action="store_true", help="Report the CTA range/text without extracting a clip")
    cta_cmd.set_defaults(func=cmd_cta)

    sh = subparsers.add_parser("shorts", help="Extract vertical, captioned short-form clips")
    sh.add_argument("input", help="Path to the source video file")
    sh.add_argument("-o", "--outdir", default="shorts", help="Directory to write clips into (default: ./shorts)")
    sh.add_argument("-n", "--count", type=int, default=5, help="Number of short clips to extract (default: 5)")
    sh.add_argument("--min-clip", type=float, default=15.0, help="Minimum clip length in seconds (default: 15)")
    sh.add_argument("--max-clip", type=float, default=90.0, help="Maximum clip length in seconds (default: 90)")
    sh.add_argument("--noise", default="-30dB", help="Silence threshold, e.g. -30dB (default: -30dB)")
    sh.add_argument("--min-silence", type=float, default=0.5, help="Minimum silence duration used to split segments (default: 0.5)")
    add_transcript_args(sh)
    sh.add_argument("--no-vertical", action="store_true", help="Keep the original aspect ratio instead of cropping to 9:16")
    sh.add_argument("--no-captions", action="store_true", help="Don't burn in captions (also skips transcription)")
    sh.set_defaults(func=cmd_shorts)

    brief = subparsers.add_parser(
        "brief", help="Draft a content brief (hook, key quotes, CTA, carousel/post copy) from a video"
    )
    brief.add_argument("input", help="Path to the source video file")
    brief.add_argument("-o", "--output", help="Output path (default: <input>.brief.md)")
    brief.add_argument("--title", help="Title to use in the brief (default: none)")
    brief.add_argument("-n", "--count", type=int, default=5, help="Number of key-point candidates to consider (default: 5)")
    brief.add_argument("--min-clip", type=float, default=10.0, help="Minimum key-point segment length in seconds (default: 10)")
    brief.add_argument("--max-clip", type=float, default=60.0, help="Maximum key-point segment length in seconds (default: 60)")
    add_transcript_args(brief)
    brief.set_defaults(func=cmd_brief)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        ffmpeg_utils.check_tools()
        args.func(args)
    except ffmpeg_utils.FfmpegNotFoundError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except ffmpeg_utils.FfmpegError as exc:
        print(f"ffmpeg error: {exc}", file=sys.stderr)
        return 1
    except transcribe.TranscriptionUnavailableError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except FileNotFoundError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
