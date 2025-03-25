import { frameMap } from './configs/frame';
import { getFrameList } from './utils/frame';
import { useCamera } from './hooks/useCamera';

import ErrorMessage from './components/ErrorMessage';
import CameraPreview from './components/CameraPreview';
import PhotoEditor from './components/PhotoEditor';
import PhotoStrip from './components/PhotoStrip';
import PhotoActions from './components/PhotoActions';

const App: React.FC = () => {
  const { state, setFrame, retry } = useCamera();

  return (
    <main>
      <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-gradient-to-r bg-clip-text from-violet-600 from-35% via-white via-65% to-violet-400 to-80%">
        PicQuads
      </h1>
      {state.status === 'selectingFrame' && (
        <>
          <p className='text-center text-gray-800'>Choose Frame</p>
          <div className="grid grid-cols-2 gap-4 p-4 mx-auto w-fit place-items-center">
            {getFrameList().map((frame) => (
              <button key={frame.id} onClick={() => setFrame(frame)}>
                <img src={frameMap[frame.id]} alt={frame.id} className="h-45" />
              </button>
            ))}
          </div>
        </>
      )}
      {(state.status === 'idle' || state.status === 'capturing' || state.status === 'captured') && (
        <div className='w-full max-w-2xl px-4 mx-auto'>
          <CameraPreview />
        </div>
      )}
      {state.status === 'completed' && (
        <div className='flex flex-col items-center justify-center gap-y-4'>
          <PhotoEditor>
            <PhotoStrip borderColor='#000000' filter='none' />
          </PhotoEditor>
          <PhotoActions />
        </div>
      )}
      {state.status === 'error' && (
        <div className="text-center">
          <p>Something went wrong. Please try again.</p>
          <button onClick={retry} className="px-5 font-medium py-1.5 mt-4 text-white rounded-md bg-violet-500 hover:bg-violet-600">
            Retry
          </button>
        </div>
      )}
      <ErrorMessage />
    </main>
  );
};

export default App;