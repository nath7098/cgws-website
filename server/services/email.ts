import { Resend } from 'resend'

// ---------------------------------------------------------------------------
// Construction du client — nettoie la clé API avant `new Resend()` : une env
// var Vercel polluée (BOM U+FEFF, caractère non-ASCII — voir issue #16)
// produit un header Authorization invalide et fait échouer TOUS les envois en
// production alors que la même clé fonctionne en local. Même pattern que
// `sanitizeCredential` dans `server/utils/adminSupabase.ts`.
// ---------------------------------------------------------------------------

function createResendClient(apiKey: string): Resend | null {
  const sanitized = apiKey.replace(/[^\x21-\x7E]/g, '')
  if (!sanitized) return null
  return new Resend(sanitized)
}

// ---------------------------------------------------------------------------
// Expéditeur centralisé (US-092) — source UNIQUE du `from` des 6 templates.
// La valeur vient de runtimeConfig.emailFrom (mappée sur CGWS_EMAIL_FROM dans
// nuxt.config.ts). Le fallback ci-dessous est défensif (env var vidée, config
// écrasée au runtime) : domaine de test Resend, seul expéditeur fonctionnel
// tant que cgws.fr n'est pas vérifié dans Resend. La bascule vers le domaine
// réel se fait par SEUL changement de l'env var CGWS_EMAIL_FROM — zéro code.
// ---------------------------------------------------------------------------

const FALLBACK_EMAIL_FROM = 'CGWS <onboarding@resend.dev>'

function resolveEmailFrom(): string {
  const configured = useRuntimeConfig().emailFrom
  return configured || FALLBACK_EMAIL_FROM
}

// ---------------------------------------------------------------------------
// Helper d'envoi — le SDK Resend ne throw PAS en cas d'erreur API : il
// retourne { data, error }. Sans inspection explicite, les échecs sont
// silencieux (aucun log en production). Ce helper logge chaque issue.
// ---------------------------------------------------------------------------

async function sendViaResend(
  resend: Resend,
  payload: Parameters<Resend['emails']['send']>[0],
  label: string,
): Promise<void> {
  const { data, error } = await resend.emails.send(payload)
  if (error) {
    console.error(`[email] ${label} FAILED:`, error.name, error.message)
    return
  }
  console.info(`[email] ${label} sent — id: ${data?.id ?? 'unknown'}`)
}

// ---------------------------------------------------------------------------
// Contact email
// ---------------------------------------------------------------------------

export interface ContactEmailData {
  senderName: string
  senderEmail: string
  subject: string
  message: string
  sentAt: string
}

const subjectLabels: Record<string, string> = {
  'question-produit': 'Question sur un produit',
  'consignation': 'Service de consignation',
  'rdv-boutique': 'Rendez-vous en boutique',
  'commande': 'Commande / Livraison',
  'autre': 'Autre',
}

