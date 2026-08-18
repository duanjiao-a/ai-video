"""MCP server exposing MoneyPrinterTurbo TTS + subtitle generation.

Run with stdio transport (default MCP transport):

    mpt-tts-mcp            # installed console script
    python -m mpt_tts.server
"""

import time
from pathlib import Path

from loguru import logger
from mcp.server.fastmcp import FastMCP

from mpt_tts import utils
from mpt_tts import voice
from mpt_tts import subtitle as subtitle_mod

mcp = FastMCP(
    "mpt-tts-mcp",
    instructions=(
        "Text-to-speech and SRT subtitle generation extracted from "
        "MoneyPrinterTurbo. Providers: edge-tts (default, free, no API key), "
        "Azure Speech V2, SiliconFlow, Gemini, MiMo, MiniMax, ElevenLabs, "
        "Chatterbox, and 'no-voice' silent placeholder audio."
    ),
)

_DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural-Female"


def _resolve_output_dir(output_dir: str | None) -> Path:
    if output_dir:
        d = Path(output_dir).expanduser()
        if not d.is_absolute():
            d = utils.project_root() / d
    else:
        d = utils.output_dir()
    d.mkdir(parents=True, exist_ok=True)
    return d.resolve()


def _resolve_audio_path(output_dir: Path, filename: str | None) -> str:
    if filename:
        name = Path(filename).name
        if not name:
            raise ValueError("filename must not be empty")
    else:
        name = f"tts-{int(time.time())}.mp3"
    if not Path(name).suffix:
        name = f"{name}.mp3"
    return str(output_dir / name)


@mcp.tool()
def tts_synthesize(
    text: str,
    voice_name: str = _DEFAULT_VOICE,
    voice_rate: float = 1.0,
    voice_volume: float = 1.0,
    output_dir: str | None = None,
    filename: str | None = None,
) -> dict:
    """Synthesize speech audio (mp3) from text.

    Args:
        text: The script text to speak.
        voice_name: Voice identifier. Defaults to the edge-tts voice
            "zh-CN-XiaoxiaoNeural-Female". Formats per provider:
            - edge-tts (azure v1): any name from list_tts_voices(), e.g. "zh-CN-XiaoyiNeural-Female"
            - Azure Speech V2: azure v2 name ending with "-V2", e.g. "zh-CN-XiaoxiaoMultilingualNeural-V2-Female"
            - SiliconFlow: "siliconflow:FunAudioLLM/CosyVoice2-0.5B:alex-Female"
            - Gemini: "gemini:Zephyr-Female"
            - MiMo: "mimo:mimo_default-Female"
            - MiniMax: "minimax:<voice_id>"
            - ElevenLabs: "elevenlabs:<voice_id>:<name>"
            - Chatterbox: "chatterbox:default-Female"
            - Silent placeholder: "no-voice"
        voice_rate: Speaking rate multiplier centered at 1.0 (clamped 0.25-4.0).
        voice_volume: Volume multiplier (default 1.0).
        output_dir: Directory to save the audio. Defaults to <project>/output.
        filename: Output file name (extension optional, defaults to .mp3).

    Returns:
        dict: audio_file (absolute path), duration (seconds), voice_name.
    """
    out_dir = _resolve_output_dir(output_dir)
    audio_file = _resolve_audio_path(out_dir, filename)

    logger.info(
        f"tts_synthesize: text_len={len(text)}, voice={voice_name}, "
        f"rate={voice_rate}, volume={voice_volume}"
    )
    sub_maker = voice.tts(
        text=text,
        voice_name=voice.parse_voice_name(voice_name),
        voice_rate=voice_rate,
        voice_file=audio_file,
        voice_volume=voice_volume,
    )
    if sub_maker is None:
        raise RuntimeError(
            f"TTS failed for voice '{voice_name}'. Check the voice name, "
            "provider credentials, and network connectivity."
        )
    duration = voice.get_audio_duration(sub_maker)
    if duration <= 0:
        raise RuntimeError("TTS produced audio with an invalid duration")

    return {
        "audio_file": str(Path(audio_file).resolve()),
        "duration": round(float(duration), 3),
        "voice_name": voice_name,
    }


