import { useState } from 'react';
import { transactionsAPI } from '../services/api';
import type { Transaction } from '../types';

interface AddTransactionProps {
  onTransactionAdded: (transaction: Transaction) => void;
}

export default function AddTransaction({ onTransactionAdded }: AddTransactionProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setError('');
    setLoading(true);

    try {
      const transaction = await transactionsAPI.createManual({ text });
      onTransactionAdded(transaction);
      setText('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="transaction-text" className="block text-sm font-medium text-gray-700 mb-1">
            Describe your transaction
          </label>
          <input
            id="transaction-text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
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

        <button type="submit" className="btn-primary w-full" disabled={loading || !text.trim()}>
          {loading ? 'Processing...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
}
