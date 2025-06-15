#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const folders = [
  'src/assets/images',
  'src/assets/icons',
  'src/assets/fonts',
  'src/components/common',
  'src/components/forms',
  'src/components/navigation',
  'src/components/layout',
  'src/config/api',
  'src/config/constants',
  'src/config/environment',
  'src/context',
  'src/errorBoundary',
  'src/features/auth',
  'src/features/dashboard',
  'src/features/profile',
  'src/hoc',
  'src/hooks/api',
  'src/hooks/ui',
  'src/hooks/utilities',
  'src/i18n',
  'src/layouts/auth',
  'src/layouts/main',
  'src/layouts/admin',
  'src/locales/en',
  'src/locales/es',
  'src/locales/fr',
  'src/middlewares',
  'src/pages/auth',
  'src/pages/dashboard',
  'src/pages/settings',
  'src/routes/guards',
  'src/routes/config',
  'src/services/api',
  'src/services/auth',
  'src/services/storage',
  'src/store/slices',
  'src/store/middleware',
  'src/styles/base',
  'src/styles/components',
  'src/styles/utilities',
  'src/theme',
  'src/tests/utils',
  'src/tests/mocks',
  'src/tests/fixtures',
  'src/types/api',
  'src/types/components',
  'src/types/store',
  'src/utils/validation',
  'src/utils/formatting',
  'src/utils/helpers',
  'public/locales/en',
  'public/locales/es',
  'public/locales/fr',
  'reports',
];

console.log('🚀 Creating Enterprise React folder structure...');

folders.forEach((folder) => {
  const fullPath = path.join(process.cwd(), folder);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });

    // Create .gitkeep file for empty directories
    const gitkeepPath = path.join(fullPath, '.gitkeep');
    fs.writeFileSync(gitkeepPath, '');

    console.log(`✅ Created: ${folder}`);
  } else {
    console.log(`⏭️  Already exists: ${folder}`);
  }
});

console.log('🎉 Folder structure created successfully!');
