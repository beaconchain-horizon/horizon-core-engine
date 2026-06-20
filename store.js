const PRODUCTS = [
  {
    id: 'basic-api',
    name: 'Basic API Pack',
    icon: 'fa-bolt',
    description: '100 verified requests with Merkle Proof. Ideal for testing and small projects.',
    volume: 100,
    priceUsd: 5.20,
    priceEth: 0.002,
    badge: 'License',
    badgeColor: 'badge-green',
    tags: ['Merkle', 'API', 'Starter']
  },
  {
    id: 'pro-api',
    name: 'Pro API Pack',
    icon: 'fa-rocket',
    description: '1,000 high‑priority requests. Perfect for production and real‑world applications.',
    volume: 1000,
    priceUsd: 39.00,
    priceEth: 0.015,
    badge: 'License',
    badgeColor: 'badge-green',
    tags: ['Merkle', 'API', 'Production']
  },
  {
    id: 'enterprise-api',
    name: 'Enterprise API Pack',
    icon: 'fa-crown',
    description: '10,000 requests at wholesale pricing. Designed for organizations and large teams.',
    volume: 10000,
    priceUsd: 260.00,
    priceEth: 0.1,
    badge: 'License',
    badgeColor: 'badge-gold',
    tags: ['Merkle', 'API', 'Enterprise']
  }
];

const WALLET_ADDRESS = '0x4E94F10F0a34a0DF229e68d5902644046258D678';

let productGrid = null;
let licenseOutput = null;
let customLicenseBtn = null;

async function sha256(input) {
  const hash = await crypto.subtle.digest('SHA-256', input);
  return new Uint8Array(hash);
}

function toHex(arr) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

class MerkleLicense {
  constructor(volume, seed = crypto.getRandomValues(new Uint8Array(32))) {
    this.volume = volume;
    this.seed = seed;
    this.root = null;
    this.leaves = null;
  }

  async generate() {
    const leaves = [];
    for (let i = 0; i < this.volume; i++) {
      const indexBuf = new Uint8Array(4);
      new DataView(indexBuf.buffer).setUint32(0, i, true);
      const concat = new Uint8Array(this.seed.length + indexBuf.length);
      concat.set(this.seed, 0);
      concat.set(indexBuf, this.seed.length);
      leaves.push(await sha256(concat));
    }
    this.leaves = leaves;
    let level = leaves;
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = (i + 1 < level.length) ? level[i + 1] : left;
        const concat = new Uint8Array(left.length + right.length);
        concat.set(left, 0);
        concat.set(right, left.length);
        next.push(await sha256(concat));
      }
      level = next;
    }
    this.root = level[0] || new Uint8Array(32);
    return this.root;
  }

  async getProof(index) {
    if (!this.leaves) throw new Error('Generate the tree first');
    let proof = [];
    let level = this.leaves.slice();
    let idx = index;
    while (level.length > 1) {
      const siblingIdx = (idx % 2 === 0) ? idx + 1 : idx - 1;
      if (siblingIdx < level.length) proof.push(level[siblingIdx]);
      else proof.push(level[idx]);
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = (i + 1 < level.length) ? level[i + 1] : left;
        const concat = new Uint8Array(left.length + right.length);
        concat.set(left, 0);
        concat.set(right, left.length);
        next.push(await sha256(concat));
      }
      level = next;
      idx = Math.floor(idx / 2);
    }
    return { leaf: this.leaves[index], proof, index, root: this.root };
  }
}

