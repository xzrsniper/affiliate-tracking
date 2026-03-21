import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SITE_PAGE_PATHS, sitePathMatchesPage } from '../config/siteContentFields.js';

const STORAGE_KEY = 'lehko_site_text_edit_v1';

export function readSiteTextEditSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.active || !data?.pageKey) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSession(data) {
  if (data == null) sessionStorage.removeItem(STORAGE_KEY);
  else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const SiteTextEditContext = createContext(null);

export function SiteTextEditProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => readSiteTextEditSession());

  const refresh = useCallback(() => {
    setSession(readSiteTextEditSession());
  }, []);

  const startEdit = useCallback(
    (pageKey) => {
      const path = SITE_PAGE_PATHS[pageKey];
      if (!path) return;
      writeSession({ active: true, pageKey });
      setSession(readSiteTextEditSession());
      navigate(path);
    },
    [navigate]
  );

  const finishEdit = useCallback(() => {
    writeSession(null);
    setSession(null);
    navigate('/admin');
  }, [navigate]);

  const cancelEdit = useCallback(() => {
    writeSession(null);
    setSession(null);
    navigate('/admin');
  }, [navigate]);

  const pageBeingEdited = session?.pageKey ?? null;
  const isEditingThisPage = Boolean(
    session?.active && pageBeingEdited && sitePathMatchesPage(location.pathname, pageBeingEdited)
  );

  const value = useMemo(
    () => ({
      session,
      pageBeingEdited,
      isEditingThisPage,
      startEdit,
      finishEdit,
      cancelEdit,
      refresh
    }),
    [session, pageBeingEdited, isEditingThisPage, startEdit, finishEdit, cancelEdit, refresh]
  );

  return <SiteTextEditContext.Provider value={value}>{children}</SiteTextEditContext.Provider>;
}

export function useSiteTextEdit() {
  const ctx = useContext(SiteTextEditContext);
  if (!ctx) {
    throw new Error('useSiteTextEdit must be used within SiteTextEditProvider');
  }
  return ctx;
}
