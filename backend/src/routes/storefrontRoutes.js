import { Router } from "express";
import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";

const router = Router();

const BUSINESS_INFO = {
  brandName: "TRYVIA",
  legalEntity: "RAJKANNAN BALAJI",
  businessType: "Individual",
  email: "sindhugopi066@gmail.com",
  phone: "+91 9042145295",
  phoneRaw: "9042145295",
  address: "5/89, 4th Street, North Jaganatha Nagar, Villivakkam, Chennai - 600049, Tamil Nadu, India",
  landingUrl: "https://tryvia-landing.vercel.app/",
  storefrontUrl: "https://tryvia-ta57.onrender.com/",
  supportHours: "Monday to Saturday, 10:00 AM - 7:00 PM IST",
};

const FALLBACK_PRODUCTS = [
  {
    id: "1",
    name: "Midnight Recovery Cloud Cream",
    brandName: "Kiehl's",
    categoryName: "Skincare",
    description:
      "Lightweight night recovery formulation with botanical squalane and evening primrose oil.",
    testerPrice: 300,
    fullPrice: 5200,
    sampleSize: "5ml Tester",
    sizeQuantity: "50ml Full Jar",
    stockTester: 50,
    stockFull: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800",
  },
  {
    id: "2",
    name: "Coco Noir Eau De Parfum",
    brandName: "Chanel",
    categoryName: "Fragrance",
    description:
      "Oriental fragrance with luminous bergamot, May rose, and deep patchouli sillage.",
    testerPrice: 350,
    fullPrice: 14500,
    sampleSize: "5ml Decant",
    sizeQuantity: "100ml Bottle",
    stockTester: 40,
    stockFull: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800",
  },
  {
    id: "3",
    name: "Dior Addict Lip Glow Oil",
    brandName: "Dior",
    categoryName: "Makeup",
    description:
      "Nourishing cherry-infused glossy lip oil with mirror shine and long-wear hydration.",
    testerPrice: 250,
    fullPrice: 3800,
    sampleSize: "2ml Mini",
    sizeQuantity: "6ml Full Size",
    stockTester: 60,
    stockFull: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800",
  },
  {
    id: "4",
    name: "Sauvage Eau de Parfum",
    brandName: "Dior",
    categoryName: "Fragrance",
    description:
      "Crisp Calabrian bergamot layered over smoky vanilla absolute and woody amber.",
    testerPrice: 350,
    fullPrice: 11500,
    sampleSize: "5ml Decant",
    sizeQuantity: "100ml Bottle",
    stockTester: 45,
    stockFull: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800",
  },
  {
    id: "5",
    name: "Bleu De Chanel Parfum",
    brandName: "Chanel",
    categoryName: "Fragrance",
    description:
      "Intensely woody aromatic parfum anchored by New Caledonian sandalwood.",
    testerPrice: 350,
    fullPrice: 12800,
    sampleSize: "5ml Decant",
    sizeQuantity: "100ml Bottle",
    stockTester: 35,
    stockFull: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800",
  },
  {
    id: "6",
    name: "Santal 33 Eau de Parfum",
    brandName: "Le Labo",
    categoryName: "Fragrance",
    description:
      "Artisanal blend of smoky cardamom, iris, violet, and Australian sandalwood.",
    testerPrice: 450,
    fullPrice: 24000,
    sampleSize: "5ml Decant",
    sizeQuantity: "100ml Bottle",
    stockTester: 25,
    stockFull: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800",
  },
];

let catalogCache = {
  timestamp: 0,
  products: null,
  categories: null,
};

export const clearStorefrontCatalogCache = () => {
  catalogCache = {
    timestamp: 0,
    products: null,
    categories: null,
  };
};

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInr(amount) {
  const num = Number(amount) || 0;
  return "Rs. " + Math.round(num).toLocaleString("en-IN");
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  return "";
}

async function getLiveCatalog() {
  const now = Date.now();
  if (catalogCache.products && now - catalogCache.timestamp < 30000) {
    return catalogCache;
  }

  if (mongoose.connection.readyState !== 1) {
    return {
      products: FALLBACK_PRODUCTS,
      categories: ["Fragrance", "Skincare", "Makeup"],
    };
  }

  try {
    const [dbProducts, dbCategories] = await Promise.all([
      Product.find({ status: "ACTIVE" })
        .populate("brand", "name")
        .populate("category", "name")
        .sort({ isFeatured: -1, numericId: 1 })
        .limit(48)
        .lean(),
      Category.find().select("name").lean(),
    ]);

    const normalized = (dbProducts || []).map((p) => ({
      id: String(p.numericId || p._id),
      name: p.name || "TryVia Formulation",
      brandName: p.brand?.name || "TryVia Curated",
      categoryName: p.category?.name || "Beauty",
      description:
        p.description ||
        "Authentic luxury formulation available in sample tester and full-size packaging.",
      testerPrice: Number(p.testerPrice) || 0,
      fullPrice: Number(p.fullPrice) || 0,
      sampleSize: p.sampleSize || "3ml - 10ml Tester",
      sizeQuantity: p.sizeQuantity || "Full Size Retail",
      stockTester: Number(p.stockTester) || 0,
      stockFull: Number(p.stockFull) || 0,
      imageUrl: sanitizeImageUrl(p.imageUrl),
    }));

    const products = normalized.length > 0 ? normalized : FALLBACK_PRODUCTS;
    const catSet = new Set(
      (dbCategories || []).map((c) => c.name).filter(Boolean)
    );
    products.forEach((p) => {
      if (p.categoryName) catSet.add(p.categoryName);
    });

    catalogCache = {
      timestamp: now,
      products,
      categories: Array.from(catSet),
    };
    return catalogCache;
  } catch {
    return {
      products: FALLBACK_PRODUCTS,
      categories: ["Fragrance", "Skincare", "Makeup"],
    };
  }
}

