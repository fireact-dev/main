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

const program = new Command();

program
  .name('create-fireact-app')
  .description('CLI to create a new Fireact application')
  .version('1.0.0');

program
  .argument('<project-name>', 'The name of the project to create')
  .action(async (projectName) => {
    const spinner = ora();

    const projectPath = path.resolve(process.cwd(), projectName);

    // Check if directory already exists
    if (fs.existsSync(projectPath)) {
      console.error(chalk.red(`Error: Directory "${projectName}" already exists.`));
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
      await execa('npm', ['create', 'vite@latest', projectName, '--', '--template', 'react-ts'], { stdio: 'inherit' });
      spinner.succeed('Vite project created successfully.');

      // Change directory to the new project
      process.chdir(projectPath);

      // 3. Install Dependencies with --legacy-peer-deps
      spinner.start('Installing dependencies...');
      // Install core dependencies
      await execa('npm', ['install', '@fireact.dev/core', 'firebase', 'react-router-dom', 'i18next', 'react-i18next', '@headlessui/react', '@heroicons/react', 'tailwindcss@3', 'i18next-browser-languagedetector', '--legacy-peer-deps'], { stdio: 'inherit' });
      // Install dev dependencies
      await execa('npm', ['install', '-D', '@vitejs/plugin-react', '@types/react', '@types/react-dom', 'typescript', 'postcss', 'autoprefixer', '@tailwindcss/postcss', 'eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', '--legacy-peer-deps'], { stdio: 'inherit' });
      spinner.succeed('Dependencies installed successfully.');

      // 4. Generate Configuration Files and Structure
      spinner.start('Generating configuration files and project structure...');
      await createTemplateFiles(projectPath);
      spinner.succeed('Configuration files generated successfully.');

      // --- Phase 2: Interactive Firebase Integration ---

      // 5. Fetch Firebase Projects and Prompt for Selection
      spinner.start('Fetching your Firebase projects...');
      const firebaseProjectsResult = await execa('firebase', ['projects:list', '--json'], { reject: false, stdio: 'pipe' });

      let projects = [];
      if (firebaseProjectsResult.exitCode === 0 && firebaseProjectsResult.stdout) {
        try {
          const response = JSON.parse(firebaseProjectsResult.stdout);
          // The actual projects array is under the 'result' key
          projects = response.result;
          if (!Array.isArray(projects)) {
            // If output is not an array, treat as an error
            throw new Error('Firebase projects list is not in the expected array format.');
          }
        } catch (parseError) {
          spinner.fail('Failed to parse Firebase projects list.');
          console.error(chalk.red('Ensure you are logged in to Firebase. Run: firebase login'));
          console.error(chalk.red('Firebase CLI output:', firebaseProjectsResult.stdout));
          process.exit(1);
        }
      } else {
        spinner.fail('Failed to fetch Firebase projects.');
        console.error(chalk.red('Please ensure you are logged in to Firebase. Run: firebase login'));
        console.error(chalk.red('Firebase CLI exit code:', firebaseProjectsResult.exitCode));
        console.error(chalk.red('Firebase CLI output:', firebaseProjectsResult.stdout));
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
          console.log('Firebase Apps Response:', JSON.stringify(appsResponse, null, 2)); // Log the full response for debugging
          // The actual apps array is under the 'result' key
          const apps = appsResponse.result;
          console.log('Parsed Apps:', JSON.stringify(apps, null, 2)); // Log parsed apps for debugging
          if (Array.isArray(apps) && apps.some(app => app.platform && app.platform.toUpperCase() === 'WEB')) { // Use toUpperCase for case-insensitive comparison
            webAppExists = true;
          }
        } catch (parseError) {
          spinner.fail('Failed to parse Firebase apps list.');
          console.error(chalk.red('Firebase CLI output:', firebaseAppsResult.stdout));
          process.exit(1);
        }
      } else {
        spinner.fail('Failed to fetch Firebase apps.');
        console.error(chalk.red('Firebase CLI exit code:', firebaseAppsResult.exitCode));
        console.error(chalk.red('Firebase CLI output:', firebaseAppsResult.stdout));
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

      // Log the raw SDK config result for debugging
      console.log('Raw SDK config result:', sdkConfigResult.stdout);

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
        console.error(chalk.red('Error parsing SDK config:', parseError));
        console.error(chalk.red('Raw SDK config output:', sdkConfigResult.stdout));
        process.exit(1);
      }

      // Extract firebaseConfig from the correct path in the SDK config result
      const firebaseConfig = sdkConfig.result.sdkConfig;

      // Log the fetched firebaseConfig for debugging
      console.log('Fetched firebaseConfig:', JSON.stringify(firebaseConfig, null, 2));

      // Populate src/config.json with fetched Firebase config
      const configJsonPath = path.join(projectPath, 'src/config.json');
      try {
        // Check if firebaseConfig is valid before proceeding
        if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
          throw new Error('Firebase config is empty or invalid.');
        }

        const currentConfig = await fs.readJson(configJsonPath);
        if (!currentConfig) {
          throw new Error('Failed to read config.json');
        }
        
        currentConfig.firebase = firebaseConfig;
        await fs.writeJson(configJsonPath, currentConfig, { spaces: 2 });
        
        // Verify the config was written
        const writtenConfig = await fs.readJson(configJsonPath);
        if (!writtenConfig.firebase || Object.keys(writtenConfig.firebase).length === 0) {
          throw new Error('Firebase config not written to config.json or is empty.');
        }
        
        spinner.succeed('Firebase SDK config fetched and applied.');
        console.log(chalk.green('Firebase config successfully written to config.json'));
      } catch (error) {
        spinner.fail('Failed to update config.json with Firebase config');
        console.error(chalk.red('Error details:'), error);
        console.error(chalk.yellow('Please manually add the Firebase config to src/config.json:'));
        console.log(JSON.stringify({ firebase: firebaseConfig }, null, 2));
        process.exit(1);
      }

      // Create .firebaserc file
      const firebasercContent = {
        projects: {
          default: selectedProjectId
        }
      };
      await fs.writeJson(path.join(projectPath, '.firebaserc'), firebasercContent, { spaces: 2 }); // Use projectPath here
      spinner.succeed('.firebaserc file created.');

      // 6. Final Instructions
      console.log(chalk.bold.green(`\nSuccessfully created Fireact app "${projectName}"!`));
      console.log(chalk.yellow('Next steps:'));
      console.log(`  1. cd ${projectName}`);
      console.log(`  2. Run 'npm run dev' to start the development server.`);
      console.log(`  3. Your Firebase project "${selectedProjectId}" is now configured.`);

    } catch (error) {
      spinner.fail('An error occurred during project creation.');
      console.error(chalk.red('Error details:'));
      console.error(error); // Log the entire error object
      console.error(chalk.red('projectPath value:', projectPath)); // Log projectPath for debugging
      process.exit(1);
    }
  });

