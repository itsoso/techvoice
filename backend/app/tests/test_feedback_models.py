from app.services.thread_codes import generate_thread_code


def test_generate_thread_code_matches_expected_prefix() -> None:
    code = generate_thread_code()

    assert code.startswith("ECH-")
    assert len(code) >= 10
