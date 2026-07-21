import { useContext } from 'react';

import { CanvasCtx, StateCtx, ActionCtx } from '../contexts/cameraContexts';
import type {
  CanvasContextValue,
  CameraStateContextValue,
  CameraActionContextValue,
} from '../types/camera';

export const useCanvasRefs = (): CanvasContextValue => {
  const context = useContext(CanvasCtx);
  if (!context)
    throw new Error('useCanvasRefs must be used within CameraProvider');
  return context;
};

export const useCameraState = (): CameraStateContextValue => {
  const context = useContext(StateCtx);
  if (!context)
    throw new Error('useCameraState must be used within CameraProvider');
  return context;
};

export const useCameraActions = (): CameraActionContextValue => {
  const context = useContext(ActionCtx);
  if (!context)
    throw new Error('useCameraActions must be used within CameraProvider');
  return context;
};

export const useCamera = (): CanvasContextValue &
  CameraStateContextValue &
  CameraActionContextValue => {
  return {
    ...useCanvasRefs(),
    ...useCameraState(),
    ...useCameraActions(),
  };
};