async function createTemplateFiles(projectRoot) {
  let spinner;
  const githubRawUrl = 'https://raw.githubusercontent.com/fireact-dev/core-demo/main';
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
      const filesToDownload = [
      { 
        url: `${githubRawUrl}/eslint.config.js`,
        path: path.join(projectRoot, 'eslint.config.js')
      },
      { 
        url: `${githubRawUrl}/firebase.json`,
        path: path.join(projectRoot, 'firebase.json')
      },
      { 
        url: `${githubRawUrl}/firestore.indexes.json`,
        path: path.join(projectRoot, 'firestore.indexes.json')
      },
      { 
        url: `${githubRawUrl}/firestore.rules`,
        path: path.join(projectRoot, 'firestore.rules')
      },
      {
        url: `${githubRawUrl}/postcss.config.js`,
        path: path.join(projectRoot, 'postcss.config.js')
      },
      { 
        url: `${githubRawUrl}/tailwind.config.js`,
        path: path.join(projectRoot, 'tailwind.config.js')
      },
      {
        url: `${githubRawUrl}/src/index.css`,
        path: path.join(projectRoot, 'src/index.css')
      },
      {
        url: `${githubRawUrl}/src/App.tsx`,
        path: path.join(projectRoot, 'src/App.tsx')
      }
    ];

    for (const file of filesToDownload) {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error(`Failed to fetch ${path.basename(file.path)}`);
      let content = await response.text();
      await fs.writeFile(file.path, content);
    }

    spinner.succeed('Core configuration files downloaded successfully.');
  } catch (error) {
    spinner.fail('Failed to download core configuration files');
    console.error(chalk.red('Error details:'), error);
    throw error;
  }

  // Create i18n directory and copy language files
  const i18nLocalesPath = path.join(projectRoot, 'src/i18n/locales');
  await fs.ensureDir(i18nLocalesPath);

  // Download locale files from core repository
  spinner = ora('Downloading locale files from core repository...').start();
  try {
    const locales = ['en', 'zh'];
    for (const locale of locales) {
      const url = `${githubRawUrl}/src/i18n/locales/${locale}.ts`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${locale}.ts`);
      const content = await response.text();
      await fs.writeFile(path.join(i18nLocalesPath, `${locale}.ts`), content);
    }
    spinner.succeed('Locale files downloaded successfully.');
  } catch (error) {
    spinner.fail('Failed to download locale files');
    console.error(chalk.red('Error details:'), error);
    throw error;
  }
}

program.parse(process.argv);
