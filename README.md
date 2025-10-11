# fireact.dev

A comprehensive open-source framework for building production-ready SaaS applications with Firebase, React, TypeScript, and Stripe integration.

## Overview

fireact.dev provides a complete foundation for building modern SaaS applications. It combines industry-standard technologies and best practices to help developers launch their SaaS products faster and more efficiently.

## Demo

![SaaS Demo](saas-demo.png)

Visit our [demos page](https://fireact.dev/demos/) to explore live demonstrations of both the Core and SaaS versions, showcasing the full range of features and capabilities.

## Features

### Features
- **Authentication & User Management**
  - Complete authentication system (sign-up, sign-in, password reset)
  - User profile management
  - Role-based access control
  - Team member invitations and permissions
- **Subscription Management**
  - Multiple subscription plans support
  - Stripe integration for payment processing
  - Billing portal and invoice management
  - Payment method management
  - Subscription upgrades and downgrades

### Developer Experience
- TypeScript for better code quality
- TailwindCSS for responsive design
- Firebase emulator support for local development
- Comprehensive documentation
- Modular architecture

## Project Structure

The repository is organized into several key directories:

- **`source/`**: This directory contains the complete, combined source code for the Fireact.dev project, including both the React frontend application and Firebase Cloud Functions backend code. It follows a monorepo structure with `packages/app` for the React app and `packages/functions` for the Cloud Functions.
- **`create-fireact-app/`**: Contains the CLI tool used to scaffold new Fireact applications.
- **`website/`**: The main marketing website for fireact.dev, built with Hugo.
- **`docs/`**: The documentation website for fireact.dev, built with Hugo.
- **`demo/`**: Contains the demo application.

## Getting Started

To create a new Fireact application, use the `create-fireact-app` CLI tool. This tool will guide you through the setup process, including Firebase and Stripe configurations.

1. **Install the CLI (if you haven't already)**:
   ```bash
   npm install -g create-fireact-app
   ```

2. **Create a new project**:
   ```bash
   create-fireact-app <your-project-name>
   ```
   Replace `<your-project-name>` with the desired name for your new application.

3. **Follow the prompts**: The CLI will guide you through selecting your Firebase project and configuring Stripe.

4. **After creation**:
   Navigate into your new project directory:
   ```bash
   cd <your-project-name>
   ```
   Then, build the application and functions, and start the emulators:
   ```bash
   npm run build && cd functions && npm run build && cd ..
   firebase emulators:start
   ```
   For Stripe webhook testing, in a separate terminal:
   ```bash
   stripe listen --forward-to http://127.0.0.1:5001/<your-firebase-project-id>/us-central1/stripeWebhook
   ```
   Remember to update `functions/src/config/stripe.config.json` with the new webhook endpoint secret and rebuild functions (`cd functions && npm run build`) if the webhook secret changes.

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Payment Processing**: Stripe
- **Development Tools**: Vite, ESLint, PostCSS

## Deployment

### Preparing for Production

Before deploying to production:

1. **Update Configuration Files**:
   - Replace emulator settings with production Firebase config
   - Use production Stripe API keys
   - Set `emulators.enabled` to `false` in firebase.config.json

2. **Build for Production**:
   ```bash
   cd <your-project-name>
   npm run build
   cd functions
   npm run build
   cd ..
   ```

3. **Test Production Build Locally**:
   ```bash
   firebase emulators:start --only hosting
   ```

### Deploying to Firebase

**Initial Deployment:**

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting        # React app
firebase deploy --only functions      # Cloud Functions
firebase deploy --only firestore      # Security rules & indexes
```

**Subsequent Deployments:**

```bash
# Deploy only what changed
firebase deploy --only hosting,functions
```

### Environment-Specific Deployments

**Using Multiple Firebase Projects:**

```bash
# Set up aliases
firebase use --add

# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy
```

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install
          cd functions && npm install

      - name: Build
        run: |
          npm run build
          cd functions && npm run build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Get Firebase token:
```bash
firebase login:ci
# Save the token as GitHub secret: FIREBASE_TOKEN
```

### CI/CD with Google Cloud Build

See [demo/README.md](demo/README.md) for detailed Cloud Build setup with secure configuration management.

### Post-Deployment

**Verify Deployment:**

1. Check hosting URL: `https://your-project.web.app`
2. Test authentication flow
3. Verify Cloud Functions
4. Check Firestore connectivity
5. Test Stripe webhooks

**Set Up Production Webhook:**

```bash
# Add webhook endpoint in Stripe Dashboard
https://us-central1-your-project.cloudfunctions.net/stripeWebhook

# Use production webhook secret in stripe.config.json
```

**Monitor:**

- Firebase Console → Functions logs
- Firebase Console → Analytics
- Stripe Dashboard → Webhooks
- Error tracking (recommended: Sentry, LogRocket)

For detailed deployment guides, see:
- [Firebase Deployment Docs](https://firebase.google.com/docs/hosting/deploying)
- [Architecture Documentation](ARCHITECTURE.md)
- [Demo CI/CD Setup](demo/README.md)

## Documentation

Visit [fireact.dev](https://fireact.dev) for comprehensive documentation, including:

- [Getting Started Guide](docs/content/getting-started.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Component Documentation](https://docs.fireact.dev/app)
- [API Reference](https://docs.fireact.dev)
- [Custom Development Guide](https://docs.fireact.dev/custom-development)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

Key contribution areas:
- Bug fixes and improvements
- New features and components
- Documentation enhancements
- Example applications
- Test coverage

## Community & Support

- **Website**: [fireact.dev](https://fireact.dev)
- **Documentation**: [docs.fireact.dev](https://docs.fireact.dev)
- **GitHub Issues**: [Report bugs and request features](https://github.com/fireact-dev/fireact.dev/issues)
- **GitHub Discussions**: Community questions and discussions
- **Demo Application**: [Live Demo](https://fireact.dev/demos/)

## License

This project is open source and available under the [MIT License](LICENSE).
