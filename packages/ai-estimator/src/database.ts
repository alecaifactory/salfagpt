import type {
  ProjectEstimation,
  StepExecution,
  HistoricalDataPoint,
  CalibrationModel,
} from './types.js';

// ============================================================================
// DATABASE INTERFACE (Firestore)
// ============================================================================

export interface DatabaseAdapter {
  // Projects
  createProject(project: ProjectEstimation): Promise<string>;
  getProject(id: string): Promise<ProjectEstimation | null>;
  updateProject(id: string, updates: Partial<ProjectEstimation>): Promise<void>;
  listProjects(userId: string, status?: string): Promise<ProjectEstimation[]>;
  
  // Executions
  createExecution(execution: StepExecution): Promise<string>;
  getExecution(id: string): Promise<StepExecution | null>;
  listExecutions(projectId: string): Promise<StepExecution[]>;
  updateExecution(id: string, updates: Partial<StepExecution>): Promise<void>;
  
  // Historical data
  createDataPoint(dataPoint: HistoricalDataPoint): Promise<string>;
  getDataPoints(filters: {
    userId?: string;
    organizationId?: string;
    projectType?: string;
    complexity?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<HistoricalDataPoint[]>;
  
  // Calibration
  saveCalibrationModel(model: CalibrationModel): Promise<string>;
  getLatestCalibrationModel(
    userId?: string,
    organizationId?: string
  ): Promise<CalibrationModel | null>;
}

// ============================================================================
// FIRESTORE IMPLEMENTATION
// ============================================================================

export class FirestoreAdapter implements DatabaseAdapter {
  private db: any; // FirebaseFirestore.Firestore

  constructor(firestoreInstance: any) {
    this.db = firestoreInstance;
  }

  // --------------------------------------------------------------------------
  // Projects
  // --------------------------------------------------------------------------

  async createProject(project: ProjectEstimation): Promise<string> {
    const docRef = await this.db.collection('ai_estimator_projects').add({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    });
    return docRef.id;
  }

  async getProject(id: string): Promise<ProjectEstimation | null> {
    const doc = await this.db.collection('ai_estimator_projects').doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as ProjectEstimation;
  }

  async updateProject(
    id: string,
    updates: Partial<ProjectEstimation>
  ): Promise<void> {
    await this.db
      .collection('ai_estimator_projects')
      .doc(id)
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
  }

  async listProjects(
    userId: string,
    status?: string
  ): Promise<ProjectEstimation[]> {
    let query: any = this.db
      .collection('ai_estimator_projects')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
      createdAt: new Date(doc.data().createdAt),
      updatedAt: new Date(doc.data().updatedAt),
    }));
  }

  // --------------------------------------------------------------------------
  // Executions
  // --------------------------------------------------------------------------

  async createExecution(execution: StepExecution): Promise<string> {
    const docRef = await this.db.collection('ai_estimator_executions').add({
      ...execution,
      startedAt: execution.startedAt.toISOString(),
      completedAt: execution.completedAt?.toISOString(),
    });
    return docRef.id;
  }

  async getExecution(id: string): Promise<StepExecution | null> {
    const doc = await this.db.collection('ai_estimator_executions').doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      startedAt: new Date(data.startedAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
    } as StepExecution;
  }

  async listExecutions(projectId: string): Promise<StepExecution[]> {
    const snapshot = await this.db
      .collection('ai_estimator_executions')
      .where('projectId', '==', projectId)
      .orderBy('startedAt', 'asc')
      .get();

    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
      startedAt: new Date(doc.data().startedAt),
      completedAt: doc.data().completedAt
        ? new Date(doc.data().completedAt)
        : undefined,
    }));
  }

  async updateExecution(
    id: string,
    updates: Partial<StepExecution>
  ): Promise<void> {
    const processedUpdates: any = { ...updates };
    
    if (updates.startedAt) {
      processedUpdates.startedAt = updates.startedAt.toISOString();
    }
    if (updates.completedAt) {
      processedUpdates.completedAt = updates.completedAt.toISOString();
    }

    await this.db
      .collection('ai_estimator_executions')
      .doc(id)
      .update(processedUpdates);
  }

  // --------------------------------------------------------------------------
  // Historical Data
  // --------------------------------------------------------------------------

  async createDataPoint(dataPoint: HistoricalDataPoint): Promise<string> {
    const docRef = await this.db.collection('ai_estimator_historical').add({
      ...dataPoint,
      completedAt: dataPoint.completedAt.toISOString(),
    });
    return docRef.id;
  }

  async getDataPoints(filters: {
    userId?: string;
    organizationId?: string;
    projectType?: string;
    complexity?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<HistoricalDataPoint[]> {
    let query: any = this.db.collection('ai_estimator_historical');

    if (filters.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    if (filters.organizationId) {
      query = query.where('organizationId', '==', filters.organizationId);
    }
    if (filters.projectType) {
      query = query.where('projectType', '==', filters.projectType);
    }
    if (filters.complexity) {
      query = query.where('complexity', '==', filters.complexity);
    }
    if (filters.fromDate) {
      query = query.where(
        'completedAt',
        '>=',
        filters.fromDate.toISOString()
      );
    }
    if (filters.toDate) {
      query = query.where('completedAt', '<=', filters.toDate.toISOString());
    }

    query = query.orderBy('completedAt', 'desc');

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
      completedAt: new Date(doc.data().completedAt),
    }));
  }

  // --------------------------------------------------------------------------
  // Calibration
  // --------------------------------------------------------------------------

  async saveCalibrationModel(model: CalibrationModel): Promise<string> {
    const docRef = await this.db.collection('ai_estimator_calibration').add({
      ...model,
      lastUpdated: model.lastUpdated.toISOString(),
    });
    return docRef.id;
  }

  async getLatestCalibrationModel(
    userId?: string,
    organizationId?: string
  ): Promise<CalibrationModel | null> {
    let query: any = this.db
      .collection('ai_estimator_calibration')
      .orderBy('lastUpdated', 'desc')
      .limit(1);

    // Note: For user/org specific models, we'd need to store those fields
    // and filter accordingly. For now, returning global model.

    const snapshot = await query.get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      ...data,
      id: doc.id,
      lastUpdated: new Date(data.lastUpdated),
    } as CalibrationModel;
  }
}

