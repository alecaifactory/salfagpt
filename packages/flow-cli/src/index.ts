#!/usr/bin/env node

/**
 * Flow CLI - Beautiful Developer Experience
 * 
 * Commands:
 * - login [code]  : Authenticate with Flow API
 * - logout        : Clear credentials
 * - whoami        : Show current organization
 * - extract <file>: Upload and extract document
 * - status        : Show usage and quota
 */

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { loginCommand } from './commands/login';
import { logoutCommand } from './commands/logout';
import { whoamiCommand } from './commands/whoami';
import { extractCommand } from './commands/extract';
import { statusCommand } from './commands/status';

const program = new Command();

// Welcome banner
console.log(
  boxen(
    chalk.bold.blue('Flow Vision API CLI') + '\n' +
    chalk.gray('Powerful document extraction at your fingertips'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'blue',
    }
  )
);

program
  .name('flow-cli')
  .description('Flow Vision API CLI - Extract intelligence from documents')
  .version('0.1.0');

// Register commands
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(extractCommand);
program.addCommand(statusCommand);

// Parse and execute
program.parse();
