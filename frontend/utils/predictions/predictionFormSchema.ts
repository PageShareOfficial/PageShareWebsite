import { z } from 'zod';
import {
  MAX_CONFIDENCE,
  MAX_THESIS_LENGTH,
  MIN_CONFIDENCE,
} from '@/utils/predictions/predictionRules';

export const predictionFormSchema = z.object({
  position: z.enum(['long', 'short']),
  entryPrice: z.number().positive(),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  confidence: z.number().min(MIN_CONFIDENCE).max(MAX_CONFIDENCE),
  thesis: z.string().trim().min(1, 'Add your thesis.').max(MAX_THESIS_LENGTH),
});

export type PredictionFormValues = z.infer<typeof predictionFormSchema>;
