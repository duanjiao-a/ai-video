import { Sequence } from 'remotion';
import { AssembleForms } from '../cards/AssembleForms';
import { BenefitList } from '../cards/BenefitList';
import { HingeRise } from '../cards/HingeRise';
import { OutroLockup } from '../cards/OutroLockup';
import { Line, Tag } from '../cards/parts';
import { useLocalT } from '../cards/motion';
import { SK } from '../cards/skin';
import { UnitGrid } from '../cards/UnitGrid';
import { WordRoll } from '../cards/WordRoll';
import { SceneBg } from './SceneBg';

/**
 * 六个分镜 = 背景图 + 若干"卡窗口"。
 *
 * 每个窗口都是一个 <Sequence>，帧号全部来自 narration.ts 的卡点表
 * （= 那个词被念到的时刻），不是拍脑袋定的。窗口内用 useLocalT 走卡片自己的
 * 归一化时间轴。改任何窗口的 from/dur，都要回去对 narration.ts。
 *
 * 卡来源（随机抽签，见 pick-cards.mjs，seed=20270917）：
 *   open  ← typography/vertical-word-roll-blur-cycle（词条滚轮）
 *   r1    ← ui-entrance/platform-hinge-rise（平台翻起）
 *   r2    ← data/avatar-grid-radial-build-colorize（分环生长染色）
 *   r3    ← effects/assemble-then-type-flyin（骨架飞入 + 逐字 3D 落位）
 *   r4    ← ui-entrance/list-reveal（逐项找位 + 整组漂移）
 *   outro ← outro/logo-shrink-wordmark-lockup（图标收束 + 字标落定）
 * 抓到的卡不够覆盖整段旁白，所以同一张卡的**两条内核**会分别用在不同句子上
 * （例如 assemble 的"骨架飞入"与"逐字 3D 落位"分给两个 beat），这是原样复用。
 */

/** 1. open — 备考倒计时小屋 */
export const SceneOpen: React.FC = () => (
  <SceneBg src="bg-open.png" duration={511}>
    {/* 今天要学习的是 ___：词条滚轮，落定在 open.topic(95) */}
    <Sequence from={50} durationInFrames={130}>
      <WordRoll
        stem="今天要学习的是"
        words={['事业单位', '教师编', '国考省考']}
        steps={[0.12, 0.24, 0.36]}
        dur={130}
        top={64}
        fontSize={50}
      />
    </Sequence>
    {/* 距离报名不到 ___ 天：同一张卡的滚轮内核，滚的是数字，落定在 open.month(242) */}
    <Sequence from={196} durationInFrames={104}>
      <WordRoll
        stem="距离报名不到"
        words={['90 天', '60 天', '45 天', '30 天']}
        steps={[0.16, 0.32, 0.48]}
        dur={104}
        top={300}
        fontSize={48}
        sealAfter
      />
    </Sequence>
    <Sequence from={296} durationInFrames={132}>
      <Line main="百分之九十的人" sub="连国考省考都分不清" size={72} top={66} dur={132} />
    </Sequence>
    <Sequence from={452} durationInFrames={59}>
      <Line main="你，真的准备好了吗？" size={64} top={96} dur={59} accent={SK.stamp} />
    </Sequence>
  </SceneBg>
);

/** 2. r1 — 国家公务员办事大厅：国考 = 中央机关 */
export const SceneR1: React.FC = () => (
  <SceneBg src="bg-r1.png" duration={619}>
    {/* 平台翻起：双面落定对齐 r1.central(119)，结论台对齐"统一招录" */}
    <Sequence from={100} durationInFrames={110}>
      <HingeRise dur={110} />
    </Sequence>
    {/* 四个招人单位：沿用 assemble 卡的"骨架飞入"内核，逐块贴合 */}
    <Sequence from={218} durationInFrames={120}>
      <UnitTags dur={120} />
    </Sequence>
    <Sequence from={400} durationInFrames={140}>
      <Line
        main="报名笔试全国统一"
        sub="每年十月报名 · 十一月底笔试"
        size={64}
        top={64}
        dur={140}
      />
    </Sequence>
    <Sequence from={542} durationInFrames={77}>
      <Line main="大半岗位只招应届生" size={70} top={80} dur={77} accent={SK.stamp} />
    </Sequence>
  </SceneBg>
);

