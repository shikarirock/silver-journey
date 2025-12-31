import { useState, useEffect } from 'react';
import { fireAPI } from '../services/api';
import type { FireProjection, FireSettings, Investment, PlannedTransaction } from '../types';

export default function FirePlannerPage() {
  const [projection, setProjection] = useState<FireProjection | null>(null);
  const [settings, setSettings] = useState<FireSettings | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [plannedTransactions, setPlannedTransactions] = useState<PlannedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'investments' | 'planned'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [proj, sett, inv, planned] = await Promise.all([
        fireAPI.getProjection(),
        fireAPI.getSettings(),
        fireAPI.getInvestments(),
        fireAPI.getPlannedTransactions(),
      ]);
      setProjection(proj);
      setSettings(sett);
      setInvestments(inv);
      setPlannedTransactions(planned);
    } catch (error) {
      console.error('Failed to load FIRE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (data: Partial<FireSettings>) => {
    try {
      const updated = await fireAPI.updateSettings(data);
      setSettings(updated);
      // Reload projection
      const proj = await fireAPI.getProjection();
      setProjection(proj);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleAddInvestment = async () => {
    const name = prompt('Investment name:');
    const value = prompt('Current value:');
    const returnRate = prompt('Expected annual return (%):');

    if (name && value && returnRate) {
      try {
        await fireAPI.createInvestment({
          name,
          asset_type: 'stocks',
          current_value: parseFloat(value),
          expected_return: parseFloat(returnRate),
        });
        await loadData();
      } catch (error) {
        alert('Failed to add investment');
      }
    }
  };

  const handleAddPlanned = async () => {
    const name = prompt('Transaction name (e.g., House Purchase, State Pension):');
    const amount = prompt('Amount:');
    const type = prompt('Type (income/expense):') as 'income' | 'expense';
    const startDate = prompt('Start date (YYYY-MM-DD):');

    if (name && amount && type && startDate) {
      try {
        await fireAPI.createPlannedTransaction({
          name,
          amount: parseFloat(amount),
          type,
          is_recurring: false,
          start_date: startDate,
          category: 'other',
          description: '',
        });
        await loadData();
      } catch (error) {
        alert('Failed to add planned transaction');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading FIRE projection...</div>;
  }

  if (!projection || !settings) {
    return <div className="text-center py-12">No FIRE data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <p className="text-sm opacity-90">FIRE Number</p>
          <p className="text-3xl font-bold mt-1">${projection.fire_number.toLocaleString()}</p>
          <p className="text-xs mt-1 opacity-75">Amount needed to retire</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-90">Current Portfolio</p>
          <p className="text-3xl font-bold mt-1">${projection.current_portfolio_value.toLocaleString()}</p>
          <p className="text-xs mt-1 opacity-75">{projection.progress_percentage.toFixed(1)}% to FIRE</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-90">Years to FIRE</p>
          <p className="text-3xl font-bold mt-1">{projection.can_retire_now ? '0' : projection.years_to_retirement.toFixed(1)}</p>
          <p className="text-xs mt-1 opacity-75">
            {projection.can_retire_now ? 'You can retire now!' : `Retire at age ${projection.projected_retirement_age}`}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-sm opacity-90">Annual Expenses</p>
          <p className="text-3xl font-bold mt-1">${projection.annual_expenses.toLocaleString()}</p>
          <p className="text-xs mt-1 opacity-75">Based on {settings.withdrawal_rate}% rule</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <h3 className="font-semibold mb-2">FIRE Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-primary-600 h-4 rounded-full transition-all"
            style={{ width: `${Math.min(projection.progress_percentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          ${projection.current_portfolio_value.toLocaleString()} / ${projection.fire_number.toLocaleString()}
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('overview')}
          className={`pb-2 px-4 font-medium ${
            activeSection === 'overview'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection('investments')}
          className={`pb-2 px-4 font-medium ${
            activeSection === 'investments'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Investments ({investments.length})
        </button>
        <button
          onClick={() => setActiveSection('planned')}
          className={`pb-2 px-4 font-medium ${
            activeSection === 'planned'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Planned Transactions ({plannedTransactions.length})
        </button>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">FIRE Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.withdrawal_rate}
                  onChange={(e) => handleUpdateSettings({ withdrawal_rate: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Inflation (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.expected_inflation}
                  onChange={(e) => handleUpdateSettings({ expected_inflation: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Age
                </label>
                <input
                  type="number"
                  value={settings.current_age}
                  onChange={(e) => handleUpdateSettings({ current_age: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Retirement Age
                </label>
                <input
                  type="number"
                  value={settings.retirement_age}
                  onChange={(e) => handleUpdateSettings({ retirement_age: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Income:</span>
                <span className="font-semibold">${projection.annual_income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Expenses:</span>
                <span className="font-semibold">${projection.annual_expenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Net Annual Savings:</span>
                <span className={`font-semibold ${projection.net_annual_savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${projection.net_annual_savings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Savings Needed:</span>
                <span className="font-semibold">${projection.monthly_savings_needed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Years to Retirement:</span>
                <span className="font-semibold">
                  {projection.can_retire_now ? 'Ready Now!' : `${projection.years_to_retirement.toFixed(1)} years`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investments Section */}
      {activeSection === 'investments' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Investment Portfolio</h3>
            <button onClick={handleAddInvestment} className="btn-primary">
              + Add Investment
            </button>
          </div>

          {investments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No investments yet. Add your first investment!</p>
          ) : (
            <div className="space-y-3">
              {investments.map((inv) => (
                <div key={inv.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{inv.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{inv.asset_type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${inv.current_value.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{inv.expected_return}% return</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Portfolio:</span>
                  <span>${investments.reduce((sum, i) => sum + i.current_value, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Planned Transactions Section */}
      {activeSection === 'planned' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Planned Future Transactions</h3>
            <button onClick={handleAddPlanned} className="btn-primary">
              + Add Planned Transaction
            </button>
          </div>

          {plannedTransactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No planned transactions. Add future income or expenses (e.g., house purchase, state pension).
            </p>
          ) : (
            <div className="space-y-3">
              {plannedTransactions.map((pt) => (
                <div key={pt.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{pt.name}</h4>
                      <p className="text-sm text-gray-600">
                        {pt.is_recurring ? `${pt.frequency} recurring` : 'One-time'} • Starts: {new Date(pt.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${pt.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {pt.type === 'income' ? '+' : '-'}${pt.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{pt.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
