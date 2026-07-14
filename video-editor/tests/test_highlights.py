from coach_edit.highlights import _fit_to_bounds


def test_fit_to_bounds_too_short_dropped():
    assert _fit_to_bounds(0.0, 5.0, min_clip=15.0, max_clip=90.0, duration=100.0) is None


def test_fit_to_bounds_within_range_unchanged():
    assert _fit_to_bounds(10.0, 40.0, min_clip=15.0, max_clip=90.0, duration=100.0) == (10.0, 40.0)


def test_fit_to_bounds_too_long_centered_crop():
    start, end = _fit_to_bounds(0.0, 200.0, min_clip=15.0, max_clip=90.0, duration=200.0)
    assert end - start == 90.0
    # centered on the original segment's midpoint (100.0)
    assert start == 55.0 and end == 145.0
