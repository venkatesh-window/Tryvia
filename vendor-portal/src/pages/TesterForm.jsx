import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Image as ImageIcon, X } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'https://tryvia-ta57.onrender.com/api/v1';

export default function TesterForm() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fullPrice: "",
    testerPrice: "",
    stockFull: "",
    stockTester: "",
    category: "",
    brand: "",
    status: "ACTIVE",
    ingredients: "",
    sizeQuantity: "",
    sampleSize: "",
    usageInstructions: "",
    claims: ""
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          axios.get(`${API_URL}/products/categories`),
          axios.get(`${API_URL}/products/brands`)
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
        if (catRes.data.length > 0) setFormData(prev => ({ ...prev, category: catRes.data[0]._id }));
        if (brandRes.data.length > 0) setFormData(prev => ({ ...prev, brand: brandRes.data[0]._id }));
      } catch (e) {
        console.error("Failed to load metadata", e);
      }
    };
    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("vendor_token");
      
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      await axios.post(`${API_URL}/vendor/testers`, submitData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      navigate("/testers");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create tester. Make sure category/brand references exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/testers")}
          className="p-2 bg-background-paper border border-border-light rounded-xl text-text-secondary hover:text-primary-main hover:border-primary-light transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold font-brand text-text-primary">Add New Tester</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-state-error p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background-paper p-6 rounded-2xl shadow-card border border-border-light space-y-5">
              <h3 className="font-semibold text-text-primary font-body border-b border-border-light pb-3">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Tester Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body resize-y"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Ingredients</label>
                <textarea
                  name="ingredients"
                  value={formData.ingredients}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body resize-y"
                  placeholder="E.g., Aqua, Glycerin, Niacinamide..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Usage Instructions</label>
                <textarea
                  name="usageInstructions"
                  value={formData.usageInstructions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body resize-y"
                  placeholder="E.g., Apply a pea-sized amount twice daily..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Claims</label>
                <textarea
                  name="claims"
                  value={formData.claims}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body resize-y"
                  placeholder="E.g., Dermatologically tested, Cruelty-free"
                ></textarea>
              </div>
            </div>

            <div className="bg-background-paper p-6 rounded-2xl shadow-card border border-border-light space-y-5">
              <h3 className="font-semibold text-text-primary font-body border-b border-border-light pb-3">Pricing & Inventory</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Tester Price (₹) *</label>
                  <input
                    type="number"
                    name="testerPrice"
                    value={formData.testerPrice}
                    onChange={handleChange}
                    required
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Sample Size (e.g. 5ml)</label>
                  <input
                    type="text"
                    name="sampleSize"
                    value={formData.sampleSize}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                    placeholder="E.g. 5ml, 10g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Tester Stock *</label>
                  <input
                    type="number"
                    name="stockTester"
                    value={formData.stockTester}
                    onChange={handleChange}
                    required
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Full Size Equivalent Value (₹)</label>
                  <input
                    type="number"
                    name="fullPrice"
                    value={formData.fullPrice}
                    onChange={handleChange}
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Full Size Equivalent Quantity</label>
                  <input
                    type="text"
                    name="sizeQuantity"
                    value={formData.sizeQuantity}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                    placeholder="E.g. 50ml, 100g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Full Size Stock (Optional)</label>
                  <input
                    type="number"
                    name="stockFull"
                    value={formData.stockFull}
                    onChange={handleChange}
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-background-paper p-6 rounded-2xl shadow-card border border-border-light space-y-5">
              <h3 className="font-semibold text-text-primary font-body border-b border-border-light pb-3">Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Brand *</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                  >
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-background-paper p-6 rounded-2xl shadow-card border border-border-light space-y-5">
              <h3 className="font-semibold text-text-primary font-body border-b border-border-light pb-3">Tester Image</h3>
              
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border-light bg-background-surface">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={removeImage}
                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors text-white"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-border-light border-dashed rounded-xl cursor-pointer bg-background-surface/50 hover:bg-background-surface hover:border-primary-main/50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                        <Upload className="w-6 h-6 text-primary-main" />
                      </div>
                      <p className="mb-1 text-sm text-text-primary font-medium">Click to upload image</p>
                      <p className="text-xs text-text-secondary">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-background-paper p-6 rounded-2xl shadow-card border border-border-light space-y-5">
              <h3 className="font-semibold text-text-primary font-body border-b border-border-light pb-3">Status</h3>
              
              <div>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive / Draft</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
                <p className="text-xs text-text-secondary mt-2">Active testers are visible to customers in the TRYVIA app under Minis.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-border-light pt-6">
          <button 
            type="button"
            onClick={() => navigate("/testers")}
            className="px-6 py-3 rounded-xl font-medium font-body text-text-secondary hover:bg-background-surface transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-medium font-body bg-primary-main text-white shadow-glow hover:bg-primary-dark transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            Save Tester
          </button>
        </div>
      </form>
    </div>
  );
}
