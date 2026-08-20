import PDFDocument from 'pdfkit';
import path from 'path';
import https from 'https';
import { uploadRawFile } from './upload.service';

// Function to fetch QR code image buffer from api.qrserver.com
const fetchQrCodeBuffer = (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    https.get(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error('Failed to fetch QR code'));
        return;
      }
      const chunks: any[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
};

export const generateCertificatePdf = async (
  studentName: string,
  courseTitle: string,
  certCode: string,
  issuedAt: Date
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
      });

      const chunks: any[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          // Upload PDF to Cloudinary raw folder
          const uploadResult = await uploadRawFile(pdfBuffer, 'eduvi/certificates');
          resolve(uploadResult.secure_url);
        } catch (uploadErr) {
          reject(uploadErr);
        }
      });

      // Path to Arial font (package-contained)
      const fontPath = path.join(__dirname, '../assets/fonts/arial.ttf');
      doc.font(fontPath);

      // --- Draw Certificate Design ---
      
      // 1. Draw border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(4)
         .stroke('#1E3A8A'); // Dark Blue border

      doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
         .lineWidth(1)
         .stroke('#F59E0B'); // Gold inner border

      // 2. Title / Header
      doc.fontSize(24)
         .fillColor('#1E3A8A')
         .text('HỆ THỐNG QUẢN LÝ HỌC TẬP EDUVI', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(36)
         .fillColor('#F59E0B')
         .text('CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC', { align: 'center', wordSpacing: 2 })
         .moveDown(1);

      // 3. Body text
      doc.fontSize(16)
         .fillColor('#4B5563')
         .text('Chứng nhận học viên:', { align: 'center' })
         .moveDown(0.5);

      // 4. Student Name
      doc.fontSize(28)
         .fillColor('#111827')
         .text(studentName, { align: 'center', underline: true })
         .moveDown(0.8);

      // 5. Course Title
      doc.fontSize(16)
         .fillColor('#4B5563')
         .text('Đã hoàn thành xuất sắc khóa học:', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(22)
         .fillColor('#1E3A8A')
         .text(`"${courseTitle}"`, { align: 'center' })
         .moveDown(1.5);

      // 6. Signatures and Date
      const yPosition = doc.y;
      
      // Left side: Date and Cert Code
      doc.fontSize(12)
         .fillColor('#6B7280')
         .text(`Ngày cấp: ${issuedAt.toLocaleDateString('vi-VN')}`, 80, yPosition)
         .text(`Mã chứng chỉ: ${certCode}`, 80, yPosition + 20);

      // Right side: Director signature placeholder
      doc.fontSize(14)
         .fillColor('#1F2937')
         .text('BAN GIÁM ĐỐC EDUVI', doc.page.width - 250, yPosition, { align: 'center', width: 180 })
         .moveDown(1.5);
      
      doc.fontSize(12)
         .fillColor('#9CA3AF')
         .text('(Ký tên và đóng dấu)', doc.page.width - 250, doc.y, { align: 'center', width: 180 });

      // 7. QR Code for verification
      const verifyUrl = `http://localhost:8000/verify-certificate?code=${certCode}`;
      try {
        const qrBuffer = await fetchQrCodeBuffer(verifyUrl);
        doc.image(qrBuffer, doc.page.width / 2 - 50, yPosition - 30, { width: 100, height: 100 });
      } catch (qrErr) {
        console.warn('Failed to embed QR code in PDF:', qrErr);
      }

      // End document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
