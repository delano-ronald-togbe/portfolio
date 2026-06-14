/**
 * app.js — Application principale (site public)
 * Charge les données JSON et rend le site dynamiquement
 */

// ── Utilitaires UI ──
const UI = {
  toast(msg, type = 'success', duration = 3500) {
    const el = document.getElementById('toast') || (() => {
      const t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast';
      document.body.appendChild(t);
      return t;
    })();
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), duration);
  },

  modal: {
    open(id) { document.getElementById(id)?.classList.add('open'); document.body.style.overflow = 'hidden'; },
    close(id) { document.getElementById(id)?.classList.remove('open'); document.body.style.overflow = ''; }
  },

  // Scroll progress nav
  initScrollNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  },

  // Observer pour animations
  initFadeIn() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  },

  // Counter animation
  animateCounter(el) {
    const target = parseInt(el.dataset.target || el.textContent);
    const plus = el.querySelector('.plus');
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 25));
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count;
      if (plus) el.appendChild(plus);
      if (count >= target) clearInterval(timer);
    }, 55);
  },

  initCounters() {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        document.querySelectorAll('[data-counter]').forEach(el => UI.animateCounter(el));
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    const bar = document.querySelector('.stats-bar');
    if (bar) observer.observe(bar);
  }
};

// ── Terminal animé ──
const Terminal = {
  lines: [
    '<span style="color:#4A6741"># Chargement du profil consultant...</span>',
    '<span style="color:#C678DD">library</span>(<span style="color:#98C379">tidyverse</span>)',
    '<span style="color:#C678DD">library</span>(<span style="color:#98C379">lme4</span>)',
    '',
    '<span style="color:#4A6741"># Expertise principale</span>',
    '<span style="color:#E06C75">profile</span> <span style="color:#2ECC71">&lt;-</span> <span style="color:#61AFEF">list</span>(',
    '  <span style="color:#E06C75">name</span>  = <span style="color:#98C379">"Delano R. Togbé"</span>,',
    '  <span style="color:#E06C75">role</span>  = <span style="color:#98C379">"Biostatisticien"</span>,',
    '  <span style="color:#E06C75">years</span> = <span style="color:#E5C07B">6</span>,',
    '  <span style="color:#E06C75">tools</span> = <span style="color:#61AFEF">c</span>(<span style="color:#98C379">"R"</span>, <span style="color:#98C379">"Python"</span>, <span style="color:#98C379">"QGIS"</span>)',
    ')',
    '',
    '<span style="color:#4A6741"># Modélisation en cours...</span>',
    '<span style="color:#E06C75">model</span> <span style="color:#2ECC71">&lt;-</span> <span style="color:#61AFEF">glmer</span>(disease ~ time + (1|site),',
    '              data = field_data,',
    '              family = <span style="color:#61AFEF">poisson</span>())',
    '',
    '<span style="color:#61AFEF">summary</span>(model) <span style="color:#4A6741"># p &lt; 0.001 ***</span>',
    '<span style="color:#ABB2BF">&gt; AIC: 1243.2 | BIC: 1267.8</span>',
  ],
  idx: 0,
  el: null,

  init(targetId = 'terminal-body') {
    this.el = document.getElementById(targetId);
    if (!this.el) return;
    setTimeout(() => this._type(), 800);
  },

  _type() {
    if (this.idx >= this.lines.length) {
      this.el.innerHTML += '<br><span style="color:#2ECC71">❯ </span><span style="display:inline-block;width:8px;height:1em;background:#2ECC71;vertical-align:middle;animation:blink 1s step-end infinite;"></span>';
      return;
    }
    const div = document.createElement('div');
    div.innerHTML = this.lines[this.idx];
    this.el.appendChild(div);
    this.el.scrollTop = this.el.scrollHeight;
    this.idx++;
    const delay = this.lines[this.idx - 1] === '' ? 100 : 70 + Math.random() * 80;
    setTimeout(() => this._type(), delay);
  }
};

