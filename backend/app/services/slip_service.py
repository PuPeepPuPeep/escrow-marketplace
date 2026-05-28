import random


def mock_verify(force_result: str | None = None) -> str:
    """Return 'VERIFIED' or 'FAILED'. 90% chance VERIFIED unless force_result given."""
    if force_result in ("VERIFIED", "FAILED"):
        return force_result
    return "VERIFIED" if random.random() < 0.9 else "FAILED"
