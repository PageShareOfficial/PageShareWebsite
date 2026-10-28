import { apiUploadMedia } from '@/lib/api/client';
import { createPrediction } from '@/lib/api/predictionApi';
import type { PredictionFormValues } from '@/utils/predictions/predictionFormSchema';

interface SubmitPredictionWithMediaArgs {
  values: PredictionFormValues;
  accessToken: string;
  selectedTicker: string;
  selectedName: string;
  lockStartMs: number;
  expiryDate: Date;
  mediaFiles: File[];
}

/** Upload optional thesis image and create the prediction. */
export async function submitPredictionWithMedia({
  values,
  accessToken,
  selectedTicker,
  selectedName,
  lockStartMs,
  expiryDate,
  mediaFiles,
}: SubmitPredictionWithMediaArgs): Promise<void> {
  let thesisImageUrl: string | undefined;
  if (mediaFiles.length > 0) {
    const { uploads } = await apiUploadMedia(mediaFiles, accessToken);
    thesisImageUrl = uploads[0]?.url;
  }

  await createPrediction(
    {
      asset: selectedTicker,
      asset_name: selectedName || undefined,
      position: values.position,
      entry_price: values.entryPrice,
      target_price: values.targetPrice,
      stop_loss: values.stopLoss,
      lock_started_at: new Date(lockStartMs).toISOString(),
      expiry_at: expiryDate.toISOString(),
      confidence: values.confidence,
      thesis: values.thesis,
      thesis_image_url: thesisImageUrl,
    },
    accessToken
  );
}
