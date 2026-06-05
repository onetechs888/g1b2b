import Sidebar from "./Sidebar";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}