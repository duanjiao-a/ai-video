# -*- coding: utf-8 -*-
"""
通用 TTS 生成脚本（固化自 MoneyPrinterTurbo app/services/voice.py）

支持音色提供方（按 voice 名前缀自动分发）：
  - 无前缀                     -> Edge TTS（微软免费接口，azure_tts_v1）
  - 名字以 "-V2" 结尾           -> Azure Speech v2（需 speech_key / speech_region）
  - siliconflow:model:voice    -> 硅基流动 CosyVoice
  - gemini:voice               -> Google Gemini TTS
  - mimo:voice                 -> 小米 MiMo V2.5 TTS
  - minimax:voice_id           -> MiniMax T2A
  - elevenlabs:voice_id:name   -> ElevenLabs
  - chatterbox:voice           -> 自托管 Chatterbox
  - no-voice / none            -> 静音占位（需 ffmpeg）

用法示例（默认固定 edge-tts + zh-CN-XiaoxiaoNeural + rate 1.2）：
  python generate-tts.py --text "大家好，欢迎收看。" --out voice.mp3
  python generate-tts.py --text-file narration.txt --voice gemini:Kore-Female --out voice.mp3 --subtitle voice.srt

配置：默认读取本脚本同目录 config.json（不存在也可），并可用环境变量覆盖：
  EDGE_TTS_TIMEOUT、AZURE_SPEECH_KEY、AZURE_SPEECH_REGION、
  SILICONFLOW_API_KEY、GEMINI_API_KEY、MIMO_API_KEY、MIMO_BASE_URL、
  MINIMAX_API_KEY、ELEVENLABS_API_KEY、CHATTERBOX_BASE_URL

依赖（按需延迟导入）：
  edge-tts  requests  moviepy  pydub  openai  google-genai  azure-cognitiveservices-speech
"""

import argparse
import asyncio
import base64
import inspect
import io
import json
import math
import os
import queue
import re
import shutil
import subprocess
import tempfile
import threading
import time
import unicodedata
from datetime import datetime
from typing import Union
from urllib.parse import urlparse
from xml.sax.saxutils import escape, unescape

import edge_tts
from edge_tts import SubMaker

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------
_DEFAULT_EDGE_TTS_TIMEOUT_SECONDS = 30.0
_MIMO_DEFAULT_BASE_URL = "https://api.xiaomimimo.com/v1"
_MIMO_DEFAULT_TTS_MODEL = "mimo-v2.5-tts"
MINIMAX_TTS_GLOBAL_URL = "https://api.minimax.io/v1/t2a_v2"
MINIMAX_TTS_CN_URL = "https://api.minimaxi.com/v1/t2a_v2"
MINIMAX_TTS_DEFAULT_MODEL = "speech-2.8-hd"
MINIMAX_TTS_MODELS = (
    "speech-2.8-hd", "speech-2.8-turbo", "speech-2.6-hd", "speech-2.6-turbo",
    "speech-02-hd", "speech-02-turbo", "speech-01-hd", "speech-01-turbo",
)
_MINIMAX_TTS_MAX_AUDIO_HEX_CHARS = 100 * 1024 * 1024
NO_VOICE_NAME = "no-voice"
_NO_VOICE_ALIASES = {NO_VOICE_NAME, "none"}

PUNCTUATIONS = [
    "?", ",", ".", "、", ";", ":", "!", "…", "？", "，", "。", "、", "；", "：", "！",
    "...",
    # 阿拉伯语常用标点也应作为自然断句点
    "،", "؛", "؟",
]

_ARABIC_DIACRITICS = re.compile("[\u0610-\u061A\u064B-\u065F\u0670\u0640\u06D6-\u06ED]")


# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
class Config:
    """简化版配置：嵌套 section.key 读取，缺省返回空。"""

    def __init__(self, data: dict = None):
        self.data = data or {}

    def get(self, section: str, key: str, default=None):
        return self.data.get(section, {}).get(key, default)


def _load_config(config_path: str = "") -> Config:
    data = {}
    if not config_path:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)

    def _fill(section, key, env_name, default=""):
        env_val = os.getenv(env_name, "")
        if env_val:
            data.setdefault(section, {})[key] = env_val

    _fill("app", "edge_tts_timeout", "EDGE_TTS_TIMEOUT")
    _fill("azure", "speech_key", "AZURE_SPEECH_KEY")
    _fill("azure", "speech_region", "AZURE_SPEECH_REGION")
    _fill("siliconflow", "api_key", "SILICONFLOW_API_KEY")
    _fill("app", "gemini_api_key", "GEMINI_API_KEY")
    _fill("app", "mimo_api_key", "MIMO_API_KEY")
    _fill("app", "mimo_base_url", "MIMO_BASE_URL")
    _fill("minimax_tts", "api_key", "MINIMAX_API_KEY")
    _fill("elevenlabs", "api_key", "ELEVENLABS_API_KEY")
    _fill("chatterbox", "base_url", "CHATTERBOX_BASE_URL")
    return Config(data)


config = _load_config()


# ---------------------------------------------------------------------------
# 基础工具
# ---------------------------------------------------------------------------
def get_ffmpeg_binary() -> str:
    """按优先级解析 ffmpeg 可执行文件。"""
    configured_ffmpeg = os.environ.get("IMAGEIO_FFMPEG_EXE")
    if configured_ffmpeg:
        return configured_ffmpeg
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    try:
        import imageio_ffmpeg
        bundled_ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        if bundled_ffmpeg:
            return bundled_ffmpeg
    except Exception:
        pass
    return "ffmpeg"


def parse_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower().lstrip(".")


def split_string_by_punctuations(s: str) -> list:
    result = []
    txt = ""
    previous_char = ""
    next_char = ""
    for i in range(len(s)):
        char = s[i]
        if char == "\n":
            result.append(txt.strip())
            txt = ""
            continue
        if i > 0:
            previous_char = s[i - 1]
        if i < len(s) - 1:
            next_char = s[i + 1]
        # 小数点和千分位逗号不是断句符
        if char == "." and previous_char.isdigit() and next_char.isdigit():
            txt += char
            continue
        if char == "," and previous_char.isdigit() and next_char.isdigit():
            txt += char
            continue
        if char not in PUNCTUATIONS:
            txt += char
        else:
            result.append(txt.strip())
            txt = ""
    result.append(txt.strip())
    return list(filter(None, result))


