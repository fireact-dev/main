# Contributing to Fireact.dev

Thank you for your interest in contributing to Fireact.dev! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Testing](#testing)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors. Please:

- Be respectful and considerate in your communication
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept criticism gracefully
- Prioritize the community and project over individual interests

## Getting Started

### Prerequisites

Before contributing, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git**
- **Firebase CLI**: `npm install -g firebase-tools`
- **Stripe CLI** (for payment testing): [Installation Guide](https://stripe.com/docs/stripe-cli)

### Setting Up Your Development Environment

1. **Fork the Repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/fireact.dev.git
   cd fireact.dev
   ```

2. **Initialize Submodules**
   ```bash
   git submodule update --init --recursive
   ```

3. **Set Up the Source Development Environment**
   ```bash
   cd source
   npm install
   cd functions
   npm install
   cd ../..
   ```

4. **Configure Firebase**
   - Create a test Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Set up a web app in your Firebase project
   - Configure your local environment (see source/README.md for details)

5. **Build and Run Locally**
   ```bash
   cd source
   npm run build
   cd functions
   npm run build
   cd ..
   firebase emulators:start
   ```

## Development Workflow

### Working with Submodules

This project uses Git submodules for organization:

- **source/**: Main application code (React + Cloud Functions)
- **create-fireact-app/**: CLI tool
- **demo/**: Demo application
- **docs/**: Documentation site (Hugo)
- **website/**: Marketing website (Hugo)

When working on a submodule:

```bash
# Navigate to the submodule
cd source

# Create a new branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to your fork
git push origin feature/your-feature-name
```

### Keeping Your Fork Updated

```bash
# Add upstream remote (only needed once)
git remote add upstream https://github.com/fireact-dev/fireact.dev.git

# Fetch and merge updates
git fetch upstream
git checkout main
git merge upstream/main

# Update submodules
git submodule update --remote --merge
```

## Project Structure

```
fireact.dev/
├── source/              # Main application source code
│   ├── src/            # React application
│   ├── functions/      # Cloud Functions
│   └── packages/       # Monorepo packages
├── create-fireact-app/ # CLI tool for scaffolding
├── demo/               # Demo application
├── docs/               # Hugo documentation site
├── website/            # Hugo marketing website
└── test-app/           # Testing application
```

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Making Changes

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Fix issues in the codebase
- **Features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Performance**: Optimize existing code
- **Refactoring**: Improve code structure
- **Tests**: Add or improve test coverage

### Branch Naming Convention

Use descriptive branch names:

- `feature/add-social-login` - New features
- `fix/auth-redirect-loop` - Bug fixes
- `docs/improve-setup-guide` - Documentation updates
- `refactor/simplify-context-api` - Code refactoring
- `perf/optimize-subscription-query` - Performance improvements

### Commit Message Guidelines

Write clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add Google OAuth authentication

Implements Google sign-in using Firebase Auth.
Adds configuration options in config/auth.config.json.

Closes #123
```

```
fix: resolve subscription status update delay

Updates webhook handler to immediately sync subscription
status instead of waiting for next polling interval.

Fixes #456
```

## Submitting Changes

### Pull Request Process

1. **Ensure Your Code Works**
   - Test locally using Firebase emulators
   - Build succeeds without errors
   - No console errors in browser

2. **Update Documentation**
   - Update relevant README files
   - Add inline code comments for complex logic
   - Update Hugo docs if adding/changing features

3. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues (e.g., "Closes #123")
   - Provide detailed description of changes
   - Include screenshots for UI changes
   - List breaking changes if any

4. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   Describe testing performed

   ## Screenshots (if applicable)
   Add screenshots here

   ## Checklist
   - [ ] Code builds without errors
   - [ ] Tested with Firebase emulators
   - [ ] Documentation updated
   - [ ] Commit messages follow guidelines
   ```

5. **Code Review**
   - Respond to feedback promptly
   - Make requested changes
   - Keep discussion focused and respectful

## Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow existing code style
- Use **ESLint** for linting: `npm run lint`
- Use meaningful variable and function names
- Add type annotations for function parameters and return values

### React Components

```typescript
/**
 * Component description
 *
 * @param {Props} props - Component props
 * @returns {JSX.Element}
 */
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### Cloud Functions

```typescript
/**
 * Function description
 *
 * @param {FunctionData} data - Request data
 * @param {CallableContext} context - Function context
 * @returns {Promise<Result>}
 */
export const myFunction = functions.https.onCall(
  async (data: FunctionData, context: CallableContext): Promise<Result> => {
    // Function logic
  }
);
```

### CSS/Styling

- Use **TailwindCSS** utility classes
- Keep custom CSS minimal
- Follow mobile-first responsive design
- Ensure dark mode compatibility (if applicable)

### File Organization

- One component per file
- Group related files in directories
- Use index files for cleaner imports
- Keep files focused and modular

## Documentation

### When to Update Documentation

Update documentation when:
- Adding new features or components
- Changing existing functionality
- Fixing bugs that affect usage
- Updating configuration options
- Modifying APIs or interfaces

### Documentation Locations

- **README files**: High-level overview and setup
- **Hugo docs** (`docs/content/`): Comprehensive guides and API reference
- **Inline comments**: Complex logic and algorithms
- **JSDoc comments**: Functions, components, types

### Documentation Style

- Write in clear, concise language
- Use active voice
- Include code examples
- Add screenshots for UI features
- Keep documentation in sync with code

## Testing

### Manual Testing

Before submitting, test your changes:

1. **Build Successfully**
   ```bash
   npm run build
   cd functions && npm run build
   ```

2. **Run Firebase Emulators**
   ```bash
   firebase emulators:start
   ```

3. **Test Stripe Integration** (if applicable)
   ```bash
   stripe listen --forward-to http://127.0.0.1:5001/YOUR_PROJECT/us-central1/stripeWebhook
   ```

4. **Test Different Scenarios**
   - New user signup
   - Authentication flows
   - Subscription creation
   - Permission changes
   - Error cases

### Automated Testing (Future)

We're working on adding automated tests. Stay tuned for updates!

## Community

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Documentation**: [fireact.dev](https://fireact.dev)

### Reporting Bugs

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, browser
6. **Screenshots**: If applicable
7. **Error Messages**: Console errors, stack traces

### Suggesting Features

When suggesting features:

1. **Use Case**: Describe the problem it solves
2. **Proposed Solution**: How it should work
3. **Alternatives**: Other approaches considered
4. **Examples**: Similar implementations elsewhere

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **Pull Requests**: Code contributions
- **GitHub Discussions**: Questions, ideas, community chat

## Recognition

Contributors will be recognized in:
- GitHub contributor list
- Release notes for significant contributions
- Project documentation

Thank you for contributing to Fireact.dev! Your efforts help make this project better for everyone.
