from coach_edit.captions import _fmt_srt_time, chunk_words, write_srt


def _word(start, end, word):
    return {"start": start, "end": end, "word": word}


def test_fmt_srt_time():
    assert _fmt_srt_time(0) == "00:00:00,000"
    assert _fmt_srt_time(65.25) == "00:01:05,250"
    assert _fmt_srt_time(3661.5) == "01:01:01,500"


def test_chunk_words_by_max_words():
    words = [_word(i, i + 0.5, f"w{i}") for i in range(10)]
    cues = chunk_words(words, max_words=4, max_chars=1000)
    assert [len(c["text"].split()) for c in cues] == [4, 4, 2]
    assert cues[0]["start"] == 0
    assert cues[0]["end"] == 3.5


def test_chunk_words_by_max_chars():
    words = [_word(0, 1, "hello"), _word(1, 2, "world"), _word(2, 3, "this"), _word(3, 4, "is"), _word(4, 5, "long")]
    cues = chunk_words(words, max_words=100, max_chars=12)
    # "hello world" is 11 chars (fits), adding "this" would exceed 12
    assert cues[0]["text"] == "hello world"


def test_write_srt_with_time_offset(tmp_path):
    cues = [{"start": 10.0, "end": 11.5, "text": "hello there"}]
    path = tmp_path / "out.srt"
    write_srt(cues, str(path), time_offset=10.0)
    content = path.read_text()
    assert "00:00:00,000 --> 00:00:01,500" in content
    assert "hello there" in content
