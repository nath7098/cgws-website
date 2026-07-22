import { createRequire } from 'node:module'
import type { H3Event } from 'h3'
import type { TDocumentDefinitions, TFontDictionary, TCreatedPdf } from 'pdfmake/interfaces'

// ─── pdfmake singleton types (server-side API) ────────────────────────────────

interface PdfMakeLib {
  addFonts(fonts: TFontDictionary): void
  setUrlAccessPolicy(callback: ((url: string) => boolean) | undefined | null): void
  setLocalAccessPolicy(callback: ((path: string) => boolean) | undefined | null): void
  createPdf(docDefinition: TDocumentDefinitions): TCreatedPdf
}

// CJS module — createRequire ensures it's resolved at runtime from node_modules
const _require = createRequire(import.meta.url)
const pdfmake = _require('pdfmake') as PdfMakeLib

// Register standard PDF Type-1 fonts (built into PDF spec, no font files needed)
const FONTS: TFontDictionary = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
}
pdfmake.addFonts(FONTS)
// Block all external URL and local file access (no images/external resources in this PDF)
pdfmake.setUrlAccessPolicy(() => false)
pdfmake.setLocalAccessPolicy(() => false)

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMISSION_RATE = 0.20
const CONSIGNMENT_MONTHS = 6

const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  excellent: 'Excellent état',
  good: 'Bon état',
  fair: 'État correct',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return amount
    .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    + ' €'
}