const SHARED_STYLES = `
:root {
  --bg-base: #0B0A0C;
  --bg-elevated: #141217;
  --bg-surface: #1B1820;
  --text-primary: #FAF8F5;
  --text-secondary: #D4CEC6;
  --text-muted: #9B948C;
  --accent-rose: #CB6D73;
  --accent-rose-light: #E89096;
  --accent-gold: #D4AF37;
  --accent-emerald: #34D399;
  --border-hairline: rgba(255, 255, 255, 0.1);
  --border-gold: rgba(212, 175, 55, 0.35);
  --font-serif: Georgia, "Times New Roman", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; background: var(--bg-base); color: var(--text-primary); }
body { font-family: var(--font-sans); background: var(--bg-base); color: var(--text-primary); line-height: 1.6; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; background: none; border: none; color: inherit; }
img { display: block; max-width: 100%; }
.wrap { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.site-header { position: sticky; top: 0; z-index: 50; background: rgba(11, 10, 12, 0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-hairline); }
.header-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 0; }
.brand-lockup { display: flex; flex-direction: column; gap: 2px; }
.brand-title { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; letter-spacing: 0.14em; color: var(--text-primary); }
.brand-sub { font-size: 0.75rem; color: var(--accent-gold); letter-spacing: 0.04em; }
.main-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 0.88rem; color: var(--text-secondary); }
.main-nav a:hover { color: var(--accent-rose-light); }
.nav-cta { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border-gold); color: var(--accent-gold); font-weight: 600; font-size: 0.84rem; }
.nav-cta:hover { background: rgba(212, 175, 55, 0.12); }
.hero { padding: 48px 0 36px; border-bottom: 1px solid var(--border-hairline); }
.hero-kicker { display: inline-block; padding: 5px 12px; border: 1px solid var(--border-gold); border-radius: 999px; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--accent-gold); margin-bottom: 16px; }
.hero-h1 { font-family: var(--font-serif); font-size: 2.35rem; line-height: 1.15; font-weight: 600; max-width: 18ch; margin-bottom: 16px; }
.hero-p { color: var(--text-secondary); max-width: 64ch; font-size: 1rem; margin-bottom: 24px; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; background: var(--accent-rose); color: #FAF8F5; font-weight: 600; font-size: 0.92rem; }
.btn-primary:hover { background: #b4585e; }
.btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; border: 1px solid var(--border-hairline); background: var(--bg-elevated); color: var(--text-primary); font-weight: 500; font-size: 0.92rem; }
.btn-outline:hover { border-color: var(--accent-gold); color: var(--accent-gold); }
.entity-strip { display: grid; grid-template-columns: 1fr; gap: 12px; padding: 16px; border: 1px solid var(--border-hairline); border-radius: 14px; background: var(--bg-elevated); font-size: 0.86rem; color: var(--text-secondary); }
.entity-strip strong { color: var(--text-primary); }
.section { padding: 48px 0; border-bottom: 1px solid var(--border-hairline); }
.section-head { margin-bottom: 24px; }
.section-kicker { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-gold); margin-bottom: 6px; font-weight: 600; }
.section-title { font-family: var(--font-serif); font-size: 1.95rem; font-weight: 600; line-height: 1.2; margin-bottom: 8px; }
.section-sub { color: var(--text-muted); max-width: 65ch; font-size: 0.95rem; }
.catalog-controls { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.search-input { width: 100%; max-width: 420px; padding: 11px 14px; border-radius: 10px; border: 1px solid var(--border-hairline); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.94rem; }
.search-input:focus { outline: 2px solid var(--accent-gold); border-color: transparent; }
.filter-pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill-btn { padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border-hairline); background: var(--bg-elevated); color: var(--text-secondary); font-size: 0.84rem; font-weight: 500; }
.pill-btn[aria-pressed="true"] { background: var(--accent-rose); border-color: var(--accent-rose); color: #FAF8F5; }
.pill-btn:hover { border-color: var(--accent-gold); }
.product-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
.product-card { display: flex; flex-direction: column; background: var(--bg-elevated); border: 1px solid var(--border-hairline); border-radius: 16px; overflow: hidden; }
.product-media { position: relative; aspect-ratio: 4 / 3; background: var(--bg-surface); overflow: hidden; }
.product-media img { width: 100%; height: 100%; object-fit: cover; }
.product-cat-badge { position: absolute; top: 10px; left: 10px; padding: 4px 10px; border-radius: 999px; background: rgba(11, 10, 12, 0.85); border: 1px solid var(--border-hairline); font-size: 0.72rem; color: var(--text-secondary); }
.product-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.product-brand { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-gold); font-weight: 600; }
.product-name { font-family: var(--font-serif); font-size: 1.3rem; font-weight: 600; line-height: 1.25; }
.product-desc { font-size: 0.86rem; color: var(--text-muted); line-height: 1.45; }
.price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: auto; padding-top: 8px; }
.price-box { padding: 10px; border-radius: 10px; border: 1px solid var(--border-hairline); background: var(--bg-surface); }
.price-label { display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 2px; }
.price-val { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); }
.price-sub { display: block; font-size: 0.7rem; color: var(--accent-emerald); margin-top: 2px; }
.card-footer-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 10px; border-top: 1px solid var(--border-hairline); }
.stock-text { font-size: 0.76rem; color: var(--accent-emerald); }
.detail-btn { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border-gold); color: var(--accent-gold); font-size: 0.8rem; font-weight: 600; }
.detail-btn:hover { background: rgba(212, 175, 55, 0.14); }
.info-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.info-card { padding: 20px; border-radius: 14px; border: 1px solid var(--border-hairline); background: var(--bg-elevated); }
.info-card h3 { font-family: var(--font-serif); font-size: 1.35rem; margin-bottom: 8px; color: var(--text-primary); }
.info-card p, .info-card li { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.55; }
.info-card ul { padding-left: 18px; display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.policy-doc { max-width: 820px; padding: 36px 0 56px; }
.policy-doc h1 { font-family: var(--font-serif); font-size: 2.2rem; margin-bottom: 8px; }
.policy-meta { font-size: 0.84rem; color: var(--accent-gold); margin-bottom: 24px; }
.policy-doc h2 { font-family: var(--font-serif); font-size: 1.35rem; margin: 24px 0 8px; color: var(--text-primary); }
.policy-doc p, .policy-doc li { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.65; }
.policy-doc ul { padding-left: 20px; margin-bottom: 14px; }
.site-footer { padding: 40px 0; background: #070608; }
.footer-grid { display: grid; grid-template-columns: 1fr; gap: 28px; margin-bottom: 28px; }
.footer-col-h { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-gold); font-weight: 700; margin-bottom: 12px; }
.footer-links { list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem; color: var(--text-secondary); }
.footer-links a:hover { color: var(--accent-rose-light); }
.footer-bottom { padding-top: 20px; border-top: 1px solid var(--border-hairline); font-size: 0.8rem; color: var(--text-muted); display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); display: none; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
.modal-backdrop.open { display: flex; }
.modal-panel { width: 100%; max-width: 480px; background: var(--bg-elevated); border: 1px solid var(--border-gold); border-radius: 18px; padding: 24px; max-height: 90vh; overflow-y: auto; }
.modal-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.modal-close { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-hairline); font-size: 0.84rem; color: var(--text-secondary); }
.breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-hairline); font-size: 0.9rem; color: var(--text-secondary); }
.breakdown-row strong { color: var(--text-primary); }
.empty-state { padding: 32px; text-align: center; border: 1px solid var(--border-hairline); border-radius: 14px; color: var(--text-muted); display: none; }
@media (min-width: 640px) {
  .wrap { padding: 0 24px; }
  .hero-h1 { font-size: 3.1rem; }
  .entity-strip { grid-template-columns: repeat(3, 1fr); }
  .product-grid { grid-template-columns: repeat(2, 1fr); }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-grid { grid-template-columns: 2fr 1fr 1fr; }
}
@media (min-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}
`;

