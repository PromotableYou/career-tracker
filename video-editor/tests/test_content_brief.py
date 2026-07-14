from coach_edit.content_brief import build_brief


def _seg(start, end, text):
    return {"start": start, "end": end, "text": text}


def test_build_brief_includes_hook_stats_and_cta():
    segments = [
        _seg(0.0, 5.0, "Most people make this mistake immediately after redundancy."),
        _seg(5.0, 60.0, "A long emotional story about the job search rollercoaster."),
        _seg(60.0, 65.0, "Recent data shows 80% of successful candidates used referrals."),
        _seg(90.0, 95.0, "If you'd love to know how, check out the link below."),
    ]
    cta = {"start": 90.0, "end": 95.0, "text": "If you'd love to know how, check out the link below.", "matched": True}

    brief = build_brief(segments, duration=95.0, cta=cta, highlight_segments=None, title="Test Video")

    assert "# Test Video" in brief
    assert "Most people make this mistake" in brief
    assert "80% of successful candidates" in brief
    assert "check out the link below" in brief
    assert "## Suggested carousel slides" in brief
    assert "## Draft post caption" in brief


def test_build_brief_dedupes_overlapping_highlight_and_stat_quotes():
    segments = [
        _seg(0.0, 3.0, "Intro line with no stats at all here."),
        _seg(12.0, 17.0, "Recent data shows 80% of candidates used referrals."),
        _seg(17.0, 22.0, "And that changes everything for your job search."),
    ]
    cta = {"start": 17.0, "end": 22.0, "text": "here's the CTA", "matched": True}

    # A highlight spanning both the stat segment and the next one would otherwise
    # add a near-duplicate of the already-collected stat quote as its own point.
    brief = build_brief(segments, duration=22.0, cta=cta, highlight_segments=[(12.0, 22.0, -10.0)])

    # The stat quote legitimately appears 3x (key points bullet, carousel slide, caption lead)
    # but the overlapping highlight text must not have been added as a 4th, separate point.
    assert brief.count("Recent data shows 80%") == 3
    assert "And that changes everything" not in brief


def test_build_brief_flags_heuristic_cta():
    segments = [_seg(0.0, 5.0, "Some intro text with no stats.")]
    cta = {"start": 0.0, "end": 5.0, "text": "closing remarks", "matched": False}

    brief = build_brief(segments, duration=5.0, cta=cta, title=None)

    assert "heuristic guess" in brief
