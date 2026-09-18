import { Composition } from 'remotion';
import { Cover } from './Cover';
import { Main, TOTAL } from './skeleton/Main';

/**
 * 规格：1280×720 @ 30fps，全片 2948 帧（98.27s）。
 * 帧号与时长见 src/skeleton/Main.tsx 的 SHOTS，来源 `步骤3-TTS.md` 实测回填。
 *
 * Cover：发布用封面（静态缩略图，任意单帧导出即可），文案见 src/Cover.tsx。
 */
export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TOTAL} fps={30} width={1280} height={720} />
    <Composition id="Cover" component={Cover} durationInFrames={1} fps={30} width={1280} height={720} />
  </>
);
