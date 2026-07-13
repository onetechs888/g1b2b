import Sidebar from "./Sidebar";
import CustomerSidebar from "../customer/CustomerSidebar";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  role?: "partner" | "customer";
}

export default function WorkspaceLayout({
  children,
  role = "partner",
}: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      {role === "customer" ? <CustomerSidebar /> : <Sidebar />}

      <main className="min-h-screen pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}