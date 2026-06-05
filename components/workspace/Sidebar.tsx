import Link from "next/link";

const menuItems = [
  { label: "프로젝트", href: "/workspace/partner" },
  { label: "입찰관리", href: "/workspace/partner/bids" },
  { label: "발주관리", href: "/workspace/partner/orders" },
  { label: "생산관리", href: "/workspace/partner/production" },
  { label: "품질관리", href: "/workspace/partner/quality" },
  { label: "출하관리", href: "/workspace/partner/shipment" },
  { label: "문서관리", href: "/workspace/partner/documents" },
  { label: "정산관리", href: "/workspace/partner/settlement" },
  { label: "이력관리", href: "/workspace/partner/logs" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <div className="text-xl font-bold text-gray-900">G1</div>
        <div className="mt-1 text-xs text-gray-500">
          Manufacturing Partner OS
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}