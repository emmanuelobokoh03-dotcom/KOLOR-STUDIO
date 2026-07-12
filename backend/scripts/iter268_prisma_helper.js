/**
 * Iteration 268 - Prisma helper for backend tests
 * Usage:
 *   node iter268_prisma_helper.js get <email>
 *   node iter268_prisma_helper.js inject <email> <rawToken> <pendingEmail> [expirySecondsFromNow]
 *   node iter268_prisma_helper.js inject-expired <email> <rawToken> <pendingEmail>
 *   node iter268_prisma_helper.js verify-user <email>       // set emailVerified=true & clear verificationToken (in case login requires it in the future)
 *   node iter268_prisma_helper.js restore-email <currentEmail> <targetEmail>
 *   node iter268_prisma_helper.js cleanup <emailPrefix>     // delete users whose email starts with prefix
 *   node iter268_prisma_helper.js reset-fields <email>      // clear all emailChange & pendingEmail fields
 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function sha256(v) {
  return crypto.createHash('sha256').update(v).digest('hex');
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === 'get') {
      const email = args[0].toLowerCase();
      const u = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true, email: true, pendingEmail: true, emailChangeToken: true,
          emailChangeTokenExpiry: true, emailChangeAttempts: true,
          emailChangeWindowStart: true, tokenVersion: true, emailVerified: true,
        },
      });
      console.log(JSON.stringify(u));
    } else if (cmd === 'inject') {
      const [email, rawToken, pendingEmail, expirySeconds] = args;
      const secs = expirySeconds ? parseInt(expirySeconds, 10) : 15 * 60;
      const u = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          emailChangeToken: sha256(rawToken),
          emailChangeTokenExpiry: new Date(Date.now() + secs * 1000),
          pendingEmail: pendingEmail.toLowerCase(),
        },
        select: { id: true, email: true, pendingEmail: true, emailChangeTokenExpiry: true },
      });
      console.log(JSON.stringify(u));
    } else if (cmd === 'inject-expired') {
      const [email, rawToken, pendingEmail] = args;
      const u = await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          emailChangeToken: sha256(rawToken),
          emailChangeTokenExpiry: new Date(Date.now() - 60 * 1000),
          pendingEmail: pendingEmail.toLowerCase(),
        },
        select: { id: true, email: true, pendingEmail: true, emailChangeTokenExpiry: true },
      });
      console.log(JSON.stringify(u));
    } else if (cmd === 'verify-user') {
      const email = args[0].toLowerCase();
      const u = await prisma.user.update({
        where: { email },
        data: { emailVerified: true, verificationToken: null },
        select: { id: true, email: true, emailVerified: true },
      });
      console.log(JSON.stringify(u));
    } else if (cmd === 'restore-email') {
      const [currentEmail, targetEmail] = args;
      const u = await prisma.user.update({
        where: { email: currentEmail.toLowerCase() },
        data: {
          email: targetEmail.toLowerCase(),
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeTokenExpiry: null,
          emailChangeAttempts: 0,
          emailChangeWindowStart: null,
        },
        select: { id: true, email: true },
      });
      console.log(JSON.stringify(u));
    } else if (cmd === 'reset-fields') {
      const email = args[0].toLowerCase();
      const u = await prisma.user.update({
        where: { email },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeTokenExpiry: null,
          emailChangeAttempts: 0,
          emailChangeWindowStart: null,
        },
        select: { id: true, email: true },
      });
      console.log(JSON.stringify(u));
    } else if (cmd === 'cleanup') {
      const prefix = args[0];
      const result = await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
      console.log(JSON.stringify(result));
    } else {
      console.error('Unknown command: ' + cmd);
      process.exit(2);
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
