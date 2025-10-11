# create-fireact-app

A Command Line Interface (CLI) tool designed to streamline the creation of new Fireact applications. It automates the setup process, including the configuration of Firebase and Stripe, to get you started quickly with a production-ready SaaS application.

## Installation

### Global Installation (Recommended)

Install globally to use the command anywhere:

```bash
npm install -g create-fireact-app
```

Verify installation:

```bash
create-fireact-app --version
```

### Using npx (No Installation Required)

Run directly without installing:

```bash
npx create-fireact-app <your-project-name>
```

## Usage

### Basic Usage

Create a new Fireact application:

```bash
create-fireact-app <your-project-name>
```

Replace `<your-project-name>` with the desired name for your new application.

### Interactive Setup

The CLI will guide you through a series of prompts:

1. **Firebase Project Selection**
   - Lists all your Firebase projects
   - Select the project to use
   - Fetches Firebase SDK configuration automatically

2. **Firebase Web App Selection**
   - Lists all web apps in the selected project
   - Select the web app for SDK credentials

3. **Stripe Configuration**
   - Enter Stripe publishable key (pk_test_...)
   - Enter Stripe secret key (sk_test_...)
   - Configure subscription plans with Stripe Price IDs

4. **Dependency Installation**
   - Automatically installs React app dependencies
   - Installs Cloud Functions dependencies

## Features

### Automated Project Scaffolding
Sets up a complete React application with:
- Pre-configured project structure
- Firebase integration
- Stripe payment processing
- Cloud Functions setup
- Firestore security rules
- Development environment configuration

### Firebase Integration
- Interactive Firebase project selection
- Automatic SDK configuration
- `.firebaserc` file creation
- Firebase CLI integration
- Emulator configuration

### Stripe Configuration
- Secure API key collection
- Multiple subscription plan setup
- Webhook configuration templates
- Test mode configuration

### Dependency Management
- Installs all required npm dependencies
- Sets up both frontend and backend packages
- Configures TypeScript and build tools
- Installs development dependencies

### Configuration Files
Creates and configures:
- `firebase.config.json` - Firebase SDK settings
- `stripe.config.json` - Stripe API keys
- `plans.config.json` - Subscription plans
- `.firebaserc` - Firebase project reference
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Database indexes

## Post-Installation Steps

After the CLI successfully creates your project, follow these steps to run your application locally:

### 1. Navigate to Your Project

```bash
cd <your-project-name>
```

### 2. Build the Application

```bash
# Build React application
npm run build

# Build Cloud Functions
cd functions
npm run build
cd ..
```

### 3. Start Firebase Emulators

```bash
firebase emulators:start
```

This will start:
- **Hosting**: http://localhost:5002 (your React app)
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Functions Emulator**: http://localhost:5001
- **Emulator UI**: http://localhost:4000

### 4. Set Up Stripe Webhook (Separate Terminal)

```bash
stripe listen --forward-to http://127.0.0.1:5001/<your-firebase-project-id>/us-central1/stripeWebhook
```

**Important:** Copy the webhook signing secret (starts with `whsec_`) from the Stripe CLI output.

### 5. Update Stripe Webhook Secret

1. Open `functions/src/config/stripe.config.json`
2. Replace the `endpointSecret` value with the new secret
3. Rebuild functions:
   ```bash
   cd functions
   npm run build
   cd ..
   ```
4. Restart the emulators

### 6. Access Your Application

Open your browser and navigate to: http://localhost:5002

## Project Structure

The generated project includes:

```
your-project-name/
├── src/                    # React application source
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── config/            # Configuration files
│   └── i18n/              # Internationalization
├── functions/              # Cloud Functions
│   └── src/
│       ├── functions/     # Function implementations
│       └── config/        # Configuration files
├── public/                 # Static assets
├── firebase.json          # Firebase configuration
├── firestore.rules        # Security rules
├── firestore.indexes.json # Database indexes
└── package.json           # Dependencies
```

## CLI Options

### Version

Check the installed version:

```bash
create-fireact-app --version
# or
create-fireact-app -v
```

### Help

Display help information:

```bash
create-fireact-app --help
# or
create-fireact-app -h
```

## Prerequisites

