import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { requireAuth } from '../lib/config';

export const whoamiCommand = new Command('whoami')
  .description('Show your current Flow API organization')
  .action(async () => {
    try {
      const credentials = requireAuth();
      
      console.log(
        boxen(
          chalk.bold('Your Flow API Organization\n\n') +
          chalk.white('Name: ') + chalk.bold.blue(credentials.organizationName) + '\n' +
          chalk.white('Domain: ') + chalk.bold(credentials.domain) + '\n' +
          chalk.white('Tier: ') + chalk.bold.cyan(credentials.tier.toUpperCase()) + '\n' +
          chalk.white('Since: ') + chalk.gray(new Date(credentials.createdAt).toLocaleDateString()),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue',
          }
        )
      );
      
    } catch (error) {
      console.log(chalk.red(`\n❌ ${error instanceof Error ? error.message : 'Error'}\n`));
    }
  });

