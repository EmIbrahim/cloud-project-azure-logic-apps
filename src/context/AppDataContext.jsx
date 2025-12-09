import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { fetchDashboard } from '../api/dashboard';

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [errors, setErrors] = useState({ dashboard: null });

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setErrors((e) => ({ ...e, dashboard: null }));
    try {
      const data = await fetchDashboard();
      setDashboard(data);
    } catch (err) {
      setErrors((e) => ({ ...e, dashboard: err.message || 'Failed to load dashboard' }));
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const value = useMemo(
    () => ({
      dashboard,
      loadingDashboard,
      errors,
      loadDashboard
    }),
    [dashboard, loadingDashboard, errors]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
};

