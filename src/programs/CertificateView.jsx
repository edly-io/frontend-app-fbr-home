import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Button, Spinner,
} from '@openedx/paragon';
import { Download } from '@openedx/paragon/icons';
import { CertificateHtmlView } from '@edly-io/frontend-component-fbr';
import { downloadCertificatePdf } from '../app/api';
import './certificate.scss';

const formatIssuedDate = (value) => new Date(value).toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
});

const CertificateDetails = ({ certificateNumber, verification }) => (
  <dl className="cert-verify-details">
    <dt>Certificate number</dt>
    <dd>{certificateNumber}</dd>
    <dt>Recipient</dt>
    <dd>{verification.traineeName}</dd>
    <dt>Program</dt>
    <dd>{verification.programName}</dd>
    <dt>Issued</dt>
    <dd>{formatIssuedDate(verification.issuedAt)}</dd>
  </dl>
);

CertificateDetails.propTypes = {
  certificateNumber: PropTypes.string.isRequired,
  verification: PropTypes.shape({
    traineeName: PropTypes.string,
    programName: PropTypes.string,
    issuedAt: PropTypes.string,
  }).isRequired,
};

const saveFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const DownloadPdfButton = ({ pdfUrl, certificateNumber }) => {
  // null when idle, otherwise percent downloaded (0 until the size is known).
  const [progress, setProgress] = useState(null);
  const [failed, setFailed] = useState(false);
  const isDownloading = progress !== null;

  const download = async () => {
    setFailed(false);
    setProgress(0);
    try {
      const blob = await downloadCertificatePdf(pdfUrl, setProgress);
      saveFile(blob, `${certificateNumber}.pdf`);
    } catch {
      setFailed(true);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="cert-verify-download">
      <Button
        variant="outline-primary"
        iconBefore={isDownloading ? undefined : Download}
        onClick={download}
        disabled={isDownloading}
      >
        {isDownloading && <Spinner animation="border" size="sm" className="mr-2" screenReaderText="" />}
        {isDownloading ? `Downloading…${progress ? ` ${progress}%` : ''}` : 'Download PDF'}
      </Button>
      {failed && (
        <p className="text-danger small mb-0">Could not download the certificate. Please try again.</p>
      )}
    </div>
  );
};

DownloadPdfButton.propTypes = {
  pdfUrl: PropTypes.string.isRequired,
  certificateNumber: PropTypes.string.isRequired,
};

/**
 * A certificate as the public verify API describes it: details, the rendered
 * certificate and its PDF when valid, a generic message otherwise. Shared by
 * the public verify page and the trainee's program Certificate tab.
 */
const CertificateView = ({ certificateNumber, verification }) => {
  // Anything but a valid certificate (revoked or unknown) gets the same generic
  // message: the public page never says who held a certificate or why it fails.
  if (!verification.valid) {
    return (
      <div className="trainee-cert-page">
        <h1 className="h3">Certificate verification</h1>
        <p className="mb-0">
          This certificate could not be verified. Please check the link or contact
          the issuing organisation.
        </p>
      </div>
    );
  }
  return (
    <div className="trainee-cert-page">
      <div className="cert-verify-summary">
        <div className="cert-verify-summary__heading">
          <h1 className="h3 mb-0">Certificate verification</h1>
          <Badge variant="success">Valid</Badge>
        </div>
        <CertificateDetails certificateNumber={certificateNumber} verification={verification} />
      </div>
      <div className="trainee-cert-toolbar">
        <DownloadPdfButton pdfUrl={verification.pdfUrl} certificateNumber={certificateNumber} />
      </div>
      <CertificateHtmlView html={verification.html} />
    </div>
  );
};

CertificateView.propTypes = {
  certificateNumber: PropTypes.string.isRequired,
  verification: PropTypes.shape({
    valid: PropTypes.bool.isRequired,
    html: PropTypes.string,
    pdfUrl: PropTypes.string,
  }).isRequired,
};

export default CertificateView;
