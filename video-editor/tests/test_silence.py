from coach_edit.silence import compute_speech_segments, parse_silence_output


def test_parse_silence_output_basic():
    stderr = """
[silencedetect @ 0x1] silence_start: 5.2
[silencedetect @ 0x1] silence_end: 7.8 | silence_duration: 2.6
[silencedetect @ 0x1] silence_start: 20.0
[silencedetect @ 0x1] silence_end: 20.9 | silence_duration: 0.9
""".strip()
    assert parse_silence_output(stderr) == [(5.2, 7.8), (20.0, 20.9)]


def test_parse_silence_output_unterminated_dropped():
    stderr = "silence_start: 5.0\nsilence_start: 12.0\nsilence_end: 12.5"
    assert parse_silence_output(stderr) == [(12.0, 12.5)]


def test_compute_speech_segments_no_silence():
    assert compute_speech_segments(100.0, []) == [(0.0, 100.0)]


def test_compute_speech_segments_basic_cut():
    # 100s clip, silence from 40-60. With no padding/merging quirks, expect two segments.
    segments = compute_speech_segments(100.0, [(40.0, 60.0)], padding=0.0, min_gap=0.0)
    assert segments == [(0.0, 40.0), (60.0, 100.0)]


def test_compute_speech_segments_padding_keeps_buffer():
    segments = compute_speech_segments(100.0, [(40.0, 60.0)], padding=1.0, min_gap=0.0)
    assert segments == [(0.0, 41.0), (59.0, 100.0)]


def test_compute_speech_segments_merges_near_adjacent():
    # The gap cut out between these two silences (20.5-20.6) is tiny, so the resulting
    # speech island should be absorbed into its neighbor rather than left as its own segment.
    segments = compute_speech_segments(
        100.0, [(20.0, 20.5), (20.6, 22.0)], padding=0.0, min_gap=0.6
    )
    assert segments == [(0.0, 20.6), (22.0, 100.0)]


def test_compute_speech_segments_trailing_silence_to_eof():
    segments = compute_speech_segments(100.0, [(90.0, 100.0)], padding=0.0, min_gap=0.0)
    assert segments == [(0.0, 90.0)]


def test_compute_speech_segments_leading_silence_no_spurious_segment():
    # Silence starting at t=0 should not produce a fake near-zero-length "speech" segment.
    segments = compute_speech_segments(30.0, [(0.0, 5.0), (15.0, 20.0)], padding=0.15, min_gap=0.3)
    assert segments[0][0] == 4.85
    assert all(e > s for s, e in segments)


def test_compute_speech_segments_all_silence():
    assert compute_speech_segments(30.0, [(0.0, 30.0)]) == []
