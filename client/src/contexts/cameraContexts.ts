import { createContext } from 'react';

import {
  CanvasContextValue,
  CameraStateContextValue,
  CameraActionContextValue,
} from '../types/camera';

export const CanvasCtx = createContext<CanvasContextValue | null>(null);
export const StateCtx = createContext<CameraStateContextValue | null>(null);
export const ActionCtx = createContext<CameraActionContextValue | null>(null);
