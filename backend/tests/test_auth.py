from tests.conftest import auth_header, make_user


def test_register_and_login(client):
    res = client.post("/auth/register", json={"email": "u@test.com", "password": "pass", "role": "buyer"})
    assert res.status_code == 201
    assert res.json()["role"] == "buyer"

    res = client.post("/auth/login", json={"email": "u@test.com", "password": "pass"})
    assert res.status_code == 200
    token = res.json()["access_token"]

    res = client.get("/auth/me", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["email"] == "u@test.com"


def test_duplicate_email(client):
    client.post("/auth/register", json={"email": "dup@test.com", "password": "pass", "role": "buyer"})
    res = client.post("/auth/register", json={"email": "dup@test.com", "password": "pass", "role": "buyer"})
    assert res.status_code == 400


def test_invalid_login(client):
    res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "wrong"})
    assert res.status_code == 401


def test_role_guard(client):
    buyer_token = make_user(client, "buyer@test.com", role="buyer")
    res = client.post("/deals", json={"title": "test", "amount": "100"}, headers=auth_header(buyer_token))
    assert res.status_code == 403
