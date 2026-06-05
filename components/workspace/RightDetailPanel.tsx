interface DetailItem {
  label: string;
  value: string | number;
}

interface RightDetailPanelProps {
  title: string;
  items: DetailItem[];
}

export default function RightDetailPanel({
  title,
  items,
}: RightDetailPanelProps) {
  return (
    <aside className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        {title}
      </h2>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between border-b border-gray-100 pb-2"
          >
            <span className="text-xs text-gray-500">
              {item.label}
            </span>

            <span className="text-sm font-medium text-gray-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}