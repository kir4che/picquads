import { Camera } from 'react-camera-pro';

import { useCamera } from '../hooks/useCamera';

import CameraActions from './CameraActions';

import ChangeCameraIcon from '../assets/icons/change-camera.svg?react';

const CAMERA_ERROR_MESSAGES = {
  noCameraAccessible: '無法存取相機',
  permissionDenied: '請允許使用相機權限',
  switchCamera: '無法切換相機',
  canvas: '無法取得照片'
} as const;

const CAMERA_ASPECT_RATIO = 1335/894; 

const CameraPreview: React.FC = () => {
  const { state, cameraRef, switchCamera, openCamera } = useCamera();
  const { status, capturedImage, countdown, isMobileDevice, facingMode } = state;

  return (
    <div className='flex flex-col gap-y-3'>
      <div className={`relative w-full overflow-hidden bg-white rounded-md shadow-lg aspect-[${CAMERA_ASPECT_RATIO}]`}>
        {/* 開啟相機 */}
        {status === 'idle' && !capturedImage && countdown === 0 && (
          <div className='flex items-center justify-center' style={{ aspectRatio: CAMERA_ASPECT_RATIO }}>
            <button
            className="px-6 py-2 text-white rounded-full bg-violet-400 hover:bg-violet-500 focus:ring-2 focus:ring-violet-300"
            onClick={openCamera}
          >
              Open Camera
            </button>
          </div>
        )}
        {/* 相機拍攝預覽 */}
        {status === 'capturing' && !capturedImage && (
          <>
            <div style={{ transform: !isMobileDevice && facingMode === 'environment' ? 'scaleX(-1)' : 'none' }}>
              <Camera
                ref={cameraRef}
                facingMode={facingMode}
                aspectRatio={CAMERA_ASPECT_RATIO}
                errorMessages={CAMERA_ERROR_MESSAGES}
              />
            </div>
            {isMobileDevice && (
              <button 
                className="absolute top-2 right-2 bg-gray-400 text-white p-1.5 rounded-full hover:opacity-80"
                onClick={switchCamera}
              >
                <ChangeCameraIcon className='w-6 h-6'/>
              </button>
            )}
          </>
        )}
        {/* 拍攝照片 */}
        {capturedImage && (
          <img 
            src={capturedImage} 
            className={!isMobileDevice && facingMode === 'environment' ? 'scale-x-[-1]' : ''}
            alt="已拍攝的照片"
          />
        )}
        {/* 倒數計時 */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-80"/>
              <div className="relative">
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {countdown}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <CameraActions />
    </div>
  );
};

export default CameraPreview;
