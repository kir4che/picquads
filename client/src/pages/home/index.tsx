import { frameMap } from '../../configs/frame';
import { useCamera } from '../../hooks/useCamera';
import { getFrameList } from '../../utils/frame';

import CameraPreview from '../../components/CameraPreview';
import PhotoEditor from '../../components/PhotoEditor';
import PhotoStrip from '../../components/PhotoStrip';

const Home: React.FC = () => {
  const { state, setFrame, retry, resetCamera } = useCamera();

  return (
    <main>
      <h1
        onClick={resetCamera}
        className="text-3xl font-bold mb-8 [text-shadow:_0_2px_8px_rgb(255_255_255_/_0.8)] text-center text-transparent bg-gradient-to-r bg-clip-text from-violet-600 from-40% via-violet-300 via-50% to-violet-50 to-80% cursor-pointer"
        aria-label="Reset camera and start over"
      >
        PicQuads
      </h1>
      {state.status === 'selectingFrame' && (
        <div className="grid grid-cols-2 p-4 mx-auto gap-x-4 gap-y-8 w-fit place-items-center">
          {getFrameList().map((frame) => (
            <button key={frame.id} onClick={() => setFrame(frame)} aria-label={`Select frame ${frame.id}`}>
              <img src={frameMap[frame.id]} alt={frame.id} className="h-45" />
            </button>
          ))}
        </div>
      )}
      {(state.status === 'idle' || state.status === 'capturing' || state.status === 'captured') && (
        <div className='w-full max-w-2xl px-4 mx-auto'>
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
              customTextConfig={{
                text: '',
                font: 'PlayfairDisplay',
                position: { x: 0, y: 0 },
                color: '#FFFFFF',
                size: 48
              }}
            />
          </PhotoEditor>
        </div>
      )}
      {state.status === 'error' && (
        <div className="text-center">
          <p>Something went wrong. Please try again.</p>
          <button
            onClick={retry}
            className="px-5 font-medium py-1.5 mt-4 text-white rounded-md bg-violet-500 hover:bg-violet-600"
            aria-label="Retry accessing the camera"
          >
            Retry
          </button>
        </div>
      )}
    </main>
  );
};

export default Home;