/**
 * 四个单位牌：沿用 assemble 卡的"骨架飞入"内核（outBack 过冲 + 残影 blur）。
 * 卡点（分镜相对帧）：部委 221 / 税务局 242 / 海关 265 / 铁路公安 288，
 * 减去窗口起点 218 再归一化。
 */
const UnitTags: React.FC<{ dur: number }> = ({ dur }) => {
  const t = useLocalT(dur);
  const items: { text: string; at: number; from: [number, number] }[] = [
    { text: '部委', at: 221, from: [-420, -80] },
    { text: '税务局', at: 242, from: [0, -260] },
    { text: '海关', at: 265, from: [0, 280] },
    { text: '铁路公安', at: 288, from: [440, 90] },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 300,
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 16,
      }}
    >
      {items.map((it) => (
        <Tag
          key={it.text}
          text={it.text}
          from={it.from}
          ft={(it.at - 218) / dur}
          t={t}
          size={32}
        />
      ))}
    </div>
  );
};

/** 3. r2 — 省考招考办柜台：省考 = 地方招录 */
export const SceneR2: React.FC = () => (
  <SceneBg src="bg-r2.png" duration={624}>
    <Sequence from={60} durationInFrames={100}>
      <Line main="省考 = 各省自己组织" sub="招录本地公务员" size={64} top={64} dur={100} />
    </Sequence>
    <Sequence from={160} durationInFrames={250}>
      <UnitGrid dur={250} />
    </Sequence>
    <Sequence from={396} durationInFrames={110}>
      <Line main="多省联考 · 大多三月笔试" size={62} top={84} dur={110} />
    </Sequence>
    <Sequence from={506} durationInFrames={118}>
      <Line main="户籍 · 往届更友好" sub="往届生也能报" size={62} top={80} dur={118} />
    </Sequence>
  </SceneBg>
);

/** 4. r3 — 两份都报：应届生 */
export const SceneR3: React.FC = () => (
  <SceneBg src="bg-r3.png" duration={422}>
    <Sequence from={60} durationInFrames={360}>
      <AssembleForms start={60} dur={360} />
    </Sequence>
  </SceneBg>
);

/** 5. r4 — 本地柜台招呼往届：往届生主攻省考 */
export const SceneR4: React.FC = () => (
  <SceneBg src="bg-r4.png" duration={418}>
    <Sequence from={36} durationInFrames={60}>
      <Line main="往届生" sub="优先主攻省考" size={72} top={50} dur={60} />
    </Sequence>
    <Sequence from={88} durationInFrames={76}>
      <Line main="国考：限制多 · 岗位少" size={56} top={210} dur={76} />
    </Sequence>
    <Sequence from={164} durationInFrames={34}>
      <Line main="竞争惨烈" size={66} top={292} dur={34} accent={SK.stamp} />
    </Sequence>
    <Sequence from={196} durationInFrames={210}>
      <BenefitList start={196} dur={210} />
    </Sequence>
    <Sequence from={356} durationInFrames={62}>
      <Line main="上岸概率明显更高" size={70} top={62} dur={62} accent={SK.stamp} />
    </Sequence>
  </SceneBg>
);

/** 6. outro — 考试院门口收尾 */
export const SceneOutro: React.FC = () => (
  <SceneBg src="bg-outro.png" duration={354}>
    <Sequence from={0} durationInFrames={40}>
      <Line main="最后记住一句话" size={52} top={54} dur={40} />
    </Sequence>
    <Sequence from={36} durationInFrames={300}>
      <OutroLockup start={36} dur={300} />
    </Sequence>
  </SceneBg>
);
