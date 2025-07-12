# Create Fireact App

A CLI tool to scaffold new Fireact applications with all required configurations.

## Installation

```bash
npm install -g create-fireact-app
```

Or use directly with npx (recommended):

```bash
npx create-fireact-app@latest
```

## Usage

1. Create a new Fireact project:
```bash
npx create-fireact-app@latest my-fireact-app
```

2. Follow the interactive prompts to:
   - Select your Firebase project
   - Configure your application

3. After creation, navigate to your project:
```bash
cd my-fireact-app
```

4. Start the development server:
```bash
npm run dev
```

## Requirements

- Node.js 18+
- Firebase CLI (install with `npm install -g firebase-tools`)
- Firebase account with at least one project

## Features

- Sets up a complete Fireact project with:
  - Vite + React + TypeScript
  - Tailwind CSS
  - Firebase configuration
  - Internationalization (i18n)
  - Pre-configured routing and authentication

## Development

To work on the CLI tool itself:

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Link for local development:
```bash
npm link
```
4. Test changes:
```bash
node index.js test-app
```

## License

MIT
