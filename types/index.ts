// PlanBridge 공통 타입 정의 (Oracle DB 스키마 기반)

export interface Project {
  projectId: string;
  projectName: string;
  projectDesc?: string;
  repoUrl?: string;
  baseUrl?: string;
  framework: "NEXTJS" | "REACT" | "VUE";
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  pageId: string;
  projectId: string;
  routePath: string;
  pageTitle?: string;
  filePath?: string;
  layoutPath?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Component {
  componentId: string;
  pageId: string;
  parentId?: string;
  pbId: string;
  componentName: string;
  cssSelector?: string;
  componentType: "PAGE_ROOT" | "LAYOUT" | "SECTION" | "COMPONENT" | "ELEMENT";
  elementTag?: string;
  elementRole?: string;
  currentProps?: Record<string, unknown>;
  currentText?: string;
  currentSpec?: string;
  depthLevel: number;
  sortOrder: number;
  treePath?: string;
  reactHierarchy?: string[];
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export type PolicyType =
  | "UI_SPEC"
  | "INTERACTION"
  | "VALIDATION"
  | "BIZ_RULE"
  | "DATA_SPEC"
  | "PERMISSION";

export type PolicyScope = "GLOBAL" | "PAGE" | "COMPONENT" | "ELEMENT";

export interface Policy {
  policyId: string;
  projectId: string;
  scope: PolicyScope;
  pageId?: string;
  componentId?: string;
  policyType: PolicyType;
  policyTitle: string;
  policyContent: string;
  policySchema?: Record<string, unknown>;
  tags?: string;
  currentVersion: number;
  status: "ACTIVE" | "DEPRECATED" | "DRAFT" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
}

export type ChangeRequestStatus =
  | "DRAFT"
  | "AI_PROCESSING"
  | "READY"
  | "IN_PROGRESS"
  | "TESTING"
  | "DONE"
  | "REJECTED";

export interface ChangeRequest {
  requestId: string;
  componentId: string;
  requestedBy: string;
  title: string;
  description: string;
  currentState?: string;
  desiredState?: string;
  aiAnalysis?: Record<string, unknown>;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: ChangeRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  todoId: string;
  requestId: string;
  title: string;
  prompt: string;
  targetFiles?: string[];
  complexity: "SIMPLE" | "MODERATE" | "COMPLEX";
  sortOrder: number;
  dependencies?: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  testResult?: string;
  completedBy?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ScanHistory {
  scanId: string;
  projectId: string;
  pageId?: string;
  scanType: "FULL_SCAN" | "PAGE_SCAN" | "PARTIAL_SCAN";
  componentCount: number;
  newCount: number;
  changedCount: number;
  removedCount: number;
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS";
  scannedBy?: string;
  scannedAt: string;
}
