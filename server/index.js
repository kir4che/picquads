import express from 'express';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // 添加 JSON 解析中間件

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const storageBucket = process.env.SUPABASE_BUCKET_NAME;

// 設定 multer，將上傳的檔案先存於記憶體中。
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  }
});

app.get('/', (_, res) => res.send('Express on Vercel.'));

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file; // 取得上傳的檔案
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const fileName = `${file.originalname}-${Date.now()}`;
    const storageClient = supabase.storage.from(storageBucket); // 取得 Supabase Bucket

    // 將檔案上傳到 Supabase Storage
    const { error } = await storageClient.upload(fileName, file.buffer, {
      contentType: 'image/jpeg',
      upsert: false,
      cacheControl: '1000'
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

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

app.post('/api/contact', async (req, res) => {
  let transporter = null;

  try {
    const { name, email, content } = req.body;

    if (!name || !email || !content) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken = await oauth2Client.getAccessToken();
    if (!accessToken) {
      return res.status(500).json({  error: 'Failed to get access token.' });
    }

    // 設定寄信的 SMTP 服務
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER || 'mollydcxxiii@gmail.com',
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken ?? ''
      }
    });

    // 設定信件內容
    const mailOptions = {
      from: `"${name.trim()}" <${email.trim()}>`,
      to: process.env.EMAIL_USER || 'mollydcxxiii@gmail.com',
      subject: 'PicQuads - Contact Form Submission',
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="white-space: pre-wrap;">${content}</p>
        <br>
        <hr>
        <p><small>This email is automatically sent from the PicQuads contact form.</small></p>
      `,
      text: `Name: ${name}\nEmail: ${email}\n\n${content}`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (transporter) transporter.close();
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server running at http://localhost:${port}.`));

export default app;
