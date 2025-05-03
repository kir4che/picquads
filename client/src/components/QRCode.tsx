import LinkIcon from '../assets/icons/link.svg?react';

interface QRCodeProps {
  qrCode: string;
  link: string;
}

const QRCode: React.FC<QRCodeProps> = ({ qrCode, link }) => {
  return (
    qrCode &&
    link && (
      <div className='flex flex-col items-center gap-y-2'>
        <img
          src={qrCode}
          alt='QR Code'
          className='xs:w-40 xs:h-40 mx-auto h-full max-h-40 w-full max-w-40'
        />
        <a
          href={link}
          className='flex items-center justify-center gap-x-2 text-center font-medium text-violet-500 hover:text-violet-600'
          target='_blank'
          rel='noopener noreferrer'
        >
          <LinkIcon className='h-4 w-4' />
          Link
        </a>
        <p className='text-center text-sm text-gray-500'>
          Link & QR Code will expire in 1 hour.
        </p>
      </div>
    )
  );
};

export default QRCode;
