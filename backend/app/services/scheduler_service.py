from apscheduler.schedulers.background import BackgroundScheduler

_scheduler = BackgroundScheduler()


def start_scheduler():
    _scheduler.start()


def shutdown_scheduler():
    _scheduler.shutdown(wait=False)


def get_scheduler() -> BackgroundScheduler:
    return _scheduler