Before using the CLI, ensure you have:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **Firebase CLI** installed and logged in
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Firebase Project** created at [Firebase Console](https://console.firebase.google.com/)
   - Must have at least one Web App configured

4. **Stripe Account** (for SaaS features)
   - Get test API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Create price IDs for subscription plans

5. **Stripe CLI** (optional, for webhook testing)
   - Installation guide: https://stripe.com/docs/stripe-cli

## Configuration Guide

### Firebase Configuration

The CLI automatically generates `src/config/firebase.config.json`:

```json
{
  "firebase": {
    "apiKey": "your-api-key",
    "authDomain": "your-project.firebaseapp.com",
    "projectId": "your-project-id",
    "storageBucket": "your-project.appspot.com",
    "messagingSenderId": "123456789",
    "appId": "your-app-id"
  },
  "emulators": {
    "enabled": true,
    "auth": {
      "host": "localhost",
      "port": 9099
    },
    "firestore": {
      "host": "localhost",
      "port": 8080
    },
    "functions": {
      "host": "localhost",
      "port": 5001
    }
  }
}
```

### Stripe Configuration

The CLI creates `functions/src/config/stripe.config.json`:

```json
{
  "secretKey": "sk_test_...",
  "publishableKey": "pk_test_...",
  "endpointSecret": "whsec_..."
}
```

**Security Note:** Never commit production keys to version control!

### Subscription Plans

Configure plans in `functions/src/config/plans.config.json`:

```json
{
  "plans": [
    {
      "id": "basic",
      "name": "Basic Plan",
      "stripePriceId": "price_...",
      "currency": "usd",
      "amount": 999,
      "interval": "month"
    },
    {
      "id": "pro",
      "name": "Pro Plan",
      "stripePriceId": "price_...",
      "currency": "usd",
      "amount": 2999,
      "interval": "month"
    }
  ]
}
```

## Troubleshooting

### CLI Command Not Found

If `create-fireact-app` is not recognized:

1. Check global npm path:
   ```bash
   npm config get prefix
   ```

2. Ensure it's in your PATH, or use npx:
   ```bash
   npx create-fireact-app my-app
   ```

### Firebase Login Issues

If Firebase login fails:

```bash
# Try CI mode
firebase login --no-localhost

# Or clear cache and retry
rm -rf ~/.config/firebase
firebase login
```

### No Web Apps Found

If the CLI can't find web apps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings
4. Scroll to "Your apps"
5. Click "Add app" → Web
6. Register a web app with a nickname

### Installation Hangs

If npm installation hangs:

```bash
# Cancel with Ctrl+C and try:
npm cache clean --force
npx create-fireact-app my-app
```

### Permission Errors

If you get permission errors:

```bash
# Don't use sudo! Fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

For more troubleshooting, see the [main troubleshooting guide](https://github.com/fireact-dev/fireact.dev/blob/main/TROUBLESHOOTING.md).

## Example Workflow

Complete example of creating a new app:

```bash
# 1. Install CLI
npm install -g create-fireact-app

# 2. Create new app
create-fireact-app my-saas-app

# The CLI will prompt you for:
# - Firebase project selection
# - Firebase web app selection
# - Stripe publishable key
# - Stripe secret key
# - Subscription plan configuration

# 3. Navigate to project
cd my-saas-app

# 4. Build everything
npm run build
cd functions && npm run build && cd ..

# 5. Start emulators
firebase emulators:start

# 6. In another terminal, start Stripe webhook forwarding
stripe listen --forward-to http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/stripeWebhook

# 7. Update webhook secret in functions/src/config/stripe.config.json
# 8. Rebuild functions
cd functions && npm run build && cd ..

# 9. Open http://localhost:5002 in your browser
```

## Development

### For CLI Development

This package is part of the larger Fireact.dev monorepo. For development within the monorepo:

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Link for local testing: `npm link`
5. Test: `create-fireact-app test-app`

### Project Structure

```
create-fireact-app/
├── src/               # CLI source code
├── templates/         # Project templates
├── bin/               # Executable files
└── package.json       # Package configuration
```

For detailed development guidelines, refer to the root [README.md](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Resources

- **Documentation**: [docs.fireact.dev](https://docs.fireact.dev)
- **Website**: [fireact.dev](https://fireact.dev)
- **GitHub**: [github.com/fireact-dev](https://github.com/fireact-dev)
- **Issues**: [Report bugs](https://github.com/fireact-dev/fireact.dev/issues)

## License

This project is open source and available under the [MIT License](LICENSE).