function renderLayout({ title, description, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="author" content="${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.brandName)})" />
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <header class="site-header">
    <div class="wrap header-inner">
      <a href="/" class="brand-lockup" aria-label="TRYVIA Storefront Home">
        <span class="brand-title">TRYVIA</span>
        <span class="brand-sub">Operated by ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)})</span>
      </a>
      <nav class="main-nav" aria-label="Primary Navigation">
        <a href="/#catalog">Products &amp; Pricing</a>
        <a href="/#pricing">How Upgrade Works</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="${escapeHtml(BUSINESS_INFO.landingUrl)}" target="_blank" rel="noopener noreferrer" class="nav-cta">Download Android App</a>
      </nav>
    </div>
  </header>

  <main>${bodyHtml}</main>

  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <div class="brand-title" style="font-size:1.25rem; margin-bottom:8px;">TRYVIA</div>
          <p style="font-size:0.88rem; color:var(--text-muted); max-width:44ch; margin-bottom:10px;">
            Authentic luxury fragrance and skincare sampling marketplace with 90% tester-to-full-bottle wallet upgrade credits.
          </p>
          <p style="font-size:0.84rem; color:var(--text-secondary);">
            <strong>Registered Business Name:</strong> ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)})<br />
            <strong>Brand Name:</strong> ${escapeHtml(BUSINESS_INFO.brandName)}<br />
            <strong>Address:</strong> ${escapeHtml(BUSINESS_INFO.address)}<br />
            <strong>Email:</strong> <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}">${escapeHtml(BUSINESS_INFO.email)}</a> | <strong>Phone:</strong> <a href="tel:+91${escapeHtml(BUSINESS_INFO.phoneRaw)}">${escapeHtml(BUSINESS_INFO.phone)}</a>
          </p>
        </div>
        <div>
          <div class="footer-col-h">Storefront &amp; App</div>
          <ul class="footer-links">
            <li><a href="/#catalog">Live Catalog &amp; INR Pricing</a></li>
            <li><a href="/#pricing">Pricing &amp; Wallet Rules</a></li>
            <li><a href="/about">About &amp; Domain Relationship</a></li>
            <li><a href="/contact">Contact &amp; Support</a></li>
            <li><a href="${escapeHtml(BUSINESS_INFO.landingUrl)}" target="_blank" rel="noopener noreferrer">Official App Landing Portal</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-col-h">Legal Policies</div>
          <ul class="footer-links">
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms">Terms &amp; Conditions</a></li>
            <li><a href="/refund-policy">Refund &amp; Cancellation Policy</a></li>
            <li><a href="/shipping-policy">Shipping &amp; Delivery Policy</a></li>
            <li><a href="/account-deletion">Account &amp; Data Deletion</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; 2026 ${escapeHtml(BUSINESS_INFO.brandName)} &mdash; Registered Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)}). All rights reserved.</span>
        <span>Primary Storefront &amp; API: ${escapeHtml(BUSINESS_INFO.storefrontUrl)}</span>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

