const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${path}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

// ─── 프로젝트 ───────────────────────────────────────────────
export const projectsApi = {
  list: () => apiFetch<Project[]>('/api/projects'),
  get: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
  create: (data: CreateProjectRequest) =>
    apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateProjectRequest>) =>
    apiFetch<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  sync: (id: string) =>
    apiFetch<{ status: string }>(`/api/projects/${id}/sync`, { method: 'POST' }),
};

// ─── 컴포넌트 ───────────────────────────────────────────────
export const componentsApi = {
  list: (projectId: string) =>
    apiFetch<Component[]>(`/api/projects/${projectId}/components`),
  get: (componentId: string) =>
    apiFetch<Component>(`/api/components/${componentId}`),
  resolve: (data: ResolveRequest) =>
    apiFetch<Component>('/api/components/resolve', { method: 'POST', body: JSON.stringify(data) }),
  scan: (projectId: string, data: ScanData) =>
    apiFetch<{ scanId: string }>(`/api/projects/${projectId}/scan`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── 정책 ───────────────────────────────────────────────────
export const policiesApi = {
  listByComponent: (componentId: string) =>
    apiFetch<Policy[]>(`/api/components/${componentId}/policies`),
  search: (query: string, projectId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (projectId) params.set('projectId', projectId);
    return apiFetch<Policy[]>(`/api/policies/search?${params.toString()}`);
  },
  create: (data: CreatePolicyRequest) =>
    apiFetch<Policy>('/api/policies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdatePolicyRequest) =>
    apiFetch<Policy>(`/api/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch<void>(`/api/policies/${id}`, { method: 'DELETE' }),
  history: (id: string) =>
    apiFetch<PolicyVersion[]>(`/api/policies/${id}/history`),
  impact: (policyId: string) =>
    apiFetch<PolicyImpact>(`/api/policies/${policyId}/impact`),
  override: (policyId: string, componentId: string, overrideContent: string) =>
    apiFetch<void>(`/api/policies/${policyId}/links`, {
      method: 'POST',
      body: JSON.stringify({ componentId, overrideContent, linkType: 'OVERRIDE' }),
    }),
  consistencyCheck: (projectId: string) =>
    apiFetch<PolicyConsistencyResult>(`/api/policies/consistency-check?projectId=${projectId}`),
};

// ─── 변경 요청 ───────────────────────────────────────────────
export const changeRequestsApi = {
  list: () => apiFetch<ChangeRequest[]>('/api/change-requests'),
  get: (id: string) => apiFetch<ChangeRequest>(`/api/change-requests/${id}`),
  create: (data: CreateChangeRequestRequest) =>
    apiFetch<ChangeRequest>('/api/change-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateChangeRequestRequest) =>
    apiFetch<ChangeRequest>(`/api/change-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  analyze: (id: string) =>
    apiFetch<{ queueId: string }>(`/api/change-requests/${id}/analyze`, { method: 'POST' }),
  status: (id: string) =>
    apiFetch<{ status: string; queueId?: string }>(`/api/change-requests/${id}/status`),
  getTodos: (id: string) =>
    apiFetch<Todo[]>(`/api/change-requests/${id}/todos`),
  complete: (id: string) =>
    apiFetch<ChangeRequest>(`/api/change-requests/${id}/complete`, { method: 'POST' }),
};

// ─── TODO ────────────────────────────────────────────────────
export const todosApi = {
  list: (filter?: { status?: string; projectId?: string }) => {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.projectId) params.set('projectId', filter.projectId);
    return apiFetch<Todo[]>(`/api/todos?${params.toString()}`);
  },
  pending: () => apiFetch<Todo[]>('/api/todos/pending'),
  update: (id: string, data: { status: string }) =>
    apiFetch<Todo>(`/api/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getPrompt: (id: string) =>
    apiFetch<{ todoId: string; prompt: string }>(`/api/todos/${id}/prompt`),
  export: (todoIds: string[]) =>
    apiFetch<{ markdown: string; todos: Todo[] }>('/api/todos/export', {
      method: 'POST',
      body: JSON.stringify({ todoIds }),
    }),
};

// ─── 기획서 ──────────────────────────────────────────────────
export const plansApi = {
  list: (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiFetch<ScreenPlan[]>(`/api/plans${params}`);
  },
  get: (planId: string) => apiFetch<ScreenPlan>(`/api/plans/${planId}`),
  create: (data: CreateScreenPlanRequest) =>
    apiFetch<ScreenPlan>('/api/plans', { method: 'POST', body: JSON.stringify(data) }),
  update: (planId: string, data: Partial<CreateScreenPlanRequest> & { status?: string }) =>
    apiFetch<ScreenPlan>(`/api/plans/${planId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (planId: string) =>
    apiFetch<void>(`/api/plans/${planId}`, { method: 'DELETE' }),
  analyze: (planId: string) =>
    apiFetch<{ queueId: string }>(`/api/plans/${planId}/analyze`, { method: 'POST', body: JSON.stringify({ analysisType: 'NEW_PLAN' }) }),
  validate: (planId: string) =>
    apiFetch<{ queueId: string }>(`/api/plans/${planId}/validate`, { method: 'POST', body: JSON.stringify({ analysisType: 'CONFLICT_CHECK' }) }),
  generate: (planId: string) =>
    apiFetch<{ queueId: string }>(`/api/plans/${planId}/generate`, { method: 'POST', body: JSON.stringify({ analysisType: 'GENERATE_SPEC' }) }),
  status: (planId: string, analysisType: string) =>
    apiFetch<{ status: string; queueId?: string }>(`/api/plans/${planId}/status?analysisType=${analysisType}`),
  export: async (planId: string): Promise<string> => {
    const res = await fetch(`${API_URL}/api/plans/${planId}/export`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API Error ${res.status}: /api/plans/${planId}/export`);
    return res.text();
  },
};

// ─── 컴포넌트 템플릿 ──────────────────────────────────────────
export const templatesApi = {
  listByProject: (projectId: string) =>
    apiFetch<ComponentTemplate[]>(`/api/projects/${projectId}/templates`),
  get: (templateId: string) => apiFetch<ComponentTemplate>(`/api/templates/${templateId}`),
  create: (data: CreateTemplateRequest) =>
    apiFetch<ComponentTemplate>('/api/templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (templateId: string, data: Partial<CreateTemplateRequest>) =>
    apiFetch<ComponentTemplate>(`/api/templates/${templateId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (templateId: string) =>
    apiFetch<void>(`/api/templates/${templateId}`, { method: 'DELETE' }),
  use: (templateId: string) =>
    apiFetch<void>(`/api/templates/${templateId}/use`, { method: 'POST' }),
};

// ─── 유효성 규칙 ──────────────────────────────────────────────
export const validationRulesApi = {
  list: (policyId: string) => apiFetch<ValidationRule[]>(`/api/policies/${policyId}/rules`),
  save: (policyId: string, rules: ValidationRule[]) =>
    apiFetch<ValidationRule[]>(`/api/policies/${policyId}/rules`, {
      method: 'PUT', body: JSON.stringify(rules),
    }),
};

// ─── AI 정책 추천 ─────────────────────────────────────────────
export const aiApi = {
  recommendPolicyType: (description: string): Promise<PolicyTypeRecommendation> =>
    apiFetch('/api/ai/recommend-policy-type', {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),
  toPrompt: (policyId: string): Promise<{ prompt: string }> =>
    apiFetch(`/api/policies/${policyId}/to-prompt`, { method: 'POST' }),
  toCode: (policyId: string): Promise<{ code: string }> =>
    apiFetch(`/api/policies/${policyId}/to-code`, { method: 'POST' }),
};

// ─── 타입 정의 ───────────────────────────────────────────────
export interface Project {
  projectId: string;
  projectName: string;
  projectDesc?: string;
  repoUrl?: string;
  baseUrl?: string;
  framework: string;
  status: string;
  syncStatus: string;
  lastSyncedAt?: string;
  repoBranch: string;
}

export interface Component {
  componentId: string;
  pbId: string;
  componentName: string;
  componentType: string;
  elementTag?: string;
  elementRole?: string;
  currentText?: string;
  currentSpec?: string;
  depthLevel: number;
  treePath?: string;
  status: string;
  children?: Component[];
}

export interface Policy {
  policyId: string;
  policyType: string;
  policyTitle: string;
  policyContent: string;
  scope: string;
  tags?: string;
  currentVersion: number;
  status: string;
  createdBy: string;
  createdAt: string;
  linkType?: string;
}

export interface PolicyVersion {
  versionId: string;
  versionNo: number;
  policyContent: string;
  changeReason?: string;
  createdBy: string;
  createdAt: string;
}

export interface ChangeRequest {
  requestId: string;
  componentId?: string;
  componentName?: string;
  componentDescription?: string;
  title: string;
  description: string;
  currentState?: string;
  desiredState?: string;
  priority: string;
  status: string;
  requestedBy: string;
  aiAnalysis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  todoId: string;
  requestId?: string;
  title: string;
  prompt: string;
  targetFiles?: string;
  complexity: string;
  sortOrder: number;
  dependencies?: string;
  status: string;
  testResult?: string;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PolicyTypeRecommendation {
  recommendedType: string;
  confidence: number;
  reason: string;
  alternatives: Array<{ type: string; reason: string }>;
}

export interface CreateProjectRequest {
  projectName: string;
  projectDesc?: string;
  repoUrl?: string;
  baseUrl?: string;
  framework?: string;
  repoBranch?: string;
  repoToken?: string;
  createdBy: string;
}

export interface ResolveRequest {
  pbId?: string;
  componentName?: string;
  cssSelector?: string;
  pageRoute: string;
  projectId: string;
}

export interface ScanData {
  pageRoute: string;
  pageTitle?: string;
  components: Array<{
    pbId: string;
    componentName: string;
    componentType: string;
    cssSelector?: string;
    elementTag?: string;
    elementRole?: string;
    currentProps?: string;
    currentText?: string;
    parentPbId?: string;
    reactHierarchy?: string;
  }>;
  scannedBy?: string;
}

export interface CreatePolicyRequest {
  projectId: string;
  scope: string;
  pageId?: string;
  componentId?: string;
  policyType: string;
  policyTitle: string;
  policyContent: string;
  tags?: string;
  createdBy: string;
}

export interface UpdatePolicyRequest {
  policyTitle?: string;
  policyContent?: string;
  tags?: string;
  changeReason?: string;
  updatedBy: string;
}

export interface ScreenPlan {
  planId: string;
  planTitle: string;
  routePath?: string;
  description?: string;
  fullSpec?: string;
  aiSuggestion?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScreenPlanRequest {
  projectId: string;
  planTitle: string;
  routePath?: string;
  description?: string;
  createdBy: string;
}

export interface CreateChangeRequestRequest {
  componentId?: string;
  componentDescription?: string;
  requestedBy: string;
  title: string;
  description: string;
  currentState?: string;
  desiredState?: string;
  priority?: string;
}

export interface UpdateChangeRequestRequest {
  status?: string;
  priority?: string;
  title?: string;
  description?: string;
}

export interface ComponentTemplate {
  templateId: string;
  projectId: string;
  templateName: string;
  componentType: string;
  description?: string;
  templateJson?: string;
  policyTags?: string;
  usageCount: number;
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateTemplateRequest {
  projectId: string;
  templateName: string;
  componentType: string;
  description?: string;
  templateJson?: string;
  policyTags?: string;
  createdBy: string;
}

export interface ValidationRule {
  ruleId?: string;
  ruleType: string;
  fieldName?: string;
  ruleValue?: string;
  errorMessage?: string;
  sortOrder?: number;
}

export interface PolicyImpact {
  scope: string;
  affectedCount: number;
  affectedComponents: Array<{ componentId: string; componentName: string; pagePath?: string }>;
}

export interface PolicyConsistencyIssue {
  policyId: string;
  policyTitle: string;
  issueType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PolicyConsistencyResult {
  projectId: string;
  checkedAt: string;
  totalPolicies: number;
  issueCount: number;
  issues: PolicyConsistencyIssue[];
}

