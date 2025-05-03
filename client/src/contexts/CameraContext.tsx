import { createContext, useRef, useReducer, useCallback, ReactNode, useMemo, useEffect } from 'react';

import { CameraState, CameraAction, CameraType, CameraContextType } from '../types/camera';
import { Frame } from '../configs/frame';
import { useAlert } from '../hooks/useAlert';

const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const initialState: CameraState = {
  status: 'selectingFrame',
  isMobileDevice,
  facingMode: isMobileDevice ? 'user' : 'environment',
  frame: {
    id: '',
    name: '',
    totalCaptures: 0
  },
  countdown: 0,
  isCameraReady: false,
  capturedCount: 0,
  capturedImages: [],
  capturedImage: null,
};

const cameraReducer = (state: CameraState, action: CameraAction): CameraState => {
  let newCapturedImages;
  let newCapturedCount;
  
  switch (action.type) {
    case 'SET_MOBILE_DEVICE':
      return { ...state, isMobileDevice: action.payload };
    case 'SET_FACING_MODE':
      return { ...state, facingMode: action.payload };
    case 'SELECT_FRAME':
      return { ...state, status: 'idle', frame: action.payload };
    case 'OPEN_CAMERA':
      return { ...state, status: 'capturing', isCameraReady: false };
    case 'SET_CAMERA_READY':
      return { ...state, isCameraReady: action.payload };
    case 'CAPTURE_PHOTO':
      newCapturedImages = [...state.capturedImages, {
        url: action.payload.url,
        facingMode: state.facingMode,
        timestamp: action.payload.timestamp
      }];
      newCapturedCount = state.capturedCount + 1;
      return {
        ...state,
        status: 'captured',
        isCameraReady: false,
        capturedImages: newCapturedImages,
        capturedImage: action.payload.url,
        capturedCount: newCapturedCount,
      };
    case 'STOP_CAMERA':
      return { ...state, status: 'idle', isCameraReady: false };
    case 'START_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'UPDATE_COUNTDOWN':
      return { ...state, countdown: Math.max(0, state.countdown - 1)};
    case 'CLEAR_CURRENT_ONLY':
      return { ...state, status: 'idle', capturedImage: null };
    case 'CLEAR_CAPTURED_PHOTO':
      return { 
        ...state, 
        status: 'idle',
        capturedImage: null,
        capturedImages: state.capturedImages.slice(0, -1),
        capturedCount: Math.max(0, state.capturedCount - 1)
      };
    case 'COMPLETE':
      return { ...state, status: 'completed' };
    case 'RESET':
      return initialState;
    case 'SET_ERROR':
      return { ...state, status: 'error' };
    default:
      return state;
  }
};

const CameraContext = createContext<CameraContextType | null>(null);