router.get("/", async (_req, res) => {
  const { products, categories } = await getLiveCatalog();

  const productCardsHtml = products
    .map((p) => {
      const creditEarned = Math.round(p.testerPrice * 0.9);
      const imageHtml = p.imageUrl
        ? `<img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.85rem;">TRYVIA Formulation</div>`;
      const inStock = p.stockTester > 0 || p.stockFull > 0;
      const payloadJson = escapeHtml(
        JSON.stringify({
          id: p.id,
          name: p.name,
          brand: p.brandName,
          category: p.categoryName,
          testerPrice: p.testerPrice,
          fullPrice: p.fullPrice,
          sampleSize: p.sampleSize,
          sizeQuantity: p.sizeQuantity,
          creditEarned,
        })
      );

      return `
      <article class="product-card" data-category="${escapeHtml(p.categoryName.toLowerCase())}" data-search="${escapeHtml((p.name + " " + p.brandName + " " + p.categoryName).toLowerCase())}">
        <div class="product-media">
          ${imageHtml}
          <span class="product-cat-badge">${escapeHtml(p.categoryName)}</span>
        </div>
        <div class="product-body">
          <div class="product-brand">${escapeHtml(p.brandName)}</div>
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-desc">${escapeHtml(p.description)}</p>
          <div class="price-grid">
            <div class="price-box">
              <span class="price-label">Sample (${escapeHtml(p.sampleSize)})</span>
              <span class="price-val">${escapeHtml(formatInr(p.testerPrice))}</span>
              <span class="price-sub">Earns ${escapeHtml(formatInr(creditEarned))} credit</span>
            </div>
            <div class="price-box">
              <span class="price-label">Full Size (${escapeHtml(p.sizeQuantity)})</span>
              <span class="price-val">${escapeHtml(formatInr(p.fullPrice))}</span>
              <span class="price-sub">Upgrade eligible</span>
            </div>
          </div>
          <div class="card-footer-row">
            <span class="stock-text">${inStock ? "In Stock - Ships Pan-India" : "Restocking Soon"}</span>
            <button type="button" class="detail-btn" data-product="${payloadJson}">View Pricing &amp; Order</button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  const filterButtonsHtml = [
    `<button type="button" class="pill-btn" data-filter="all" aria-pressed="true">All Formulations</button>`,
    ...categories.map(
      (cat) =>
        `<button type="button" class="pill-btn" data-filter="${escapeHtml(cat.toLowerCase())}" aria-pressed="false">${escapeHtml(cat)}</button>`
    ),
  ].join("");

  const bodyHtml = `
    <section class="hero">
      <div class="wrap">
        <span class="hero-kicker">Official Storefront &amp; Live INR Catalog</span>
        <h1 class="hero-h1">Luxury Fragrance &amp; Skincare Sampling, With 90% Upgrade Credit</h1>
        <p class="hero-p">
          TRYVIA lets Indian shoppers sample authentic 3ml-10ml luxury formulations from certified distributors before committing to full-sized bottles. Receive 90% of every tester purchase as locked TryVia Wallet credit toward your full-size upgrade.
        </p>
        <div class="hero-actions">
          <a href="#catalog" class="btn-primary">Browse Live Catalog &amp; INR Prices</a>
          <a href="${escapeHtml(BUSINESS_INFO.landingUrl)}" target="_blank" rel="noopener noreferrer" class="btn-outline">Download TryVia Android App</a>
        </div>
        <div class="entity-strip">
          <div><strong>Registered Business:</strong> ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)})</div>
          <div><strong>Brand &amp; Platform:</strong> ${escapeHtml(BUSINESS_INFO.brandName)} Web Storefront + Android App</div>
          <div><strong>Customer Care:</strong> ${escapeHtml(BUSINESS_INFO.email)} | ${escapeHtml(BUSINESS_INFO.phone)}</div>
        </div>
      </div>
    </section>

    <section class="section" id="catalog">
      <div class="wrap">
        <div class="section-head">
          <span class="section-kicker">Live Storefront Inventory</span>
          <h2 class="section-title">Products &amp; Transparent INR Pricing</h2>
          <p class="section-sub">All prices below are live from the TRYVIA catalog in Indian Rupees (INR). Minimum tester order value is Rs. 200. Payments are processed securely via Razorpay.</p>
        </div>

        <div class="catalog-controls">
          <input type="search" id="catalogSearch" class="search-input" placeholder="Search by fragrance, skincare, or brand (e.g. Chanel, Dior, Kiehl's)..." aria-label="Search products" />
          <div class="filter-pills" id="categoryFilters">${filterButtonsHtml}</div>
        </div>

        <div class="product-grid" id="productGrid">${productCardsHtml}</div>
        <div class="empty-state" id="emptyState">No matching formulations found. Clear your search filter to view all live products.</div>
      </div>
    </section>

    <section class="section" id="pricing">
      <div class="wrap">
        <div class="section-head">
          <span class="section-kicker">Transparent Fee Structure</span>
          <h2 class="section-title">How Pricing, Shipping &amp; 90% Wallet Credits Work</h2>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>Sample / Tester Orders (3ml - 10ml)</h3>
            <ul>
              <li>Live tester prices typically range from <strong>Rs. 250 to Rs. 450</strong> per formulation.</li>
              <li>Minimum tester checkout value: <strong>Rs. 200</strong>.</li>
              <li>Applicable GST (18%) and flat pan-India shipping fee of <strong>Rs. 40</strong> shown upfront before payment.</li>
              <li>Once verified, <strong>90% of tester value</strong> is credited to your TryVia Wallet (valid 30 days) for full-size upgrades; 10% covers sterile decant packaging.</li>
            </ul>
          </div>
          <div class="info-card">
            <h3>Full-Size Retail Orders (50ml - 100ml)</h3>
            <ul>
              <li>Full-sized luxury products typically range from <strong>Rs. 3,800 to Rs. 24,000</strong> depending on house and volume.</li>
              <li>Active TryVia Wallet credits can offset up to <strong>60% of the full product price</strong> per order.</li>
              <li>Flat platform handling fee of <strong>Rs. 10</strong> plus <strong>Rs. 40</strong> insured shipping per checkout.</li>
              <li>All orders support UPI, Credit/Debit Cards, NetBanking, and Wallets via Razorpay 256-bit checkout.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="about">
      <div class="wrap">
        <div class="section-head">
          <span class="section-kicker">Platform Architecture &amp; Entity Disclosure</span>
          <h2 class="section-title">About TRYVIA &amp; Domain Relationship</h2>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>Registered Entity &amp; Business Model</h3>
            <p>
              <strong>TRYVIA</strong> is an Indian beauty and haute parfumerie e-commerce platform legally operated by <strong>${escapeHtml(BUSINESS_INFO.legalEntity)}</strong> (${escapeHtml(BUSINESS_INFO.businessType)}), headquartered in Chennai, Tamil Nadu. Customers sample authentic luxury vials first and upgrade to full-size bottles with locked wallet discounts.
            </p>
          </div>
          <div class="info-card">
            <h3>Operational Connection Between Domains &amp; App</h3>
            <ul>
              <li><strong>${escapeHtml(BUSINESS_INFO.storefrontUrl)}</strong> (this site): Hosts the live TRYVIA web product catalog, INR pricing, backend APIs (<code>/api/v1</code>), and secure Razorpay payment checkout session.</li>
              <li><strong>${escapeHtml(BUSINESS_INFO.landingUrl)}</strong>: Official TRYVIA landing page and Android mobile app distribution portal sharing the exact same business model and entity (<strong>${escapeHtml(BUSINESS_INFO.legalEntity)}</strong>).</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="contact">
      <div class="wrap">
        <div class="section-head">
          <span class="section-kicker">Customer &amp; Compliance Support</span>
          <h2 class="section-title">Contact Us</h2>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h3>Business &amp; Grievance Contact</h3>
            <p>
              <strong>Legal Business Name:</strong> ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)})<br />
              <strong>Brand Name:</strong> ${escapeHtml(BUSINESS_INFO.brandName)}<br />
              <strong>Email:</strong> <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a><br />
              <strong>Phone:</strong> <a href="tel:+91${escapeHtml(BUSINESS_INFO.phoneRaw)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.phone)}</a><br />
              <strong>Support Hours:</strong> ${escapeHtml(BUSINESS_INFO.supportHours)}
            </p>
          </div>
          <div class="info-card">
            <h3>Registered Operational Address</h3>
            <p>${escapeHtml(BUSINESS_INFO.address)}</p>
            <p style="margin-top:10px;">
              For order assistance, damaged parcel claims (within 48 hours of delivery), or refund inquiries, write to <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a>.
            </p>
          </div>
        </div>
      </div>
    </section>

    <div class="modal-backdrop" id="productModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-panel">
        <div class="modal-top">
          <div>
            <div class="product-brand" id="modalBrand">TRYVIA</div>
            <h3 class="product-name" id="modalTitle" style="margin-top:4px;">Product Pricing</h3>
          </div>
          <button type="button" class="modal-close" id="closeModalBtn">Close</button>
        </div>
        <div id="modalBody"></div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:18px;">
          <a href="${escapeHtml(BUSINESS_INFO.landingUrl)}#download-apk" target="_blank" rel="noopener noreferrer" class="btn-primary" style="justify-content:center;">Order via TryVia Android App</a>
          <a href="/contact" class="btn-outline" style="justify-content:center;">Need Help? Contact Support</a>
        </div>
      </div>
    </div>

    <script>
      (function () {
        var searchEl = document.getElementById("catalogSearch");
        var filterWrap = document.getElementById("categoryFilters");
        var cards = Array.prototype.slice.call(document.querySelectorAll(".product-card"));
        var emptyState = document.getElementById("emptyState");
        var activeFilter = "all";

        function applyFilters() {
          var q = (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();
          var visible = 0;
          cards.forEach(function (card) {
            var cat = card.getAttribute("data-category") || "";
            var hay = card.getAttribute("data-search") || "";
            var catMatch = activeFilter === "all" || cat === activeFilter;
            var textMatch = !q || hay.indexOf(q) !== -1;
            var show = catMatch && textMatch;
            card.style.display = show ? "flex" : "none";
            if (show) visible += 1;
          });
          if (emptyState) emptyState.style.display = visible === 0 ? "block" : "none";
        }

        if (searchEl) searchEl.addEventListener("input", applyFilters);
        if (filterWrap) {
          filterWrap.addEventListener("click", function (e) {
            var btn = e.target.closest("button[data-filter]");
            if (!btn) return;
            activeFilter = btn.getAttribute("data-filter") || "all";
            filterWrap.querySelectorAll("button[data-filter]").forEach(function (b) {
              b.setAttribute("aria-pressed", b === btn ? "true" : "false");
            });
            applyFilters();
          });
        }

        var modal = document.getElementById("productModal");
        var modalBrand = document.getElementById("modalBrand");
        var modalTitle = document.getElementById("modalTitle");
        var modalBody = document.getElementById("modalBody");
        var closeBtn = document.getElementById("closeModalBtn");

        function fmt(n) { return "Rs. " + Math.round(Number(n) || 0).toLocaleString("en-IN"); }
        function esc(s) {
          return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }

        document.addEventListener("click", function (e) {
          var btn = e.target.closest("button[data-product]");
          if (!btn || !modal) return;
          try {
            var p = JSON.parse(btn.getAttribute("data-product"));
            modalBrand.textContent = p.brand + " - " + p.category;
            modalTitle.textContent = p.name;
            var gst = Math.round(p.testerPrice * 0.18);
            var testerTotal = p.testerPrice + gst + 40;
            var fullTotal = p.fullPrice + 10 + 40;
            modalBody.innerHTML =
              '<div class="breakdown-row"><span>Sample Price (' + esc(p.sampleSize) + ')</span><strong>' + fmt(p.testerPrice) + '</strong></div>' +
              '<div class="breakdown-row"><span>GST (18%) + Shipping (Rs. 40)</span><strong>' + fmt(gst + 40) + '</strong></div>' +
              '<div class="breakdown-row"><span>Total Tester Checkout (min order Rs. 200)</span><strong>' + fmt(testerTotal) + '</strong></div>' +
              '<div class="breakdown-row"><span>90% Smart Wallet Credit Earned</span><strong style="color:var(--accent-emerald);">' + fmt(p.creditEarned) + '</strong></div>' +
              '<div class="breakdown-row"><span>Full Bottle (' + esc(p.sizeQuantity) + ')</span><strong>' + fmt(p.fullPrice) + '</strong></div>' +
              '<div class="breakdown-row"><span>Full Checkout (+ Rs. 10 fee + Rs. 40 shipping)</span><strong>' + fmt(fullTotal) + '</strong></div>';
            modal.classList.add("open");
          } catch (_err) {}
        });

        if (closeBtn && modal) {
          closeBtn.addEventListener("click", function () { modal.classList.remove("open"); });
          modal.addEventListener("click", function (e) { if (e.target === modal) modal.classList.remove("open"); });
        }
      })();
    </script>
  `;

  res.send(
    renderLayout({
      title: "TRYVIA Storefront | Authentic Luxury Fragrance & Skincare Sampling (RAJKANNAN BALAJI)",
      description:
        "Browse live TRYVIA luxury fragrance and skincare samples with transparent INR pricing and 90% wallet upgrade credits. Operated by RAJKANNAN BALAJI.",
      bodyHtml,
    })
  );
});

router.get("/about", (_req, res) => {
  res.send(
    renderLayout({
      title: "About TRYVIA | RAJKANNAN BALAJI",
      description: "About TRYVIA business model, registered entity, and domain ecosystem.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>About TRYVIA</h1>
          <p class="policy-meta">Registered Business Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)}) | Brand: ${escapeHtml(BUSINESS_INFO.brandName)}</p>
          <p>TRYVIA is a curated Indian e-commerce platform specializing in authentic luxury fragrance decants (3ml-10ml), skincare testers, and full-sized retail products sourced from authorized distributors.</p>
          <h2>Our Try-Before-You-Buy Model</h2>
          <p>Customers purchase affordable tester formulations first and automatically receive 90% of the tester purchase value as locked TRYVIA Wallet credit (valid for 30 days) redeemable toward full-sized product upgrades (up to 60% of the full bottle value per order).</p>
          <h2>Platform &amp; Domain Relationship</h2>
          <ul>
            <li><strong>Storefront &amp; Backend (${escapeHtml(BUSINESS_INFO.storefrontUrl)}):</strong> Displays the live product catalog and INR pricing, and powers our <code>/api/v1</code> application endpoints and Razorpay payment checkout session.</li>
            <li><strong>App Landing Portal (${escapeHtml(BUSINESS_INFO.landingUrl)}):</strong> Official marketing and Android app download hub sharing the exact same business model and legal entity (${escapeHtml(BUSINESS_INFO.legalEntity)}).</li>
          </ul>
          <h2>Registered Address</h2>
          <p>${escapeHtml(BUSINESS_INFO.address)}<br />Email: ${escapeHtml(BUSINESS_INFO.email)} | Phone: ${escapeHtml(BUSINESS_INFO.phone)}</p>
        </div>
      `,
    })
  );
});

