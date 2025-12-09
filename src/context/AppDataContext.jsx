import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { fetchUploads, uploadReceipt, processReceipt } from '../api/uploads';
import { fetchDashboard } from '../api/dashboard';

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [receipts, setReceipts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [errors, setErrors] = useState({ receipts: null, dashboard: null });

  const loadReceipts = useCallback(async () => {
    setLoadingReceipts(true);
    setErrors((e) => ({ ...e, receipts: null }));
    try {
      const data = await fetchUploads();
      setReceipts(data);
    } catch (err) {
      setErrors((e) => ({ ...e, receipts: err.message || 'Failed to load receipts' }));
    } finally {
      setLoadingReceipts(false);
    }
  }, []);

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
    loadReceipts();
    loadDashboard();
  }, [loadReceipts, loadDashboard]);

  const addReceipt = (receipt) => setReceipts((prev) => [receipt, ...prev]);

  const uploadAndProcess = async (file) => {
    const uploadRes = await uploadReceipt(file);
    addReceipt(uploadRes.receipt);
    const processed = await processReceipt(uploadRes.receipt.id);
    return { uploadRes, processed };
  };

  const value = useMemo(
    () => ({
      receipts,
      dashboard,
      loadingReceipts,
      loadingDashboard,
      errors,
      loadReceipts,
      loadDashboard,
      uploadAndProcess
    }),
    [receipts, dashboard, loadingReceipts, loadingDashboard, errors]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
};

