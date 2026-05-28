import threading

from tests.conftest import auth_header, make_user


def test_full_deal_happy_path(client):
    seller = make_user(client, "seller@test.com", role="seller")
    buyer = make_user(client, "buyer@test.com", role="buyer")

    # Create deal
    res = client.post("/deals", json={"title": "Widget", "amount": "500"}, headers=auth_header(seller))
    assert res.status_code == 201
    deal = res.json()
    assert deal["status"] == "CREATED"
    token = deal["unique_token"]

    # Accept deal
    res = client.post(f"/deals/{token}/accept", headers=auth_header(buyer))
    assert res.status_code == 200
    assert res.json()["status"] == "LOCKED"

    deal_id = deal["id"]

    # Pay (force VERIFIED)
    res = client.post(f"/deals/{deal_id}/pay", json={"force_result": "VERIFIED"}, headers=auth_header(buyer))
    assert res.status_code == 200
    assert res.json()["status"] == "PAID"

    # Confirm receipt
    res = client.post(f"/deals/{deal_id}/confirm", headers=auth_header(buyer))
    assert res.status_code == 200
    assert res.json()["status"] == "DONE"


def test_accept_twice_race_condition(client):
    """Second concurrent accept must fail — SELECT FOR UPDATE prevents double-lock."""
    seller = make_user(client, "seller2@test.com", role="seller")
    buyer1 = make_user(client, "buyer2@test.com", role="buyer")
    buyer2 = make_user(client, "buyer3@test.com", role="buyer")

    res = client.post("/deals", json={"title": "Race", "amount": "100"}, headers=auth_header(seller))
    token = res.json()["unique_token"]

    results = []

    def try_accept(b_token):
        r = client.post(f"/deals/{token}/accept", headers=auth_header(b_token))
        results.append(r.status_code)

    t1 = threading.Thread(target=try_accept, args=(buyer1,))
    t2 = threading.Thread(target=try_accept, args=(buyer2,))
    t1.start(); t2.start()
    t1.join(); t2.join()

    assert results.count(200) == 1
    assert results.count(400) == 1


def test_pay_idempotency(client):
    """Submitting payment twice should not double-credit."""
    seller = make_user(client, "seller3@test.com", role="seller")
    buyer = make_user(client, "buyer4@test.com", role="buyer")

    res = client.post("/deals", json={"title": "Idempotent", "amount": "200"}, headers=auth_header(seller))
    token = res.json()["unique_token"]
    deal_id = res.json()["id"]

    client.post(f"/deals/{token}/accept", headers=auth_header(buyer))
    client.post(f"/deals/{deal_id}/pay", json={"force_result": "VERIFIED"}, headers=auth_header(buyer))

    # Second pay attempt must fail
    res = client.post(f"/deals/{deal_id}/pay", json={"force_result": "VERIFIED"}, headers=auth_header(buyer))
    assert res.status_code == 400


def test_pay_failed_slip(client):
    seller = make_user(client, "seller4@test.com", role="seller")
    buyer = make_user(client, "buyer5@test.com", role="buyer")

    res = client.post("/deals", json={"title": "Fail", "amount": "100"}, headers=auth_header(seller))
    token = res.json()["unique_token"]
    deal_id = res.json()["id"]

    client.post(f"/deals/{token}/accept", headers=auth_header(buyer))
    res = client.post(f"/deals/{deal_id}/pay", json={"force_result": "FAILED"}, headers=auth_header(buyer))
    assert res.status_code == 200
    assert res.json()["status"] == "LOCKED"


def test_cancel_created_deal(client):
    seller = make_user(client, "seller5@test.com", role="seller")

    res = client.post("/deals", json={"title": "Cancel", "amount": "100"}, headers=auth_header(seller))
    deal_id = res.json()["id"]

    res = client.post(f"/deals/{deal_id}/cancel", headers=auth_header(seller))
    assert res.status_code == 200
    assert res.json()["status"] == "CANCELLED"
