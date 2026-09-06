from celery import Celery
from app.config import settings

celery_app = Celery(
    "merchander_intelligence",
    broker=settings.effective_celery_broker,
    backend=settings.effective_celery_backend,
    include=[
        "app.tasks.extraction",
        "app.tasks.notifications",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=120,
    task_soft_time_limit=90,
    result_expires=3600,  # Expire task results after 1 hour
)
