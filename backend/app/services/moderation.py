from fastapi import HTTPException, status

SENSITIVE_WORDS = {
    "去死",
    "杀人",
    "恐怖袭击",
    "极端主义",
}


def ensure_safe_content(*parts: str | None) -> None:
    joined = "\n".join(part for part in parts if part)
    if not joined:
        return

    lowered = joined.lower()
    for word in SENSITIVE_WORDS:
        if word.lower() in lowered:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="包含不适宜内容，请理性表达",
            )
