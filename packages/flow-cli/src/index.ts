#!/usr/bin/env node

/**
 * Flow CLI - SuperAdmin & Developer Read-Only CLI
 * 
 * Version: 0.1.0
 * Purpose: Secure CLI for viewing domain usage statistics
 * 
 * Features (v0.1.0):
 * - SuperAdmin authentication with API keys
 * - Read-only access to domain usage stats
 * - Secure configuration storage
 * - Beautiful terminal output
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from './commands/login.js';
import { usageStatsCommand } from './commands/usage-stats.js';
import { readConfig, getConfigPath, clearConfig } from './config.js';

const program = new Command();

program
  .name('flow')
  .description('Flow AI Platform CLI - SuperAdmin & Developer Tools')
  .version('0.1.0');

/**
 * Login command
 */
program
  .command('login <api-key>')
  .description('Authenticate with Flow platform API key')
  .option('-e, --endpoint <url>', 'API endpoint URL (default: http://localhost:3000)')
  .action(loginCommand);

/**
 * Logout command
 */
program
  .command('logout')
  .description('Clear stored credentials')
  .action(() => {
    clearConfig();
    console.log(chalk.green('✅ Logged out successfully'));
    console.log(chalk.dim(`Config cleared: ${getConfigPath()}`));
  });

/**
 * Usage stats command
 */
program
  .command('usage-stats <domain>')
  .description('View domain usage statistics (read-only)')
  .option('-d, --days <number>', 'Number of days to analyze', '7')
  .option('-f, --format <format>', 'Output format (table|json)', 'table')
  .action((domain, options) => {
    usageStatsCommand(domain, {
      days: parseInt(options.days),
      format: options.format,
    });
  });

/**
 * Status command
 */
program
  .command('status')
  .description('Show authentication status')
  .action(() => {
    const config = readConfig();
    
    console.log(chalk.blue('🔍 Flow CLI Status\n'));
    
    if (config.apiKey) {
      console.log(chalk.green('✅ Authenticated'));
      console.log(chalk.dim(`User: ${config.userEmail || 'Unknown'}`));
      console.log(chalk.dim(`Role: ${config.userRole || 'Unknown'}`));
      console.log(chalk.dim(`Endpoint: ${config.apiEndpoint}`));
    } else {
      console.log(chalk.yellow('⚠️  Not authenticated'));
      console.log(chalk.dim('\nRun: flow login <your-api-key>'));
    }
    
    console.log(chalk.dim(`\nConfig: ${getConfigPath()}`));
  });

/**
 * Config command
 */
program
  .command('config')
  .description('Show configuration file location')
  .action(() => {
    console.log(chalk.blue('⚙️  Flow CLI Configuration\n'));
    console.log(chalk.dim(`Location: ${getConfigPath()}`));
    
    const config = readConfig();
    console.log(chalk.dim('\nCurrent settings:'));
    console.log(chalk.dim(`  Endpoint: ${config.apiEndpoint}`));
    console.log(chalk.dim(`  Authenticated: ${config.apiKey ? 'Yes' : 'No'}`));
  });

// Parse arguments
program.parse();









