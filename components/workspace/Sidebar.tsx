"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const projectMenus = [
  {
    label: "진행중인 프로젝트",
    href: "/workspace/partner",
  },
  {
    label: "완료된 프로젝트",
    href: "/workspace/partner/completed",
  },
];

const productionMenus = [
  {
    label: "Workspace",
    href: "/workspace/partner/production",
  },
  {
    label: "품목별 상세관리",
    href: "/workspace/partner/production/items",
  },
  {
    label: "공정별 상세관리",
    href: "/workspace/partner/production/process",
  },
];

const qualityMenus = [
  {
    label: "WORKSPACE",
    href: "/workspace/partner/quality",
  },
  {
    label: "검사관리",
    href: "/workspace/partner/quality/inspection",
  },
  {
    label: "NCR 관리",
    href: "/workspace/partner/quality/ncr",
  },
];

const shipmentMenus = [
  {
    label: "WORKSPACE",
    href: "/workspace/partner/shipment",
  },
  {
    label: "출하관리",
    href: "/workspace/partner/shipment/items",
  },
];

const settlementMenus = [
  {
    label: "WORKSPACE",
    href: "/workspace/partner/settlement",
  },
  {
    label: "정산현황",
    href: "/workspace/partner/settlement/items",
  },
];

const mainMenuItemsBeforeProduction = [
  {
    label: "입찰관리",
    href: "/workspace/partner/bids",
  },
  {
    label: "발주관리",
    href: "/workspace/partner/orders",
  },
];

const mainMenuItemsAfterSettlement = [
  {
    label: "문서관리",
    href: "/workspace/partner/documents",
  },
  {
    label: "이력관리",
    href: "/workspace/partner/logs",
  },
];

const bottomMenuItems = [
  {
    label: "알림",
    href: "/workspace/partner/notifications",
    badge: 6,
  },
  {
    label: "설정",
    href: "/workspace/partner/settings",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/workspace/partner") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();

  const [projectOpen, setProjectOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);

  useEffect(() => {
    setProjectOpen(
      pathname === "/workspace/partner" ||
        pathname.startsWith("/workspace/partner/completed")
    );

    setProductionOpen(pathname.startsWith("/workspace/partner/production"));
    setQualityOpen(pathname.startsWith("/workspace/partner/quality"));
    setShipmentOpen(pathname.startsWith("/workspace/partner/shipment"));
    setSettlementOpen(pathname.startsWith("/workspace/partner/settlement"));
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-950 text-white">
      <div className="px-6 py-6">
        <Link href="/workspace/partner" className="block">
          <div className="text-5xl font-black tracking-tight text-blue-500">
            G1
          </div>

          <div className="mt-2 text-sm font-bold leading-5 text-slate-100">
            Manufacturing
            <br />
            Partner OS
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setProjectOpen(!projectOpen)}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
        >
          프로젝트
        </button>

        {projectOpen ? (
          <div className="mb-3 mt-1 space-y-1 pl-3">
            {projectMenus.map((menu) => {
              const active = pathname === menu.href;

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={[
                    "block rounded-lg px-3 py-2 text-sm font-bold transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-100 hover:bg-slate-800 hover:text-white",
                  ].join(" ")}
                >
                  {menu.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        <div className="space-y-1">
          {mainMenuItemsBeforeProduction.map((item) => {
            const active = isActivePath(pathname, item.href);

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
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setProductionOpen(!productionOpen)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            생산관리
          </button>

          {productionOpen ? (
            <div className="mb-3 mt-1 space-y-1 pl-3">
              {productionMenus.map((menu) => {
                const active = pathname === menu.href;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-bold transition",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-100 hover:bg-slate-800 hover:text-white",
                    ].join(" ")}
                  >
                    {menu.label}
                  </Link>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setQualityOpen(!qualityOpen)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            품질관리
          </button>

          {qualityOpen ? (
            <div className="mb-3 mt-1 space-y-1 pl-3">
              {qualityMenus.map((menu) => {
                const active = pathname === menu.href;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-bold transition",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-100 hover:bg-slate-800 hover:text-white",
                    ].join(" ")}
                  >
                    {menu.label}
                  </Link>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setShipmentOpen(!shipmentOpen)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            출하관리
          </button>

          {shipmentOpen ? (
            <div className="mb-3 mt-1 space-y-1 pl-3">
              {shipmentMenus.map((menu) => {
                const active = pathname === menu.href;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-bold transition",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-100 hover:bg-slate-800 hover:text-white",
                    ].join(" ")}
                  >
                    {menu.label}
                  </Link>
                );
              })}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setSettlementOpen(!settlementOpen)}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white transition hover:bg-slate-800"
          >
            정산관리
          </button>

          {settlementOpen ? (
            <div className="mb-3 mt-1 space-y-1 pl-3">
              {settlementMenus.map((menu) => {
                const active = pathname === menu.href;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-bold transition",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-100 hover:bg-slate-800 hover:text-white",
                    ].join(" ")}
                  >
                    {menu.label}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {mainMenuItemsAfterSettlement.map((item) => {
            const active = isActivePath(pathname, item.href);

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
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="rounded-lg px-2 py-2">
          <div className="text-sm font-bold text-white">DEF Tech Partner</div>
          <div className="mt-1 text-xs font-medium text-slate-200">
            Manufacturing Partner
          </div>
        </div>

        <Link
          href="/login"
          className="mt-2 block rounded-lg px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          로그아웃
        </Link>
      </div>
    </aside>
  );
}