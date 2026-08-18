"""mpt-tts-mcp 批量测试脚本。

支持两种模式：
- 直连模式（默认）：直接调用 mpt_tts 函数，逐个提供商合成音频+字幕；
- MCP 模式（--mcp）：通过 stdio 启动真实 MCP 服务器，走完整协议调用工具。

用法：
    uv --cache-dir .uv-cache run python test_mcp.py                          # 测试所有已配置的提供商
    uv --cache-dir .uv-cache run python test_mcp.py --provider edge,gemini   # 只测指定提供商
    uv --cache-dir .uv-cache run python test_mcp.py --mcp                    # 走完整 MCP 协议
    uv --cache-dir .uv-cache run python test_mcp.py --list                   # 仅列出各提供商音色
    uv --cache-dir .uv-cache run python test_mcp.py --text "自定义文本" --rate 1.2
"""

import argparse
import asyncio
import json
import sys
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", message=".*incomplete definition.*")

from loguru import logger

# 只保留 WARNING 以上日志，保持测试输出干净
logger.remove()
logger.add(sys.stderr, level="WARNING")

from mpt_tts import config, voice  # noqa: E402

DEFAULT_TEXT = "你好，这是语音合成批量测试。让我们验证音质和字幕效果。"

_DEFAULT_CHATTERBOX_URL = "http://127.0.0.1:4123/v1"

# 各提供商定义：name / 展示名 / 是否已配置 / 该用什么音色
PROVIDERS = [
    {
        "name": "edge",
        "label": "Edge TTS (azure v1)",
        "configured": lambda: True,
        "voice": lambda: "zh-CN-XiaoxiaoNeural-Female",
    },
    {
        "name": "no-voice",
        "label": "No-voice (silent)",
        "configured": lambda: True,
        "voice": lambda: "no-voice",
    },
    {
        "name": "azure_v2",
        "label": "Azure Speech V2",
        "configured": lambda: bool(
            config.azure.get("speech_key") and config.azure.get("speech_region")
        ),
        "voice": lambda: "zh-CN-XiaoxiaoMultilingualNeural-V2-Female",
    },
    {
        "name": "siliconflow",
        "label": "SiliconFlow",
        "configured": lambda: bool(config.siliconflow.get("api_key")),
        "voice": lambda: voice.get_siliconflow_voices()[0],
    },
    {
        "name": "gemini",
        "label": "Gemini",
        "configured": lambda: bool(config.app.get("gemini_api_key")),
        "voice": lambda: voice.get_gemini_voices()[0],
    },
    {
        "name": "mimo",
        "label": "MiMo",
        "configured": lambda: bool(config.app.get("mimo_api_key")),
        "voice": lambda: voice.get_mimo_voices()[0],
    },
    {
        "name": "minimax",
        "label": "MiniMax",
        "configured": lambda: bool(voice.get_minimax_tts_api_key()),
        "voice": lambda: voice.get_minimax_voices()[0],
    },
    {
        "name": "elevenlabs",
        "label": "ElevenLabs",
        "configured": lambda: bool(voice.get_elevenlabs_api_key()),
        "voice": lambda: (
            voice.get_elevenlabs_voices(voice.get_elevenlabs_api_key()) or [None]
        )[0],
    },
    {
        "name": "chatterbox",
        "label": "Chatterbox",
        # 使用默认地址视为未显式配置，跳过测试
        "configured": lambda: bool(config.chatterbox.get("base_url"))
        and str(config.chatterbox.get("base_url")) != _DEFAULT_CHATTERBOX_URL,
        "voice": lambda: voice.get_chatterbox_voices()[0],
    },
]

PROVIDER_BY_NAME = {p["name"]: p for p in PROVIDERS}


def _selected_providers(names: list[str] | None) -> list[dict]:
    if not names:
        return PROVIDERS
    selected = []
    for name in names:
        name = name.strip()
        if name not in PROVIDER_BY_NAME:
            raise SystemExit(f"未知提供商: {name}，可用: {', '.join(PROVIDER_BY_NAME)}")
        selected.append(PROVIDER_BY_NAME[name])
    return selected


def _print_summary(results: list[tuple[dict, str, str, dict | None]]):
    print("\n================ 测试结果汇总 ================")
    width = max(len(p["name"]) for p, _, _, _ in results)
    for provider, status, detail, _ in results:
        print(f"  {provider['name'].ljust(width)}  {status:<5}  {detail}")
    passed = sum(1 for _, s, _, _ in results if s == "PASS")
    skipped = sum(1 for _, s, _, _ in results if s == "SKIP")
    failed = sum(1 for _, s, _, _ in results if s == "FAIL")
    print("  ------------------------------------------")
    print(f"  PASS={passed}  FAIL={failed}  SKIP={skipped}  TOTAL={len(results)}")
    print("=============================================")


