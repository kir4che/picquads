import React from 'react';
import CameraPreview from './components/CameraPreview';
import ErrorMessage from './components/ErrorMessage';
import PhotoGrid from './components/PhotoGrid';
import { useCamera } from './hooks/useCamera';

const App: React.FC = () => {
  const {
    state,
    handleStartCamera,
    handleCapture,
    handleRetake,
    handleContinue,
    handleComplete,
    handleReset,
    toggleCamera,
    startCountdown
  } = useCamera();

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-sky-100 via-white to-sky-300">
      <h1 className="text-3xl font-bold text-center text-sky-400">PicQuads</h1>
      <div className="flex flex-col justify-center px-4 py-8 gap-y-6 gap-x-12 lg:flex-row">
        <div className='flex flex-col w-full max-w-2xl gap-4 mx-auto lg:mx-0'>
          {!state.isCompleted && (
            <CameraPreview
              isCapturing={state.isCapturing}
              isFrontCamera={state.isFrontCamera}
              capturedImage={state.capturedImage}
              countdown={state.countdown}
              onCapture={handleCapture}
              onRetake={handleRetake}
              onContinue={handleContinue}
              onComplete={handleComplete}
              totalPhotos={state.capturedImages.length}
              onStartCountdown={startCountdown}
              onToggleCamera={toggleCamera}
              onStartCamera={handleStartCamera}
            />
          )}
        </div>
        <div className='flex flex-col w-full mx-auto lg:w-auto lg:mx-0'>
          <div className='flex flex-col flex-1 px-12 pb-8 bg-white rounded-lg shadow-md'>
            <p className="py-4 text-center">Photo taken: {state.capturedImages.length} / 4</p>
            <PhotoGrid 
              images={state.capturedImages} 
              showDownload={state.isCompleted}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
      <ErrorMessage message={state.cameraError} />
    </div>
  );
};

export default App;