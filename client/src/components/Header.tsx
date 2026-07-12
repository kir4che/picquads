import { Link, useLocation } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';

import { useCamera } from '../hooks/useCamera';

const Header = () => {
  const location = useLocation();
  const { muted, toggleMute } = useCamera();

  return (
    <header className='grid grid-cols-3 items-center px-4 py-2 text-xs text-nowrap text-violet-400'>
      <div className='justify-self-start'>
        <p>Version {import.meta.env.VITE_VERSION}</p>
      </div>
      <div className='flex justify-center'>
        {location.pathname !== '/' && <Link to='/'>PicQuads</Link>}
      </div>
      <div className='flex items-center gap-x-3 justify-self-end'>
        <button
          onClick={toggleMute}
          className='p-1 transition-colors hover:text-violet-600'
          aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <Link to='/contact' aria-label='Contact'>
          Contact
        </Link>
        <Link to='/privacy-policy' aria-label='Privacy Policy'>
          Privacy Policy
        </Link>
      </div>
    </header>
  );
};

export default Header;