router.get("/contact", (_req, res) => {
  res.send(
    renderLayout({
      title: "Contact Us | TRYVIA (RAJKANNAN BALAJI)",
      description: "Contact information and registered address for TRYVIA operated by RAJKANNAN BALAJI.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>Contact Us</h1>
          <p class="policy-meta">Registered Business Name: ${escapeHtml(BUSINESS_INFO.legalEntity)} | Brand Name: ${escapeHtml(BUSINESS_INFO.brandName)}</p>
          <p>For customer support, order tracking, refund queries, or compliance inquiries, please reach out using the official details below:</p>
          <ul>
            <li><strong>Legal Business Name:</strong> ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.businessType)})</li>
            <li><strong>Brand Name:</strong> ${escapeHtml(BUSINESS_INFO.brandName)}</li>
            <li><strong>Support Email:</strong> <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a></li>
            <li><strong>Support Phone:</strong> <a href="tel:+91${escapeHtml(BUSINESS_INFO.phoneRaw)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.phone)}</a></li>
            <li><strong>Operational Address:</strong> ${escapeHtml(BUSINESS_INFO.address)}</li>
            <li><strong>Working Hours:</strong> ${escapeHtml(BUSINESS_INFO.supportHours)}</li>
          </ul>
        </div>
      `,
    })
  );
});

router.get("/privacy-policy", (_req, res) => {
  res.send(
    renderLayout({
      title: "Privacy Policy | TRYVIA (RAJKANNAN BALAJI)",
      description: "Privacy Policy for TRYVIA operated by RAJKANNAN BALAJI.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>Privacy Policy</h1>
          <p class="policy-meta">Effective Date: November 2026 | Business Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.brandName)})</p>
          <p>This Privacy Policy describes how <strong>${escapeHtml(BUSINESS_INFO.legalEntity)}</strong>, operating under the brand name <strong>${escapeHtml(BUSINESS_INFO.brandName)}</strong>, collects, uses, and protects your personal information across ${escapeHtml(BUSINESS_INFO.storefrontUrl)}, ${escapeHtml(BUSINESS_INFO.landingUrl)}, and the TRYVIA Android application.</p>
          <h2>1. Information We Collect</h2>
          <ul>
            <li>Account and profile details: name, email address, phone number, and delivery address required to fulfill orders.</li>
            <li>Order and wallet records: sample orders, full-size upgrade purchases, and TRYVIA Wallet credit ledger entries.</li>
            <li>Payment processing data: online transactions are processed directly via PCI-DSS compliant Razorpay checkout. We do not store card numbers, CVV, or banking passwords on our servers.</li>
          </ul>
          <h2>2. How We Use Information</h2>
          <ul>
            <li>To process orders, verify Razorpay payment signatures, calculate wallet upgrade credits, and dispatch deliveries.</li>
            <li>To provide order notifications, customer support, and fraud prevention.</li>
          </ul>
          <h2>3. Data Sharing &amp; Security</h2>
          <p>We share only necessary shipping details with logistics partners and payment metadata with Razorpay to complete transactions. We never sell personal data to third parties.</p>
          <h2>4. Contact &amp; Data Requests</h2>
          <p>To request correction or deletion of your account data, contact <strong>${escapeHtml(BUSINESS_INFO.legalEntity)}</strong> at <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a> or ${escapeHtml(BUSINESS_INFO.phone)}.</p>
        </div>
      `,
    })
  );
});

