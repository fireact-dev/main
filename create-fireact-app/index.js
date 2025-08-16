#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora'; // Import ora for spinners
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to replace template variables in files
async function replaceInFile(filePath, replacements) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }
    
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to replace variables in ${filePath}: ${error.message}`);
  }
}

const program = new Command();

program
  .name('create-fireact-app')
  .description('CLI to create a new Fireact application')
  .version('1.0.0');

program
  .argument('<project-name>', 'The name of the project to create')
  .option('--existing', 'Install in an existing directory')
  .action(async (projectName, options) => {
    const spinner = ora();

    const projectPath = path.resolve(process.cwd(), projectName);

    // Check if directory already exists
    if (fs.existsSync(projectPath) && !options.existing) {
      console.error(chalk.red(`Error: Directory "${projectName}" already exists. Use --existing to install anyway.`));
      process.exit(1);
    }

    console.log('DEBUG: projectPath before try/catch:', projectPath); // Debugging line

    try {
      // --- Phase 1: Project Scaffolding and Core Logic ---

      // 1. Check for Firebase CLI
      spinner.start('Checking for Firebase CLI...');
      const firebaseCheck = await execa('command', ['-v', 'firebase'], { reject: false });
      if (firebaseCheck.exitCode !== 0) {
        spinner.fail('Firebase CLI not found.');
        console.error(chalk.red('Please install the Firebase CLI: npm install -g firebase-tools'));
        console.error(chalk.red('Then, log in: firebase login'));
        process.exit(1);
      }
      spinner.succeed('Firebase CLI found.');

      // 2. Create Vite Project
      spinner.start('Creating Vite project...');
      await execa('npm', ['create', 'vite@latest', projectName, '--yes', '--', '--template', 'react-ts'], { stdio: 'pipe' });
      spinner.succeed('Vite project created successfully.');

      // Change directory to the new project
      process.chdir(projectPath);

      // 3. Install Dependencies
      spinner.start('Installing dependencies...');
      // Install main packages (peer dependencies will be installed automatically in npm v7+)
      await execa('npm', ['install', '@fireact.dev/app', 'i18next-browser-languagedetector'], { stdio: 'inherit' });
      
      // Install dev dependencies
      await execa('npm', ['install', '-D', '@vitejs/plugin-react', '@types/react', '@types/react-dom', 'typescript', 'postcss', 'autoprefixer', '@tailwindcss/postcss', 'eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint'], { stdio: 'inherit' });
      
      spinner.succeed('Dependencies installed successfully.');

      // 4. Install cloud functions dependencies
      spinner.start('Installing cloud functions dependencies...');
      await fs.ensureDir(path.join(projectPath, 'functions'));
      
      // Initialize npm in functions directory
      await execa('npm', ['init', '-y'], { 
        stdio: 'ignore',
        cwd: path.join(projectPath, 'functions')
      });
      
      // Update functions package.json with correct scripts and configuration BEFORE installing dependencies
      const functionsPackageJsonPath = path.join(projectPath, 'functions', 'package.json');
      const functionsPackageJson = await fs.readJson(functionsPackageJsonPath);
      
      // Update with Firebase Functions specific configuration
      functionsPackageJson.scripts = {
        "lint": "eslint --ext .js,.ts .",
        "build": "tsc",
        "build:watch": "tsc --watch",
        "serve": "npm run build && firebase emulators:start --only functions",
        "shell": "npm run build && firebase functions:shell",
        "start": "npm run shell",
        "deploy": "firebase deploy --only functions",
        "logs": "firebase functions:log"
      };
      functionsPackageJson.engines = {
        "node": process.version.replace('v', '').split('.')[0]
      };
      functionsPackageJson.main = "lib/index.js";
      functionsPackageJson.private = true;
      
      await fs.writeJson(functionsPackageJsonPath, functionsPackageJson, { spaces: 2 });
      
      // Install all dependencies in one command (regular, dev, and optional)
      await execa('npm', ['install', '@fireact.dev/functions', '-D', '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser', 'eslint', 'eslint-config-google', 'eslint-plugin-import', 'firebase-functions-test', 'typescript', '--include=optional', '--force'], { 
        stdio: 'inherit',
        cwd: path.join(projectPath, 'functions')
      });
      spinner.succeed('Cloud functions dependencies installed.');

      // 5. Copy all template files
      spinner.start('Copying template files...');
      await fs.copy(
        path.join(__dirname, 'templates'),
        projectPath,
        { overwrite: true }
      );
      
      // Ensure config directories exist
      await fs.ensureDir(path.join(projectPath, 'src', 'config'));
      await fs.ensureDir(path.join(projectPath, 'functions', 'src', 'config'));
      spinner.succeed('Template files copied successfully.');

      // --- Phase 2: Interactive Configuration ---

      // 6. Firebase Configuration
      spinner.start('Fetching your Firebase projects...');
      const firebaseProjectsResult = await execa('firebase', ['projects:list', '--json'], { reject: false, stdio: 'pipe' });

      let projects = [];
      if (firebaseProjectsResult.exitCode === 0 && firebaseProjectsResult.stdout) {
        try {
          const response = JSON.parse(firebaseProjectsResult.stdout);
          projects = response.result;
          if (!Array.isArray(projects)) {
            throw new Error('Firebase projects list is not in the expected array format.');
          }
        } catch (parseError) {
          spinner.fail('Failed to parse Firebase projects list.');
          console.error(chalk.red('Ensure you are logged in to Firebase. Run: firebase login'));
          process.exit(1);
        }
      } else {
        spinner.fail('Failed to fetch Firebase projects.');
        console.error(chalk.red('Please ensure you are logged in to Firebase. Run: firebase login'));
        process.exit(1);
      }

      if (projects.length === 0) {
        spinner.fail('No Firebase projects found.');
        console.error(chalk.red('Please create a Firebase project at https://console.firebase.google.com/'));
        process.exit(1);
      }

      const projectChoices = projects.map(project => ({
        name: `${project.name} (${project.projectId})`,
        value: project.projectId
      }));

      const { selectedProjectId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedProjectId',
          message: 'Select your Firebase project:',
          choices: projectChoices,
        },
      ]);

      // Check if a web app exists for the selected project
      spinner.start(`Checking for web apps in project "${selectedProjectId}"...`);
      const firebaseAppsResult = await execa('firebase', ['apps:list', '--json', '--project', selectedProjectId], { reject: false, stdio: 'pipe' });

      let webAppExists = false;
      if (firebaseAppsResult.exitCode === 0 && firebaseAppsResult.stdout) {
        try {
          const appsResponse = JSON.parse(firebaseAppsResult.stdout);
          const apps = appsResponse.result;
          if (Array.isArray(apps) && apps.some(app => app.platform && app.platform.toUpperCase() === 'WEB')) {
            webAppExists = true;
          }
        } catch (parseError) {
          spinner.fail('Failed to parse Firebase apps list.');
          process.exit(1);
        }
      } else {
        spinner.fail('Failed to fetch Firebase apps.');
        process.exit(1);
      }

      if (!webAppExists) {
        spinner.fail(`No web app found for project "${selectedProjectId}".`);
        console.error(chalk.red('Please add a web app to your Firebase project first.'));
        process.exit(1);
      }
      spinner.succeed('Web app found.');

      // Fetch SDK config
      spinner.start(`Fetching SDK config for project "${selectedProjectId}"...`);
      const sdkConfigResult = await execa('firebase', ['apps:sdkconfig', 'WEB', '--json', '--project', selectedProjectId], { reject: false, stdio: 'pipe' });

      if (sdkConfigResult.exitCode !== 0 || !sdkConfigResult.stdout || sdkConfigResult.stdout.trim() === '') {
        spinner.fail('Failed to fetch Firebase SDK config.');
        console.error(chalk.red('Ensure your selected project has a web app configured.'));
        process.exit(1);
      }

      let sdkConfig;
      try {
        sdkConfig = JSON.parse(sdkConfigResult.stdout);
      } catch (parseError) {
        spinner.fail('Failed to parse Firebase SDK config.');
        process.exit(1);
      }

      const firebaseConfig = sdkConfig.result.sdkConfig;

      if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        spinner.fail('Firebase config is empty or invalid.');
        process.exit(1);
      }

      // Replace Firebase config variables in firebase.config.json
      await replaceInFile(
        path.join(projectPath, 'src', 'config', 'firebase.config.json'),
        {
          '{{apiKey}}': firebaseConfig.apiKey,
          '{{authDomain}}': firebaseConfig.authDomain,
          '{{projectId}}': firebaseConfig.projectId,
          '{{storageBucket}}': firebaseConfig.storageBucket,
          '{{messagingSenderId}}': firebaseConfig.messagingSenderId,
          '{{appId}}': firebaseConfig.appId
        }
      );

      // Create .firebaserc file
      const firebasercContent = {
        projects: {
          default: selectedProjectId
        }
      };
      await fs.writeJson(path.join(projectPath, '.firebaserc'), firebasercContent, { spaces: 2 });
      spinner.succeed('Firebase configuration completed.');

      // 6. Stripe Configuration
      const { stripePublicKey, stripePriceId, stripePrice, stripeSecretKey, stripeEndpointSecret } = await inquirer.prompt([
        {
          type: 'input',
          name: 'stripePublicKey',
          message: 'Enter your Stripe public API key:',
          validate: input => input ? true : 'Stripe public API key is required'
        },
        {
          type: 'input',
          name: 'stripeSecretKey',
          message: 'Enter your Stripe secret API key:',
          validate: input => input ? true : 'Stripe secret API key is required'
        },
        {
          type: 'input',
          name: 'stripeEndpointSecret',
          message: 'Enter your Stripe webhook endpoint secret:',
          validate: input => input ? true : 'Stripe endpoint secret is required'
        },
        {
          type: 'input',
          name: 'stripePriceId',
          message: 'Enter the Stripe price ID for your subscription plan:',
          validate: input => input ? true : 'Price ID is required'
        },
        {
          type: 'number',
          name: 'stripePrice',
          message: 'Enter the price amount (in dollars) for your subscription plan (enter 0 for free plan):',
          validate: input => input >= 0 ? true : 'Price cannot be negative'
        }
      ]);
      const stripeFree = stripePrice === 0;

      // Replace Stripe config variables in both files
      const stripeReplacements = {
        '{{public_api_key}}': stripePublicKey,
        '{{price_id}}': stripePriceId,
        '{{price}}': stripePrice,
        '{{free}}': stripeFree
      };

      await replaceInFile(
        path.join(projectPath, 'src', 'config', 'stripe.config.json'),
        stripeReplacements
      );

      const functionsStripeReplacements = {
        '{{secret_api_key}}': stripeSecretKey,
        '{{end_point_secret}}': stripeEndpointSecret,
        '{{price_id}}': stripePriceId,
        '{{price}}': stripePrice,
        '{{free}}': stripeFree
      };

      await replaceInFile(
        path.join(projectPath, 'functions', 'src', 'config', 'stripe.config.json'),
        functionsStripeReplacements
      );

      spinner.succeed('Stripe configuration completed.');

      // 7. Final Instructions
      console.log(chalk.bold.green(`\nSuccessfully created Fireact app "${projectName}"!`));
      console.log(chalk.yellow('\nTo test your app with Firebase emulators and Stripe:'));
      console.log(`  1. cd ${projectName}`);
      console.log(`  2. npm run build`);
      console.log(`     (This builds both the React app and cloud functions)`);
      console.log(`  3. firebase emulators:start`);
      console.log(`     (This starts the frontend on port 5002 and backend emulators)`);
      console.log(`  4. In a new terminal, set up Stripe webhook:`);
      console.log(`     stripe listen --forward-to http://127.0.0.1:5001/${selectedProjectId}/us-central1/stripeWebhook`);
      console.log(`     (This will generate a new webhook endpoint secret)`);
      console.log(`  5. Copy the webhook endpoint secret and update:`);
      console.log(`     functions/src/config/stripe.config.json`);
      console.log(`  6. Rebuild functions: cd functions && npm run build`);
      console.log(`  7. Your app will be available at http://localhost:5002`);
      console.log(chalk.cyan(`\nYour Firebase project "${selectedProjectId}" is configured and ready!`));
      console.log(chalk.gray('Note: You\'ll need to be logged into Stripe CLI for webhook testing.'));

    } catch (error) {
      spinner.fail('An error occurred during project creation.');
      console.error(chalk.red('Error details:'));
      console.error(error); // Log the entire error object
      console.error(chalk.red('projectPath value:', projectPath)); // Log projectPath for debugging
      process.exit(1);
    }
  });


program.parse(process.argv);
