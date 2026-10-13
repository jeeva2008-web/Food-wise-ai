import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const port = Number(process.env.PORT) || 3000;

// Initialize Google Gemini AI SDK if configured
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: !!aiClient,
    timestamp: new Date().toISOString(),
  });
});

// AI Prediction Insights
app.post('/api/ai/predict-insights', async (req, res) => {
  const { foodName, category, attendance, estimatedDemandKg, testPrepKg, surplusKg, surplusPercent } = req.body;

  if (!aiClient) {
    // Graceful fallback to deterministic analysis when no API key
    return res.json({
      source: 'local_heuristic',
      insights: `Based on historical canteen patterns for ${category}, cooking ${testPrepKg} kg with ${attendance} attendees results in ${surplusKg} kg excess (${surplusPercent}%). Recommended action: Adjust portion ladles and implement staggered secondary batch cooking.`,
    });
  }

  try {
    const prompt = `You are an expert university food service operations and sustainability consultant.
A university dining hall is preparing:
- Food Item: ${foodName} (${category})
- Expected Student Attendance: ${attendance}
- Estimated Demand: ${estimatedDemandKg} kg
- Planned Preparation Batch: ${testPrepKg} kg
- Forecasted Surplus: ${surplusKg} kg (${surplusPercent}%)

In 2-3 concise, bullet points, provide practical recommendations for the executive chef on batch scheduling, holding preservation, or prompt redistribution to prevent waste. Do not use jargon. Focus on realistic commercial kitchen techniques.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    return res.json({
      source: 'gemini_api',
      insights: text.trim(),
    });
  } catch (error: any) {
    console.error('Gemini prediction insight error:', error);
    return res.json({
      source: 'local_heuristic_fallback',
      insights: `Recommended kitchen protocol: For ${foodName}, cook 70% of batch initially. Monitor cafeteria queue at the 45-minute mark before preparing the remaining volume.`,
      error: error?.message,
    });
  }
});

// AI Waste Reduction Summary
app.post('/api/ai/reduction-advice', async (req, res) => {
  const { topWastedItems, totalPreparedKg, totalDiscardedKg, wastePercentage } = req.body;

  if (!aiClient) {
    return res.json({
      source: 'local_heuristic',
      summary: `Your dining facility currently registers a ${wastePercentage}% waste rate (${totalDiscardedKg} kg discarded out of ${totalPreparedKg} kg prepared). Priority reduction targets: ${topWastedItems?.map((i: any) => i.foodName).join(', ') || 'High volume rice and curries'}.`,
    });
  }

  try {
    const itemsList = (topWastedItems || []).map((i: any) => `${i.foodName} (${i.totalDiscardedKg} kg discarded)`).join(', ');
    const prompt = `You are a food waste prevention analyst. Here are the latest audit metrics for a campus dining hall:
- Total food prepared: ${totalPreparedKg} kg
- Total food discarded: ${totalDiscardedKg} kg
- Overall waste rate: ${wastePercentage}%
- Most frequently wasted items: ${itemsList}

Provide 3 high-impact, actionable recommendations tailored for a university canteen management team to reduce avoidable food waste and enhance campus sustainability.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      source: 'gemini_api',
      summary: response.text?.trim() || '',
    });
  } catch (error: any) {
    console.error('Gemini reduction advice error:', error);
    return res.json({
      source: 'local_heuristic_fallback',
      summary: `Focus attention on top volume leftovers (${topWastedItems?.[0]?.foodName || 'rice & curries'}). Implement student plate-waste awareness campaigns and calibrate recipe batch cards.`,
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`FoodWise AI Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
