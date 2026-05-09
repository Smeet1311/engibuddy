import logging
import time
from dataclasses import dataclass
from threading import Lock
from typing import Any
from uuid import uuid4


logger = logging.getLogger(__name__)


@dataclass
class RequestContext:
    request_id: str
    started_at: float

    @property
    def elapsed_ms(self) -> int:
        return int((time.perf_counter() - self.started_at) * 1000)


class RetrievalMetrics:
    """In-memory counters for RAG retrieval diagnostics."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._stats: dict[str, dict[str, int]] = {}

    def record(self, phase_id: int, top_k: int, empty: bool) -> dict[str, int]:
        key = f"phase_{phase_id}"
        with self._lock:
            phase_stats = self._stats.setdefault(
                key,
                {"requests": 0, "empty_hits": 0, "topk_total": 0},
            )
            phase_stats["requests"] += 1
            phase_stats["topk_total"] += max(0, int(top_k))
            if empty:
                phase_stats["empty_hits"] += 1
            requests = max(phase_stats["requests"], 1)
            return {
                "requests": requests,
                "empty_rate_pct": int((phase_stats["empty_hits"] / requests) * 100),
                "avg_top_k": round(phase_stats["topk_total"] / requests),
            }

    def snapshot(self) -> dict[str, dict[str, int]]:
        with self._lock:
            return {key: value.copy() for key, value in self._stats.items()}


retrieval_metrics = RetrievalMetrics()


def start_request() -> RequestContext:
    return RequestContext(request_id=f"req-{uuid4().hex[:12]}", started_at=time.perf_counter())


def log_request(request: RequestContext, message: str, **fields: Any) -> None:
    payload = {"request_id": request.request_id, "latency_ms": request.elapsed_ms, **fields}
    logger.info("%s | %s", message, payload)


def log_event(message: str, **fields: Any) -> None:
    logger.info("%s | %s", message, fields)
