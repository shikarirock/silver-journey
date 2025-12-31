import { getTransactionsByUser } from '../models/transaction';
import { getPlannedTransactionsByUser, getInvestmentsByUser, getFireSettings } from '../models/fire';
import type { Transaction, PlannedTransaction, Investment, FireSettings } from '../db/schema';

export interface FireProjection {
  current_portfolio_value: number;
  annual_expenses: number;
  annual_income: number;
  net_annual_savings: number;
  years_to_retirement: number;
  fire_number: number; // Amount needed to retire
  progress_percentage: number;
  monthly_savings_needed: number;
  projected_retirement_age: number;
  can_retire_now: boolean;
}

export interface YearlyProjection {
  year: number;
  age: number;
  portfolio_value: number;
  annual_expenses: number;
  annual_income: number;
  withdrawals: number;
}

function calculateAnnualExpensesFromHistory(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0;

  // Get transactions from the last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const recentTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= oneYearAgo;
  });

  // Sum up all expenses (excluding income-like transactions)
  const totalExpenses = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

  // If less than a year of data, extrapolate
  const monthsOfData = Math.min(12, Math.ceil(recentTransactions.length / 30));
  if (monthsOfData < 12 && monthsOfData > 0) {
    return (totalExpenses / monthsOfData) * 12;
  }

  return totalExpenses;
}

function calculatePlannedTransactionAnnualImpact(
  planned: PlannedTransaction[],
  startYear: number = new Date().getFullYear()
): { income: number; expenses: number } {
  let annualIncome = 0;
  let annualExpenses = 0;

  for (const pt of planned) {
    const startDate = new Date(pt.start_date);
    const startTransactionYear = startDate.getFullYear();

    // Skip if this planned transaction hasn't started yet for this projection year
    if (startTransactionYear > startYear) continue;

    // Check if it has ended
    if (pt.end_date) {
      const endDate = new Date(pt.end_date);
      if (endDate.getFullYear() < startYear) continue;
    }

    let annualAmount = 0;

    if (pt.is_recurring) {
      switch (pt.frequency) {
        case 'daily':
          annualAmount = pt.amount * 365;
          break;
        case 'weekly':
          annualAmount = pt.amount * 52;
          break;
        case 'monthly':
          annualAmount = pt.amount * 12;
          break;
        case 'yearly':
          annualAmount = pt.amount;
          break;
      }
    } else {
      // One-time transaction in this year
      if (startTransactionYear === startYear) {
        annualAmount = pt.amount;
      }
    }

    if (pt.type === 'income') {
      annualIncome += annualAmount;
    } else {
      annualExpenses += annualAmount;
    }
  }

  return { income: annualIncome, expenses: annualExpenses };
}

