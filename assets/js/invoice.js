/**
 * invoice.js — Générateur de factures pro forma
 * Entièrement côté client, impression/PDF via window.print()
 */

const Invoice = (() => {

  // ── Calcul de facture ──
  function calculate(items, vatRate = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.qty || 1) * parseFloat(item.unitPrice || 0));
    }, 0);
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  }

  // ── Formatage monétaire ──
  function formatMoney(amount, currency = '€') {
    return `${currency}${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function formatMoneyXOF(amountEur, rate = 655.957) {
    const xof = Math.round(amountEur * rate);
    return `${xof.toLocaleString('fr-FR')} XOF`;
  }

  // ── Formatage date ──
  function formatDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // ── Génération HTML de facture ──
  function generateHTML(data) {
    const { issuer, client, invoice, items, notes, rates } = data;
    const vatRate = rates?.invoice_settings?.defaults?.vat_rate || 0;
    const { subtotal, vatAmount, total } = calculate(items, vatRate);
    const currency = issuer.currency_symbol || '€';
    const dueDate = addDays(invoice.date || new Date(), invoice.paymentTermsDays || 30);

    const itemsHTML = items.map((item, i) => `
      <tr style="border-bottom:1px solid #e8edf3;">
        <td style="padding:10px 8px; color:#2d3748;">${i + 1}</td>
        <td style="padding:10px 8px; color:#1a202c; font-weight:600;">${item.description || ''}</td>
        <td style="padding:10px 8px; text-align:center; color:#4a5568;">${item.qty || 1} ${item.unit || ''}</td>
        <td style="padding:10px 8px; text-align:right; color:#4a5568;">${formatMoney(item.unitPrice, currency)}</td>
        <td style="padding:10px 8px; text-align:right; font-weight:600; color:#1a202c;">${formatMoney((item.qty || 1) * item.unitPrice, currency)}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture Pro Forma ${invoice.number || 'DRTA-0001'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    font-family: 'IBM Plex Sans', sans-serif;
    background: #f7fafc; color: #2d3748;
    font-size: 13px; line-height: 1.5;
  }

  .page {
    max-width: 800px; margin: 2rem auto;
    background: #fff; border-radius: 8px;
    box-shadow: 0 4px 30px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  /* Header */
  .inv-header {
    background: linear-gradient(135deg, #0D1B2A 0%, #162436 100%);
    padding: 2.5rem;
    display: grid; grid-template-columns: 1fr auto; gap: 2rem; align-items: start;
  }

  .inv-logo {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1rem; color: #2ECC71; font-weight: 600;
  }
  .inv-logo span { color: #F6C90E; }

  .issuer-name { font-size: 1.1rem; color: #fff; font-weight: 700; margin-top: 0.4rem; }
  .issuer-title { font-size: 0.78rem; color: #8FA3B1; margin-top: 0.2rem; }
  .issuer-contact { font-size: 0.75rem; color: #8FA3B1; margin-top: 0.8rem; line-height: 1.7; }

  .inv-title-box { text-align: right; }
  .inv-type {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.15em;
    text-transform: uppercase; color: #F6C90E; margin-bottom: 0.3rem;
  }
  .inv-number {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.5rem; font-weight: 600; color: #fff;
  }
  .inv-date { font-size: 0.75rem; color: #8FA3B1; margin-top: 0.4rem; }

  /* Parties */
  .parties {
    display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
    padding: 2rem 2.5rem; border-bottom: 1px solid #e8edf3;
  }

  .party-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; text-transform: uppercase;
    letter-spacing: 0.15em; color: #27AE60; margin-bottom: 0.6rem;
  }
  .party-name { font-size: 0.95rem; font-weight: 700; color: #1a202c; margin-bottom: 0.3rem; }
  .party-info { font-size: 0.78rem; color: #718096; line-height: 1.7; }

  /* Items table */
  .items-section { padding: 2rem 2.5rem; }

  .items-section h3 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; text-transform: uppercase;
    letter-spacing: 0.15em; color: #27AE60; margin-bottom: 1rem;
  }

  table { width: 100%; border-collapse: collapse; }

  thead th {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em;
    color: #718096; padding: 8px; border-bottom: 2px solid #e8edf3;
  }
  thead th:last-child, thead th:nth-child(4) { text-align: right; }
  thead th:nth-child(3) { text-align: center; }

  /* Totaux */
  .totals { padding: 0 2.5rem 2rem; display: flex; justify-content: flex-end; }

  .totals-box {
    width: 280px;
    background: #f7fafc; border-radius: 6px; border: 1px solid #e8edf3; overflow: hidden;
  }

  .total-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.65rem 1rem; border-bottom: 1px solid #e8edf3;
    font-size: 0.82rem;
  }
  .total-row:last-child { border-bottom: none; background: #0D1B2A; color: #fff; }
  .total-row:last-child .tl { color: #fff; font-weight: 700; font-size: 0.9rem; }
  .total-row:last-child .tv { color: #2ECC71; font-weight: 700; font-size: 1rem; font-family: 'IBM Plex Mono', monospace; }

  .tl { color: #718096; }
  .tv { font-family: 'IBM Plex Mono', monospace; color: #1a202c; font-weight: 600; }

  .xof-note { font-size: 0.65rem; color: #a0aec0; text-align: right; padding: 0.3rem 1rem 0.5rem; }

  /* Payment */
  .payment-section {
    padding: 1.5rem 2.5rem; border-top: 1px solid #e8edf3;
    display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
  }

  .pay-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; text-transform: uppercase;
    letter-spacing: 0.15em; color: #27AE60; margin-bottom: 0.5rem;
  }
  .pay-info { font-size: 0.78rem; color: #4a5568; line-height: 1.7; }
  .due-date { font-family: 'IBM Plex Mono', monospace; font-size: 0.85rem; color: #E67E22; font-weight: 600; }

  /* Footer */
  .inv-footer {
    background: #f7fafc; border-top: 1px solid #e8edf3;
    padding: 1rem 2.5rem; text-align: center;
    font-size: 0.72rem; color: #a0aec0;
  }

  /* Notes */
  .notes-section { padding: 0 2.5rem 1.5rem; }
  .notes-section .note-title { font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.15em; color: #718096; margin-bottom: 0.4rem; }
  .notes-section p { font-size: 0.78rem; color: #718096; line-height: 1.6; }

  /* PRO FORMA watermark */
  .proforma-badge {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.15em;
    text-transform: uppercase;
    background: rgba(246,201,14,0.15); color: #F6C90E;
    border: 1px solid rgba(246,201,14,0.4);
    border-radius: 4px; padding: 0.15rem 0.6rem;
    margin-left: 0.5rem; vertical-align: middle;
  }

  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; border-radius: 0; max-width: 100%; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="inv-header">
    <div>
      <div class="inv-logo">dr<span>_</span>togbe<span>.R</span></div>
      <div class="issuer-name">${issuer.name}</div>
      <div class="issuer-title">${issuer.title}</div>
      <div class="issuer-contact">
        ${issuer.address?.replace(/\n/g, '<br>')} <br>
        ${issuer.phone} · ${issuer.email}
      </div>
    </div>
    <div class="inv-title-box">
      <div class="inv-type">Facture Pro Forma <span class="proforma-badge">PRO FORMA</span></div>
      <div class="inv-number">${invoice.number || 'DRTA-0001'}</div>
      <div class="inv-date">Émise le : ${formatDate(invoice.date)}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div>
      <div class="party-label">Prestataire</div>
      <div class="party-name">${issuer.name}</div>
      <div class="party-info">${issuer.address?.replace(/\n/g, '<br>')}<br>${issuer.email}</div>
    </div>
    <div>
      <div class="party-label">Client</div>
      <div class="party-name">${client.name || 'Nom du client'}</div>
      <div class="party-info">
        ${client.organization ? client.organization + '<br>' : ''}
        ${client.address ? client.address.replace(/\n/g, '<br>') + '<br>' : ''}
        ${client.email || ''}
      </div>
    </div>
  </div>

  <!-- Items -->
  <div class="items-section">
    <h3>Détail des prestations</h3>
    <table>
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>Description</th>
          <th>Qté</th>
          <th>P.U.</th>
          <th>Total HT</th>
        </tr>
      </thead>
      <tbody>${itemsHTML}</tbody>
    </table>
  </div>

  <!-- Totaux -->
  <div class="totals">
    <div class="totals-box">
      <div class="total-row">
        <span class="tl">Sous-total HT</span>
        <span class="tv">${formatMoney(subtotal, currency)}</span>
      </div>
      ${vatRate > 0 ? `
      <div class="total-row">
        <span class="tl">TVA (${vatRate}%)</span>
        <span class="tv">${formatMoney(vatAmount, currency)}</span>
      </div>` : `
      <div class="total-row">
        <span class="tl" style="font-size:0.72rem;">${rates?.invoice_settings?.defaults?.vat_label || 'Exonéré TVA'}</span>
        <span class="tv">0,00 ${currency}</span>
      </div>`}
      <div class="total-row">
        <span class="tl">TOTAL TTC</span>
        <span class="tv">${formatMoney(total, currency)}</span>
      </div>
      <div class="xof-note">≈ ${formatMoneyXOF(total)} (indicatif)</div>
    </div>
  </div>

  <!-- Notes -->
  ${notes ? `<div class="notes-section"><div class="note-title">Notes</div><p>${notes}</p></div>` : ''}

  <!-- Paiement -->
  <div class="payment-section">
    <div>
      <div class="pay-label">Conditions de règlement</div>
      <div class="pay-info">
        Paiement à <strong>${invoice.paymentTermsDays || 30} jours</strong><br>
        Échéance : <span class="due-date">${formatDate(dueDate)}</span>
      </div>
    </div>
    <div>
      <div class="pay-label">Mode de paiement</div>
      <div class="pay-info">${rates?.invoice_settings?.defaults?.footer_note || 'Virement bancaire ou Mobile Money'}</div>
    </div>
  </div>

  <div class="inv-footer">
    Ce document est une facture pro forma et ne constitue pas une facture définitive. Elle est émise à titre informatif pour engagement de mission.
  </div>
</div>

<!-- Boutons d'action (cachés à l'impression) -->
<div class="no-print" style="text-align:center; padding:1.5rem; display:flex; gap:1rem; justify-content:center;">
  <button onclick="window.print()" style="background:#27AE60;color:#fff;border:none;padding:0.7rem 2rem;border-radius:4px;font-size:0.9rem;font-weight:600;cursor:pointer;">
    🖨 Imprimer / Sauvegarder en PDF
  </button>
  <button onclick="window.close()" style="background:transparent;color:#718096;border:1px solid #e8edf3;padding:0.7rem 2rem;border-radius:4px;font-size:0.9rem;cursor:pointer;">
    ✕ Fermer
  </button>
</div>
</body>
</html>`;
  }

  // ── Ouvrir la facture dans un nouvel onglet ──
  function openPreview(data) {
    const html = generateHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ── Télécharger HTML ──
  function downloadHTML(data) {
    const html = generateHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${data.invoice?.number || 'proforma'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { calculate, formatMoney, formatDate, generateHTML, openPreview, downloadHTML };
})();
