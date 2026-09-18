import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { CAPTIONS } from '../captions';
import { A, SHOT_START } from '../narration';
import {
  CutCube,
  CutGradient,
  CutMosaic,
  CutScanline,
  CutWhiteFlash,
} from '../cards/cuts';
import { Caption } from './Caption';
import { SceneOpen, SceneOutro, SceneR1, SceneR2, SceneR3, SceneR4 } from './Scenes';
import { SK } from '../cards/skin';

/**
 * 时间线总装。
 *
 * 帧号来源：`步骤3-TTS.md` 实测回填，每段 dur = round(MP3 真实时长 × 30)。
 * 分镜首尾相接（MP3 尾部约 0.49s 静音本身就是段间呼吸，再加 15f 会渲出空屏）。
 *
 * **所有动画卡点走 narration.ts 的 A 表**——那是从 srt 词级时间轴反推的
 * "这句话在第几帧被念到"。第一版把卡点写成手挑帧号，结果大字比旁白早
 * 1.5–7.7s 出场，观众读作"画面对不上旁白"；现在没有任何一个 from 是手写的。
 *
 * BGM：本片不带（用户明确"不需要 bgm"）。
 */

export const SHOTS = {
  open: { from: 0, dur: 511, cat: 'tts-open' },
  r1: { from: 511, dur: 619, cat: 'tts-r1' },
  r2: { from: 1130, dur: 624, cat: 'tts-r2' },
  r3: { from: 1754, dur: 422, cat: 'tts-r3' },
  r4: { from: 2176, dur: 418, cat: 'tts-r4' },
  outro: { from: 2594, dur: 354, cat: 'tts-outro' },
} as const;

export const TOTAL =
  SHOTS.open.dur + SHOTS.r1.dur + SHOTS.r2.dur + SHOTS.r3.dur + SHOTS.r4.dur + SHOTS.outro.dur;

/**
 * 硬切点（转场卡跨骑用）。
 * 跨骑窗口 deliberately 偏切点**前**侧：切点前的 16 帧基本落在上一段 MP3 的
 * 尾部静音里，切点后只压 7 帧（≈0.23s，仍在下一段的起音间隙内），
 * 这样转场不会盖住下一句开头和刚出现的字幕。
 */
const CUTS = [SHOTS.r1.from, SHOTS.r2.from, SHOTS.r3.from, SHOTS.r4.from, SHOTS.outro.from];
const CUT_LEAD = 16; // 切点前压住的帧数
export const CUT_DUR = 24; // 转场卡总长

/**
 * SFX 钉帧表：from **全部**取自 narration.ts 的 A 表（该词被念到的绝对帧），
 * 不再手写。音色只用真实物件拟音（纸 / 打字机 / 钟表 / 水泡 / 水晶），
 * 不用合成 UI 提示音（aesthetic-rules S1）。
 */