function formatDateFR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function addMonthsDate(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event: H3Event) => {
  await requireAdminAuth(event)

  const rawQuery = getQuery(event)
  const id = typeof rawQuery.id === 'string' && rawQuery.id.length > 0
    ? rawQuery.id
    : null

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Paramètre "id" requis' })
  }

  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('consignments')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Consignation introuvable' })
  }

  if (data.status !== 'accepted' && data.status !== 'sold') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le bon de dépôt est disponible uniquement pour les consignations acceptées ou vendues',
    })
  }

  const config = useRuntimeConfig()
  const contactEmail = (config as { camilleEmail?: string }).camilleEmail ?? 'contact@cgws.fr'

  const agreedPrice = Number(data.agreed_price ?? data.asking_price)
  const commission = Math.round(agreedPrice * COMMISSION_RATE * 100) / 100
  const depositorAmount = Math.round((agreedPrice - commission) * 100) / 100
  const createdAt = data.created_at ?? new Date().toISOString()
  const depositDate = formatDateFR(createdAt)
  const endDate = addMonthsDate(createdAt, CONSIGNMENT_MONTHS)
  const receiptId = id.slice(0, 8).toUpperCase()
  const conditionLabel = CONDITION_LABELS[data.condition] ?? data.condition

  // ─── Document definition ───────────────────────────────────────────────────

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'Helvetica',
      fontSize: 10,
      lineHeight: 1.3,
    },
    info: {
      title: `Bon de dépôt CGWS — ${receiptId}`,
      author: 'CGWS — Camille Guignon Western Shop',
      subject: 'Bon de dépôt consignation',
    },
    content: [
      // ── En-tête ─────────────────────────────────────────────────────────
      {
        columns: [
          {
            stack: [
              { text: 'CGWS', style: 'headerTitle' },
              { text: 'Camille Guignon Western Shop', style: 'headerSub', marginTop: 2 },
              { text: 'Brèches, 37340', style: 'headerSub' },
              { text: contactEmail, style: 'headerSub' },
            ],
          },
          {
            stack: [
              { text: 'BON DE DÉPÔT', style: 'docTitle' },
              { text: `N° ${receiptId}`, style: 'docMeta', marginTop: 4 },
              { text: `Date : ${depositDate}`, style: 'docMeta', marginTop: 2 },
            ],
            alignment: 'right' as const,
          },
        ],
        marginBottom: 16,
      },

      // ── Séparateur cuivre ────────────────────────────────────────────────
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#B8650A' },
        ],
        marginBottom: 20,
      },

      // ── DÉPOSANT ────────────────────────────────────────────────────────
      { text: 'DÉPOSANT', style: 'sectionTitle', marginBottom: 8 },
      {
        table: {
          widths: [80, '*'],
          body: [
            [
              { text: 'Nom', style: 'fieldLabel' },
              { text: data.depositor_name, style: 'fieldValue' },
            ],
            [
              { text: 'Email', style: 'fieldLabel' },
              { text: data.depositor_email, style: 'fieldValue' },
            ],
            [
              { text: 'Tél.', style: 'fieldLabel' },
              { text: data.depositor_phone ?? '—', style: 'fieldValue' },
            ],
          ],
        },
        layout: 'noBorders',
        marginBottom: 20,
      },

      // ── Séparateur léger ─────────────────────────────────────────────────
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#C8AB82' },
        ],
        marginBottom: 16,
      },

      // ── ARTICLE DÉPOSÉ ───────────────────────────────────────────────────
      { text: 'ARTICLE DÉPOSÉ', style: 'sectionTitle', marginBottom: 8 },
      {
        table: {
          widths: [150, '*'],
          body: [
            [
              { text: 'Description', style: 'fieldLabel' },
              { text: data.item_description, style: 'fieldValue' },
            ],
            [
              { text: 'Marque', style: 'fieldLabel' },
              { text: data.brand ?? '—', style: 'fieldValue' },
            ],
            [
              { text: 'État', style: 'fieldLabel' },
              { text: conditionLabel, style: 'fieldValue' },
            ],
          ],
        },
        layout: 'noBorders',
        marginBottom: 12,
      },

      // Tableau financier
      {
        table: {
          widths: [180, '*'],
          body: [
            [
              { text: 'Prix convenu de mise en vente', style: 'fieldLabel' },
              { text: formatPrice(agreedPrice), style: 'priceValue' },
            ],
            [
              { text: `Commission CGWS (${COMMISSION_RATE * 100} %)`, style: 'fieldLabel' },
              { text: `− ${formatPrice(commission)}`, style: 'commissionValue' },
            ],
            [
              { text: 'Montant à reverser au déposant', style: 'fieldLabelBold' },
              { text: formatPrice(depositorAmount), style: 'depositorValue' },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
            i === node.table.body.length - 1 ? 0.5 : 0,
          vLineWidth: () => 0,
          hLineColor: () => '#C8AB82',
          paddingLeft: () => 0,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        marginBottom: 20,
      },

      // ── Séparateur léger ─────────────────────────────────────────────────
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#C8AB82' },
        ],
        marginBottom: 16,
      },

      // ── CONDITIONS ───────────────────────────────────────────────────────
      { text: 'CONDITIONS', style: 'sectionTitle', marginBottom: 8 },
      {
        table: {
          widths: [150, '*'],
          body: [
            [
              { text: 'Date de dépôt', style: 'fieldLabel' },
              { text: depositDate, style: 'fieldValue' },
            ],
            [
              { text: 'Durée de consignation', style: 'fieldLabel' },
              { text: `${CONSIGNMENT_MONTHS} mois (jusqu'au ${endDate})`, style: 'fieldValue' },
            ],
          ],
        },
        layout: 'noBorders',
        marginBottom: 8,
      },
      {
        text: "Au-delà de la durée de consignation, l'article sera retourné au déposant.",
        style: 'footnote',
        marginBottom: 30,
      },

      // ── Séparateur cuivre ────────────────────────────────────────────────
      {
        canvas: [
          { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#B8650A' },
        ],
        marginBottom: 24,
      },

      // ── SIGNATURES ───────────────────────────────────────────────────────
      { text: 'SIGNATURES', style: 'sectionTitle', marginBottom: 20 },
      {
        columns: [
          {
            stack: [
              { text: 'Le déposant :', style: 'signLabel' },
              { text: '', marginBottom: 36 },
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#7B3B1C' },
                ],
              },
              { text: 'Date :', style: 'signLabel', marginTop: 6 },
            ],
          },
          {
            stack: [
              { text: 'CGWS :', style: 'signLabel' },
              { text: '', marginBottom: 36 },
              {
                canvas: [
                  { type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#7B3B1C' },
                ],
              },
              { text: 'Date :', style: 'signLabel', marginTop: 6 },
            ],
          },
        ],
      },
    ],

    styles: {
      headerTitle: { fontSize: 20, bold: true, color: '#3D1A06' },
      headerSub: { fontSize: 9, color: '#7B3B1C' },
      docTitle: { fontSize: 15, bold: true, color: '#B8650A' },
      docMeta: { fontSize: 9, color: '#7B3B1C' },
      sectionTitle: { fontSize: 10, bold: true, color: '#B8650A', characterSpacing: 0.5 },
      fieldLabel: { fontSize: 9, color: '#7B3B1C' },
      fieldLabelBold: { fontSize: 10, bold: true, color: '#1A0B03' },
      fieldValue: { fontSize: 10, color: '#1A0B03' },
      priceValue: { fontSize: 10, bold: true, color: '#B8650A' },
      commissionValue: { fontSize: 10, color: '#943218' },
      depositorValue: { fontSize: 13, bold: true, color: '#B8650A' },
      footnote: { fontSize: 8, color: '#7B3B1C', italics: true },
      signLabel: { fontSize: 9, color: '#7B3B1C' },
    },
  }

  // ─── Generate PDF buffer ───────────────────────────────────────────────────

  const pdfDocument = pdfmake.createPdf(docDefinition)
  const buffer = await pdfDocument.getBuffer()

  setResponseHeader(event, 'Content-Type', 'application/pdf')
  setResponseHeader(
    event,
    'Content-Disposition',
    `attachment; filename="bon-depot-${receiptId}.pdf"`,
  )
  setResponseHeader(event, 'Content-Length', buffer.length)

  return buffer
})
