import { Camera } from 'react-camera-pro';

import { useCamera } from '../hooks/useCamera';
import { getFrameDimensions } from '../utils/frame';

import CameraActions from './CameraActions';

import ChangeCameraIcon from '../assets/icons/change-camera.svg?react';

const CAMERA_ERROR_MESSAGES = {
  canvas: 'Unable to capture photo.',
  permissionDenied: 'Please allow camera permission.',
  noCameraAccessible: 'Unable to access camera.',
  switchCamera: 'Unable to switch camera.',
} as const;

const CAMERA_ASPECT_RATIO = 1335 / 894;

const CameraPreview: React.FC = () => {
  const { state, cameraRef, switchCamera, openCamera } = useCamera();
  const {
    status,
    capturedImage,
    countdown,
    isMobileDevice,
    facingMode,
    frame,
  } = state;

  const dimensions = getFrameDimensions(frame.id);

  return (
    <div className='flex flex-col gap-y-3'>
      <div
        className={`relative w-full overflow-hidden rounded-md bg-white shadow-lg aspect-[${CAMERA_ASPECT_RATIO}]`}
      >
        {/* 開啟相機 */}
        {status === 'idle' && !capturedImage && countdown === 0 && (
          <div
            className='flex items-center justify-center'
            style={{ aspectRatio: CAMERA_ASPECT_RATIO }}
          >
            <button
              className='rounded-full bg-violet-400 px-6 py-2 text-white hover:bg-violet-500 focus:ring-2 focus:ring-violet-500'
              onClick={openCamera}
              aria-label='Open camera'
            >
              Open Camera
            </button>
          </div>
        )}
        {/* 相機拍攝預覽 */}
        {status === 'capturing' && !capturedImage && (
          <>
            <div className='relative' aria-label='Camera preview'>
              <Camera
                ref={cameraRef}
                facingMode={facingMode}
                aspectRatio={CAMERA_ASPECT_RATIO}
                errorMessages={CAMERA_ERROR_MESSAGES}
              />
              {dimensions?.photo && (
                <div className='absolute inset-0'>
                  <div
                    className='absolute top-1/2 left-1/2 h-full -translate-x-1/2 -translate-y-1/2 transform border-2 border-white'
                    style={{
                      aspectRatio: `${dimensions.photo.width}/${dimensions.photo.height}`,
                    }}
                  >
                    <div className='absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-white' />
                    <div className='absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-white' />
                    <div className='absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-white' />
                    <div className='absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 border-white' />
                  </div>
                </div>
              )}
            </div>
            <button
              className='absolute top-2 right-2 rounded-full bg-gray-800 p-1.5 text-white opacity-80 hover:opacity-65'
              onClick={switchCamera}
              aria-label='Switch camera'
            >
              <ChangeCameraIcon className='h-6 w-6' />
            </button>
          </>
        )}
        {/* 拍攝照片 */}
        {capturedImage && (
          <img
            src={capturedImage}
            className={
              (!isMobileDevice && facingMode === 'user') ||
              (isMobileDevice && facingMode === 'user')
                ? 'scale-x-[-1]'
                : ''
            }
            alt='Captured photo'
          />
        )}
        {/* 倒數計時 */}
        {countdown > 0 && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
            <div className='relative'>
              <div className='absolute inset-0 animate-ping rounded-full bg-white opacity-80' />
              <div className='relative'>
                <span className='text-6xl font-bold text-white drop-shadow-lg'>
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
