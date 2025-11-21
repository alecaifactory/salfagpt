/**
 * Flow CLI Usage Stats Command
 * 
 * Read-only command to view domain usage statistics
 */

import chalk from 'chalk';
import { table } from 'table';
import ora from 'ora';
import { FlowAPIClient } from '../api-client.js';
import type { DomainUsageStats } from '../types.js';

interface UsageStatsOptions {
  days?: number;
  format?: 'table' | 'json';
  endpoint?: string;
}

export async function usageStatsCommand(
  domain: string,
  options: UsageStatsOptions = {}
): Promise<void> {
  const client = new FlowAPIClient();
  
  // Check authentication
  if (!client.isAuthenticated()) {
    console.log(chalk.red('❌ Not authenticated'));
    console.log(chalk.dim('\nRun: flow login <your-api-key>'));
    process.exit(1);
  }
  
  // Parse domain
  const cleanDomain = domain.startsWith('@') ? domain : `@${domain}`;
  const days = options.days || 7;
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Show loading
  const spinner = ora({
    text: `Fetching usage stats for ${chalk.cyan(cleanDomain)} (last ${days} days)...`,
    color: 'blue',
  }).start();
  
  try {
    // Fetch stats
    const result = await client.getDomainUsageStats(
      cleanDomain,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    spinner.stop();
    
    if (!result.success) {
      console.log(chalk.red(`❌ Failed: ${result.error}`));
      process.exit(1);
    }
    
    const stats = result.data as DomainUsageStats;
    
    // Display based on format
    if (options.format === 'json') {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }
    
    // Default: Table format
    displayStatsTable(stats, cleanDomain, days);
    
  } catch (error) {
    spinner.stop();
    console.log(chalk.red(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

/**
 * Display stats as formatted table
 */
function displayStatsTable(stats: DomainUsageStats, domain: string, days: number): void {
  console.log(chalk.blue.bold(`\n📊 Usage Statistics: ${domain}`));
  console.log(chalk.dim(`Period: Last ${days} days (${formatDate(stats.period.start)} - ${formatDate(stats.period.end)})\n`));
  
  // User Stats
  console.log(chalk.cyan.bold('👥 Users'));
  const userTable = table([
    [chalk.bold('Metric'), chalk.bold('Value')],
    ['Total Users', stats.totalUsers.toString()],
    ['Active Users', `${stats.activeUsers} (${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%)`],
  ], {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    }
  });
  console.log(userTable);
  
  // Agent Stats
  console.log(chalk.cyan.bold('🤖 Agents & Conversations'));
  const agentTable = table([
    [chalk.bold('Metric'), chalk.bold('Value')],
    ['Total Agents', stats.totalAgents.toString()],
    ['Conversations', stats.totalConversations.toString()],
    ['Messages', stats.totalMessages.toLocaleString()],
    ['Avg Messages/Conversation', (stats.totalMessages / Math.max(stats.totalConversations, 1)).toFixed(1)],
  ]);
  console.log(agentTable);
  
  // Model Usage
  console.log(chalk.cyan.bold('⚡ Model Usage'));
  const totalRequests = stats.modelUsage.flash.requests + stats.modelUsage.pro.requests;
  const modelTable = table([
    [chalk.bold('Model'), chalk.bold('Requests'), chalk.bold('Tokens'), chalk.bold('Cost (USD)')],
    [
      chalk.green('Flash'),
      stats.modelUsage.flash.requests.toLocaleString(),
      stats.modelUsage.flash.tokens.toLocaleString(),
      `$${stats.modelUsage.flash.cost.toFixed(4)}`,
    ],
    [
      chalk.magenta('Pro'),
      stats.modelUsage.pro.requests.toLocaleString(),
      stats.modelUsage.pro.tokens.toLocaleString(),
      `$${stats.modelUsage.pro.cost.toFixed(4)}`,
    ],
    [
      chalk.bold('Total'),
      chalk.bold(totalRequests.toLocaleString()),
      chalk.bold((stats.modelUsage.flash.tokens + stats.modelUsage.pro.tokens).toLocaleString()),
      chalk.bold(`$${stats.totalCost.toFixed(4)}`),
    ],
  ]);
  console.log(modelTable);
  
  // Context Stats
  console.log(chalk.cyan.bold('📚 Context Sources'));
  const contextTable = table([
    [chalk.bold('Metric'), chalk.bold('Value')],
    ['Total Sources', stats.totalContextSources.toString()],
    ['Total Context Tokens', stats.totalContextTokens.toLocaleString()],
  ]);
  console.log(contextTable);
  
  // Performance
  console.log(chalk.cyan.bold('⚡ Performance'));
  const perfTable = table([
    [chalk.bold('Metric'), chalk.bold('Value')],
    ['Avg Response Time', `${stats.avgResponseTimeMs.toFixed(0)} ms`],
  ]);
  console.log(perfTable);
  
  // Cost Summary
  console.log(chalk.cyan.bold('💰 Cost Summary'));
  const costTable = table([
    [chalk.bold('Metric'), chalk.bold('Value')],
    ['Total Cost', chalk.bold(`$${stats.totalCost.toFixed(2)}`)],
    ['Cost per User', `$${stats.costPerUser.toFixed(4)}`],
    ['Cost per Message', `$${stats.costPerMessage.toFixed(4)}`],
  ]);
  console.log(costTable);
  
  console.log('\n');
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
















