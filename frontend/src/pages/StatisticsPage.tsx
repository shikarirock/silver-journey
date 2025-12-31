import type { Transaction } from '../types';

interface StatisticsPageProps {
  transactions: Transaction[];
}

export default function StatisticsPage({ transactions }: StatisticsPageProps) {
  // Calculate statistics
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const averageTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;

  // Group by category
  const byCategory = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Group by month
  const byMonth = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    acc[month] = (acc[month] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    food: 'bg-orange-500',
    transport: 'bg-blue-500',
    shopping: 'bg-purple-500',
    entertainment: 'bg-pink-500',
    bills: 'bg-red-500',
    health: 'bg-green-500',
    other: 'bg-gray-500',
  };

  const maxCategoryAmount = Math.max(...Object.values(byCategory), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-3xl font-bold text-primary-600">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{transactions.length} transactions</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600">Average Transaction</p>
          <p className="text-3xl font-bold text-primary-600">${averageTransaction.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Per transaction</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-600">Top Category</p>
          <p className="text-3xl font-bold text-primary-600 capitalize">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ${Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[1]?.toFixed(2) || 0}
          </p>
        </div>
      </div>

      {/* Spending by Category */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
        <div className="space-y-3">
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => (
              <div key={category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="text-gray-600">
                    ${amount.toFixed(2)} ({((amount / totalSpent) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${categoryColors[category] || 'bg-gray-500'}`}
                    style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Spending by Month */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Spending by Month</h3>
        <div className="space-y-3">
          {Object.entries(byMonth)
            .reverse()
            .slice(0, 12)
            .map(([month, amount]) => (
              <div key={month} className="flex justify-between items-center">
                <span className="font-medium">{month}</span>
                <span className="text-gray-900 font-semibold">${amount.toFixed(2)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Transaction Sources */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Transaction Sources</h3>
        <div className="grid grid-cols-3 gap-4">
          {['manual', 'notification', 'recurring'].map((source) => {
            const count = transactions.filter((t) => t.source === source).length;
            const percentage = transactions.length > 0 ? (count / transactions.length) * 100 : 0;
            return (
              <div key={source} className="text-center">
                <p className="text-2xl font-bold text-primary-600">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{source}</p>
                <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