def normalize_script_for_subtitle_matching(video_script: str) -> str:
    """清理字幕匹配前的脚本文本（Markdown 强调符、分隔符行等）。"""
    video_script = video_script or ""
    video_script = video_script.replace("_", "")
    cleaned_lines = []
    for line in video_script.splitlines():
        line = line.strip()
        if re.fullmatch(r"[-*_]{3,}", line):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


def ensure_file_path_exists(file_path: str) -> None:
    """确保输出文件所在目录存在。"""
    dir_path = os.path.dirname(file_path)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)


def _configure_pydub_ffmpeg(audio_segment_cls):
    configured_ffmpeg = get_ffmpeg_binary()
    if configured_ffmpeg:
        audio_segment_cls.converter = configured_ffmpeg


# ---------------------------------------------------------------------------
# 音色识别与解析
# ---------------------------------------------------------------------------
def parse_voice_name(name: str):
    # zh-CN-XiaoyiNeural-Female -> zh-CN-XiaoyiNeural
    return name.replace("-Female", "").replace("-Male", "").strip()


def is_azure_v2_voice(voice_name: str):
    voice_name = parse_voice_name(voice_name)
    if voice_name.endswith("-V2"):
        return voice_name.replace("-V2", "").strip()
    return ""


def is_siliconflow_voice(voice_name: str):
    return voice_name.startswith("siliconflow:")


def is_gemini_voice(voice_name: str):
    return voice_name.startswith("gemini:")


def is_mimo_voice(voice_name: str):
    return voice_name.startswith("mimo:")


def is_minimax_voice(voice_name: str) -> bool:
    return (voice_name or "").startswith("minimax:")


def is_elevenlabs_voice(voice_name: str) -> bool:
    return (voice_name or "").startswith("elevenlabs:")


def is_chatterbox_voice(voice_name: str) -> bool:
    return (voice_name or "").startswith("chatterbox:")


def is_no_voice(voice_name: str) -> bool:
    return str(voice_name or "").strip().lower() in _NO_VOICE_ALIASES


# ---------------------------------------------------------------------------
# 字幕时间轴工具
# ---------------------------------------------------------------------------
def mktimestamp(time_unit: float) -> str:
    """将 100 纳秒时间单位转换为字幕时间戳。"""
    hour = math.floor(time_unit / 10**7 / 3600)
    minute = math.floor((time_unit / 10**7 / 60) % 60)
    seconds = (time_unit / 10**7) % 60
    return f"{hour:02d}:{minute:02d}:{seconds:06.3f}"


def ensure_legacy_submaker_fields(sub_maker: SubMaker) -> SubMaker:
    """为沿用旧字幕结构的调用方补齐 subs/offset 兼容字段。"""
    if not hasattr(sub_maker, "subs"):
        sub_maker.subs = []
    if not hasattr(sub_maker, "offset"):
        sub_maker.offset = []
    return sub_maker


def populate_legacy_submaker_with_full_text(
    sub_maker: SubMaker, text: str, audio_duration_seconds: float
) -> SubMaker:
    """用整段文本按断句和字符数比例填充 subs/offset 字幕结构。"""
    sub_maker = ensure_legacy_submaker_fields(sub_maker)
    sub_maker.subs = []
    sub_maker.offset = []

    normalized_text = (text or "").strip()
    if not normalized_text:
        return sub_maker

    audio_duration_100ns = max(int(audio_duration_seconds * 10000000), 1)
    sentences = split_string_by_punctuations(normalized_text)
    if not sentences:
        sentences = [normalized_text]

    total_chars = sum(len(sentence) for sentence in sentences)
    if total_chars <= 0:
        sub_maker.subs.append(normalized_text)
        sub_maker.offset.append((0, audio_duration_100ns))
        return sub_maker

    current_offset = 0
    for index, sentence in enumerate(sentences):
        cleaned_sentence = sentence.strip()
        if not cleaned_sentence:
            continue
        if index == len(sentences) - 1:
            sentence_end = audio_duration_100ns
        else:
            sentence_chars = len(cleaned_sentence)
            sentence_duration = max(
                int(audio_duration_100ns * (sentence_chars / total_chars)), 1
            )
            sentence_end = min(current_offset + sentence_duration, audio_duration_100ns)
        sub_maker.subs.append(cleaned_sentence)
        sub_maker.offset.append((current_offset, sentence_end))
        current_offset = sentence_end

    return sub_maker


# ---------------------------------------------------------------------------
# Edge TTS（azure_tts_v1）
# ---------------------------------------------------------------------------
def create_edge_tts_communicate(text: str, voice_name: str, rate_str: str) -> "edge_tts.Communicate":
    """按已安装 edge_tts 版本构造 Communicate 对象（新版支持 boundary）。"""
    communicate_kwargs = {"rate": rate_str}
    communicate_signature = inspect.signature(edge_tts.Communicate)
    if "boundary" in communicate_signature.parameters:
        communicate_kwargs["boundary"] = "WordBoundary"
    return edge_tts.Communicate(text, voice_name, **communicate_kwargs)


def get_edge_tts_timeout_seconds() -> Union[float, None]:
    """获取 Edge TTS 单次流式请求超时（<=0 表示禁用）。"""
    raw_timeout = config.get("app", "edge_tts_timeout", _DEFAULT_EDGE_TTS_TIMEOUT_SECONDS)
    try:
        timeout_seconds = float(raw_timeout)
    except (TypeError, ValueError):
        timeout_seconds = _DEFAULT_EDGE_TTS_TIMEOUT_SECONDS
    if timeout_seconds <= 0:
        return None
    return timeout_seconds


def _stream_edge_tts_sync_with_timeout(communicate, on_chunk, timeout_seconds: float) -> None:
    """带总超时地消费 edge_tts 7.x 的同步流（daemon 线程 + Queue）。"""
    stream_queue = queue.Queue()
    done_marker = object()

    def _produce_chunks():
        try:
            for chunk in communicate.stream_sync():
                stream_queue.put(("chunk", chunk))
            stream_queue.put(("done", done_marker))
        except Exception as e:
            stream_queue.put(("error", e))

    thread = threading.Thread(target=_produce_chunks, daemon=True)
    thread.start()

    deadline = time.monotonic() + timeout_seconds
    while True:
        remaining_seconds = deadline - time.monotonic()
        if remaining_seconds <= 0:
            raise TimeoutError(f"edge_tts stream timed out after {timeout_seconds:g}s")
        try:
            item_type, payload = stream_queue.get(timeout=min(0.5, remaining_seconds))
        except queue.Empty:
            continue
        if item_type == "chunk":
            on_chunk(payload)
        elif item_type == "error":
            raise payload
        elif item_type == "done":
            return


