from coach_edit.cta import find_cta


def _seg(start, end, text):
    return {"start": start, "end": end, "text": text}


def test_find_cta_keyword_match():
    # The CTA span starts at the segment where the keyword itself appears, not
    # any lead-in sentence before it — a simple, predictable definition.
    segments = [
        _seg(0.0, 5.0, "Most people make this mistake."),
        _seg(5.0, 90.0, "Here's the data and the reframe."),
        _seg(90.0, 95.0, "If you'd love to know exactly how,"),
        _seg(95.0, 100.0, "check out the link below."),
    ]
    result = find_cta(segments, duration=100.0, tail_window=45.0)
    assert result["matched"] is True
    assert result["start"] == 95.0
    assert result["end"] == 100.0
    assert "check out the link below" in result["text"]
    assert "If you'd love to know exactly how" not in result["text"]


def test_find_cta_no_match_falls_back_to_tail():
    segments = [
        _seg(0.0, 50.0, "Some content with no call to action phrasing at all."),
        _seg(50.0, 100.0, "More content, still nothing that matches.")
    ]
    result = find_cta(segments, duration=100.0, fallback_seconds=20.0)
    assert result["matched"] is False
    assert result["start"] == 80.0
    assert result["end"] == 100.0


def test_find_cta_empty_transcript():
    result = find_cta([], duration=60.0, fallback_seconds=20.0)
    assert result["matched"] is False
    assert result["start"] == 40.0
    assert result["end"] == 60.0
    assert result["text"] == ""


def test_find_cta_ignores_keyword_outside_tail_window():
    # "subscribe" appears early (outside the tail window) and should be ignored;
    # only a later match within the window should count.
    segments = [
        _seg(0.0, 5.0, "Please subscribe if that resonates, but here's the real story."),
        _seg(5.0, 90.0, "Long story goes here with no CTA language."),
        _seg(90.0, 95.0, "Anyway, book a call using the link below."),
    ]
    result = find_cta(segments, duration=95.0, tail_window=30.0)
    assert result["matched"] is True
    assert result["start"] == 90.0
