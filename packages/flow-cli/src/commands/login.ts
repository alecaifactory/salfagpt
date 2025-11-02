/**
 * Flow CLI Login Command
 * 
 * Authenticates the CLI with a Flow API key
 */

import chalk from 'chalk';
import { setAPIKey, setAPIEndpoint, getConfigPath } from '../config.js';
import { FlowAPIClient } from '../api-client.js';

export async function loginCommand(apiKey: string, options: { endpoint?: string }): Promise<void> {
  console.log(chalk.blue('🔐 Flow CLI Authentication\n'));
  
  // Set API endpoint if provided
  if (options.endpoint) {
    console.log(chalk.dim(`Setting API endpoint: ${options.endpoint}`));
    setAPIEndpoint(options.endpoint);
  }
  
  // Validate API key format
  if (!apiKey || apiKey.length < 32) {
    console.log(chalk.red('❌ Invalid API key format'));
    console.log(chalk.dim('\nAPI keys should be at least 32 characters long.'));
    console.log(chalk.dim('Get your API key from the Flow platform admin panel.'));
    process.exit(1);
  }
  
  // Save API key
  setAPIKey(apiKey);
  console.log(chalk.green('✅ API key saved securely'));
  
  // Test connection
  console.log(chalk.dim('\nTesting connection...'));
  
  const client = new FlowAPIClient();
  const result = await client.testConnection();
  
  if (!result.success) {
    console.log(chalk.red(`❌ Authentication failed: ${result.error}`));
    console.log(chalk.dim('\nPlease verify:'));
    console.log(chalk.dim('1. Your API key is valid'));
    console.log(chalk.dim('2. The API endpoint is correct'));
    console.log(chalk.dim('3. Your network connection is stable'));
    process.exit(1);
  }
  
  // Success!
  console.log(chalk.green('\n✅ Successfully authenticated!'));
  console.log(chalk.dim(`\nUser: ${result.data?.user?.email || 'Unknown'}`));
  console.log(chalk.dim(`Role: ${result.data?.user?.role || 'Unknown'}`));
  console.log(chalk.dim(`Config: ${getConfigPath()}`));
  
  console.log(chalk.blue('\n💡 You can now run commands like:'));
  console.log(chalk.dim('   flow usage-stats @mydomain.com'));
  console.log(chalk.dim('   flow usage-stats @mydomain.com --days 30'));
}




