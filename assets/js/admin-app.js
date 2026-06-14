/**
 * admin-app.js — Logique du panneau d'administration
 */

document.addEventListener('DOMContentLoaded', () => {
  // Vérification auth immédiate
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Afficher le temps de session
  const timeEl = document.getElementById('session-time');
  if (timeEl) {
    const updateTime = () => {
      const mins = Auth.sessionTimeLeft();
      timeEl.textContent = `Session: ${mins}min`;
    };
    updateTime();
    setInterval(updateTime, 60000);
  }

  // Sidebar navigation
  initSidebar();

  // Charger la section initiale
  loadSection('dashboard');
});

// ── Sidebar ──
function initSidebar() {
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function() {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      loadSection(this.dataset.section);
    });
  });
}

// ── Chargement des sections ──
async function loadSection(section) {
  const content = document.getElementById('admin-main');
  if (!content) return;

  // Titre de la page
  const titles = {
    dashboard: 'Tableau de bord',
    projects:  'Gestion des projets',
    articles:  'Articles & Blog',
    figures:   'Figures & Visualisations',
    reports:   'Rapports & Documents',
    publications: 'Publications',
    rates:     'Honoraires',
    invoices:  'Factures',
    settings:  'Paramètres'
  };
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl) titleEl.textContent = titles[section] || section;

  switch (section) {
    case 'dashboard':   await renderDashboard(content); break;
    case 'projects':    await renderProjects(content); break;
    case 'articles':    await renderArticles(content); break;
    case 'figures':     await renderFigures(content); break;
    case 'reports':     await renderReports(content); break;
    case 'publications':await renderPublications(content); break;
    case 'rates':       await renderRates(content); break;
    case 'invoices':    await renderInvoices(content); break;
    case 'settings':    renderSettings(content); break;
    default: content.innerHTML = '<p style="color:var(--slate)">Section en développement...</p>';
  }
}

// ── Dashboard ──
async function renderDashboard(el) {
  const stats = await DB.getStats();
  const projects = await DB.getAll('projects');
  const articles = await DB.getAll('articles');

  el.innerHTML = `
    <div class="admin-stat-grid">
      <div class="admin-stat-card">
        <div class="asn">${projects.filter(p=>p.status==='published').length}</div>
        <div class="asl">Projets publiés</div>
      </div>
      <div class="admin-stat-card">
        <div class="asn">${articles.filter(a=>a.status==='published').length}</div>
        <div class="asl">Articles publiés</div>
      </div>
      <div class="admin-stat-card">
        <div class="asn">${articles.filter(a=>a.status==='draft').length}</div>
        <div class="asl">Brouillons</div>
      </div>
      <div class="admin-stat-card">
        <div class="asn">${stats.total_invoices}</div>
        <div class="asl">Factures émises</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem;">
      <div class="card">
        <h3 style="color:var(--white);margin-bottom:1rem;">Actions rapides</h3>
        <div style="display:flex;flex-direction:column;gap:0.6rem;">
          <button class="btn btn-primary" onclick="loadSection('projects'); document.querySelector('[data-section=projects]').click()">+ Nouveau projet</button>
          <button class="btn btn-outline" onclick="document.querySelector('[data-section=articles]').click()">+ Nouvel article</button>
          <button class="btn btn-outline" onclick="document.querySelector('[data-section=invoices]').click()">📄 Nouvelle facture</button>
          <button class="btn btn-ghost" onclick="DB.exportAll()">💾 Exporter toutes les données</button>
        </div>
      </div>
      <div class="card">
        <h3 style="color:var(--white);margin-bottom:1rem;">Workflow GitHub Pages</h3>
        <div style="font-size:0.82rem;color:var(--slate);line-height:1.8;">
          <strong style="color:var(--gold);">Ajouter du contenu :</strong><br>
          1. Remplir le formulaire ci-dessus<br>
          2. Cliquer "Exporter toutes les données"<br>
          3. Remplacer les JSON dans <code>/data/</code><br>
          4. Commit & push → GitHub Pages se met à jour
        </div>
      </div>
    </div>
  `;
}

