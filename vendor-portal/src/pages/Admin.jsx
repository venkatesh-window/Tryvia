import { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle, XCircle, Store, AlertCircle, Trash2, Search, Package } from "lucide-react";
import axios from "axios";
import { API_URL, getApiErrorMessage } from "../config/api";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("admin_token") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState("VENDORS");
  const [productsOrders, setProductsOrders] = useState([]);
  const [minisOrders, setMinisOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [updatingVendorId, setUpdatingVendorId] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState("ALL");
  const [deletingProductId, setDeletingProductId] = useState(null);

  useEffect(() => {
    if (token) {
      fetchData();
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
        setError(getApiErrorMessage(err, "Invalid credentials or access denied."));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, minisRes, vendorRes, catalogRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders/products`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/orders/minis`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/vendors`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setProductsOrders(prodRes.data);
      setMinisOrders(minisRes.data);
      setVendors(vendorRes.data);
      setCatalogItems(catalogRes.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setToken(null);
        localStorage.removeItem("admin_token");
      }
      console.error("Failed to load admin data", err);
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
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const updateVendorStatus = async (vendorId, newStatus) => {
    try {
      setUpdatingVendorId(vendorId);
      await axios.patch(`${API_URL}/admin/vendors/${vendorId}/status`,
        { status: newStatus, reason: `Admin marked as ${newStatus}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to update vendor status"));
    } finally {
      setUpdatingVendorId(null);
    }
  };

  const handleDeleteCatalogItem = async (item) => {
    const itemId = item._id || item.id;
    const typeLabel = item.isTester ? "tester" : "product";
    if (!window.confirm(`Are you sure you want to remove "${item.name}" (${typeLabel}) from the app? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingProductId(itemId);
      await axios.delete(`${API_URL}/admin/products/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCatalogItems(prev => prev.filter(p => (p._id || p.id) !== itemId));
    } catch (err) {
      alert(getApiErrorMessage(err, `Failed to remove ${typeLabel}`));
    } finally {
      setDeletingProductId(null);
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

  const pendingCount = vendors.filter(v => v.status === "PENDING").length;
  const catalogProductsCount = catalogItems.filter(item => !item.isTester).length;
  const catalogTestersCount = catalogItems.filter(item => item.isTester || item.stockTester > 0).length;
  const filteredCatalogItems = catalogItems.filter(item => {
    if (catalogFilter === "PRODUCTS" && item.isTester) return false;
    if (catalogFilter === "TESTERS" && !item.isTester && !(item.stockTester > 0)) return false;
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.trim().toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.productId || "").toLowerCase().includes(q) ||
      (item.brand?.name || "").toLowerCase().includes(q) ||
      (item.vendor?.storeName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background-default p-8 font-body text-text-primary">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-brand font-bold">Admin Dashboard</h1>
          <button onClick={() => { setToken(null); localStorage.removeItem("admin_token"); }} className="px-4 py-2 text-text-secondary hover:text-state-error border border-border-light rounded-lg hover:bg-red-50 bg-background-paper transition-all">
            Logout
          </button>
        </div>

        <div className="flex flex-wrap gap-4 border-b border-border-light">
          <button
            onClick={() => setActiveTab("VENDORS")}
            className={`pb-4 px-4 font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === "VENDORS" ? "border-primary-main text-primary-main" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            VENDORS
            {pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
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
          <button
            onClick={() => setActiveTab("CATALOG")}
            className={`pb-4 px-4 font-medium border-b-2 transition-all flex items-center gap-2 ${activeTab === "CATALOG" ? "border-primary-main text-primary-main" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            PRODUCTS & TESTERS
            <span className="bg-background-surface text-text-secondary text-xs px-2 py-0.5 rounded-full font-semibold">
              {catalogItems.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-main" />
          </div>
        ) : activeTab === "VENDORS" ? (
          <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
            <table className="w-full text-left font-body text-sm">
              <thead className="bg-background-surface/30 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Store & Contact</th>
                  <th className="px-6 py-4 font-medium">GST / Location</th>
                  <th className="px-6 py-4 font-medium">Applied Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {vendors.map(v => (
                  <tr key={v._id || v.id} className="hover:bg-background-surface/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{v.storeName || v.store_name}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{v.email} • {v.phone || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{v.gst || "No GST"}</div>
                      <div className="text-xs text-text-secondary">{v.address || "No address"}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        v.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        v.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {updatingVendorId === (v._id || v.id) ? (
                        <Loader2 className="w-5 h-5 animate-spin inline-block text-primary-main" />
                      ) : v.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => updateVendorStatus(v._id || v.id, "APPROVED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => updateVendorStatus(v._id || v.id, "REJECTED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : v.status === "APPROVED" ? (
                        <button
                          onClick={() => updateVendorStatus(v._id || v.id, "SUSPENDED")}
                          className="px-3 py-1.5 text-xs text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => updateVendorStatus(v._id || v.id, "APPROVED")}
                          className="px-3 py-1.5 text-xs text-primary-main hover:bg-primary-light rounded-lg transition-colors font-medium"
                        >
                          Re-approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr><td colSpan="5" className="text-center p-8 text-text-secondary">No vendors found</td></tr>
                )}
              </tbody>
            </table>
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
        ) : activeTab === "CATALOG" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search product, tester, brand, or vendor..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background-paper border border-border-light rounded-xl text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCatalogFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${catalogFilter === "ALL" ? "bg-primary-main text-white border-primary-main" : "bg-background-paper text-text-secondary border-border-light hover:text-text-primary"}`}
                >
                  All ({catalogItems.length})
                </button>
                <button
                  onClick={() => setCatalogFilter("PRODUCTS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${catalogFilter === "PRODUCTS" ? "bg-primary-main text-white border-primary-main" : "bg-background-paper text-text-secondary border-border-light hover:text-text-primary"}`}
                >
                  Products ({catalogProductsCount})
                </button>
                <button
                  onClick={() => setCatalogFilter("TESTERS")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${catalogFilter === "TESTERS" ? "bg-primary-main text-white border-primary-main" : "bg-background-paper text-text-secondary border-border-light hover:text-text-primary"}`}
                >
                  Testers ({catalogTestersCount})
                </button>
              </div>
            </div>

            <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-sm">
                  <thead className="bg-background-surface/30 text-text-secondary">
                    <tr>
                      <th className="px-6 py-4 font-medium">Product / Tester</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Vendor / Brand</th>
                      <th className="px-6 py-4 font-medium">Price & Stock</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {filteredCatalogItems.map(item => {
                      const itemId = item._id || item.id;
                      const isRemoving = deletingProductId === itemId;
                      return (
                        <tr key={itemId} className="hover:bg-background-surface/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.imageUrl || item.image_url ? (
                                <img
                                  src={item.imageUrl || item.image_url}
                                  alt={item.name}
                                  className="w-11 h-11 rounded-lg object-cover bg-background-surface border border-border-light shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-background-surface border border-border-light flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5 text-text-secondary" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-text-primary">{item.name}</div>
                                <div className="text-xs text-text-secondary mt-0.5">
                                  {item.productId || (item.numericId ? `TRY-PRD-${String(item.numericId).padStart(6, "0")}` : itemId)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {item.isTester ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                Tester
                              </span>
                            ) : item.stockTester > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                Product + Tester
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                Product
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-text-primary">{item.vendor?.storeName || "Platform / Seeded"}</div>
                            <div className="text-xs text-text-secondary mt-0.5">
                              {item.brand?.name || "No brand"}{item.category?.name ? ` • ${item.category.name}` : ""}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(!item.isTester || item.fullPrice > 0 || item.stockFull > 0) && (
                              <div className="text-xs">
                                <span className="text-text-secondary">Full:</span>{" "}
                                <span className="font-semibold text-text-primary">₹{item.fullPrice || 0}</span>{" "}
                                <span className="text-text-secondary">({item.stockFull || 0} left)</span>
                              </div>
                            )}
                            {(item.isTester || item.stockTester > 0 || item.testerPrice > 0) && (
                              <div className="text-xs mt-0.5">
                                <span className="text-text-secondary">Tester:</span>{" "}
                                <span className="font-semibold text-text-primary">₹{item.testerPrice || 0}</span>{" "}
                                <span className="text-text-secondary">({item.stockTester || 0} left)</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                              item.status === "OUT_OF_STOCK" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {item.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteCatalogItem(item)}
                              disabled={isRemoving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                              title="Remove from app"
                            >
                              {isRemoving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCatalogItems.length === 0 && (
                      <tr><td colSpan="6" className="text-center p-8 text-text-secondary">No products or testers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
