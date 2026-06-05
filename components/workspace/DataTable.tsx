import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface Column {
  key: string;
  label: string;
  type?: "text" | "status" | "progress" | "link";
  hrefPrefix?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
}

export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b px-4 py-3 text-left text-xs font-semibold text-gray-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              {columns.map((column) => {
                const value = row[column.key];

                if (column.type === "status") {
                  return (
                    <td key={column.key} className="px-4 py-3">
                      <StatusBadge status={String(value)} />
                    </td>
                  );
                }

                if (column.type === "progress") {
                  return (
                    <td key={column.key} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{value}%</span>
                      </div>
                    </td>
                  );
                }

                if (column.type === "link") {
                  const href = `${column.hrefPrefix ?? ""}${row.id}`;

                  return (
                    <td key={column.key} className="px-4 py-3">
                      <Link
                        href={href}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        {value}
                      </Link>
                    </td>
                  );
                }

                return (
                  <td key={column.key} className="px-4 py-3 text-gray-800">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}