@mcp.tool()
def tts_synthesize_with_subtitle(
    text: str,
    voice_name: str = _DEFAULT_VOICE,
    voice_rate: float = 1.0,
    voice_volume: float = 1.0,
    output_dir: str | None = None,
    filename: str | None = None,
) -> dict:
    """Synthesize speech and generate an aligned SRT subtitle file in one call.

    The subtitle timeline is built from the TTS word-boundary events, aligned
    to the script sentences.

    Args:
        text: The script text to speak (also used to align subtitles).
        voice_name: Same voice identifier formats as tts_synthesize.
        voice_rate: Speaking rate multiplier centered at 1.0.
        voice_volume: Volume multiplier (default 1.0).
        output_dir: Directory to save audio + subtitle. Defaults to <project>/output.
        filename: Base output name; audio uses it as-is (default .mp3) and the
            subtitle is written next to it as <stem>.srt.

    Returns:
        dict: audio_file, subtitle_file (None if alignment failed), duration
            (seconds), subtitle_count.
    """
    out_dir = _resolve_output_dir(output_dir)
    audio_file = _resolve_audio_path(out_dir, filename)
    subtitle_file = f"{Path(audio_file).with_suffix('')}.srt"

    logger.info(
        f"tts_synthesize_with_subtitle: text_len={len(text)}, voice={voice_name}"
    )
    sub_maker = voice.tts(
        text=text,
        voice_name=voice.parse_voice_name(voice_name),
        voice_rate=voice_rate,
        voice_file=audio_file,
        voice_volume=voice_volume,
    )
    if sub_maker is None:
        raise RuntimeError(
            f"TTS failed for voice '{voice_name}'. Check the voice name, "
            "provider credentials, and network connectivity."
        )
    duration = voice.get_audio_duration(sub_maker)
    if duration <= 0:
        raise RuntimeError("TTS produced audio with an invalid duration")

    voice.create_subtitle(
        sub_maker=sub_maker,
        text=text,
        subtitle_file=subtitle_file,
    )
    subtitle_lines = subtitle_mod.file_to_subtitles(subtitle_file)
    if not subtitle_lines and Path(subtitle_file).exists():
        logger.warning(f"subtitle file is invalid: {subtitle_file}")

    return {
        "audio_file": str(Path(audio_file).resolve()),
        "subtitle_file": (
            str(Path(subtitle_file).resolve()) if Path(subtitle_file).exists() else None
        ),
        "duration": round(float(duration), 3),
        "subtitle_count": len(subtitle_lines),
        "voice_name": voice_name,
    }


@mcp.tool()
def list_tts_voices() -> dict:
    """List available voices per provider.

    edge-tts (azure_v1 / azure_v2) needs no API key; the other providers only
    list their catalog when the corresponding credentials are configured.
    """
    elevenlabs_key = voice.get_elevenlabs_api_key()
    azure_v1 = voice.get_all_azure_voices()
    azure_v2 = [v for v in azure_v1 if voice.is_azure_v2_voice(v)]
    return {
        "azure_v1_edge_tts": azure_v1,
        "azure_v2": azure_v2,
        "siliconflow": voice.get_siliconflow_voices(),
        "gemini": voice.get_gemini_voices(),
        "mimo": voice.get_mimo_voices(),
        "minimax": voice.get_minimax_voices(),
        "elevenlabs": voice.get_elevenlabs_voices(elevenlabs_key),
        "chatterbox": voice.get_chatterbox_voices(),
        "no_voice": ["no-voice"],
    }


def main():
    mcp.run()


if __name__ == "__main__":
    main()
