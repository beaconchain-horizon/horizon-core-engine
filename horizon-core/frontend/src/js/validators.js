// ============================================================
// VALIDATORS MODULE – Horizon Store
// Handles 100K validator generation, caching, search & virtual scroll
// ============================================================

// ============================================================
// Configuration
// ============================================================
const CONFIG = {
  TOTAL_VALIDATORS: 100000,
  VISIBLE_COUNT: 200,          // Number of items shown per scroll batch
  CACHE_KEY: 'horizon_validators_v2',
};

// ============================================================
// State
// ============================================================
let allValidators = [];
let filteredValidators = [];
let currentStart = 0;
let cacheStats = { hits: 0, misses: 0, loadTime: 0 };

// ============================================================
// DOM References (populated on init)
// ============================================================
let containerEl = null;
let listEl = null;
let searchInput = null;
let resetBtn = null;

// ============================================================
// Generate a single validator with random status & balance
// ============================================================
function generateValidator(index) {
  const rand = Math.random();
  let status = 'online';
  if (rand < 0.08) status = 'offline';
  else if (rand < 0.12) status = 'pending';

  const balance = 32 + (Math.random() * 8);
  return {
    index,
    status,
    balance: parseFloat(balance.toFixed(2))
  };
}

// ============================================================
// Generate all 100,000 validators (with caching)
// ============================================================
function generateAllValidators() {
  const startTime = performance.now();

  // Try to load from cache
  const cached = localStorage.getItem(CONFIG.CACHE_KEY);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      cacheStats.hits++;
      cacheStats.loadTime = performance.now() - startTime;
      console.log(`[Validators] Loaded ${data.length} validators from cache (${(cached.length / 1024).toFixed(1)} KB)`);
      updateCacheUI(100, cached.length);
      return data;
    } catch (e) {
      console.warn('[Validators] Cache parse failed, regenerating...');
    }
  }

  // Generate fresh data
  cacheStats.misses++;
  console.log('[Validators] Generating 100,000 validators...');

  const vals = [];
  for (let i = 1; i <= CONFIG.TOTAL_VALIDATORS; i++) {
    vals.push(generateValidator(i));
    if (i % 25000 === 0) {
      console.log(`[Validators] Generated ${i}/${CONFIG.TOTAL_VALIDATORS}`);
    }
  }

  // Save to cache
  try {
    localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(vals));
    console.log('[Validators] Cached successfully');
  } catch (e) {
    console.warn('[Validators] Could not cache data:', e);
  }

  cacheStats.loadTime = performance.now() - startTime;
  const size = new Blob([JSON.stringify(vals)]).size;
  updateCacheUI(0, size);
  return vals;
}

// ============================================================
// Update cache UI elements (hit rate, size)
// ============================================================
function updateCacheUI(hitRate, sizeBytes) {
  const hitEl = document.getElementById('cacheHitRate');
  const fillEl = document.getElementById('cacheFill');
  const sizeEl = document.getElementById('cacheSize');
  const cachedCountEl = document.getElementById('cachedCount');
  const loadTimeEl = document.getElementById('loadTime');

  if (hitEl) hitEl.textContent = hitRate + '%';
  if (fillEl) fillEl.style.width = hitRate + '%';
  if (sizeEl && sizeBytes) {
    sizeEl.textContent = (sizeBytes / 1024).toFixed(1) + ' KB';
  }
  if (cachedCountEl) {
    cachedCountEl.textContent = allValidators.length.toLocaleString();
  }
  if (loadTimeEl) {
    loadTimeEl.textContent = Math.round(cacheStats.loadTime) + ' ms';
  }
}

// ============================================================
// Update statistics (total, online, offline, avg balance)
// ============================================================
function updateStats(validators) {
  const total = validators.length;
  const online = validators.filter(v => v.status === 'online').length;
  const offline = validators.filter(v => v.status === 'offline').length;
  const pending = validators.filter(v => v.status === 'pending').length;
  const avgBal = total > 0 ? (validators.reduce((s, v) => s + v.balance, 0) / total).toFixed(2) : '0.00';

  const totalEl = document.getElementById('totalValidators');
  const onlineEl = document.getElementById('onlineCount');
  const offlineEl = document.getElementById('offlineCount');
  const pendingEl = document.getElementById('pendingCount');
  const avgEl = document.getElementById('avgBalance');

  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (onlineEl) onlineEl.textContent = online.toLocaleString();
  if (offlineEl) offlineEl.textContent = offline.toLocaleString();
  if (pendingEl) pendingEl.textContent = pending.toLocaleString();
  if (avgEl) avgEl.textContent = avgBal + ' ETH';
}

