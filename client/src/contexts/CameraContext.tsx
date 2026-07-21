import {
  useRef,
  useReducer,
  useCallback,
  useState,
  useMemo,
  ReactNode,
  useEffect,
} from 'react';

import {
  CameraState,
  CameraAction,
  CameraType,
  CanvasContextValue,
  CameraStateContextValue,
  CameraActionContextValue,
} from '../types/camera';
import { CanvasCtx, StateCtx, ActionCtx } from './cameraContexts';
import { Frame } from '../configs/frame';
import { useAlert } from '../hooks/useAlert';
import {
  isMuted,
  setMuted,
  playCountdownBeep,
  playCountdownFinalBeep,
  playShutterSound,
  playCompleteSound,
} from '../utils/audio';

const PRIMARY_VIDEO_WIDTH = 1335;
const PRIMARY_VIDEO_HEIGHT = 894;
const FALLBACK_VIDEO_WIDTH = 841;
const FALLBACK_VIDEO_HEIGHT = 563;

const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const initialState: CameraState = {
  status: 'selectingFrame',
  isMobileDevice,
  facingMode: isMobileDevice ? 'user' : 'environment',
  frame: {
    id: '',
    totalCaptures: 0,
  },
  countdown: 0,
  isCameraReady: false,
  capturedCount: 0,
  capturedImages: [],
  capturedImage: null,
};

const cameraReducer = (
  state: CameraState,
  action: CameraAction
): CameraState => {
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
      newCapturedImages = [
        ...state.capturedImages,
        {
          url: action.payload.url,
          facingMode: state.facingMode,
          timestamp: action.payload.timestamp,
        },
      ];
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
      return {
        ...state,
        status: 'idle',
        isCameraReady: false,
        countdown: 0,
      };
    case 'START_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'UPDATE_COUNTDOWN':
      return { ...state, countdown: Math.max(0, action.payload) };
    case 'CLEAR_CURRENT_ONLY':
      return { ...state, status: 'idle', capturedImage: null };
    case 'CLEAR_CAPTURED_PHOTO':
      return {
        ...state,
        status: 'idle',
        capturedImage: null,
        capturedImages: state.capturedImages.slice(0, -1),
        capturedCount: Math.max(0, state.capturedCount - 1),
      };
    case 'COMPLETE':
      return { ...state, status: 'completed' };
    case 'RESET':
      return {
        ...initialState,
        isMobileDevice: state.isMobileDevice,
        facingMode: state.facingMode,
      };
    case 'CLEAR_ERROR':
      return { ...state, status: 'idle', isCameraReady: false };
    case 'SET_ERROR':
      return { ...state, status: 'error' };
    default:
      return state;
  }
};

