import React from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { FooterSlot } from '@edx/frontend-component-footer';
import { Container, Spinner } from '@openedx/paragon';
import HeaderSlot from '../plugin-slots/HeaderSlot';
import { useCertificateVerification } from '../app/hooks';
import CertificateView from './CertificateView';
import './certificate.scss';

// The site's own header and footer make the public page recognisably official.
const PublicLayout = ({ children }) => (
  <>
    <HeaderSlot />
    <main id="main" className="d-flex flex-column flex-grow-1">
      <Container size="xl">{children}</Container>
    </main>
    <FooterSlot />
  </>
);

PublicLayout.propTypes = { children: PropTypes.node.isRequired };

/** Public certificate page: what a certificate's QR code opens. */
const CertificateVerifyPage = () => {
  const { certificateNumber } = useParams();
  const { verification, loading, error } = useCertificateVerification(certificateNumber);

  if (loading) {
    return (
      <PublicLayout>
        <div className="trainee-cert-page trainee-cert-page--centered">
          <Spinner animation="border" screenReaderText="Loading certificate" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !verification) {
    return (
      <PublicLayout>
        <div className="trainee-cert-empty">
          <h2 className="trainee-cert-empty__title">Could not load this certificate</h2>
          <p className="trainee-cert-empty__text">{error}</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <CertificateView certificateNumber={certificateNumber} verification={verification} />
    </PublicLayout>
  );
};

export default CertificateVerifyPage;
