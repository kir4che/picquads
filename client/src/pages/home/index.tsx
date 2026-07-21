import { useMemo, useState } from 'react';

import { frameMap } from '../../configs/frame';
import { useCamera } from '../../hooks/useCamera';
import { getFrameList } from '../../utils/frame';

import CameraPreview from '../../components/CameraPreview';
import PhotoEditor from '../../components/PhotoEditor';

type FrameCategory = 'vertical' | 'horizontal' | 'square';

const CATEGORY_LABELS: Record<FrameCategory, string> = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
  square: 'Square',
};

const Home = () => {
  const { state, setFrame, retry, resetCamera } = useCamera();
  const [activeCategory, setActiveCategory] =
    useState<FrameCategory>('vertical');

  const filteredFrames = useMemo(
    () => getFrameList().filter((f) => f.id.startsWith(activeCategory)),
    [activeCategory]
  );

  return (
    <main>
      <h1
        onClick={resetCamera}
        className='mb-8 cursor-pointer bg-linear-to-r from-violet-600 from-40% via-violet-300 via-50% to-violet-50 to-80% bg-clip-text text-center text-3xl font-bold text-transparent [text-shadow:0_2px_8px_rgb(255_255_255/0.8)]'
        aria-label='Reset camera and start over'
      >
        PicQuads
      </h1>
      {state.status === 'selectingFrame' && (
        <div className='mx-auto w-fit p-4'>
          <div className='mb-6 flex justify-center gap-x-2'>
            {(Object.keys(CATEGORY_LABELS) as FrameCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                  activeCategory === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                aria-current={activeCategory === cat ? 'page' : undefined}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className='grid w-fit grid-cols-2 place-items-center gap-x-4 gap-y-8 sm:grid-cols-3'>
            {filteredFrames.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setFrame(frame)}
                className='flex flex-col items-center gap-y-2'
                aria-label={`Select frame ${frame.id}`}
              >
                <img
                  src={frameMap[frame.id]}
                  alt={frame.id}
                  className='h-45 w-auto max-w-52'
                />
              </button>
            ))}
          </div>
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
          <PhotoEditor />
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
