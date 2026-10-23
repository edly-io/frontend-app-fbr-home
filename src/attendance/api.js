import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

const getBaseUrl = () => `${getConfig().LMS_BASE_URL}/fbr/api/attendance/v1`;

/**
 * The learner's own attendance for one programme and course: one row per
 * completed session, status derived server-side (`present`/`absent` from a
 * record, `leave` from an approved leave, else `pending`). The self twin of the
 * admin By-Learner endpoint, so both screens show the same statuses.
 *
 * Pass an empty `courseKey` for the programme's sessions that belong to no
 * course (seminars, workshops, conferences).
 *
 * GET /fbr/api/attendance/v1/trainees/me/attendance/
 * Returns paginated { count, next, previous, results: [...] }.
 *
 * @param {string} programKey
 * @param {string} courseKey
 * @param {Object} [opts]
 * @param {number} [opts.page]
 * @param {number} [opts.pageSize]
 */
export const getMyCourseAttendance = async (programKey, courseKey, { page, pageSize } = {}) => {
  const client = getAuthenticatedHttpClient();
  const params = new URLSearchParams({ program_key: programKey, course_id: courseKey });
  if (page) { params.set('page', String(page)); }
  if (pageSize) { params.set('page_size', String(pageSize)); }
  const { data } = await client.get(
    `${getBaseUrl()}/trainees/me/attendance/?${params}`,
  );
  return data;
};
