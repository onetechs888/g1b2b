import Sidebar from "./Sidebar";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export default function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <main className="min-h-screen pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}