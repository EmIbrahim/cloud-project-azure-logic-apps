import { mockReceipts } from '../data/mockUploads';
import { mockDashboard } from '../data/mockDashboard';
import { delay } from '../utils/delay';

let receipts = [...mockReceipts];

const maybeFail = (probability = 0.08) => Math.random() < probability;

const computeDashboardFromReceipts = () => {
  const vendorMap = new Map();
  const dailyMap = new Map();

  receipts.forEach((r) => {
    vendorMap.set(r.MerchantName, (vendorMap.get(r.MerchantName) || 0) + r.TotalAmount);
    dailyMap.set(r.TransactionDate, (dailyMap.get(r.TransactionDate) || 0) + r.TotalAmount);
  });

  const totalSpendByVendor = Array.from(vendorMap.entries()).map(([vendor, amount]) => ({
    vendor,
    amount: Number(amount.toFixed(2))
  }));
  const dailyExpenseTrend = Array.from(dailyMap.entries()).map(([date, amount]) => ({
    date,
    amount: Number(amount.toFixed(2))
  }));

  // Reuse existing mock data for approvals and salary comparison.
  return {
    totalSpendByVendor: totalSpendByVendor.length ? totalSpendByVendor : mockDashboard.totalSpendByVendor,
    dailyExpenseTrend: dailyExpenseTrend.length ? dailyExpenseTrend : mockDashboard.dailyExpenseTrend,
    pendingApprovals: mockDashboard.pendingApprovals,
    employeeMonthlySpending: mockDashboard.employeeMonthlySpending
  };
};

export const getReceipts = async () => {
  await delay(500);
  return [...receipts];
};

export const postUpload = async (file) => {
  await delay(900);
  if (maybeFail(0.06)) {
    throw new Error('Mock upload failed (simulated network issue).');
  }
  const total = Number((Math.random() * 400 + 20).toFixed(2));
  const tax = Number((total * 0.08).toFixed(2));
  const tip = Number((total * 0.04).toFixed(2));
  const newReceipt = {
    id: crypto.randomUUID(),
    MerchantName: file?.name || 'Mobile Upload',
    TransactionDate: new Date().toISOString().slice(0, 10),
    TotalAmount: total,
    Tax: tax,
    Tip: tip,
    Category: 'Meals',
    Status: 'Processing'
  };
  receipts = [newReceipt, ...receipts];
  return { message: 'Upload received', receipt: newReceipt };
};

export const getDashboardData = async () => {
  await delay(650);
  if (maybeFail(0.05)) {
    throw new Error('Mock dashboard fetch failed.');
  }
  return computeDashboardFromReceipts();
};

export const triggerLogicApp = async (receiptId) => {
  await delay(750);
  const target = receipts.find((r) => r.id === receiptId);
  if (!target) throw new Error('Receipt not found for processing.');

  // Simulated Logic Apps output that could be ingested by a backend/API.
  return {
    status: 'processed',
    extracted: {
      merchant: target.MerchantName,
      date: target.TransactionDate,
      total: target.TotalAmount,
      tax: target.Tax,
      tip: target.Tip,
      category: target.Category
    },
    // Placeholder where SAS token or Logic App endpoint can be injected later.
    nextStep: 'Send to Azure SQL or Storage via Logic App action'
  };
};

