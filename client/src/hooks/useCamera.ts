import { useContext } from 'react';

import {
  CanvasContext,
  StateContext,
  ActionContext,
} from '../contexts/cameraContexts';
import type {
  CanvasContextValue,
  CameraStateContextValue,
  CameraActionContextValue,
} from '../types/camera';

export const useCanvasRefs = (): CanvasContextValue => {
  const context = useContext(CanvasContext);
  if (!context)
    throw new Error('useCanvasRefs must be used within CameraProvider');
  return context;
};

export const useCameraState = (): CameraStateContextValue => {
  const context = useContext(StateContext);
  if (!context)
    throw new Error('useCameraState must be used within CameraProvider');
  return context;
};

export const useCameraActions = (): CameraActionContextValue => {
  const context = useContext(ActionContext);
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
