import axios from 'axios';

export interface ParsedTransaction {
  amount: number;
  merchant: string;
  category: string;
  date: string;
  description: string;
}

const LLM_API_URL = process.env.LLM_API_URL || 'http://localhost:8080/v1/chat/completions';
const LLM_MODEL = process.env.LLM_MODEL || 'llama-3-8b';

const SYSTEM_PROMPT = `You are a financial transaction parser. Extract transaction details from text and return ONLY a JSON object with these exact fields:
{
  "amount": <number, positive value>,
  "merchant": "<string>",
  "category": "<one of: food, transport, shopping, entertainment, bills, health, other>",
  "date": "<YYYY-MM-DD format>",
  "description": "<brief description>"
}

Rules:
- Always return valid JSON only, no other text
- Amount should always be positive
- Use today's date if not specified
- Infer category from context
- Be concise in descriptions`;

export async function parseTransactionText(text: string): Promise<ParsedTransaction> {
  try {
    const response = await axios.post(
      LLM_API_URL,
      {
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 200
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Extract JSON from response (sometimes LLM adds markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonStr) as ParsedTransaction;

    // Validate required fields
    if (!parsed.amount || !parsed.merchant || !parsed.category || !parsed.date) {
      throw new Error('Missing required fields in parsed transaction');
    }

    // Ensure amount is positive
    parsed.amount = Math.abs(parsed.amount);

    return parsed;
  } catch (error) {
    console.error('LLM parsing error:', error);

    // Fallback: return a basic parsed transaction
    return {
      amount: 0,
      merchant: 'Unknown',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      description: text.substring(0, 100)
    };
  }
}

export async function isFinancialNotification(notificationText: string): Promise<boolean> {
  try {
    const response = await axios.post(
      LLM_API_URL,
      {
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a notification filter. Determine if a notification is about a financial transaction (payment, purchase, withdrawal, etc.). Reply with ONLY "yes" or "no".'
          },
          { role: 'user', content: notificationText }
        ],
        temperature: 0.1,
        max_tokens: 10
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    const content = response.data.choices[0]?.message?.content?.toLowerCase().trim();
    return content === 'yes';
  } catch (error) {
    console.error('LLM filtering error:', error);
    // If LLM fails, be conservative and return true to process the notification
    return true;
  }
}
