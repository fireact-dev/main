# create-fireact-saas-app

CLI tool to bootstrap a new Fireact SaaS application with Stripe integration.

## Features

- Creates a complete SaaS application with subscription management
- Sets up Stripe integration with:
  - Checkout sessions
  - Webhook handlers
  - Subscription status tracking
- Includes pre-built subscription management UI components
- Configures Firebase Cloud Functions for Stripe operations

## Installation

```bash
npm install -g create-fireact-saas-app
```

## Usage

```bash
create-fireact-saas-app <project-name>
```

The CLI will guide you through:
1. Creating a new project
2. Configuring Firebase
3. Setting up Stripe integration
4. Installing all required dependencies

## Requirements

- Node.js 18+
- Firebase CLI installed globally
- Stripe account with API keys

## What's Included

- Pre-configured Stripe Checkout flow
- Subscription status management
- Cloud Functions for:
  - Creating Stripe customers
  - Handling checkout sessions
  - Processing webhooks
- React components for subscription management

## Configuration

After creation, you may want to:
1. Set up Stripe webhooks in the Firebase Console
2. Configure additional Stripe products/plans
3. Customize the subscription UI
