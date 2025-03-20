import express from 'express';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const storageBucket = process.env.SUPABASE_BUCKET_NAME;

// 設定 multer，將上傳的檔案先存於記憶體中。
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

app.get('/', (_, res) => res.send('Express on Vercel.'));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file; // 取得上傳的檔案
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const fileName = `${file.originalname}-${Date.now()}`;
    const storageClient = supabase.storage.from(storageBucket); // 取得 Supabase 儲存空間客戶端

    // 將檔案上傳到 Supabase Storage
    const { error } = await storageClient.upload(fileName, file.buffer, {
      contentType: file.mimetype
    });

    if (error) throw new Error('Failed to upload file.');

    const { data } = storageClient.getPublicUrl(fileName); // 取得檔案的公開 URL
    if (!data?.publicUrl) throw new Error('Failed to generate public URL.');

    const qrCode = await QRCode.toDataURL(data.publicUrl); // 生成 QR Code

    // 設定計時器，30 分鐘後自動刪除檔案（在 Supabase Storage）。
    setTimeout(() => storageClient.remove([fileName]), 30 * 60 * 1000);

    // 成功則回傳 file（照片）的 URL 及 QR Code
    res.status(200).json({ url: data.publicUrl, qrCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server running at http://localhost:${port}.`));

export default app;
