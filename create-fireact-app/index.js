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
      await execa('npm', ['install', '@fireact.dev/core', 'firebase', 'react-router-dom', 'i18next', 'react-i18next', '@headlessui/react', '@heroicons/react', 'tailwindcss', 'i18next-browser-languagedetector', '--legacy-peer-deps'], { stdio: 'inherit' });
      await execa('npm', ['install', '-D', 'postcss', 'autoprefixer', '--legacy-peer-deps'], { stdio: 'inherit' });
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

      if (sdkConfigResult.exitCode !== 0 || !sdkConfigResult.stdout || sdkConfigResult.stdout.trim() === '') {
        spinner.fail('Failed to fetch Firebase SDK config.');
        console.error(chalk.red('Ensure your selected project has a web app configured.'));
        process.exit(1);
      }

      const sdkConfig = JSON.parse(sdkConfigResult.stdout);
      const firebaseConfig = sdkConfig.web; // Assuming 'web' key contains the config

      // Populate src/config.json with fetched Firebase config
      const configJsonPath = path.join(projectPath, 'src/config.json'); // Use projectPath here
      const currentConfig = await fs.readJson(configJsonPath);
      currentConfig.firebase = firebaseConfig;
      await fs.writeJson(configJsonPath, currentConfig, { spaces: 2 });
      spinner.succeed('Firebase SDK config fetched and applied.');

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
  const tailwindConfigContent = `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@fireact.dev/core/dist/**/*.{js,mjs}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;

  const postcssConfigContent = `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

  const indexCssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  const appTsxContent = `
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  AuthProvider,
  ConfigProvider,
  LoadingProvider,
  PublicLayout,
  AuthenticatedLayout,
  SignIn,
  SignUp,
  ResetPassword,
  Dashboard,
  Profile,
  EditName,
  EditEmail,
  ChangePassword,
  DeleteAccount,
  DesktopMenuItems,
  MobileMenuItems,
  Logo,
  FirebaseAuthActions
} from '@fireact.dev/core';
import config from './config.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './i18n/locales/en';
import zh from './i18n/locales/zh';

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      zh: {
        translation: zh
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

function App() {
  return (
    <Router>
      <ConfigProvider config={config}>
        <AuthProvider>
          <LoadingProvider>
            <Routes>
              <Route element={
                <AuthenticatedLayout
                  desktopMenuItems={<DesktopMenuItems />}
                  mobileMenuItems={<MobileMenuItems />}
                  logo={<Logo className="w-10 h-10" />}
                />
              }>
                <Route path={config.pages.home} element={<Navigate to={config.pages.dashboard} />} />
                <Route path={config.pages.dashboard} element={<Dashboard />} />
                <Route path={config.pages.profile} element={<Profile />} />
                <Route path={config.pages.editName} element={<EditName />} />
                <Route path={config.pages.editEmail} element={<EditEmail />} />
                <Route path={config.pages.changePassword} element={<ChangePassword />} />
                <Route path={config.pages.deleteAccount} element={<DeleteAccount />} />
              </Route>
              <Route element={<PublicLayout logo={<Logo className="w-20 h-20" />} />}>
                <Route path={config.pages.signIn} element={<SignIn />} />
                <Route path={config.pages.signUp} element={<SignUp />} />
                <Route path={config.pages.resetPassword} element={<ResetPassword />} />
                <Route path={config.pages.firebaseActions} element={<FirebaseAuthActions />} />
              </Route>
            </Routes>
          </LoadingProvider>
        </AuthProvider>
      </ConfigProvider>
    </Router>
  );
}

export default App;
`;

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

  // Write config files
  await fs.writeFile(path.join(projectRoot, 'tailwind.config.js'), tailwindConfigContent);
  await fs.writeFile(path.join(projectRoot, 'postcss.config.js'), postcssConfigContent);
  await fs.writeFile(path.join(projectRoot, 'src/index.css'), indexCssContent);
  await fs.writeFile(path.join(projectRoot, 'src/App.tsx'), appTsxContent);
  await fs.writeFile(path.join(projectRoot, 'src/config.json'), configJsonContent);

  // Create i18n directory and copy language files
  const i18nLocalesPath = path.join(projectRoot, 'src/i18n/locales');
  await fs.ensureDir(i18nLocalesPath);

  // For now, we'll use placeholder content for language files.
  // In a real CLI, these would be bundled with the CLI package.
  const enLocaleContent = `{ "greeting": "Hello" }`;
  const zhLocaleContent = `{ "greeting": "你好" }`;

  await fs.writeFile(path.join(i18nLocalesPath, 'en.json'), enLocaleContent);
  await fs.writeFile(path.join(i18nLocalesPath, 'zh.json'), zhLocaleContent);
}

program.parse(process.argv);
