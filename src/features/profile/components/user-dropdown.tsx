"use client";

import Link from "next/link";
import { Dropdown, Modal } from "antd";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

type UserDropdownProps = {
  userName: string;
};

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
}

export default function UserDropdown({ userName }: UserDropdownProps) {
  const [modal, contextHolder] = Modal.useModal();

  function confirmLogout() {
    modal.confirm({
      title: "Logout dari sistem?",
      content: "Session kamu akan berakhir.",
      okText: "Ya, Logout",
      cancelText: "Batal",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        await signOut({
          callbackUrl: "/login",
        });
      },
    });
  }

  return (
    <>
      {contextHolder}

      <Dropdown
        placement="bottomRight"
        menu={{
          items: [
            {
              key: "profile",
              icon: <User size={15} />,
              label: <Link href="/dashboard/profile">Profile</Link>,
            },
            {
              key: "logout",
              icon: <LogOut size={15} />,
              label: "Logout",
              onClick: confirmLogout,
            },
          ],
        }}
      >
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600"
          title={userName}
        >
          {getInitial(userName)}
        </button>
      </Dropdown>
    </>
  );
}
