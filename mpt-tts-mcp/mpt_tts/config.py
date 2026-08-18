"""Configuration for mpt-tts-mcp.

Value resolution order (highest first):
1. Environment variables (e.g. EDGE_TTS_TIMEOUT, AZURE_SPEECH_KEY);
2. A local ``config.toml`` next to the project root (same section layout as
   MoneyPrinterTurbo, e.g. ``[azure] speech_key = "..."``);
3. Built-in defaults.

Access style mirrors MoneyPrinterTurbo so the extracted TTS code stays intact:
``config.app.get("gemini_api_key")``, ``config.minimax_tts.get("voice_id")`` ...
"""

import os
from pathlib import Path

import toml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_FILE = PROJECT_ROOT / "config.toml"

_cfg = {}
if CONFIG_FILE.is_file():
    try:
        _cfg = toml.load(CONFIG_FILE)
    except Exception:
        _cfg = {}


def _get(section: str, key: str, env_name: str, default):
    env_value = os.getenv(env_name)
    if env_value is not None and str(env_value).strip() != "":
        return env_value
    value = _cfg.get(section, {}).get(key)
    if value is not None:
        return value
    return default


app = {
    "edge_tts_timeout": _get("app", "edge_tts_timeout", "EDGE_TTS_TIMEOUT", 30),
    "ffmpeg_path": _get("app", "ffmpeg_path", "FFMPEG_PATH", ""),
    "gemini_api_key": _get("app", "gemini_api_key", "GEMINI_API_KEY", ""),
    "mimo_api_key": _get("app", "mimo_api_key", "MIMO_API_KEY", ""),
    "mimo_base_url": _get("app", "mimo_base_url", "MIMO_BASE_URL", ""),
    "mimo_tts_model_name": _get(
        "app", "mimo_tts_model_name", "MIMO_TTS_MODEL_NAME", "mimo-v2.5-tts"
    ),
    "mimo_tts_style_prompt": _get(
        "app",
        "mimo_tts_style_prompt",
        "MIMO_TTS_STYLE_PROMPT",
        "请用自然、清晰、适合短视频旁白的语气朗读。",
    ),
    "minimax_api_key": _get("app", "minimax_api_key", "MINIMAX_API_KEY", ""),
    "minimax_base_url": _get("app", "minimax_base_url", "MINIMAX_BASE_URL", ""),
    "subtitle_provider": _get("app", "subtitle_provider", "SUBTITLE_PROVIDER", "edge"),
}

azure = {
    "speech_key": _get("azure", "speech_key", "AZURE_SPEECH_KEY", ""),
    "speech_region": _get("azure", "speech_region", "AZURE_SPEECH_REGION", ""),
}

siliconflow = {
    "api_key": _get("siliconflow", "api_key", "SILICONFLOW_API_KEY", ""),
}

minimax_tts = {
    "api_key": _get("minimax_tts", "api_key", "MINIMAX_TTS_API_KEY", ""),
    "base_url": _get("minimax_tts", "base_url", "MINIMAX_TTS_BASE_URL", ""),
    "model_id": _get("minimax_tts", "model_id", "MINIMAX_TTS_MODEL_ID", "speech-2.8-hd"),
    "voice_id": _get(
        "minimax_tts",
        "voice_id",
        "MINIMAX_TTS_VOICE_ID",
        "English_expressive_narrator",
    ),
    "sample_rate": int(
        _get("minimax_tts", "sample_rate", "MINIMAX_TTS_SAMPLE_RATE", 32000)
    ),
    "bitrate": int(_get("minimax_tts", "bitrate", "MINIMAX_TTS_BITRATE", 128000)),
    "audio_format": _get(
        "minimax_tts", "audio_format", "MINIMAX_TTS_AUDIO_FORMAT", "mp3"
    ),
    "channel": int(_get("minimax_tts", "channel", "MINIMAX_TTS_CHANNEL", 1)),
    "pitch": int(_get("minimax_tts", "pitch", "MINIMAX_TTS_PITCH", 0)),
}

elevenlabs = {
    "api_key": _get("elevenlabs", "api_key", "ELEVENLABS_API_KEY", ""),
    "model_id": _get(
        "elevenlabs", "model_id", "ELEVENLABS_MODEL_ID", "eleven_multilingual_v2"
    ),
}

chatterbox = {
    "base_url": _get(
        "chatterbox",
        "base_url",
        "CHATTERBOX_BASE_URL",
        "http://127.0.0.1:4123/v1",
    ),
    "api_key": _get("chatterbox", "api_key", "CHATTERBOX_API_KEY", ""),
    "model_id": _get("chatterbox", "model_id", "CHATTERBOX_MODEL_ID", "chatterbox"),
    "voices": _get(
        "chatterbox", "voices", "CHATTERBOX_VOICES", "default-Female"
    ).split(","),
}

_ffmpeg_path = str(app.get("ffmpeg_path") or "")
if _ffmpeg_path and Path(_ffmpeg_path).is_file():
    os.environ["IMAGEIO_FFMPEG_EXE"] = _ffmpeg_path
