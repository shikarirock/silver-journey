import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  createTransaction,
  getTransactionsByUser,
  updateTransaction,
  deleteTransaction
} from '../models/transaction';
import { parseTransactionText, categorizeMerchant } from '../services/llm';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const manualTransactionSchema = z.object({
  text: z.string().min(1)
});

const directEntrySchema = z.object({
  amount: z.number().positive(),
  merchant: z.string().min(1),
  category: z.string().optional(),
  date: z.string(),
  description: z.string().optional()
});

const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  merchant: z.string().optional(),
  category: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional()
});

// Get all transactions for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = getTransactionsByUser(userId, limit, offset);
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create transaction from manual text input (natural language)
router.post('/manual', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { text } = manualTransactionSchema.parse(req.body);

    // Parse transaction using LLM
    const parsed = await parseTransactionText(text);

    // Create transaction
    const transaction = createTransaction({
      user_id: userId,
      amount: parsed.amount,
      merchant: parsed.merchant,
      category: parsed.category,
      date: parsed.date,
      description: parsed.description,
      source: 'manual',
      raw_text: text
    });

    res.status(201).json({ transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Manual transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Create transaction with direct entry (all fields specified)
router.post('/direct', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = directEntrySchema.parse(req.body);

    // Auto-categorize if category not provided
    let category = data.category;
    if (!category) {
      category = await categorizeMerchant(data.merchant);
    }

    // Create transaction
    const transaction = createTransaction({
      user_id: userId,
      amount: data.amount,
      merchant: data.merchant,
      category,
      date: data.date,
      description: data.description,
      source: 'manual',
      raw_text: null
    });

    res.status(201).json({ transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Direct entry transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    const updates = updateTransactionSchema.parse(req.body);

    const transaction = updateTransaction(id, userId, updates);

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);

    const deleted = deleteTransaction(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
