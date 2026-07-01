import { Resend } from 'resend'

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