export async function calculateFireProjection(userId: number): Promise<FireProjection> {
  // Get data
  const transactions = getTransactionsByUser(userId, 10000, 0);
  const plannedTransactions = getPlannedTransactionsByUser(userId);
  const investments = getInvestmentsByUser(userId);
  const settings = getFireSettings(userId);

  // Calculate current portfolio value
  const currentPortfolioValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);

  // Calculate annual expenses from history
  const historicalAnnualExpenses = calculateAnnualExpensesFromHistory(transactions);

  // Calculate planned transactions impact
  const plannedImpact = calculatePlannedTransactionAnnualImpact(plannedTransactions);

  // Total annual expenses (historical + planned expenses - planned income)
  const annualExpenses = settings?.target_monthly_expenses
    ? settings.target_monthly_expenses * 12
    : historicalAnnualExpenses + plannedImpact.expenses;

  const annualIncome = plannedImpact.income;
  const netAnnualSavings = annualIncome - annualExpenses;

  // Calculate FIRE number (using 4% or 3% rule)
  const withdrawalRate = (settings?.withdrawal_rate || 4.0) / 100;
  const fireNumber = annualExpenses / withdrawalRate;

  // Calculate progress
  const progressPercentage = (currentPortfolioValue / fireNumber) * 100;

  // Can retire now?
  const canRetireNow = currentPortfolioValue >= fireNumber;

  // Calculate weighted average return
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const weightedReturn =
    totalInvestmentValue > 0
      ? investments.reduce((sum, inv) => {
          const weight = inv.current_value / totalInvestmentValue;
          return sum + weight * inv.expected_return;
        }, 0)
      : 7.0; // Default 7% if no investments

  // Calculate years to retirement
  let yearsToRetirement = 0;
  if (!canRetireNow && netAnnualSavings > 0) {
    // Simulate year by year
    let portfolioValue = currentPortfolioValue;
    const inflationRate = (settings?.expected_inflation || 3.0) / 100;
    const realReturn = (weightedReturn / 100 - inflationRate);

    let currentAnnualExpenses = annualExpenses;
    let currentAnnualSavings = netAnnualSavings;

    while (portfolioValue < fireNumber && yearsToRetirement < 100) {
      yearsToRetirement++;

      // Add savings
      portfolioValue += currentAnnualSavings;

      // Apply investment returns
      portfolioValue *= 1 + realReturn;

      // Adjust for inflation
      currentAnnualExpenses *= 1 + inflationRate;
      currentAnnualSavings *= 1 + inflationRate;

      // Recalculate FIRE number with inflated expenses
      const inflatedFireNumber = currentAnnualExpenses / withdrawalRate;

      if (portfolioValue >= inflatedFireNumber) {
        break;
      }
    }
  }

  // Calculate monthly savings needed to retire by target age
  const currentAge = settings?.current_age || 30;
  const targetRetirementAge = settings?.retirement_age || 65;
  const yearsToTarget = targetRetirementAge - currentAge;

  let monthlySavingsNeeded = 0;
  if (yearsToTarget > 0 && !canRetireNow) {
    // Calculate required monthly savings
    const inflationRate = (settings?.expected_inflation || 3.0) / 100;
    const realReturn = weightedReturn / 100 - inflationRate;
    const monthlyReturn = realReturn / 12;

    // Future value of current portfolio
    const futurePortfolioValue = currentPortfolioValue * Math.pow(1 + realReturn, yearsToTarget);

    // Remaining needed
    const remainingNeeded = fireNumber - futurePortfolioValue;

    if (remainingNeeded > 0 && monthlyReturn > 0) {
      // PMT formula: P = FV * r / ((1 + r)^n - 1)
      const months = yearsToTarget * 12;
      monthlySavingsNeeded =
        (remainingNeeded * monthlyReturn) / (Math.pow(1 + monthlyReturn, months) - 1);
    }
  }

  const projectedRetirementAge = canRetireNow ? currentAge : currentAge + yearsToRetirement;

  return {
    current_portfolio_value: currentPortfolioValue,
    annual_expenses: annualExpenses,
    annual_income: annualIncome,
    net_annual_savings: netAnnualSavings,
    years_to_retirement: yearsToRetirement,
    fire_number: fireNumber,
    progress_percentage: Math.min(progressPercentage, 100),
    monthly_savings_needed: Math.max(monthlySavingsNeeded, 0),
    projected_retirement_age: projectedRetirementAge,
    can_retire_now: canRetireNow,
  };
}

export async function generateYearlyProjections(
  userId: number,
  projectionYears: number = 40
): Promise<YearlyProjection[]> {
  const transactions = getTransactionsByUser(userId, 10000, 0);
  const plannedTransactions = getPlannedTransactionsByUser(userId);
  const investments = getInvestmentsByUser(userId);
  const settings = getFireSettings(userId);

  const currentYear = new Date().getFullYear();
  const currentAge = settings?.current_age || 30;
  const withdrawalRate = (settings?.withdrawal_rate || 4.0) / 100;
  const inflationRate = (settings?.expected_inflation || 3.0) / 100;

  // Calculate weighted average return
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const weightedReturn =
    totalInvestmentValue > 0
      ? investments.reduce((sum, inv) => {
          const weight = inv.current_value / totalInvestmentValue;
          return sum + weight * (inv.expected_return / 100);
        }, 0)
      : 0.07;

  const realReturn = weightedReturn - inflationRate;

  let portfolioValue = investments.reduce((sum, inv) => sum + inv.current_value, 0);
  const historicalExpenses = calculateAnnualExpensesFromHistory(transactions);

  const projections: YearlyProjection[] = [];

  for (let year = 0; year < projectionYears; year++) {
    const projectionYear = currentYear + year;
    const age = currentAge + year;

    // Calculate planned transactions for this year
    const plannedImpact = calculatePlannedTransactionAnnualImpact(
      plannedTransactions,
      projectionYear
    );

    const annualExpenses = settings?.target_monthly_expenses
      ? settings.target_monthly_expenses * 12 * Math.pow(1 + inflationRate, year)
      : (historicalExpenses + plannedImpact.expenses) * Math.pow(1 + inflationRate, year);

    const annualIncome = plannedImpact.income * Math.pow(1 + inflationRate, year);

    // Check if retired (portfolio >= FIRE number)
    const fireNumber = annualExpenses / withdrawalRate;
    const isRetired = portfolioValue >= fireNumber;

    let withdrawals = 0;

    if (isRetired) {
      // In retirement, withdraw based on withdrawal rate
      withdrawals = annualExpenses;
      portfolioValue -= withdrawals;
    } else {
      // Still accumulating, add net savings
      const netSavings = annualIncome - annualExpenses;
      portfolioValue += netSavings;
    }

    // Apply investment returns
    portfolioValue *= 1 + realReturn;

    projections.push({
      year: projectionYear,
      age,
      portfolio_value: Math.max(0, portfolioValue),
      annual_expenses: annualExpenses,
      annual_income: annualIncome,
      withdrawals,
    });

    // Stop if portfolio depleted
    if (portfolioValue <= 0) break;
  }

  return projections;
}
