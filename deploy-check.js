#!/usr/bin/env node

// Deployment preparation script
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Employee Management System for deployment...\n');

// Check required files
const requiredFiles = [
    'index.html',
    'package.json',
    'vercel.json',
    'src/app.js',
    'api/data.js'
];

console.log('✅ Checking required files...');
for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Missing required file: ${file}`);
        process.exit(1);
    }
    console.log(`   ✓ ${file}`);
}

// Validate package.json
console.log('\n✅ Validating package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!packageJson.name || !packageJson.version) {
    console.error('❌ package.json missing name or version');
    process.exit(1);
}
console.log(`   ✓ Name: ${packageJson.name}`);
console.log(`   ✓ Version: ${packageJson.version}`);

// Check environment configuration
console.log('\n✅ Checking environment configuration...');
if (fs.existsSync('.env.example')) {
    console.log('   ✓ .env.example found');
} else {
    console.log('   ⚠️  .env.example not found (optional)');
}

// Validate HTML structure
console.log('\n✅ Validating HTML structure...');
const htmlContent = fs.readFileSync('index.html', 'utf8');
if (!htmlContent.includes('<!DOCTYPE html>')) {
    console.error('❌ HTML missing DOCTYPE');
    process.exit(1);
}
if (!htmlContent.includes('<meta name="viewport"')) {
    console.error('❌ HTML missing viewport meta tag');
    process.exit(1);
}
console.log('   ✓ HTML structure valid');

// Check JavaScript modules
console.log('\n✅ Checking JavaScript modules...');
const jsFiles = [
    'src/app.js',
    'src/components/staff.js',
    'src/components/summary.js',
    'src/components/logs.js',
    'src/services/database.js'
];

for (const file of jsFiles) {
    if (fs.existsSync(file)) {
        console.log(`   ✓ ${file}`);
    } else {
        console.log(`   ⚠️  ${file} not found`);
    }
}

// Performance check
console.log('\n✅ Performance recommendations...');
if (htmlContent.includes('https://cdn.tailwindcss.com')) {
    console.log('   ✓ Using Tailwind CSS CDN');
}
if (htmlContent.includes('https://cdn.jsdelivr.net/npm/chart.js')) {
    console.log('   ✓ Using Chart.js CDN');
}
if (htmlContent.includes('preconnect')) {
    console.log('   ✓ DNS preconnect optimizations found');
}

// Security check
console.log('\n✅ Security check...');
if (fs.existsSync('.gitignore') && fs.readFileSync('.gitignore', 'utf8').includes('.env')) {
    console.log('   ✓ .env files in .gitignore');
} else {
    console.log('   ⚠️  Consider adding .env files to .gitignore');
}

console.log('\n🎉 Deployment preparation complete!');
console.log('\nNext steps:');
console.log('1. Set up your Supabase project and update credentials');
console.log('2. Deploy to Vercel: npx vercel --prod');
console.log('3. Configure environment variables in Vercel dashboard');
console.log('4. Test the deployed application');
console.log('\n📚 See DEPLOYMENT.md for detailed instructions');
