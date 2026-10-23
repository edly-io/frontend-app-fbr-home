import { getConfig } from '@edx/frontend-platform';
import { getStudioProgramUrl } from './studioUrls';

jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn(),
}));

describe('getStudioProgramUrl', () => {
  it('builds the Studio URL for the same program path and query', () => {
    getConfig.mockReturnValue({ AUTHORING_BASE_URL: 'http://apps.test/' });

    expect(getStudioProgramUrl('K', 'calendar', '?modal=session&id=5'))
      .toBe('http://apps.test/authoring/programs/K/calendar?modal=session&id=5');
  });

  it('points at the program itself when there is no sub-path or query', () => {
    getConfig.mockReturnValue({ AUTHORING_BASE_URL: 'http://apps.test' });

    expect(getStudioProgramUrl('K')).toBe('http://apps.test/authoring/programs/K');
  });

  it('keeps nested sub-paths and leaves the program key unencoded', () => {
    getConfig.mockReturnValue({ AUTHORING_BASE_URL: 'http://apps.test' });

    expect(getStudioProgramUrl('program-v1:FBR+STP+2026-A', 'attendance/sessions/7', '?course_id=C'))
      .toBe('http://apps.test/authoring/programs/program-v1:FBR+STP+2026-A/attendance/sessions/7?course_id=C');
  });

  it('returns null when AUTHORING_BASE_URL is unset', () => {
    getConfig.mockReturnValue({});

    expect(getStudioProgramUrl('K', 'calendar', '?modal=session&id=5')).toBeNull();
  });
});
