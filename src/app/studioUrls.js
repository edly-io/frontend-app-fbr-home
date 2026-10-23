import { getConfig } from '@edx/frontend-platform';

/**
 * The Studio URL for a program page: the same sub-path and query under
 * `${AUTHORING_BASE_URL}/authoring/programs/<programKey>`, e.g.
 * `/K/calendar?modal=session&id=5` → `…/authoring/programs/K/calendar?modal=session&id=5`.
 *
 * Program keys are not URL-encoded, matching the links Studio already accepts.
 * Returns null when AUTHORING_BASE_URL is unset, so callers render no link
 * rather than a broken one.
 */
export const getStudioProgramUrl = (programKey, subPath = '', search = '') => {
  const baseUrl = getConfig().AUTHORING_BASE_URL;
  if (!baseUrl) { return null; }
  return `${baseUrl.replace(/\/$/, '')}/authoring/programs/${programKey}${subPath ? `/${subPath}` : ''}${search}`;
};

export default getStudioProgramUrl;
