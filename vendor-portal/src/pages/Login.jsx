import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Store, Loader2 } from "lucide-react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/v1/auth/login", {
        email,
        password,
      });

      if (response.data.user.role !== "VENDOR") {
        throw new Error("Only vendors can access this portal.");
      }

      localStorage.setItem("vendor_token", response.data.access_token);
      localStorage.setItem("vendor_user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-default flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background-paper p-8 rounded-2xl shadow-card border border-border-light">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary-light p-3 rounded-xl mb-4">
            <Store className="w-8 h-8 text-primary-main" />
          </div>
          <h1 className="font-brand text-3xl font-bold text-text-primary">TRYVIA</h1>
          <p className="text-text-secondary font-body mt-1 uppercase tracking-widest text-sm font-semibold">Vendor Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-state-error p-3 rounded-lg text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
              placeholder="vendor@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5 font-body">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border-light bg-background-default text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all font-body"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-main hover:bg-primary-dark text-white font-semibold py-3 rounded-xl shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary font-body">
          Don't have a vendor account?{" "}
          <Link to="/register" className="text-primary-main hover:text-primary-dark font-medium transition-colors">
            Apply now
          </Link>
        </p>
      </div>
    </div>
  );
}
