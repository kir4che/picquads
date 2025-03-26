import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="grid items-center grid-cols-3 px-4 py-2 text-xs text-violet-400">
      <div className="justify-self-start">
        <p>Version 1.0.0</p>
      </div>
      <div className="flex justify-center">
        {location.pathname !== '/' && <Link to="/">Picquads</Link>}
      </div>
      <div className="flex items-center gap-x-3 justify-self-end">
        <Link to="/contact" aria-label="Contact">
          Contact
        </Link>
        <Link to="/privacy-policy" aria-label="Privacy Policy">
          Privacy Policy
        </Link>
      </div>
    </header>
  );
};

export default Header;
