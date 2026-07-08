import { z } from 'zod'
import { sendContactEmail } from '../services/email'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  name: z.string().min(2, 'Votre nom est requis'),
  email: z.string().email('Adresse email invalide'),
  subject: z.enum([
    'question-produit',
    'consignation',
    'rdv-boutique',
    'commande',
    'autre',
  ]),
  message: z.string().min(10, 'Votre message doit faire au moins 10 caractères'),
  website: z.string().optional(), // honeypot — must be empty for legitimate requests
})

type ContactInput = z.infer<typeof contactSchema>

// ---------------------------------------------------------------------------
// In-memory rate limiting (max 5 requests / hour / IP)
// Resets on server restart — sufficient for Vercel serverless deployments
// ---------------------------------------------------------------------------

interface RateLimitRecord {
  count: number
  resetAt: number
}

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

const rateLimitMap = new Map<string, RateLimitRecord>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// ---------------------------------------------------------------------------
// Event handler
// ---------------------------------------------------------------------------

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Extract client IP (Vercel sets x-forwarded-for; fallback to socket address)
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  const clientIp =
    forwarded?.split(',')[0]?.trim() ??
    (event.node.req.socket?.remoteAddress as string | undefined) ??
    'unknown'

  // Validate request body
  const body = await readBody<unknown>(event)

  const parseResult = contactSchema.safeParse(body)
  if (!parseResult.success) {
    const flatErrors = parseResult.error.flatten()
    const fieldErrors: Record<string, string> = {}

    for (const key of Object.keys(flatErrors.fieldErrors) as Array<keyof ContactInput>) {
      const msgs = flatErrors.fieldErrors[key]
      if (msgs !== undefined && msgs.length > 0) {
        fieldErrors[key] = msgs[0] ?? 'Champ invalide'
      }
    }

    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      data: { errors: fieldErrors },
    })
  }

  const input = parseResult.data

  // Honeypot check — silently succeed if the bot-filled field is non-empty
  if (input.website && input.website.length > 0) {
    return { success: true }
  }

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: { error: 'RATE_LIMIT_EXCEEDED' },
    })
  }

  // Send email to Camille via Resend
  try {
    await sendContactEmail(
      config.resendApiKey,
      {
        senderName: input.name,
        senderEmail: input.email,
        subject: input.subject,
        message: input.message,
        sentAt: new Date().toISOString(),
      },
      config.camilleEmail,
    )
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      data: { error: 'SERVER_ERROR' },
    })
  }

  return { success: true }
})
