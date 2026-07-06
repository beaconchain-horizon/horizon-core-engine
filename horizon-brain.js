// =============================================================
// Horizon Angel Brain – غول اطلاعاتی با اختیارات کامل
// =============================================================
// 👤 ناظر: Mahdi Amolimoghaddam
// 🌟 افق فرشته
// =============================================================

const horizonBrain = {
  // فقط شما
  SUPER_ADMIN: 'Mahdi Amolimoghaddam',

  // لیست فایل‌های حیاتی که باید در شاخه‌ی اصلی باشند
  CRITICAL_FILES: [
    'validators.json',
    '.env',
    'config.yaml',
    'merkle_tree.json',
    'LICENSE',
    'README.md'
  ],

  // شاخه‌های احتمالی برای جستجو
  BRANCHES_TO_SEARCH: ['main', 'master', 'dev', 'develop', 'staging'],

  // =============================================================
  // 🛡️ احراز هویت
  // =============================================================
  authenticate: (user) => {
    if (user !== horizonBrain.SUPER_ADMIN) {
      console.error('⛔ دسترسی غیرمجاز! فقط ناظر پروژه مجاز است.');
      return false;
    }
    console.log('✅ احراز هویت موفق.');
    return true;
  },

  // =============================================================
  // 🧠 جستجو و انتقال فایل از شاخه‌های دیگر
  // =============================================================
  fetchFileFromBranches: (fileName) => {
    const { execSync } = require('child_process');
    try {
      // بررسی شاخه‌ی فعلی
      const currentBranch = execSync('git branch --show-current').toString().trim();
      console.log(`📂 شاخه‌ی فعلی: ${currentBranch}`);

      // بررسی وجود فایل در شاخه‌ی فعلی
      try {
        execSync(`git show ${currentBranch}:${fileName}`, { stdio: 'ignore' });
        console.log(`✅ فایل ${fileName} در شاخه‌ی فعلی وجود دارد.`);
        return true;
      } catch (e) {
        console.log(`⚠️ فایل ${fileName} در شاخه‌ی فعلی یافت نشد. جستجو در شاخه‌های دیگر...`);
      }

      // جستجو در شاخه‌های دیگر
      for (const branch of horizonBrain.BRANCHES_TO_SEARCH) {
        try {
          execSync(`git show ${branch}:${fileName}`, { stdio: 'ignore' });
          console.log(`✅ فایل ${fileName} در شاخه‌ی ${branch} پیدا شد. در حال انتقال...`);

          // انتقال فایل به شاخه‌ی فعلی
          execSync(`git checkout ${branch} -- ${fileName}`);
          execSync(`git add ${fileName}`);
          execSync(`git commit -m "chore: import ${fileName} from ${branch} to current branch"`);
          console.log(`✅ فایل ${fileName} با موفقیت به شاخه‌ی فعلی منتقل شد.`);
          return true;
        } catch (e) {
          // فایل در این شاخه نیست، ادامه بده
        }
      }

      console.error(`❌ فایل ${fileName} در هیچ شاخه‌ای یافت نشد.`);
      return false;
    } catch (error) {
      console.error(`❌ خطا در اجرای دستورات Git: ${error.message}`);
      return false;
    }
  },

  // =============================================================
  // 🚀 همگام‌سازی تمام فایل‌های حیاتی
  // =============================================================
  syncAllResources: (user) => {
    if (!horizonBrain.authenticate(user)) return;

    console.log('🚀 شروع همگام‌سازی منابع حیاتی...');

    let allFound = true;
    for (const file of horizonBrain.CRITICAL_FILES) {
      const result = horizonBrain.fetchFileFromBranches(file);
      if (!result) allFound = false;
    }

    if (allFound) {
      console.log('✅ همه‌ی منابع حیاتی با موفقیت همگام‌سازی شدند.');
    } else {
      console.warn('⚠️ برخی از فایل‌های حیاتی یافت نشدند. لطفاً آن‌ها را دستی اضافه کنید.');
    }

    console.log('🌍 سیستم آماده‌ی اجرا است.');
  },

  // =============================================================
  // 🧠 اجرای کامل
  // =============================================================
  run: (user) => {
    if (!horizonBrain.authenticate(user)) return;
    console.log('🌟 Horizon Angel Brain در حال اجرا...');
    horizonBrain.syncAllResources(user);
    console.log('✅ همه عملیات‌ها با موفقیت انجام شد!');
  }
};

// =============================================================
// ▶️ اجرا (فقط شما)
// =============================================================
// horizonBrain.run('Mahdi Amolimoghaddam');