def stream_edge_tts_chunks(communicate, on_chunk, timeout_seconds: Union[float, None] = None) -> None:
    """统一消费 edge_tts 的同步流和旧版异步流。"""
    if hasattr(communicate, "stream_sync"):
        if timeout_seconds:
            _stream_edge_tts_sync_with_timeout(communicate, on_chunk, timeout_seconds)
            return
        for chunk in communicate.stream_sync():
            on_chunk(chunk)
        return

    if not hasattr(communicate, "stream"):
        raise AttributeError("edge_tts communicate object has no stream method")

    async def _consume_async_stream():
        async for chunk in communicate.stream():
            on_chunk(chunk)

    loop = asyncio.new_event_loop()
    try:
        if timeout_seconds:
            loop.run_until_complete(asyncio.wait_for(_consume_async_stream(), timeout=timeout_seconds))
        else:
            loop.run_until_complete(_consume_async_stream())
    finally:
        loop.close()


def azure_tts_v1(text: str, voice_name: str, voice_rate: float, voice_file: str) -> Union[SubMaker, None]:
    """Edge TTS 生成：3 次重试，写 mp3 + SubMaker 逐词时间轴。"""
    voice_name = parse_voice_name(voice_name)
    text = text.strip()
    rate_str = convert_rate_to_percent(voice_rate)
    for i in range(3):
        try:
            print(f"[edge-tts] start, voice: {voice_name}, rate: {rate_str}, try: {i + 1}")
            ensure_file_path_exists(voice_file)
            communicate = create_edge_tts_communicate(text, voice_name, rate_str)
            sub_maker = edge_tts.SubMaker()
            timeout_seconds = get_edge_tts_timeout_seconds()

            with open(voice_file, "wb") as file:
                def _handle_chunk(chunk):
                    chunk_type = chunk["type"]
                    if chunk_type == "audio":
                        file.write(chunk["data"])
                    elif chunk_type in ["WordBoundary", "SentenceBoundary"]:
                        sub_maker.feed(chunk)

                stream_edge_tts_chunks(communicate, _handle_chunk, timeout_seconds=timeout_seconds)

            if not sub_maker.get_srt():
                print("[edge-tts] warning: sub_maker.get_srt() is empty, retrying...")
                continue

            print(f"[edge-tts] completed, output file: {voice_file}")
            return sub_maker
        except Exception as e:
            print(f"[edge-tts] failed, error: {str(e)}")
            if os.path.exists(voice_file) and os.path.getsize(voice_file) == 0:
                try:
                    os.remove(voice_file)
                except Exception:
                    pass
    return None


def convert_rate_to_percent(rate: float) -> str:
    """edge-tts 需要带正负号的百分比语速（如 +20%）。"""
    try:
        rate = float(rate)
    except (TypeError, ValueError):
        rate = 1.0
    if rate <= 0:
        rate = 1.0
    percent = round((rate - 1.0) * 100)
    if percent >= 0:
        return f"+{percent}%"
    return f"{percent}%"


# ---------------------------------------------------------------------------
# Azure Speech v2（azure_tts_v2）
# ---------------------------------------------------------------------------
def _build_azure_v2_ssml(text: str, voice_name: str, voice_rate: float) -> str:
    try:
        normalized_rate = float(voice_rate)
    except (TypeError, ValueError):
        normalized_rate = 1.0
    normalized_rate = max(0.25, min(4.0, normalized_rate))

    voice_locale_parts = voice_name.split("-", 2)
    voice_locale = "-".join(voice_locale_parts[:2]) if len(voice_locale_parts) >= 2 else "en-US"
    escaped_text = escape(text)
    escaped_voice_name = escape(voice_name, {'"': "&quot;"})
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xml:lang="{voice_locale}">'
        f'<voice name="{escaped_voice_name}">'
        f'<prosody rate="{normalized_rate:g}">{escaped_text}</prosody>'
        "</voice></speak>"
    )


