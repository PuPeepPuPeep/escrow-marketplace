from tests.conftest import auth_header, make_admin, make_user


def test_register_and_login(client):
    res = client.post("/auth/register", json={"email": "u@test.com", "password": "pass"})
    assert res.status_code == 201
    assert res.json()["is_admin"] is False

    res = client.post("/auth/login", json={"email": "u@test.com", "password": "pass"})
    assert res.status_code == 200
    token = res.json()["access_token"]

    res = client.get("/auth/me", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["email"] == "u@test.com"


def test_duplicate_email(client):
    client.post("/auth/register", json={"email": "dup@test.com", "password": "pass"})
    res = client.post("/auth/register", json={"email": "dup@test.com", "password": "pass"})
    assert res.status_code == 400


def test_invalid_login(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "wrong"})
    assert res.status_code == 401


def test_register_always_creates_non_admin(client):
    """Registration always creates a regular user; admin must be set via DB."""
    res = client.post("/auth/register", json={"email": "notadmin@test.com", "password": "pass"})
    assert res.status_code == 201
    assert res.json()["is_admin"] is False


def test_admin_guard(client, db):
    user_token = make_user(client, "user@test.com")
    admin_token = make_admin(client, db, "admin@test.com")

    # Admin-only endpoint rejects regular user
    res = client.get("/admin/stats", headers=auth_header(user_token))
    assert res.status_code == 403

    # Admin can access it
    res = client.get("/admin/stats", headers=auth_header(admin_token))
    assert res.status_code == 200
