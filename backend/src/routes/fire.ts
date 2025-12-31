import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  createPlannedTransaction,
  getPlannedTransactionsByUser,
  updatePlannedTransaction,
  deletePlannedTransaction,
  createInvestment,
  getInvestmentsByUser,
  updateInvestment,
  deleteInvestment,
  getFireSettings,
  upsertFireSettings,
  getUserPreferences,
  upsertUserPreferences,
} from '../models/fire';
import { calculateFireProjection, generateYearlyProjections } from '../services/fireCalculator';

const router = Router();
router.use(authenticateToken);

// ===== Planned Transactions =====

const plannedTransactionSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  is_recurring: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  category: z.string(),
  description: z.string().optional(),
});

router.get('/planned-transactions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const planned = getPlannedTransactionsByUser(userId);
    res.json({ planned_transactions: planned });
  } catch (error) {
    console.error('Get planned transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/planned-transactions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = plannedTransactionSchema.parse(req.body);

    const planned = createPlannedTransaction({
      user_id: userId,
      ...data,
    });

    res.status(201).json({ planned_transaction: planned });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Create planned transaction error:', error);
    res.status(500).json({ error: 'Failed to create planned transaction' });
  }
});

router.put('/planned-transactions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    const data = plannedTransactionSchema.partial().parse(req.body);

    const planned = updatePlannedTransaction(id, userId, data);

    if (!planned) {
      res.status(404).json({ error: 'Planned transaction not found' });
      return;
    }

    res.json({ planned_transaction: planned });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Update planned transaction error:', error);
    res.status(500).json({ error: 'Failed to update planned transaction' });
  }
});

router.delete('/planned-transactions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);

    const deleted = deletePlannedTransaction(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Planned transaction not found' });
      return;
    }

    res.json({ message: 'Planned transaction deleted successfully' });
  } catch (error) {
    console.error('Delete planned transaction error:', error);
    res.status(500).json({ error: 'Failed to delete planned transaction' });
  }
});

// ===== Investments =====

const investmentSchema = z.object({
  name: z.string().min(1),
  asset_type: z.enum(['cash', 'bonds', 'stocks', 'index_funds', 'real_estate', 'other']),
  current_value: z.number().nonnegative(),
  expected_return: z.number(),
});

router.get('/investments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const investments = getInvestmentsByUser(userId);
    res.json({ investments });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/investments', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = investmentSchema.parse(req.body);

    const investment = createInvestment({
      user_id: userId,
      ...data,
    });

    res.status(201).json({ investment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});

router.put('/investments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);
    const data = investmentSchema.partial().parse(req.body);

    const investment = updateInvestment(id, userId, data);

    if (!investment) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    res.json({ investment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Update investment error:', error);
    res.status(500).json({ error: 'Failed to update investment' });
  }
});

router.delete('/investments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const id = parseInt(req.params.id);

    const deleted = deleteInvestment(id, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Investment not found' });
      return;
    }

    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({ error: 'Failed to delete investment' });
  }
});

// ===== FIRE Settings =====

const fireSettingsSchema = z.object({
  withdrawal_rate: z.number().min(0).max(10).optional(),
  expected_inflation: z.number().min(0).max(20).optional(),
  target_monthly_expenses: z.number().nonnegative().optional(),
  current_age: z.number().int().min(0).max(120).optional(),
  retirement_age: z.number().int().min(0).max(120).optional(),
});

router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    let settings = getFireSettings(userId);

    if (!settings) {
      // Create default settings
      settings = upsertFireSettings(userId, {});
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get FIRE settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = fireSettingsSchema.parse(req.body);

    const settings = upsertFireSettings(userId, data);

    res.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Update FIRE settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ===== FIRE Projection =====

router.get('/projection', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projection = await calculateFireProjection(userId);

    res.json({ projection });
  } catch (error) {
    console.error('Calculate projection error:', error);
    res.status(500).json({ error: 'Failed to calculate projection' });
  }
});

router.get('/projection/yearly', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const years = parseInt(req.query.years as string) || 40;

    const yearlyProjections = await generateYearlyProjections(userId, years);

    res.json({ projections: yearlyProjections });
  } catch (error) {
    console.error('Generate yearly projections error:', error);
    res.status(500).json({ error: 'Failed to generate projections' });
  }
});

// ===== User Preferences =====

const preferencesSchema = z.object({
  currency: z.string().optional(),
  date_format: z.string().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications_enabled: z.boolean().optional(),
});

router.get('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    let preferences = getUserPreferences(userId);

    if (!preferences) {
      preferences = upsertUserPreferences(userId, {});
    }

    res.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data = preferencesSchema.parse(req.body);

    const preferences = upsertUserPreferences(userId, data);

    res.json({ preferences });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
