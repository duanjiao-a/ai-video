import { AbsoluteFill, Audio, Sequence, getInputProps, staticFile } from 'remotion';
import { SceneOpen, SceneStarve, SceneNight, SceneCardio, SceneScale, SceneOutro } from './Scenes';
import { Caption } from './Caption';
import { BubbleFlash } from './BubbleFlash';

export const SHOTS = {
  open: { from: 0, duration: 100 },
  r1: { from: 100, duration: 185 },
  r2: { from: 285, duration: 185 },
  r3: { from: 470, duration: 185 },
  r4: { from: 655, duration: 150 },
  outro: { from: 805, duration: 95 },
} as const;
export const TOTAL = 900;

// 底部解说字幕（与 TTS 旁白对齐；旁白文案见 DESIGN.md）
const CAPTIONS = [
  { from: 100, duration: 148, text: '节食越狠，反弹越凶' },
  { from: 286, duration: 162, text: '睡不够，食欲激素失控' },
  { from: 470, duration: 153, text: '只做有氧，肌肉流失，代谢变慢' },
  { from: 655, duration: 153, text: '数字波动的是水分' },
] as const;

// TTS 旁白（edge-tts，zh-CN-XiaoxiaoNeural，语速 +20%；时长来自 durations.json）
const TTS = [
  { from: 4, dur: 62, src: 'tts/tts-open.mp3' },
  { from: 100, dur: 148, src: 'tts/tts-r1.mp3' },
  { from: 286, dur: 162, src: 'tts/tts-r2.mp3' },
  { from: 470, dur: 153, src: 'tts/tts-r3.mp3' },
  { from: 655, dur: 153, src: 'tts/tts-r4.mp3' },
  { from: 818, dur: 61, src: 'tts/tts-outro.mp3' },
] as const;

// SFX 钉帧表（相对镜头动作的绝对帧号；from 写死——时间线定稿后不再平移）
const SFX: { from: number; src: string; volume: number; dur: number }[] = [
  // open：kicker + 标题弹入
  { from: 6, src: 'pop.mp3', volume: 0.5, dur: 30 },
  { from: 16, src: 'pop.mp3', volume: 0.5, dur: 30 },
  { from: 42, src: 'pop.mp3', volume: 0.55, dur: 30 },
  { from: 55, src: 'pop.mp3', volume: 0.6, dur: 30 },
  { from: 96, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r1
  // r1：饿到崩溃 slam / 汉堡落地 / 暴食反弹
  { from: 106, src: 'impact-cine.mp3', volume: 0.5, dur: 50 },
  { from: 230, src: 'pop.mp3', volume: 0.45, dur: 30 },
  { from: 250, src: 'bass-hit-short.mp3', volume: 0.5, dur: 30 },
  { from: 281, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r2
  // r2：熬夜失眠 / 食欲失控
  { from: 293, src: 'transition-soft.mp3', volume: 0.4, dur: 40 },
  { from: 385, src: 'sparkle.mp3', volume: 0.35, dur: 50 },
  { from: 466, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r3
  // r3：只跑步 / 肌肉流失 / 代谢下降
  { from: 478, src: 'impact-transition.mp3', volume: 0.45, dur: 40 },
  { from: 530, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 580, src: 'pop.mp3', volume: 0.35, dur: 30 },
  { from: 651, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r4
  // r4：称重标签 / 三个数字 / 心态崩了 / 子条
  { from: 661, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 669, src: 'click-camera.mp3', volume: 0.5, dur: 20 },
  { from: 689, src: 'click-camera.mp3', volume: 0.5, dur: 20 },
  { from: 709, src: 'click-camera.mp3', volume: 0.55, dur: 20 },
  { from: 719, src: 'impact-cine.mp3', volume: 0.5, dur: 50 },
  { from: 749, src: 'pop.mp3', volume: 0.35, dur: 30 },
  { from: 801, src: 'whoosh-big.mp3', volume: 0.5, dur: 60 }, // → outro
  // outro：riser → impact → sparkle → 水泡
  { from: 808, src: 'riser-cine.mp3', volume: 0.5, dur: 30 },
  { from: 835, src: 'impact-cine.mp3', volume: 0.55, dur: 50 },
  { from: 851, src: 'sparkle.mp3', volume: 0.3, dur: 50 },
  { from: 872, src: 'water-bubble.mp3', volume: 0.35, dur: 60 },
];

// BGM：音量 0.3，首 24f 淡入、末 48f 淡出
const bgmVolume = (f: number) => {
  if (f < 24) return (f / 24) * 0.3;
  if (f > TOTAL - 48) return ((TOTAL - f) / 48) * 0.3;
  return 0.3;
};

export const Main: React.FC = () => {
  const props = getInputProps() as { bgm?: boolean };
  const bgm = props.bgm !== false;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b4f73' }}>
      {/* BGM（可关：--props=props-nobgm.json 渲无 BGM 版） */}
      {bgm ? (
        <Sequence from={0} durationInFrames={TOTAL}>
          <Audio src={staticFile('audio/bgm-tech-house.mp3')} volume={bgmVolume} />
        </Sequence>
      ) : null}

      {/* SFX 钉帧 */}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.from} durationInFrames={s.dur}>
          <Audio src={staticFile(`audio/${s.src}`)} volume={s.volume} />
        </Sequence>
      ))}

      {/* TTS 旁白 */}
      {TTS.map((t) => (
        <Sequence key={t.src} from={t.from} durationInFrames={t.dur}>
          <Audio src={staticFile(`audio/${t.src}`)} volume={0.95} />
        </Sequence>
      ))}

      {/* 六个场景 */}
      <Sequence from={SHOTS.open.from} durationInFrames={SHOTS.open.duration}>
        <SceneOpen />
      </Sequence>
      <Sequence from={SHOTS.r1.from} durationInFrames={SHOTS.r1.duration}>
        <SceneStarve />
      </Sequence>
      <Sequence from={SHOTS.r2.from} durationInFrames={SHOTS.r2.duration}>
        <SceneNight />
      </Sequence>
      <Sequence from={SHOTS.r3.from} durationInFrames={SHOTS.r3.duration}>
        <SceneCardio />
      </Sequence>
      <Sequence from={SHOTS.r4.from} durationInFrames={SHOTS.r4.duration}>
        <SceneScale />
      </Sequence>
      <Sequence from={SHOTS.outro.from} durationInFrames={SHOTS.outro.duration}>
        <SceneOutro />
      </Sequence>

      {/* 底部解说字幕 */}
      {CAPTIONS.map((c) => (
        <Sequence key={c.from} from={c.from} durationInFrames={c.duration}>
          <Caption text={c.text} duration={c.duration} />
        </Sequence>
      ))}

      {/* 水泡闪光转场（跨骑硬切） */}
      {[SHOTS.r1.from, SHOTS.r2.from, SHOTS.r3.from, SHOTS.r4.from, SHOTS.outro.from].map(
        (cut) => (
          <Sequence key={cut} from={cut - 6} durationInFrames={12}>
            <BubbleFlash duration={12} />
          </Sequence>
        ),
      )}
    </AbsoluteFill>
  );
};
