// carousel-3d（demos/ui-entrance/carousel-3d/Carousel3D.tsx 适配）
// 8 张 RunningHub 素材按 sin/cos 排成圆环并匀速整环自转一圈无缝 loop；
// 每卡只绕 Y 公转、自身 billboard 朝外，正反两层同图贴图 +
// backface-visibility:hidden（含 -webkit- 前缀），任何时刻卡片都正立不倒置；
// 相机全程固定（浅俯角近景）。设计坐标 480×270（DesignStage 等比放大），
// 参数表数值以此坐标系标定：卡宽 100（16:9）→ 半径 200（≈2×卡宽，命门甜点）。
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { DesignStage } from './Motion';

// 卡面 = 全部 RunningHub 素材（DESIGN.md §七）
export const CAROUSEL_IMAGES = [
  'bg-open.png',
  'bg-demand.png',
  'bg-fiscal.png',
  'bg-market.png',
  'bg-cbank.png',
  'bg-hot.png',
  'bg-exam.png',
  'bg-outro.png',
];
export const CAROUSEL_N = CAROUSEL_IMAGES.length;

const RADIUS = 200; // 卡宽≈2 倍
const CARD_W = 100;
const CARD_H = 56; // 16:9 横卡

export const Carousel3D: React.FC<{ duration?: number }> = ({ duration = 168 }) => {
  // 环匀速自转一整圈：整段（duration 帧）正好转 360°，无缝 loop（命门：圈数须为整数）
  const frame = useCurrentFrame();
  const spin = (frame / Math.max(1, duration - 1)) * 360;
  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
    boxSizing: 'border-box',
    overflow: 'hidden',
    // 双面同向贴图 + backface hidden：从环外/环内看都是正立不镜像的同一张图
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    border: '2px solid rgba(255,230,0,0.9)',
    boxShadow: '0 10px 26px rgba(0,0,0,.5)',
  };
  return (
    <DesignStage bg="radial-gradient(ellipse at 50% 55%, #0d4060 0%, #052033 75%)">
      {/* 3D 场景：perspective 950px + 深海水渐变 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          perspective: '950px',
          background: 'radial-gradient(ellipse at 50% 55%, #0d4060 0%, #052033 75%)',
        }}
      >
        {/* 相机全程固定：浅俯角近景，不拉远不变角 */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            transform: 'translateZ(-90px) rotateX(-8deg) translateY(-10px)',
          }}
        >
          {/* 圆环载体：唯一的逐帧变量，整环绕 Y 匀速自转 */}
          <div
            style={{
              position: 'absolute',
              transformStyle: 'preserve-3d',
              willChange: 'transform',
              transform: `rotateY(${spin}deg)`,
            }}
          >
            {CAROUSEL_IMAGES.map((img, i) => (
              // 卡片容器只做环上定位（绕 Y 公转 + billboard 朝外），永不绕 X/Z
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: -CARD_W / 2,
                  top: -CARD_H / 2,
                  width: CARD_W,
                  height: CARD_H,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${(i * 360) / CAROUSEL_N}deg) translateZ(${RADIUS}px)`,
                }}
              >
                <div style={faceStyle}>
                  <Img
                    src={staticFile(`textures/${img}`)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ ...faceStyle, transform: 'rotateY(180deg)' }}>
                  <Img
                    src={staticFile(`textures/${img}`)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* 地面反光盘 */}
          <div
            style={{
              position: 'absolute',
              left: -230,
              top: 70,
              width: 460,
              height: 460,
              borderRadius: '50%',
              transform: 'rotateX(90deg)',
              background: 'radial-gradient(circle, rgba(110,180,255,.16) 0%, transparent 62%)',
            }}
          />
        </div>
      </div>
    </DesignStage>
  );
};
