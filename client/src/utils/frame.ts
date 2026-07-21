import { Frame, FrameConfig, frameConfigs } from '../configs/frame';

export const getFrameConfig = (id: string): FrameConfig | null => {
  return frameConfigs[id] ?? null;
};

export const getFrameDimensions = (id: string) => {
  const config = getFrameConfig(id);
  return config ? config.dimensions : null;
};

export const getDisplaySize = (
  canvas: { width: number; height: number },
  containerWidth: number
): { width: number; height: number } => {
  const rawW = canvas.width * 0.25;
  const rawH = canvas.height * 0.25;
  const scale = rawW > containerWidth ? containerWidth / rawW : 1;
  return { width: rawW * scale, height: rawH * scale };
};

export const getFrameList = (): Frame[] =>
  Object.values(frameConfigs).map(({ id, totalCaptures }) => ({
    id,
    totalCaptures,
  }));
