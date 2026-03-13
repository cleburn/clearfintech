export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Timestamp = string;

export interface AuditEntry {
  id: string;
  timestamp: Timestamp;
  actor: string;
  action: string;
  domain: string;
  resourceType: string;
  resourceId: string;
  details: string;
  outcome: "success" | "failure" | "denied";
}
