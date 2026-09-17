import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, Loader2 } from "lucide-react";
import axios from "axios";

export default function Register() {
  const [formData, setFormData] = useState({
    storeName: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst: "",
    description: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/v1/auth/vendor/register", formData);
      localStorage.setItem("vendor_token", response.data.access_token);
      localStorage.setItem("vendor_user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-default flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-background-paper p-8 rounded-2xl shadow-card border border-border-light">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-light p-3 rounded-xl mb-4">
            <Store className="w-8 h-8 text-primary-main" />
          </div>
          <h1 className="font-brand text-3xl font-bold text-text-primary">Become a TRYVIA Vendor</h1>
          <p className="text-text-secondary font-body mt-2 text-center">Fill out the details below to start selling on the platform.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-state-error p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Brand / Store Name *</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Owner Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                required
              />
            </div>
          </div>

          <div className="border-t border-border-light pt-6 mt-6">
            <h3 className="font-semibold text-text-primary mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Business Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">GSTIN (Optional)</label>
                <input
                  type="text"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body uppercase"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Brand Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-main hover:bg-primary-dark text-white font-semibold py-3 rounded-xl shadow-glow transition-all duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary font-body">
          Already have a vendor account?{" "}
          <Link to="/login" className="text-primary-main hover:text-primary-dark font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