def azure_tts_v2(text: str, voice_name: str, voice_file: str, voice_rate: float = 1.0) -> Union[SubMaker, None]:
    voice_name = is_azure_v2_voice(voice_name)
    if not voice_name:
        raise ValueError(f"invalid voice name: {voice_name}")
    text = text.strip()
    ssml = _build_azure_v2_ssml(text, voice_name, voice_rate)

    def _format_duration_to_offset(duration) -> int:
        if isinstance(duration, str):
            time_obj = datetime.strptime(duration, "%H:%M:%S.%f")
            milliseconds = (
                (time_obj.hour * 3600000)
                + (time_obj.minute * 60000)
                + (time_obj.second * 1000)
                + (time_obj.microsecond // 1000)
            )
            return milliseconds * 10000
        if isinstance(duration, int):
            return duration
        return 0

    for i in range(3):
        try:
            print(f"[azure-v2] start, voice: {voice_name}, rate: {voice_rate}, try: {i + 1}")
            import azure.cognitiveservices.speech as speechsdk

            sub_maker = ensure_legacy_submaker_fields(SubMaker())

            def speech_synthesizer_word_boundary_cb(evt):
                duration = _format_duration_to_offset(str(evt.duration))
                offset = _format_duration_to_offset(evt.audio_offset)
                sub_maker.subs.append(evt.text)
                sub_maker.offset.append((offset, offset + duration))

            speech_key = config.get("azure", "speech_key", "")
            service_region = config.get("azure", "speech_region", "")
            if not speech_key or not service_region:
                print("[azure-v2] error: Azure speech key or region is not set")
                return None

            audio_config = speechsdk.audio.AudioOutputConfig(filename=voice_file, use_default_speaker=True)
            speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
            speech_config.speech_synthesis_voice_name = voice_name
            speech_config.set_property(
                property_id=speechsdk.PropertyId.SpeechServiceResponse_RequestWordBoundary,
                value="true",
            )
            speech_config.set_speech_synthesis_output_format(
                speechsdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3
            )
            speech_synthesizer = speechsdk.SpeechSynthesizer(audio_config=audio_config, speech_config=speech_config)
            speech_synthesizer.synthesis_word_boundary.connect(speech_synthesizer_word_boundary_cb)

            result = speech_synthesizer.speak_ssml_async(ssml).get()
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                print(f"[azure-v2] succeeded: {voice_file}")
                return sub_maker
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation_details = result.cancellation_details
                print(f"[azure-v2] canceled: {cancellation_details.reason}")
                if cancellation_details.reason == speechsdk.CancellationReason.Error:
                    print(f"[azure-v2] error: {cancellation_details.error_details}")
        except Exception as e:
            print(f"[azure-v2] failed, error: {str(e)}")
    return None


# ---------------------------------------------------------------------------
# 硅基流动（SiliconFlow）
# ---------------------------------------------------------------------------
def siliconflow_tts(text, model, voice, voice_rate, voice_file, voice_volume=1.0) -> Union[SubMaker, None]:
    try:
        import requests
    except ImportError:
        print("[siliconflow] error: requests not installed, run: pip install requests")
        return None

    text = text.strip()
    api_key = config.get("siliconflow", "api_key", "")
    if not api_key:
        print("[siliconflow] error: API key is not set")
        return None

    gain = max(-10, min(10, voice_volume - 1.0))
    url = "https://api.siliconflow.cn/v1/audio/speech"
    payload = {
        "model": model,
        "input": text,
        "voice": voice,
        "response_format": "mp3",
        "sample_rate": 32000,
        "stream": False,
        "speed": voice_rate,
        "gain": gain,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    for i in range(3):
        try:
            print(f"[siliconflow] start, model: {model}, voice: {voice}, try: {i + 1}")
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                with open(voice_file, "wb") as f:
                    f.write(response.content)
                sub_maker = ensure_legacy_submaker_fields(SubMaker())
                try:
                    from moviepy.audio.io.AudioFileClip import AudioFileClip
                    audio_clip = AudioFileClip(voice_file)
                    audio_duration = audio_clip.duration
                    audio_clip.close()
                    return populate_legacy_submaker_with_full_text(sub_maker, text, audio_duration)
                except Exception as e:
                    print(f"[siliconflow] failed to create accurate subtitles: {str(e)}")
                    sub_maker.subs = [text]
                    sub_maker.offset = [(0, 10000000)]
                    return sub_maker
            else:
                print(f"[siliconflow] failed with status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            print(f"[siliconflow] failed: {str(e)}")
    return None


# ---------------------------------------------------------------------------
# Google Gemini TTS
# ---------------------------------------------------------------------------
def gemini_tts(text, voice_name, voice_rate, voice_file, voice_volume=1.0) -> Union[SubMaker, None]:
    try:
        import pydub
        from pydub import AudioSegment
        from google import genai
        from google.genai import types
        _configure_pydub_ffmpeg(AudioSegment)
    except ImportError as e:
        print(f"[gemini] missing required package: {str(e)}. install: pip install pydub google-genai")
        return None

    try:
        api_key = config.get("app", "gemini_api_key", "")
        if not api_key:
            print("[gemini] error: API key is not set")
            return None

        print(f"[gemini] start, voice: {voice_name}")
        generation_config = types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            ),
        )
        with genai.Client(api_key=api_key) as client:
            response = client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=text,
                config=generation_config,
            )

        if not response.candidates or not response.candidates[0].content:
            print("[gemini] error: No audio content received")
            return None

        audio_data = None
        for part in response.candidates[0].content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                audio_data = part.inline_data.data
                break
        if not audio_data:
            print("[gemini] error: No audio data found in response")
            return None

        audio_bytes = base64.b64decode(audio_data) if isinstance(audio_data, str) else audio_data

        try:
            audio_segment = AudioSegment.from_file(
                io.BytesIO(audio_bytes),
                format="raw",
                frame_rate=24000,
                channels=1,
                sample_width=2,
            )
        except Exception as e:
            print(f"[gemini] failed to load PCM audio: {e}")
            return None

        ensure_file_path_exists(voice_file)
        exported_audio = audio_segment.export(voice_file, format="mp3")
        exported_audio.close()

        print(f"[gemini] completed, output file: {voice_file}")
        sub_maker = ensure_legacy_submaker_fields(SubMaker())
        audio_duration = len(audio_segment) / 1000.0
        return populate_legacy_submaker_with_full_text(sub_maker, text, audio_duration)
    except Exception as e:
        print(f"[gemini] failed, error: {str(e)}")
        return None


# ---------------------------------------------------------------------------
# 小米 MiMo V2.5 TTS
# ---------------------------------------------------------------------------
def mimo_tts(text, voice_name, voice_rate, voice_file, voice_volume=1.0) -> Union[SubMaker, None]:
    text = (text or "").strip()
    if not text:
        print("[mimo] error: text is empty")
        return None

    api_key = config.get("app", "mimo_api_key", "")
    if not api_key:
        print("[mimo] error: API key is not set")
        return None

    base_url = config.get("app", "mimo_base_url", "") or _MIMO_DEFAULT_BASE_URL
    model_name = config.get("app", "mimo_tts_model_name", "") or _MIMO_DEFAULT_TTS_MODEL
    style_prompt = config.get(
        "app", "mimo_tts_style_prompt", "请用自然、清晰、适合短视频旁白的语气朗读。"
    )

    try:
        from openai import OpenAI
        from pydub import AudioSegment
        _configure_pydub_ffmpeg(AudioSegment)
    except ImportError as e:
        print(f"[mimo] missing required package: {str(e)}")
        return None

    for i in range(3):
        try:
            print(f"[mimo] start, model: {model_name}, voice: {voice_name}, try: {i + 1}")
            ensure_file_path_exists(voice_file)

            client = OpenAI(api_key=api_key, base_url=base_url)
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": style_prompt},
                    {"role": "assistant", "content": text},
                ],
                audio={"format": "wav", "voice": voice_name},
            )

            if not completion or not getattr(completion, "choices", None):
                raise ValueError("MiMo TTS returned empty response")

            message = completion.choices[0].message
            audio = getattr(message, "audio", None)
            audio_data = None
            if isinstance(audio, dict):
                audio_data = audio.get("data")
            elif audio is not None:
                audio_data = getattr(audio, "data", None)
            if not audio_data:
                raise ValueError("MiMo TTS returned empty audio data")

            audio_bytes = base64.b64decode(audio_data)
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes), format="wav")

            output_format = parse_extension(voice_file) or "mp3"
            if output_format == "wav":
                with open(voice_file, "wb") as f:
                    f.write(audio_bytes)
            else:
                audio_segment.export(voice_file, format=output_format)

            audio_duration = len(audio_segment) / 1000.0
            sub_maker = ensure_legacy_submaker_fields(SubMaker())
            print(f"[mimo] succeeded: {voice_file}")
            return populate_legacy_submaker_with_full_text(sub_maker, text, audio_duration)
        except Exception as e:
            print(f"[mimo] failed: {str(e)}")
    return None


