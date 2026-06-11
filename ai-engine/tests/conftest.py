"""Shared pytest fixtures: train models once for the whole session."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.registry import registry


@pytest.fixture(scope="session", autouse=True)
def _trained_models():
    # Train in-memory (no disk persistence needed for tests).
    registry.train_all(persist=False)
    yield


@pytest.fixture(scope="session")
def client():
    # Lifespan re-loads/trains; models already trained above so this is fast.
    with TestClient(app) as c:
        yield c
