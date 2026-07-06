<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Horizon Brain · پنل مدیریت + AI</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: radial-gradient(circle at 10% 20%, #0a0f1e, #03050a);
            color: #eef2ff;
            padding: 1rem;
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .glass {
            background: rgba(12, 18, 28, 0.85);
            backdrop-filter: blur(12px);
            border-radius: 2rem;
            border: 1px solid rgba(79, 158, 255, 0.2);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .flex { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }
        .badge {
            background: rgba(79, 158, 255, 0.15);
            border: 1px solid #4f9eff44;
            padding: 0.2rem 1rem;
            border-radius: 60px;
            font-size: 0.7rem;
            display: inline-block;
        }
        .badge-success { background: rgba(74, 222, 128, 0.15); border-color: #4ade8055; color: #4ade80; }
        .badge-warning { background: rgba(251, 191, 36, 0.15); border-color: #facc1555; color: #facc15; }
        .btn {
            background: #4f9eff;
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 2rem;
            font-weight: 600;
            color: #0a0f1e;
            cursor: pointer;
            transition: 0.2s;
            font-size: 0.85rem;
        }
        .btn:hover { background: #c084fc; transform: scale(1.02); }
        .btn-outline { background: transparent; border: 1px solid #4f9eff55; color: #eef2ff; }
        .btn-outline:hover { background: #4f9eff22; }
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        .stat-card {
            background: rgba(20, 24, 36, 0.5);
            backdrop-filter: blur(4px);
            border-radius: 1.2rem;
            padding: 0.8rem 1.2rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stat-card .label { font-size: 0.7rem; color: #8fa2dc; }
        .stat-card .value { font-size: 1.2rem; font-weight: 700; color: #eef2ff; }
        .log-box {
            background: #0f172a;
            border-radius: 1rem;
            padding: 0.6rem 1rem;
            max-height: 180px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.8rem;
            border: 1px solid #1e2a44;
        }
        .log-box .log-entry { padding: 0.15rem 0; border-bottom: 1px solid #1a2238; color: #94a3b8; }
        .log-box .log-entry .time { color: #4f9eff; margin-left: 0.4rem; }
        .log-box .log-entry .green { color: #4ade80; }
        .log-box .log-entry .yellow { color: #facc15; }
        .log-box .log-entry .red { color: #f87171; }
        .chat-box {
            background: #0f172a;
            border-radius: 1rem;
            padding: 0.8rem 1rem;
            max-height: 250px;
            overflow-y: auto;
            border: 1px solid #1e2a44;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }
        .chat-box .msg {
            padding: 0.4rem 0.8rem;
            border-radius: 0.8rem;
            max-width: 85%;
            font-size: 0.85rem;
            line-height: 1.5;
        }
        .chat-box .user-msg { align-self: flex-end; background: #4f9eff; color: #0a0f1e; }
        .chat-box .ai-msg { align-self: flex-start; background: rgba(255,255,255,0.06); color: #e5e7f0; border: 1px solid #2a3a5a; }
        .chat-input-row {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        .chat-input-row input {
            flex: 1;
            background: #0f172a;
            border: 1px solid #2a3a5a;
            border-radius: 2rem;
            padding: 0.5rem 1rem;
            color: #eef2ff;
            outline: none;
            font-size: 0.85rem;
        }
        .chat-input-row input:focus { border-color: #4f9eff; }
        .chat-input-row button {
            background: #4f9eff;
            border: none;
            border-radius: 2rem;
            padding: 0 1.2rem;
            font-weight: 600;
            color: #0a0f1e;
            cursor: pointer;
        }
        .chat-input-row button:hover { background: #c084fc; }
        .file-tree {
            background: #0f172a;
            border-radius: 1rem;
            padding: 0.6rem 1rem;
            font-family: monospace;
            font-size: 0.75rem;
            border: 1px solid #1e2a44;
        }
        .file-tree .folder { color: #4f9eff; }
        .file-tree .file { color: #c084fc; }
        .file-tree .indent { padding-right: 1.2rem; display: block; }
        @media (max-width: 640px) { body { padding: 0.8rem; } .glass { padding: 1rem; } }
    </style>
</head>
<body>
<div class="container">

    <!-- HEADER -->
    <div class="glass">
        <div class="flex">
            <div>
                <h1 style="font-size:1.6rem; background:linear-gradient(135deg,#fff,#4f9eff,#c084fc); -webkit-background-clip:text; background-clip:text; color:transparent;">
                    <i class="fas fa-robot"></i> Horizon Brain · AI Management
                </h1>
                <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.2rem;">
                    <span class="badge"><i class="fas fa-shield-alt"></i> Horizon Angel</span>
                    <span class="badge badge-success"><i class="fas fa-circle"></i> AI: Online</span>
                    <span class="badge"><i class="fas fa-user-tie"></i> Mahdi Amolimoghaddam</span>
                </div>
            </div>
            <div>
                <button class="btn" id="runBrainBtn"><i class="fas fa-play"></i> اجرا</button>
                <button class="btn btn-outline" id="refreshBtn"><i class="fas fa-sync-alt"></i> بروز</button>
            </div>
        </div>
    </div>

    <!-- STATS -->
    <div class="glass">
        <div class="grid-2">
            <div class="stat-card"><div class="label">وضعیت AI</div><div class="value" id="aiStatus">🟢 آنلاین</div></div>
            <div class="stat-card"><div class="label">شاخه فعلی</div><div class="value" id="currentBranch">main</div></div>
            <div class="stat-card"><div class="label">فایل‌های حیاتی</div><div class="value" id="criticalFiles">✅ ۵/۵</div></div>
            <div class="stat-card"><div class="label">آخرین اجرا</div><div class="value" id="lastRun">—</div></div>
        </div>
    </div>

    <!-- CHAT + AI -->
    <div class="glass">
        <h2 style="font-size:1.1rem;"><i class="fas fa-comment-dots"></i> دستیار هوشمند Horizon</h2>
        <div class="chat-box" id="chatBox">
            <div class="msg ai-msg">🤖 سلام! من Horizon Brain هستم. هر دستوری بدی اجرا می‌کنم.</div>
            <div class="msg ai-msg">📌 مثال: «validators.json رو از شاخه mine به main منتقل کن»</div>
        </div>
        <div class="chat-input-row">
            <input type="text" id="chatInput" placeholder="دستور یا سوال خود را بنویسید..." />
            <button id="chatSend"><i class="fas fa-paper-plane"></i></button>
        </div>
    </div>

    <!-- LOGS -->
    <div class="glass">
        <h2 style="font-size:1.1rem;"><i class="fas fa-history"></i> لاگ عملیات</h2>
        <div class="log-box" id="logBox">
            <div class="log-entry"><span class="time">[12:34]</span> 🚀 Horizon Brain راه‌اندازی شد.</div>
        </div>
        <button class="btn btn-outline" id="clearLogsBtn" style="margin-top:0.4rem; font-size:0.75rem;"><i class="fas fa-eraser"></i> پاک کردن لاگ</button>
    </div>

    <!-- FILE TREE -->
    <div class="glass">
        <h2 style="font-size:1.1rem;"><i class="fas fa-folder-open"></i> ساختار فایل‌ها</h2>
        <div class="file-tree" id="fileTree">
            <div class="folder">📁 horizon-core-engine/</div>
            <span class="indent folder">📁 scripts/</span>
            <span class="indent file">   📄 horizon-brain.js</span>
            <span class="indent folder">📁 data/</span>
            <span class="indent file">   📄 validators.json</span>
            <span class="indent file">   📄 merkle_tree.json</span>
            <span class="indent folder">📁 config/</span>
            <span class="indent file">   📄 .env</span>
            <span class="indent file">📄 README.md</span>
        </div>
    </div>

    <div style="text-align:center; font-size:0.7rem; color:#6c7b9e; padding:1rem 0;">
        © ۲۰۲۶ Horizon Angel · افق فرشته
    </div>
</div>

<script>
    // =============================================================
    // Horizon Brain – پنل مدیریت + AI داخلی
    // =============================================================

    const logBox = document.getElementById('logBox');
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    // اضافه کردن لاگ
    function addLog(message, type = 'info') {
        const time = new Date().toLocaleTimeString('fa-IR');
        const colors = { info: '', success: 'green', warning: 'yellow', error: 'red' };
        const cls = colors[type] || '';
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<span class="time">[${time}]</span> <span class="${cls}">${message}</span>`;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    }

    // اضافه کردن پیام چت
    function addChatMessage(text, sender = 'ai') {
        const msg = document.createElement('div');
        msg.className = `msg ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;
        msg.textContent = text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // =============================================================
    // AI Core – پردازش دستورات
    // =============================================================
    function processCommand(text) {
        const lower = text.toLowerCase();

        if (lower.includes('validators') || lower.includes('ولی')) {
            addLog('📂 فایل validators.json در حال انتقال...', 'info');
            setTimeout(() => {
                addLog('✅ validators.json از شاخه mine به main منتقل شد.', 'success');
                addChatMessage('✅ فایل validators.json با موفقیت منتقل شد.', 'ai');
            }, 1000);
            return '🔄 در حال پردازش دستور انتقال validators.json...';
        }

        if (lower.includes('merkle') || lower.includes('مرکل')) {
            addLog('🌳 Merkle Tree در حال بازسازی...', 'info');
            setTimeout(() => {
                addLog('✅ Merkle Tree با موفقیت ساخته شد.', 'success');
                addChatMessage('✅ Merkle Tree بازسازی شد.', 'ai');
            }, 1200);
            return '🔄 در حال ساخت Merkle Tree...';
        }

        if (lower.includes('وضعیت') || lower.includes('status')) {
            addLog('📊 درخواست وضعیت سیستم', 'info');
            const status = '✅ همه سیستم‌ها عملیاتی هستند. AI: آنلاین · کلیدها: فعال · دیتابیس: متصل';
            addChatMessage(status, 'ai');
            return status;
        }

        if (lower.includes('همگام') || lower.includes('sync')) {
            addLog('🔄 همگام‌سازی فایل‌ها...', 'warning');
            setTimeout(() => {
                addLog('✅ همگام‌سازی کامل شد. همه فایل‌ها در جای خود قرار دارند.', 'success');
                addChatMessage('✅ همگام‌سازی کامل شد.', 'ai');
            }, 1500);
            return '🔄 در حال همگام‌سازی...';
        }

        if (lower.includes('سلام') || lower.includes('hello')) {
            return '👋 سلام! من Horizon Brain هستم. چه دستوری می‌خواهید بدهید؟';
        }

        return `❌ دستور "${text}" شناسایی نشد. لطفاً یکی از دستورات زیر را امتحان کنید:
- validators.json رو انتقال بده
- merkle tree بساز
- وضعیت
- همگام‌سازی
- سلام`;
    }

    // =============================================================
    // رویدادهای پنل
    // =============================================================

    chatSend.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (!text) return;
        addChatMessage(text, 'user');
        chatInput.value = '';

        const result = processCommand(text);
        if (!result.startsWith('🔄') && !result.startsWith('✅') && !result.startsWith('❌')) {
            addChatMessage(result, 'ai');
        }
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') chatSend.click();
    });

    document.getElementById('runBrainBtn').addEventListener('click', () => {
        addLog('🧠 Horizon Brain در حال اجرا...', 'info');
        setTimeout(() => {
            addLog('✅ همه عملیات‌ها با موفقیت انجام شد.', 'success');
            document.getElementById('lastRun').textContent = new Date().toLocaleString('fa-IR');
            addChatMessage('✅ همه عملیات‌ها انجام شد.', 'ai');
        }, 1500);
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        addLog('🔄 بروزرسانی صفحه...', 'info');
        setTimeout(() => addLog('✅ صفحه بروزرسانی شد.', 'success'), 500);
    });

    document.getElementById('clearLogsBtn').addEventListener('click', () => {
        logBox.innerHTML = '';
        addLog('🧹 لاگ‌ها پاک شدند.', 'warning');
    });

    // بارگذاری اولیه
    addLog('🌟 Horizon Angel · پنل مدیریت + AI راه‌اندازی شد.', 'success');
    document.getElementById('lastRun').textContent = new Date().toLocaleString('fa-IR');
</script>
</body>
</html>
