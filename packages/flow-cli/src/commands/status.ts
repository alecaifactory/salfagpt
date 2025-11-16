import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';
import axios from 'axios';
import { requireAuth, getConfig } from '../lib/config';

export const statusCommand = new Command('status')
  .description('Show your usage and quota status')
  .action(async () => {
    console.log(chalk.bold.blue('\n📊 Usage & Quota Status\n'));
    
    try {
      const credentials = requireAuth();
      const config = getConfig();
      
      const spinner = ora('Loading organization info...').start();
      
      // Get organization info
      const response = await axios.get(
        `${config.apiUrl}/api/v1/organization`,
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
          },
        }
      );
      
      spinner.succeed('Organization info loaded');
      
      const org = response.data;
      
      // Usage table
      const usageTable = new Table({
        head: [chalk.bold('Metric'), chalk.bold('Used'), chalk.bold('Limit'), chalk.bold('Remaining')],
        colWidths: [25, 15, 15, 15],
      });
      
      const monthlyPercent = (org.usage.currentMonthRequests / org.quotas.monthlyRequests * 100).toFixed(1);
      const monthlyColor = parseFloat(monthlyPercent) > 80 ? 'red' : parseFloat(monthlyPercent) > 50 ? 'yellow' : 'green';
      
      usageTable.push(
        [
          'Monthly Requests',
          org.usage.currentMonthRequests.toLocaleString(),
          org.quotas.monthlyRequests.toLocaleString(),
          chalk[monthlyColor](`${org.quotas.monthlyRequests - org.usage.currentMonthRequests} (${monthlyPercent}%)`)
        ],
        [
          'Daily Requests',
          org.usage.currentDayRequests.toLocaleString(),
          org.quotas.dailyRequests.toLocaleString(),
          (org.quotas.dailyRequests - org.usage.currentDayRequests).toLocaleString()
        ],
        [
          'Documents Processed',
          org.usage.totalDocumentsProcessed.toLocaleString(),
          '∞',
          '∞'
        ],
        [
          'Total Cost',
          `$${org.usage.totalCost.toFixed(2)}`,
          'N/A',
          'N/A'
        ]
      );
      
      console.log(usageTable.toString());
      
      // Status indicators
      console.log();
      if (org.status === 'trial' && org.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(chalk.yellow(`⏰ Trial ends in ${daysLeft} days (${new Date(org.trialEndsAt).toLocaleDateString()})`));
        console.log(chalk.gray('   Upgrade to continue: https://api.flow.ai/portal/billing\n'));
      } else {
        console.log(chalk.green(`✓ Status: ${org.status.toUpperCase()}`));
      }
      
      // Helpful tips
      if (parseFloat(monthlyPercent) > 80) {
        console.log(chalk.yellow('\n⚠️  You are using ' + monthlyPercent + '% of your monthly quota'));
        console.log(chalk.gray('   Consider upgrading your tier\n'));
      }
      
    } catch (error: any) {
      ora().fail('Failed to load status');
      console.log(chalk.red(`\n❌ ${error.response?.data?.error?.message || error.message}\n`));
    }
  });

