import { AbsoluteFill, Audio, Sequence, getInputProps, staticFile } from 'remotion';
import { SceneOpen, SceneDemand, SceneFiscal, SceneMarket, SceneCbank, SceneHot, SceneExam, SceneOutro } from './Scenes';
import { Caption } from './Caption';
import { BubbleFlash } from './BubbleFlash';

// 场景 Sequence（DESIGN.md §三，2700 帧 = 90s @30fps）
export const HG_SHOTS = {
  open: { from: 0, duration: 275 },
  r1: { from: 290, duration: 424 },
  r2: { from: 729, duration: 303 },
  r3: { from: 1047, duration: 296 },
  r4: { from: 1358, duration: 345 },
  r5: { from: 1718, duration: 329 },
  r6: { from: 2062, duration: 284 },
  outro: { from: 2361, duration: 339 },
} as const;
export const HG_TOTAL = 2700;

// 底部解说字幕（与 TTS 旁白对齐；r6 有 cel-flash 自带标签条，不再叠全局字幕）
const CAPTIONS = [
  { from: 0, duration: 275, text: '比奇堡第 1 届市长竞选辩论大会，正式开赛！' },
  { from: 290, duration: 424, text: '总需求不足 → 国家出手调节 = 宏观调控（经济·法律·行政）' },
  { from: 729, duration: 303, text: '扩张性财政政策 = 增支出 + 发国债 + 减税收（经济冷，政府花）' },
  { from: 1047, duration: 296, text: '供给侧改革：减税放权，让市场自己调节' },
  { from: 1358, duration: 345, text: '货币政策（央行）= 降利率 + 降准备金率 + 买国债' },
  { from: 1718, duration: 329, text: '经济热 → 紧缩性：加税 + 加息 + 少花钱' },
  { from: 2361, duration: 339, text: '免费午餐 = 民粹主义；宏观调控，要科学！' },
] as const;

// TTS 旁白（edge-tts zh-CN-XiaoxiaoNeural +20%；时长来自 durations.json，帧号 = round(时长×30)）
const TTS = [
  { from: 0, dur: 250, src: 'tts-open.mp3' },
  { from: 290, dur: 399, src: 'tts-r1.mp3' },
  { from: 729, dur: 278, src: 'tts-r2.mp3' },
  { from: 1047, dur: 271, src: 'tts-r3.mp3' },
  { from: 1358, dur: 320, src: 'tts-r4.mp3' },
  { from: 1718, dur: 304, src: 'tts-r5.mp3' },
  { from: 2062, dur: 259, src: 'tts-r6.mp3' },
  { from: 2361, dur: 286, src: 'tts-outro.mp3' },
] as const;

