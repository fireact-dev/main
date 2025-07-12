import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';

export async function createProject(projectName) {
  const spinner = ora();
  const projectPath = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    throw new Error(`Directory "${projectName}" already exists.`);
  }

  // Create Vite project
  spinner.start('Creating Vite project...');
  await execa('npm', ['create', 'vite@latest', projectName, '--', '--template', 'react-ts'], { stdio: 'inherit' });
  spinner.succeed('Vite project created successfully.');

  return projectPath;
}

export async function installCoreDependencies(projectPath) {
  const spinner = ora('Installing dependencies...').start();
  process.chdir(projectPath);
  
  // Install core dependencies
  await execa('npm', ['install', '@fireact.dev/core', 'firebase', 'react-router-dom', 'i18next', 'react-i18next', '@headlessui/react', '@heroicons/react', 'tailwindcss@3', 'i18next-browser-languagedetector', '--legacy-peer-deps'], { stdio: 'inherit' });
  
  // Install dev dependencies
  await execa('npm', ['install', '-D', '@vitejs/plugin-react', '@types/react', '@types/react-dom', 'typescript', 'postcss', 'autoprefixer', '@tailwindcss/postcss', 'eslint', '@eslint/js', 'eslint-plugin-react-hooks', 'eslint-plugin-react-refresh', 'globals', 'typescript-eslint', '--legacy-peer-deps'], { stdio: 'inherit' });
  
  spinner.succeed('Dependencies installed successfully.');
}

export async function configureFirebase(projectPath) {
  const spinner = ora('Checking for Firebase CLI...').start();
  const firebaseCheck = await execa('command', ['-v', 'firebase'], { reject: false });
  if (firebaseCheck.exitCode !== 0) {
    throw new Error('Firebase CLI not found. Please install: npm install -g firebase-tools');
  }
  spinner.succeed('Firebase CLI found.');

  // Fetch Firebase projects
  spinner.start('Fetching your Firebase projects...');
  const firebaseProjectsResult = await execa('firebase', ['projects:list', '--json'], { reject: false, stdio: 'pipe' });

  let projects = [];
  if (firebaseProjectsResult.exitCode === 0 && firebaseProjectsResult.stdout) {
    try {
      const response = JSON.parse(firebaseProjectsResult.stdout);
      projects = response.result;
      if (!Array.isArray(projects)) {
        throw new Error('Firebase projects list is not in expected format');
      }
    } catch (error) {
      throw new Error('Failed to parse Firebase projects list');
    }
  } else {
    throw new Error('Failed to fetch Firebase projects');
  }

  if (projects.length === 0) {
    throw new Error('No Firebase projects found');
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

  // Fetch SDK config
  spinner.start(`Fetching SDK config for project "${selectedProjectId}"...`);
  const sdkConfigResult = await execa('firebase', ['apps:sdkconfig', 'WEB', '--json', '--project', selectedProjectId], { reject: false, stdio: 'pipe' });

  if (sdkConfigResult.exitCode !== 0 || !sdkConfigResult.stdout || sdkConfigResult.stdout.trim() === '') {
    throw new Error('Failed to fetch Firebase SDK config');
  }

  let sdkConfig;
  try {
    sdkConfig = JSON.parse(sdkConfigResult.stdout);
  } catch (error) {
    throw new Error('Failed to parse Firebase SDK config');
  }

  const firebaseConfig = sdkConfig.result.sdkConfig;
  return { projectId: selectedProjectId, firebaseConfig };
}

export async function createTemplateFiles(projectRoot, templateDir) {
  const spinner = ora('Generating configuration files...').start();
  
  const configJsonContent = `{
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
}`;

  await fs.writeFile(path.join(projectRoot, 'src/config.json'), configJsonContent);

  // Copy template files
  const filesToCopy = [
    { src: path.join(templateDir, 'eslint.config.js'), dest: path.join(projectRoot, 'eslint.config.js') },
    { src: path.join(templateDir, 'firebase.json'), dest: path.join(projectRoot, 'firebase.json') },
    { src: path.join(templateDir, 'firestore.indexes.json'), dest: path.join(projectRoot, 'firestore.indexes.json') },
    { src: path.join(templateDir, 'firestore.rules'), dest: path.join(projectRoot, 'firestore.rules') },
    { src: path.join(templateDir, 'postcss.config.js'), dest: path.join(projectRoot, 'postcss.config.js') },
    { src: path.join(templateDir, 'tailwind.config.js'), dest: path.join(projectRoot, 'tailwind.config.js') },
    { src: path.join(templateDir, 'src', 'index.css'), dest: path.join(projectRoot, 'src', 'index.css') },
    { src: path.join(templateDir, 'src', 'App.tsx'), dest: path.join(projectRoot, 'src', 'App.tsx') }
  ];

  for (const file of filesToCopy) {
    await fs.copy(file.src, file.dest);
  }

  // Create i18n directory structure
  const i18nPath = path.join(projectRoot, 'src/i18n');
  const i18nLocalesPath = path.join(i18nPath, 'locales');
  await fs.ensureDir(i18nLocalesPath);

  // Copy locale files
  const locales = ['en', 'zh'];
  for (const locale of locales) {
    const sourcePath = path.join(templateDir, 'src', 'i18n', 'locales', `${locale}.ts`);
    if (fs.existsSync(sourcePath)) {
      await fs.copy(sourcePath, path.join(i18nLocalesPath, `${locale}.ts`));
    }
  }

  spinner.succeed('Configuration files generated successfully.');
}
