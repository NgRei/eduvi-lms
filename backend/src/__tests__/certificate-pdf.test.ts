import * as uploadService from '../services/upload.service';
import { generateCertificatePdf } from '../services/certificate-pdf.service';

describe('Certificate PDF Service Unit Tests', () => {
  beforeEach(() => {
    jest.spyOn(uploadService, 'uploadRawFile').mockResolvedValue({
      public_id: 'eduvi/certificates/cert-test-999',
      secure_url: 'https://res.cloudinary.com/raw/upload/v12345/eduvi/certificates/cert-test-999.pdf',
      format: 'pdf',
      bytes: 1048576,
      width: 0,
      height: 0,
      resource_type: 'raw',
      created_at: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render PDF document and upload to Cloudinary', async () => {
    const studentName = 'Nguyen Van A';
    const courseTitle = 'Lập Trình Web Fullstack';
    const certCode = 'CERT-UNIT-TEST-123';
    const issuedAt = new Date('2026-08-10');

    const resultUrl = await generateCertificatePdf(
      studentName,
      courseTitle,
      certCode,
      issuedAt
    );

    expect(resultUrl).toBe('https://res.cloudinary.com/raw/upload/v12345/eduvi/certificates/cert-test-999.pdf');
    expect(uploadService.uploadRawFile).toHaveBeenCalledTimes(1);
    expect(uploadService.uploadRawFile).toHaveBeenCalledWith(
      expect.any(Buffer),
      'eduvi/certificates'
    );
  });
});
