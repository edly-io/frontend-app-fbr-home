import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import RequestsSubNav from './RequestsSubNav';

const jestDomMatchers = require('@testing-library/jest-dom/matchers');

expect.extend(jestDomMatchers);

const PROGRAM = 'program-v1:FBR+STP+2026-A';

const renderSubNav = () => render(
  <MemoryRouter initialEntries={[`/${PROGRAM}/requests/leaves`]}>
    <Routes>
      <Route path="/:programId/requests/*" element={<RequestsSubNav />} />
    </Routes>
  </MemoryRouter>,
);

describe('RequestsSubNav', () => {
  it('links to the leaves and remote sessions tabs of the program', () => {
    renderSubNav();

    expect(screen.getByRole('link', { name: 'Leaves' })).toHaveAttribute('href', `/${PROGRAM}/requests/leaves`);
    expect(screen.getByRole('link', { name: 'Remote Sessions' }))
      .toHaveAttribute('href', `/${PROGRAM}/requests/remote-sessions`);
  });

  it('has no substitute requests tab (admins handle those in Studio)', () => {
    renderSubNav();

    expect(screen.queryByText('Substitute Requests')).not.toBeInTheDocument();
  });

  it('shows no count badges', () => {
    renderSubNav();

    expect(screen.queryByLabelText(/awaiting action/)).not.toBeInTheDocument();
  });
});
