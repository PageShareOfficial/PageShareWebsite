"""Holiday sale phases and checkout promotion codes."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import UUID

import stripe

from app.schemas.billing import CheckoutSessionBody
from app.services.billing_service import (
    CheckoutSale,
    create_checkout_session,
    resolve_checkout_sale,
    sale_redeemable_for_user,
)
from app.services.holiday_sale import SalePhase, active_sale_phase, sale_strip_faces
from tests.test_billing_service import _settings_with_prices

UTC = timezone.utc
USER_ID = UUID("11111111-1111-1111-1111-111111111111")

def _at(year: int, month: int, day: int, hour: int = 0, minute: int = 0, second: int = 0):
    return datetime(year, month, day, hour, minute, second, tzinfo=UTC)

def test_checkout_stays_off_while_the_strip_is_already_visible():
    moment = _at(2026, 10, 19)
    assert active_sale_phase(moment) is None
    assert _face_codes(moment) == ("EARLYCOMERS15", "BLACKFRIDAY30")

def _face_codes(moment: datetime) -> tuple[str, ...]:
    return tuple(face.code for face in sale_strip_faces(moment))

def test_strip_pairs_the_live_offer_with_the_next_one():
    assert _face_codes(_at(2026, 10, 18, 23, 59, 59)) == ()
    early_and_friday = ("EARLYCOMERS15", "BLACKFRIDAY30")
    assert _face_codes(_at(2026, 10, 19)) == early_and_friday
    assert _face_codes(_at(2026, 11, 26, 23, 59, 59)) == early_and_friday
    assert _face_codes(_at(2026, 11, 27)) == ("BLACKFRIDAY30", "GOODBYE2026")
    assert _face_codes(_at(2026, 12, 2)) == ("GOODBYE2026", "NEWYEAR27")
    assert _face_codes(_at(2026, 12, 25)) == ("NEWYEAR27",)
    assert _face_codes(_at(2027, 1, 5, 23, 59, 59)) == ("NEWYEAR27",)
    assert _face_codes(_at(2027, 1, 6)) == ()

def test_strip_names_the_black_friday_window():
    faces = sale_strip_faces(_at(2026, 10, 19))
    assert faces[0].headline == "Early Access"
    assert faces[1].headline == "Black Friday to Cyber Monday"

def test_phases_cover_the_season_without_overlap():
    assert active_sale_phase(_at(2026, 11, 11, 23, 59, 59)) is None
    assert active_sale_phase(_at(2026, 11, 12)).code == "EARLYCOMERS15"
    assert active_sale_phase(_at(2026, 11, 26, 23, 59, 59)).code == "EARLYCOMERS15"
    assert active_sale_phase(_at(2026, 11, 27)).code == "BLACKFRIDAY30"
    assert active_sale_phase(_at(2026, 12, 1, 23, 59, 59)).code == "BLACKFRIDAY30"
    assert active_sale_phase(_at(2026, 12, 2)).code == "GOODBYE2026"
    assert active_sale_phase(_at(2026, 12, 24, 23, 59, 59)).code == "GOODBYE2026"
    assert active_sale_phase(_at(2026, 12, 25)).code == "NEWYEAR27"
    assert active_sale_phase(_at(2027, 1, 5, 23, 59, 59)).code == "NEWYEAR27"
    assert active_sale_phase(_at(2027, 1, 6)) is None

def _checkout_body() -> CheckoutSessionBody:
    return CheckoutSessionBody(
        plan_id="analyst",
        interval="monthly",
        success_url="https://app.test/success",
        cancel_url="https://app.test/cancel",
    )

def _open_session(sale_code: str) -> dict:
    return {
        "metadata": {
            "plan_id": "analyst",
            "interval": "monthly",
            "sale_code": sale_code,
        },
        "url": "https://checkout.stripe.test/open",
        "automatic_tax": {"enabled": True},
        "tax_id_collection": {"enabled": True},
    }

@patch("app.services.billing_service.stripe.checkout.Session.create")
@patch("app.services.billing_service.stripe.checkout.Session.list")
@patch("app.services.billing_service.get_or_create_stripe_customer")
@patch("app.services.billing_service.get_entitlement")
@patch("app.services.billing_service.resolve_checkout_sale")
def test_checkout_applies_the_active_promotion_code(
    mock_sale, mock_entitlement, mock_customer, mock_list, mock_create
):
    mock_entitlement.return_value = None
    mock_customer.return_value = "cus_123"
    mock_list.return_value = MagicMock(data=[])
    mock_sale.return_value = CheckoutSale("BLACKFRIDAY30", "promo_bf")
    mock_create.return_value = {"url": "https://checkout.stripe.test/sale"}

    url = create_checkout_session(
        MagicMock(), _settings_with_prices(), user_id=USER_ID, body=_checkout_body()
    )

    assert url == "https://checkout.stripe.test/sale"
    params = mock_create.call_args.kwargs
    assert params["discounts"] == [{"promotion_code": "promo_bf"}]
    assert params["metadata"]["sale_code"] == "BLACKFRIDAY30"

@patch("app.services.billing_service.stripe.checkout.Session.create")
@patch("app.services.billing_service.stripe.checkout.Session.list")
@patch("app.services.billing_service.get_or_create_stripe_customer")
@patch("app.services.billing_service.get_entitlement")
@patch("app.services.billing_service.resolve_checkout_sale")
def test_checkout_skips_a_session_from_another_phase(
    mock_sale, mock_entitlement, mock_customer, mock_list, mock_create
):
    mock_entitlement.return_value = None
    mock_customer.return_value = "cus_123"
    mock_list.return_value = MagicMock(data=[_open_session("EARLYCOMERS15")])
    mock_sale.return_value = CheckoutSale("BLACKFRIDAY30", "promo_bf")
    mock_create.return_value = {"url": "https://checkout.stripe.test/fresh"}

    url = create_checkout_session(
        MagicMock(), _settings_with_prices(), user_id=USER_ID, body=_checkout_body()
    )

    assert url == "https://checkout.stripe.test/fresh"
    mock_create.assert_called_once()

@patch("app.services.billing_service.stripe.checkout.Session.create")
@patch("app.services.billing_service.stripe.checkout.Session.list")
@patch("app.services.billing_service.get_or_create_stripe_customer")
@patch("app.services.billing_service.get_entitlement")
@patch("app.services.billing_service.resolve_checkout_sale")
def test_checkout_reuses_a_session_for_the_same_phase(
    mock_sale, mock_entitlement, mock_customer, mock_list, mock_create
):
    mock_entitlement.return_value = None
    mock_customer.return_value = "cus_123"
    mock_list.return_value = MagicMock(data=[_open_session("BLACKFRIDAY30")])
    mock_sale.return_value = CheckoutSale("BLACKFRIDAY30", "promo_bf")

    url = create_checkout_session(
        MagicMock(), _settings_with_prices(), user_id=USER_ID, body=_checkout_body()
    )

    assert url == "https://checkout.stripe.test/open"
    mock_create.assert_not_called()

@patch("app.services.billing_service.stripe.checkout.Session.create")
@patch("app.services.billing_service.stripe.checkout.Session.list")
@patch("app.services.billing_service.get_or_create_stripe_customer")
@patch("app.services.billing_service.get_entitlement")
@patch("app.services.billing_service.resolve_checkout_sale")
def test_rejected_promotion_code_falls_back_to_list_price(
    mock_sale, mock_entitlement, mock_customer, mock_list, mock_create
):
    mock_entitlement.return_value = None
    mock_customer.return_value = "cus_123"
    mock_list.return_value = MagicMock(data=[])
    mock_sale.return_value = CheckoutSale("BLACKFRIDAY30", "promo_bf")
    mock_create.side_effect = [
        stripe.InvalidRequestError("This promotion code cannot be redeemed", "discounts"),
        {"url": "https://checkout.stripe.test/full"},
    ]

    url = create_checkout_session(
        MagicMock(), _settings_with_prices(), user_id=USER_ID, body=_checkout_body()
    )

    assert url == "https://checkout.stripe.test/full"
    assert mock_create.call_count == 2
    assert "discounts" not in mock_create.call_args_list[1].kwargs
    assert "sale_code" not in mock_create.call_args_list[1].kwargs["metadata"]

def _early_phase() -> SalePhase:
    return SalePhase(
        code="EARLYCOMERS15",
        percent_off=15,
        name="Early Access",
        offer="Black Friday starts early",
        starts_at=_at(2026, 11, 12),
        ends_at=_at(2026, 11, 27),
    )

def _promo() -> dict:
    return {"id": "promo_early"}

@patch("app.services.billing_service.stripe.Subscription.list")
@patch("app.services.billing_service.stripe.Invoice.list")
@patch("app.services.billing_service.stripe.PromotionCode.list")
@patch("app.services.billing_service.active_sale_phase")
def test_a_new_customer_gets_the_live_code(mock_phase, mock_promo, mock_invoices, mock_subs):
    mock_phase.return_value = _early_phase()
    mock_promo.return_value = MagicMock(data=[_promo()])
    mock_invoices.return_value = MagicMock(data=[])
    mock_subs.return_value = MagicMock(data=[])

    sale = resolve_checkout_sale(_settings_with_prices(), "cus_new", now=_at(2026, 11, 12))

    assert sale == CheckoutSale("EARLYCOMERS15", "promo_early")

@patch("app.services.billing_service.stripe.PromotionCode.list")
@patch("app.services.billing_service.stripe.Subscription.list")
@patch("app.services.billing_service.stripe.Invoice.list")
@patch("app.services.billing_service.active_sale_phase")
def test_a_canceled_customer_does_not_get_a_code(mock_phase, mock_invoices, mock_subs, mock_promo):
    mock_phase.return_value = _early_phase()
    mock_invoices.return_value = MagicMock(data=[{"amount_paid": 7900}])
    mock_subs.return_value = MagicMock(data=[{"status": "canceled"}])

    sale = resolve_checkout_sale(_settings_with_prices(), "cus_canceled", now=_at(2026, 11, 12))

    assert sale is None
    mock_promo.assert_not_called()

@patch("app.services.billing_service.stripe.Subscription.list")
@patch("app.services.billing_service.stripe.Invoice.list")
@patch("app.services.billing_service.stripe.PromotionCode.list")
@patch("app.services.billing_service.active_sale_phase")
def test_an_existing_sale_code_blocks_the_next_one(mock_phase, mock_promo, mock_invoices, mock_subs):
    mock_phase.return_value = _early_phase()
    mock_invoices.return_value = MagicMock(data=[])
    mock_subs.return_value = MagicMock(
        data=[{"discount": {"promotion_code": {"code": "EARLYCOMERS15"}}}]
    )

    sale = resolve_checkout_sale(_settings_with_prices(), "cus_sale", now=_at(2026, 11, 27))

    assert sale is None
    mock_promo.assert_not_called()

@patch("app.services.billing_service.stripe.Subscription.list")
@patch("app.services.billing_service.stripe.Invoice.list")
@patch("app.services.billing_service.stripe.PromotionCode.list")
@patch("app.services.billing_service.active_sale_phase")
def test_a_full_price_subscriber_can_use_one_sale_code(
    mock_phase, mock_promo, mock_invoices, mock_subs
):
    mock_phase.return_value = _early_phase()
    mock_promo.return_value = MagicMock(data=[_promo()])
    mock_invoices.return_value = MagicMock(data=[{"amount_paid": 7900}])
    mock_subs.return_value = MagicMock(data=[{"status": "active"}])

    sale = resolve_checkout_sale(_settings_with_prices(), "cus_full", now=_at(2026, 11, 12))

    assert sale == CheckoutSale("EARLYCOMERS15", "promo_early")

@patch("app.services.billing_service.customer_can_redeem_sale", return_value=False)
@patch("app.services.billing_service.get_entitlement")
def test_a_customer_who_already_paid_cannot_see_another_code(mock_row, _mock_redeem):
    mock_row.return_value = MagicMock(stripe_customer_id="cus_paid")
    assert sale_redeemable_for_user(MagicMock(), _settings_with_prices(), USER_ID) is False

@patch("app.services.billing_service.get_entitlement")
def test_an_account_with_no_stripe_customer_can_still_redeem(mock_row):
    mock_row.return_value = None
    assert sale_redeemable_for_user(MagicMock(), _settings_with_prices(), USER_ID) is True

@patch("app.services.billing_service.stripe.Invoice.list")
@patch("app.services.billing_service.active_sale_phase")
def test_a_stripe_history_error_skips_the_sale(mock_phase, mock_invoices):
    mock_phase.return_value = _early_phase()
    mock_invoices.side_effect = stripe.StripeError("Invoice list failed")

    sale = resolve_checkout_sale(_settings_with_prices(), "cus_new", now=_at(2026, 11, 12))

    assert sale is None
