import React, {
  useState, useRef, useEffect,
} from 'react';
import {
  Spinner, Alert, Pagination,
} from '@openedx/paragon';
import { FooterSlot } from '@edx/frontend-component-footer';
import { DebouncedSearch, useConfig, USER_ROLE } from '@edly-io/frontend-component-fbr';
import HeaderSlot from '../plugin-slots/HeaderSlot';
import { getStudioProgramUrl } from '../app/studioUrls';
import ProgramCard from './ProgramCard';
import { usePrograms } from '../app/hooks';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'freezed', label: 'Freezed' },
];

const PAGE_SIZE = 20;

const ORDERING_BY_SORT = {
  enrolled: '-learner_enrolled_at',
  az: 'name',
  za: '-name',
};

const SORT_OPTIONS = [
  { value: 'enrolled', label: 'Last Enrolled' },
  { value: 'az', label: 'Name A–Z' },
  { value: 'za', label: 'Name Z–A' },
];

const ProgramsListPage = () => {
  const { data: config } = useConfig();
  // Admins manage programs in Studio, so their cards open the program there.
  const isAdmin = config?.user_role === USER_ROLE.ADMIN;

  const defaultSlug = 'courses';

  const defaultSort = 'enrolled';
  const [search, setSearch] = useState('');
  const [statusFilters, setStatusFilters] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('');
  const [refineOpen, setRefineOpen] = useState(false);
  const [page, setPage] = useState(1);
  const refineRef = useRef(null);

  useEffect(() => {
    if (!refineOpen) { return undefined; }
    const handleOutsideClick = (e) => {
      if (refineRef.current && !refineRef.current.contains(e.target)) {
        setRefineOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [refineOpen]);

  // A new search, filter or sort starts again from the first page.
  const changeSearch = (value) => { setSearch(value); setPage(1); };
  const changeSortOrder = (value) => { setSortOrder(value); setPage(1); };
  const toggleStatus = (value) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) { next.delete(value); } else { next.add(value); }
      return next;
    });
    setPage(1);
  };

  const effectiveSortOrder = sortOrder || defaultSort;
  const {
    programs, count, numPages, loading, error,
  } = usePrograms({
    page,
    pageSize: PAGE_SIZE,
    search,
    statuses: STATUS_OPTIONS.map(({ value }) => value).filter((value) => statusFilters.has(value)),
    ordering: ORDERING_BY_SORT[effectiveSortOrder],
  });

  const hasActiveFilter = search.trim() || statusFilters.size > 0;
  const activeRefineCount = statusFilters.size + (effectiveSortOrder !== defaultSort ? 1 : 0);

  const firstRow = (page - 1) * PAGE_SIZE + 1;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" screenReaderText="Loading programs" />
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (!programs.length) {
      return (
        <div className="programs-empty">
          <div className="programs-empty__card">
            {hasActiveFilter ? (
              <>
                <h5 className="programs-empty__title">No programs match your filters</h5>
                <p className="text-muted mb-0">Try adjusting your search or status filter.</p>
              </>
            ) : (
              <>
                <h5 className="programs-empty__title">No programs assigned yet</h5>
                <p className="text-muted mb-0">
                  You haven&apos;t been enrolled in any programs yet.
                  Please contact your administrator.
                </p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="programs-grid">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              defaultSlug={defaultSlug}
              studioUrl={isAdmin ? getStudioProgramUrl(program.id) : null}
            />
          ))}
        </div>
        <div className="programs-pagination">
          <span className="programs-pagination__status">
            {`Showing ${firstRow} - ${firstRow + programs.length - 1} of ${count}.`}
          </span>
          <Pagination
            size="small"
            paginationLabel="Programs pagination"
            pageCount={numPages}
            currentPage={page}
            onPageSelect={setPage}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <HeaderSlot />
      <main id="main-content" className="container-fluid d-flex flex-column flex-grow-1">
        <div className="programs-page">
          <h1 className="programs-page__title">My Programs</h1>

          {!loading && !error && (
            <div className="programs-filter-bar">
              <DebouncedSearch
                onSearch={changeSearch}
                value={search}
                placeholder="Search programs..."
                className="programs-filter-bar__search"
              />

              <div className="programs-refine" ref={refineRef}>
                <button
                  type="button"
                  className={`programs-refine__btn${activeRefineCount > 0 ? ' programs-refine__btn--active' : ''}`}
                  onClick={() => setRefineOpen((o) => !o)}
                  aria-expanded={refineOpen}
                  aria-haspopup="true"
                >
                  <svg className="programs-refine__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                  </svg>
                  Refine
                  {activeRefineCount > 0 && (
                    <span className="programs-refine__badge">{activeRefineCount}</span>
                  )}
                </button>

                {refineOpen && (
                  <div className="programs-refine__panel" role="dialog" aria-label="Refine programs">
                    <div className="programs-refine__col">
                      <p className="programs-refine__heading">Program Status</p>
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <label key={value} className="programs-refine__row">
                          <input
                            type="checkbox"
                            className="programs-refine__checkbox"
                            checked={statusFilters.has(value)}
                            onChange={() => toggleStatus(value)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>

                    <div className="programs-refine__divider" />

                    <div className="programs-refine__col">
                      <p className="programs-refine__heading">Sort</p>
                      {SORT_OPTIONS.map(({ value, label }) => (
                        <label key={value} className="programs-refine__row">
                          <input
                            type="radio"
                            className="programs-refine__radio"
                            name="programs-sort"
                            checked={effectiveSortOrder === value}
                            onChange={() => changeSortOrder(value)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {renderBody()}
        </div>
      </main>
      <FooterSlot />
    </>
  );
};

export default ProgramsListPage;