# ---------------------------------------------------------------------------
# MiniMax T2A
# ---------------------------------------------------------------------------
def _resolve_minimax_tts_url(configured_url: str) -> str:
    configured_url = (configured_url or "").strip().rstrip("/")
    if not configured_url:
        return MINIMAX_TTS_GLOBAL_URL
    if configured_url in {MINIMAX_TTS_GLOBAL_URL, MINIMAX_TTS_CN_URL}:
        return configured_url
    if configured_url.endswith("/v1"):
        return f"{configured_url}/t2a_v2"
    return configured_url


def get_minimax_tts_api_key() -> str:
    return str(
        config.get("minimax_tts", "api_key", "")
        or config.get("app", "minimax_api_key", "")
        or os.getenv("MINIMAX_API_KEY", "")
        or ""
    ).strip()


def _infer_minimax_tts_url(base_url: str) -> str:
    normalized_url = str(base_url or "").strip()
    if not normalized_url:
        return ""
    parse_target = normalized_url if "://" in normalized_url else f"//{normalized_url}"
    host = (urlparse(parse_target).hostname or "").lower()
    if host == "minimaxi.com" or host.endswith(".minimaxi.com"):
        return MINIMAX_TTS_CN_URL
    if host == "minimax.io" or host.endswith(".minimax.io"):
        return MINIMAX_TTS_GLOBAL_URL
    return ""


def get_minimax_tts_endpoint() -> str:
    dedicated_key = str(config.get("minimax_tts", "api_key", "") or "").strip()
    if not dedicated_key:
        inferred_url = _infer_minimax_tts_url(config.get("app", "minimax_base_url", ""))
        if inferred_url:
            return inferred_url
    return _resolve_minimax_tts_url(config.get("minimax_tts", "base_url", ""))


