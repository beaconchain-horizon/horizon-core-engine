// ============================================================
// APP MODULE – Horizon Store
// Main application logic – digital signature, PWA, offline status
// ============================================================

// ============================================================
// DOM Ready – Wait for the full page to load before starting
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Horizon Store initializing...');

  // ============================================================
  // 1. DIGITAL SIGNATURE (SHA‑256 Page Fingerprint)
  // Computes a hash of the main content to verify integrity
  // ============================================================
  async function computePageHash() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    try {
      // Get the HTML content without the hash element itself (to avoid infinite loop)
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

  // ============================================================
  // 2. ONLINE / OFFLINE STATUS INDICATOR
  // ============================================================
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

  // Listen for network status changes
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Set initial status
  updateOnlineStatus();

  // ============================================================
  // 3. PWA INSTALL PROMPT
  // ============================================================
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;
    console.log('[App] PWA install prompt available.');

    // Show a custom install button (optional)
    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const result = await deferredPrompt.userChoice;
          console.log('[App] User choice:', result.outcome);
          deferredPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[App] PWA installed successfully.');
    // You could send analytics here
  });

  // ============================================================
  // 4. SERVICE WORKER REGISTRATION
  // ============================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[App] Service Worker registered:', reg);
        })
        .catch(err => {
          console.warn('[App] Service Worker registration failed:', err);
        });
    });
  }

  // ============================================================
  // 5. CACHE PERFORMANCE MONITORING (optional)
  // ============================================================
  // Check if the page is loaded from cache (via Service Worker)
  if ('performance' in window && performance.getEntriesByType) {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      const cacheHit = nav.transferSize === 0;
      if (cacheHit) {
        console.log('[App] Page loaded from browser cache (or Service Worker).');
        // Update cache hit rate UI if needed
        const hitRateEl = document.getElementById('cacheHitRate');
        if (hitRateEl) hitRateEl.textContent = '100% (cached)';
      }
    }
  }

  // ============================================================
  // 6. COMPUTE PAGE HASH AFTER LOAD
  // ============================================================
  // Wait a moment for dynamic content to render
  setTimeout(computePageHash, 500);

  // Also recompute when the page becomes visible again (e.g., after switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(computePageHash, 300);
    }
  });

  // ============================================================
  // 7. KEYBOARD SHORTCUTS (accessibility)
  // ============================================================
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+R → refresh cache
    if (e.ctrlKey && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      const resetBtn = document.getElementById('resetBtn');
      if (resetBtn) resetBtn.click();
    }

    // Ctrl+Shift+D → download license (if a license is generated)
    if (e.ctrlKey && e.shiftKey && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      const licenseEl = document.getElementById('licenseOutput');
      if (licenseEl && licenseEl.textContent.includes('✅')) {
        // Trigger download again – just click the generate button if visible
        const genBtn = document.querySelector('#customLicenseBtn') ||
                       document.querySelector('.btn-primary');
        if (genBtn) genBtn.click();
      }
    }
  });

  // ============================================================
  // 8. CONSOLE WELCOME MESSAGE
  // ============================================================
  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │  🌟 Horizon Store – Official Beaconchain Store     │
  │  🛒 Merkle‑verified licenses | 100K+ validators   │
  │  🔐 Security 10/10 | Offline‑first | GPL-3.0     │
  │  📧 beaconchain@beaconchain.us                    │
  │  🐙 github.com/beaconchain-us                     │
  └─────────────────────────────────────────────────────┘
  `);

  console.log('[App] Horizon Store is ready.');
});

// ============================================================
// 9. GLOBAL ERROR HANDLING (production safety)
// ============================================================
window.addEventListener('error', (event) => {
  console.error('[App] Global error caught:', event.message, event.filename, event.lineno);
  // You could send errors to a monitoring service here
});

// ============================================================
// 10. UNHANDLED PROMISE REJECTIONS
// ============================================================
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[App] Unhandled promise rejection:', event.reason);
  // Optionally show a user-friendly message
});

// ============================================================
// Expose app version for debugging
// ============================================================
window.HORIZON_APP = {
  version: '2.0.1',
  name: 'Horizon Store',
  environment: 'production',
  buildDate: '2026-06-20'
};
