export type UserApprovalItem = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    status: string;
    createdAt: string;
  };
};

export type UserApprovalsResponse = {
  data: UserApprovalItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
