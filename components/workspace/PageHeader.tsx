interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {title}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="검색..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <button className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          필터
        </button>
      </div>
    </div>
  );
}