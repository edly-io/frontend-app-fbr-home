import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProgramCertificatePage from './ProgramCertificatePage';
import { getCertificateVerification, getMyCertificate } from '../app/api';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('../app/api', () => ({
  downloadCertificatePdf: jest.fn(),
  getCertificateVerification: jest.fn(),
  getMyCertificate: jest.fn(),
}));

const NUMBER = 'FBR-CERT-332140F8C3';

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/:programId/certificate" element={<ProgramCertificatePage />} />
      <Route path="/verify/:certificateNumber" element={<div>Public certificate page</div>} />
    </Routes>
  </MemoryRouter>,
);

describe('<ProgramCertificatePage />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the learner their certificate in place, without leaving the tab', async () => {
    getMyCertificate.mockResolvedValue({ certificateNumber: NUMBER });
    getCertificateVerification.mockResolvedValue({
      valid: true,
      status: 'active',
      traineeName: 'Imran Rashid',
      programName: 'Tax Administration Fundamentals',
      issuedAt: '2026-10-12T11:06:59Z',
      html: '<div class="fbr-cert">Issued certificate</div>',
      pdfUrl: `https://lms.example.com/fbr/api/integrations/v1/certificates/${NUMBER}/file/`,
    });
    const { container } = renderAt('/prog-key-1/certificate');

    expect(await screen.findByText('Imran Rashid')).toBeInTheDocument();
    expect(getMyCertificate).toHaveBeenCalledWith('prog-key-1');
    expect(getCertificateVerification).toHaveBeenCalledWith(NUMBER);
    expect(container.querySelector('.fbr-cert')).toHaveTextContent('Issued certificate');
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
    expect(screen.queryByText('Public certificate page')).not.toBeInTheDocument();
  });

  it('renders the empty state when the learner has no certificate', async () => {
    getMyCertificate.mockRejectedValue({ response: { status: 404 } });
    renderAt('/prog-key-1/certificate');

    expect(await screen.findByText('No certificate yet')).toBeInTheDocument();
    expect(getCertificateVerification).not.toHaveBeenCalled();
  });
});
