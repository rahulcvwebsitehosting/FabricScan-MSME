/**
 * smokeTest.ts — Run this BEFORE building any UI to confirm gemini-2.5-flash
 * is reachable with your key.
 *
 * Usage: npx ts-node scripts/smokeTest.ts
 *
 * Key is read from .env.local via dotenv — never type it on the command line
 * (that would put it in shell history plaintext).
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const key = process.env.GEMINI_API_KEY
if (!key) {
  console.error('❌ GEMINI_API_KEY not found — add it to .env.local and try again')
  process.exit(1)
}

const imagePath = resolve('scripts/test_fabric.jpg')
if (!existsSync(imagePath)) {
  console.error('❌ scripts/test_fabric.jpg not found.')
  console.error('   Drop any fabric photo in scripts/ named test_fabric.jpg and re-run.')
  process.exit(1)
}

console.log('🔍 Calling gemini-2.5-flash...')
const genAI = new GoogleGenerativeAI(key)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const imgBase64 = readFileSync(imagePath).toString('base64')

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [
      { text: 'Describe this fabric image in one sentence. Be specific about texture, color, and any visible defects.' },
      { inlineData: { mimeType: 'image/jpeg', data: imgBase64 } },
    ],
  }],
})

console.log('✅ Model is live and responding:')
console.log('   ', result.response.text())
console.log('\n✅ Smoke test passed — proceed with Phase 0.5 prompt tuning.')
