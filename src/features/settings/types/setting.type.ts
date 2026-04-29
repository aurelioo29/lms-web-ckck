export type SettingItem = {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SettingsResponse = {
  data: SettingItem[];
};