function buildContactEmailHtml(data: ContactEmailData): string {
  const subjectLabel = subjectLabels[data.subject] ?? data.subject
  const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data.sentAt))

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau message de contact — CGWS</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF3E3; font-family: Georgia, serif; color: #1A0B03; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: #3D1A06; padding: 32px; text-align: center; }
    .header-title { color: #B8650A; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px; font-family: Georgia, serif; }
    .header-h1 { color: #FAF3E3; font-size: 28px; margin: 0; letter-spacing: 0.05em; font-family: Georgia, serif; font-weight: 700; }
    .body { background: #F0DDB8; border: 3px solid #1A0B03; padding: 2px; margin-top: 0; }
    .body-inner { border: 1px solid #1A0B03; padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1A0B03; margin: 0 0 16px; }
    .intro { font-size: 15px; color: #1A0B03; margin: 0 0 24px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7B3B1C; background: #F0DDB8; border: 1px solid #1A0B03; padding: 8px 12px; text-align: left; font-family: Georgia, serif; }
    .table td { font-size: 14px; color: #1A0B03; background: #FAF3E3; border: 1px solid #1A0B03; padding: 8px 12px; vertical-align: top; }
    .message-cell { white-space: pre-wrap; line-height: 1.6; }
    .reply-link { color: #B8650A; font-weight: 700; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #C8AB82; }
    .footer p { font-size: 12px; color: #7B3B1C; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #C8AB82; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">FORMULAIRE DE CONTACT · CGWS.FR</p>
      <h1 class="header-h1">NOUVEAU MESSAGE</h1>
    </div>

    <div class="body">
      <div class="body-inner">
        <p class="greeting">Camille,</p>
        <p class="intro">
          Vous avez reçu un nouveau message via le formulaire de contact de votre site.
        </p>

        <hr class="divider" />

        <table class="table">
          <thead>
            <tr><th colspan="2">DÉTAILS DU MESSAGE</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>Expéditeur</th>
              <td>${data.senderName}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td><a href="mailto:${data.senderEmail}" class="reply-link">${data.senderEmail}</a></td>
            </tr>
            <tr>
              <th>Sujet</th>
              <td>${subjectLabel}</td>
            </tr>
            <tr>
              <th>Message</th>
              <td class="message-cell">${data.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            </tr>
            <tr>
              <th>Reçu le</th>
              <td>${dateFormatted}</td>
            </tr>
          </tbody>
        </table>

        <p style="font-size:13px;color:#1A0B03;opacity:0.7;margin:16px 0 0;font-style:italic;">
          Pour répondre, cliquez sur Répondre dans votre messagerie — l'email sera adressé à
          <a href="mailto:${data.senderEmail}" class="reply-link">${data.senderEmail}</a>.
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>CGWS — Camille Guignon Western Shop</strong></p>
      <p>Brèches · Indre-et-Loire (37)</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendContactEmail(
  apiKey: string,
  data: ContactEmailData,
  recipientEmail: string,
): Promise<void> {
  const resend = createResendClient(apiKey)
  if (!resend) return

  const subjectLabel = subjectLabels[data.subject] ?? data.subject

  await sendViaResend(resend, {
    from: resolveEmailFrom(),
    to: [recipientEmail],
    replyTo: data.senderEmail,
    subject: `[CGWS Contact] ${subjectLabel} — ${data.senderName}`,
    html: buildContactEmailHtml(data),
  }, 'contact')
}

export interface ConsignmentEmailData {
  depositorName: string
  depositorEmail: string
  itemDescription: string
  brand?: string
  condition: string
  askingPrice: number
  consignmentId: string
  createdAt: string
}

const conditionLabels: Record<string, string> = {
  excellent: 'Excellent état',
  good: 'Bon état',
  fair: 'État correct',
}

function buildConsignmentConfirmationHtml(data: ConsignmentEmailData): string {
  const conditionLabel = conditionLabels[data.condition] ?? data.condition
  const priceFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(data.askingPrice)
  const dateFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(data.createdAt))

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre demande de consignation — CGWS</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF3E3; font-family: Georgia, serif; color: #1A0B03; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: #3D1A06; padding: 32px; text-align: center; }
    .header-title { color: #B8650A; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px; font-family: Georgia, serif; }
    .header-h1 { color: #FAF3E3; font-size: 28px; margin: 0; letter-spacing: 0.05em; font-family: Georgia, serif; font-weight: 700; }
    .body { background: #F0DDB8; border: 3px solid #1A0B03; padding: 2px; margin-top: 0; }
    .body-inner { border: 1px solid #1A0B03; padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1A0B03; margin: 0 0 16px; }
    .intro { font-size: 15px; color: #1A0B03; margin: 0 0 24px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7B3B1C; background: #F0DDB8; border: 1px solid #1A0B03; padding: 8px 12px; text-align: left; font-family: Georgia, serif; }
    .table td { font-size: 14px; color: #1A0B03; background: #FAF3E3; border: 1px solid #1A0B03; padding: 8px 12px; }
    .price-cell { font-size: 22px; color: #B8650A; font-weight: 700; }
    .note { font-size: 13px; color: #1A0B03; opacity: 0.7; margin: 24px 0 0; font-style: italic; line-height: 1.6; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #C8AB82; }
    .footer p { font-size: 12px; color: #7B3B1C; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #C8AB82; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">DÉPÔT-VENTE · BRÈCHES · INDRE-ET-LOIRE</p>
      <h1 class="header-h1">CGWS</h1>
    </div>

    <div class="body">
      <div class="body-inner">
        <p class="greeting">Bonjour ${data.depositorName},</p>
        <p class="intro">
          Votre demande de consignation a bien été reçue. Camille vous contactera sous 48h
          pour valider les conditions et convenir d'un prix de mise en vente.
        </p>

        <hr class="divider" />

        <table class="table">
          <thead>
            <tr><th colspan="2">RÉCAPITULATIF DE VOTRE DEMANDE</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>Article décrit</th>
              <td>${data.itemDescription}</td>
            </tr>
            ${data.brand ? `<tr><th>Marque</th><td>${data.brand}</td></tr>` : ''}
            <tr>
              <th>État</th>
              <td>${conditionLabel}</td>
            </tr>
            <tr>
              <th>Prix souhaité</th>
              <td class="price-cell">${priceFormatted}</td>
            </tr>
            <tr>
              <th>Date de la demande</th>
              <td>${dateFormatted}</td>
            </tr>
            <tr>
              <th>Référence</th>
              <td style="font-size:11px;color:#7B3B1C;">${data.consignmentId}</td>
            </tr>
          </tbody>
        </table>

        <p class="note">
          Le prix de mise en vente sera défini en accord avec vous lors de notre prise de contact.
          La commission CGWS est de 20 % du prix de vente final, pour une durée de consignation de 3 mois renouvelable.
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>CGWS — Camille Guignon Western Shop</strong></p>
      <p>Brèches · Indre-et-Loire (37)</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendConsignmentConfirmation(
  apiKey: string,
  data: ConsignmentEmailData,
): Promise<void> {
  const resend = createResendClient(apiKey)
  if (!resend) return

  await sendViaResend(resend, {
    from: resolveEmailFrom(),
    to: [data.depositorEmail],
    subject: 'Votre demande de consignation est bien reçue — CGWS',
    html: buildConsignmentConfirmationHtml(data),
  }, 'consignment-confirmation')
}

// ---------------------------------------------------------------------------
// Consignment accept / reject emails
// ---------------------------------------------------------------------------

export interface ConsignmentAcceptEmailData {
  depositorName: string
  depositorEmail: string
  itemDescription: string
  brand?: string
  agreedPrice: number
  consignmentId: string
}

function buildConsignmentAcceptHtml(data: ConsignmentAcceptEmailData): string {
  const priceFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(data.agreedPrice)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre consignation a été acceptée — CGWS</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF3E3; font-family: Georgia, serif; color: #1A0B03; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: #3D1A06; padding: 32px; text-align: center; }
    .header-title { color: #B8650A; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px; font-family: Georgia, serif; }
    .header-h1 { color: #FAF3E3; font-size: 28px; margin: 0; letter-spacing: 0.05em; font-family: Georgia, serif; font-weight: 700; }
    .body { background: #F0DDB8; border: 3px solid #1A0B03; padding: 2px; margin-top: 0; }
    .body-inner { border: 1px solid #1A0B03; padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1A0B03; margin: 0 0 16px; }
    .intro { font-size: 15px; color: #1A0B03; margin: 0 0 24px; line-height: 1.6; }
    .price-highlight { font-size: 28px; font-weight: 700; color: #B8650A; display: block; margin: 16px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7B3B1C; background: #F0DDB8; border: 1px solid #1A0B03; padding: 8px 12px; text-align: left; font-family: Georgia, serif; }
    .table td { font-size: 14px; color: #1A0B03; background: #FAF3E3; border: 1px solid #1A0B03; padding: 8px 12px; }
    .note { font-size: 13px; color: #1A0B03; opacity: 0.7; margin: 24px 0 0; font-style: italic; line-height: 1.6; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #C8AB82; }
    .footer p { font-size: 12px; color: #7B3B1C; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #C8AB82; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">DÉPÔT-VENTE · BRÈCHES · INDRE-ET-LOIRE</p>
      <h1 class="header-h1">CGWS</h1>
    </div>
    <div class="body">
      <div class="body-inner">
        <p class="greeting">Bonjour ${data.depositorName},</p>
        <p class="intro">
          Bonne nouvelle ! Votre demande de consignation a été examinée et
          <strong>nous acceptons de mettre votre article en vente</strong>
          dans notre boutique.
        </p>
        <hr class="divider" />
        <table class="table">
          <thead>
            <tr><th colspan="2">DÉTAILS DE VOTRE CONSIGNATION</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>Article</th>
              <td>${data.itemDescription}${data.brand ? ` — ${data.brand}` : ''}</td>
            </tr>
            <tr>
              <th>Prix de mise en vente convenu</th>
              <td><strong style="font-size:18px;color:#B8650A;">${priceFormatted}</strong></td>
            </tr>
            <tr>
              <th>Commission CGWS</th>
              <td>20 % du prix de vente effectif</td>
            </tr>
            <tr>
              <th>Référence</th>
              <td style="font-size:11px;color:#7B3B1C;">${data.consignmentId}</td>
            </tr>
          </tbody>
        </table>
        <p class="note">
          Votre article est désormais en vente sur notre site et en boutique.
          Vous serez contacté dès qu'une vente sera conclue pour convenir des modalités de reversement
          (80 % du prix de vente effectif vous sera reversé).
          La durée de consignation est de 3 mois renouvelable.
        </p>
        <p style="margin-top:16px;font-size:14px;color:#1A0B03;">
          Pour toute question, n'hésitez pas à nous contacter :
          <a href="mailto:contact@cgws.fr" style="color:#B8650A;font-weight:700;">contact@cgws.fr</a>
        </p>
      </div>
    </div>
    <div class="footer">
      <p><strong>CGWS — Camille Guignon Western Shop</strong></p>
      <p>Brèches · Indre-et-Loire (37)</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendConsignmentAcceptEmail(
  apiKey: string,
  data: ConsignmentAcceptEmailData,
): Promise<void> {
  const resend = createResendClient(apiKey)
  if (!resend) return

  await sendViaResend(resend, {
    from: resolveEmailFrom(),
    to: [data.depositorEmail],
    subject: 'Votre consignation a été acceptée — CGWS',
    html: buildConsignmentAcceptHtml(data),
  }, 'consignment-accept')
}

export interface ConsignmentRejectEmailData {
  depositorName: string
  depositorEmail: string
  itemDescription: string
  reason: string
  consignmentId: string
}

function buildConsignmentRejectHtml(data: ConsignmentRejectEmailData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre demande de consignation — CGWS</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF3E3; font-family: Georgia, serif; color: #1A0B03; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: #3D1A06; padding: 32px; text-align: center; }
    .header-title { color: #B8650A; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px; font-family: Georgia, serif; }
    .header-h1 { color: #FAF3E3; font-size: 28px; margin: 0; letter-spacing: 0.05em; font-family: Georgia, serif; font-weight: 700; }
    .body { background: #F0DDB8; border: 3px solid #1A0B03; padding: 2px; margin-top: 0; }
    .body-inner { border: 1px solid #1A0B03; padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1A0B03; margin: 0 0 16px; }
    .intro { font-size: 15px; color: #1A0B03; margin: 0 0 24px; line-height: 1.6; }
    .reason-box { background: #FAF3E3; border-left: 4px solid #943218; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #1A0B03; font-style: italic; line-height: 1.6; white-space: pre-wrap; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7B3B1C; background: #F0DDB8; border: 1px solid #1A0B03; padding: 8px 12px; text-align: left; font-family: Georgia, serif; }
    .table td { font-size: 14px; color: #1A0B03; background: #FAF3E3; border: 1px solid #1A0B03; padding: 8px 12px; }
    .note { font-size: 13px; color: #1A0B03; opacity: 0.7; margin: 24px 0 0; font-style: italic; line-height: 1.6; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #C8AB82; }
    .footer p { font-size: 12px; color: #7B3B1C; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #C8AB82; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">DÉPÔT-VENTE · BRÈCHES · INDRE-ET-LOIRE</p>
      <h1 class="header-h1">CGWS</h1>
    </div>
    <div class="body">
      <div class="body-inner">
        <p class="greeting">Bonjour ${data.depositorName},</p>
        <p class="intro">
          Nous avons examiné votre demande de consignation pour
          <strong>${data.itemDescription}</strong>
          et nous ne sommes malheureusement pas en mesure de l'accepter pour le moment.
        </p>
        <hr class="divider" />
        <p style="font-size:14px;font-weight:700;color:#1A0B03;margin:0 0 8px;">Motif communiqué :</p>
        <div class="reason-box">${data.reason.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <hr class="divider" />
        <table class="table">
          <thead>
            <tr><th colspan="2">RAPPEL DE VOTRE DEMANDE</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>Article</th>
              <td>${data.itemDescription}</td>
            </tr>
            <tr>
              <th>Référence</th>
              <td style="font-size:11px;color:#7B3B1C;">${data.consignmentId}</td>
            </tr>
          </tbody>
        </table>
        <p class="note">
          Si vous avez des questions ou souhaitez nous soumettre d'autres articles,
          n'hésitez pas à nous contacter.
        </p>
        <p style="margin-top:16px;font-size:14px;color:#1A0B03;">
          <a href="mailto:contact@cgws.fr" style="color:#B8650A;font-weight:700;">contact@cgws.fr</a>
        </p>
      </div>
    </div>
    <div class="footer">
      <p><strong>CGWS — Camille Guignon Western Shop</strong></p>
      <p>Brèches · Indre-et-Loire (37)</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendConsignmentRejectEmail(
  apiKey: string,
  data: ConsignmentRejectEmailData,
): Promise<void> {
  const resend = createResendClient(apiKey)
  if (!resend) return

  await sendViaResend(resend, {
    from: resolveEmailFrom(),
    to: [data.depositorEmail],
    subject: 'Votre demande de consignation — CGWS',
    html: buildConsignmentRejectHtml(data),
  }, 'consignment-reject')
}

// ---------------------------------------------------------------------------
// Consignment sale email (notifie le déposant que son article a été vendu)
// ---------------------------------------------------------------------------

export interface ConsignmentSaleEmailData {
  depositorName: string
  depositorEmail: string
  itemDescription: string
  salePrice: number
  commissionAmount: number | null
  agreedPrice: number | null
  consignmentId: string
}

function buildConsignmentSaleHtml(data: ConsignmentSaleEmailData): string {
  const salePriceFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(data.salePrice)

  const netAmount = data.agreedPrice !== null ? data.agreedPrice : null
  const netFormatted = netAmount !== null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(netAmount)
    : '—'

  const commissionFormatted = data.commissionAmount !== null
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.commissionAmount)
    : '—'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre article a été vendu — CGWS</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF3E3; font-family: Georgia, serif; color: #1A0B03; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: #3D1A06; padding: 32px; text-align: center; }
    .header-title { color: #B8650A; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px; font-family: Georgia, serif; }
    .header-h1 { color: #FAF3E3; font-size: 28px; margin: 0; letter-spacing: 0.05em; font-family: Georgia, serif; font-weight: 700; }
    .body { background: #F0DDB8; border: 3px solid #1A0B03; padding: 2px; margin-top: 0; }
    .body-inner { border: 1px solid #1A0B03; padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1A0B03; margin: 0 0 16px; }
    .intro { font-size: 15px; color: #1A0B03; margin: 0 0 24px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7B3B1C; background: #F0DDB8; border: 1px solid #1A0B03; padding: 8px 12px; text-align: left; font-family: Georgia, serif; }
    .table td { font-size: 14px; color: #1A0B03; background: #FAF3E3; border: 1px solid #1A0B03; padding: 8px 12px; }
    .price-cell { font-size: 22px; color: #B8650A; font-weight: 700; }
    .net-cell { font-size: 20px; color: #1A0B03; font-weight: 700; }
    .note { font-size: 13px; color: #1A0B03; opacity: 0.7; margin: 24px 0 0; font-style: italic; line-height: 1.6; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #C8AB82; }
    .footer p { font-size: 12px; color: #7B3B1C; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #C8AB82; margin: 16px 0; }
    .sold-badge { display: inline-block; background: #B8650A; color: #FAF3E3; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 2px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">DÉPÔT-VENTE · BRÈCHES · INDRE-ET-LOIRE</p>
      <h1 class="header-h1">CGWS</h1>
    </div>

    <div class="body">
      <div class="body-inner">
        <span class="sold-badge">Vendu !</span>
        <p class="greeting">Bonjour ${data.depositorName},</p>
        <p class="intro">
          Excellente nouvelle ! Votre article a été vendu dans notre boutique.
          Voici le récapitulatif de la transaction et le montant qui vous sera reversé.
        </p>

        <hr class="divider" />

        <table class="table">
          <thead>
            <tr><th colspan="2">DÉTAILS DE LA VENTE</th></tr>
          </thead>
          <tbody>
            <tr>
              <th>Article vendu</th>
              <td>${data.itemDescription}</td>
            </tr>
            <tr>
              <th>Prix de vente effectif</th>
              <td class="price-cell">${salePriceFormatted}</td>
            </tr>
            <tr>
              <th>Commission CGWS</th>
              <td>${commissionFormatted}</td>
            </tr>
            <tr>
              <th>Montant net à vous reverser</th>
              <td class="net-cell">${netFormatted}</td>
            </tr>
            <tr>
              <th>Référence consignation</th>
              <td style="font-size:11px;color:#7B3B1C;">${data.consignmentId}</td>
            </tr>
          </tbody>
        </table>

        <p class="note">
          Nous vous contacterons prochainement pour convenir des modalités de reversement
          (espèces en boutique, virement bancaire ou chèque selon votre préférence).
        </p>
        <p style="margin-top:16px;font-size:14px;color:#1A0B03;">
          Pour toute question, contactez-nous :
          <a href="mailto:contact@cgws.fr" style="color:#B8650A;font-weight:700;">contact@cgws.fr</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>CGWS — Camille Guignon Western Shop</strong></p>
      <p>Brèches · Indre-et-Loire (37)</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendConsignmentSaleEmail(
  apiKey: string,
  data: ConsignmentSaleEmailData,
): Promise<void> {
  const resend = createResendClient(apiKey)
  if (!resend) return

  await sendViaResend(resend, {
    from: resolveEmailFrom(),
    to: [data.depositorEmail],
    subject: 'Votre article a été vendu — CGWS',
    html: buildConsignmentSaleHtml(data),
  }, 'consignment-sale')
}

// ---------------------------------------------------------------------------
// Order confirmation email (confirmation de commande en ligne — US-071)
// ---------------------------------------------------------------------------

export interface OrderConfirmationEmailData {
  customerName: string
  customerEmail: string
  orderId: string
  items: Array<{ title: string, price: number, quantity: number }>
  subtotal: number
  shippingCost: number
  total: number
  fulfillmentMethod: 'shipping' | 'pickup'
  shippingAddress?: {
    street: string
    postalCode: string
    city: string
    country: string
  }
}

function escapeHtml(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildOrderConfirmationHtml(data: OrderConfirmationEmailData): string {
  const formatEur = (amount: number): string =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const itemRows = data.items
    .map(
      item => `<tr>
              <td>${escapeHtml(item.title)}</td>
              <td style="text-align:right;white-space:nowrap;">${formatEur(item.price)}</td>
            </tr>`,
    )
    .join('\n            ')

  const fulfillmentBlock
    = data.fulfillmentMethod === 'pickup'
      ? `<tr>
              <th>Mode de réception</th>
              <td>Retrait à la boutique — Brèches (37). Nous vous contacterons pour convenir d'un créneau de retrait.</td>
            </tr>`
      : `<tr>
              <th>Mode de réception</th>
              <td>Livraison à domicile</td>
            </tr>
            ${data.shippingAddress
              ? `<tr>
              <th>Adresse de livraison</th>
              <td>${escapeHtml(data.shippingAddress.street)}<br />${escapeHtml(data.shippingAddress.postalCode)} ${escapeHtml(data.shippingAddress.city)}<br />${escapeHtml(data.shippingAddress.country)}</td>
            </tr>`
              : ''}`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de votre commande — CGWS</title>
  <style>
    body { margin: 0; padding: 0; background: #FAF3E3; font-family: Georgia, serif; color: #1A0B03; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .header { background: #3D1A06; padding: 32px; text-align: center; }
    .header-title { color: #B8650A; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px; font-family: Georgia, serif; }
    .header-h1 { color: #FAF3E3; font-size: 28px; margin: 0; letter-spacing: 0.05em; font-family: Georgia, serif; font-weight: 700; }
    .body { background: #F0DDB8; border: 3px solid #1A0B03; padding: 2px; margin-top: 0; }
    .body-inner { border: 1px solid #1A0B03; padding: 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #1A0B03; margin: 0 0 16px; }
    .intro { font-size: 15px; color: #1A0B03; margin: 0 0 24px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .table th { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #7B3B1C; background: #F0DDB8; border: 1px solid #1A0B03; padding: 8px 12px; text-align: left; font-family: Georgia, serif; }
    .table td { font-size: 14px; color: #1A0B03; background: #FAF3E3; border: 1px solid #1A0B03; padding: 8px 12px; }
    .total-cell { font-size: 22px; color: #B8650A; font-weight: 700; }
    .note { font-size: 13px; color: #1A0B03; opacity: 0.7; margin: 24px 0 0; font-style: italic; line-height: 1.6; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #C8AB82; }
    .footer p { font-size: 12px; color: #7B3B1C; margin: 4px 0; }
    .divider { border: none; border-top: 1px solid #C8AB82; margin: 16px 0; }
    .paid-badge { display: inline-block; background: #B8650A; color: #FAF3E3; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 2px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">SELLERIE WESTERN · BRÈCHES · INDRE-ET-LOIRE</p>
      <h1 class="header-h1">CGWS</h1>
    </div>

    <div class="body">
      <div class="body-inner">
        <span class="paid-badge">Commande confirmée</span>
        <p class="greeting">Bonjour ${escapeHtml(data.customerName)},</p>
        <p class="intro">
          Merci pour votre commande ! Votre paiement a bien été reçu.
          Voici le récapitulatif de vos articles.
        </p>

        <hr class="divider" />

        <table class="table">
          <thead>
            <tr><th colspan="2">VOS ARTICLES</th></tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr>
              <th>Sous-total</th>
              <td style="text-align:right;">${formatEur(data.subtotal)}</td>
            </tr>
            <tr>
              <th>Frais de port</th>
              <td style="text-align:right;">${data.shippingCost > 0 ? formatEur(data.shippingCost) : 'Gratuit (retrait boutique)'}</td>
            </tr>
            <tr>
              <th>Total payé</th>
              <td class="total-cell" style="text-align:right;">${formatEur(data.total)}</td>
            </tr>
          </tbody>
        </table>

        <table class="table">
          <thead>
            <tr><th colspan="2">VOTRE COMMANDE</th></tr>
          </thead>
          <tbody>
            ${fulfillmentBlock}
            <tr>
              <th>Référence</th>
              <td style="font-size:11px;color:#7B3B1C;">${escapeHtml(data.orderId)}</td>
            </tr>
          </tbody>
        </table>

        <p class="note">
          Une question sur votre commande ? Répondez simplement à cet email ou
          contactez-nous : <a href="mailto:contact@cgws.fr" style="color:#B8650A;font-weight:700;">contact@cgws.fr</a>.
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>CGWS — Camille Guignon Western Shop</strong></p>
      <p>Brèches · Indre-et-Loire (37)</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendOrderConfirmationEmail(
  apiKey: string,
  data: OrderConfirmationEmailData,
): Promise<void> {
  const resend = createResendClient(apiKey)
  if (!resend) return

  await sendViaResend(resend, {
    from: resolveEmailFrom(),
    to: [data.customerEmail],
    subject: 'Confirmation de votre commande — CGWS',
    html: buildOrderConfirmationHtml(data),
  }, 'order-confirmation')
}