// SFX 钉帧表（绝对帧号，写死不再平移；文件名 = public/audio/ 下平铺资产）
const SFX: { from: number; src: string; volume: number; dur: number }[] = [
  // open：kicker + 标题弹入 + 环转氛围
  { from: 8, src: 'pop.mp3', volume: 0.5, dur: 30 },
  { from: 28, src: 'pop.mp3', volume: 0.5, dur: 30 },
  { from: 52, src: 'pop.mp3', volume: 0.55, dur: 30 },
  { from: 100, src: 'whoosh-fast.mp3', volume: 0.35, dur: 40 },
  { from: 160, src: 'whoosh-fast.mp3', volume: 0.35, dur: 40 },
  { from: 282, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r1
  // r1：总需求不足 / 宏观调控 / 三大手段逐项
  { from: 300, src: 'pop.mp3', volume: 0.45, dur: 30 },
  { from: 490, src: 'pop.mp3', volume: 0.5, dur: 30 },
  { from: 634, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 646, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 657, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 725, src: 'whoosh-big.mp3', volume: 0.5, dur: 60 }, // → r2
  // r2：珊迪方案 / 三工具 / 扩张性财政政策砸落
  { from: 744, src: 'pop.mp3', volume: 0.45, dur: 30 },
  { from: 774, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 819, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 864, src: 'pop.mp3', volume: 0.4, dur: 30 },
  { from: 934, src: 'impact-cine-big.mp3', volume: 0.55, dur: 60 },
  { from: 1043, src: 'swoosh-quick.mp3', volume: 0.45, dur: 40 }, // → r3
  // r3：两张卡翻面
  { from: 1167, src: 'paper-page-turn.mp3', volume: 0.45, dur: 40 },
  { from: 1177, src: 'paper-page-turn.mp3', volume: 0.45, dur: 40 },
  { from: 1354, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r4
  // r4：三仪表错峰甩针
  { from: 1398, src: 'clock-tick-single.mp3', volume: 0.5, dur: 20 },
  { from: 1402, src: 'clock-tick-single.mp3', volume: 0.5, dur: 20 },
  { from: 1406, src: 'clock-tick-single.mp3', volume: 0.5, dur: 20 },
  { from: 1714, src: 'sweep-fast.mp3', volume: 0.45, dur: 40 }, // → r5
  // r5：物价冲出图表 + 轴重标 + 紧缩字卡
  { from: 1793, src: 'impact-transition.mp3', volume: 0.5, dur: 50 },
  { from: 1811, src: 'glitch-electric-small.mp3', volume: 0.35, dur: 30 },
  { from: 1913, src: 'pop.mp3', volume: 0.45, dur: 30 },
  { from: 2058, src: 'whoosh-fast.mp3', volume: 0.4, dur: 40 }, // → r6
  // r6：考点三连盖章
  { from: 2072, src: 'impact-cine-big.mp3', volume: 0.5, dur: 40 },
  { from: 2102, src: 'impact-cine-big.mp3', volume: 0.5, dur: 40 },
  { from: 2132, src: 'impact-movie-epic.mp3', volume: 0.55, dur: 50 },
  { from: 2357, src: 'riser-cine.mp3', volume: 0.5, dur: 40 }, // → outro
  // outro：2000 票冲线 + 彩纸 + 收尾字卡 + 水泡
  { from: 2381, src: 'pop.mp3', volume: 0.45, dur: 30 },
  { from: 2537, src: 'impact-cine-big.mp3', volume: 0.55, dur: 60 },
  { from: 2586, src: 'sparkle.mp3', volume: 0.35, dur: 50 },
  { from: 2600, src: 'water-bubble.mp3', volume: 0.35, dur: 70 },
];

// BGM：音量 0.3，首 24f 淡入、末 48f 淡出
const bgmVolume = (f: number) => {
  if (f < 24) return (f / 24) * 0.3;
  if (f > HG_TOTAL - 48) return ((HG_TOTAL - f) / 48) * 0.3;
  return 0.3;
};

export const HgMain: React.FC = () => {
  const props = getInputProps() as { bgm?: boolean };
  const bgm = props.bgm !== false;
  return (
    <AbsoluteFill style={{ backgroundColor: '#0b4f73' }}>
      {/* BGM（可关：--props=props-nobgm.json 渲无 BGM 版，同一时间线） */}
      {bgm ? (
        <Sequence from={0} durationInFrames={HG_TOTAL}>
          <Audio src={staticFile('audio/bgm/house-vibez.mp3')} volume={bgmVolume} />
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
          <Audio src={staticFile(`audio/tts/${t.src}`)} volume={0.95} />
        </Sequence>
      ))}

      {/* 八个场景 */}
      <Sequence from={HG_SHOTS.open.from} durationInFrames={HG_SHOTS.open.duration}>
        <SceneOpen />
      </Sequence>
      <Sequence from={HG_SHOTS.r1.from} durationInFrames={HG_SHOTS.r1.duration}>
        <SceneDemand />
      </Sequence>
      <Sequence from={HG_SHOTS.r2.from} durationInFrames={HG_SHOTS.r2.duration}>
        <SceneFiscal />
      </Sequence>
      <Sequence from={HG_SHOTS.r3.from} durationInFrames={HG_SHOTS.r3.duration}>
        <SceneMarket />
      </Sequence>
      <Sequence from={HG_SHOTS.r4.from} durationInFrames={HG_SHOTS.r4.duration}>
        <SceneCbank />
      </Sequence>
      <Sequence from={HG_SHOTS.r5.from} durationInFrames={HG_SHOTS.r5.duration}>
        <SceneHot />
      </Sequence>
      <Sequence from={HG_SHOTS.r6.from} durationInFrames={HG_SHOTS.r6.duration}>
        <SceneExam />
      </Sequence>
      <Sequence from={HG_SHOTS.outro.from} durationInFrames={HG_SHOTS.outro.duration}>
        <SceneOutro />
      </Sequence>

      {/* 底部解说字幕 */}
      {CAPTIONS.map((c) => (
        <Sequence key={c.from} from={c.from} durationInFrames={c.duration}>
          <Caption text={c.text} duration={c.duration} />
        </Sequence>
      ))}

      {/* 水泡闪光转场（跨骑硬切，两侧各 6f） */}
      {[HG_SHOTS.r1.from, HG_SHOTS.r2.from, HG_SHOTS.r3.from, HG_SHOTS.r4.from, HG_SHOTS.r5.from, HG_SHOTS.r6.from, HG_SHOTS.outro.from].map(
        (cut) => (
          <Sequence key={cut} from={cut - 6} durationInFrames={12}>
            <BubbleFlash duration={12} />
          </Sequence>
        ),
      )}
    </AbsoluteFill>
  );
};
