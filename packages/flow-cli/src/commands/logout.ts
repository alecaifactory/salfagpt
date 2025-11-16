import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { clearCredentials, hasCredentials } from '../lib/config';

export const logoutCommand = new Command('logout')
  .description('Clear your Flow API credentials')
  .action(async () => {
    try {
      if (!hasCredentials()) {
        console.log(chalk.yellow('\n⚠️  You are not logged in\n'));
        return;
      }
      
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to logout?',
        default: false,
      }]);
      
      if (!confirm) {
        console.log(chalk.gray('\n✓ Cancelled\n'));
        return;
      }
      
      clearCredentials();
      console.log(chalk.green('\n✓ Logged out successfully\n'));
      console.log(chalk.gray('To login again: flow-cli login <invitation-code>\n'));
      
    } catch (error) {
      console.log(chalk.red(`\n❌ ${error instanceof Error ? error.message : 'Error'}\n`));
    }
  });

