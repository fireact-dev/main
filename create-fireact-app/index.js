#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  createProject,
  installCoreDependencies,
  configureFirebase,
  createTemplateFiles
} from './lib/core.js';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('create-fireact-app')
  .description('CLI to create a new Fireact application')
  .version('1.0.0');

program
  .argument('<project-name>', 'The name of the project to create')
  .action(async (projectName) => {
    try {
      // 1. Create base project
      const projectPath = await createProject(projectName);
      
      // 2. Install core dependencies
      await installCoreDependencies(projectPath);
      
      // 3. Create template files
      const templateDir = path.join(__dirname, 'templates');
      await createTemplateFiles(projectPath, templateDir);
      
      // 4. Configure Firebase
      const { projectId, firebaseConfig } = await configureFirebase(projectPath);
      
      // Update config.json with Firebase config
      const configPath = path.join(projectPath, 'src/config.json');
      const config = await fs.readJson(configPath);
      config.firebase = firebaseConfig;
      await fs.writeJson(configPath, config, { spaces: 2 });
      
      // Create .firebaserc
      await fs.writeJson(
        path.join(projectPath, '.firebaserc'),
        { projects: { default: projectId } },
        { spaces: 2 }
      );
      
      // Success message
      console.log(chalk.bold.green(`\nSuccessfully created Fireact app "${projectName}"!`));
      console.log(chalk.yellow('Next steps:'));
      console.log(`  1. cd ${projectName}`);
      console.log(`  2. Run 'npm run dev' to start the development server.`);
      console.log(`  3. Your Firebase project "${projectId}" is now configured.`);
    } catch (error) {
      console.error(chalk.red('Error creating project:'), error.message);
      process.exit(1);
    }
  });

async function createTemplateFiles(projectRoot) {
  let spinner;
  const configJsonContent = `
{
  "name": "My SaaS",
  "firebase": {
    "apiKey": "YOUR_API_KEY_HERE",
    "authDomain": "YOUR_PROJECT_ID.firebaseapp.com",
    "projectId": "YOUR_PROJECT_ID",
    "storageBucket": "YOUR_PROJECT_ID.appspot.com",
    "messagingSenderId": "YOUR_MESSAGING_SENDER_ID",
    "appId": "YOUR_APP_ID"
  },
  "pages": {
    "home": "/",
    "dashboard": "/dashboard",
    "profile": "/profile",
    "editName": "/edit-name",
    "editEmail": "/edit-email",
    "changePassword": "/change-password",
    "deleteAccount": "/delete-account",
    "signIn": "/signin",
    "signUp": "/signup",
    "resetPassword": "/reset-password",
    "firebaseActions": "/auth/action"
  },
  "socialLogin": {
    "google": false,
    "microsoft": false,
    "facebook": false,
    "apple": false,
    "github": false,
    "twitter": false,
    "yahoo": false
  },
  "emulators": {
    "enabled": false,
    "host": "localhost",
    "ports": {
      "auth": 9099,
      "firestore": 8080,
      "functions": 5001,
      "hosting": 5002
    }
  }
}
`;

  // Write config.json
  await fs.writeFile(path.join(projectRoot, 'src/config.json'), configJsonContent);

  // Download core configuration files from GitHub
  spinner = ora('Downloading core configuration files...').start();
  try {
    // Download and save configuration files exactly as they are from core-demo
      const filesToCopy = [
        { 
          src: path.join(__dirname, 'templates', 'eslint.config.js'),
          dest: path.join(projectRoot, 'eslint.config.js')
        },
        { 
          src: path.join(__dirname, 'templates', 'firebase.json'),
          dest: path.join(projectRoot, 'firebase.json')
        },
        { 
          src: path.join(__dirname, 'templates', 'firestore.indexes.json'),
          dest: path.join(projectRoot, 'firestore.indexes.json')
        },
        { 
          src: path.join(__dirname, 'templates', 'firestore.rules'),
          dest: path.join(projectRoot, 'firestore.rules')
        },
        {
          src: path.join(__dirname, 'templates', 'postcss.config.js'),
          dest: path.join(projectRoot, 'postcss.config.js')
        },
        { 
          src: path.join(__dirname, 'templates', 'tailwind.config.js'),
          dest: path.join(projectRoot, 'tailwind.config.js')
        },
        {
          src: path.join(__dirname, 'templates', 'src', 'index.css'),
          dest: path.join(projectRoot, 'src', 'index.css')
        },
        {
          src: path.join(__dirname, 'templates', 'src', 'App.tsx'),
          dest: path.join(projectRoot, 'src', 'App.tsx')
        }
      ];

      for (const file of filesToCopy) {
        await fs.copy(file.src, file.dest);
      }

    spinner.succeed('Core configuration files downloaded successfully.');
  } catch (error) {
    spinner.fail('Failed to download core configuration files');
    console.error(chalk.red('Error details:'), error);
    throw error;
  }

  // Create i18n directory structure
  const i18nPath = path.join(projectRoot, 'src/i18n');
  const i18nLocalesPath = path.join(i18nPath, 'locales');
  await fs.ensureDir(i18nLocalesPath);

  // Copy locale files from templates
  spinner = ora('Copying locale files...').start();
  try {
    const locales = ['en', 'zh'];
    for (const locale of locales) {
      const sourcePath = path.join(__dirname, 'templates', 'src', 'i18n', 'locales', `${locale}.ts`);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Locale file not found: ${sourcePath}`);
      }
      await fs.copy(
        sourcePath,
        path.join(i18nLocalesPath, `${locale}.ts`)
      );
    }
    spinner.succeed('Locale files copied successfully.');
  } catch (error) {
    spinner.fail('Failed to download locale files');
    console.error(chalk.red('Error details:'), error);
    throw error;
  }
}

program.parse(process.argv);
