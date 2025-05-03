import { saveAs } from 'file-saver';

import { useCamera } from '../hooks/useCamera';

// import QRCode from './QRCode';

const PhotoActions: React.FC = () => {
  const { canvasRef, resetCamera, getCompositedCanvas } = useCamera();

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
    // 取得合成畫布
    const combinedCanvas = getCompositedCanvas();
    if (combinedCanvas) {
      // 將 canvas 轉換為 blob 物件，並指定圖片格式為 'image/jpeg'，質量為 1.0（無損）。
      combinedCanvas.toBlob(
        (blob: Blob | null) => {
          if (!blob) return;
          // 使用 file-saver 下載
          saveAs(blob, 'picquads_photobooth.jpg');
        },
        'image/jpeg',
        1.0
      );
    } else {
      // 如果合成方法無法使用，則使用原先的畫布。
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.toBlob(
          (blob: Blob | null) => {
            if (!blob) return;
            saveAs(blob, 'picquads_photobooth.jpg');
          },
          'image/jpeg',
          1.0
        );
      }
    }
  };

  return (
    <div className='flex flex-col justify-center gap-y-3'>
      {/* <QRCode qrCode={qrCode} link={link} /> */}
      <div className='flex items-center gap-x-2 text-sm'>
        <button
          className='w-2/5 rounded-full border-2 border-pink-400 bg-pink-400 py-1.5 font-medium text-white hover:border-pink-500 hover:bg-pink-500'
          onClick={resetCamera}
          aria-label='Retake the photo booth'
        >
          ReTake
        </button>
        <button
          className='w-3/5 rounded-full border-2 border-violet-500 bg-violet-500 py-1.5 font-medium text-white hover:border-violet-600 hover:bg-violet-600'
          onClick={handleDownload}
          aria-label='Download the photo booth'
        >
          Download
        </button>
        {/* <button
          className="py-2 font-medium bg-white border-2 rounded-full text-violet-600 border-violet-600 hover:bg-violet-600 hover:text-white"
          onClick={handleGenerateUrlAndQRCode}
          aria-label="Download the photo booth via QR code"
        >
          Download via QR Code
        </button> */}
      </div>
    </div>
  );
};

export default PhotoActions;
