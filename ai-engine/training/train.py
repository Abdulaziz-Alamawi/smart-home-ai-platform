"""
Offline training entrypoint.

Run with:  python -m training.train
Trains every model and writes artifacts to the configured MODEL_DIR.
"""
from __future__ import annotations

import json

from app.services.registry import registry


def main() -> None:
    print("Training Smart Home AI models...")
    metrics = registry.train_all(persist=True)
    print("Training complete. Metrics:")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
