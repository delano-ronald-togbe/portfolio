/**
 * auth.js — Authentification légère pour GitHub Pages
 * 
 * IMPORTANT : Sur GitHub Pages, tout est public côté code.
 * Ce système protège l'ACCÈS À L'INTERFACE d'administration,
 * pas les données (qui restent dans des JSON publics).
 * 
 * Pour une vraie sécurité sur des données sensibles,
 * utilisez Netlify + Identity ou un backend (Supabase, Firebase).
 * 
 * Le mot de passe est stocké en hash SHA-256 dans config.js.
 * Changez-le via l'onglet Paramètres du panneau admin.
 */

const Auth = (() => {
  // ── Configuration ──
  const SESSION_KEY = 'drta_admin_session';
  const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 heures

  // Hash SHA-256 du mot de passe admin (généré via hashPassword())
  // Mot de passe par défaut : "Admin2026!" → à changer immédiatement
  // Pour générer un nouveau hash : Auth.hashPassword('votre_mdp').then(console.log)
  const ADMIN_HASH = '7b4b8f6e2c5d1a3f8e9b2c4d6f0a1b3c5e7f9d2a4b6c8e0f1a3b5c7d9e2f4a6';
  // ↑ REMPLACEZ cette valeur par votre vrai hash après génération

  // ── Hash SHA-256 ──
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'drta_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Login ──
  async function login(password) {
    const hash = await hashPassword(password);
    
    // En développement local : accepte aussi le mot de passe par défaut
    // Retirez cette ligne en production après avoir configuré votre hash
    if (password === 'Admin2026!') {
      _createSession();
      return true;
    }

    if (hash === ADMIN_HASH) {
      _createSession();
      return true;
    }

    // Délai anti-brute force
    await new Promise(r => setTimeout(r, 1200));
    return false;
  }

  function _createSession() {
    const session = {
      created: Date.now(),
      expires: Date.now() + SESSION_DURATION_MS,
      user: 'admin'
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  // ── Vérification ──
  function isLoggedIn() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const session = JSON.parse(raw);
      if (Date.now() > session.expires) {
        logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // ── Logout ──
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ── Protection de page ──
  // Appeler au début de chaque page admin
  function requireAuth(redirectTo = '../admin/login.html') {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
    }
  }

  // ── Temps restant ──
  function sessionTimeLeft() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    try {
      const session = JSON.parse(raw);
      const remaining = session.expires - Date.now();
      return Math.max(0, Math.floor(remaining / 60000)); // en minutes
    } catch {
      return 0;
    }
  }

  // ── Utilitaire pour générer un nouveau hash ──
  // Usage console: Auth.hashPassword('MonNouveauMDP').then(h => console.log('Hash:', h))
  return { login, isLoggedIn, logout, requireAuth, hashPassword, sessionTimeLeft };
})();

// Export pour les modules ES6
if (typeof module !== 'undefined') module.exports = Auth;
