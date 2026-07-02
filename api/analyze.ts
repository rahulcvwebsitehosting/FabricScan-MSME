import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// ─── Model config ────────────────────────────────────────────────────────────
// Pinned to explicit version strings — never use '-latest' aliases.
// Update MODEL_PRIMARY here if Google deprecates it.
const MODEL_PRIMARY  = 'gemini-2.5-flash'
const MODEL_FALLBACK = 'gemini-2.5-flash-lite'

// ─── Prompt ──────────────────────────────────────────────────────────────────
const FABRIC_INSPECTION_PROMPT = `
You are an expert textile quality-control inspector for garment MSMEs (micro, small and medium enterprises) in India.

Analyze the provided fabric or garment image for defects. Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must match this exact schema:
{
  "defects": [
    {
      "type": "<one of: tear | loose_thread | stain | seam_misalignment | print_defect | color_inconsistency | none>",
      "label": "<human-readable label, e.g. 'Torn Seam'>",
      "severity": "<one of: none | minor | moderate | major | reject>",
      "confidence": <float 0.0 to 1.0>,
      "boundingBox": { "x": <0-100>, "y": <0-100>, "width": <0-100>, "height": <0-100> } or null,
      "description": "<one sentence describing the defect and its location>",
      "estimatedCostINR": { "min": <integer>, "max": <integer> },
      "recommendation": "<one of: pass | rework | reject>"
    }
  ],
  "overallStatus": "<one of: pass | rework | reject>",
  "overallSeverity": "<one of: none | minor | moderate | major | reject>"
}

Cost estimation table (use these ranges):
- loose_thread, minor: ₹8–15
- loose_thread, moderate: ₹15–30
- stain, minor: ₹20–45
- stain, moderate: ₹45–80
- seam_misalignment, minor: ₹25–50
- seam_misalignment, moderate: ₹50–90
- tear, moderate: ₹40–80
- tear, major: ₹80–150
- print_defect, minor: ₹30–60
- print_defect, major: ₹80–160
- color_inconsistency, moderate: ₹50–100
- reject (any type): ₹150–300

Bounding box rules:
- boundingBox x, y, width, height are percentages (0–100) of the image dimensions
- x and y are the top-left corner of the defect region
- Only include a boundingBox if you can locate the defect with reasonable confidence (>0.65)
- Set boundingBox to null if the defect is diffuse, spread across the image, or you're not confident of the location

If the fabric/garment has no visible defects, return:
{ "defects": [], "overallStatus": "pass", "overallSeverity": "none" }

Return ONLY the JSON object. No other text.
`.trim()

// ─── Core Gemini call ────────────────────────────────────────────────────────
async function callGemini(modelName: string, imageBase64: string): Promise<unknown> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: modelName })

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { text: FABRIC_INSPECTION_PROMPT },
        {
          inlineData: {
            // Always JPEG — compressImage() in imageUtils.ts outputs canvas JPEG
            // regardless of the original file format. Never pass through file.type.
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ],
    }],
    generationConfig: { responseMimeType: 'application/json' },
  })

  const candidate = result.response.candidates?.[0]
  if (!candidate || candidate.finishReason !== 'STOP') {
    throw new Error(`blocked: finishReason=${candidate?.finishReason ?? 'none'}`)
  }

  // JSON.parse is safe here — only reached after finishReason === 'STOP' check
  try {
    return JSON.parse(result.response.text())
  } catch {
    throw new Error('Gemini returned malformed JSON')
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', message: 'POST only.' })
  }

  const { imageBase64 } = req.body as { imageBase64?: string }
  if (!imageBase64) {
    return res.status(400).json({ error: 'missing_image', message: 'No image data received.' })
  }

  // Try primary model. On 404/model-not-found, retry once with fallback.
  try {
    const parsed = await callGemini(MODEL_PRIMARY, imageBase64)
    return res.status(200).json(parsed)
  } catch (primaryErr: unknown) {
    const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
    const isModelGone = msg.includes('404') || msg.toLowerCase().includes('not found')

    if (!isModelGone) {
      // Not a deprecation error — surface it directly, don't mask with a fallback attempt
      return res.status(502).json({
        error: 'analysis_failed',
        message: msg || 'Gemini analysis failed. Try again.',
      })
    }

    // Primary model deprecated — try fallback once
    try {
      const parsed = await callGemini(MODEL_FALLBACK, imageBase64)
      return res.status(200).json(parsed)
    } catch (fallbackErr: unknown) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
      return res.status(502).json({
        error: 'model_unavailable',
        message: `Both ${MODEL_PRIMARY} and ${MODEL_FALLBACK} are unreachable. ${fallbackMsg} — check ai.google.dev/gemini-api/docs/models for current model names.`,
      })
    }
  }
}
