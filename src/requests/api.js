import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';

const getBaseUrl = () => `${getConfig().LMS_BASE_URL}/fbr/api/attendance/v1`;

const leaveUrl = (suffix = '') => `${getBaseUrl()}/requests/leave/${suffix}`;
const remoteUrl = (suffix = '') => `${getBaseUrl()}/requests/remote-session/${suffix}`;

const typeUrl = (type, suffix = '') => (type === 'leave' ? leaveUrl(suffix) : remoteUrl(suffix));

/**
 * Learner submits a new request.
 *
 * Leave:          POST /v1/requests/leave/
 *   leave_start_date + leave_end_date always required.
 *   session_ids optional — present for session-specific leave, absent for full-day.
 * Remote session: POST /v1/requests/remote-session/  { reason, program_key, session_ids: [uuid, ...] }
 */
export const createRequest = async ({
  // eslint-disable-next-line camelcase
  type, reason, program_key, session_ids,
  // eslint-disable-next-line camelcase
  attachment, leave_start_date, leave_end_date, category, leave_type,
  override,
}) => {
  const client = getAuthenticatedHttpClient();
  const form = new FormData();
  form.append('reason', reason);
  form.append('program_key', program_key);
  if (leave_start_date) { form.append('leave_start_date', leave_start_date); }
  if (leave_end_date) { form.append('leave_end_date', leave_end_date); }
  if (category) { form.append('category', category); }
  if (leave_type) { form.append('leave_type', leave_type); }
  if (session_ids && session_ids.length) {
    session_ids.forEach((id) => form.append('session_ids', id));
  }
  if (attachment) { form.append('attachment', attachment); }
  const url = override ? `${typeUrl(type)}?override=true` : typeUrl(type);
  const { data } = await client.post(url, form);
  return data;
};

/**
 * Learner deletes their own PENDING request.
 *
 * DELETE /v1/requests/leave/{id}/  or  DELETE /v1/requests/remote-session/{id}/
 */
export const deleteRequest = async (requestId, requestType) => {
  const client = getAuthenticatedHttpClient();
  await client.delete(typeUrl(requestType, `${requestId}/`));
};

/**
 * Learner initiates withdrawal of an APPROVED (or WITHDRAWAL_REJECTED) leave request.
 * Leave-only — always uses the leave endpoint.
 *
 * POST /v1/requests/leave/{id}/withdraw/
 */
export const withdrawRequest = async (requestId) => {
  const client = getAuthenticatedHttpClient();
  const { data } = await client.post(leaveUrl(`${requestId}/withdraw/`));
  return data;
};

/**
 * List requests of one type, with the server doing the paging.
 *
 * `type` is always supplied: every route into the requests views pins one
 * (`routes.tsx` — /requests/leaves and /requests/remote-sessions), which the
 * views hold in `filterType` and the Type dropdown can only overwrite with
 * another type, never clear. An earlier "All types" option fetched both
 * endpoints and merged them client-side; that control is gone, and with it the
 * merge, which reported a total built from two separately capped responses.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const fetchRequests = async ({
  // eslint-disable-next-line camelcase
  state, type, q, program_key, page, page_size, start_date, end_date,
} = {}) => {
  const client = getAuthenticatedHttpClient();

  const p = new URLSearchParams();
  if (state) { p.set('state', state); }
  if (q) { p.set('q', q); }
  if (program_key) { p.set('program_key', program_key); }
  if (start_date) { p.set('start_date', start_date); }
  if (end_date) { p.set('end_date', end_date); }
  p.set('page', page ?? 1);
  p.set('page_size', page_size ?? 25);

  const { data } = await client.get(`${typeUrl(type)}?${p.toString()}`);
  return data;
};

/**
 * Learner or instructor lists their own requests (server auto-scopes by role).
 */
export const getMyRequests = fetchRequests;