def test_direct(provider: dict, text: str, rate: float, volume: float, out_dir: Path):
    """直连模式：单提供商测试，返回 (status, detail, result_dict)。"""
    try:
        voice_name = provider["voice"]()
        if not voice_name:
            return "SKIP", "音色列表为空（未配置该提供商音色）", None

        result = _call_direct(provider, text, rate, volume, voice_name, out_dir)
        audio_ok = Path(result["audio_file"]).is_file() and result["duration"] > 0
        subtitle_ok = bool(result.get("subtitle_file"))
        detail = (
            f"voice={voice_name} audio={result['duration']:.2f}s "
            f"subtitle={'OK' if subtitle_ok else '无'}"
        )
        return ("PASS" if audio_ok else "FAIL"), detail, result
    except Exception as e:
        return "FAIL", f"{type(e).__name__}: {e}", None


def _call_direct(provider, text, rate, volume, voice_name, out_dir):
    from mpt_tts.server import tts_synthesize_with_subtitle

    return tts_synthesize_with_subtitle(
        text=text,
        voice_name=voice_name,
        voice_rate=rate,
        voice_volume=volume,
        output_dir=str(out_dir),
        filename=f"{provider['name']}-{int(time.time())}.mp3",
    )


async def test_mcp(
    providers: list[dict], text: str, rate: float, volume: float, out_dir: Path
):
    """MCP 模式：通过 stdio 协议逐个调用工具。"""
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    params = StdioServerParameters(
        command="uv",
        args=["--cache-dir", ".uv-cache", "run", "mpt-tts-mcp"],
        env={"PYTHONDONTWRITEBYTECODE": "1"},
    )

    results = []
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print("MCP 握手成功，可用工具:", [t.name for t in tools.tools])

            for provider in providers:
                try:
                    voice_name = provider["voice"]()
                    if not voice_name:
                        results.append(
                            (provider, "SKIP", "音色列表为空（未配置该提供商音色）", None)
                        )
                        continue

                    print(f"\n>>> 测试 [{provider['label']}] voice={voice_name} ...")
                    res = await session.call_tool(
                        "tts_synthesize_with_subtitle",
                        {
                            "text": text,
                            "voice_name": voice_name,
                            "voice_rate": rate,
                            "voice_volume": volume,
                            "output_dir": str(out_dir),
                        },
                    )
                    payload = json.loads(res.content[0].text)
                    audio_ok = Path(payload["audio_file"]).is_file() and payload["duration"] > 0
                    detail = (
                        f"voice={voice_name} audio={payload['duration']:.2f}s "
                        f"subtitle={'OK' if payload.get('subtitle_file') else '无'}"
                    )
                    results.append(
                        (provider, "PASS" if audio_ok else "FAIL", detail, payload)
                    )
                except Exception as e:
                    results.append(
                        (provider, "FAIL", f"{type(e).__name__}: {e}", None)
                    )
    return results


def show_voices():
    """列出各提供商音色数量。"""
    from mpt_tts.server import list_tts_voices

    catalog = list_tts_voices()
    print("================ 可用音色概览 ================")
    for key, voices in catalog.items():
        if isinstance(voices, list):
            shown = len(voices)
            sample = f" e.g. {voices[0]}" if shown else ""
            print(f"  {key:<22} {shown} 个{sample}")
        else:
            print(f"  {key:<22} {voices}")
    print("=============================================")


def main():
    parser = argparse.ArgumentParser(description="mpt-tts-mcp 批量测试")
    parser.add_argument(
        "--provider",
        help="逗号分隔的提供商名，如 edge,gemini,mimo；不填则测试所有已配置的",
    )
    parser.add_argument("--mcp", action="store_true", help="走完整 MCP 协议测试")
    parser.add_argument("--text", default=DEFAULT_TEXT, help="测试文本（默认中文示例）")
    parser.add_argument("--rate", type=float, default=1.0, help="语速倍率（默认 1.0）")
    parser.add_argument("--volume", type=float, default=1.0, help="音量倍率（默认 1.0）")
    parser.add_argument("--out-dir", default="output/test", help="输出目录（默认 output/test）")
    parser.add_argument("--list", action="store_true", help="仅列出音色，不执行合成")
    args = parser.parse_args()

    if args.list:
        show_voices()
        return

    providers = _selected_providers(
        [p.strip() for p in args.provider.split(",")] if args.provider else None
    )
    if not providers:
        print("未指定提供商")
        return

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"测试文本: {args.text!r}")
    print(f"语速: {args.rate}  音量: {args.volume}")
    print(f"输出目录: {out_dir}\n")

    results = []
    if args.mcp:
        results = asyncio.run(test_mcp(providers, args.text, args.rate, args.volume, out_dir))
    else:
        for provider in providers:
            if not provider["configured"]():
                results.append((provider, "SKIP", "未配置凭据（环境变量或 config.toml）", None))
                continue
            print(f">>> 测试 [{provider['label']}] ...")
            status, detail, result = test_direct(
                provider, args.text, args.rate, args.volume, out_dir
            )
            print(f"    {status}: {detail}")
            results.append((provider, status, detail, result))

    _print_summary(results)


if __name__ == "__main__":
    main()
