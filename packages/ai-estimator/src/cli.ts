import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { prompt } from 'enquirer';
import { formatDistance } from 'date-fns';

import { EstimationEngine, CalibrationEngine } from './estimation-engine.js';
import { InMemoryAdapter } from './database.js';
import type { ProjectStep, ProjectEstimation } from './types.js';

// ============================================================================
// CLI
// ============================================================================

export async function runCLI() {
  const program = new Command();
  const db = new InMemoryAdapter();

  program
    .name('ai-estimate')
    .description('AI project estimation & tracking with historical calibration')
    .version('0.1.0');

  // --------------------------------------------------------------------------
  // estimate
  // --------------------------------------------------------------------------

  program
    .command('estimate')
    .description('Estimate a new project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('-t, --type <type>', 'Project type (e.g., web-feature)')
    .option('--no-calibration', 'Disable historical calibration')
    .action(async (options) => {
      console.log(chalk.bold.blue('\n📊 AI Project Estimator\n'));

      // Gather project info
      const projectInfo: any = {};

      if (!options.name) {
        const response = await prompt<{ name: string }>({
          type: 'input',
          name: 'name',
          message: 'Project name:',
          required: true,
        });
        projectInfo.name = response.name;
      } else {
        projectInfo.name = options.name;
      }

      if (!options.description) {
        const response = await prompt<{ description: string }>({
          type: 'input',
          name: 'description',
          message: 'Project description:',
          required: true,
        });
        projectInfo.description = response.description;
      } else {
        projectInfo.description = options.description;
      }

      projectInfo.type = options.type || 'general';

      // Gather steps
      console.log(chalk.yellow('\n📝 Add project steps (press Ctrl+C when done)\n'));

      const steps: ProjectStep[] = [];
      let stepIndex = 1;
      let addingSteps = true;

      while (addingSteps) {
        try {
          const stepResponse = await prompt<{
            name: string;
            description: string;
            optimistic: number;
            realistic: number;
            pessimistic: number;
            complexity: 'low' | 'medium' | 'high' | 'very-high';
          }>([
            {
              type: 'input',
              name: 'name',
              message: `Step ${stepIndex} name:`,
              required: true,
            },
            {
              type: 'input',
              name: 'description',
              message: `Step ${stepIndex} description:`,
              required: true,
            },
            {
              type: 'numeral',
              name: 'optimistic',
              message: 'Optimistic hours:',
              required: true,
            },
            {
              type: 'numeral',
              name: 'realistic',
              message: 'Realistic hours:',
              required: true,
            },
            {
              type: 'numeral',
              name: 'pessimistic',
              message: 'Pessimistic hours:',
              required: true,
            },
            {
              type: 'select',
              name: 'complexity',
              message: 'Complexity:',
              choices: ['low', 'medium', 'high', 'very-high'],
            },
          ]);

          steps.push({
            id: `step-${stepIndex}`,
            name: stepResponse.name,
            description: stepResponse.description,
            optimisticHours: stepResponse.optimistic,
            realisticHours: stepResponse.realistic,
            pessimisticHours: stepResponse.pessimistic,
            complexity: stepResponse.complexity,
            dependencies: [],
            tags: [],
          });

          stepIndex++;

          const continueResponse = await prompt<{ continue: boolean }>({
            type: 'confirm',
            name: 'continue',
            message: 'Add another step?',
            initial: true,
          });

          addingSteps = continueResponse.continue;
        } catch (error) {
          // User pressed Ctrl+C
          if (steps.length > 0) {
            addingSteps = false;
          } else {
            console.log(chalk.red('\n❌ At least one step is required\n'));
            process.exit(1);
          }
        }
      }

      // Calculate estimation
      const spinner = ora('Calculating estimation...').start();

      // Get historical calibration
      let historicalFactor = 1.0;
      if (options.calibration !== false) {
        const dataPoints = await db.getDataPoints({
          projectType: projectInfo.type,
          limit: 10,
        });

        if (dataPoints.length >= 3) {
          historicalFactor = CalibrationEngine.calculateHistoricalFactor(dataPoints);
          spinner.text = `Applying historical calibration (factor: ${historicalFactor.toFixed(2)})...`;
        }
      }

      const estimation = EstimationEngine.estimateProject(steps, historicalFactor);

      const project: ProjectEstimation = {
        id: 'temp-id',
        name: projectInfo.name,
        description: projectInfo.description,
        steps,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'planning',
        estimatedTotalHours: estimation.totalEstimated,
        historicalFactor,
        calibratedHours: estimation.totalCalibrated,
        confidenceLevel: estimation.overallConfidence,
        completedSteps: [],
        userId: 'cli-user',
        projectType: projectInfo.type,
        tags: [],
      };

      const projectId = await db.createProject(project);
      project.id = projectId;

      const analysis = EstimationEngine.analyzeEstimation(project);

      spinner.succeed('Estimation complete!');

      // Display results
      console.log(chalk.bold.green('\n✨ Estimation Results\n'));
      console.log(chalk.gray('─'.repeat(60)));
      
      console.log(chalk.bold('Project:'), project.name);
      console.log(chalk.bold('Type:'), projectInfo.type);
      console.log(chalk.bold('Steps:'), steps.length);
      
      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(chalk.bold.cyan('Time Estimates:'));
      console.log(
        `  Raw estimate:        ${chalk.yellow(estimation.totalEstimated.toFixed(1) + 'h')} (${(estimation.totalEstimated / 8).toFixed(1)} days)`
      );
      console.log(
        `  Calibrated estimate: ${chalk.green(estimation.totalCalibrated.toFixed(1) + 'h')} (${(estimation.totalCalibrated / 8).toFixed(1)} days)`
      );
      console.log(
        `  Historical factor:   ${chalk.blue(historicalFactor.toFixed(2) + 'x')}`
      );
      console.log(
        `  Confidence:          ${chalk.magenta((estimation.overallConfidence * 100).toFixed(0) + '%')}`
      );

      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(chalk.bold.cyan('Completion Dates:'));
      console.log(
        `  Optimistic:  ${chalk.green(analysis.optimisticCompletion.toISOString().split('T')[0])}`
      );
      console.log(
        `  Realistic:   ${chalk.yellow(analysis.realisticCompletion.toISOString().split('T')[0])}`
      );
      console.log(
        `  Pessimistic: ${chalk.red(analysis.pessimisticCompletion.toISOString().split('T')[0])}`
      );

      if (Object.keys(estimation.byComplexity).length > 0) {
        console.log(chalk.gray('\n─'.repeat(60)));
        console.log(chalk.bold.cyan('By Complexity:'));
        for (const [complexity, hours] of Object.entries(estimation.byComplexity)) {
          const percentage = ((hours / estimation.totalEstimated) * 100).toFixed(0);
          console.log(
            `  ${complexity.padEnd(12)} ${hours.toFixed(1)}h (${percentage}%)`
          );
        }
      }

      if (analysis.warnings.length > 0) {
        console.log(chalk.gray('\n─'.repeat(60)));
        console.log(chalk.bold.yellow('⚠️  Warnings:'));
        analysis.warnings.forEach((w) => console.log(`  • ${w}`));
      }

      if (analysis.suggestions.length > 0) {
        console.log(chalk.gray('\n─'.repeat(60)));
        console.log(chalk.bold.blue('💡 Suggestions:'));
        analysis.suggestions.forEach((s) => console.log(`  • ${s}`));
      }

      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(chalk.gray(`\nProject ID: ${projectId}`));
      console.log(chalk.gray(`Use "ai-estimate track ${projectId}" to track progress\n`));
    });

  // --------------------------------------------------------------------------
  // track
  // --------------------------------------------------------------------------

  program
    .command('track <projectId>')
    .description('Track progress on a project')
    .option('-s, --step <stepId>', 'Step ID')
    .option('-h, --hours <hours>', 'Actual hours spent', parseFloat)
    .option('-t, --tokens <tokens>', 'Tokens generated', parseFloat)
    .option('-l, --lines <lines>', 'Lines of code', parseInt)
    .option('-n, --notes <notes>', 'Notes')
    .action(async (projectId, options) => {
      const project = await db.getProject(projectId);
      if (!project) {
        console.error(chalk.red(`\n❌ Project not found: ${projectId}\n`));
        process.exit(1);
      }

      console.log(chalk.bold.blue(`\n📈 Track Progress: ${project.name}\n`));

      // Select step
      let stepId = options.step;
      if (!stepId) {
        const availableSteps = project.steps.filter(
          (s) => !project.completedSteps.includes(s.id)
        );

        if (availableSteps.length === 0) {
          console.log(chalk.green('\n✅ All steps completed!\n'));
          process.exit(0);
        }

        const response = await prompt<{ step: string }>({
          type: 'select',
          name: 'step',
          message: 'Which step did you complete?',
          choices: availableSteps.map((s) => ({
            name: s.id,
            message: `${s.name} (est: ${s.realisticHours}h)`,
          })),
        });

        stepId = response.step;
      }

      const step = project.steps.find((s) => s.id === stepId);
      if (!step) {
        console.error(chalk.red(`\n❌ Step not found: ${stepId}\n`));
        process.exit(1);
      }

      // Get hours
      let hours = options.hours;
      if (!hours) {
        const response = await prompt<{ hours: number }>({
          type: 'numeral',
          name: 'hours',
          message: 'Actual hours spent:',
          initial: step.realisticHours,
          required: true,
        });
        hours = response.hours;
      }

      // Optional metrics
      const tokens = options.tokens;
      const lines = options.lines;
      const notes = options.notes;

      // Save execution
      await db.createExecution({
        id: '',
        projectId,
        stepId,
        startedAt: new Date(),
        completedAt: new Date(),
        estimatedHours: step.realisticHours,
        actualHours: hours,
        tokensGenerated: tokens,
        linesOfCode: lines,
        notes,
        blockers: [],
        iterationsNeeded: 1,
        typeErrorsFound: 0,
        runtimeErrorsFound: 0,
      });

      // Update project
      await db.updateProject(projectId, {
        completedSteps: [...project.completedSteps, stepId],
        status: 'in-progress',
      });

      // Display results
      console.log(chalk.green('\n✅ Progress tracked!\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(`Step:       ${step.name}`);
      console.log(`Estimated:  ${step.realisticHours}h`);
      console.log(`Actual:     ${hours}h`);
      
      const accuracy = (hours / step.realisticHours);
      const accuracyColor = accuracy < 1 ? chalk.green : accuracy > 1.2 ? chalk.red : chalk.yellow;
      console.log(`Accuracy:   ${accuracyColor((accuracy * 100).toFixed(0) + '%')}`);

      const completed = project.completedSteps.length + 1;
      const total = project.steps.length;
      const progress = (completed / total) * 100;

      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(`Progress:   ${completed}/${total} steps (${progress.toFixed(0)}%)`);

      if (completed < total) {
        console.log(chalk.gray(`\nNext: Track step ${completed + 1}`));
      } else {
        console.log(chalk.green('\n🎉 All steps completed! Use "ai-estimate complete" to finish.\n'));
      }
    });

  // --------------------------------------------------------------------------
  // list
  // --------------------------------------------------------------------------

  program
    .command('list')
    .description('List all projects')
    .option('-s, --status <status>', 'Filter by status')
    .action(async (options) => {
      const projects = await db.listProjects('cli-user', options.status);

      if (projects.length === 0) {
        console.log(chalk.yellow('\n📋 No projects found\n'));
        console.log(chalk.gray('Use "ai-estimate estimate" to create one\n'));
        return;
      }

      console.log(chalk.bold.blue('\n📋 Your Projects\n'));
      console.log(chalk.gray('─'.repeat(80)));

      for (const project of projects) {
        const completed = project.completedSteps.length;
        const total = project.steps.length;
        const progress = (completed / total) * 100;

        const statusColors = {
          planning: chalk.gray,
          'in-progress': chalk.yellow,
          completed: chalk.green,
          cancelled: chalk.red,
        };

        const statusColor = statusColors[project.status] || chalk.white;

        console.log(`${chalk.bold(project.name)} ${statusColor(`[${project.status}]`)}`);
        console.log(`  ID:       ${chalk.gray(project.id)}`);
        console.log(`  Type:     ${project.projectType || 'general'}`);
        console.log(
          `  Estimate: ${project.calibratedHours.toFixed(1)}h (${(project.calibratedHours / 8).toFixed(1)} days)`
        );
        console.log(`  Progress: ${completed}/${total} steps (${progress.toFixed(0)}%)`);
        console.log(
          `  Created:  ${formatDistance(project.createdAt, new Date(), { addSuffix: true })}`
        );
        console.log(chalk.gray('─'.repeat(80)));
      }

      console.log(chalk.gray(`\nTotal: ${projects.length} projects\n`));
    });

  // --------------------------------------------------------------------------
  // report
  // --------------------------------------------------------------------------

  program
    .command('report <projectId>')
    .description('Generate progress report')
    .action(async (projectId) => {
      const project = await db.getProject(projectId);
      if (!project) {
        console.error(chalk.red(`\n❌ Project not found: ${projectId}\n`));
        process.exit(1);
      }

      const executions = await db.listExecutions(projectId);

      console.log(chalk.bold.blue(`\n📊 Progress Report: ${project.name}\n`));
      console.log(chalk.gray('─'.repeat(80)));

      // Basic info
      console.log(chalk.bold('Status:'), chalk.yellow(project.status));
      console.log(chalk.bold('Type:'), project.projectType || 'general');
      console.log(
        chalk.bold('Created:'),
        formatDistance(project.createdAt, new Date(), { addSuffix: true })
      );

      // Progress
      const completed = project.completedSteps.length;
      const total = project.steps.length;
      const progress = (completed / total) * 100;

      console.log(chalk.gray('\n─'.repeat(80)));
      console.log(chalk.bold.cyan('Progress:'));
      console.log(`  Steps:      ${completed}/${total} (${progress.toFixed(0)}%)`);

      // Time spent
      const hoursSpent = executions.reduce((sum, ex) => sum + (ex.actualHours || 0), 0);
      const hoursEstimated = project.calibratedHours;
      const hoursRemaining = Math.max(0, hoursEstimated - hoursSpent);

      console.log(chalk.gray('\n─'.repeat(80)));
      console.log(chalk.bold.cyan('Time:'));
      console.log(`  Spent:      ${hoursSpent.toFixed(1)}h`);
      console.log(`  Estimated:  ${hoursEstimated.toFixed(1)}h`);
      console.log(`  Remaining:  ${hoursRemaining.toFixed(1)}h`);

      // Accuracy
      if (completed > 0) {
        const estimatedSoFar = project.steps
          .filter((s) => project.completedSteps.includes(s.id))
          .reduce((sum, s) => sum + s.realisticHours, 0);

        const accuracy = hoursSpent / estimatedSoFar;
        const accuracyColor = accuracy < 1 ? chalk.green : accuracy > 1.2 ? chalk.red : chalk.yellow;

        console.log(chalk.gray('\n─'.repeat(80)));
        console.log(chalk.bold.cyan('Accuracy:'));
        console.log(`  Factor:     ${accuracyColor((accuracy).toFixed(2) + 'x')}`);
        console.log(`  Status:     ${accuracyColor(interpretFactor(accuracy))}`);
      }

      // Completion estimate
      if (completed > 0 && completed < total) {
        const velocity = completed / ((Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = (total - completed) / velocity;
        const estimatedCompletion = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);

        console.log(chalk.gray('\n─'.repeat(80)));
        console.log(chalk.bold.cyan('Projection:'));
        console.log(`  Velocity:   ${velocity.toFixed(2)} steps/day`);
        console.log(
          `  Completion: ${estimatedCompletion.toISOString().split('T')[0]} (in ${Math.ceil(daysRemaining)} days)`
        );
      }

      console.log(chalk.gray('\n─'.repeat(80)) + '\n');
    });

  // --------------------------------------------------------------------------
  // calibration
  // --------------------------------------------------------------------------

  program
    .command('calibration')
    .description('Show historical calibration data')
    .option('-t, --type <type>', 'Filter by project type')
    .option('-c, --complexity <complexity>', 'Filter by complexity')
    .action(async (options) => {
      const dataPoints = await db.getDataPoints({
        projectType: options.type,
        complexity: options.complexity,
        limit: 50,
      });

      if (dataPoints.length === 0) {
        console.log(chalk.yellow('\n📊 No historical data yet\n'));
        console.log(chalk.gray('Complete some projects to build calibration data\n'));
        return;
      }

      const model = CalibrationEngine.buildCalibrationModel(dataPoints);

      console.log(chalk.bold.blue('\n📊 Historical Calibration Data\n'));
      console.log(chalk.gray('─'.repeat(80)));

      console.log(chalk.bold('Data Points:'), dataPoints.length);
      console.log(chalk.bold('Overall Factor:'), chalk.green((model.overallFactor).toFixed(2) + 'x'));
      console.log(chalk.bold('Interpretation:'), interpretFactor(model.overallFactor));
      
      console.log(chalk.gray('\n─'.repeat(80)));
      console.log(chalk.bold.cyan('Confidence Interval (95%):'));
      console.log(
        `  Lower: ${model.confidenceInterval.lower.toFixed(2)}x`
      );
      console.log(
        `  Upper: ${model.confidenceInterval.upper.toFixed(2)}x`
      );

      if (Object.keys(model.factorByComplexity).length > 0) {
        console.log(chalk.gray('\n─'.repeat(80)));
        console.log(chalk.bold.cyan('By Complexity:'));
        for (const [complexity, factor] of Object.entries(model.factorByComplexity)) {
          console.log(`  ${complexity.padEnd(12)} ${(factor).toFixed(2)}x`);
        }
      }

      if (Object.keys(model.factorByProjectType).length > 0) {
        console.log(chalk.gray('\n─'.repeat(80)));
        console.log(chalk.bold.cyan('By Project Type:'));
        for (const [type, factor] of Object.entries(model.factorByProjectType)) {
          console.log(`  ${type.padEnd(12)} ${(factor).toFixed(2)}x`);
        }
      }

      console.log(chalk.gray('\n─'.repeat(80)) + '\n');
    });

  program.parse();
}

// ============================================================================
// HELPERS
// ============================================================================

function interpretFactor(factor: number): string {
  if (factor < 0.7) {
    return 'Much faster than estimated';
  } else if (factor < 0.9) {
    return 'Faster than estimated';
  } else if (factor <= 1.1) {
    return 'Accurate estimate';
  } else if (factor <= 1.3) {
    return 'Slower than estimated';
  } else {
    return 'Much slower than estimated';
  }
}


