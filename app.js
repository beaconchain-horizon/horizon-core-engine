document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Horizon Store initializing...');

  async function computePageHash() {
    const mainContent = document.getElementById('app');
    if (!mainContent) return;
    try {
      const content = mainContent.outerHTML;
      const msgBuffer = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const hashEl = document.getElementById('pageHash');
      if (hashEl) {
        hashEl.textContent = hashHex;
        console.log('[App] Page fingerprint:', hashHex.slice(0, 16) + '…');
      }
    } catch (err) {
      console.warn('[App] Could not compute page hash:', err);
    }
  }

  function updateOnlineStatus() {
    const statusEl = document.getElementById('statusIndicator');
    if (!statusEl) return;
    if (navigator.onLine) {
      statusEl.innerHTML = '<i class="fas fa-wifi"></i> Online';
      statusEl.style.background = 'rgba(74, 222, 128, 0.2)';
      statusEl.style.borderColor = '#4ade80';
    } else {
      statusEl.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline (cached)';
      statusEl.style.background = 'rgba(250, 204, 21, 0.2)';
      statusEl.style.borderColor = '#facc15';
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[App] PWA install prompt available.');
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[App] Service Worker registered:', reg))
        .catch(err => console.warn('[App] Service Worker registration failed:', err));
    });
  }

  setTimeout(computePageHash, 500);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(computePageHash, 300);
  });

  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │  🌟 Horizon Store – Official Beaconchain Store     │
  │  🛒 Merkle‑verified licenses | 100K+ validators   │
  │  🔐 Security 10/10 | Offline‑first | GPL-3.0     │
  │  📧 beaconchain@beaconchain.us                    │
  │  🐙 github.com/beaconchain-us                     │
  └─────────────────────────────────────────────────────┘
  `);
});

window.addEventListener('error', (event) => {
  console.error('[App] Global error caught:', event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[App] Unhandled promise rejection:', event.reason);
});

window.HORIZON_APP = {
  version: '2.0.1',
  name: 'Horizon Store',
  environment: 'production',
  buildDate: '2026-06-20'
};
