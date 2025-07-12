#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createProject,
  installCoreDependencies,
  configureFirebase,
  createTemplateFiles
} from '../create-fireact-app/lib/core.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('create-fireact-saas-app')
  .description('CLI to create a new Fireact SaaS application')
  .version('1.0.0');

program
  .argument('<project-name>', 'The name of the project to create')
  .action(async (projectName) => {
    const spinner = ora();
    
    try {
      // 1. Create base project using core functions
      const projectPath = await createProject(projectName);
      
      // 2. Install core dependencies
      await installCoreDependencies(projectPath);
      
      // 3. Create template files
      const templateDir = path.join(__dirname, 'templates');
      await createTemplateFiles(projectPath, templateDir);
      
      // 4. Configure Firebase
      const { projectId, firebaseConfig } = await configureFirebase(projectPath);
      
      // 5. Install SaaS-specific dependencies
      spinner.start('Installing SaaS dependencies...');
      process.chdir(projectPath);
      await execa('npm', ['install', '@stripe/stripe-js', '@stripe/firestore-stripe-payments', 'react-stripe-js', '--legacy-peer-deps'], { stdio: 'inherit' });
      
      // Install cloud functions dependencies
      await execa('npm', ['install', '-D', '@types/stripe', 'stripe', 'firebase-functions', 'firebase-admin', '--legacy-peer-deps'], { stdio: 'inherit' });
      spinner.succeed('SaaS dependencies installed successfully.');
      
      // 6. Configure Stripe
      const { stripeConfig } = await inquirer.prompt([
        {
          type: 'input',
          name: 'stripeConfig.publishableKey',
          message: 'Enter your Stripe publishable key:',
          validate: input => input ? true : 'Publishable key is required'
        },
        {
          type: 'input',
          name: 'stripeConfig.priceId',
          message: 'Enter your Stripe price ID:',
          validate: input => input ? true : 'Price ID is required'
        },
        {
          type: 'input',
          name: 'stripeConfig.secretKey',
          message: 'Enter your Stripe secret key:',
          validate: input => input ? true : 'Secret key is required'
        }
      ]);
      
      // 7. Update config with Firebase and Stripe settings
      const configPath = path.join(projectPath, 'src/config.json');
      const config = await fs.readJson(configPath);
      
      config.firebase = firebaseConfig;
      config.stripe = {
        publishableKey: stripeConfig.publishableKey,
        priceId: stripeConfig.priceId
      };
      
      await fs.writeJson(configPath, config, { spaces: 2 });
      
      // 8. Create .firebaserc
      await fs.writeJson(
        path.join(projectPath, '.firebaserc'),
        { projects: { default: projectId } },
        { spaces: 2 }
      );
      
      // 9. Create Stripe config for cloud functions
      await fs.writeJson(
        path.join(projectPath, 'functions/.runtimeconfig.json'),
        {
          stripe: {
            secret_key: stripeConfig.secretKey
          }
        },
        { spaces: 2 }
      );
      
      // 10. Copy SaaS-specific files from saas-demo
      spinner.start('Copying SaaS template files...');
      try {
        const saasDemoPath = path.join(__dirname, '../../saas-demo');
        
        // Copy functions
        await fs.copy(
          path.join(saasDemoPath, 'functions/src/index.ts'),
          path.join(projectPath, 'functions/src/index.ts')
        );

        // Copy components
        await fs.copy(
          path.join(saasDemoPath, 'src/components/Subscription.tsx'),
          path.join(projectPath, 'src/components/Subscription.tsx')
        );

        // Copy App.tsx
        await fs.copy(
          path.join(saasDemoPath, 'src/App.tsx'),
          path.join(projectPath, 'src/App.tsx')
        );

        spinner.succeed('SaaS template files copied successfully.');
      } catch (error) {
        spinner.fail('Failed to copy SaaS template files');
        throw error;
      }
      
      // Success message
      console.log(chalk.bold.green(`\nSuccessfully created Fireact SaaS app "${projectName}"!`));
      console.log(chalk.yellow('Next steps:'));
      console.log(`  1. cd ${projectName}`);
      console.log(`  2. Run 'npm run dev' to start the development server`);
      console.log(`  3. Deploy cloud functions: 'cd functions && npm run deploy'`);
      
    } catch (error) {
      spinner.fail('Error creating SaaS project');
      console.error(chalk.red('Error details:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
