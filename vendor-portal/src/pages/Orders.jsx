import { useState, useEffect } from "react";
import { Search, ShoppingCart, Truck, Check, X } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("vendor_token");
      const res = await axios.get(`${API_URL}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => 
    `TRY-ORD-${o.id.toString().padStart(6, '0')}`.includes(search.toUpperCase()) || 
    o.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-paper border border-border-light rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all"
          />
        </div>
      </div>

      <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary font-body">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-background-surface p-4 rounded-full mb-4">
              <ShoppingCart className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2 font-brand">No Orders Yet</h3>
            <p className="text-text-secondary font-body mb-6">Orders containing your products will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead className="bg-background-surface/30 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Products</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-background-surface/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">TRY-ORD-{order.id.toString().padStart(6, '0')}</td>
                    <td className="px-6 py-4 text-text-secondary">{order.customer}</td>
                    <td className="px-6 py-4 text-text-secondary">{order.products} items</td>
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
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-main hover:text-primary-dark font-medium transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onUpdate={fetchOrders}
        />
      )}
    </div>
  );
}

function OrderModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    try {
      const token = localStorage.getItem("vendor_token");
      await axios.patch(`${API_URL}/vendor/orders/${order._id}/status`, {
        status,
        shippingPartner: courier,
        trackingNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-secondary-main/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background-paper rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border-light">
        <div className="flex items-center justify-between p-6 border-b border-border-light sticky top-0 bg-background-paper/95 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-bold font-brand text-text-primary">Manage Order</h2>
            <p className="text-sm text-text-secondary font-body">TRY-ORD-{order.id.toString().padStart(6, '0')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-background-surface rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="font-semibold text-text-primary font-body mb-4">Items to Fulfill</h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border-light bg-background-default">
                  {item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-background-surface" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-background-surface flex items-center justify-center">
                      <Package className="w-6 h-6 text-text-secondary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{item.product?.name || "Product"}</p>
                    <p className="text-xs text-text-secondary">{item.itemType === 'tester' ? 'Tester Size' : 'Full Size'} • Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-text-primary">₹{item.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="bg-background-surface/50 p-6 rounded-xl border border-border-light">
              <h3 className="font-semibold text-text-primary font-body mb-4">Update Fulfillment Status</h3>
              
              {error && (
                <div className="bg-red-50 text-state-error p-3 rounded-lg text-sm font-medium border border-red-100 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-paper text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Confirm (Processing)</option>
                    <option value="PACKED">Packed</option>
                    <option value="SHIPPED">Shipped</option>
                  </select>
                </div>

                {status === 'SHIPPED' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Courier / Delivery Partner</label>
                      <input 
                        type="text"
                        value={courier}
                        onChange={(e) => setCourier(e.target.value)}
                        placeholder="e.g. Blue Dart, Delhivery"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-paper text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Tracking Number</label>
                      <input 
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Tracking ID"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-paper text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-medium font-body text-text-secondary hover:bg-background-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={updating}
                className="px-6 py-2.5 rounded-xl font-medium font-body bg-primary-main text-white shadow-glow hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {updating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
