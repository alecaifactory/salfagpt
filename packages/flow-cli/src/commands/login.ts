/**
 * Login Command - Delightful OAuth Experience
 * 
 * Features:
 * - Beautiful terminal UI with colors and emojis
 * - Clear step-by-step progress
 * - Helpful error messages
 * - Automatic browser opening
 * - Secure credential storage
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import open from 'open';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import http from 'http';
import { URL } from 'url';
import axios from 'axios';
import { saveCredentials, getConfig, hasCredentials } from '../lib/config';

export const loginCommand = new Command('login')
  .description('Authenticate with Flow API using your invitation code')
  .argument('[invitation-code]', 'Your invitation code (e.g., FLOW-ENT-202511-ABC123)')
  .action(async (invitationCode) => {
    console.log(chalk.bold.blue('\n🔐 Flow API Authentication\n'));
    
    // Check if already logged in
    if (hasCredentials()) {
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'You are already logged in. Do you want to login with a new account?',
        default: false,
      }]);
      
      if (!proceed) {
        console.log(chalk.yellow('\n✓ Keeping current credentials\n'));
        return;
      }
    }
    
    // Get invitation code
    let code = invitationCode;
    if (!code) {
      const answers = await inquirer.prompt([{
        type: 'input',
        name: 'code',
        message: 'Enter your invitation code:',
        validate: (input) => {
          if (!input) return 'Invitation code is required';
          if (!input.startsWith('FLOW-')) return 'Invalid format (should start with FLOW-)';
          return true;
        },
      }]);
      code = answers.code;
    }
    
    const spinner = ora({
      text: 'Initializing authentication...',
      color: 'blue',
    }).start();
    
    try {
      const config = getConfig();
      
      // Start local callback server
      const { server, port, promise } = await startCallbackServer();
      
      // Generate OAuth URL
      const authUrl = `${config.authUrl}/api/cli/auth/initiate?code=${code}&port=${port}`;
      
      spinner.succeed('Authentication initialized');
      
      console.log(chalk.gray('\n📱 Opening browser for Google OAuth...'));
      console.log(chalk.gray(`   If browser doesn't open, visit: ${authUrl}\n`));
      
      // Open browser
      await open(authUrl);
      
      const waitSpinner = ora({
        text: 'Waiting for authentication in browser...',
        color: 'yellow',
      }).start();
      
      // Wait for OAuth callback
      const result = await promise;
      
      // Close server
      server.close();
      
      if (result.error) {
        waitSpinner.fail('Authentication failed');
        console.log(chalk.red(`\n❌ Error: ${result.error}\n`));
        return;
      }
      
      waitSpinner.succeed('Authentication successful');
      
      // Save credentials
      saveCredentials({
        apiKey: result.apiKey,
        organizationId: result.organization.id,
        organizationName: result.organization.name,
        domain: result.organization.domain,
        tier: result.organization.tier,
        createdAt: new Date().toISOString(),
      });
      
      // Success message
      console.log(
        boxen(
          chalk.bold.green('✓ Welcome to Flow API!\n\n') +
          chalk.white('Organization: ') + chalk.bold(result.organization.name) + '\n' +
          chalk.white('Domain: ') + chalk.bold(result.organization.domain) + '\n' +
          chalk.white('Tier: ') + chalk.bold.cyan(result.organization.tier.toUpperCase()) + '\n\n' +
          chalk.gray('Your API key has been saved securely to:\n') +
          chalk.gray('~/.flow/credentials.json\n\n') +
          chalk.bold('Next steps:\n') +
          chalk.blue('  • ') + 'Extract a document: ' + chalk.cyan('flow-cli extract document.pdf') + '\n' +
          chalk.blue('  • ') + 'Check your status: ' + chalk.cyan('flow-cli status') + '\n' +
          chalk.blue('  • ') + 'View documentation: ' + chalk.cyan('https://api.flow.ai/docs'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
          }
        )
      );
      
    } catch (error) {
      spinner.fail('Authentication failed');
      console.log(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
      console.log(chalk.yellow('💡 Troubleshooting:'));
      console.log(chalk.gray('   • Verify your invitation code is correct'));
      console.log(chalk.gray('   • Ensure you have internet connection'));
      console.log(chalk.gray('   • Use a business email (not gmail.com)'));
      console.log(chalk.gray('   • Contact support: api@flow.ai\n'));
    }
  });

/**
 * Start local HTTP server to receive OAuth callback
 */
async function startCallbackServer(): Promise<{
  server: http.Server;
  port: number;
  promise: Promise<any>;
}> {
  let resolvePromise: any;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '', `http://localhost`);
    
    if (url.pathname === '/callback') {
      const apiKey = url.searchParams.get('apiKey');
      const organization = url.searchParams.get('organization');
      const error = url.searchParams.get('error');
      
      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">❌ Authentication Failed</h1>
              <p style="color: #64748b;">${error}</p>
              <p style="color: #94a3b8; font-size: 14px;">You can close this window</p>
            </body>
          </html>
        `);
        resolvePromise({ error });
        return;
      }
      
      if (apiKey && organization) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui; text-align: center; padding: 50px;">
              <h1 style="color: #16a34a;">✅ Authentication Successful!</h1>
              <p style="color: #64748b;">Return to your terminal to continue</p>
              <p style="color: #94a3b8; font-size: 14px;">You can close this window</p>
            </body>
          </html>
        `);
        
        resolvePromise({
          apiKey,
          organization: JSON.parse(decodeURIComponent(organization)),
        });
      }
    }
  });
  
  // Find available port
  const port = await findAvailablePort(8765);
  server.listen(port);
  
  return { server, port, promise };
}

/**
 * Find available port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any).port;
      server.close();
      resolve(port);
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}
