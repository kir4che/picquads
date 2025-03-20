import React, { useRef, useEffect, useState } from 'react';

import LinkIcon from '../assets/link.svg?react';

interface PhotoGridProps {
  images: string[];
  showDownload?: boolean;
  onReset?: () => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ images, showDownload, onReset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [link, setLink] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');

  const pixelRatio = 3.7795275591; // mm 轉 px 比例
  const canvasWidth = 50.5 * pixelRatio;
  const canvasHeight = 152 * pixelRatio;
  const photoWidth = 44.5 * pixelRatio;
  const photoHeight = 29.8 * pixelRatio;
  const horizontalPadding = 11;
  const paddingTop = 16;
  const verticalGap = 7.5;

  // 圖片加載完成後儲存到 state
  useEffect(() => {
    const loadImages = () => {
      const loaded: HTMLImageElement[] = [];
      images.forEach((imageSrc) => {
        const img = new Image();
        img.onload = () => {
          loaded.push(img);
          if (loaded.length === images.length)
            setLoadedImages(loaded); // 所有圖片加載完成後更新狀態
        };
        img.onerror = () => console.error(`Image failed to load: ${imageSrc}`);
        img.src = imageSrc;
      });
    };

    loadImages();
  }, [images]);

  // 繪製 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        for (let i = 0; i < 4; i++) {
          const y = paddingTop + i * (photoHeight + verticalGap);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(horizontalPadding, y, photoWidth, photoHeight);
        }

        loadedImages.forEach((img, index) => {
          const y = paddingTop + index * (photoHeight + verticalGap);
          ctx.drawImage(img, horizontalPadding, y, photoWidth, photoHeight);
        });
      }
    }
  }, [loadedImages]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/jpeg');
      link.download = 'photo-strip.jpg';
      link.click();
    }
  };

  const handleGenerateUrlAndQRCode = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('file', blob, 'photo.jpg');

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      const { url, qrCode } = data; // 從後端獲得 QR code 的 URL
      setLink(url);
      setQrCode(qrCode);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error during upload:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-y-8">
      <canvas ref={canvasRef} />
      
      {showDownload && (
        <div className="flex flex-col w-full gap-4">
          <button className="w-full px-4 py-2 text-white rounded-full bg-sky-400 hover:bg-sky-500" onClick={handleDownload}>
            Download
          </button>

          <button
            className="w-full px-4 py-2 text-white rounded-full bg-violet-400 hover:bg-violet-500 disabled:hidden"
            onClick={handleGenerateUrlAndQRCode}
            disabled={qrCode !== ''}
          >
            Download via QR Code
          </button>

          <button className="w-full px-4 py-2 text-white bg-pink-400 rounded-full hover:bg-pink-500" onClick={() => {
            setLoadedImages([]);
            setShowQRCode(false);
            setLink('');
            setQrCode('');
            onReset?.();
          }}>
            Take New Photos
          </button>
        </div>
      )}

      {showQRCode && (
        <div>
          <img src={qrCode} alt="QR Code" className="w-40 h-40 mx-auto" />
          <a href={link} className="flex items-center justify-center mb-4 font-medium text-center gap-x-2 text-sky-400 hover:text-sky-500">
            <LinkIcon className="w-4 h-4" />
            Link
          </a>
          <p className="text-sm text-center text-gray-500">
            Link and QR Code will expire in 1 hour.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoGrid;
