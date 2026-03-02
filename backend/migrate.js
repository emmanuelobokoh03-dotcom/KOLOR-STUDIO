const { execSync } = require('child_process');

console.log('🚀 Running Prisma migration...');

try {
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Migration complete! Booking table created.');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
