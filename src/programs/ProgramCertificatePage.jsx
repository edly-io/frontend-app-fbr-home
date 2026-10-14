import React from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@openedx/paragon';
import { useCertificateVerification, useMyCertificate } from '../app/hooks';
import CertificateView from './CertificateView';
import './certificate.scss';

/**
 * The program's Certificate tab: the learner's own certificate, shown in place
 * inside the program layout (same view as the public verify page).
 */
const ProgramCertificatePage = () => {
  const { programId } = useParams();
  const {
    certificate, loading, notFound, error,
  } = useMyCertificate(programId);
  const certificateNumber = certificate?.certificateNumber;
  const {
    verification, loading: verifying, error: verifyError,
  } = useCertificateVerification(certificateNumber);

  if (loading || (certificateNumber && verifying)) {
    return (
      <div className="trainee-cert-page trainee-cert-page--centered">
        <Spinner animation="border" screenReaderText="Loading certificate" />
      </div>
    );
  }

  if (notFound || !certificateNumber || !verification) {
    return (
      <div className="trainee-cert-page">
        <div className="trainee-cert-empty">
          <h2 className="trainee-cert-empty__title">No certificate yet</h2>
          <p className="trainee-cert-empty__text">
            {error || verifyError || 'A certificate has not been issued for this program yet.'}
          </p>
        </div>
      </div>
    );
  }

  return <CertificateView certificateNumber={certificateNumber} verification={verification} />;
};

export default ProgramCertificatePage;
