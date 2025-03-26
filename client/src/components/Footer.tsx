import { Link } from 'react-router-dom';

import PaypalIcon from '../assets/icons/paypal.svg?react';
import KoFiIcon from '../assets/icons/kofi.svg?react';

const Footer: React.FC = () => {
  return (
    <footer className="flex flex-col items-center justify-center px-4 py-3 text-xs border-t sm:flex-row gap-x-4 text-violet-300 border-violet-100">
      <div className="flex flex-col items-center sm:flex-row gap-y-1.5 gap-x-3">
        <p className="text-center">
          © made by {' '}
          <Link
            to="https://github.com/kir4che"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="kir4che GitHub"
          >
            kir4che
          </Link>
        </p>
        <div className="flex items-center gap-x-2 text-violet-400">
          <Link
            to="https://paypal.me/dcxxiii" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="transition-colors hover:text-violet-500"
            aria-label="Donate via PayPal"
          >
            <PaypalIcon className="w-5 h-5" />
          </Link>
          <Link
            to="https://ko-fi.com/kir4che" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="transition-colors hover:text-violet-500"
            aria-label="Donate via Ko-fi"
          >
            <KoFiIcon className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
