import { useState, useRef, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { CameraState } from '../types/camera';

interface VideoDevice {
  deviceId: string;
  label: string;
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isCapturing: false,
    isFrontCamera: true,
    capturedImage: null,
    countdown: 0,
    isMobileDevice: false,
    devices: [],
    selectedDevice: null,
    cameraError: null,
    capturedImages: [],
    isCompleted: false
  });

  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([]);
  const camera = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // 獲取可用的相機設備
  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `相機 ${device.deviceId.slice(0, 5)}...`
        }));
      setVideoDevices(videoDevices);
      setState(prev => ({ ...prev, devices: videoDevices as MediaDeviceInfo[] }));
    } catch (err) {
      console.error('無法獲取相機設備列表:', err);
      setState(prev => ({ ...prev, cameraError: '無法獲取相機設備列表' }));
    }
  }, []);

  // 初始化相機流
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: state.selectedDevice?.deviceId,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        mediaStreamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState(prev => ({ ...prev, isCapturing: true, cameraError: null }));
        console.log('相機啟動成功');
      }
    } catch (err) {
      console.error('相機初始化錯誤:', err);
      setState(prev => ({
        ...prev,
        isCapturing: false,
        cameraError: err instanceof Error ? err.message : '無法啟動相機'
      }));
    }
  }, [state.selectedDevice]);

  // 停止相機流
  const stopCamera = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(prev => ({ ...prev, isCapturing: false }));
  }, []);

  // 處理圖片
  const processImage = useCallback((imageData: string) => {
    if (state.isFrontCamera) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);
          const flippedImage = canvas.toDataURL('image/jpeg');
          setState(prev => ({
            ...prev,
            capturedImages: [...prev.capturedImages, flippedImage],
            capturedImage: flippedImage
          }));
        }
      };
      
      img.src = imageData;
    } else {
      setState(prev => ({
        ...prev,
        capturedImages: [...prev.capturedImages, imageData],
        capturedImage: imageData
      }));
    }
  }, [state.isFrontCamera]);

  // 拍照
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.isFrontCamera) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const photoUrl = canvas.toDataURL('image/jpeg', 0.95);
      processImage(photoUrl);
      stopCamera();
    } catch (err) {
      console.error('照片處理錯誤:', err);
      setState(prev => ({
        ...prev,
        cameraError: '照片處理失敗',
        capturedImage: null
      }));
    }
  }, [state.isFrontCamera, stopCamera, processImage]);

  // 各種操作處理函數
  const handleStartCamera = useCallback(() => {
    setState(prev => ({ ...prev, isCapturing: true }));
    initializeCamera();
  }, [initializeCamera]);

  const handleCapture = useCallback((image: string) => {
    if (state.capturedImages.length >= 4) return;
    processImage(image);
  }, [state.capturedImages.length, processImage]);

  const handleRetake = useCallback(() => {
    setState(prev => ({
      ...prev,
      capturedImage: null,
      capturedImages: prev.capturedImages.slice(0, -1),
      isCapturing: true
    }));
    initializeCamera();
  }, [initializeCamera]);

  const handleContinue = useCallback(() => {
    setState(prev => ({ ...prev, capturedImage: null }));
  }, []);

  const handleComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCompleted: true,
      isCapturing: false,
      capturedImage: null
    }));
  }, []);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCompleted: false,
      isCapturing: false,
      capturedImage: null,
      capturedImages: [],
      isFrontCamera: true,
      countdown: 0
    }));
    setTimeout(handleStartCamera, 100);
  }, [handleStartCamera]);

  const toggleCamera = useCallback(() => {
    setState(prev => ({ ...prev, isFrontCamera: !prev.isFrontCamera }));
    if (state.isCapturing) {
      stopCamera();
      setTimeout(initializeCamera, 300);
    }
  }, [state.isCapturing, stopCamera, initializeCamera]);

  const startCountdown = useCallback((duration: number) => {
    setState(prev => ({ ...prev, countdown: duration }));
    const timer = setInterval(() => {
      setState(prev => {
        if (prev.countdown <= 1) {
          clearInterval(timer);
          capturePhoto();
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  }, [capturePhoto]);

  const changeCamera = useCallback((deviceId: string) => {
    const device = state.devices.find(d => d.deviceId === deviceId);
    setState(prev => ({ ...prev, selectedDevice: device || null }));
    if (state.isCapturing) {
      stopCamera();
      setTimeout(initializeCamera, 300);
    }
  }, [state.devices, state.isCapturing, stopCamera, initializeCamera]);

  // 輔助函數
  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([uintArray], { type: 'image/jpeg' });
  };

  const downloadPhoto = useCallback(() => {
    if (!state.capturedImage) return;
    const blob = dataURItoBlob(state.capturedImage);
    saveAs(blob, `photobooth_${new Date().getTime()}.jpg`);
  }, [state.capturedImage]);

  const handleImageError = useCallback((error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('圖片載入失敗:', error);
    setState(prev => ({ ...prev, cameraError: '圖片載入失敗' }));
  }, []);

  // 初始化效果
  useEffect(() => {
    getVideoDevices();
    const userAgent = navigator.userAgent || navigator.vendor;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setState(prev => ({ ...prev, isMobileDevice: mobileRegex.test(userAgent) }));

    return () => {
      stopCamera();
    };
  }, [getVideoDevices, stopCamera]);

  return {
    state,
    videoDevices,
    camera,
    canvasRef,
    handleStartCamera,
    handleCapture,
    handleRetake,
    handleContinue,
    handleComplete,
    handleReset,
    toggleCamera,
    startCountdown,
    changeCamera,
    downloadPhoto,
    handleImageError,
    capturePhoto
  };
};