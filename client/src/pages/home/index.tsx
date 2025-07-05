import React, { useMemo } from 'react';

import { frameMap } from '../../configs/frame';
import { useCamera } from '../../hooks/useCamera';
import { getFrameList } from '../../utils/frame';

import CameraPreview from '../../components/CameraPreview';
import PhotoEditor from '../../components/PhotoEditor';
import PhotoStrip from '../../components/PhotoStrip';

const Home: React.FC = () => {
  const { state, setFrame, retry, resetCamera } = useCamera();

  const customTextConfig = useMemo(
    () => ({
      text: '',
      font: 'PlayfairDisplay',
      position: { x: 0, y: 0 },
      color: '#FFFFFF',
      size: 48,
    }),
    []
  );

  return (
    <main>
      <h1
        onClick={resetCamera}
        className='mb-8 cursor-pointer bg-gradient-to-r from-violet-600 from-40% via-violet-300 via-50% to-violet-50 to-80% bg-clip-text text-center text-3xl font-bold text-transparent [text-shadow:_0_2px_8px_rgb(255_255_255_/_0.8)]'
        aria-label='Reset camera and start over'
      >
        PicQuads
      </h1>
      {state.status === 'selectingFrame' && (
        <div className='mx-auto grid w-fit grid-cols-2 place-items-center gap-x-4 gap-y-8 p-4'>
          {getFrameList().map((frame) => (
            <button
              key={frame.id}
              onClick={() => setFrame(frame)}
              aria-label={`Select frame ${frame.id}`}
            >
              <img src={frameMap[frame.id]} alt={frame.id} className='h-45' />
            </button>
          ))}
        </div>
      )}
      {(state.status === 'idle' ||
        state.status === 'capturing' ||
        state.status === 'captured') && (
        <div className='mx-auto w-full max-w-2xl px-4'>
          <CameraPreview />
        </div>
      )}
      {state.status === 'completed' && (
        <div className='flex flex-col items-center'>
          <PhotoEditor>
            <PhotoStrip
              frameColor='#000000'
              filter='none'
              dateFormat=''
              timeFormat=''
              customTextConfig={customTextConfig}
            />
          </PhotoEditor>
        </div>
      )}
      {state.status === 'error' && (
        <div className='text-center'>
          <p>Something went wrong. Please try again.</p>
          <button
            onClick={retry}
            className='mt-4 rounded-md bg-violet-500 px-5 py-1.5 font-medium text-white hover:bg-violet-600'
            aria-label='Retry accessing the camera'
          >
            Retry
          </button>
        </div>
      )}
    </main>
  );
};

export default Home;