// ── Projets admin ──
async function renderProjects(el) {
  const projects = await DB.getAll('projects');

  el.innerHTML = `
    <div class="panel-header">
      <h2>Projets (${projects.length})</h2>
      <button class="btn btn-primary" onclick="showProjectForm()">+ Ajouter un projet</button>
    </div>
    <div id="project-form-area"></div>
    <div class="card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Titre</th>
            <th>Catégorie</th>
            <th>Année</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => `
            <tr>
              <td><span class="tag tag-slate" style="font-size:0.6rem;">${p.id}</span></td>
              <td class="td-title">${p.title}</td>
              <td><span class="tag tag-emerald">${p.category}</span></td>
              <td>${p.year}</td>
              <td><span class="status-${p.status}">● ${p.status}</span></td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-sm action-edit" onclick="editProject('${p.id}')">Éditer</button>
                  <button class="btn btn-sm action-delete" onclick="deleteItem('projects','${p.id}', this)">Suppr.</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showProjectForm(existing = null) {
  const area = document.getElementById('project-form-area');
  if (!area) return;
  const p = existing || {};
  area.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="color:var(--white);margin-bottom:1.5rem;">${existing ? 'Modifier' : 'Nouveau'} projet</h3>
      <div class="form-grid">
        <div class="form-group"><label>Titre</label><input type="text" id="pf-title" value="${p.title||''}"></div>
        <div class="form-group"><label>Catégorie</label>
          <select id="pf-cat">
            ${['epidemio','agro','ecology','ml','social'].map(c => `<option value="${c}" ${p.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Label catégorie</label><input type="text" id="pf-catlabel" value="${p.categoryLabel||''}"></div>
        <div class="form-group"><label>Année</label><input type="text" id="pf-year" value="${p.year||''}"></div>
        <div class="form-group"><label>Client / Institution</label><input type="text" id="pf-client" value="${p.client||''}"></div>
        <div class="form-group"><label>Pays (séparés par virgule)</label><input type="text" id="pf-country" value="${(p.country||[]).join(', ')}"></div>
        <div class="form-group"><label>Outils (séparés par virgule)</label><input type="text" id="pf-tools" value="${(p.tools||[]).join(', ')}"></div>
        <div class="form-group"><label>Lien externe (optionnel)</label><input type="url" id="pf-link" value="${p.link||''}"></div>
        <div class="form-group full"><label>Description complète</label><textarea id="pf-desc" style="min-height:100px">${p.desc||''}</textarea></div>
        <div class="form-group"><label>Statut</label>
          <select id="pf-status">
            <option value="published" ${p.status==='published'?'selected':''}>Publié</option>
            <option value="draft" ${p.status==='draft'?'selected':''}>Brouillon</option>
            <option value="hidden" ${p.status==='hidden'?'selected':''}>Masqué</option>
          </select>
        </div>
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:0.8rem;">
        <button class="btn btn-primary" onclick="saveProject('${p.id||''}')">💾 Sauvegarder</button>
        <button class="btn btn-ghost" onclick="document.getElementById('project-form-area').innerHTML=''">Annuler</button>
      </div>
    </div>
  `;
  area.scrollIntoView({ behavior: 'smooth' });
}

async function editProject(id) {
  const p = await DB.getOne('projects', id);
  if (p) showProjectForm(p);
}

async function saveProject(id) {
  const data = {
    title: document.getElementById('pf-title')?.value,
    category: document.getElementById('pf-cat')?.value,
    categoryLabel: document.getElementById('pf-catlabel')?.value,
    year: document.getElementById('pf-year')?.value,
    client: document.getElementById('pf-client')?.value,
    country: document.getElementById('pf-country')?.value.split(',').map(s => s.trim()).filter(Boolean),
    tools: document.getElementById('pf-tools')?.value.split(',').map(s => s.trim()).filter(Boolean),
    link: document.getElementById('pf-link')?.value,
    desc: document.getElementById('pf-desc')?.value,
    status: document.getElementById('pf-status')?.value,
  };

  if (!data.title) { showToast('Titre requis', 'error'); return; }

  if (id) { await DB.update('projects', id, data); showToast('Projet mis à jour !'); }
  else     { await DB.add('projects', data); showToast('Projet ajouté !'); }

  document.getElementById('project-form-area').innerHTML = '';
  await renderProjects(document.getElementById('admin-main'));
}

// ── Articles admin ──
async function renderArticles(el) {
  const articles = await DB.getAll('articles');
  el.innerHTML = `
    <div class="panel-header">
      <h2>Articles (${articles.length})</h2>
      <button class="btn btn-primary" onclick="showArticleForm()">+ Nouvel article</button>
    </div>
    <div id="article-form-area"></div>
    <div class="card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>ID</th><th>Titre</th><th>Thème</th><th>Type</th><th>Source</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>
          ${articles.map(a => `
            <tr>
              <td><span class="tag tag-slate" style="font-size:0.6rem;">${a.id}</span></td>
              <td class="td-title">${a.title}</td>
              <td><span class="tag tag-emerald">${a.theme}</span></td>
              <td>${a.type || 'article'}</td>
              <td><span class="tag ${a.source==='external'?'tag-gold':'tag-slate'}">${a.source||'original'}</span></td>
              <td><span class="status-${a.status}">● ${a.status}</span></td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-sm action-edit" onclick="editArticle('${a.id}')">Éditer</button>
                  <button class="btn btn-sm action-delete" onclick="deleteItem('articles','${a.id}', this)">Suppr.</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showArticleForm(existing = null) {
  const area = document.getElementById('article-form-area');
  if (!area) return;
  const a = existing || {};
  area.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="color:var(--white);margin-bottom:1.5rem;">${existing ? 'Modifier' : 'Nouvel'} article</h3>
      <div class="form-grid">
        <div class="form-group full"><label>Titre</label><input type="text" id="af-title" value="${a.title||''}"></div>
        <div class="form-group"><label>Thème</label>
          <select id="af-theme">
            ${['Méthodologie','Tutoriel R','Tutoriel Python','Cas d\'étude','Data Viz','MLOps'].map(t=>`<option ${a.theme===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Type</label>
          <select id="af-type">
            ${['article','tutoriel','cas-etude','note'].map(t=>`<option value="${t}" ${a.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Source</label>
          <select id="af-source">
            <option value="original" ${a.source==='original'?'selected':''}>Original</option>
            <option value="external" ${a.source==='external'?'selected':''}>Lien externe</option>
          </select>
        </div>
        <div class="form-group"><label>Lien externe (si source externe)</label><input type="url" id="af-link" value="${a.link||''}"></div>
        <div class="form-group"><label>Image (URL)</label><input type="url" id="af-image" value="${a.image||''}"></div>
        <div class="form-group"><label>Date (YYYY-MM-DD)</label><input type="date" id="af-date" value="${a.date||''}"></div>
        <div class="form-group"><label>Temps de lecture</label><input type="text" id="af-read" value="${a.readTime||''}" placeholder="Ex: 8 min"></div>
        <div class="form-group full"><label>Résumé</label><textarea id="af-summary">${a.summary||''}</textarea></div>
        <div class="form-group full"><label>Contenu (Markdown)</label><textarea id="af-content" style="min-height:150px;font-family:var(--font-mono);font-size:0.8rem;">${a.content||''}</textarea></div>
        <div class="form-group"><label>Statut</label>
          <select id="af-status">
            <option value="published" ${a.status==='published'?'selected':''}>Publié</option>
            <option value="draft" ${a.status==='draft'?'selected':''}>Brouillon</option>
          </select>
        </div>
        <div class="form-group"><label>En vedette ?</label>
          <select id="af-featured">
            <option value="false" ${!a.featured?'selected':''}>Non</option>
            <option value="true" ${a.featured?'selected':''}>Oui</option>
          </select>
        </div>
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:0.8rem;">
        <button class="btn btn-primary" onclick="saveArticle('${a.id||''}')">💾 Sauvegarder</button>
        <button class="btn btn-ghost" onclick="document.getElementById('article-form-area').innerHTML=''">Annuler</button>
      </div>
    </div>
  `;
  area.scrollIntoView({ behavior: 'smooth' });
}

async function editArticle(id) {
  const a = await DB.getOne('articles', id);
  if (a) showArticleForm(a);
}

async function saveArticle(id) {
  const data = {
    title:    document.getElementById('af-title')?.value,
    theme:    document.getElementById('af-theme')?.value,
    type:     document.getElementById('af-type')?.value,
    source:   document.getElementById('af-source')?.value,
    link:     document.getElementById('af-link')?.value,
    image:    document.getElementById('af-image')?.value,
    date:     document.getElementById('af-date')?.value,
    readTime: document.getElementById('af-read')?.value,
    summary:  document.getElementById('af-summary')?.value,
    content:  document.getElementById('af-content')?.value,
    status:   document.getElementById('af-status')?.value,
    featured: document.getElementById('af-featured')?.value === 'true',
  };
  if (!data.title) { showToast('Titre requis', 'error'); return; }
  if (id) { await DB.update('articles', id, data); showToast('Article mis à jour !'); }
  else     { await DB.add('articles', data); showToast('Article ajouté !'); }
  document.getElementById('article-form-area').innerHTML = '';
  await renderArticles(document.getElementById('admin-main'));
}

// ── Figures ──
async function renderFigures(el) {
  const figures = await DB.getAll('figures');
  el.innerHTML = `
    <div class="panel-header">
      <h2>Figures & Visualisations (${figures.length})</h2>
      <button class="btn btn-primary" onclick="showFigureForm()">+ Ajouter une figure</button>
    </div>
    <div id="figure-form-area"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-top:1rem;">
      ${figures.length ? figures.map(f => `
        <div class="card">
          <div style="height:120px;background:var(--navy);border-radius:4px;margin-bottom:1rem;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            ${f.image ? `<img src="${f.image}" style="width:100%;height:100%;object-fit:cover;">` : '<span style="color:var(--text-muted);font-size:1.5rem;">📊</span>'}
          </div>
          <div class="tag tag-emerald" style="margin-bottom:0.5rem;">${f.type}</div>
          <div style="font-weight:600;color:var(--white);font-size:0.9rem;margin-bottom:0.5rem;">${f.title}</div>
          <div style="font-size:0.78rem;color:var(--slate);">${f.description?.substring(0,80)}...</div>
          <div style="margin-top:1rem;display:flex;gap:0.5rem;">
            <button class="btn btn-sm action-delete" onclick="deleteItem('figures','${f.id}',this)">Suppr.</button>
          </div>
        </div>
      `).join('') : '<div style="color:var(--slate);padding:2rem;">Aucune figure ajoutée.</div>'}
    </div>
  `;
}

function showFigureForm() {
  const area = document.getElementById('figure-form-area');
  if (!area) return;
  area.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="color:var(--white);margin-bottom:1.5rem;">Nouvelle figure</h3>
      <div class="form-grid">
        <div class="form-group full"><label>Titre</label><input type="text" id="ff-title" placeholder="Ex: Distribution des infestations par site"></div>
        <div class="form-group"><label>Type de visualisation</label>
          <select id="ff-type">
            ${['map','scatter','boxplot','timeseries','heatmap','dendrogram','bar','other'].map(t=>`<option>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Projet associé (ID)</label><input type="text" id="ff-project" placeholder="P001"></div>
        <div class="form-group full"><label>URL de l'image (ou chemin /assets/images/figures/)</label><input type="url" id="ff-image" placeholder="https://... ou /assets/images/figures/fig.png"></div>
        <div class="form-group full"><label>Lien vers la source / notebook</label><input type="url" id="ff-link" placeholder="https://github.com/..."></div>
        <div class="form-group full"><label>Légende / Description</label><textarea id="ff-desc" placeholder="Ce que montre la figure et son interprétation..."></textarea></div>
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:0.8rem;">
        <button class="btn btn-primary" onclick="saveFigure()">💾 Sauvegarder</button>
        <button class="btn btn-ghost" onclick="document.getElementById('figure-form-area').innerHTML=''">Annuler</button>
      </div>
    </div>
  `;
}

async function saveFigure() {
  const data = {
    title:   document.getElementById('ff-title')?.value,
    type:    document.getElementById('ff-type')?.value,
    project: document.getElementById('ff-project')?.value,
    image:   document.getElementById('ff-image')?.value,
    link:    document.getElementById('ff-link')?.value,
    description: document.getElementById('ff-desc')?.value,
    status: 'published'
  };
  if (!data.title) { showToast('Titre requis', 'error'); return; }
  await DB.add('figures', data);
  showToast('Figure ajoutée !');
  await renderFigures(document.getElementById('admin-main'));
}

// ── Rapports ──
async function renderReports(el) {
  const reports = await DB.getAll('reports');
  el.innerHTML = `
    <div class="panel-header">
      <h2>Rapports (${reports.length})</h2>
      <button class="btn btn-primary" onclick="showReportForm()">+ Ajouter un rapport</button>
    </div>
    <div id="report-form-area"></div>
    <div class="card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Titre</th><th>Type</th><th>Année</th><th>Client</th><th>Confidentialité</th><th>Actions</th></tr></thead>
        <tbody>
          ${reports.map(r => `
            <tr>
              <td class="td-title">${r.title}</td>
              <td><span class="tag tag-slate">${r.type}</span></td>
              <td>${r.year}</td>
              <td>${r.client}</td>
              <td><span class="tag ${r.confidentiality==='Public'?'tag-emerald':'tag-gold'}">${r.confidentiality}</span></td>
              <td><button class="btn btn-sm action-delete" onclick="deleteItem('reports','${r.id}',this)">Suppr.</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showReportForm() {
  const area = document.getElementById('report-form-area');
  if (!area) return;
  area.innerHTML = `
    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="color:var(--white);margin-bottom:1.5rem;">Nouveau rapport</h3>
      <div class="form-grid">
        <div class="form-group full"><label>Titre</label><input type="text" id="rf-title"></div>
        <div class="form-group"><label>Type</label>
          <select id="rf-type"><option>Rapport technique</option><option>Note méthodologique</option><option>Livrables de consulting</option><option>Présentation</option></select>
        </div>
        <div class="form-group"><label>Année</label><input type="text" id="rf-year"></div>
        <div class="form-group"><label>Client</label><input type="text" id="rf-client"></div>
        <div class="form-group"><label>Confidentialité</label>
          <select id="rf-conf"><option>Public</option><option>Résumé seulement</option><option>Confidentiel</option></select>
        </div>
        <div class="form-group"><label>Lien (si public)</label><input type="url" id="rf-link"></div>
        <div class="form-group full"><label>Description</label><textarea id="rf-desc"></textarea></div>
      </div>
      <div style="margin-top:1.2rem;display:flex;gap:0.8rem;">
        <button class="btn btn-primary" onclick="saveReport()">💾 Sauvegarder</button>
        <button class="btn btn-ghost" onclick="document.getElementById('report-form-area').innerHTML=''">Annuler</button>
      </div>
    </div>
  `;
}

async function saveReport() {
  const data = {
    title: document.getElementById('rf-title')?.value,
    type: document.getElementById('rf-type')?.value,
    year: document.getElementById('rf-year')?.value,
    client: document.getElementById('rf-client')?.value,
    confidentiality: document.getElementById('rf-conf')?.value,
    link: document.getElementById('rf-link')?.value,
    description: document.getElementById('rf-desc')?.value,
    status: 'published'
  };
  if (!data.title) { showToast('Titre requis', 'error'); return; }
  await DB.add('reports', data);
  showToast('Rapport ajouté !');
  await renderReports(document.getElementById('admin-main'));
}

// ── Publications ──
async function renderPublications(el) {
  const data = await DB.loadJSON('publications.json');
  const pubs = data?.publications || [];
  el.innerHTML = `
    <div class="panel-header">
      <h2>Publications (${pubs.length})</h2>
      <div style="font-size:0.8rem;color:var(--slate);">Éditez directement <code>/data/publications.json</code> puis exportez.</div>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      <table class="data-table">
        <thead><tr><th>Année</th><th>Titre</th><th>Journal</th><th>Type</th><th>DOI</th></tr></thead>
        <tbody>
          ${pubs.map(p => `
            <tr>
              <td style="font-family:var(--font-mono);color:var(--gold);">${p.year}</td>
              <td class="td-title" style="max-width:300px;">${p.title}</td>
              <td style="font-style:italic;font-size:0.8rem;color:var(--slate);">${p.journal}</td>
              <td><span class="tag tag-slate">${p.type}</span></td>
              <td>${p.doi ? `<a href="${p.link}" target="_blank" style="color:var(--emerald);font-size:0.75rem;">${p.doi}</a>` : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:1rem;">
      <button class="btn btn-outline btn-sm" onclick="DB.exportJSON('publications')">💾 Exporter publications.json</button>
    </div>
  `;
}

// ── Honoraires admin ──
async function renderRates(el) {
  const data = await DB.getRates();
  const packages = data?.rates?.packages || [];
  const issuer = data?.invoice_settings?.issuer || {};

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
      <div>
        <h3 style="color:var(--white);margin-bottom:1rem;">Tarifs actuels</h3>
        ${packages.map(p => `
          <div class="card" style="margin-bottom:0.8rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="color:var(--white);font-weight:600;">${p.name}</div>
                <div style="font-family:var(--font-mono);color:var(--emerald-bright);font-size:1.1rem;">€${p.amount} / ${p.unit}</div>
              </div>
              <input type="number" value="${p.amount}" onchange="updateRate('${p.id}', this.value)"
                style="width:80px;background:var(--navy);border:1px solid var(--border);border-radius:4px;padding:0.3rem 0.5rem;color:var(--white);text-align:right;">
            </div>
          </div>
        `).join('')}
        <button class="btn btn-primary btn-sm" onclick="saveRatesChanges()">💾 Enregistrer les tarifs</button>
      </div>

      <div>
        <h3 style="color:var(--white);margin-bottom:1rem;">Informations émetteur</h3>
        <div class="form-group" style="margin-bottom:0.8rem;"><label>Nom</label><input type="text" id="iss-name" value="${issuer.name||''}"></div>
        <div class="form-group" style="margin-bottom:0.8rem;"><label>Titre</label><input type="text" id="iss-title" value="${issuer.title||''}"></div>
        <div class="form-group" style="margin-bottom:0.8rem;"><label>Adresse</label><textarea id="iss-addr" style="min-height:60px;">${issuer.address||''}</textarea></div>
        <div class="form-group" style="margin-bottom:0.8rem;"><label>Email</label><input type="email" id="iss-email" value="${issuer.email||''}"></div>
        <div class="form-group" style="margin-bottom:0.8rem;"><label>Préfixe factures</label><input type="text" id="iss-prefix" value="${data?.invoice_settings?.defaults?.invoice_prefix||'DRTA'}"></div>
        <button class="btn btn-primary btn-sm" onclick="saveIssuerInfo()">💾 Enregistrer</button>
      </div>
    </div>
  `;
}

async function updateRate(id, newAmount) {
  const data = await DB.getRates();
  const pkg = data?.rates?.packages?.find(p => p.id === id);
  if (pkg) pkg.amount = parseFloat(newAmount);
  DB.saveRates(data);
}

async function saveRatesChanges() {
  showToast('Tarifs sauvegardés ! Exportez rates.json pour committer.');
  DB.exportJSON('rates');
}

async function saveIssuerInfo() {
  const data = await DB.getRates();
  if (data?.invoice_settings?.issuer) {
    data.invoice_settings.issuer.name    = document.getElementById('iss-name')?.value;
    data.invoice_settings.issuer.title   = document.getElementById('iss-title')?.value;
    data.invoice_settings.issuer.address = document.getElementById('iss-addr')?.value;
    data.invoice_settings.issuer.email   = document.getElementById('iss-email')?.value;
    data.invoice_settings.defaults.invoice_prefix = document.getElementById('iss-prefix')?.value;
  }
  DB.saveRates(data);
  showToast('Informations émetteur sauvegardées !');
}

// ── Factures ──
async function renderInvoices(el) {
  const invoices = await DB.getInvoices();
  el.innerHTML = `
    <div class="panel-header">
      <h2>Factures (${invoices.length})</h2>
      <a href="../index.html#invoice-section" class="btn btn-primary">+ Nouvelle facture</a>
    </div>
    <div class="card" style="padding:0;overflow:hidden;">
      ${invoices.length ? `
        <div>
          <div class="invoice-list-item" style="background:var(--navy-light);">
            <span class="tag tag-slate" style="font-size:0.6rem;">N°</span>
            <span style="font-size:0.7rem;color:var(--gold);text-transform:uppercase;letter-spacing:0.1em;">Client</span>
            <span style="font-size:0.7rem;color:var(--gold);text-transform:uppercase;letter-spacing:0.1em;">Date</span>
            <span style="font-size:0.7rem;color:var(--gold);text-transform:uppercase;letter-spacing:0.1em;">Montant</span>
            <span style="font-size:0.7rem;color:var(--gold);text-transform:uppercase;letter-spacing:0.1em;">Statut</span>
          </div>
          ${invoices.map(inv => `
            <div class="invoice-list-item">
              <span class="inv-num">${inv.number || '—'}</span>
              <span style="color:var(--off-white);">${inv.client || '—'}</span>
              <span style="color:var(--slate);font-size:0.8rem;">${inv.date || '—'}</span>
              <span class="inv-amount">€${(inv.total||0).toFixed(2)}</span>
              <span class="inv-status-${inv.status||'pending'}">● ${inv.status || 'pending'}</span>
            </div>
          `).join('')}
        </div>
      ` : '<div style="padding:2rem;color:var(--slate);text-align:center;">Aucune facture émise.</div>'}
    </div>
    <div style="margin-top:1rem;display:flex;gap:0.8rem;">
      <button class="btn btn-outline btn-sm" onclick="DB.exportJSON('invoices')">💾 Exporter invoices.json</button>
    </div>
  `;
}

// ── Paramètres ──
function renderSettings(el) {
  el.innerHTML = `
    <div style="max-width:600px;">
      <div class="settings-section">
        <h3>Sécurité</h3>
        <div class="setting-row">
          <div><div class="setting-label">Changer le mot de passe admin</div></div>
        </div>
        <div class="form-group" style="margin-top:0.8rem;"><label>Nouveau mot de passe</label><input type="password" id="new-pwd" placeholder="Nouveau mot de passe"></div>
        <div class="form-group" style="margin-top:0.5rem;"><label>Confirmation</label><input type="password" id="new-pwd2" placeholder="Confirmez"></div>
        <div style="margin-top:0.8rem;">
          <button class="btn btn-primary btn-sm" onclick="changePassword()">Générer le hash</button>
          <div id="pwd-hash-output" style="font-family:var(--font-mono);font-size:0.72rem;color:var(--gold);margin-top:0.8rem;word-break:break-all;"></div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.4rem;">Copiez ce hash dans <code>assets/js/auth.js</code> → <code>ADMIN_HASH</code></div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Données</h3>
        <div style="display:flex;flex-direction:column;gap:0.8rem;">
          <button class="btn btn-outline btn-sm" onclick="DB.exportAll()">💾 Exporter toutes les données (JSON)</button>
          <button class="btn btn-outline btn-sm" onclick="if(confirm('Réinitialiser tous les overrides localStorage ?')) { DB.resetAll(); showToast('Données réinitialisées'); }">🔄 Réinitialiser les overrides localStorage</button>
        </div>
      </div>

      <div class="settings-section">
        <h3>Session</h3>
        <div style="font-size:0.85rem;color:var(--slate);">
          Connecté en tant que <strong style="color:var(--white);">admin</strong><br>
          Temps restant : <span style="color:var(--gold);">${Auth.sessionTimeLeft()} minutes</span>
        </div>
        <div style="margin-top:1rem;">
          <button class="btn btn-danger btn-sm" onclick="Auth.logout(); window.location.href='login.html';">Se déconnecter</button>
        </div>
      </div>
    </div>
  `;
}

async function changePassword() {
  const p1 = document.getElementById('new-pwd')?.value;
  const p2 = document.getElementById('new-pwd2')?.value;
  if (!p1 || p1 !== p2) { showToast('Mots de passe non identiques', 'error'); return; }
  const hash = await Auth.hashPassword(p1);
  const out = document.getElementById('pwd-hash-output');
  if (out) out.innerHTML = `Hash : <code style="color:var(--emerald-bright);">${hash}</code>`;
}

// ── Suppression générique ──
async function deleteItem(collection, id, btn) {
  if (!confirm(`Supprimer cet élément ? Cette action est irréversible.`)) return;
  await DB.remove(collection, id);
  const row = btn.closest('tr') || btn.closest('.card');
  if (row) row.remove();
  showToast('Élément supprimé');
}

// ── Toast admin ──
function showToast(msg, type = 'success') {
  const el = document.getElementById('admin-toast') || (() => {
    const t = document.createElement('div');
    t.id = 'admin-toast'; t.className = 'toast';
    document.body.appendChild(t);
    return t;
  })();
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}
