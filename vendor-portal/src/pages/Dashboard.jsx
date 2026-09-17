import { useState, useEffect } from "react";
import { Package, ShoppingCart, DollarSign, AlertCircle, Truck, RefreshCw } from "lucide-react";
import axios from "axios";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("vendor_token");
      const res = await axios.get("http://localhost:8000/api/v1/vendor/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data);
    } catch (err) {
      setError("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-main" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-state-error p-4 rounded-xl border border-red-100">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: "Total Products", value: metrics?.total_products || 0, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Products", value: metrics?.active_products || 0, icon: Package, color: "text-green-500", bg: "bg-green-50" },
    { label: "Pending Orders", value: metrics?.pending_orders || 0, icon: ShoppingCart, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Orders Shipped", value: metrics?.completed_orders || 0, icon: Truck, color: "text-primary-main", bg: "bg-primary-light" },
    { label: "Total Sales", value: `₹${(metrics?.gross_sales || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Low Stock Products", value: metrics?.low_stock_products || 0, icon: AlertCircle, color: "text-state-error", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-background-paper p-6 rounded-2xl shadow-card border border-border-light flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium font-body mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold font-brand text-text-primary">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {metrics?.recent_orders?.length > 0 && (
        <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
          <div className="px-6 py-5 border-b border-border-light bg-background-surface/50">
            <h3 className="font-semibold text-text-primary font-body">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead className="bg-background-surface/30 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {metrics.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-background-surface/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">TRY-ORD-{order.id.toString().padStart(6, '0')}</td>
                    <td className="px-6 py-4 text-text-secondary">{order.customer}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">₹{order.total.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{new Date(order.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
