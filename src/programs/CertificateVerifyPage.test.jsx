import React from 'react';
import {
  act, fireEvent, render, screen,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CertificateVerifyPage from './CertificateVerifyPage';
import { downloadCertificatePdf, getCertificateVerification } from '../app/api';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('../app/api', () => ({
  downloadCertificatePdf: jest.fn(),
  getCertificateVerification: jest.fn(),
}));

// The header/footer slots need a full platform context; stubs mark that the
// page renders inside the site's own header and footer.
jest.mock('../plugin-slots/HeaderSlot', () => function HeaderSlot() { return <div>Site header</div>; });
jest.mock('@edx/frontend-component-footer', () => ({
  FooterSlot: function FooterSlot() { return <div>Site footer</div>; },
}));

const NUMBER = 'FBR-CERT-332140F8C3';
const PDF_URL = `https://lms.example.com/fbr/api/integrations/v1/certificates/${NUMBER}/file/`;

const activeCertificate = {
  valid: true,
  status: 'active',
  traineeName: 'Imran Rashid',
  programName: 'Tax Administration Fundamentals',
  issuedAt: '2026-10-12T11:06:59Z',
  html: '<div class="fbr-cert">Issued certificate</div>',
  pdfUrl: PDF_URL,
};

const renderPage = () => render(
  <MemoryRouter initialEntries={[`/verify/${NUMBER}`]}>
    <Routes>
      <Route path="/verify/:certificateNumber" element={<CertificateVerifyPage />} />
    </Routes>
  </MemoryRouter>,
);

describe('<CertificateVerifyPage />', () => {
  it('shows a valid certificate to a visitor who is not signed in', async () => {
    getCertificateVerification.mockResolvedValue(activeCertificate);
    const { container } = renderPage();

    expect(await screen.findByText('Valid')).toBeInTheDocument();
    expect(getCertificateVerification).toHaveBeenCalledWith(NUMBER);
    expect(screen.getByText('Imran Rashid')).toBeInTheDocument();
    expect(screen.getByText('Tax Administration Fundamentals')).toBeInTheDocument();
    expect(container.querySelector('.fbr-cert')).toHaveTextContent('Issued certificate');
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
    expect(screen.getByText('Site header')).toBeInTheDocument();
    expect(screen.getByText('Site footer')).toBeInTheDocument();
  });

  it.each(['revoked', 'unknown'])('shows only a generic message for a %s certificate', async (status) => {
    // The page never says why a certificate fails to verify.
    getCertificateVerification.mockResolvedValue({ valid: false, status });
    const { container } = renderPage();

    expect(await screen.findByText(/This certificate could not be verified/i)).toBeInTheDocument();
    expect(screen.queryByText(/Revoked|Not found|Valid/)).not.toBeInTheDocument();
    expect(screen.queryByText(NUMBER)).not.toBeInTheDocument();
    expect(screen.queryByText('Recipient')).not.toBeInTheDocument();
    expect(container.querySelector('.fbr-cert')).toBeNull();
    expect(screen.queryByRole('button', { name: /Download PDF/i })).not.toBeInTheDocument();
  });

  describe('Download PDF', () => {
    let resolveDownload;
    let rejectDownload;
    let reportProgress;

    beforeEach(() => {
      getCertificateVerification.mockResolvedValue(activeCertificate);
      downloadCertificatePdf.mockImplementation((url, onProgress) => new Promise((resolve, reject) => {
        resolveDownload = resolve;
        rejectDownload = reject;
        reportProgress = onProgress;
      }));
      global.URL.createObjectURL = jest.fn(() => 'blob:certificate');
      global.URL.revokeObjectURL = jest.fn();
    });

    it('shows progress while downloading, then saves the file under the certificate number', async () => {
      const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Download PDF/i }));

      expect(downloadCertificatePdf).toHaveBeenCalledWith(PDF_URL, expect.any(Function));
      expect(screen.getByRole('button', { name: /Downloading/i })).toBeInTheDocument();
      act(() => reportProgress(45));
      expect(screen.getByRole('button', { name: /Downloading.*45%/i })).toBeInTheDocument();

      const blob = new Blob(['%PDF'], { type: 'application/pdf' });
      await act(async () => resolveDownload(blob));

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      const anchor = clickSpy.mock.contexts[0];
      expect(anchor.download).toBe(`${NUMBER}.pdf`);
      expect(anchor.href).toBe('blob:certificate');
      expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
      clickSpy.mockRestore();
    });

    it('explains a failed download and lets the visitor try again', async () => {
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Download PDF/i }));
      await act(async () => rejectDownload(new Error('Network Error')));

      expect(screen.getByText(/Could not download the certificate/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
    });
  });
});
