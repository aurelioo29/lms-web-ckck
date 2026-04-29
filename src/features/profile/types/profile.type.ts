export type ProfileRole = {
  role: {
    id: string;
    name: string;
    description: string | null;
  };
};

export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  status: string;
  createdAt: Date;
  roles: ProfileRole[];
};
