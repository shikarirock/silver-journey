import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  createRecurringTransaction,
  getRecurringTransactionsByUser,
  getRecurringTransactionById,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '../models/recurringTransaction';
import {
  generateTransactionsForRecurring,
  estimateBackfillCount,
  backfillRecurringTransaction,
  generateAllPendingRecurringTransactions,
} from '../services/recurringTransactionGenerator';
import { createTransaction, getTransactionById } from '../models/transaction';
import { categorizeMerchant } from '../services/llm';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const createRecurringSchema = z.object({
  amount: z.number().positive(),
  merchant: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string(),
  end_date: z.string().optional(),
});

const updateRecurringSchema = z.object({
  amount: z.number().positive().optional(),
  merchant: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional(),
});

const convertToRecurringSchema = z.object({
  transaction_id: z.number(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  backfill: z.boolean().optional(),
  force: z.boolean().optional(),
});

// Get all recurring transactions for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const recurring = getRecurringTransactionsByUser(userId);
    res.json({ recurring_transactions: recurring });
  } catch (error) {
    console.error('Get recurring transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create recurring transaction
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = createRecurringSchema.parse(req.body);

    // Auto-categorize if category not provided
    let category = data.category;
    if (!category) {
      category = await categorizeMerchant(data.merchant);
    }

    const recurring = createRecurringTransaction({
      user_id: userId,
      amount: data.amount,
      merchant: data.merchant,
      category,
      description: data.description,
      frequency: data.frequency,
      start_date: data.start_date,
      end_date: data.end_date,
    });

    // Generate any transactions up to today
    const result = generateTransactionsForRecurring(recurring);

    res.status(201).json({
      recurring_transaction: recurring,
      transactions_generated: result.transactionsGenerated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Create recurring transaction error:', error);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
});

// Update recurring transaction
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    const updates = updateRecurringSchema.parse(req.body);

    const recurring = updateRecurringTransaction(id, userId, updates);

    if (!recurring) {
      res.status(404).json({ error: 'Recurring transaction not found' });
      return;
    }

    res.json({ recurring_transaction: recurring });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Update recurring transaction error:', error);
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
});

// Delete recurring transaction
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);

    const deleted = deleteRecurringTransaction(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Recurring transaction not found' });
      return;
    }

    res.json({ message: 'Recurring transaction deactivated successfully' });
  } catch (error) {
    console.error('Delete recurring transaction error:', error);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
});

// Convert existing transaction to recurring
router.post('/convert', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = convertToRecurringSchema.parse(req.body);

    // Get the original transaction
    const transaction = getTransactionById(data.transaction_id);
    if (!transaction || transaction.user_id !== userId) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Auto-categorize based on merchant
    const category = await categorizeMerchant(transaction.merchant);

    // Create recurring transaction
    const startDate = data.start_date || transaction.date;
    const recurring = createRecurringTransaction({
      user_id: userId,
      amount: transaction.amount,
      merchant: transaction.merchant,
      category,
      description: transaction.description,
      frequency: data.frequency,
      start_date: startDate,
      end_date: data.end_date,
    });

    let backfillResult = null;

    // Backfill if requested
    if (data.backfill) {
      const today = new Date().toISOString().split('T')[0];
      const estimatedCount = estimateBackfillCount(recurring, today);

      if (estimatedCount > 100 && !data.force) {
        res.status(400).json({
          error: 'Backfill would generate too many transactions',
          estimated_count: estimatedCount,
          message: `This would generate ${estimatedCount} transactions. Please confirm by setting force=true.`,
        });
        return;
      }

      backfillResult = backfillRecurringTransaction(recurring, today, data.force);
    }

    res.status(201).json({
      recurring_transaction: recurring,
      original_transaction: transaction,
      backfill: backfillResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    if (error instanceof Error && error.message.includes('Backfill would generate')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Convert to recurring error:', error);
    res.status(500).json({ error: 'Failed to convert to recurring transaction' });
  }
});

// Generate pending recurring transactions (can be called manually or via cron)
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const results = generateAllPendingRecurringTransactions();

    res.json({
      message: 'Recurring transactions generated successfully',
      results,
    });
  } catch (error) {
    console.error('Generate recurring transactions error:', error);
    res.status(500).json({ error: 'Failed to generate recurring transactions' });
  }
});

export default router;
