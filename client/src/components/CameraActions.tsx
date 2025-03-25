import { useState } from 'react';

import { useError } from '../hooks/useError';
import { useCamera } from '../hooks/useCamera';

import CameraIcon from '../assets/icons/camera.svg?react';

const DURATION_OPTIONS = [0, 3, 5, 10] as const;
const INITIAL_DURATION = 3;

const CameraActions: React.FC = () => {
  const { setErrorMessage } = useError();
  const { state, capturePhoto, retakePhoto, completeCapture, continueCapture, startCountdown } = useCamera();
  const { status, frame, capturedImages, countdown } = state;

  const [selectedDuration, setSelectedDuration] = useState(INITIAL_DURATION);

  const handleStartCapture = () => {
    if (selectedDuration === 0) capturePhoto();
    else if (selectedDuration !== null) startCountdown(selectedDuration);
    else setErrorMessage('請選擇倒數計時時間');
  };

  // 拍完照後：重拍、繼續拍照、完成拍照按鈕
  if (status === 'captured') {
    return (
      <div className="z-10 flex items-center justify-center w-full gap-x-4">
        <button 
          className="px-3.5 py-1.5 bg-white border-2 rounded-full text-violet-500 border-violet-500 hover:bg-violet-500 hover:text-white"
          onClick={retakePhoto}
        >
          Retake
        </button>
        <p className='text-violet-600'>{capturedImages.length} / {frame.totalCaptures}</p>
        <button 
          className={`px-4 py-1.5 text-white border-2 rounded-full 
            ${capturedImages.length < frame.totalCaptures 
              ? "border-violet-500 bg-violet-500 hover:bg-violet-600 hover:border-violet-600" 
              : "border-pink-400 bg-pink-400 hover:bg-pink-500 hover:border-pink-500"}
          `}
          onClick={capturedImages.length < frame.totalCaptures ? continueCapture : completeCapture}
        >
          {capturedImages.length < frame.totalCaptures ? "Continue" : "Complete"}
        </button>
      </div>
    )
  }

  // 如果相機未開啟或是正在倒數，先不顯示倒數選項、相機按鈕
  if (status !== 'capturing' || countdown > 0) return null;

  return (
    <div className="z-10 flex flex-wrap items-center justify-between w-full">
      {/* 選擇倒數計時時間 */}
      <div className="flex items-center gap-x-3">
      {/* 若未選擇倒數計時時間，則顯示倒數計時選項。 */}
      {DURATION_OPTIONS.map((duration) => (
        <button 
          key={duration}
          className={`w-6.5 h-6.5 backdrop-filter backdrop-blur-xl rounded-full text-xs ${
            selectedDuration === duration
              ? 'bg-violet-500 shadow-[0_0_2px_1.5px_rgba(159,135,233,1)] text-white' 
              : 'bg-white text-violet-800 shadow-[0_0_2px_1.5px_white]'
          }`}
          onClick={() => setSelectedDuration(duration)}
        >
          {duration}s
        </button>
      ))}
      </div>
      {/* 拍照按鈕 */}
      <button 
        className='flex items-center justify-center ml-auto bg-white border rounded-full border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white w-9 h-9 disabled:bg-gray-400 disabled:text-white disabled:border-gray-400'
        onClick={handleStartCapture}
        disabled={status !== 'capturing'}
      >
        <CameraIcon className='w-6 h-6' />
      </button>
    </div>
  );
};

export default CameraActions;
