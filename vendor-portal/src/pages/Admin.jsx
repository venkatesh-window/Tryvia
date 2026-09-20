import { useState, useEffect } from "react";
import { Package, Lock, Loader2, Edit } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'https://tryvia-ta57.onrender.com/api/v1';

export default function Admin() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState("PRODUCTS");
  const [productsOrders, setProductsOrders] = useState([]);
  const [minisOrders, setMinisOrders] = useState([]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { password });
      setToken(res.data.token);
      localStorage.setItem("admin_token", res.data.token);
    } catch (err) {
      if (err.response?.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Invalid credentials or access denied.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [prodRes, minisRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders/products`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/orders/minis`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProductsOrders(prodRes.data);
      setMinisOrders(minisRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setToken(null);
        localStorage.removeItem("admin_token");
      }
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateTesterStatus = async (orderId, itemId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/minis/orders/${orderId}/status`, 
        { status: newStatus, itemId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders(); // Refresh after update
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-default">
        <form onSubmit={handleLogin} className="bg-background-paper p-8 rounded-2xl shadow-card w-full max-w-sm space-y-6 border border-border-light">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-light p-3 rounded-full">
              <Lock className="w-8 h-8 text-primary-main" />
            </div>
          </div>
          <h2 className="text-2xl font-bold font-brand text-center text-text-primary">Admin Access</h2>
          {error && <p className="text-state-error text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-border-light rounded-xl font-body bg-background-default focus:ring-2 focus:ring-primary-main/20"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-primary-main text-white py-2.5 rounded-xl font-medium shadow-glow flex justify-center hover:bg-primary-dark">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-default p-8 font-body text-text-primary">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-brand font-bold">Admin Dashboard</h1>
          <button onClick={() => { setToken(null); localStorage.removeItem("admin_token"); }} className="px-4 py-2 text-text-secondary hover:text-state-error border border-border-light rounded-lg hover:bg-red-50 bg-background-paper transition-all">
            Logout
          </button>
        </div>

        <div className="flex gap-4 border-b border-border-light">
          <button
            onClick={() => setActiveTab("PRODUCTS")}
            className={`pb-4 px-4 font-medium border-b-2 transition-all ${activeTab === "PRODUCTS" ? "border-primary-main text-primary-main" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            PRODUCTS
          </button>
          <button
            onClick={() => setActiveTab("MINIS")}
            className={`pb-4 px-4 font-medium border-b-2 transition-all ${activeTab === "MINIS" ? "border-primary-main text-primary-main" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            MINIS
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-main" />
          </div>
        ) : activeTab === "PRODUCTS" ? (
          <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
             <table className="w-full text-left font-body text-sm">
              <thead className="bg-background-surface/30 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {productsOrders.flatMap(order => order.items.map((item, idx) => (
                  <tr key={`${order._id}-${idx}`} className="hover:bg-background-surface/50">
                    <td className="px-6 py-4 font-medium">{order.orderId || `TRY-ORD-${order.numericId}`}</td>
                    <td className="px-6 py-4">{order.user?.fullName}</td>
                    <td className="px-6 py-4">
                      {item.product?.name}
                      <div className="text-xs text-text-secondary mt-1">Qty: {item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">₹{item.totalPrice}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                       <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                )))}
                {productsOrders.length === 0 && (
                  <tr><td colSpan="6" className="text-center p-8 text-text-secondary">No product orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
             <table className="w-full text-left font-body text-sm">
              <thead className="bg-background-surface/30 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Tester</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {minisOrders.flatMap(order => order.items.map((item, idx) => (
                  <tr key={`${order._id}-${idx}`} className="hover:bg-background-surface/50">
                    <td className="px-6 py-4 font-medium">{order.orderId || `TRY-ORD-${order.numericId}`}</td>
                    <td className="px-6 py-4">{order.user?.fullName}</td>
                    <td className="px-6 py-4">
                      {item.product?.name}
                      <div className="text-xs text-text-secondary mt-1">Qty: {item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">₹{item.totalPrice}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={item.itemStatus || "PENDING"} 
                        onChange={(e) => updateTesterStatus(order._id, item.orderItemId || item._id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-border-light bg-background-default focus:outline-none"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing / Accepted</option>
                        <option value="PACKED">Packed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                )))}
                {minisOrders.length === 0 && (
                  <tr><td colSpan="6" className="text-center p-8 text-text-secondary">No tester orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
