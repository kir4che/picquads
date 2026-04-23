import { useState } from 'react';
import { saveAs } from 'file-saver';
import { Loader2, QrCode } from 'lucide-react';

import { useCamera } from '../hooks/useCamera';

import QRCode from './QRCode';

const PhotoActions = () => {
  const { canvasRef, resetCamera, getCompositedCanvas } = useCamera();

  const [link, setLink] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleGenerateUrlAndQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsUploading(true);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          1.0
        );
      });

      const formData = new FormData();
      formData.append('file', blob, 'photo.jpeg');

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      const { url, qrCode } = data;
      setLink(url);
      setQrCode(qrCode);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error during upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

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
      <QRCode
        qrCode={qrCode}
        link={link}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className='flex items-center gap-x-2 text-sm'>
        <button
          className='min-w-0 flex-1 rounded-full border-2 border-pink-400 bg-pink-400 py-1.5 font-medium text-white hover:border-pink-500 hover:bg-pink-500'
          onClick={resetCamera}
          aria-label='Retake the photo booth'
        >
          ReTake
        </button>
        <button
          className='min-w-0 flex-1 rounded-full border-2 border-violet-500 bg-violet-500 py-1.5 font-medium text-white hover:border-violet-600 hover:bg-violet-600'
          onClick={handleDownload}
          aria-label='Download the photo booth'
        >
          Download
        </button>
        <button
          className='flex h-8 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white hover:border-violet-600 disabled:opacity-50 disabled:hover:border-white'
          onClick={handleGenerateUrlAndQRCode}
          disabled={isUploading}
          aria-label='Download the photo booth via QR code'
        >
          {isUploading ? (
            <Loader2 size={20} className='animate-spin text-gray-500' />
          ) : (
            <QrCode size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default PhotoActions;
