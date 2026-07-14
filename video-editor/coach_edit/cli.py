"""coach-edit: a CLI for trimming dead air and pulling highlight clips from coaching videos."""

import argparse
import os
import sys

from . import ffmpeg_utils, highlights, silence


def _fmt_hms(seconds):
    seconds = max(0, int(seconds))
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:d}:{s:02d}"


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
    except FileNotFoundError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
