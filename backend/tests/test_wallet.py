from decimal import Decimal

from tests.conftest import auth_header, make_user


def _complete_deal(client, seller_token, buyer_token, amount="1000"):
    res = client.post("/deals", json={"title": "Deal", "amount": amount}, headers=auth_header(seller_token))
    token = res.json()["unique_token"]
    deal_id = res.json()["id"]
    client.post(f"/deals/{token}/accept", headers=auth_header(buyer_token))
    client.post(f"/deals/{deal_id}/pay", json={"force_result": "VERIFIED"}, headers=auth_header(buyer_token))
    client.post(f"/deals/{deal_id}/confirm", headers=auth_header(buyer_token))
    return deal_id


def test_wallet_credited_after_done(client):
    seller = make_user(client, "wseller@test.com")
    buyer = make_user(client, "wbuyer@test.com")

    _complete_deal(client, seller, buyer, "1000")

    res = client.get("/wallet", headers=auth_header(seller))
    assert res.status_code == 200
    wallet = res.json()
    assert Decimal(wallet["balance"]) > 0
    assert len(wallet["transactions"]) == 1
    assert wallet["transactions"][0]["type"] == "CREDIT"


def test_wallet_reconciliation(client):
    """wallet.balance must equal sum of CREDIT transactions."""
    seller = make_user(client, "wseller2@test.com")
    buyer = make_user(client, "wbuyer2@test.com")

    _complete_deal(client, seller, buyer, "500")
    _complete_deal(client, seller, buyer, "300")

    res = client.get("/wallet", headers=auth_header(seller))
    wallet = res.json()
    balance = Decimal(wallet["balance"])
    credit_sum = sum(Decimal(t["amount"]) for t in wallet["transactions"] if t["type"] == "CREDIT")
    assert balance == credit_sum


def test_withdrawal_reduces_balance(client):
    seller = make_user(client, "wseller3@test.com")
    buyer = make_user(client, "wbuyer3@test.com")

    _complete_deal(client, seller, buyer, "1000")

    res = client.get("/wallet", headers=auth_header(seller))
    before = Decimal(res.json()["balance"])

    res = client.post(
        "/wallet/withdraw",
        json={"amount": "100", "bank_account": "1234567890", "bank_name": "KBank", "account_name": "Test User"},
        headers=auth_header(seller),
    )
    assert res.status_code == 201

    res = client.get("/wallet", headers=auth_header(seller))
    after = Decimal(res.json()["balance"])
    assert after == before - Decimal("100")


def test_withdrawal_insufficient_balance(client):
    seller = make_user(client, "wseller4@test.com")

    res = client.post(
        "/wallet/withdraw",
        json={"amount": "999999", "bank_account": "0000", "bank_name": "Bank", "account_name": "Nobody"},
        headers=auth_header(seller),
    )
    assert res.status_code == 400
