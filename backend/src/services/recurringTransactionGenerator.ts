import {
  getAllActiveRecurringTransactions,
  getNextOccurrenceDate,
  updateLastGeneratedDate,
  calculateOccurrenceCount,
} from '../models/recurringTransaction';
import { createTransaction } from '../models/transaction';
import type { RecurringTransaction } from '../db/schema';

export interface GenerationResult {
  recurringTransactionId: number;
  transactionsGenerated: number;
  lastDate: string | null;
}

export interface BackfillResult {
  recurringTransactionId: number;
  transactionsGenerated: number;
  estimatedCount: number;
  startDate: string;
  endDate: string;
}

/**
 * Generate transactions for a single recurring transaction up to today
 */
export function generateTransactionsForRecurring(
  recurringTx: RecurringTransaction,
  upToDate?: string
): GenerationResult {
  const today = upToDate || new Date().toISOString().split('T')[0];
  let transactionsGenerated = 0;
  let nextDate = getNextOccurrenceDate(recurringTx);

  while (nextDate && nextDate <= today) {
    // Create the transaction
    createTransaction({
      user_id: recurringTx.user_id,
      amount: recurringTx.amount,
      merchant: recurringTx.merchant,
      category: recurringTx.category,
      date: nextDate,
      description: recurringTx.description || `Recurring: ${recurringTx.merchant}`,
      source: 'recurring',
      raw_text: null,
    });

    transactionsGenerated++;

    // Update last generated date
    updateLastGeneratedDate(recurringTx.id, nextDate);

    // Update recurring transaction object for next iteration
    recurringTx.last_generated_date = nextDate;

    // Get next occurrence
    nextDate = getNextOccurrenceDate(recurringTx);
  }

  return {
    recurringTransactionId: recurringTx.id,
    transactionsGenerated,
    lastDate: recurringTx.last_generated_date || null,
  };
}

/**
 * Generate all pending recurring transactions for all users
 */
export function generateAllPendingRecurringTransactions(): GenerationResult[] {
  const allRecurring = getAllActiveRecurringTransactions();
  const results: GenerationResult[] = [];

  for (const recurringTx of allRecurring) {
    const result = generateTransactionsForRecurring(recurringTx);
    if (result.transactionsGenerated > 0) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Backfill past recurring transactions from start_date to today
 * Returns estimation info before generating
 */
export function estimateBackfillCount(
  recurringTx: RecurringTransaction,
  endDate?: string
): number {
  const today = endDate || new Date().toISOString().split('T')[0];
  const startDate = recurringTx.last_generated_date || recurringTx.start_date;

  return calculateOccurrenceCount(startDate, today, recurringTx.frequency);
}

/**
 * Perform backfill for a recurring transaction
 */
export function backfillRecurringTransaction(
  recurringTx: RecurringTransaction,
  endDate?: string,
  force: boolean = false
): BackfillResult {
  const today = endDate || new Date().toISOString().split('T')[0];
  const startDate = recurringTx.last_generated_date || recurringTx.start_date;

  const estimatedCount = estimateBackfillCount(recurringTx, today);

  // Warn if generating more than 100 transactions
  if (estimatedCount > 100 && !force) {
    throw new Error(
      `Backfill would generate ${estimatedCount} transactions. This is a large number. Please confirm by passing force=true.`
    );
  }

  const result = generateTransactionsForRecurring(recurringTx, today);

  return {
    recurringTransactionId: recurringTx.id,
    transactionsGenerated: result.transactionsGenerated,
    estimatedCount,
    startDate,
    endDate: today,
  };
}

/**
 * Schedule this to run daily (e.g., via cron job)
 */
export function runDailyRecurringTransactionGeneration(): void {
  console.log('Running daily recurring transaction generation...');
  const results = generateAllPendingRecurringTransactions();

  if (results.length > 0) {
    console.log(`Generated transactions for ${results.length} recurring items`);
    results.forEach((result) => {
      console.log(
        `  - Recurring TX ${result.recurringTransactionId}: ${result.transactionsGenerated} transactions`
      );
    });
  } else {
    console.log('No pending recurring transactions to generate');
  }
}