export const CameraProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cameraReducer, initialState);
  const [muted, setMutedState] = useState(isMuted());
  const { setAlert } = useAlert();

  const cameraRef = useRef<CameraType>(null); // 相機
  const videoRef = useRef<HTMLVideoElement | null>(null); // 相機畫面
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // 照片（從 video 擷取的）
  const mediaStreamRef = useRef<MediaStream | null>(null); // 相機串流 MediaStream
  const countdownIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  ); // 倒數計時器
  const lastActionRef = useRef<(() => void) | null>(null); // 上次失敗的操作
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null); // 編輯器畫布
  const stickerCanvasRef = useRef<HTMLCanvasElement | null>(null); // 貼紙合成用隱藏畫布

  useEffect(() => {
    // unmount 時，停止 MediaStream 並清除倒數計時器。
    return () => {
      if (mediaStreamRef.current)
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // 停止當前正在運行的相機 (MediaStream)，並重置 videoRef。
  const stopExistingMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      // 停止所有 tracks（視訊、音訊），並重置 mediaStreamRef。
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const tryGetUserMedia = useCallback(
    async (forcefacingMode?: 'user' | 'environment') => {
      const facingMode = forcefacingMode || state.facingMode;
      const constraints = {
        video: {
          facingMode,
          width: { ideal: PRIMARY_VIDEO_WIDTH },
          height: { ideal: PRIMARY_VIDEO_HEIGHT },
          aspectRatio: { ideal: PRIMARY_VIDEO_WIDTH / PRIMARY_VIDEO_HEIGHT },
        },
      };

      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        const fallbackConstraints = {
          video: {
            facingMode,
            width: { ideal: FALLBACK_VIDEO_WIDTH },
            height: { ideal: FALLBACK_VIDEO_HEIGHT },
            aspectRatio: {
              ideal: FALLBACK_VIDEO_WIDTH / FALLBACK_VIDEO_HEIGHT,
            },
          },
        };
        return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }
    },
    [state.facingMode]
  );

  const initCamera = useCallback(
    async (forcefacingMode?: 'user' | 'environment') => {
      try {
        stopExistingMediaStream();
        const stream = await tryGetUserMedia(forcefacingMode);
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        dispatch({ type: 'OPEN_CAMERA' });

        // 輪詢 cameraRef 是否可用，取代固定 500ms timeout。
        const pollReady = () => {
          if (cameraRef.current && mediaStreamRef.current?.active) {
            dispatch({ type: 'SET_CAMERA_READY', payload: true });
          } else setTimeout(pollReady, 100);
        };
        setTimeout(pollReady, 100);

        setAlert(null);
      } catch (err) {
        const errorMessage =
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError')
            ? 'Camera access blocked. Please allow camera permission in browser site settings, then tap Retry.'
            : err instanceof Error
              ? err.message
              : 'Unable to start camera.';
        dispatch({ type: 'SET_ERROR' });
        setAlert(errorMessage, 'error');
        lastActionRef.current = () => initCamera(forcefacingMode);
      }
    },
    [tryGetUserMedia, stopExistingMediaStream, setAlert]
  );

  // 設定需要拍攝的照片總數
  const setFrame = useCallback((frame: Frame) => {
    dispatch({ type: 'SELECT_FRAME', payload: frame });
  }, []);

  // 切換相機
  const switchCamera = useCallback(() => {
    dispatch({ type: 'STOP_CAMERA' });
    const newMode = state.facingMode === 'user' ? 'environment' : 'user';
    dispatch({ type: 'SET_FACING_MODE', payload: newMode });
    initCamera(newMode);
  }, [state.facingMode, initCamera]);

  // 開啟相機
  const openCamera = useCallback(async () => {
    if (state.status === 'idle') await initCamera();
  }, [state.status, initCamera]);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!cameraRef.current) {
      const errorMessage = 'Camera not initd.';
      dispatch({ type: 'SET_ERROR' });
      setAlert(errorMessage, 'error');
      lastActionRef.current = capturePhoto;
      return;
    }

    try {
      const photoUrl = cameraRef.current.takePhoto();
      if (!photoUrl) throw new Error('Unable to get photo URL.');
      playShutterSound();

      dispatch({
        type: 'CAPTURE_PHOTO',
        payload: {
          url: photoUrl,
          timestamp: Date.now(),
        },
      });
      stopExistingMediaStream();
      setAlert(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to capture photo.';
      dispatch({ type: 'SET_ERROR' });
      setAlert(errorMessage, 'error');
      lastActionRef.current = capturePhoto;
    }
  }, [stopExistingMediaStream, setAlert]);

  // 重試上次失敗的操作
  const retry = useCallback(() => {
    stopExistingMediaStream();
    dispatch({ type: 'CLEAR_ERROR' });

    if (lastActionRef.current) {
      const retryAction = lastActionRef.current;
      lastActionRef.current = null;
      retryAction();
    } else initCamera(); // 若沒有上次操作，則重新初始化相機。
  }, [initCamera, stopExistingMediaStream]);

  // 開始倒數
  const startCountdown = useCallback(
    (duration: number) => {
      let currentCount = duration;
      dispatch({ type: 'START_COUNTDOWN', payload: currentCount });

      // 清除倒數計時器，避免多個計時器重複計時。
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);

      countdownIntervalRef.current = setInterval(() => {
        currentCount -= 1;

        // 只要倒數計時器還在運行，就要更新。
        if (currentCount >= 0) {
          dispatch({ type: 'UPDATE_COUNTDOWN', payload: currentCount });
          if (currentCount > 0) playCountdownBeep();
          else if (currentCount === 0) playCountdownFinalBeep();
        }

        if (currentCount === 0) {
          // 清除倒數計時器，避免計時器繼續運行。
          if (countdownIntervalRef.current)
            clearInterval(countdownIntervalRef.current);

          // 確保相機可用，不可用則重新初始化再拍照。
          if (cameraRef.current && mediaStreamRef.current?.active) {
            setTimeout(() => capturePhoto(), 100);
          } else initCamera().then(() => setTimeout(() => capturePhoto(), 500));
        }
      }, 1000);
    },
    [capturePhoto, initCamera]
  );

  // 重拍當前照片
  const retakePhoto = useCallback(() => {
    dispatch({ type: 'CLEAR_CAPTURED_PHOTO' });
    initCamera();
  }, [initCamera]);

  // 繼續拍攝
  const continueCapture = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_ONLY' });
    initCamera();
  }, [initCamera]);

  // 完成拍攝
  const completeCapture = useCallback(() => {
    stopExistingMediaStream();
    dispatch({ type: 'COMPLETE' });
    playCompleteSound();
  }, [stopExistingMediaStream]);

  // 重置相機
  const resetCamera = useCallback(() => {
    stopExistingMediaStream();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    dispatch({ type: 'RESET' });
    setAlert(null);
  }, [stopExistingMediaStream, setAlert]);

  // 取得合成畫布
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

    if (stickerCanvasRef.current)
      tempCtx.drawImage(stickerCanvasRef.current, 0, 0);

    return tempCanvas;
  }, []);

  // 切換靜音狀態
  const toggleMute = useCallback(() => {
    const newMuted = !muted;
    setMutedState(newMuted);
    setMuted(newMuted);
  }, [muted]);

  const canvasValue = useMemo<CanvasContextValue>(
    () => ({
      cameraRef,
      canvasRef,
      editorCanvasRef,
      stickerCanvasRef,
    }),
    []
  );

  const stateValue = useMemo<CameraStateContextValue>(
    () => ({ state, muted }),
    [state, muted]
  );

  const actionValue = useMemo<CameraActionContextValue>(
    () => ({
      setFrame,
      switchCamera,
      openCamera,
      capturePhoto,
      startCountdown,
      retakePhoto,
      continueCapture,
      completeCapture,
      getCompositedCanvas,
      resetCamera,
      retry,
      toggleMute,
    }),
    [
      setFrame,
      switchCamera,
      openCamera,
      capturePhoto,
      startCountdown,
      retakePhoto,
      continueCapture,
      completeCapture,
      getCompositedCanvas,
      resetCamera,
      retry,
      toggleMute,
    ]
  );

  return (
    <CanvasCtx.Provider value={canvasValue}>
      <StateCtx.Provider value={stateValue}>
        <ActionCtx.Provider value={actionValue}>
          <canvas ref={canvasRef} className='hidden' />
          <canvas ref={stickerCanvasRef} className='hidden' />
          {children}
        </ActionCtx.Provider>
      </StateCtx.Provider>
    </CanvasCtx.Provider>
  );
};
