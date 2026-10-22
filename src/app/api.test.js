import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient, getHttpClient } from '@edx/frontend-platform/auth';

import {
  getCertificateVerification,
  getFeedbackDetail,
  getInstructorDashboard,
  getMyFbrRoles,
  getTraineeDashboard,
  submitFeedback,
} from './api';

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedHttpClient: jest.fn(),
  getHttpClient: jest.fn(),
}));
jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn(),
}));

const mockClient = {
  get: jest.fn(),
  post: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  getConfig.mockReturnValue({ LMS_BASE_URL: 'http://localhost:18000' });
  getAuthenticatedHttpClient.mockReturnValue(mockClient);
  getHttpClient.mockReturnValue(mockClient);
});

describe('getCertificateVerification', () => {
  it('encodes the certificate number so a crafted link cannot reach another path', async () => {
    mockClient.get.mockResolvedValue({ data: { valid: false, status: 'unknown' } });

    await getCertificateVerification('../../../api/user/v1/me');

    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/cms/certificates/verify/..%2F..%2F..%2Fapi%2Fuser%2Fv1%2Fme/',
      { params: { include: 'certificate' } },
    );
  });

  it('asks the public verify endpoint to include the certificate and its PDF link', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        valid: true,
        status: 'active',
        trainee_name: 'Imran Rashid',
        program_name: 'Tax Administration Fundamentals',
        issued_at: '2026-10-12T11:06:59Z',
        html: '<div class="fbr-cert" />',
        pdf_url: 'http://localhost:18000/fbr/api/integrations/v1/certificates/FBR-CERT-1/file/',
      },
    });

    const verification = await getCertificateVerification('FBR-CERT-1');

    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/cms/certificates/verify/FBR-CERT-1/',
      { params: { include: 'certificate' } },
    );
    expect(verification).toMatchObject({
      html: '<div class="fbr-cert" />',
      pdfUrl: 'http://localhost:18000/fbr/api/integrations/v1/certificates/FBR-CERT-1/file/',
    });
  });
});

describe('getMyFbrRoles', () => {
  it('loads the current profile roles from the LMS biodata endpoint', async () => {
    mockClient.get.mockResolvedValue({
      data: { roles: ['data_admin', 'trainee'] },
    });

    await expect(getMyFbrRoles()).resolves.toEqual(['data_admin', 'trainee']);
    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/biodata/v1/users/me/',
    );
  });

  it('normalizes a missing roles value to an empty array', async () => {
    mockClient.get.mockResolvedValue({ data: {} });

    await expect(getMyFbrRoles()).resolves.toEqual([]);
  });
});

describe('getTraineeDashboard', () => {
  it('loads the default trainee dashboard summary from the LMS', async () => {
    const response = { state: 'ready', selected_program_key: 'program-v1:FBR+STP+2026' };
    mockClient.get.mockResolvedValue({ data: response });

    await expect(getTraineeDashboard()).resolves.toEqual(response);
    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/trainee-dashboard/v1/summary/',
    );
  });

  it('adds only the encoded program_key when a programme is selected', async () => {
    mockClient.get.mockResolvedValue({ data: { state: 'ready' } });

    await getTraineeDashboard('program-v1:FBR+STP/2026 A');

    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/trainee-dashboard/v1/summary/?program_key=program-v1%3AFBR%2BSTP%2F2026%20A',
    );
  });
});

describe('getInstructorDashboard', () => {
  it('loads the instructor dashboard summary from the LMS', async () => {
    const response = { state: 'ready', upcoming_sessions: [] };
    mockClient.get.mockResolvedValue({ data: response });

    await expect(getInstructorDashboard()).resolves.toEqual(response);
    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/instructor-dashboard/v1/summary/',
    );
  });
});

describe('instructor feedback', () => {
  it('loads a feedback request detail from the LMS', async () => {
    const response = { id: 602, feedback_name: 'Faculty evaluation' };
    mockClient.get.mockResolvedValue({ data: response });

    await expect(getFeedbackDetail(602)).resolves.toEqual(response);
    expect(mockClient.get).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/feedback/602/',
    );
  });

  it('submits feedback answers to the LMS', async () => {
    const payload = {
      answers: [
        { question_id: 1, star_value: 4 },
        { question_id: 2, text_value: 'Clear and helpful.' },
      ],
    };
    const response = { detail: 'Feedback submitted successfully.' };
    mockClient.post.mockResolvedValue({ data: response });

    await expect(submitFeedback(602, payload)).resolves.toEqual(response);
    expect(mockClient.post).toHaveBeenCalledWith(
      'http://localhost:18000/fbr/api/feedback/602/submit/',
      payload,
    );
  });
});
