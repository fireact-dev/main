# create-fireact-app

This is a Command Line Interface (CLI) tool designed to streamline the creation of new Fireact applications. It automates the setup process, including the configuration of Firebase and Stripe, to get you started quickly with a production-ready SaaS application.

## Installation

To use this CLI tool, install it globally via npm:

```bash
npm install -g create-fireact-app
```

## Usage

Once installed, you can create a new Fireact application by running:

```bash
create-fireact-app <your-project-name>
```

Replace `<your-project-name>` with the desired name for your new application. The CLI will then guide you through a series of prompts to configure your Firebase project and Stripe integration.

## Features

-   **Automated Project Scaffolding**: Sets up a new React application with a pre-configured structure.
-   **Firebase Integration**: Guides you through selecting and configuring your Firebase project, including SDK setup and `.firebaserc` creation.
-   **Stripe Configuration**: Collects your Stripe API keys and price IDs, and automatically configures your application for payment processing.
-   **Dependency Installation**: Installs all necessary npm dependencies for both the React frontend and Firebase Cloud Functions.
-   **Template File Copying**: Copies essential configuration files and boilerplate code into your new project.

## Post-Installation Steps

After the CLI successfully creates your project, navigate into your new project directory and follow these steps to get your development environment running:

```bash
cd <your-project-name>
npm run build && cd functions && npm run build && cd ..
firebase emulators:start
```

For Stripe webhook testing, open a separate terminal and run:

```bash
stripe listen --forward-to http://127.0.0.1:5001/<your-firebase-project-id>/us-central1/stripeWebhook
```

Remember to update `functions/src/config/stripe.config.json` with the new webhook endpoint secret and rebuild functions (`cd functions && npm build`) if the webhook secret changes.

## Development

This package is part of the larger Fireact.dev monorepo. For development within the monorepo, refer to the root `README.md` for overall project structure and development guidelines.

## License

This project is open source and available under the [MIT License](LICENSE).
