import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a shallow copy of participants to restore after test
    orig = {k: v["participants"][:] for k, v in activities.items()}
    yield
    for k, v in activities.items():
        v["participants"] = orig[k][:]


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    client = TestClient(app)
    activity = "Chess Club"
    email = "test.student@mergington.edu"

    # Ensure not already signed up
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup returns 400
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400

    # Unregister
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unregister_nonexistent():
    client = TestClient(app)
    activity = "Chess Club"
    email = "nonexistent@mergington.edu"
    resp = client.post(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 404
