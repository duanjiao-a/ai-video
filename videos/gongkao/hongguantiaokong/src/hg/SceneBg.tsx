import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing } from 'remotion';
import { Bubbles } from './Bubbles';

/**
 * 通用海底场景：一张 RunningHub 生成的背景 + 线性缓推运镜 + 上升气泡层
 * + 阅读性暗角。children 叠加在顶层（大字卡等）。
 * 1280×720 画布：缩放 scale 1.00 → 1.04 缓推（DESIGN.md §二）。
 */
export const SceneBg: React.FC<{
  src: string;
  duration: number;
  zoomTo?: number;
  panX?: number;
  bubbles?: boolean;
  dim?: number; // 额外压暗（cel-flash 等需要背景退到文字后面）
  children?: React.ReactNode;
}> = ({ src, duration, zoomTo = 1.04, panX = 0, bubbles = true, dim = 0, children }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, duration], [1, zoomTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.linear,
  });
  const x = interpolate(frame, [0, duration], [0, panX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.linear,
  });
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: '#0b4f73' }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${z}) translateX(${x}px)`,
        }}
      >
        <Img
          src={staticFile(`textures/${src}`)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      {bubbles ? <Bubbles /> : null}
      {/* 阅读性暗角 */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(6,30,48,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
      {dim > 0 ? (
        <AbsoluteFill style={{ background: `rgba(4,20,35,${dim})`, pointerEvents: 'none' }} />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