export const CameraProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cameraReducer, initialState);
  const { setAlert } = useAlert();

  const cameraRef = useRef<CameraType>(null); // 相機
  const videoRef = useRef<HTMLVideoElement | null>(null); // 相機畫面
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 照片（從 video 擷取的）
  const mediaStreamRef = useRef<MediaStream | null>(null); // 相機串流 MediaStream
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); // 倒數計時器
  const lastActionRef = useRef<(() => void) | null>(null); // 上次失敗的操作
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null); // 編輯器畫布

  useEffect(() => {
    // unmount 時，停止 MediaStream 並清除倒數計時器。
    return () => {
      if (mediaStreamRef.current)
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 停止當前正在運行的相機 (MediaStream)，並重置 videoRef。
  const stopExistingMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      // 停止所有 tracks（視訊、音訊），並重置 mediaStreamRef。
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // 相機設定
  const videoConstraints = useMemo(() => ({
    facingMode: state.facingMode, // 相機方向（前置或後置鏡頭）
    width: { ideal: 1335 }, // 寬度
    height: { ideal: 894 }, // 高度
    aspectRatio: { exact: 1335/894 } // 比例
  }), [state.facingMode]);

  // 請求相機權限並取得 MediaStream
  const tryGetUserMedia = useCallback(async (forcefacingMode?: 'user' | 'environment') => {
    const constraints = {
      video: {
        ...videoConstraints,
        facingMode: forcefacingMode || state.facingMode
      }
    };
    
    try {
      // 請求 user 授權，並回傳 MediaStream。
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      // 若請求失敗，則改用較低的解析度。
      const fallbackConstraints = {
        video: {
          facingMode: forcefacingMode || state.facingMode,
          width: { ideal: 841 },
          height: { ideal: 563 },
          aspectRatio: { exact: 1682/1126 }
        }
      };
      return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    }
  }, [state.facingMode, videoConstraints]);

  // 初始化相機
  const initializeCamera = useCallback(async (forcefacingMode?: 'user' | 'environment') => {
    try {
      const stream = await tryGetUserMedia(forcefacingMode);
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      dispatch({ type: 'OPEN_CAMERA' });
      
      // 等待相機初始化完成
      setTimeout(() => {
        if (cameraRef.current && mediaStreamRef.current?.active)
          dispatch({ type: 'SET_CAMERA_READY', payload: true });
      }, 500);
      
      setAlert(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to start camera.';
      dispatch({ type: 'SET_ERROR' });
      setAlert(errorMessage, 'error');
      lastActionRef.current = () => initializeCamera(forcefacingMode);
    }
  }, [tryGetUserMedia, setAlert]);

  // 設定需要拍攝的照片總數
  const setFrame = useCallback((frame: Frame) => {
    dispatch({ type: 'SELECT_FRAME', payload: frame });
  }, []);

  // 切換相機
  const switchCamera = useCallback(() => {
    dispatch({ type: 'STOP_CAMERA' });
    const newMode = state.facingMode === 'user' ? 'environment' : 'user';
    dispatch({ type: 'SET_FACING_MODE', payload: newMode });
    initializeCamera(newMode);
  }, [state.facingMode, initializeCamera]);

  // 開啟相機
  const openCamera = useCallback(async () => {
    if (state.status === 'idle') await initializeCamera();
  }, [state.status, initializeCamera]);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!cameraRef.current) {
      const errorMessage = 'Camera not initialized.';
      dispatch({ type: 'SET_ERROR' });
      setAlert(errorMessage, 'error');
      lastActionRef.current = capturePhoto;
      return;
    }

    try {
      const photoUrl = cameraRef.current.takePhoto();
      if (!photoUrl) throw new Error('Unable to get photo URL.'); 

      dispatch({ 
        type: 'CAPTURE_PHOTO', 
        payload: { 
          url: photoUrl,
          timestamp: Date.now()
        }
      });
      stopExistingMediaStream();
      setAlert(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo.';
      dispatch({ type: 'SET_ERROR' });
      setAlert(errorMessage, 'error');
      lastActionRef.current = capturePhoto;
    }
  }, [stopExistingMediaStream, setAlert]);

  // 重試上次失敗的操作
  const retry = useCallback(() => {
    if (lastActionRef.current) {
      lastActionRef.current();
      lastActionRef.current = null;
    } else initializeCamera(); // 若沒有上次操作的紀錄，則重新初始化相機。
  }, [initializeCamera]);

  // 開始倒數
  const startCountdown = useCallback((duration: number) => {
    let currentCount = duration; // Ex. 0 | 3 | 5 | 10
    dispatch({ type: 'START_COUNTDOWN', payload: currentCount });

    // 清除倒數計時器，避免多個計時器重複計時。
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      currentCount -= 1;

      // 只要倒數計時器還在運行，就要更新。
      if (currentCount >= 0) dispatch({ type: 'UPDATE_COUNTDOWN' });

      if (currentCount === 0) {
        // 清除倒數計時器，避免計時器繼續運行。
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);

        // 確保相機可用，不可用則重新初始化再拍照。
        if (cameraRef.current && mediaStreamRef.current?.active) {
          setTimeout(() => capturePhoto(), 100);
        } else initializeCamera().then(() => setTimeout(() => capturePhoto(), 500));
      }
    }, 1000);
  }, [capturePhoto, initializeCamera]);

  // 重拍當前照片
  const retakePhoto = useCallback(() => {
    dispatch({ type: 'CLEAR_CAPTURED_PHOTO' });
    initializeCamera();
  }, [initializeCamera]);

  // 繼續拍攝
  const continueCapture = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_ONLY' });
    initializeCamera();
  }, [initializeCamera]);

  // 完成拍攝
  const completeCapture = useCallback(() => {
    stopExistingMediaStream();
    dispatch({ type: 'COMPLETE' });
  }, [stopExistingMediaStream]);

  // 重置拍攝
  const resetCamera = useCallback(() => {
    dispatch({ type: 'RESET' });
    setTimeout(() => openCamera(), 100);
  }, [openCamera]);

  // 合成畫布
  const getCompositedCanvas = useCallback(() => {
    if (!canvasRef.current || !editorCanvasRef.current) return null;
    
    const tempCanvas = document.createElement('canvas');
    const mainCanvas = canvasRef.current;
    tempCanvas.width = mainCanvas.width;
    tempCanvas.height = mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return null;

    tempCtx.drawImage(mainCanvas, 0, 0);
    tempCtx.drawImage(editorCanvasRef.current, 0, 0);
    
    return tempCanvas;
  }, []);

  return (
    <CameraContext.Provider value={{ 
      state,
      cameraRef,
      canvasRef,
      editorCanvasRef,
      capturePhoto,
      setFrame,
      switchCamera,
      openCamera,
      startCountdown,
      retakePhoto,
      continueCapture,
      completeCapture,
      getCompositedCanvas,
      resetCamera,
      retry,
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {children}
    </CameraContext.Provider>
  );
};

export default CameraContext;
