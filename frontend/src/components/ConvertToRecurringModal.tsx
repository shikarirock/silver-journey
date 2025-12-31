import { useState } from 'react';
import type { Transaction } from '../types';
import { recurringAPI } from '../services/api';

interface ConvertToRecurringModalProps {
  transaction: Transaction;
  onClose: () => void;
  onConverted: () => void;
}

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function ConvertToRecurringModal({
  transaction,
  onClose,
  onConverted,
}: ConvertToRecurringModalProps) {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(transaction.date);
  const [endDate, setEndDate] = useState('');
  const [backfill, setBackfill] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState<{ count: number } | null>(null);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();
    setError('');
    setWarning(null);
    setLoading(true);

    try {
      await recurringAPI.convertFromTransaction({
        transaction_id: transaction.id,
        frequency,
        start_date: startDate,
        end_date: endDate || undefined,
        backfill,
        force,
      });

      onConverted();
      onClose();
    } catch (err: any) {
      const errorData = err.response?.data;

      // Check for large backfill warning
      if (errorData?.estimated_count && !force) {
        setWarning({ count: errorData.estimated_count });
        setShowForceConfirm(true);
      } else {
        setError(errorData?.error || 'Failed to convert to recurring');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Convert to Recurring Transaction</h2>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>Original Transaction:</strong>
            <br />
            ${transaction.amount.toFixed(2)} at {transaction.merchant}
            <br />
            Date: {new Date(transaction.date).toLocaleDateString()}
          </p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="input"
              required
            >
              {frequencies.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="backfill"
              checked={backfill}
              onChange={(e) => setBackfill(e.target.checked)}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <label htmlFor="backfill" className="ml-2 text-sm text-gray-700">
              Backfill past occurrences up to today
            </label>
          </div>

          {backfill && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
              ⚠️ Backfilling will automatically create transactions from the start date to today
            </div>
          )}

          {warning && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
              <p className="text-sm text-orange-800 font-medium mb-2">
                Warning: Large Number of Transactions
              </p>
              <p className="text-sm text-orange-700">
                This will generate approximately <strong>{warning.count} transactions</strong>.
                Are you sure you want to proceed?
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {showForceConfirm ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Converting...' : 'Proceed Anyway'}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Converting...' : 'Convert'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