// ============================================================
// Render virtual list (only visible portion)
// ============================================================
function renderVirtualList() {
  if (!listEl) return;

  if (!filteredValidators.length) {
    listEl.innerHTML = `<div style="text-align:center; padding:2rem; color:#8fa2dc;">No validators found</div>`;
    return;
  }

  const end = Math.min(currentStart + CONFIG.VISIBLE_COUNT, filteredValidators.length);
  const visibleItems = filteredValidators.slice(currentStart, end);

  let html = '';
  for (let i = 0; i < visibleItems.length; i++) {
    const v = visibleItems[i];
    const statusIcon = v.status === 'online' ? '🟢' : (v.status === 'offline' ? '🔴' : '🟡');
    const statusText = v.status === 'online' ? 'Active' : (v.status === 'offline' ? 'Offline' : 'Pending');
    const color = v.status === 'online' ? '#4ade80' : (v.status === 'offline' ? '#f87171' : '#facc15');

    html += `
      <div class="validator-item">
        <div>
          <span class="validator-index">#${v.index.toLocaleString()}</span>
        </div>
        <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
          <span style="color:${color}">${statusIcon} ${statusText}</span>
          <span class="balance">${v.balance} ETH</span>
        </div>
      </div>
    `;
  }

  // Show loading indicator at bottom if there are more items
  if (end < filteredValidators.length) {
    html += `
      <div class="validator-item" style="justify-content:center; opacity:0.6;">
        <i class="fas fa-spinner fa-pulse"></i> Scrolling for more...
      </div>
    `;
  }

  listEl.innerHTML = html;
}

// ============================================================
// Handle scroll – load more items when reaching bottom
// ============================================================
function onScroll() {
  if (!containerEl || !filteredValidators.length) return;

  const scrollTop = containerEl.scrollTop;
  const scrollHeight = containerEl.scrollHeight;
  const clientHeight = containerEl.clientHeight;

  // Load more when near bottom
  if (scrollTop + clientHeight >= scrollHeight - 300) {
    if (currentStart + CONFIG.VISIBLE_COUNT < filteredValidators.length) {
      currentStart += CONFIG.VISIBLE_COUNT;
      renderVirtualList();
    }
  }

  // Load previous when near top (for smooth scrolling up)
  if (scrollTop <= 200 && currentStart > 0) {
    currentStart = Math.max(0, currentStart - CONFIG.VISIBLE_COUNT);
    renderVirtualList();
    // Keep scroll position stable
    containerEl.scrollTop = 200;
  }
}

// ============================================================
// Apply search filter
// ============================================================
function applySearch() {
  if (!searchInput) return;

  const term = searchInput.value.trim();
  if (term === '') {
    filteredValidators = [...allValidators];
  } else {
    const num = parseInt(term, 10);
    if (isNaN(num)) {
      filteredValidators = [...allValidators];
    } else {
      filteredValidators = allValidators.filter(v => v.index === num);
    }
  }

  currentStart = 0;
  updateStats(filteredValidators);
  renderVirtualList();
  if (containerEl) containerEl.scrollTop = 0;
}

// ============================================================
// Reset cache and reload
// ============================================================
function resetCache() {
  if (confirm('⚠️ This will clear cached data and regenerate 100,000 validators. Continue?')) {
    localStorage.removeItem(CONFIG.CACHE_KEY);
    location.reload();
  }
}

// ============================================================
// Initialize the module
// ============================================================
function initValidators() {
  // Get DOM references
  containerEl = document.getElementById('validatorContainer');
  listEl = document.getElementById('validatorList');
  searchInput = document.getElementById('searchInput');
  resetBtn = document.getElementById('resetBtn');

  if (!containerEl || !listEl) {
    console.warn('[Validators] Required DOM elements not found.');
    return;
  }

  // Generate data
  allValidators = generateAllValidators();
  filteredValidators = [...allValidators];
  currentStart = 0;

  // Update UI
  updateStats(filteredValidators);
  renderVirtualList();

  // Event listeners
  containerEl.addEventListener('scroll', onScroll);

  if (searchInput) {
    searchInput.addEventListener('input', applySearch);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetCache);
  }

  console.log(`[Validators] Initialized with ${allValidators.length} validators`);
}

// ============================================================
// Auto-initialize when DOM is ready
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initValidators);
} else {
  initValidators();
}

// ============================================================
// Expose public methods (for debugging / console usage)
// ============================================================
window.ValidatorModule = {
  allValidators: () => allValidators,
  filteredValidators: () => filteredValidators,
  cacheStats: () => cacheStats,
  resetCache,
  applySearch,
};
