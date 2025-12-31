import { useState } from 'react';
import { transactionsAPI, recurringAPI } from '../services/api';
import type { Transaction, RecurringTransaction } from '../types';

interface AddTransactionTabsProps {
  onTransactionAdded: (transaction: Transaction) => void;
  onRecurringAdded?: (recurring: RecurringTransaction) => void;
}

const categories = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'other'];
const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function AddTransactionTabs({ onTransactionAdded, onRecurringAdded }: AddTransactionTabsProps) {
  const [activeTab, setActiveTab] = useState<'natural' | 'manual' | 'recurring'>('natural');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Natural language state
  const [naturalText, setNaturalText] = useState('');

  // Manual entry state
  const [manualData, setManualData] = useState({
    amount: '',
    merchant: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Recurring entry state
  const [recurringData, setRecurringData] = useState({
    amount: '',
    merchant: '',
    category: '',
    description: '',
    frequency: 'monthly' as const,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const handleNaturalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalText.trim()) return;

    setError('');
    setLoading(true);

    try {
      const transaction = await transactionsAPI.createManual({ text: naturalText });
      onTransactionAdded(transaction);
      setNaturalText('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualData.amount || !manualData.merchant || !manualData.date) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const transaction = await transactionsAPI.createDirect({
        amount: parseFloat(manualData.amount),
        merchant: manualData.merchant,
        category: manualData.category || undefined,
        date: manualData.date,
        description: manualData.description || undefined,
      });
      onTransactionAdded(transaction);
      setManualData({
        amount: '',
        merchant: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recurringData.amount || !recurringData.merchant || !recurringData.start_date) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await recurringAPI.create({
        amount: parseFloat(recurringData.amount),
        merchant: recurringData.merchant,
        category: recurringData.category || undefined,
        description: recurringData.description || undefined,
        frequency: recurringData.frequency,
        start_date: recurringData.start_date,
        end_date: recurringData.end_date || undefined,
      });

      if (onRecurringAdded) {
        onRecurringAdded(result);
      }

      // Also trigger a refresh of transactions since it may have generated some
      window.location.reload();

      setRecurringData({
        amount: '',
        merchant: '',
        category: '',
        description: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create recurring transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('natural')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'natural'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Natural Language
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recurring')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'recurring'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recurring
        </button>
      </div>

      {/* Natural Language Tab */}
      {activeTab === 'natural' && (
        <form onSubmit={handleNaturalSubmit} className="space-y-4">
          <div>
            <label htmlFor="natural-text" className="block text-sm font-medium text-gray-700 mb-1">
              Describe your transaction
            </label>
            <input
              id="natural-text"
              type="text"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder="e.g., 10 bucks at starbucks this morning"
              className="input"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              AI will parse the amount, merchant, category, and date
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !naturalText.trim()}
          >
            {loading ? 'Processing...' : 'Add Transaction'}
          </button>
        </form>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="manual-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                id="manual-amount"
                type="number"
                step="0.01"
                value={manualData.amount}
                onChange={(e) => setManualData({ ...manualData, amount: e.target.value })}
                placeholder="0.00"
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="manual-merchant" className="block text-sm font-medium text-gray-700 mb-1">
                Merchant *
              </label>
              <input
                id="manual-merchant"
                type="text"
                value={manualData.merchant}
                onChange={(e) => setManualData({ ...manualData, merchant: e.target.value })}
                placeholder="Starbucks"
                className="input"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="manual-category" className="block text-sm font-medium text-gray-700 mb-1">
                Category (auto if blank)
              </label>
              <select
                id="manual-category"
                value={manualData.category}
                onChange={(e) => setManualData({ ...manualData, category: e.target.value })}
                className="input"
                disabled={loading}
              >
                <option value="">Auto-categorize</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="manual-date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                id="manual-date"
                type="date"
                value={manualData.date}
                onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                className="input"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="manual-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="manual-description"
              value={manualData.description}
              onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
              placeholder="Optional notes..."
              className="input"
              rows={2}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      )}

      {/* Recurring Tab */}
      {activeTab === 'recurring' && (
        <form onSubmit={handleRecurringSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurring-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                id="recurring-amount"
                type="number"
                step="0.01"
                value={recurringData.amount}
                onChange={(e) => setRecurringData({ ...recurringData, amount: e.target.value })}
                placeholder="0.00"
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="recurring-merchant" className="block text-sm font-medium text-gray-700 mb-1">
                Merchant *
              </label>
              <input
                id="recurring-merchant"
                type="text"
                value={recurringData.merchant}
                onChange={(e) => setRecurringData({ ...recurringData, merchant: e.target.value })}
                placeholder="Netflix"
                className="input"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurring-category" className="block text-sm font-medium text-gray-700 mb-1">
                Category (auto if blank)
              </label>
              <select
                id="recurring-category"
                value={recurringData.category}
                onChange={(e) => setRecurringData({ ...recurringData, category: e.target.value })}
                className="input"
                disabled={loading}
              >
                <option value="">Auto-categorize</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="recurring-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Frequency *
              </label>
              <select
                id="recurring-frequency"
                value={recurringData.frequency}
                onChange={(e) =>
                  setRecurringData({
                    ...recurringData,
                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly',
                  })
                }
                className="input"
                disabled={loading}
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurring-start" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                id="recurring-start"
                type="date"
                value={recurringData.start_date}
                onChange={(e) => setRecurringData({ ...recurringData, start_date: e.target.value })}
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="recurring-end" className="block text-sm font-medium text-gray-700 mb-1">
                End Date (optional)
              </label>
              <input
                id="recurring-end"
                type="date"
                value={recurringData.end_date}
                onChange={(e) => setRecurringData({ ...recurringData, end_date: e.target.value })}
                className="input"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="recurring-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="recurring-description"
              value={recurringData.description}
              onChange={(e) => setRecurringData({ ...recurringData, description: e.target.value })}
              placeholder="Optional notes..."
              className="input"
              rows={2}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Recurring Transaction'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Transactions will automatically appear on scheduled dates
          </p>
        </form>
      )}
    </div>
  );
}
