import { getAuthenticatedHttpClient, getHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

export const getMyFbrRoles = async () => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getConfig().LMS_BASE_URL}/fbr/api/biodata/v1/users/me/`);
  return Array.isArray(data?.roles) ? data.roles : [];
};

export const getTraineeDashboard = async (programKey = undefined) => {
  const client = getAuthenticatedHttpClient();
  const baseUrl = `${getConfig().LMS_BASE_URL}/fbr/api/trainee-dashboard/v1/summary/`;
  const url = programKey
    ? `${baseUrl}?program_key=${encodeURIComponent(programKey)}`
    : baseUrl;
  const { data } = await client.get(url);
  return data;
};

export const getInstructorDashboard = async () => {
  const client = getAuthenticatedHttpClient();
  const url = `${getConfig().LMS_BASE_URL}/fbr/api/instructor-dashboard/v1/summary/`;
  const { data } = await client.get(url);
  return data;
};

export const getAdminDashboard = async () => {
  const client = getAuthenticatedHttpClient();
  const url = `${getConfig().LMS_BASE_URL}/fbr/api/admin-dashboard/v1/summary/`;
  const { data } = await client.get(url);
  return data;
};

export const getFeedbackDetail = async (requestId) => {
  const client = getAuthenticatedHttpClient();
  const url = `${getConfig().LMS_BASE_URL}/fbr/api/feedback/${encodeURIComponent(requestId)}/`;
  const { data } = await client.get(url);
  return data;
};

export const submitFeedback = async (requestId, payload) => {
  const client = getAuthenticatedHttpClient();
  const url = `${getConfig().LMS_BASE_URL}/fbr/api/feedback/${encodeURIComponent(requestId)}/submit/`;
  const { data } = await client.post(url, payload);
  return data;
};

const getProgramsBaseUrl = () => `${getConfig().STUDIO_BASE_URL}/fbr/api/programs`;

const toProgram = (p) => ({
  id: p.program_key,
  name: p.name,
  programType: p.program_type,
  org: p.organization,
  batch: p.batch,
  status: p.status,
  startDate: p.start_date,
  endDate: p.end_date,
  description: p.description,
  cardImage: p.card_image || null,
  enrolledAt: p.learner_enrolled_at || null,
  courseCount: p.course_count ?? 0,
});

/**
 * One page of the caller's programs. URLSearchParams keeps a repeated `status`
 * as `status=a&status=b`, the form the API reads (axios would send `status[]`).
 */
export const getPrograms = async ({
  page, pageSize, search, statuses, ordering,
}) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize), ordering });
  if (search.trim()) { params.append('search', search.trim()); }
  statuses.forEach((status) => params.append('status', status));
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getProgramsBaseUrl()}/`, { params });
  return {
    results: data.results.map(toProgram),
    count: data.pagination.count,
    numPages: data.pagination.num_pages,
  };
};

export const getProgram = async (programKey) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getProgramsBaseUrl()}/${encodeURIComponent(programKey)}/`);
  return toProgram(data);
};

export const updateProgram = async (programKey, payload) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.patch(`${getProgramsBaseUrl()}/${programKey}/`, payload);
  return data;
};

export const getMyCertificate = async (programKey) => {
  // The learner's own active certificate number for a program (LMS). Used to
  // load the certificate for the program's Certificate tab.
  const client = getAuthenticatedHttpClient();
  const url = `${getConfig().LMS_BASE_URL}/fbr/api/cms/certificates/my/${programKey}/certificate/`;
  const { data } = await client.get(url);
  return { certificateNumber: data.certificate_number };
};

export const getCertificateVerification = async (certificateNumber) => {
  // Public (no login): the certificate page is what a scanned QR code opens.
  // Encoded: the number comes from the page URL, so it must stay one path segment.
  const url = `${getConfig().LMS_BASE_URL}/fbr/api/cms/certificates/verify/${encodeURIComponent(certificateNumber)}/`;
  // Opt in to the rendered certificate and PDF link (left out by default).
  const { data } = await getHttpClient().get(url, { params: { include: 'certificate' } });
  return {
    valid: data.valid,
    status: data.status,
    traineeName: data.trainee_name,
    programName: data.program_name,
    issuedAt: data.issued_at,
    html: data.html,
    pdfUrl: data.pdf_url,
  };
};

export const downloadCertificatePdf = async (pdfUrl, onProgress) => {
  // Public file; fetched (not linked) so the page can show download progress.
  const { data } = await getHttpClient().get(pdfUrl, {
    responseType: 'blob',
    onDownloadProgress: ({ loaded, total }) => {
      if (total) { onProgress(Math.round((loaded / total) * 100)); }
    },
  });
  return data;
};

export const getLearnerCourseMap = async () => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.get(`${getConfig().LMS_BASE_URL}/api/learner_home/init`);
  const map = {};
  (data.courses || []).forEach((entry) => {
    if (entry.courseRun?.courseId) {
      map[entry.courseRun.courseId] = entry;
    }
  });
  return map;
};
