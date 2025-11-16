/**
 * Extract Command - Beautiful Document Extraction
 * 
 * Features:
 * - Progress indicators with emojis
 * - Real-time status updates
 * - Success celebration
 * - Helpful suggestions
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { requireAuth, getConfig } from '../lib/config';

export const extractCommand = new Command('extract')
  .description('Extract text and data from a document')
  .argument('<file>', 'Path to document (PDF, Excel, Word, CSV)')
  .option('-m, --model <model>', 'AI model: flash (fast) or pro (accurate)', 'flash')
  .option('-o, --output <file>', 'Save extracted text to file')
  .option('--json', 'Output as JSON')
  .action(async (filePath, options) => {
    console.log(chalk.bold.blue('\n📄 Document Extraction\n'));
    
    try {
      // Authenticate
      const credentials = requireAuth();
      const config = getConfig();
      
      // Validate file
      if (!fs.existsSync(filePath)) {
        console.log(chalk.red(`❌ File not found: ${filePath}\n`));
        return;
      }
      
      const stats = fs.statSync(filePath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const fileName = path.basename(filePath);
      
      console.log(chalk.gray(`File: ${fileName}`));
      console.log(chalk.gray(`Size: ${fileSizeMB} MB`));
      console.log(chalk.gray(`Model: ${options.model === 'pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}`));
      console.log();
      
      // Create form data
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('model', `gemini-2.5-${options.model}`);
      
      // Upload with progress
      const spinner = ora({
        text: 'Uploading document...',
        color: 'cyan',
      }).start();
      
      const startTime = Date.now();
      
      const response = await axios.post(
        `${config.apiUrl}/api/v1/extract-document`,
        form,
        {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
            ...form.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (response.data.success) {
        spinner.succeed('Document extracted successfully');
        
        const { extractedText, metadata } = response.data;
        
        // Display results
        console.log(
          boxen(
            chalk.bold.green('✓ Extraction Complete\n\n') +
            chalk.white('File: ') + chalk.bold(metadata.fileName) + '\n' +
            chalk.white('Pages: ') + chalk.bold(metadata.pageCount || 'N/A') + '\n' +
            chalk.white('Model: ') + chalk.bold(metadata.model) + '\n' +
            chalk.white('Tokens: ') + chalk.bold(metadata.tokensUsed.toLocaleString()) + '\n' +
            chalk.white('Cost: ') + chalk.bold.green(`$${metadata.costUSD.toFixed(4)}`) + '\n' +
            chalk.white('Time: ') + chalk.bold(`${duration}s`),
            {
              padding: 1,
              margin: 1,
              borderStyle: 'round',
              borderColor: 'green',
            }
          )
        );
        
        // Save output
        if (options.output) {
          fs.writeFileSync(options.output, extractedText);
          console.log(chalk.green(`\n✓ Saved to: ${options.output}`));
        } else if (options.json) {
          console.log(JSON.stringify(response.data, null, 2));
        } else {
          // Show preview
          console.log(chalk.bold('\n📝 Extracted Text Preview:\n'));
          console.log(chalk.gray('─'.repeat(60)));
          console.log(extractedText.substring(0, 500));
          if (extractedText.length > 500) {
            console.log(chalk.gray(`\n... (${(extractedText.length - 500).toLocaleString()} more characters)`));
          }
          console.log(chalk.gray('─'.repeat(60)));
          
          // Suggest saving
          console.log(chalk.yellow('\n💡 Tip: Save to file with:'));
          console.log(chalk.cyan(`   flow-cli extract ${fileName} -o output.txt\n`));
        }
        
      } else {
        spinner.fail('Extraction failed');
        console.log(chalk.red(`\n❌ ${response.data.error?.message || 'Unknown error'}\n`));
      }
      
    } catch (error: any) {
      ora().fail('Extraction failed');
      
      if (error.response) {
        const errorData = error.response.data;
        console.log(chalk.red(`\n❌ ${errorData.error?.message || 'API error'}\n`));
        
        // Helpful suggestions based on error
        if (errorData.error?.code === 'QUOTA_EXCEEDED') {
          console.log(chalk.yellow('💡 Your quota has been reached:'));
          console.log(chalk.gray(`   Used: ${errorData.error.quota?.used} / ${errorData.error.quota?.limit}`));
          console.log(chalk.gray(`   Resets: ${new Date(errorData.error.quota?.resetsAt).toLocaleDateString()}`));
          console.log(chalk.gray('\n   Upgrade your tier: https://api.flow.ai/portal/billing\n'));
        } else if (errorData.error?.code === 'FILE_TOO_LARGE') {
          console.log(chalk.yellow(`💡 File is too large for your tier (${fileSizeMB} MB)`));
          console.log(chalk.gray('   Upgrade to process larger files: https://api.flow.ai/portal/billing\n'));
        } else if (errorData.error?.code === 'UNAUTHORIZED') {
          console.log(chalk.yellow('💡 Your API key may have expired'));
          console.log(chalk.gray('   Try logging in again: flow-cli login\n'));
        }
      } else {
        console.log(chalk.red(`\n❌ ${error.message}\n`));
      }
    }
  });

/**
 * Start callback server for OAuth
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
        res.end(getErrorHTML(error));
        resolvePromise({ error });
        return;
      }
      
      if (apiKey && organization) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getSuccessHTML());
        
        resolvePromise({
          apiKey,
          organization: JSON.parse(decodeURIComponent(organization)),
        });
      }
    }
  });
  
  // Find available port starting from 8765
  const port = await findAvailablePort(8765);
  server.listen(port);
  
  return { server, port, promise };
}

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const testServer = http.createServer();
    testServer.listen(startPort, () => {
      const port = (testServer.address() as any).port;
      testServer.close();
      resolve(port);
    });
    testServer.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function getSuccessHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Flow API - Success</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: bounce 0.5s ease;
          }
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
          h1 { color: #16a34a; margin: 0 0 10px 0; }
          p { color: #64748b; margin: 10px 0; }
          .note { color: #94a3b8; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Authentication Successful!</h1>
          <p>Your Flow API credentials have been saved</p>
          <p class="note">You can close this window and return to your terminal</p>
        </div>
      </body>
    </html>
  `;
}

function getErrorHTML(error: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Flow API - Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
          }
          .container {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #dc2626; margin: 20px 0 10px 0; }
          .error { color: #64748b; margin: 20px 0; }
          .note { color: #94a3b8; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="font-size: 80px;">❌</div>
          <h1>Authentication Failed</h1>
          <p class="error">${error}</p>
          <p class="note">You can close this window and try again in your terminal</p>
        </div>
      </body>
    </html>
  `;
}

