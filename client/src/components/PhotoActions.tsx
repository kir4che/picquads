import { saveAs } from 'file-saver';

import { useCamera } from '../hooks/useCamera';

// import QRCode from './QRCode';

const PhotoActions: React.FC = () => {
  const { canvasRef, resetCamera } = useCamera();

  // const [link, setLink] = useState<string>('');
  // const [qrCode, setQrCode] = useState<string>('');

  // const handleGenerateUrlAndQRCode = async () => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   try {
  //     const blob = await new Promise<Blob>((resolve, reject) => {
  //       canvas.toBlob((blob) => {
  //         if (blob) resolve(blob);
  //         else reject(new Error('Failed to create blob'));
  //       }, 'image/jpeg', 1.0);
  //     });

  //     const formData = new FormData();
  //     formData.append('file', blob, 'photo.jpeg');

  //     const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload`, {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const data = await response.json();

  //     const { url, qrCode } = data;
  //     setLink(url);
  //     setQrCode(qrCode);
  //   } catch (err) {
  //     console.error('Error during upload:', err);
  //   }
  // };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // 將 canvas 轉換為 blob 物件，並指定圖片格式為 'image/jpeg'，質量為 1.0（無損）。
      canvas.toBlob((blob) => {
        if (!blob) return;
        // 使用 file-saver 下載
        saveAs(blob, 'picquads_photobooth.jpg');
      }, 'image/jpeg', 1.0);
    }
  };

  return (
    <div className="flex flex-col justify-center gap-y-4">
      {/* <QRCode qrCode={qrCode} link={link} /> */}
      <div className="flex flex-col w-full gap-4">
        <button 
          className="py-2 font-medium text-white border-2 rounded-full w-60 bg-violet-500 border-violet-500 hover:bg-violet-600 hover:border-violet-600" 
          onClick={handleDownload}
        >
          Download
        </button>
        {/* <button
          className="py-2 font-medium bg-white border-2 rounded-full w-60 text-violet-600 border-violet-600 hover:bg-violet-600 hover:text-white"
          onClick={handleGenerateUrlAndQRCode}
        >
          Download via QR Code
        </button> */}
        <button 
          className="py-2 font-medium text-white bg-pink-400 border-2 border-pink-400 rounded-full w-60 hover:bg-pink-500 hover:border-pink-500" 
          onClick={resetCamera}
        >
          New Take
        </button>
      </div>
    </div>
  );
};

export default PhotoActions;
