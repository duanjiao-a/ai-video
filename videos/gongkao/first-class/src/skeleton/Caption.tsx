import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, outlineShadow } from './style';

/**
 * 底部字幕：白字墨蓝描边 + 半透明信纸条。
 *
 * 字高：40px @ 720p ≈ 5.6% 帧高，满足「叙事字幕 ≥5% 帧高 / 1080p 60px 档」的等价要求。
 * 内容：**旁白全文照抄**，由 build-captions.py 按句读切成 ≤14 字的块，
 * 每块的 from/dur 贴着 srt 词级时间轴，所以整段旁白是逐块完整显示的，没有精简。
 */
export const Caption: React.FC<{ text: string; duration: number }> = ({ text, duration }) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outT = interpolate(frame, [duration - 5, duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 34,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: Math.min(inT, outT),
        transform: `translateY(${(1 - inT) * 10}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 40,
          lineHeight: 1.25,
          color: COLORS.white,
          textShadow: outlineShadow(COLORS.ink, 5),
          background: 'rgba(8,58,86,0.62)',
          borderRadius: 18,
          padding: '10px 32px',
          border: '3px solid rgba(255,255,255,0.85)',
          whiteSpace: 'nowrap',
          maxWidth: 1200,
        }}
      >
        {text}
      </div>
    </div>
  );
};
