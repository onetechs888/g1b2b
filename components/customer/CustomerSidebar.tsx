"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Gavel,
  History,
  LogOut,
  ReceiptText,
  Settings,
  ShoppingCart,
} from "lucide-react";

type SubMenuItem = {
  label: string;
  href: string;
};

const projectMenus: SubMenuItem[] = [
  {
    label: "진행중인 프로젝트",
    href: "/workspace/customer",
  },
  {
    label: "완료된 프로젝트",
    href: "/workspace/customer/completed",
  },
];

const biddingMenus: SubMenuItem[] = [
  {
    label: "입찰현황",
    href: "/workspace/customer/bidding",
  },
  {
    label: "입찰요청",
    href: "/workspace/customer/bidding/request",
  },
];

const orderMenus: SubMenuItem[] = [
  {
    label: "발주현황",
    href: "/workspace/customer/orders",
  },
  {
    label: "발주등록",
    href: "/workspace/customer/orders/request",
  },
];

const settlementMenus: SubMenuItem[] = [
  {
    label: "정산현황",
    href: "/workspace/customer/settlement",
  },
  {
    label: "입금관리",
    href: "/workspace/customer/settlement/payment",
  },
];

const mainMenuItems = [
  {
    label: "문서관리",
    href: "/workspace/customer/documents",
    icon: FileText,
  },
  {
    label: "이력관리",
    href: "/workspace/customer/logs",
    icon: History,
  },
];

const bottomMenuItems = [
  {
    label: "알림센터",
    href: "/workspace/customer/notifications",
    badge: 0,
    icon: Bell,
  },
  {
    label: "설정",
    href: "/workspace/customer/settings",
    badge: 0,
    icon: Settings,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/workspace/customer") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SubMenu({
  pathname,
  menus,
}: {
  pathname: string;
  menus: SubMenuItem[];
}) {
  return (
    <div className="mb-3 mt-1 space-y-1 pl-3">
      {menus.map((menu) => {
        const active = pathname === menu.href;

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={[
              "block rounded-lg px-3 py-2 text-sm font-bold transition",
              active
                ? "bg-blue-600 text-white"
                : "text-slate-200 hover:bg-slate-800 hover:text-white",
            ].join(" ")}
          >
            {menu.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function CustomerSidebar() {
  const pathname = usePathname();

  const [projectOpen, setProjectOpen] = useState(false);
  const [biddingOpen, setBiddingOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);

  useEffect(() => {
    setProjectOpen(
      pathname === "/workspace/customer" ||
        pathname.startsWith("/workspace/customer/completed")
    );

    setBiddingOpen(pathname.startsWith("/workspace/customer/bidding"));
    setOrderOpen(pathname.startsWith("/workspace/customer/orders"));
    setSettlementOpen(pathname.startsWith("/workspace/customer/settlement"));
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-950 text-white">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/workspace/customer" className="block">
          <div className="text-5xl font-black tracking-tight text-blue-500">
            G1
          </div>

          <div className="mt-2 text-sm font-bold leading-5 text-slate-100">
            Customer
            <br />
            Workspace
          </div>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 프로젝트 */}
        <button
          type="button"
          onClick={() => setProjectOpen((previous) => !previous)}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} />
              <span>프로젝트</span>
            </div>

            {projectOpen ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )}
          </div>
        </button>

        {projectOpen ? (
          <SubMenu pathname={pathname} menus={projectMenus} />
        ) : null}

        <div className="space-y-1">
          {/* 입찰관리 */}
          <button
            type="button"
            onClick={() => setBiddingOpen((previous) => !previous)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel size={16} />
                <span>입찰관리</span>
              </div>

              {biddingOpen ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </div>
          </button>

          {biddingOpen ? (
            <SubMenu pathname={pathname} menus={biddingMenus} />
          ) : null}

          {/* 발주관리 */}
          <button
            type="button"
            onClick={() => setOrderOpen((previous) => !previous)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} />
                <span>발주관리</span>
              </div>

              {orderOpen ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </div>
          </button>

          {orderOpen ? (
            <SubMenu pathname={pathname} menus={orderMenus} />
          ) : null}

          {/* 문서관리 / 이력관리 */}
          {mainMenuItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "block rounded-lg px-3 py-2.5 text-sm font-bold transition",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-white hover:bg-slate-800",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}

          {/* 정산관리 */}
          <button
            type="button"
            onClick={() => setSettlementOpen((previous) => !previous)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText size={16} />
                <span>정산관리</span>
              </div>

              {settlementOpen ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </div>
          </button>

          {settlementOpen ? (
            <SubMenu pathname={pathname} menus={settlementMenus} />
          ) : null}
        </div>
      </nav>

      {/* Bottom navigation */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="rounded-lg px-2 py-2">
          <div className="text-sm font-bold text-white">Customer Company</div>

          <div className="mt-1 text-xs font-medium text-slate-300">
            Project Monitoring
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {bottomMenuItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-white hover:bg-slate-800",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-black text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <LogOut size={16} />
            <span>로그아웃</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}