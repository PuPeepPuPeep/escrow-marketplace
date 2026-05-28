import logging

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)
_scheduler = BackgroundScheduler()


def start_scheduler() -> None:
    _scheduler.start()
    _recover_on_startup()


def shutdown_scheduler() -> None:
    _scheduler.shutdown(wait=False)


def get_scheduler() -> BackgroundScheduler:
    return _scheduler


def _recover_on_startup() -> None:
    try:
        from app.services.deal_service import recover_expired_deals
        recover_expired_deals()
    except Exception:
        logger.exception("startup recovery failed")
