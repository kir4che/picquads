import { Link, X } from 'lucide-react';

interface QRCodeProps {
  qrCode: string;
  link: string;
  isOpen: boolean;
  onClose: () => void;
}

const QRCode = ({ qrCode, link, isOpen, onClose }: QRCodeProps) => {
  if (!isOpen || !qrCode || !link) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative flex w-full max-w-sm flex-col items-center gap-y-4 rounded-2xl bg-white p-6 shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className='absolute top-4 right-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
          onClick={onClose}
          aria-label='Close'
        >
          <X size={20} />
        </button>

        <h3 className='text-lg font-semibold tracking-wide text-gray-800'>
          Scan QR Code
        </h3>

        <div className='rounded-xl border border-gray-100 p-2'>
          <img
            src={qrCode}
            alt='QR Code'
            className='xs:h-48 xs:w-48 h-full max-h-48 w-full max-w-48'
          />
        </div>

        <div className='mt-2 flex w-full flex-col items-center gap-y-1'>
          <a
            href={link}
            className='flex w-full items-center justify-center gap-x-2 rounded-lg bg-violet-50 px-4 py-2 text-center font-medium text-violet-500 transition-colors hover:text-violet-600'
            target='_blank'
            rel='noopener noreferrer'
          >
            <Link size={16} />
            Copy Link
          </a>
          <p className='mt-2 text-center text-xs text-gray-400'>
            Link & QR Code will expire in 1 hour.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCode;