router.get("/terms", (_req, res) => {
  res.send(
    renderLayout({
      title: "Terms & Conditions | TRYVIA (RAJKANNAN BALAJI)",
      description: "Terms and Conditions for TRYVIA operated by RAJKANNAN BALAJI.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>Terms &amp; Conditions</h1>
          <p class="policy-meta">Effective Date: November 2026 | Business Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.brandName)})</p>
          <p>By accessing ${escapeHtml(BUSINESS_INFO.storefrontUrl)}, ${escapeHtml(BUSINESS_INFO.landingUrl)}, or placing an order through the TRYVIA mobile application, you agree to these Terms &amp; Conditions with <strong>${escapeHtml(BUSINESS_INFO.legalEntity)}</strong>.</p>
          <h2>1. Products &amp; Pricing</h2>
          <ul>
            <li>All prices are listed in Indian Rupees (INR). Applicable GST, platform fees (Rs. 10 on full-size orders), and shipping charges (Rs. 40) are displayed before checkout confirmation.</li>
            <li>Minimum order value for sample/tester orders is Rs. 200.</li>
          </ul>
          <h2>2. TRYVIA Wallet Upgrade Credits</h2>
          <ul>
            <li>Purchasing eligible tester formulations grants 90% of the tester value as locked TRYVIA Wallet credit (10% is retained as a sterile packaging and platform fee).</li>
            <li>Wallet credits are valid for 30 days from issuance, are non-transferable, cannot be withdrawn as cash, and can cover up to 60% of the product value on eligible full-size orders.</li>
          </ul>
          <h2>3. Payments &amp; Jurisdiction</h2>
          <p>All online payments are processed through Razorpay. These terms are governed by the laws of India, with exclusive jurisdiction vested in the courts of Chennai, Tamil Nadu.</p>
        </div>
      `,
    })
  );
});

router.get("/refund-policy", (_req, res) => {
  res.send(
    renderLayout({
      title: "Refund & Cancellation Policy | TRYVIA (RAJKANNAN BALAJI)",
      description: "Refund and Cancellation Policy for TRYVIA operated by RAJKANNAN BALAJI.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>Refund &amp; Cancellation Policy</h1>
          <p class="policy-meta">Effective Date: November 2026 | Business Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.brandName)})</p>
          <h2>1. Order Cancellation</h2>
          <p>Orders may be cancelled before dispatch by contacting customer support at <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a> or ${escapeHtml(BUSINESS_INFO.phone)} with your order ID. Once dispatched, orders cannot be cancelled.</p>
          <h2>2. Damaged, Leaked, or Incorrect Items</h2>
          <p>Due to cosmetic and fragrance hygiene standards, opened or used vials/bottles cannot be returned for change of mind. However, if a parcel arrives leaked, broken, tamper-seal compromised, or incorrect, report it within 48 hours of delivery with unboxing photos via the app Returns section or email.</p>
          <h2>3. Refund Timeline</h2>
          <p>Approved cancellations and verified damage refunds (where a free replacement is not preferred) are initiated within 48 hours and credited back to the original Razorpay payment source (UPI, Card, or Bank Account) within 5-7 business days.</p>
        </div>
      `,
    })
  );
});

