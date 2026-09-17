import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Store } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("vendor_token");
    localStorage.removeItem("vendor_user");
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Products", path: "/products", icon: Package },
    { label: "Orders", path: "/orders", icon: ShoppingCart },
  ];

  return (
    <div className="flex h-screen bg-background-default">
      {/* Sidebar */}
      <aside className="w-64 bg-background-paper border-r border-border-light flex flex-col shadow-card">
        <div className="p-6 flex items-center gap-3 border-b border-border-light">
          <div className="bg-primary-light p-2 rounded-lg">
            <Store className="w-6 h-6 text-primary-main" />
          </div>
          <div>
            <h1 className="font-brand text-2xl font-bold text-text-primary tracking-tight">TRYVIA</h1>
            <p className="text-xs font-body text-text-secondary uppercase tracking-widest font-semibold">Vendor Portal</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-body transition-all duration-200",
                  isActive 
                    ? "bg-primary-main text-white shadow-glow" 
                    : "text-text-secondary hover:bg-background-surface hover:text-text-primary"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-text-secondary")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-light">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-body text-text-secondary hover:bg-red-50 hover:text-state-error transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background-default">
        <header className="h-16 bg-background-paper/80 backdrop-blur-md border-b border-border-light flex items-center px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="font-brand text-xl font-semibold text-text-primary">
            {navItems.find(i => location.pathname.startsWith(i.path))?.label || "Portal"}
          </h2>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
