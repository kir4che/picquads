import { Link } from 'react-router-dom';

import KoFiIcon from '../assets/icons/kofi.svg?react';

const Footer = () => (
  <footer className='flex flex-col items-center justify-center gap-x-4 border-t border-violet-100 px-4 py-3 text-xs text-violet-300 sm:flex-row'>
    <div className='flex flex-col items-center gap-x-2 gap-y-1.5 sm:flex-row'>
      <p className='text-center'>
        © made by{' '}
        <Link
          to='https://github.com/kir4che'
          target='_blank'
          rel='noopener noreferrer'
          aria-label='kir4che GitHub'
        >
          kir4che
        </Link>
      </p>
      <Link
        to='https://ko-fi.com/kir4che'
        target='_blank'
        rel='noopener noreferrer'
        className='text-violet-400 transition-colors hover:text-violet-500'
        aria-label='Donate via Ko-fi'
      >
        <KoFiIcon className='size-5' />
      </Link>
    </div>
  </footer>
);

export default Footer;