// ── Rendu projets ──
const Projects = {
  data: [],
  currentFilter: 'all',

  async init() {
    this.data = await DB.getAll('projects');
    this.render();
    this.initFilters();
  },

  render(filter = 'all') {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const visible = filter === 'all'
      ? this.data.filter(p => p.status === 'published')
      : this.data.filter(p => p.status === 'published' && p.category === filter);

    if (visible.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--slate);">Aucun projet dans cette catégorie pour le moment.</div>`;
      return;
    }

    grid.innerHTML = visible.map(p => `
      <div class="project-card" onclick="Projects.openModal('${p.id}')" data-id="${p.id}">
        ${p.link ? '<span class="proj-link-icon">↗</span>' : ''}
        <div class="proj-category">${p.categoryLabel}</div>
        <h3>${p.title}</h3>
        <p>${p.desc.substring(0, 140)}${p.desc.length > 140 ? '...' : ''}</p>
        <div class="proj-meta">
          <div class="proj-tools">
            ${p.tools.slice(0, 3).map(t => `<span class="tag tag-gold">${t}</span>`).join('')}
            ${p.tools.length > 3 ? `<span class="tag tag-slate">+${p.tools.length - 3}</span>` : ''}
          </div>
          <span class="proj-year">${p.year}</span>
        </div>
      </div>
    `).join('');
  },

  initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        Projects.render(this.dataset.filter);
      });
    });
  },

  openModal(id) {
    const p = this.data.find(x => x.id === id);
    if (!p) return;
    const m = document.getElementById('project-modal');
    if (!m) return;
    m.querySelector('#pm-cat').textContent = p.categoryLabel;
    m.querySelector('#pm-title').textContent = p.title;
    m.querySelector('#pm-desc').textContent = p.desc;
    m.querySelector('#pm-tools').innerHTML = p.tools.map(t => `<span class="tag tag-gold">${t}</span>`).join(' ');
    m.querySelector('#pm-meta').innerHTML = `📅 ${p.year} &nbsp;·&nbsp; 🏢 ${p.client} &nbsp;·&nbsp; 🌍 ${(p.country || []).join(', ')}`;
    const link = m.querySelector('#pm-link');
    if (link) {
      if (p.link) { link.href = p.link; link.style.display = 'inline-flex'; }
      else { link.style.display = 'none'; }
    }
    UI.modal.open('project-modal');
  }
};

// ── Rendu articles ──
const Articles = {
  async init() {
    const articles = await DB.getAll('articles');
    const published = articles.filter(a => a.status === 'published');

    // Article en vedette
    const featured = published.find(a => a.featured) || published[0];
    const featBox = document.getElementById('featured-article');
    if (featured && featBox) {
      featBox.querySelector('#feat-tag').textContent = featured.theme;
      featBox.querySelector('#feat-title').textContent = featured.title;
      featBox.querySelector('#feat-desc').textContent = featured.summary;
      featBox.querySelector('#feat-meta').textContent = `// ${featured.date || 'À venir'} · ${featured.readTime || ''}`;
      if (featured.link) { featBox.style.cursor = 'pointer'; featBox.onclick = () => window.open(featured.link, '_blank'); }
      if (featured.image) { const fig = featBox.querySelector('.article-fig img'); if (fig) fig.src = featured.image; }
    }

    // Liste des autres articles
    const others = published.filter(a => !a.featured).slice(0, 4);
    const list = document.getElementById('articles-list');
    if (list) {
      list.innerHTML = others.map((a, i) => `
        <div class="article-item" ${a.link ? `onclick="window.open('${a.link}','_blank')"` : ''}>
          <div class="art-num">0${i + 2}</div>
          <div>
            <span class="tag tag-emerald">${a.theme}</span>
            <h4>${a.title}</h4>
            <p>${a.date || 'Bientôt'} ${a.readTime ? '· ' + a.readTime : ''}</p>
          </div>
        </div>
      `).join('') || '<div style="color:var(--slate);padding:1rem;font-size:0.85rem;">Articles en cours de rédaction...</div>';
    }
  }
};

