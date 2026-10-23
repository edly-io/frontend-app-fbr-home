import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchProgramCourses } from '@edly-io/frontend-component-fbr';
import {
  getProgram,
  getPrograms,
  getLearnerCourseMap,
  getMyCertificate,
  getCertificateVerification,
} from './api';

/** One page of programs; the previous page stays on screen while the next loads. */
export const usePrograms = (query) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['programs', query],
    queryFn: () => getPrograms(query),
    placeholderData: keepPreviousData,
  });
  return {
    programs: data?.results ?? [],
    count: data?.count ?? 0,
    numPages: data?.numPages ?? 1,
    loading: isLoading,
    error: error ? (error.message || 'Failed to load programs') : '',
  };
};

/** A single program by key. `notFound` covers both a missing program and one outside the caller's scope. */
export const useProgram = (programKey) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['program', programKey],
    queryFn: () => getProgram(programKey),
    enabled: !!programKey,
    retry: false,
  });
  return {
    program: data ?? null,
    loading: isLoading,
    error: error ? (error.message || 'Failed to load program') : '',
    notFound: error?.response?.status === 404,
  };
};

export const useProgramCourses = (programKey) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!programKey) { return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchProgramCourses(programKey);
        if (!cancelled) { setCourses(data); }
      } catch (err) {
        if (!cancelled) { setError(err?.message || 'Failed to load courses'); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [programKey]);

  return { courses, loading, error };
};

export const useMyCertificate = (programKey) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!programKey) { return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyCertificate(programKey);
        if (!cancelled) { setCertificate(data); }
      } catch (err) {
        if (cancelled) { return; }
        // 404 = this learner has no active certificate for the program (the
        // normal "not issued yet" case), distinct from a real load failure.
        if (err?.response?.status === 404) { setNotFound(true); } else { setError(err?.message || 'Failed to load certificate'); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [programKey]);

  return {
    certificate, loading, notFound, error,
  };
};

// Waits (no request) until a certificate number is known.
export const useCertificateVerification = (certificateNumber) => {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!certificateNumber) { return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getCertificateVerification(certificateNumber);
        if (!cancelled) { setVerification(data); }
      } catch (err) {
        if (!cancelled) { setError(err?.message || 'Failed to verify certificate'); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [certificateNumber]);

  return { verification, loading, error };
};

export const useLearnerCourseMap = () => {
  const [courseMap, setCourseMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const map = await getLearnerCourseMap();
        if (!cancelled) { setCourseMap(map); }
      } catch {
        // Learner enrichment data is optional — degrade gracefully
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { courseMap, loading };
};
