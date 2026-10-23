import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

const ITEMS = [
  { slug: 'leaves', label: 'Leaves' },
  { slug: 'remote-sessions', label: 'Remote Sessions' },
];

const RequestsSubNav = () => {
  const { programId } = useParams();

  return (
    <nav aria-label="Requests sub-sections" className="d-flex flex-wrap mb-3">
      {ITEMS.map(({ slug, label }) => (
        <NavLink
          key={slug}
          to={`/${programId}/requests/${slug}`}
          className={({ isActive }) => [
            'px-3 py-1 mr-1 mb-1',
            'rounded-pill',
            'small',
            'text-decoration-none',
            'd-inline-flex align-items-center',
            isActive ? 'bg-primary text-white' : 'text-muted',
          ].join(' ')}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default RequestsSubNav;
