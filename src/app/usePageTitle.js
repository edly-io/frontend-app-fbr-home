import { useEffect } from 'react';
import { getConfig } from '@edx/frontend-platform';

/** Sets the browser tab title to the given parts followed by the site name, e.g. "Calendar | Tax Program | FBR". */
const usePageTitle = (...parts) => {
  const title = [...parts, getConfig().SITE_NAME].filter(Boolean).join(' | ');
  useEffect(() => {
    document.title = title;
  }, [title]);
};

export default usePageTitle;
