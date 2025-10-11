# Troubleshooting Guide

This guide covers common issues and solutions when working with Fireact.dev.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Firebase Setup Issues](#firebase-setup-issues)
- [Build and Development Issues](#build-and-development-issues)
- [Firebase Emulator Issues](#firebase-emulator-issues)
- [Stripe Integration Issues](#stripe-integration-issues)
- [Authentication Issues](#authentication-issues)
- [Firestore Issues](#firestore-issues)
- [Cloud Functions Issues](#cloud-functions-issues)
- [Git Submodules Issues](#git-submodules-issues)
- [Deployment Issues](#deployment-issues)

## Installation Issues

### `create-fireact-app` command not found

**Problem:** After installing globally, the command is not recognized.

**Solutions:**

1. **Check global npm path:**
   ```bash
   npm config get prefix
   ```

2. **Ensure the path is in your PATH variable:**
   ```bash
   # On macOS/Linux
   echo $PATH

   # On Windows
   echo %PATH%
   ```

3. **Reinstall globally:**
   ```bash
   npm uninstall -g create-fireact-app
   npm install -g create-fireact-app
   ```

4. **Use npx instead:**
   ```bash
   npx create-fireact-app my-app
   ```

### Node version incompatibility

**Problem:** Errors about unsupported Node.js version.

**Solution:** Fireact.dev requires Node.js v18 or higher.

```bash
# Check your Node version
node -v

# Upgrade Node.js
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

### npm install fails with permission errors

**Problem:** Permission denied errors during `npm install`.

**Solution:**

```bash
# Don't use sudo! Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your PATH (add to ~/.bashrc or ~/.zshrc):
export PATH=~/.npm-global/bin:$PATH

# Reload your shell
source ~/.bashrc  # or source ~/.zshrc
```

## Firebase Setup Issues

### Firebase login fails

**Problem:** `firebase login` command fails or hangs.

**Solutions:**

1. **Try CI mode:**
   ```bash
   firebase login --no-localhost
   ```

2. **Clear Firebase cache:**
   ```bash
   rm -rf ~/.config/firebase
   firebase login
   ```

3. **Check firewall/proxy settings:**
   - Ensure ports 9005, 9099, 8080, 5001 are available
   - Check corporate firewall settings

### Firebase project not found

**Problem:** Error: "Failed to get Firebase project."

**Solutions:**

1. **Verify Firebase project exists:**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Ensure project is created

2. **Check `.firebaserc` file:**
   ```json
   {
     "projects": {
       "default": "your-project-id"
     }
   }
   ```

3. **Reinitialize Firebase:**
   ```bash
   firebase use --add
   # Select your project from the list
   ```

### Missing Firebase web app

**Problem:** "No web apps found in Firebase project."

**Solutions:**

1. **Create a web app in Firebase Console:**
   - Go to Project Settings
   - Scroll to "Your apps"
   - Click "Add app" → Web
   - Register app with a nickname

2. **Update configuration:**
   - Copy Firebase config
   - Update `src/config/firebase.config.json`

## Build and Development Issues

### TypeScript compilation errors

**Problem:** TypeScript errors during build.

**Solutions:**

1. **Clean and rebuild:**
   ```bash
   # Clean node_modules
   rm -rf node_modules package-lock.json
   npm install

   # Clean build artifacts
   rm -rf dist
   npm run build
   ```

2. **Check TypeScript version:**
   ```bash
   npx tsc --version
   # Should be 5.x
   ```

3. **Verify tsconfig.json:**
   - Ensure `tsconfig.json` exists
   - Check for syntax errors

### Vite build fails

**Problem:** Vite build errors or warnings.

**Solutions:**

1. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run build
   ```

2. **Check for port conflicts:**
   ```bash
   # Vite uses port 5173 by default
   lsof -i :5173
   # Kill process if needed
   ```

3. **Update dependencies:**
   ```bash
   npm update
   ```

### Module not found errors

**Problem:** "Cannot find module" errors.

**Solutions:**

1. **Check symlinks (in source repository):**
   ```bash
   # Verify symlinks exist
   ls -la packages/app/src/
   # Should show symlinks to ../../../src/

   # Recreate if needed (macOS/Linux)
   cd packages/app/src
   ln -sf ../../../src/components components
   # Repeat for other directories
   ```

2. **Install missing dependencies:**
   ```bash
   npm install
   cd functions
   npm install
   ```

## Firebase Emulator Issues

### Emulators fail to start

**Problem:** `firebase emulators:start` fails.

**Solutions:**

1. **Check port availability:**
   ```bash
   # Check if ports are in use
   lsof -i :5173  # Vite dev server
   lsof -i :9099  # Auth emulator
   lsof -i :8080  # Firestore emulator
   lsof -i :5001  # Functions emulator
   lsof -i :5002  # Hosting emulator

   # Kill processes if needed
   kill -9 <PID>
   ```

2. **Build functions first:**
   ```bash
   cd functions
   npm run build
   cd ..
   ```

3. **Check Java installation (for Firestore emulator):**
   ```bash
   java -version
   # Install Java if missing
   ```

4. **Clear emulator cache:**
   ```bash
   rm -rf ~/.cache/firebase/emulators
   firebase emulators:start
   ```

### Emulator data not persisting

**Problem:** Data lost when emulators restart.

**Solution:** Use export/import for emulator data:

```bash
# Export data
firebase emulators:export ./emulator-data

# Start with exported data
firebase emulators:start --import=./emulator-data
```

### Functions emulator hot reload not working

**Problem:** Changes to functions not reflected without restart.

**Solution:**

1. **Watch mode for functions:**
   ```bash
   # In functions directory
   npm run build -- --watch
   ```

2. **Restart emulators:**
   ```bash
   # Ctrl+C to stop
   firebase emulators:start
   ```

## Stripe Integration Issues

### Stripe CLI not found

**Problem:** `stripe` command not recognized.

**Solutions:**

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

### Webhook endpoint secret mismatch

**Problem:** Stripe webhooks failing with signature verification errors.

**Solution:**

1. **Get new webhook secret:**
   ```bash
   stripe listen --forward-to http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/stripeWebhook
   # Copy the webhook signing secret (whsec_...)
   ```

2. **Update configuration:**
   ```json
   // functions/src/config/stripe.config.json
   {
     "endpointSecret": "whsec_YOUR_NEW_SECRET_HERE"
   }
   ```

3. **Rebuild functions:**
   ```bash
   cd functions
   npm run build
   cd ..
   ```

4. **Restart emulators:**
   ```bash
   firebase emulators:start
   ```

### Stripe test mode vs live mode confusion

**Problem:** Using wrong Stripe keys (test vs live).

**Solution:**

Always use **test mode** keys for development:
- Test keys start with `pk_test_` and `sk_test_`
- Live keys start with `pk_live_` and `sk_live_`

```json
// functions/src/config/stripe.config.json
{
  "secretKey": "sk_test_...",  // Use test key
  "publishableKey": "pk_test_..."  // Use test key
}
```

### Payment requires authentication

**Problem:** Test payments fail with "authentication required."

**Solution:** Use Stripe test cards:

```
Test Card Numbers:
- Success: 4242 4242 4242 4242
- Requires Authentication: 4000 0025 0000 3155
- Declined: 4000 0000 0000 9995

Expiry: Any future date
CVC: Any 3 digits
ZIP: Any valid ZIP
```

## Authentication Issues

### User not redirected after sign-in

**Problem:** User stuck on sign-in page after successful authentication.

**Solutions:**

1. **Check routing configuration:**
   - Verify `PrivateRoute` component is set up correctly
   - Check redirect logic in sign-in component

2. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Clear cookies and local storage

3. **Check Firebase Auth configuration:**
   ```javascript
   // Verify authorized domains in Firebase Console
   // Authentication → Settings → Authorized domains
   // Should include localhost and your domain
   ```

### "Auth/network-request-failed" error

**Problem:** Network errors when attempting authentication.

**Solutions:**

1. **Check Firebase emulator connection:**
   ```javascript
   // Verify emulator configuration in firebase.config.json
   {
     "emulators": {
       "enabled": true,
       "auth": {
         "host": "localhost",
         "port": 9099
       }
     }
   }
   ```

2. **Ensure emulators are running:**
   ```bash
   firebase emulators:start
   ```

3. **Check firewall/antivirus:**
   - Temporarily disable to test
   - Add exceptions for Firebase ports

### Password reset email not sending

**Problem:** Password reset emails not received.

**Solutions:**

1. **In emulator mode:**
   - Check emulator UI: http://localhost:4000
   - Look for reset links in the Auth emulator

2. **In production:**
   - Check spam folder
   - Verify email template in Firebase Console
   - Check email quota limits

## Firestore Issues

### Permission denied errors

**Problem:** "FirebaseError: Permission denied" when accessing Firestore.

**Solutions:**

1. **Check Firestore rules:**
   ```bash
   # View current rules
   cat firestore.rules
   ```

2. **Deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **In emulator mode:**
   - Emulator uses local `firestore.rules`
   - Restart emulators after rule changes

4. **Verify user authentication:**
   - Ensure user is signed in
   - Check authentication token is valid

### Data not syncing in real-time

**Problem:** Firestore real-time updates not working.

**Solutions:**

1. **Check listener setup:**
   ```javascript
   // Use onSnapshot for real-time updates
   onSnapshot(docRef, (snapshot) => {
     // Handle updates
   });
   ```

2. **Check network connection:**
   - Firestore requires active network
   - Check browser console for errors

3. **Clear cache:**
   ```javascript
   // Disable cache during development
   const settings = { cacheSizeBytes: 0 };
   firestore.settings(settings);
   ```

### Indexes missing

**Problem:** "The query requires an index" error.

**Solutions:**

1. **Click the index creation link in error:**
   - Error message contains direct link to create index

2. **Deploy indexes manually:**
   ```bash
   # Update firestore.indexes.json
   firebase deploy --only firestore:indexes
   ```

## Cloud Functions Issues

### Functions not deploying

**Problem:** Deployment hangs or fails.

**Solutions:**

1. **Build functions first:**
   ```bash
   cd functions
   npm run build
   cd ..
   ```

2. **Check Node.js version in functions:**
   ```json
   // functions/package.json
   {
     "engines": {
       "node": "18"  // or higher
     }
   }
   ```

3. **Deploy specific function:**
   ```bash
   firebase deploy --only functions:functionName
   ```

4. **Check logs:**
   ```bash
   firebase functions:log
   ```

### CORS errors when calling functions

**Problem:** CORS errors in browser console.

**Solutions:**

1. **Use callable functions:**
   - Use `httpsCallable` instead of direct HTTP requests
   - Callable functions handle CORS automatically

2. **For HTTP functions, add CORS:**
   ```typescript
   import * as cors from 'cors';
   const corsHandler = cors({ origin: true });

   export const myFunction = functions.https.onRequest((req, res) => {
     corsHandler(req, res, () => {
       // Function logic
     });
   });
   ```

### Function timeout

**Problem:** Functions timing out.

**Solutions:**

1. **Increase timeout:**
   ```typescript
   export const myFunction = functions
     .runWith({ timeoutSeconds: 540 }) // Max 9 minutes
     .https.onCall(async (data, context) => {
       // Function logic
     });
   ```

2. **Optimize function code:**
   - Reduce external API calls
   - Use batch operations
   - Implement pagination

## Git Submodules Issues

### Submodules not initialized

**Problem:** Submodule directories are empty.

**Solution:**

```bash
# Initialize and update all submodules
git submodule update --init --recursive

# Or for specific submodule
cd source
git submodule update --init
```

### Submodule pointing to wrong commit

**Problem:** Submodule not at latest commit.

**Solution:**

```bash
# Update to latest
git submodule update --remote

# Or manually
cd source
git checkout main
git pull origin main
cd ..
git add source
git commit -m "Update source submodule"
```

### Changes in submodule not reflected

**Problem:** Made changes in submodule but not showing in main repo.

**Solution:**

```bash
# Commit changes in submodule first
cd source
git add .
git commit -m "Changes in submodule"
git push origin main

# Then update reference in main repo
cd ..
git add source
git commit -m "Update source submodule reference"
```

## Deployment Issues

### Build fails in production

**Problem:** Production build succeeds locally but fails in CI/CD.

**Solutions:**

1. **Check Node.js version:**
   - Ensure CI uses same Node version as local

2. **Check environment variables:**
   - Verify all required env vars are set in CI

3. **Clear caches:**
   ```bash
   # In CI configuration
   rm -rf node_modules
   npm ci  # Use ci instead of install
   ```

### Functions not working after deployment

**Problem:** Functions work locally but fail in production.

**Solutions:**

1. **Check function logs:**
   ```bash
   firebase functions:log --only functionName
   ```

2. **Verify environment configuration:**
   ```bash
   firebase functions:config:get
   ```

3. **Check IAM permissions:**
   - Ensure service account has correct permissions
   - Check Firebase Console → Functions

### Site not loading after deployment

**Problem:** Deployed site shows blank page or errors.

**Solutions:**

1. **Check build output:**
   ```bash
   # Verify dist/ directory has content
   ls -la dist/
   ```

2. **Check firebase.json:**
   ```json
   {
     "hosting": {
       "public": "dist",  // Verify this matches build output
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ]
     }
   }
   ```

3. **Clear hosting cache:**
   - Wait 10-15 minutes for CDN propagation
   - Hard refresh browser (Cmd+Shift+R)

## Getting Additional Help

If you're still experiencing issues:

1. **Check existing issues:** [GitHub Issues](https://github.com/fireact-dev/fireact.dev/issues)
2. **Search documentation:** [docs.fireact.dev](https://docs.fireact.dev)
3. **Ask the community:** GitHub Discussions
4. **Report a bug:** Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Error messages and logs

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
firebase emulators:start       # Start Firebase emulators
stripe listen --forward-to ... # Start Stripe webhook forwarding

# Troubleshooting
rm -rf node_modules dist       # Clean build
npm install                    # Reinstall dependencies
firebase emulators:start --export-on-exit  # Save emulator data

# Git Submodules
git submodule update --init --recursive  # Initialize submodules
git submodule update --remote           # Update submodules

# Firebase
firebase use --add            # Switch Firebase project
firebase deploy               # Deploy everything
firebase functions:log        # View function logs
```

---

For more detailed information, see:
- [Getting Started Guide](docs/content/getting-started.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
