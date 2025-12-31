import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  saveRawNotification,
  createTransaction,
  markNotificationProcessed
} from '../models/transaction';
import { parseTransactionText, isFinancialNotification } from '../services/llm';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const notificationSchema = z.object({
  text: z.string().min(1),
  appName: z.string().min(1)
});

// Receive notification from mobile app
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { text, appName } = notificationSchema.parse(req.body);

    // Save raw notification for debugging
    const rawNotification = saveRawNotification(userId, text, appName);

    // Check if it's a financial notification
    const isFinancial = await isFinancialNotification(text);

    if (!isFinancial) {
      res.json({
        message: 'Notification received but not financial',
        notificationId: rawNotification.id,
        processed: false
      });
      return;
    }

    // Parse transaction
    const parsed = await parseTransactionText(text);

    // Create transaction
    const transaction = createTransaction({
      user_id: userId,
      amount: parsed.amount,
      merchant: parsed.merchant,
      category: parsed.category,
      date: parsed.date,
      description: parsed.description,
      source: 'notification',
      raw_text: text
    });

    // Mark notification as processed
    markNotificationProcessed(rawNotification.id, transaction.id);

    res.status(201).json({
      message: 'Transaction created from notification',
      notificationId: rawNotification.id,
      transaction,
      processed: true
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Notification processing error:', error);
    res.status(500).json({ error: 'Failed to process notification' });
  }
});

export default router;