def _write_validated_minimax_audio(audio_bytes: bytes, voice_file: str) -> float:
    """原子写入 MiniMax 音频并返回时长。"""
    ensure_file_path_exists(voice_file)
    output_dir = os.path.dirname(os.path.abspath(voice_file))
    output_suffix = os.path.splitext(voice_file)[1] or ".mp3"
    temp_fd, temp_path = tempfile.mkstemp(prefix=".minimax-tts-", suffix=output_suffix, dir=output_dir)
    os.close(temp_fd)
    try:
        with open(temp_path, "wb") as output:
            output.write(audio_bytes)
        from moviepy.audio.io.AudioFileClip import AudioFileClip
        audio_clip = AudioFileClip(temp_path)
        try:
            audio_duration = float(audio_clip.duration)
        finally:
            audio_clip.close()
        if not math.isfinite(audio_duration) or audio_duration <= 0:
            raise ValueError("MiniMax TTS returned audio with an invalid duration")
        os.replace(temp_path, voice_file)
        return audio_duration
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def minimax_tts(text, voice_id, voice_rate, voice_file, voice_volume=1.0) -> Union[SubMaker, None]:
    try:
        import requests
    except ImportError:
        print("[minimax] error: requests not installed, run: pip install requests")
        return None

    text, voice_id = (text or "").strip(), (voice_id or "").strip()
    if not text or not voice_id:
        print("[minimax] error: requires text and a voice ID")
        return None

    api_key = get_minimax_tts_api_key()
    if not api_key:
        print("[minimax] error: API key is not set")
        return None

    url = get_minimax_tts_endpoint()
    model = str(config.get("minimax_tts", "model_id", "") or MINIMAX_TTS_DEFAULT_MODEL).strip()
    if model not in MINIMAX_TTS_MODELS:
        print(f"[minimax] error: unsupported model: {model}")
        return None

    try:
        speed = max(0.5, min(2.0, float(voice_rate or 1.0)))
        volume = max(0.0, min(10.0, float(voice_volume or 1.0)))
        pitch = max(-12, min(12, int(config.get("minimax_tts", "pitch", 0) or 0)))
        sample_rate = int(config.get("minimax_tts", "sample_rate", 32000) or 32000)
        bitrate = int(config.get("minimax_tts", "bitrate", 128000) or 128000)
        channel = int(config.get("minimax_tts", "channel", 1) or 1)
    except (TypeError, ValueError) as exc:
        print(f"[minimax] invalid audio setting: {str(exc)}")
        return None

    audio_format = str(config.get("minimax_tts", "audio_format", "mp3") or "mp3").strip()
    if audio_format not in {"mp3", "wav", "flac", "pcm"}:
        print(f"[minimax] error: unsupported audio format: {audio_format}")
        return None

    payload = {
        "model": model, "text": text, "stream": False, "language_boost": "auto",
        "output_format": "hex",
        "voice_setting": {"voice_id": voice_id, "speed": speed, "vol": volume, "pitch": pitch},
        "audio_setting": {"sample_rate": sample_rate, "bitrate": bitrate, "format": audio_format, "channel": channel},
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    for attempt in range(3):
        try:
            print(f"[minimax] start, model: {model}, voice: {voice_id}, try: {attempt + 1}")
            response = requests.post(url, json=payload, headers=headers, timeout=120)
            if response.status_code != 200:
                print(f"[minimax] failed with status {response.status_code}: {response.text[:200]}")
                continue
            body = response.json()
            data = body.get("data") or {}
            base_resp = body.get("base_resp") or {}
            if base_resp.get("status_code") != 0 or data.get("status") != 2:
                print(f"[minimax] unsuccessful response: status_code={base_resp.get('status_code')}, audio_status={data.get('status')}")
                continue
            audio_hex = data.get("audio")
            if not isinstance(audio_hex, str) or not audio_hex:
                print("[minimax] error: empty audio data")
                continue
            if len(audio_hex) > _MINIMAX_TTS_MAX_AUDIO_HEX_CHARS:
                print("[minimax] error: audio data exceeds supported size")
                continue
            audio_duration = _write_validated_minimax_audio(bytes.fromhex(audio_hex), voice_file)
            print(f"[minimax] succeeded: {voice_file}")
            return populate_legacy_submaker_with_full_text(
                ensure_legacy_submaker_fields(SubMaker()), text, audio_duration
            )
        except (OSError, ValueError, requests.RequestException) as exc:
            print(f"[minimax] failed: {str(exc)}")
    return None


# ---------------------------------------------------------------------------
# ElevenLabs
# ---------------------------------------------------------------------------
def elevenlabs_tts(text, voice_id, voice_file, voice_rate=1.0, voice_volume=1.0, model_id="") -> Union[SubMaker, None]:
    try:
        import requests
    except ImportError:
        print("[elevenlabs] error: requests not installed, run: pip install requests")
        return None

    text = (text or "").strip()
    if not text:
        print("[elevenlabs] error: text is empty")
        return None

    api_key = str(config.get("elevenlabs", "api_key", "") or os.getenv("ELEVENLABS_API_KEY", "")).strip()
    if not api_key:
        print("[elevenlabs] error: API key is not set")
        return None

    if not model_id:
        model_id = config.get("elevenlabs", "model_id", "eleven_multilingual_v2")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {"xi-api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    _NON_RETRYABLE_CODES = {401, 403, 422}
    _NON_RETRYABLE_STATUSES = {"voice_disabled", "voice_access_denied", "unauthorized"}

    for i in range(3):
        try:
            print(f"[elevenlabs] start, voice_id: {voice_id}, try: {i + 1}")
            ensure_file_path_exists(voice_file)
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            if response.status_code != 200:
                error_status = ""
                try:
                    detail = response.json().get("detail", {})
                    if isinstance(detail, dict):
                        error_status = detail.get("status", "")
                except Exception:
                    pass
                if response.status_code in _NON_RETRYABLE_CODES or error_status in _NON_RETRYABLE_STATUSES:
                    print(f"[elevenlabs] failed (non-retryable): {response.status_code}, {error_status or response.text[:200]}")
                    return None
                print(f"[elevenlabs] failed with status {response.status_code}: {response.text[:200]}")
                continue

            with open(voice_file, "wb") as f:
                f.write(response.content)

            from moviepy.audio.io.AudioFileClip import AudioFileClip
            audio_clip = AudioFileClip(voice_file)
            audio_duration = audio_clip.duration
            audio_clip.close()

            sub_maker = ensure_legacy_submaker_fields(SubMaker())
            print(f"[elevenlabs] succeeded: {voice_file}")
            return populate_legacy_submaker_with_full_text(sub_maker, text, audio_duration)
        except Exception as e:
            print(f"[elevenlabs] failed: {str(e)}")
    return None


# ---------------------------------------------------------------------------
# Chatterbox（自托管）
# ---------------------------------------------------------------------------
def chatterbox_tts(text, voice, voice_file, voice_rate=1.0, voice_volume=1.0, model_id="") -> Union[SubMaker, None]:
    try:
        import requests
    except ImportError:
        print("[chatterbox] error: requests not installed, run: pip install requests")
        return None

    text = (text or "").strip()
    if not text:
        print("[chatterbox] error: text is empty")
        return None

    base_url = (config.get("chatterbox", "base_url", "") or "").strip().rstrip("/")
    if not base_url:
        print("[chatterbox] error: base_url is not set, configure [chatterbox] base_url")
        return None

    api_key = config.get("chatterbox", "api_key", "")
    if not model_id:
        model_id = config.get("chatterbox", "model_id", "chatterbox") or "chatterbox"

    url = f"{base_url}/audio/speech"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": model_id,
        "input": text,
        "voice": voice,
        "response_format": "mp3",
        "speed": max(0.25, min(4.0, float(voice_rate or 1.0))),
    }

    for i in range(3):
        try:
            print(f"[chatterbox] start, voice: {voice}, try: {i + 1}")
            ensure_file_path_exists(voice_file)
            response = requests.post(url, json=payload, headers=headers, timeout=120)
            if response.status_code != 200:
                print(f"[chatterbox] failed with status {response.status_code}: {response.text[:200]}")
                continue

            with open(voice_file, "wb") as f:
                f.write(response.content)

            from moviepy.audio.io.AudioFileClip import AudioFileClip
            audio_clip = AudioFileClip(voice_file)
            audio_duration = audio_clip.duration
            audio_clip.close()

            sub_maker = ensure_legacy_submaker_fields(SubMaker())
            print(f"[chatterbox] succeeded: {voice_file}")
            return populate_legacy_submaker_with_full_text(sub_maker, text, audio_duration)
        except Exception as e:
            print(f"[chatterbox] failed: {str(e)}")
    return None


# ---------------------------------------------------------------------------
# 无配音（静音占位）
# ---------------------------------------------------------------------------
def estimate_no_voice_duration(text: str) -> float:
    """为无配音模式估算时间轴长度。"""
    normalized_text = (text or "").strip()
    if not normalized_text:
        return 3.0

    cjk_chars = len(re.findall(r"[\u4e00-\u9fff]", normalized_text))
    words = len(re.findall(r"[A-Za-z0-9]+", normalized_text))
    ascii_word_chars = sum(len(w) for w in re.findall(r"[A-Za-z0-9]+", normalized_text))
    other_text_chars = 0
    for char in normalized_text:
        category = unicodedata.category(char)
        if category.startswith(("L", "N")):
            other_text_chars += 1
    other_text_chars = max(other_text_chars - cjk_chars - ascii_word_chars, 0)
    sentence_count = max(len(split_string_by_punctuations(normalized_text)), 1)

    cjk_duration = cjk_chars / 4.2
    word_duration = words / 2.7
    other_text_duration = other_text_chars / 4.0
    pause_duration = max(sentence_count - 1, 0) * 0.35
    return max(3.0, cjk_duration + word_duration + other_text_duration + pause_duration)


def generate_silent_audio(duration_seconds: float, output_file: str) -> bool:
    """用 ffmpeg anullsrc 生成静音 MP3。"""
    ensure_file_path_exists(output_file)
    duration_seconds = max(float(duration_seconds or 0), 0.1)
    command = [
        get_ffmpeg_binary(),
        "-y", "-f", "lavfi",
        "-i", "anullsrc=r=44100:cl=mono",
        "-t", f"{duration_seconds:.3f}",
        "-codec:a", "libmp3lame",
        "-q:a", "4",
        output_file,
    ]
    print(f"[no-voice] generating silent audio, duration: {duration_seconds:.2f}s")
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        print(f"[no-voice] failed to generate silent audio: {(result.stderr or result.stdout or '').strip()}")
        return False
    if not os.path.exists(output_file) or os.path.getsize(output_file) <= 0:
        print("[no-voice] silent audio output file is missing or empty")
        return False
    return True


# ---------------------------------------------------------------------------
# 统一分发入口
# ---------------------------------------------------------------------------
def tts(text, voice_name, voice_rate, voice_file, voice_volume=1.0) -> Union[SubMaker, None]:
    if is_no_voice(voice_name):
        duration_seconds = estimate_no_voice_duration(text)
        if not generate_silent_audio(duration_seconds, voice_file):
            return None
        sub_maker = ensure_legacy_submaker_fields(SubMaker())
        return populate_legacy_submaker_with_full_text(sub_maker, text, duration_seconds)

    if is_azure_v2_voice(voice_name):
        return azure_tts_v2(text, voice_name, voice_file, voice_rate=voice_rate)
    elif is_siliconflow_voice(voice_name):
        parts = voice_name.split(":")
        if len(parts) >= 3:
            model = parts[1]
            voice = parts[2].split("-")[0]
            full_voice = f"{model}:{voice}"
            return siliconflow_tts(text, model, full_voice, voice_rate, voice_file, voice_volume)
        else:
            print(f"[tts] error: invalid siliconflow voice name format: {voice_name}")
            return None
    elif is_gemini_voice(voice_name):
        parts = voice_name.split(":")
        if len(parts) >= 2:
            voice = parts[1].split("-")[0]
            return gemini_tts(text, voice, voice_rate, voice_file, voice_volume)
        else:
            print(f"[tts] error: invalid gemini voice name format: {voice_name}")
            return None
    elif is_mimo_voice(voice_name):
        parts = voice_name.split(":")
        if len(parts) >= 2:
            voice = parts[1].split("-")[0]
            return mimo_tts(text, voice, voice_rate, voice_file, voice_volume)
        else:
            print(f"[tts] error: invalid mimo voice name format: {voice_name}")
            return None
    elif is_minimax_voice(voice_name):
        voice_id = voice_name.split(":", 1)[1].strip()
        if voice_id:
            return minimax_tts(text, voice_id, voice_rate, voice_file, voice_volume)
        print(f"[tts] error: invalid MiniMax voice name format: {voice_name}")
        return None
    elif is_elevenlabs_voice(voice_name):
        parts = voice_name.split(":")
        if len(parts) >= 2:
            voice_id = parts[1]
            return elevenlabs_tts(text, voice_id, voice_file, voice_rate, voice_volume)
        else:
            print(f"[tts] error: invalid elevenlabs voice name format: {voice_name}")
            return None
    elif is_chatterbox_voice(voice_name):
        parts = voice_name.split(":", 1)
        if len(parts) >= 2 and parts[1].strip():
            chatterbox_voice = parts[1].strip()
            if chatterbox_voice.endswith(("-Female", "-Male")):
                chatterbox_voice = chatterbox_voice.rsplit("-", 1)[0]
            return chatterbox_tts(text, chatterbox_voice, voice_file, voice_rate, voice_volume)
        else:
            print(f"[tts] error: invalid chatterbox voice name format: {voice_name}")
            return None
    return azure_tts_v1(text, voice_name, voice_rate, voice_file)


# ---------------------------------------------------------------------------
# 字幕落盘与时长
# ---------------------------------------------------------------------------
def _format_text(text: str) -> str:
    """清理字幕对齐前的脚本文本（Markdown 括号/强调符）。"""
    text = text.replace("[", " ")
    text = text.replace("]", " ")
    text = text.replace("(", " ")
    text = text.replace(")", " ")
    text = text.replace("{", " ")
    text = text.replace("}", " ")
    return normalize_script_for_subtitle_matching(text)


def _build_subtitle_formatter():
    def formatter(idx, start_time, end_time, sub_text):
        start_t = mktimestamp(start_time).replace(".", ",")
        end_t = mktimestamp(end_time).replace(".", ",")
        return f"{idx}\n{start_t} --> {end_t}\n{sub_text}\n"
    return formatter


def _normalize_arabic(text: str) -> str:
    text = _ARABIC_DIACRITICS.sub("", text)
    for src, dst in (("أإآٱ", "ا"), ("ىئ", "ي"), ("ة", "ه"), ("ؤ", "و")):
        for ch in src:
            text = text.replace(ch, dst)
    return text


def _match_script_line(script_lines, current_text, sub_index):
    """尝试把当前累计的字幕文本与脚本中的某条标准断句匹配。"""
    if len(script_lines) <= sub_index:
        return ""
    target_line = script_lines[sub_index]
    if current_text == target_line:
        return target_line.strip()

    current_text_normalized = re.sub(r"[_\W]+", "", current_text)
    target_line_normalized = re.sub(r"[_\W]+", "", target_line)
    if current_text_normalized == target_line_normalized:
        return target_line.strip()

    current_ar = re.sub(r"[_\W]+", "", _normalize_arabic(current_text))
    target_ar = re.sub(r"[_\W]+", "", _normalize_arabic(target_line))
    if current_ar and current_ar == target_ar:
        return target_line.strip()

    return ""


def _write_subtitle_items(sub_items, subtitle_file) -> bool:
    """写入 SRT 并做一次基本可读性验证。"""
    try:
        ensure_file_path_exists(subtitle_file)
        with open(subtitle_file, "w", encoding="utf-8") as file:
            file.write("\n".join(sub_items) + "\n")
        try:
            from moviepy.video.tools.subtitles import file_to_subtitles
            sbs = file_to_subtitles(subtitle_file, encoding="utf-8")
            duration = max([tb for ((ta, tb), txt) in sbs]) if sbs else 0
            print(f"[subtitle] completed: {subtitle_file}, duration: {duration}")
        except ImportError:
            print(f"[subtitle] completed: {subtitle_file} (moviepy not installed, skipped validation)")
        return True
    except Exception as e:
        print(f"[subtitle] failed, error: {str(e)}")
        if os.path.exists(subtitle_file):
            os.remove(subtitle_file)
        return False


def _build_subtitle_items_from_edge_cues(sub_maker, script_lines):
    """将 edge_tts 7.x 的细粒度 cues 聚合为按脚本断句的 SRT 片段。"""
    formatter = _build_subtitle_formatter()
    sub_items = []
    sub_index = 0
    current_text = ""
    current_start_time = None

    for cue in sub_maker.cues:
        cue_text = unescape(cue.content)
        if current_start_time is None:
            current_start_time = int(cue.start.total_seconds() * 10000000)
        current_end_time = int(cue.end.total_seconds() * 10000000)
        current_text += cue_text

        matched_text = _match_script_line(script_lines, current_text, sub_index)
        if not matched_text:
            continue

        sub_index += 1
        sub_items.append(
            formatter(idx=sub_index, start_time=current_start_time, end_time=current_end_time, sub_text=matched_text)
        )
        current_text = ""
        current_start_time = None

    if current_text.strip():
        print(f"[subtitle] warning: edge cues still have unmatched text after aggregation: {current_text}")

    return sub_items


def _build_subtitle_items_from_legacy_submaker(sub_maker, script_lines):
    """将 legacy subs/offset 结构聚合为按脚本断句的 SRT 片段。"""
    formatter = _build_subtitle_formatter()
    start_time = -1.0
    sub_items = []
    sub_index = 0
    sub_line = ""

    legacy_offsets = getattr(sub_maker, "offset", [])
    legacy_subs = getattr(sub_maker, "subs", [])
    for (offset, sub) in zip(legacy_offsets, legacy_subs):
        current_start_time, current_end_time = offset
        if start_time < 0:
            start_time = current_start_time

        sub_line += unescape(sub)
        matched_text = _match_script_line(script_lines, sub_line, sub_index)
        if not matched_text:
            continue

        sub_index += 1
        sub_items.append(
            formatter(idx=sub_index, start_time=start_time, end_time=current_end_time, sub_text=matched_text)
        )
        start_time = -1.0
        sub_line = ""

    if sub_line.strip():
        print(f"[subtitle] warning: legacy subtitle items still have unmatched text: {sub_line}")

    return sub_items


def create_subtitle(sub_maker, text, subtitle_file):
    """将 SubMaker 时间轴按脚本断句生成 SRT 字幕。"""
    text = _format_text(text)
    script_lines = split_string_by_punctuations(text)
    try:
        if hasattr(sub_maker, "cues") and sub_maker.cues:
            sub_items = _build_subtitle_items_from_edge_cues(sub_maker, script_lines)
        else:
            sub_items = _build_subtitle_items_from_legacy_submaker(sub_maker, script_lines)

        if len(sub_items) != len(script_lines):
            print(f"[subtitle] warning: failed, sub_items len: {len(sub_items)}, script_lines len: {len(script_lines)}")
            return
        _write_subtitle_items(sub_items, subtitle_file)
    except Exception as e:
        print(f"[subtitle] failed, error: {str(e)}")


def _get_audio_duration_from_submaker(sub_maker):
    if hasattr(sub_maker, "cues") and sub_maker.cues:
        return sub_maker.cues[-1].end.total_seconds()
    legacy_offsets = getattr(sub_maker, "offset", [])
    if not legacy_offsets:
        return 0.0
    return legacy_offsets[-1][1] / 10000000


def _get_audio_duration_from_file(audio_file):
    if not os.path.exists(audio_file):
        print(f"[duration] error: audio file does not exist: {audio_file}")
        return 0.0
    try:
        from moviepy.audio.io.AudioFileClip import AudioFileClip
        with AudioFileClip(audio_file) as audio:
            return audio.duration
    except Exception as e:
        print(f"[duration] failed to get duration from file: {str(e)}")
        return 0.0


def get_audio_duration(target) -> float:
    if isinstance(target, SubMaker):
        return _get_audio_duration_from_submaker(target)
    elif isinstance(target, str):
        return _get_audio_duration_from_file(target)
    return 0.0


# ---------------------------------------------------------------------------
# CLI 入口
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="通用 TTS 生成脚本（Edge/Azure/SiliconFlow/Gemini/MiMo/MiniMax/ElevenLabs/Chatterbox/无配音）")
    parser.add_argument("--text", type=str, default="", help="待合成的旁白文本")
    parser.add_argument("--text-file", type=str, default="", help="从文件读取旁白文本（utf-8）")
    parser.add_argument("--voice", type=str, default="zh-CN-XiaoxiaoNeural", help="音色名，见脚本头部说明（默认固定 zh-CN-XiaoxiaoNeural）")
    parser.add_argument("--rate", type=float, default=1.2, help="语速倍率，默认固定 1.2（+20%）")
    parser.add_argument("--volume", type=float, default=1.0, help="音量倍率，1.0 为正常")
    parser.add_argument("--out", type=str, required=True, help="输出音频文件路径（mp3/m4a/wav）")
    parser.add_argument("--subtitle", type=str, default="", help="输出 SRT 字幕路径（默认与 --out 同前缀 .srt）")
    parser.add_argument("--config", type=str, default="", help="配置文件路径（默认脚本同目录 config.json）")
    args = parser.parse_args()

    global config
    config = _load_config(args.config)

    if args.text_file:
        with open(args.text_file, "r", encoding="utf-8") as f:
            text = f.read().strip()
    else:
        text = (args.text or "").strip()
    if not text:
        parser.error("--text 或 --text-file 至少提供一个")

    subtitle_file = args.subtitle or (os.path.splitext(args.out)[0] + ".srt")

    print(f"==> text: {text[:60]}{'...' if len(text) > 60 else ''}")
    print(f"==> voice: {args.voice}, rate: {args.rate}, volume: {args.volume}")
    print(f"==> audio out: {args.out}")
    print(f"==> subtitle out: {subtitle_file}")

    sub_maker = tts(text, args.voice, args.rate, args.out, voice_volume=args.volume)
    if sub_maker is None:
        print("!! TTS 生成失败")
        raise SystemExit(1)

    create_subtitle(sub_maker, text, subtitle_file)
    audio_duration = get_audio_duration(sub_maker)
    print(f"==> audio duration: {audio_duration:.3f}s")
    print("==> DONE")


if __name__ == "__main__":
    main()
