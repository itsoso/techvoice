import secrets


def _generate_code(prefix: str, byte_count: int = 3) -> str:
    return f"{prefix}-{secrets.token_hex(byte_count).upper()}"


def generate_thread_code() -> str:
    return _generate_code("ECH")


def generate_public_code() -> str:
    return _generate_code("PUB")
