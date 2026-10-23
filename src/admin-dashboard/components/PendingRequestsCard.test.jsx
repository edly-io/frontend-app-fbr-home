import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { getConfig } from '@edx/frontend-platform';

import PendingRequestsCard from './PendingRequestsCard';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

jest.mock('@edx/frontend-platform', () => ({
  getConfig: jest.fn(),
}));

const requests = {
  leave_count: 3,
  remote_session_count: 1,
  substitute_count: 2,
  leave_by_program: [{ program_key: 'K', program_name: 'Programme K', count: 3 }],
  remote_by_program: [{ program_key: 'K', program_name: 'Programme K', count: 1 }],
  substitute_by_program: [{ program_key: 'K', program_name: 'Programme K', count: 2 }],
};

const reviewLinkIn = (sectionLabel) => {
  const section = screen.getByText(sectionLabel).closest('.admin-dashboard__request-type-section');
  return within(section).queryByRole('link', { name: /review/i });
};

beforeEach(() => {
  getConfig.mockReturnValue({ AUTHORING_BASE_URL: 'http://apps.test/' });
});

describe('PendingRequestsCard', () => {
  it('links each request type to its Studio requests tab', () => {
    render(<PendingRequestsCard requests={requests} />);

    expect(reviewLinkIn('Leave Requests'))
      .toHaveAttribute('href', 'http://apps.test/authoring/programs/K/requests/leaves');
    expect(reviewLinkIn('Remote Session Requests'))
      .toHaveAttribute('href', 'http://apps.test/authoring/programs/K/requests/remote-sessions');
  });

  it('links the pending substitute group to Studio substitute requests', () => {
    render(<PendingRequestsCard requests={requests} />);

    expect(reviewLinkIn('Substitute Requests'))
      .toHaveAttribute('href', 'http://apps.test/authoring/programs/K/requests/substitute-requests');
  });

  it('renders no Review link when AUTHORING_BASE_URL is unset', () => {
    getConfig.mockReturnValue({});
    render(<PendingRequestsCard requests={requests} />);

    expect(screen.queryByRole('link', { name: /review/i })).not.toBeInTheDocument();
    expect(screen.getAllByText('Programme K')).toHaveLength(3);
  });
});