const SFX: { from: number; src: string; volume: number; dur: number; note: string }[] = [
  // ── open ──
  { from: A['open.hook'].abs, src: 'counter/clock-tick-single.mp3', volume: 0.3, dur: 26, note: '固定开场句' },
  { from: A['open.stem'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.34, dur: 26, note: '词轮牌入场' },
  { from: A['open.topic'].abs, src: 'ui/chime-crystal.mp3', volume: 0.3, dur: 40, note: '「国考省考」落定' },
  { from: A['open.y2027'].abs, src: 'counter/clock-tick-single.mp3', volume: 0.3, dur: 26, note: '倒计时牌' },
  { from: A['open.month'].abs, src: 'paper/paper-staple.mp3', volume: 0.32, dur: 26, note: '「30 天」落定' },
  { from: A['open.ninety'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.38, dur: 26, note: '90% 分不清' },
  { from: A['open.ready'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.4, dur: 26, note: '准备好了吗' },
  // ── r1 ──
  { from: A['r1.first'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.3, dur: 22, note: '先说国考' },
  { from: A['r1.central'].abs, src: 'paper/paper-staple.mp3', volume: 0.34, dur: 26, note: '双面翻起落定' },
  { from: A['r1.units'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.32, dur: 22, note: '单位牌 1 部委' },
  { from: A['r1.rail'].abs, src: 'paper/paper-slide.mp3', volume: 0.3, dur: 22, note: '单位牌 4 铁路公安' },
  { from: A['r1.unified'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.38, dur: 26, note: '全国统一时间' },
  { from: A['r1.oct'].abs, src: 'counter/clock-tick-single.mp3', volume: 0.3, dur: 22, note: '十月报名' },
  { from: A['r1.nov'].abs, src: 'counter/clock-tick-single.mp3', volume: 0.3, dur: 22, note: '十一月底笔试' },
  { from: A['r1.fresh'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.44, dur: 28, note: '只招应届生' },
  // ── r2 ──
  { from: A['r2.second'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.3, dur: 22, note: '再说省考' },
  { from: A['r2.self'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.34, dur: 26, note: '各省自己组织' },
  { from: A['r2.levels'].abs, src: 'light/sparkle.mp3', volume: 0.26, dur: 40, note: '单位网格开始分环生长' },
  { from: A['r2.near'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.4, dur: 26, note: '中央标题 岗位多·离家近' },
  { from: A['r2.joint'].abs, src: 'paper/paper-slide.mp3', volume: 0.3, dur: 22, note: '联考红格浮现' },
  { from: A['r2.march'].abs, src: 'counter/clock-tick-single.mp3', volume: 0.3, dur: 22, note: '三月笔试' },
  { from: A['r2.friendly'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.38, dur: 26, note: '户籍/往届更友好' },
  { from: A['r2.anyone'].abs, src: 'ui/chime-crystal.mp3', volume: 0.28, dur: 40, note: '往届生也能报' },
  // ── r3 ──
  { from: A['r3.who'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.3, dur: 22, note: '应届生该考哪个' },
  { from: A['r3.both'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.46, dur: 28, note: '两个都报 逐字 3D 落位' },
  { from: A['r3.nov'].abs, src: 'paper/paper-slide.mp3', volume: 0.34, dur: 24, note: '国考表飞入' },
  { from: A['r3.march'].abs, src: 'paper/paper-slide.mp3', volume: 0.34, dur: 24, note: '省考表飞入' },
  { from: A['r3.stagger'].abs, src: 'light/sparkle.mp3', volume: 0.26, dur: 40, note: '时间正好错开' },
  { from: A['r3.double'].abs, src: 'paper/paper-staple.mp3', volume: 0.36, dur: 28, note: '机会直接翻倍' },
  // ── r4 ──
  { from: A['r4.who'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.3, dur: 22, note: '那往届生呢' },
  { from: A['r4.prov'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.42, dur: 26, note: '优先主攻省考' },
  { from: A['r4.limit'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.36, dur: 26, note: '国考限制多' },
  { from: A['r4.fierce'].abs, src: 'impact/bass-hit-short.mp3', volume: 0.34, dur: 26, note: '竞争惨烈' },
  { from: A['r4.near'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.34, dur: 22, note: '列表第 1 条 岗位多' },
  { from: A['r4.hukou'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.34, dur: 22, note: '列表第 3 条 限本省户籍' },
  { from: A['r4.odds'].abs, src: 'paper/paper-staple.mp3', volume: 0.4, dur: 28, note: '上岸概率更高' },
  // ── outro ──
  { from: A['outro.mnemonic'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.3, dur: 22, note: '最后记住一句话' },
  { from: A['outro.central'].abs, src: 'ui/chime-crystal.mp3', volume: 0.3, dur: 44, note: '图标收束落位' },
  { from: A['outro.local'].abs, src: 'paper/paper-slide.mp3', volume: 0.28, dur: 22, note: '字标滑入' },
  { from: A['outro.fresh'].abs, src: 'text/typewriter-hit-soft.mp3', volume: 0.34, dur: 22, note: '应届两头抓' },
  { from: A['outro.past'].abs, src: 'text/typewriter-hit-hard.mp3', volume: 0.4, dur: 26, note: '往届盯本省' },
  { from: A['outro.signup'].abs, src: 'light/sparkle.mp3', volume: 0.26, dur: 40, note: '报名马上开始' },
  { from: A['outro.cta'].abs, src: 'paper/paper-staple.mp3', volume: 0.38, dur: 28, note: 'CTA 落位' },
  // ── 五个切点：转场卡入场音 ──
  ...CUTS.map((c) => ({
    from: c - CUT_LEAD,
    src: 'transition/whoosh-big.mp3',
    volume: 0.32,
    dur: 40,
    note: `转场卡跨骑切点 ${c}`,
  })),
];

/** TTS 旁白：from 用分镜起点，dur 用 MP3 真实时长（含尾部静音），保证不切尾 */
const TTS = Object.values(SHOTS).map((s) => ({
  from: s.from,
  dur: s.dur,
  src: `${s.cat}.mp3`,
}));

/** 每个分镜的旁白字幕块（from/dur 相对该分镜起点） */
const Cues: React.FC<{ cat: string }> = ({ cat }) => (
  <>
    {(CAPTIONS[cat] ?? []).map((c) => (
      <Sequence key={c.from} from={c.from} durationInFrames={c.dur}>
        <Caption text={c.text} duration={c.dur} />
      </Sequence>
    ))}
  </>
);

/** 五个转场卡：切点前 16 帧起、共 24 帧（切点后只压 7 帧） */
const CutCards = () => (
  <>
    <Sequence from={CUTS[0] - CUT_LEAD} durationInFrames={CUT_DUR}>
      <CutWhiteFlash dur={CUT_DUR} word="国考" />
    </Sequence>
    <Sequence from={CUTS[1] - CUT_LEAD} durationInFrames={CUT_DUR}>
      <CutGradient dur={CUT_DUR} label="省考" />
    </Sequence>
    <Sequence from={CUTS[2] - CUT_LEAD} durationInFrames={CUT_DUR}>
      <CutCube dur={CUT_DUR} front="省考" back="应届生" />
    </Sequence>
    <Sequence from={CUTS[3] - CUT_LEAD} durationInFrames={CUT_DUR}>
      <CutMosaic dur={CUT_DUR} label="往届生" />
    </Sequence>
    <Sequence from={CUTS[4] - CUT_LEAD} durationInFrames={CUT_DUR}>
      <CutScanline dur={CUT_DUR} label="上岸" />
    </Sequence>
  </>
);

export const Main: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SK.deep }}>
    {/* SFX 钉帧 */}
    {SFX.map((s, i) => (
      <Sequence key={`sfx-${i}`} from={s.from} durationInFrames={s.dur}>
        <Audio src={staticFile(`audio/sfx/${s.src}`)} volume={s.volume} />
      </Sequence>
    ))}

    {/* TTS 旁白 */}
    {TTS.map((t) => (
      <Sequence key={t.src} from={t.from} durationInFrames={t.dur}>
        <Audio src={staticFile(`audio/tts/${t.src}`)} volume={0.95} />
      </Sequence>
    ))}

    {/* 六个分镜（各自带自己的底部字幕块） */}
    <Sequence from={SHOTS.open.from} durationInFrames={SHOTS.open.dur}>
      <SceneOpen />
      <Cues cat={SHOTS.open.cat} />
    </Sequence>
    <Sequence from={SHOTS.r1.from} durationInFrames={SHOTS.r1.dur}>
      <SceneR1 />
      <Cues cat={SHOTS.r1.cat} />
    </Sequence>
    <Sequence from={SHOTS.r2.from} durationInFrames={SHOTS.r2.dur}>
      <SceneR2 />
      <Cues cat={SHOTS.r2.cat} />
    </Sequence>
    <Sequence from={SHOTS.r3.from} durationInFrames={SHOTS.r3.dur}>
      <SceneR3 />
      <Cues cat={SHOTS.r3.cat} />
    </Sequence>
    <Sequence from={SHOTS.r4.from} durationInFrames={SHOTS.r4.dur}>
      <SceneR4 />
      <Cues cat={SHOTS.r4.cat} />
    </Sequence>
    <Sequence from={SHOTS.outro.from} durationInFrames={SHOTS.outro.dur}>
      <SceneOutro />
      <Cues cat={SHOTS.outro.cat} />
    </Sequence>

    {/* 转场卡（盖住切点） */}
    <CutCards />
  </AbsoluteFill>
);

// SHOT_START 由 narration.ts 生成，这里断言两边的分镜起点一致，
// 避免"改了一边忘了另一边"导致卡点整体错位。
const MISMATCH = Object.entries(SHOTS).filter(
  ([, v]) => SHOT_START[v.cat] !== v.from,
);
if (MISMATCH.length) {
  throw new Error(
    `分镜起点与 narration.ts 不一致（跑 npm run captions 重生成）：${MISMATCH.map(
      ([k]) => k,
    ).join(', ')}`,
  );
}
