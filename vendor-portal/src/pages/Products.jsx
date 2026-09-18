import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("vendor_token");
      const res = await axios.get(`${API_URL}/vendor/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.productId && p.productId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-paper border border-border-light rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all"
          />
        </div>
        <button onClick={() => navigate("/products/new")} className="flex items-center gap-2 px-4 py-2.5 bg-primary-main text-white font-semibold font-body rounded-xl shadow-glow hover:bg-primary-dark transition-colors">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="bg-background-paper rounded-2xl shadow-card border border-border-light overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary font-body">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-background-surface p-4 rounded-full mb-4">
              <Package className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2 font-brand">No Products Yet</h3>
            <p className="text-text-secondary font-body mb-6">Start selling on TRYVIA by adding your first product.</p>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-main text-white font-semibold font-body rounded-xl shadow-glow hover:bg-primary-dark transition-colors">
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead className="bg-background-surface/30 text-text-secondary">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Tester Price</th>
                  <th className="px-6 py-4 font-medium">Full Price</th>
                  <th className="px-6 py-4 font-medium">Stock</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-background-surface/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-background-surface border border-border-light" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-background-surface border border-border-light flex items-center justify-center">
                          <Package className="w-6 h-6 text-text-secondary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-text-primary">{product.name}</p>
                        <p className="text-xs text-text-secondary">{product.productId || `TRY-PRD-${product.numericId?.toString().padStart(6, '0')}`}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        product.status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {product.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary">₹{product.testerPrice || 0}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">₹{product.fullPrice || 0}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="text-text-secondary">Full:</span> <span className="font-medium text-text-primary">{product.stockFull || 0}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-text-secondary">Tester:</span> <span className="font-medium text-text-primary">{product.stockTester || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-text-secondary hover:text-primary-main hover:bg-primary-light rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