// ── Rendu publications ──
const Publications = {
  async init() {
    const data = await DB.loadJSON('publications.json');
    const pubs = data?.publications || [];
    const list = document.getElementById('pub-list');
    if (!list) return;

    list.innerHTML = pubs.map(p => {
      const authorsHTML = p.authors.map((a, i) => i === p.myAuthorIndex ? `<strong>${a}</strong>` : a).join(', ');
      return `
        <div class="pub-item fade-in">
          <div class="pub-year">${p.year}</div>
          <div>
            <div class="pub-title">${p.title}</div>
            <div class="pub-authors">${authorsHTML}</div>
            <div class="pub-journal">${p.journal}</div>
            ${p.doi ? `<a class="pub-doi" href="${p.link}" target="_blank">DOI: ${p.doi} ↗</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
};

// ── Honoraires ──
const Rates = {
  async init() {
    const data = await DB.getRates();
    const packages = data?.rates?.packages || [];
    const currency = data?.rates?.currency_symbol || '€';
    const grid = document.getElementById('rates-grid');
    if (!grid) return;

    grid.innerHTML = packages.map(pkg => `
      <div class="rate-card card ${pkg.featured ? 'featured' : ''}">
        <div class="rate-type">${pkg.name}</div>
        <div class="rate-amount">
          <span class="currency">${currency}</span>${pkg.amount}<span class="period"> / ${pkg.unit}</span>
        </div>
        <p class="rate-desc">${pkg.description}</p>
        <ul class="rate-features">
          ${pkg.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        ${pkg.note ? `<p style="font-size:0.72rem;color:var(--gold);margin-bottom:1rem;font-family:var(--font-mono);">${pkg.note}</p>` : ''}
        <button class="btn btn-primary btn-full btn-sm" onclick="InvoiceUI.prefillRate('${pkg.id}')">
          Demander un devis
        </button>
      </div>
    `).join('');

    const note = data?.rates?.display_note;
    const noteEl = document.getElementById('rates-note');
    if (noteEl && note) noteEl.textContent = note;
  }
};

// ── Interface Facture (côté public) ──
const InvoiceUI = {
  ratesData: null,
  selectedRate: null,
  items: [{ description: '', qty: 1, unit: 'jour', unitPrice: 0 }],

  async init() {
    this.ratesData = await DB.getRates();
    this.renderItems();
    this.bindEvents();
  },

  prefillRate(rateId) {
    if (!this.ratesData) return;
    const rate = this.ratesData.rates?.packages?.find(p => p.id === rateId);
    if (!rate) return;
    this.items = [{ description: rate.description, qty: 1, unit: rate.unit, unitPrice: rate.amount }];
    this.renderItems();
    this.updateTotal();
    // Scroller vers le formulaire de devis
    document.getElementById('invoice-section')?.scrollIntoView({ behavior: 'smooth' });
    UI.toast(`Tarif "${rate.name}" pré-rempli !`);
  },

  renderItems() {
    const tbody = document.getElementById('inv-items');
    if (!tbody) return;
    tbody.innerHTML = this.items.map((item, i) => `
      <tr>
        <td><input type="text" value="${item.description}" placeholder="Description" oninput="InvoiceUI.updateItem(${i},'description',this.value)"></td>
        <td><input type="number" value="${item.qty}" min="0.5" step="0.5" style="width:70px" oninput="InvoiceUI.updateItem(${i},'qty',this.value)"></td>
        <td>
          <select onchange="InvoiceUI.updateItem(${i},'unit',this.value)">
            ${['heure','jour','forfait','session','rapport'].map(u => `<option value="${u}" ${item.unit===u?'selected':''}>${u}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" value="${item.unitPrice}" min="0" step="10" style="width:90px" oninput="InvoiceUI.updateItem(${i},'unitPrice',this.value)"></td>
        <td style="text-align:right;font-family:var(--font-mono);color:var(--emerald-bright);">
          ${(item.qty * item.unitPrice).toLocaleString('fr-FR', {minimumFractionDigits:2})} €
        </td>
        <td>
          ${this.items.length > 1 ? `<button class="btn btn-ghost btn-sm" onclick="InvoiceUI.removeItem(${i})" style="color:var(--danger)">✕</button>` : ''}
        </td>
      </tr>
    `).join('');
    this.updateTotal();
  },

  updateItem(i, field, value) {
    this.items[i][field] = field === 'qty' || field === 'unitPrice' ? parseFloat(value) || 0 : value;
    this.updateTotal();
    // Re-render seulement le total, pas tout le tableau
    const rows = document.querySelectorAll('#inv-items tr');
    if (rows[i]) {
      const totalCell = rows[i].querySelector('td:nth-child(5)');
      if (totalCell) totalCell.textContent = (this.items[i].qty * this.items[i].unitPrice).toLocaleString('fr-FR', {minimumFractionDigits:2}) + ' €';
    }
  },

  addItem() {
    this.items.push({ description: '', qty: 1, unit: 'jour', unitPrice: 0 });
    this.renderItems();
  },

  removeItem(i) {
    this.items.splice(i, 1);
    this.renderItems();
  },

  updateTotal() {
    const { subtotal, total } = Invoice.calculate(this.items);
    const el = document.getElementById('inv-total');
    if (el) el.textContent = Invoice.formatMoney(total);
    const xofEl = document.getElementById('inv-total-xof');
    if (xofEl) xofEl.textContent = `≈ ${Math.round(total * 655.957).toLocaleString('fr-FR')} XOF`;
  },

  async generate() {
    const clientName = document.getElementById('inv-client-name')?.value;
    const clientOrg  = document.getElementById('inv-client-org')?.value;
    const clientEmail= document.getElementById('inv-client-email')?.value;
    const clientAddr = document.getElementById('inv-client-addr')?.value;
    const notes      = document.getElementById('inv-notes')?.value;
    const terms      = parseInt(document.getElementById('inv-terms')?.value || '30');

    if (!clientName) { UI.toast('Veuillez saisir le nom du client', 'error'); return; }
    if (this.items.every(it => !it.description || it.unitPrice === 0)) {
      UI.toast('Veuillez renseigner au moins une prestation', 'error'); return;
    }

    const ratesData = await DB.getRates();
    const issuer = { ...ratesData?.invoice_settings?.issuer, currency_symbol: '€' };

    // Numéro de facture
    const invData = { ...ratesData };
    const savedInvoice = await DB.saveInvoice({
      client: clientName, total: Invoice.calculate(this.items).total,
      date: new Date().toISOString().slice(0, 10), status: 'proforma'
    });

    const data = {
      issuer,
      client: { name: clientName, organization: clientOrg, email: clientEmail, address: clientAddr },
      invoice: { number: savedInvoice.number, date: new Date().toISOString().slice(0, 10), paymentTermsDays: terms },
      items: this.items,
      notes,
      rates: ratesData
    };

    Invoice.openPreview(data);
    UI.toast('Facture pro forma générée ! ✓');
  },

  bindEvents() {
    document.getElementById('add-item-btn')?.addEventListener('click', () => this.addItem());
    document.getElementById('generate-invoice-btn')?.addEventListener('click', () => this.generate());
  }
};

// ── Contact ──
const Contact = {
  init() {
    document.getElementById('contact-form-btn')?.addEventListener('click', () => {
      const name    = document.getElementById('c-name')?.value;
      const email   = document.getElementById('c-email')?.value;
      const subject = document.getElementById('c-subject')?.value;
      const message = document.getElementById('c-message')?.value;

      if (!name || !email || !message) {
        UI.toast('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
      }

      // Fallback mailto (GitHub Pages = pas de backend)
      const body = `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
      const mailtoLink = `mailto:delanodray@gmail.com?subject=${encodeURIComponent(subject + ' - Portfolio')}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      UI.toast('Redirection vers votre client mail...');
    });
  }
};

// ── Initialisation globale ──
document.addEventListener('DOMContentLoaded', async () => {
  UI.initScrollNav();
  UI.initFadeIn();
  UI.initCounters();

  Terminal.init('terminal-body');

  await Projects.init();
  await Articles.init();
  await Publications.init();
  await Rates.init();
  await InvoiceUI.init();
  Contact.init();

  // Fermeture modales
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { UI.modal.close('project-modal'); } });
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) UI.modal.close(m.id); });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) UI.modal.close(modal.id);
    });
  });
});
