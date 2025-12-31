import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { transactionsAPI } from '../services/api';
import type { Transaction } from '../types';
import AddTransaction from '../components/AddTransaction';
import TransactionList from '../components/TransactionList';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    try {
      const data = await transactionsAPI.getAll();
      setTransactions(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleTransactionAdded = (transaction: Transaction) => {
    setTransactions([transaction, ...transactions]);
  };

  const handleTransactionUpdated = (updated: Transaction) => {
    setTransactions(
      transactions.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleTransactionDeleted = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Financial Tracker</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.email}</p>
            </div>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AddTransaction onTransactionAdded={handleTransactionAdded} />

            <div className="card mt-6">
              <h3 className="font-semibold mb-2">Mobile App</h3>
              <p className="text-sm text-gray-600 mb-2">
                Install the companion app to automatically track transactions from banking notifications.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600">iOS</p>
                  <p className="text-sm font-medium">Coming Soon</p>
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600">Android</p>
                  <p className="text-sm font-medium">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">Loading transactions...</p>
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                onTransactionUpdated={handleTransactionUpdated}
                onTransactionDeleted={handleTransactionDeleted}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
