import React, { useRef, useEffect, useState } from 'react';
import { Camera } from 'react-camera-pro';
import ChangeCameraIcon from '../assets/change-camera.svg?react';

interface CameraPreviewProps {
  isCapturing: boolean;
  isFrontCamera: boolean;
  capturedImage: string | null;
  countdown: number;
  onCapture: (image: string) => void;
  onImageError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onRetake: () => void;
  onContinue: () => void;
  totalPhotos: number;
  onStartCountdown: (duration: number) => void;
  onToggleCamera: () => void;
  onStartCamera: () => void;
  onComplete: () => void;
}

interface CameraType {
  takePhoto: () => string;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  isCapturing,
  isFrontCamera,
  capturedImage,
  countdown,
  onCapture,
  onImageError,
  onRetake,
  onContinue,
  totalPhotos,
  onStartCountdown,
  onToggleCamera,
  onStartCamera,
  onComplete
}) => {
  const camera = useRef<CameraType>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(3);
  const [hasSelectedDuration, setHasSelectedDuration] = useState<boolean>(false);

  useEffect(() => {
    if (countdown === 0 && isCapturing && !capturedImage) {
      handleTakePhoto();
    }
  }, [countdown, isCapturing, capturedImage]);

  const handleTakePhoto = () => {
    if (camera.current) {
      try {
        const photo = camera.current.takePhoto();
        onCapture(photo);
      } catch (err) {
        console.error('Photo capture error:', err);
      }
    }
  };

  const handleContinue = () => {
    onContinue();
  };

  const handleRetake = () => {
    onRetake();
  };

  const handleSelectDuration = (duration: number) => {
    setSelectedDuration(duration);
  };

  const handleStartCapture = () => {
    setHasSelectedDuration(true);
    if (selectedDuration === 0) handleTakePhoto();
    else onStartCountdown(selectedDuration);
  };

  return (
    <div className="relative w-full aspect-video bg-white rounded-lg overflow-hidden shadow-lg">
      {isCapturing && !capturedImage && (
        <>
          <Camera
            ref={camera}
            facingMode={isFrontCamera ? 'user' : 'environment'}
            aspectRatio={16/9}
            errorMessages={{
              noCameraAccessible: '無法存取相機',
              permissionDenied: '請允許使用相機權限',
              switchCamera: '無法切換相機',
              canvas: '無法取得照片'
            }}
          />
          <button 
            className="absolute top-2 right-2 bg-sky-500 hover:bg-sky-600 text-white p-1.5 rounded-full cursor-pointer"
            onClick={onToggleCamera}
          >
            <ChangeCameraIcon fill='white' className='w-6 h-6'/>
          </button>
        </>
      )}
      
      {!isCapturing && !capturedImage && countdown === 0 && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white gap-4">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={onStartCamera}
          >
            Open Camera
          </button>
        </div>
      )}

      {capturedImage && (
        <div className="relative w-full h-full">
          <img 
            src={capturedImage} 
            alt="Captured Photo" 
            className="absolute inset-0 w-full h-full object-contain bg-black"
            style={{ 
              imageRendering: 'crisp-edges'
            }} 
            onError={onImageError}
            onLoad={() => {
              console.log('Image loaded successfully!');
            }}
          />
          <div className="absolute bottom-4 right-4 space-x-2 flex">
            <button 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              onClick={handleRetake}
            >
              Retake
            </button>
            {totalPhotos < 4 ? (
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleContinue}
              >
                Continue ({totalPhotos}/4)
              </button>
            ) : (
              <button 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                onClick={onComplete}
              >
                Complete
              </button>
            )}
          </div>
        </div>
      )}
      
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping bg-white rounded-full opacity-80"></div>
            <div className="relative">
              <span className="text-6xl text-white font-bold animate-bounce">{countdown}</span>
            </div>
          </div>
        </div>
      )}

      {isCapturing && !capturedImage && countdown === 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4">
          {!hasSelectedDuration && (
            <div className="flex gap-2">
              <button 
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedDuration === 0 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-800'
                }`}
                onClick={() => handleSelectDuration(0)}
              >
                0s
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedDuration === 3
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-800'
                }`}
                onClick={() => handleSelectDuration(3)}
              >
                3s
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedDuration === 5
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-800'
                }`}
                onClick={() => handleSelectDuration(5)}
              >
                5s
              </button>
              <button 
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedDuration === 10
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-white/80 hover:bg-white text-gray-800'
                }`}
                onClick={() => handleSelectDuration(10)}
              >
                10s
              </button>
            </div>
          )}
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg"
            onClick={hasSelectedDuration ? 
              () => selectedDuration === 0 ? handleTakePhoto() : onStartCountdown(selectedDuration) : 
              handleStartCapture}
          >
            Capture{hasSelectedDuration ? ` (${selectedDuration}s)` : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraPreview; 