import { AbsoluteFill, Img, staticFile } from 'remotion';
import { FONT, SK, inkOutline, surface } from './cards/skin';

/**
 * 发布用封面（缩略图）合成：1280×720。
 *
 * 文案是发布选题定稿，不与正片分镜大字共用：
 *   主：国考 vs 省考
 *   副：先搞清楚再报名，别再赌错！
 *
 * 布局：右上角系列标签（公考扫盲 · 局长该学习了）+ 上方留白区放大标题 +
 * 主标题下方纸感副题签。背景复用 bg-open.png，静态即可（任意单帧导出都成立）。
 */
const Tag: React.FC<{ text: string; accent?: boolean }> = ({ text, accent }) => (
  <div
    style={{
      ...surface(accent ? SK.sponge : SK.paper, 14),
      padding: '6px 16px',
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: 26,
      color: SK.ink,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: SK.deep }}>
    {/* 背景 */}
    <Img
      src={staticFile('textures/bg-open.png')}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
    {/* 顶部压暗，给大字可读底 + 四角暗角（阅读性） */}
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, rgba(8,58,86,0.72) 0%, rgba(8,58,86,0.30) 22%, rgba(8,58,86,0) 44%)',
        pointerEvents: 'none',
      }}
    />
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(ellipse at 50% 45%, transparent 52%, rgba(8,58,86,0.42) 100%)',
        pointerEvents: 'none',
      }}
    />

    {/* 右上角系列标签 */}
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 12, padding: 26 }}>
        <Tag text="公考扫盲" />
        <Tag text="局长该学习了" accent />
      </div>
    </AbsoluteFill>

    {/* 主标题（上方留白区，单行） */}
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
      <div
        style={{
          marginTop: 176,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          lineHeight: 1.12,
        }}
      >
        <div
          style={{
            fontSize: 128,
            color: SK.sponge,
            textShadow: inkOutline(6, SK.ink),
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          国考 <span style={{ color: SK.white }}>vs</span> 省考
        </div>
      </div>
    </AbsoluteFill>

    {/* 副题签（纸感） */}
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          ...surface(SK.sponge, 18),
          padding: '14px 34px',
          marginTop: 208,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 42,
          color: SK.ink,
          whiteSpace: 'nowrap',
          letterSpacing: 1,
        }}
      >
        先搞清楚再报名，别再赌错！
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);