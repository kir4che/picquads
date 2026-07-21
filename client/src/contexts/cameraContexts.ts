import { createContext } from 'react';

import {
  CanvasContextValue,
  CameraStateContextValue,
  CameraActionContextValue,
} from '../types/camera';

export const CanvasContext = createContext<CanvasContextValue | null>(null);
export const StateContext = createContext<CameraStateContextValue | null>(null);
export const ActionContext = createContext<CameraActionContextValue | null>(
  null
);
