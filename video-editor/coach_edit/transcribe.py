"""Local speech-to-text transcription (via faster-whisper), with word-level timestamps."""

import json


class TranscriptionUnavailableError(RuntimeError):
    pass


def transcribe(input_path, model_size="base", language=None):
    """Transcribe input_path into a list of segments:

    [{"start": float, "end": float, "text": str,
      "words": [{"start": float, "end": float, "word": str}, ...]}, ...]

    Requires the optional `faster-whisper` dependency (pip install "coach-edit[transcribe]").
    Runs fully locally/offline once the model is downloaded on first use.
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise TranscriptionUnavailableError(
            "Transcription requires faster-whisper. Install it with: "
            "pip install 'coach-edit[transcribe]'"
        ) from exc

    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    raw_segments, _info = model.transcribe(
        str(input_path), language=language, word_timestamps=True
    )

    segments = []
    for seg in raw_segments:
        words = [
            {"start": w.start, "end": w.end, "word": w.word.strip()}
            for w in (seg.words or [])
        ]
        segments.append(
            {"start": seg.start, "end": seg.end, "text": seg.text.strip(), "words": words}
        )
    return segments


def save_transcript(segments, path):
    with open(path, "w") as f:
        json.dump(segments, f, indent=2)


def load_transcript(path):
    with open(path) as f:
        return json.load(f)
