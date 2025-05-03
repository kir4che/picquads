import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className='grid grid-cols-3 items-center px-4 py-2 text-xs text-violet-400'>
      <div className='justify-self-start'>
        <p>Version {import.meta.env.VITE_VERSION}</p>
      </div>
      <div className='flex justify-center'>
        {location.pathname !== '/' && <Link to='/'>PicQuads</Link>}
      </div>
      <div className='flex items-center gap-x-3 justify-self-end'>
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
