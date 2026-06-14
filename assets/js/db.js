/**
 * db.js — Gestionnaire de données (localStorage + JSON files)
 * 
 * Architecture :
 * - Données initiales : fichiers JSON dans /data/
 * - Modifications admin : localStorage du navigateur
 * - Export : bouton dans l'admin → télécharge les JSON mis à jour
 *
 * Sur GitHub Pages, les JSON sont en lecture seule.
 * L'admin modifie via localStorage, puis exporte les JSON
 * pour les committer sur GitHub (workflow git normal).
 */

const DB = (() => {
  const STORE_PREFIX = 'drta_db_';
  const DATA_PATH = '../data/';

  // ── Chargement d'un fichier JSON ──
  async function loadJSON(filename) {
    try {
      const res = await fetch(`${DATA_PATH}${filename}?v=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[DB] Impossible de charger ${filename}:`, err);
      return null;
    }
  }

  // ── Obtenir les données (localStorage > JSON) ──
  async function get(collection) {
    const stored = localStorage.getItem(STORE_PREFIX + collection);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    // Fallback : charger le JSON original
    const data = await loadJSON(`${collection}.json`);
    return data ? (data[collection] || data) : [];
  }

  // ── Sauvegarder dans localStorage ──
  function save(collection, data) {
    try {
      localStorage.setItem(STORE_PREFIX + collection, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('[DB] Erreur sauvegarde:', err);
      return false;
    }
  }

  // ── CRUD générique ──
  async function getAll(collection) {
    const data = await get(collection);
    return Array.isArray(data) ? data : (data?.[collection] || []);
  }

  async function getOne(collection, id) {
    const items = await getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  async function add(collection, item) {
    const items = await getAll(collection);
    // Générer un ID si absent
    if (!item.id) {
      const prefix = collection.charAt(0).toUpperCase();
      item.id = `${prefix}${String(items.length + 1).padStart(3, '0')}_${Date.now()}`;
    }
    item.created_at = new Date().toISOString();
    item.updated_at = item.created_at;
    items.push(item);
    save(collection, items);
    return item;
  }

  async function update(collection, id, updates) {
    const items = await getAll(collection);
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
    save(collection, items);
    return items[idx];
  }

  async function remove(collection, id) {
    const items = await getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    save(collection, filtered);
    return filtered.length < items.length;
  }

  // ── Filtrage ──
  async function filter(collection, predicate) {
    const items = await getAll(collection);
    return items.filter(predicate);
  }

  // ── Export JSON (téléchargement) ──
  async function exportJSON(collection) {
    const items = await getAll(collection);
    const blob = new Blob([JSON.stringify({ [collection]: items }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Export complet ──
  async function exportAll() {
    const collections = ['projects', 'articles', 'publications', 'figures', 'reports', 'invoices'];
    for (const col of collections) {
      await exportJSON(col);
      await new Promise(r => setTimeout(r, 300)); // éviter le blocage
    }
  }

  // ── Reset (supprimer les overrides localStorage) ──
  function resetCollection(collection) {
    localStorage.removeItem(STORE_PREFIX + collection);
  }

  function resetAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }

  // ── Statistiques ──
  async function getStats() {
    const [projects, articles, invoices] = await Promise.all([
      getAll('projects'),
      getAll('articles'),
      getAll('invoices')
    ]);

    const published_projects = projects.filter(p => p.status === 'published').length;
    const published_articles = articles.filter(a => a.status === 'published').length;
    const total_invoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

    return { published_projects, published_articles, total_invoiced, total_invoices: invoices.length };
  }

  // ── Chargement des honoraires ──
  async function getRates() {
    const stored = localStorage.getItem(STORE_PREFIX + 'rates');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return await loadJSON('rates.json');
  }

  function saveRates(ratesData) {
    return save('rates', ratesData);
  }

  // ── Gestion des factures ──
  async function getInvoices() {
    return await getAll('invoices');
  }

  async function saveInvoice(invoice) {
    // Générer le numéro de facture
    const rates = await getRates();
    const settings = rates?.invoice_settings?.defaults || {};
    const prefix = settings.invoice_prefix || 'DRTA';
    const num = settings.next_number || 1;
    invoice.number = `${prefix}-${String(num).padStart(4, '0')}`;

    // Incrémenter le numéro
    if (rates?.invoice_settings?.defaults) {
      rates.invoice_settings.defaults.next_number = num + 1;
      saveRates(rates);
    }

    return await add('invoices', invoice);
  }

  return {
    getAll, getOne, add, update, remove, filter,
    exportJSON, exportAll, resetCollection, resetAll,
    getStats, getRates, saveRates, getInvoices, saveInvoice,
    loadJSON, save
  };
})();