async function generateLicense(volume, productName = '') {
  if (!licenseOutput) return;
  licenseOutput.innerHTML = '⏳ Generating Merkle tree... please wait.';
  try {
    const lic = new MerkleLicense(volume);
    const root = await lic.generate();
    const rootHex = toHex(root);
    const timestamp = Date.now();
    const licenseData = {
      version: 3,
      product: productName || 'Horizon License',
      volume: volume,
      root: rootHex,
      timestamp: timestamp,
      createdBy: 'Beaconchain Horizon',
      seedPreview: toHex(lic.seed).slice(0, 16) + '…',
      network: 'Ethereum',
      wallet: WALLET_ADDRESS,
      merkleProofs: volume <= 100 ? await Promise.all(Array.from({ length: Math.min(volume, 10) }, (_, i) => lic.getProof(i))) : 'Too many leaves – proofs available on request'
    };
    const blob = new Blob([JSON.stringify(licenseData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license_${volume}_${timestamp}.license`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const dateStr = new Date(timestamp).toLocaleString('fa-IR');
    licenseOutput.innerHTML =
      `✅ License successfully generated!\n📄 Volume: ${volume.toLocaleString()} requests\n🌳 Merkle Root: ${rootHex.slice(0, 48)}…\n⏱️ Timestamp: ${dateStr}\n📥 File downloaded.\n🔐 Verify the Merkle Root to ensure integrity.`;
  } catch (err) {
    licenseOutput.innerHTML = `❌ Error: ${err.message}`;
  }
}

function showPaymentPrompt(name, usd, eth, volume) {
  const msg =
    `🔐 Purchase: ${name}\n💰 Price: $${usd} USD (${eth} ETH)\n📦 Volume: ${volume.toLocaleString()} requests\n\n📤 Send exact amount to the wallet below:\n${WALLET_ADDRESS}\n\n🌐 Network: Ethereum (ERC-20)\n✅ After payment, click "Generate License" below.\n\n🇮🇷 Iranian users: Send via domestic exchanges (Nobitex, Wallex, Ramzinex).\n🌍 International: Send via MetaMask or any Web3 wallet.`;
  alert(msg);
}

function renderProducts() {
  if (!productGrid) return;
  productGrid.innerHTML = PRODUCTS.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div style="font-size:2rem; color:#4f9eff; margin-bottom:0.5rem;"><i class="fas ${p.icon}"></i></div>
      <h4>${p.name}</h4>
      <div style="font-size:0.7rem; color:#8fa2dc;">${p.tags.join(' · ')}</div>
      <div style="font-size:0.8rem; color:#b0c4e8; margin:0.5rem 0;">${p.description}</div>
      <div class="price">$${p.priceUsd.toFixed(2)} USD</div>
      <div style="font-size:0.7rem; color:#8fa2dc;">${p.priceEth} ETH</div>
      <button class="btn btn-primary buy-btn" data-id="${p.id}" data-name="${p.name}" data-volume="${p.volume}" data-usd="${p.priceUsd}" data-eth="${p.priceEth}" style="margin-top:0.8rem; width:100%;"><i class="fas fa-shopping-cart"></i> Buy / Generate License</button>
    </div>
  `).join('');
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const name = this.dataset.name;
      const usd = parseFloat(this.dataset.usd);
      const eth = parseFloat(this.dataset.eth);
      const volume = parseInt(this.dataset.volume, 10);
      showPaymentPrompt(name, usd, eth, volume);
      setTimeout(() => {
        if (confirm(`✅ Have you sent ${eth} ETH to ${WALLET_ADDRESS}?\nClick OK to generate your license.`)) {
          generateLicense(volume, name);
        }
      }, 500);
    });
  });
}

function handleCustomLicense() {
  if (!licenseOutput) return;
  const input = prompt('Enter the number of requests (e.g., 500):', '500');
  if (input && !isNaN(parseInt(input, 10))) {
    const volume = parseInt(input, 10);
    const priceEth = (volume * 0.00002).toFixed(4);
    showPaymentPrompt('Custom License', (volume * 0.052).toFixed(2), priceEth, volume);
    setTimeout(() => {
      if (confirm(`✅ Have you sent ${priceEth} ETH to ${WALLET_ADDRESS}?\nClick OK to generate your custom license.`)) {
        generateLicense(volume, 'Custom License');
      }
    }, 500);
  }
}

function initStore() {
  productGrid = document.getElementById('productList');
  licenseOutput = document.getElementById('licenseOutput');
  customLicenseBtn = document.getElementById('customLicenseBtn');
  if (productGrid) renderProducts();
  if (customLicenseBtn) customLicenseBtn.addEventListener('click', handleCustomLicense);
  console.log(`[Store] Initialized with ${PRODUCTS.length} products.`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStore);
} else {
  initStore();
}
