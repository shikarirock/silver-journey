import { useState } from 'react';
import { format } from 'date-fns';
import type { Transaction } from '../types';
import { transactionsAPI } from '../services/api';
import EditTransactionModal from './EditTransactionModal';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionUpdated: (transaction: Transaction) => void;
  onTransactionDeleted: (id: number) => void;
}

const categoryColors: Record<string, string> = {
  food: 'bg-orange-100 text-orange-800',
  transport: 'bg-blue-100 text-blue-800',
  shopping: 'bg-purple-100 text-purple-800',
  entertainment: 'bg-pink-100 text-pink-800',
  bills: 'bg-red-100 text-red-800',
  health: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

const sourceIcons: Record<string, string> = {
  manual: '✍️',
  notification: '📱',
};

export default function TransactionList({
  transactions,
  onTransactionUpdated,
  onTransactionDeleted,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    setDeletingId(id);
    try {
      await transactionsAPI.delete(id);
      onTransactionDeleted(id);
    } catch (err) {
      alert('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-primary-600">${totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No transactions yet</p>
            <p className="text-sm">Add your first transaction above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg" title={transaction.source}>
                        {sourceIcons[transaction.source]}
                      </span>
                      <h3 className="font-semibold text-gray-900">{transaction.merchant}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          categoryColors[transaction.category] || categoryColors.other
                        }`}
                      >
                        {transaction.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-gray-900">
                      ${transaction.amount.toFixed(2)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingId === transaction.id}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === transaction.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdate={onTransactionUpdated}
        />
      )}
    </>
  );
}
