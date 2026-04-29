export type UserItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  bio: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  roles: {
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
};

export type UsersResponse = {
  data: UserItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type RoleOption = {
  id: string;
  name: string;
};
