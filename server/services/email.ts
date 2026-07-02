import { Resend } from 'resend'

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
  if (!apiKey) return

  const resend = new Resend(apiKey)
  const subjectLabel = subjectLabels[data.subject] ?? data.subject

  await resend.emails.send({
    from: 'CGWS <noreply@cgws.fr>',
    to: [recipientEmail],
    replyTo: data.senderEmail,
    subject: `[CGWS Contact] ${subjectLabel} — ${data.senderName}`,
    html: buildContactEmailHtml(data),
  })
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
  if (!apiKey) return

  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: 'CGWS <noreply@cgws.fr>',
    to: [data.depositorEmail],
    subject: 'Votre demande de consignation est bien reçue — CGWS',
    html: buildConsignmentConfirmationHtml(data),
  })
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
  if (!apiKey) return

  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: 'CGWS <noreply@cgws.fr>',
    to: [data.depositorEmail],
    subject: 'Votre consignation a été acceptée — CGWS',
    html: buildConsignmentAcceptHtml(data),
  })
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
  if (!apiKey) return

  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: 'CGWS <noreply@cgws.fr>',
    to: [data.depositorEmail],
    subject: 'Votre demande de consignation — CGWS',
    html: buildConsignmentRejectHtml(data),
  })
}
