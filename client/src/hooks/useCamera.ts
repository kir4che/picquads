import { useContext } from 'react';

import CameraContext from '../contexts/CameraContext';

export const useCamera = () => {
  const context = useContext(CameraContext);
  if (!context) throw new Error('useCamera 必須在 CameraProvider 內使用');
  return context;
};