router.get("/shipping-policy", (_req, res) => {
  res.send(
    renderLayout({
      title: "Shipping & Delivery Policy | TRYVIA (RAJKANNAN BALAJI)",
      description: "Shipping and Delivery Policy for TRYVIA operated by RAJKANNAN BALAJI.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>Shipping &amp; Delivery Policy</h1>
          <p class="policy-meta">Effective Date: November 2026 | Business Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.brandName)})</p>
          <h2>1. Processing &amp; Dispatch</h2>
          <p>Confirmed orders are sealed in tamper-evident insulated packaging and dispatched within 24-48 business hours from our Chennai fulfillment hub (${escapeHtml(BUSINESS_INFO.address)}).</p>
          <h2>2. Delivery Timelines &amp; Charges</h2>
          <ul>
            <li>Pan-India standard delivery takes 3-7 business days depending on destination pincode.</li>
            <li>Standard flat shipping charge is Rs. 40 per checkout category (displayed clearly prior to payment).</li>
          </ul>
          <h2>3. Order Tracking &amp; Issues</h2>
          <p>Tracking status is visible inside the TRYVIA app under Orders. For delayed or missing shipments, contact <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a> or ${escapeHtml(BUSINESS_INFO.phone)}.</p>
        </div>
      `,
    })
  );
});

router.get("/account-deletion", (_req, res) => {
  res.send(
    renderLayout({
      title: "Account & Data Deletion | TRYVIA (RAJKANNAN BALAJI)",
      description:
        "How to permanently delete your TRYVIA account and personal data in-app or by request.",
      bodyHtml: `
        <div class="wrap policy-doc">
          <h1>Account &amp; Data Deletion</h1>
          <p class="policy-meta">Effective Date: November 2026 | Business Entity: ${escapeHtml(BUSINESS_INFO.legalEntity)} (${escapeHtml(BUSINESS_INFO.brandName)})</p>
          <p>TRYVIA provides immediate in-app account deletion as well as web-supported deletion requests for users who have uninstalled the application.</p>
          <h2>1. Delete Your Account Directly Inside the TRYVIA App</h2>
          <ul>
            <li>Open the <strong>TRYVIA</strong> app and go to the <strong>Profile</strong> tab.</li>
            <li>Tap <strong>Account Settings</strong>.</li>
            <li>Scroll to the bottom and tap <strong>Delete Account</strong>, then confirm deletion.</li>
          </ul>
          <h2>2. Request Deletion via Support (If Uninstalled)</h2>
          <p>Email <a href="mailto:${escapeHtml(BUSINESS_INFO.email)}?subject=TRYVIA%20Account%20Deletion%20Request" style="color:var(--accent-gold);">${escapeHtml(BUSINESS_INFO.email)}</a> from your registered email address (or call ${escapeHtml(BUSINESS_INFO.phone)}). Requests are verified and processed within 48 hours.</p>
          <h2>3. Data Deleted vs. Data Retained</h2>
          <ul>
            <li><strong>Immediately deleted/anonymized:</strong> Full name, email address, login credentials, notifications, saved shipping details, and active/unredeemed TryVia Wallet upgrade credits.</li>
            <li><strong>Retained strictly for legal/accounting compliance:</strong> Completed order invoices and Razorpay transaction references (retained in anonymized form as required under Indian tax and payment laws, without retaining personal login identity).</li>
          </ul>
        </div>
      `,
    })
  );
});

export default router;
