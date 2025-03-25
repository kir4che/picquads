import { CameraProps } from 'react-camera-pro';

import { Frame } from '../configs/frame';

export type CameraStatus = 
  | 'selectingFrame' 
  | 'idle' 
  | 'capturing' 
  | 'captured' 
  | 'completed' 
  | 'error';

export interface CapturedImage {
  url: string;
  facingMode: 'user' | 'environment';
  timestamp: number;
}

export interface CameraState {
  status: CameraStatus;
  isMobileDevice: boolean; // 是否為手機設備
  facingMode: 'user' | 'environment'; // 相機模式（user: 前置、environment: 後置鏡頭）
  frame: Frame; // 選擇的相框
  countdown: number; // 倒數計時
  capturedCount: number; // 已拍攝的照片數量
  capturedImage: string | null; // 當前拍攝的照片
  capturedImages: CapturedImage[]; // 已拍攝的所有照片
}

export type CameraAction =
  | { type: 'SET_MOBILE_DEVICE'; payload: boolean }
  | { type: 'SET_FACING_MODE'; payload: 'user' | 'environment' }
  | { type: 'SELECT_FRAME'; payload: Frame }
  | { type: 'OPEN_CAMERA' }
  | { type: 'CAPTURE_PHOTO'; payload: { url: string; timestamp: number } }
  | { type: 'STOP_CAMERA' }
  | { type: 'START_COUNTDOWN'; payload: number }
  | { type: 'UPDATE_COUNTDOWN' }
  | { type: 'CLEAR_CURRENT_ONLY' }
  | { type: 'CLEAR_CAPTURED_PHOTO' }
  | { type: 'COMPLETE' }
  | { type: 'RESET' }
  | { type: 'SET_ERROR' };

export interface CameraType extends CameraProps {
  takePhoto: () => string;
  start: () => void;
}

export interface CameraContextType {
  state: CameraState;
  cameraRef: React.RefObject<CameraType | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setFrame: (frame: Frame) => void;
  switchCamera: () => void;
  openCamera: () => void;
  capturePhoto: () => void;
  startCountdown: (duration: number) => void;
  retakePhoto: () => void;
  continueCapture: () => void;
  completeCapture: () => void;
  resetCamera: () => void;
  retry: () => void;
}
