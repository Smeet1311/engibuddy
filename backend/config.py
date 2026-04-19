"""
LLM Configuration Management

Centralizes API key, base URL, and model name from environment variables.
Validates configuration on startup.
"""

import os
from dataclasses import dataclass


@dataclass
class LLMConfig:
    """Immutable LLM configuration."""
    api_key: str
    base_url: str
    model: str

    def __post_init__(self):
        """Validate configuration on creation."""
        if not self.api_key or not self.api_key.strip():
            raise ValueError("OPENAI_API_KEY is required and cannot be empty.")
        if not self.base_url or not self.base_url.strip():
            raise ValueError("OPENAI_BASE_URL is required.")
        if not self.model or not self.model.strip():
            raise ValueError("OPENAI_MODEL is required.")


def get_llm_config() -> LLMConfig:
    """
    Read and validate LLM configuration from environment variables.

    Environment variables:
    - OPENAI_API_KEY: Required. Your OpenAI API key.
    - OPENAI_BASE_URL: Optional, defaults to https://api.openai.com/v1
    - OPENAI_MODEL: Optional, defaults to gpt-4o-mini

    Returns:
        LLMConfig: Validated configuration object.

    Raises:
        ValueError: If OPENAI_API_KEY is missing or empty.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    return LLMConfig(api_key=api_key, base_url=base_url, model=model)