// ============================================================================
// IN-MEMORY ADAPTER (for testing / CLI without Firestore)
// ============================================================================

export class InMemoryAdapter implements DatabaseAdapter {
  private projects: Map<string, ProjectEstimation> = new Map();
  private executions: Map<string, StepExecution> = new Map();
  private dataPoints: HistoricalDataPoint[] = [];
  private calibrationModels: CalibrationModel[] = [];

  async createProject(project: ProjectEstimation): Promise<string> {
    const id = `project-${Date.now()}-${Math.random()}`;
    this.projects.set(id, { ...project, id });
    return id;
  }

  async getProject(id: string): Promise<ProjectEstimation | null> {
    return this.projects.get(id) || null;
  }

  async updateProject(
    id: string,
    updates: Partial<ProjectEstimation>
  ): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      this.projects.set(id, {
        ...project,
        ...updates,
        updatedAt: new Date(),
      });
    }
  }

  async listProjects(
    userId: string,
    status?: string
  ): Promise<ProjectEstimation[]> {
    return Array.from(this.projects.values())
      .filter(
        (p) => p.userId === userId && (!status || p.status === status)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createExecution(execution: StepExecution): Promise<string> {
    const id = `execution-${Date.now()}-${Math.random()}`;
    this.executions.set(id, { ...execution, id });
    return id;
  }

  async getExecution(id: string): Promise<StepExecution | null> {
    return this.executions.get(id) || null;
  }

  async listExecutions(projectId: string): Promise<StepExecution[]> {
    return Array.from(this.executions.values())
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }

  async updateExecution(
    id: string,
    updates: Partial<StepExecution>
  ): Promise<void> {
    const execution = this.executions.get(id);
    if (execution) {
      this.executions.set(id, { ...execution, ...updates });
    }
  }

  async createDataPoint(dataPoint: HistoricalDataPoint): Promise<string> {
    const id = `datapoint-${Date.now()}-${Math.random()}`;
    this.dataPoints.push({ ...dataPoint, id });
    return id;
  }

  async getDataPoints(filters: {
    userId?: string;
    organizationId?: string;
    projectType?: string;
    complexity?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<HistoricalDataPoint[]> {
    let filtered = this.dataPoints;

    if (filters.userId) {
      filtered = filtered.filter((p) => p.userId === filters.userId);
    }
    if (filters.organizationId) {
      filtered = filtered.filter(
        (p) => p.organizationId === filters.organizationId
      );
    }
    if (filters.projectType) {
      filtered = filtered.filter((p) => p.projectType === filters.projectType);
    }
    if (filters.complexity) {
      filtered = filtered.filter((p) => p.complexity === filters.complexity);
    }
    if (filters.fromDate) {
      filtered = filtered.filter(
        (p) => p.completedAt >= filters.fromDate!
      );
    }
    if (filters.toDate) {
      filtered = filtered.filter((p) => p.completedAt <= filters.toDate!);
    }

    filtered.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  async saveCalibrationModel(model: CalibrationModel): Promise<string> {
    const id = `calibration-${Date.now()}-${Math.random()}`;
    this.calibrationModels.push({ ...model, id });
    return id;
  }

  async getLatestCalibrationModel(): Promise<CalibrationModel | null> {
    if (this.calibrationModels.length === 0) return null;

    return this.calibrationModels.sort(
      (a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()
    )[0];
  }
}

