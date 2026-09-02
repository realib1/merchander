import { NormalizedMessage, ExtractedCart } from '@/types/messaging';

/**
 * Sends a normalized message to the Python Intelligence Brain to extract structured cart intent.
 *
 * In the future, this will hit our FastAPI endpoint.
 * For now, this is a placeholder/stub that simulates the extraction.
 */
export async function extractCartFromChat(message: NormalizedMessage): Promise<ExtractedCart> {
  console.log(`[AI Brain Interface] Extracting intent from ${message.platform} message: "${message.text}"`);

  // TODO: Replace with actual fetch to Python FastAPI Brain
  // const response = await fetch(`${process.env.PYTHON_BRAIN_URL}/extract`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message: message.text })
  // });
  // return await response.json();

  // Return empty extraction until backend is wired up
  return {
    items: [],
    confidence: 0,
  };
}
