export type ActivityLogItem = {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  oldData: unknown;
  newData: unknown;
  metadata: unknown;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
};

export type ActivityLogsResponse = {
  data: ActivityLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
