export interface CameraState {
  isCapturing: boolean;
  isFrontCamera: boolean;
  capturedImage: string | null;
  countdown: number;
  isMobileDevice: boolean;
  devices: MediaDevice[];
  selectedDevice: MediaDevice | null;
  cameraError: string | null;
  capturedImages: string[];
  isCompleted: boolean;
}

export interface MediaDevice {
  deviceId: string;
  kind: string;
  label: string;
  groupId: string;
}

export interface CameraHandlers {
  onStartCamera: () => void;
  onStopCamera: () => void;
  onStartCountdown: () => void;
  onToggleCamera: () => void;
  onChangeCamera: (deviceId: string) => void;
  onRetakePhoto: () => void;
  onDownloadPhoto: () => void;
}