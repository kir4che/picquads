import { useState } from 'react';
import { Camera } from 'lucide-react';

import { useAlert } from '../hooks/useAlert';
import { useCamera } from '../hooks/useCamera';

const DURATION_OPTIONS = [0, 3, 5, 10] as const;
const INITIAL_DURATION = 3;

const CameraActions: React.FC = () => {
  const { setAlert } = useAlert();
  const {
    state,
    capturePhoto,
    retakePhoto,
    completeCapture,
    continueCapture,
    startCountdown,
  } = useCamera();
  const { status, frame, capturedImages, countdown } = state;

  const [selectedDuration, setSelectedDuration] = useState(INITIAL_DURATION);

  const handleStartCapture = () => {
    if (selectedDuration === 0) capturePhoto();
    else if (selectedDuration !== null) startCountdown(selectedDuration);
    else setAlert('Please select a countdown time', 'error');
  };

  // 拍完照後：重拍、繼續拍照、完成拍照按鈕
  if (status === 'captured') {
    return (
      <div className='z-10 flex w-full items-center justify-center gap-x-4'>
        <button
          className='rounded-full border-2 border-violet-500 bg-white px-3.5 py-1.5 text-violet-500 hover:bg-violet-500 hover:text-white'
          onClick={retakePhoto}
          aria-label='Retake photo'
        >
          Retake
        </button>
        <p className='text-violet-600'>
          {capturedImages.length} / {frame.totalCaptures}
        </p>
        <button
          className={`rounded-full border-2 px-4 py-1.5 text-white ${
            capturedImages.length < frame.totalCaptures
              ? 'border-violet-500 bg-violet-500 hover:border-violet-600 hover:bg-violet-600'
              : 'border-pink-400 bg-pink-400 hover:border-pink-500 hover:bg-pink-500'
          } `}
          onClick={
            capturedImages.length < frame.totalCaptures
              ? continueCapture
              : completeCapture
          }
          aria-label={
            capturedImages.length < frame.totalCaptures
              ? 'Continue capturing'
              : 'Complete capture'
          }
        >
          {capturedImages.length < frame.totalCaptures
            ? 'Continue'
            : 'Complete'}
        </button>
      </div>
    );
  }

  // 如果相機未開啟或是正在倒數，先不顯示倒數選項、相機按鈕
  if (status !== 'capturing' || countdown > 0) return null;

  return (
    <div className='z-10 flex w-full flex-wrap items-center justify-between'>
      {/* 選擇倒數計時時間 */}
      <div className='flex items-center gap-x-3'>
        {/* 若未選擇倒數計時時間，則顯示倒數計時選項。 */}
        {DURATION_OPTIONS.map((duration) => (
          <button
            key={duration}
            className={`h-6.5 w-6.5 rounded-full text-xs backdrop-blur-xl backdrop-filter ${
              selectedDuration === duration
                ? 'bg-violet-500 text-white shadow-[0_0_2px_1.5px_rgba(159,135,233,1)]'
                : 'bg-white text-violet-800 shadow-[0_0_2px_1.5px_white]'
            }`}
            onClick={() => setSelectedDuration(duration)}
            aria-label={`${duration} seconds countdown`}
          >
            {duration}s
          </button>
        ))}
      </div>
      {/* 拍照按鈕 */}
      <button
        className='ml-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-500 bg-white text-violet-500 hover:bg-violet-500 hover:text-white disabled:border-gray-400 disabled:bg-gray-400 disabled:text-white'
        onClick={handleStartCapture}
        disabled={!state.isCameraReady}
        aria-label='Capture photo'
      >
        <Camera className='h-6 w-6' />
      </button>
    </div>
  );
};

export default CameraActions;
