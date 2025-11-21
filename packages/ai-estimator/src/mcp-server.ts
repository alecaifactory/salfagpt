#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { EstimationEngine, CalibrationEngine, ProgressTracker } from './estimation-engine.js';
import { InMemoryAdapter } from './database.js';
import type {
  EstimateProjectInput,
  TrackProgressInput,
  GetCalibrationInput,
  ProjectEstimation,
  ProjectStep,
  StepExecution,
  HistoricalDataPoint,
} from './types.js';

// ============================================================================
// MCP SERVER
// ============================================================================

class AIEstimatorMCPServer {
  private server: Server;
  private db: InMemoryAdapter;

  constructor() {
    this.server = new Server(
      {
        name: '@salfagpt/ai-estimator',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.db = new InMemoryAdapter();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'estimate_project':
            return await this.handleEstimateProject(args as EstimateProjectInput);
          
          case 'track_progress':
            return await this.handleTrackProgress(args as TrackProgressInput);
          
          case 'get_calibration':
            return await this.handleGetCalibration(args as GetCalibrationInput);
          
          case 'list_projects':
            return await this.handleListProjects(args as { userId: string });
          
          case 'get_progress_report':
            return await this.handleGetProgressReport(args as { projectId: string });
          
          case 'complete_project':
            return await this.handleCompleteProject(args as { 
              projectId: string;
              actualHours: number;
            });

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'estimate_project',
        description: 'Estimate a software project with historical calibration',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            steps: {
              type: 'array',
              description: 'Project steps to estimate',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  optimisticHours: { type: 'number' },
                  realisticHours: { type: 'number' },
                  pessimisticHours: { type: 'number' },
                  complexity: {
                    type: 'string',
                    enum: ['low', 'medium', 'high', 'very-high'],
                  },
                },
                required: [
                  'name',
                  'description',
                  'optimisticHours',
                  'realisticHours',
                  'pessimisticHours',
                  'complexity',
                ],
              },
            },
            projectType: {
              type: 'string',
              description: 'Type of project (e.g., "web-feature", "backend-api")',
            },
            useHistoricalCalibration: {
              type: 'boolean',
              description: 'Apply historical calibration factor',
              default: true,
            },
          },
          required: ['name', 'description', 'steps'],
        },
      },
      {
        name: 'track_progress',
        description: 'Track progress on a project step',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            stepId: { type: 'string' },
            actualHours: { type: 'number' },
            tokensGenerated: { type: 'number' },
            linesOfCode: { type: 'number' },
            notes: { type: 'string' },
          },
          required: ['projectId', 'stepId', 'actualHours'],
        },
      },
      {
        name: 'get_calibration',
        description: 'Get historical calibration data and factor',
        inputSchema: {
          type: 'object',
          properties: {
            projectType: { type: 'string' },
            complexity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'very-high'],
            },
            minDataPoints: {
              type: 'number',
              description: 'Minimum data points required',
              default: 3,
            },
          },
        },
      },
      {
        name: 'list_projects',
        description: 'List all projects for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            status: {
              type: 'string',
              enum: ['planning', 'in-progress', 'completed', 'cancelled'],
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'get_progress_report',
        description: 'Get detailed progress report for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'complete_project',
        description: 'Mark project as complete and record historical data',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            actualHours: { type: 'number' },
          },
          required: ['projectId', 'actualHours'],
        },
      },
    ];
  }

  // --------------------------------------------------------------------------
  // TOOL HANDLERS
  // --------------------------------------------------------------------------

  private async handleEstimateProject(input: EstimateProjectInput) {
    // Get historical calibration
    let historicalFactor = 1.0;
    
    if (input.useHistoricalCalibration) {
      const dataPoints = await this.db.getDataPoints({
        projectType: input.projectType,
        limit: 10,
      });

      if (dataPoints.length >= 3) {
        historicalFactor = CalibrationEngine.calculateHistoricalFactor(dataPoints);
      }
    }

    // Create project
    const steps: ProjectStep[] = input.steps.map((step, index) => ({
      id: `step-${index}`,
      name: step.name,
      description: step.description,
      optimisticHours: step.optimisticHours,
      realisticHours: step.realisticHours,
      pessimisticHours: step.pessimisticHours,
      complexity: step.complexity,
      dependencies: [],
      tags: [],
    }));

    const estimation = EstimationEngine.estimateProject(steps, historicalFactor);

    const project: ProjectEstimation = {
      id: await this.db.createProject({} as any), // Temporary
      name: input.name,
      description: input.description,
      steps,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'planning',
      estimatedTotalHours: estimation.totalEstimated,
      historicalFactor,
      calibratedHours: estimation.totalCalibrated,
      confidenceLevel: estimation.overallConfidence,
      completedSteps: [],
      userId: 'current-user', // TODO: Get from context
      projectType: input.projectType,
      tags: [],
    };

    // Save project
    const projectId = await this.db.createProject(project);
    project.id = projectId;

    // Generate analysis
    const analysis = EstimationEngine.analyzeEstimation(project);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              projectId,
              estimation: {
                totalEstimated: `${estimation.totalEstimated.toFixed(1)}h`,
                totalCalibrated: `${estimation.totalCalibrated.toFixed(1)}h`,
                historicalFactor: historicalFactor.toFixed(2),
                confidence: `${(estimation.overallConfidence * 100).toFixed(0)}%`,
                byComplexity: estimation.byComplexity,
                completionDates: {
                  optimistic: analysis.optimisticCompletion.toISOString().split('T')[0],
                  realistic: analysis.realisticCompletion.toISOString().split('T')[0],
                  pessimistic: analysis.pessimisticCompletion.toISOString().split('T')[0],
                },
              },
              analysis: {
                warnings: analysis.warnings,
                suggestions: analysis.suggestions,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleTrackProgress(input: TrackProgressInput) {
    const project = await this.db.getProject(input.projectId);
    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const step = project.steps.find((s) => s.id === input.stepId);
    if (!step) {
      throw new Error(`Step not found: ${input.stepId}`);
    }

    // Create execution record
    const execution: StepExecution = {
      id: '', // Will be set by DB
      projectId: input.projectId,
      stepId: input.stepId,
      startedAt: new Date(),
      completedAt: new Date(),
      estimatedHours: step.realisticHours,
      actualHours: input.actualHours,
      tokensGenerated: input.tokensGenerated,
      linesOfCode: input.linesOfCode,
      notes: input.notes,
      blockers: [],
      iterationsNeeded: 1,
      typeErrorsFound: 0,
      runtimeErrorsFound: 0,
    };

    const executionId = await this.db.createExecution(execution);

    // Update project
    if (!project.completedSteps.includes(input.stepId)) {
      await this.db.updateProject(input.projectId, {
        completedSteps: [...project.completedSteps, input.stepId],
        status: 'in-progress',
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              executionId,
              step: step.name,
              estimated: `${step.realisticHours}h`,
              actual: `${input.actualHours}h`,
              accuracy: ((input.actualHours / step.realisticHours) * 100).toFixed(0) + '%',
              completedSteps: project.completedSteps.length + 1,
              totalSteps: project.steps.length,
              progress: `${(((project.completedSteps.length + 1) / project.steps.length) * 100).toFixed(0)}%`,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleGetCalibration(input: GetCalibrationInput) {
    const dataPoints = await this.db.getDataPoints({
      projectType: input.projectType,
      complexity: input.complexity,
      limit: 50,
    });

    if (dataPoints.length < input.minDataPoints) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Insufficient historical data',
                dataPointsFound: dataPoints.length,
                minRequired: input.minDataPoints,
                defaultFactor: 1.0,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const model = CalibrationEngine.buildCalibrationModel(dataPoints);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              overallFactor: model.overallFactor.toFixed(2),
              dataPointsUsed: dataPoints.length,
              confidenceInterval: {
                lower: model.confidenceInterval.lower.toFixed(2),
                upper: model.confidenceInterval.upper.toFixed(2),
              },
              interpretation: this.interpretFactor(model.overallFactor),
              factorByComplexity: model.factorByComplexity,
              factorByProjectType: model.factorByProjectType,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleListProjects(input: { userId: string; status?: string }) {
    const projects = await this.db.listProjects(input.userId, input.status);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            projects.map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              estimated: `${p.estimatedTotalHours}h`,
              calibrated: `${p.calibratedHours}h`,
              progress: `${((p.completedSteps.length / p.steps.length) * 100).toFixed(0)}%`,
              createdAt: p.createdAt.toISOString().split('T')[0],
            })),
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleGetProgressReport(input: { projectId: string }) {
    const project = await this.db.getProject(input.projectId);
    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    const executions = await this.db.listExecutions(input.projectId);

    const hoursSpent = executions.reduce(
      (sum, ex) => sum + (ex.actualHours || 0),
      0
    );
    const completionPercentage =
      (project.completedSteps.length / project.steps.length) * 100;

    const estimatedSoFar = project.steps
      .filter((s) => project.completedSteps.includes(s.id))
      .reduce((sum, s) => sum + s.realisticHours, 0);

    const currentFactor =
      estimatedSoFar > 0 ? hoursSpent / estimatedSoFar : 1.0;

    const hoursRemaining =
      (project.calibratedHours - hoursSpent) * currentFactor;

    const velocity = ProgressTracker.calculateVelocity(
      project.completedSteps.length,
      project.createdAt
    );

    const estimatedCompletion = ProgressTracker.estimateCompletionDate(
      project.steps.length,
      project.completedSteps.length,
      project.createdAt
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              project: {
                name: project.name,
                status: project.status,
              },
              progress: {
                completed: project.completedSteps.length,
                total: project.steps.length,
                percentage: `${completionPercentage.toFixed(0)}%`,
              },
              hours: {
                spent: `${hoursSpent.toFixed(1)}h`,
                estimated: `${project.calibratedHours.toFixed(1)}h`,
                remaining: `${hoursRemaining.toFixed(1)}h`,
              },
              accuracy: {
                currentFactor: currentFactor.toFixed(2),
                interpretation: this.interpretFactor(currentFactor),
              },
              velocity: {
                stepsPerDay: velocity.toFixed(2),
                estimatedCompletion: estimatedCompletion.toISOString().split('T')[0],
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async handleCompleteProject(input: { projectId: string; actualHours: number }) {
    const project = await this.db.getProject(input.projectId);
    if (!project) {
      throw new Error(`Project not found: ${input.projectId}`);
    }

    // Update project
    await this.db.updateProject(input.projectId, {
      status: 'completed',
      actualHours: input.actualHours,
    });

    // Create historical data point
    const accuracyFactor = input.actualHours / project.calibratedHours;

    const dataPoint: HistoricalDataPoint = {
      id: '', // Will be set by DB
      projectId: input.projectId,
      estimatedHours: project.calibratedHours,
      actualHours: input.actualHours,
      accuracyFactor,
      projectType: project.projectType || 'general',
      complexity: this.calculateOverallComplexity(project),
      teamSize: 1,
      aiAssisted: true,
      completedAt: new Date(),
      userId: project.userId,
      organizationId: project.organizationId,
      tags: project.tags,
    };

    await this.db.createDataPoint(dataPoint);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              message: 'Project completed and data recorded',
              estimated: `${project.calibratedHours.toFixed(1)}h`,
              actual: `${input.actualHours.toFixed(1)}h`,
              accuracyFactor: accuracyFactor.toFixed(2),
              interpretation: this.interpretFactor(accuracyFactor),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private interpretFactor(factor: number): string {
    if (factor < 0.7) {
      return 'Completed much faster than estimated';
    } else if (factor < 0.9) {
      return 'Completed faster than estimated';
    } else if (factor <= 1.1) {
      return 'Estimate was accurate';
    } else if (factor <= 1.3) {
      return 'Took longer than estimated';
    } else {
      return 'Took much longer than estimated';
    }
  }

  private calculateOverallComplexity(
    project: ProjectEstimation
  ): 'low' | 'medium' | 'high' | 'very-high' {
    const complexityScores = {
      low: 1,
      medium: 2,
      high: 3,
      'very-high': 4,
    };

    const avgScore =
      project.steps.reduce((sum, step) => sum + complexityScores[step.complexity], 0) /
      project.steps.length;

    if (avgScore < 1.5) return 'low';
    if (avgScore < 2.5) return 'medium';
    if (avgScore < 3.5) return 'high';
    return 'very-high';
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI Estimator MCP Server running on stdio');
  }
}

// ============================================================================
// START SERVER
// ============================================================================

const server = new AIEstimatorMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});


