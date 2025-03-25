import { Frame, FrameConfig, frameConfigs } from '../configs/frame';

export const getFrameConfig = (id: string): FrameConfig | null => {
  return frameConfigs[id] ?? null;
};

export const getFrameDimensions = (id: string) => {
  const config = getFrameConfig(id);
  return config ? config.dimensions : null;
};

export const getFrameList = (): Frame[] =>
  Object.values(frameConfigs).map(({ id, name, totalCaptures }) => ({
    id,
    name,
    totalCaptures,
  }));
