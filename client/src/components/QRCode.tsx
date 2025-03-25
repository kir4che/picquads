import LinkIcon from '../assets/icons/link.svg?react';

interface QRCodeProps {
  qrCode: string;
  link: string;
}

const QRCode: React.FC<QRCodeProps> = ({ qrCode, link }) => {
  return (qrCode && link && (
        <div className="flex flex-col items-center gap-y-2">
          <img src={qrCode} alt="QR Code" className="w-full h-full mx-auto max-w-40 max-h-40 xs:w-40 xs:h-40" />
          <a 
            href={link} 
            className="flex items-center justify-center font-medium text-center text-violet-500 gap-x-2 hover:text-violet-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkIcon className="w-4 h-4" />
            Link
          </a>
          <p className="text-sm text-center text-gray-500">
            Link & QR Code will expire in 1 hour.
          </p>
        </div>
      ));
};

export default QRCode;
