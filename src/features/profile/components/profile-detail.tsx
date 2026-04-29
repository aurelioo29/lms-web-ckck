import { Card, Descriptions, Tag } from "antd";

import type { ProfileUser } from "../types/profile.type";

type ProfileDetailProps = {
  user: ProfileUser;
};

export default function ProfileDetail({ user }: ProfileDetailProps) {
  return (
    <Card>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">{user.name}</Descriptions.Item>

        <Descriptions.Item label="Username">{user.username}</Descriptions.Item>

        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>

        <Descriptions.Item label="Phone">{user.phone || "-"}</Descriptions.Item>

        <Descriptions.Item label="Bio">{user.bio || "-"}</Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={user.status === "ACTIVE" ? "green" : "orange"}>
            {user.status}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Role">
          {user.roles.length > 0
            ? user.roles.map((item) => (
                <Tag key={item.role.id} color="blue">
                  {item.role.name}
                </Tag>
              ))
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
