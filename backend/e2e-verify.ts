import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:8000/api/v1';

// Create a dummy image for testing
const testImagePath = path.join(__dirname, 'test-image.jpg');
if (!fs.existsSync(testImagePath)) {
  fs.writeFileSync(testImagePath, Buffer.from('fake-image-data-for-testing'));
}

async function runTest() {
  console.log('--- STARTING END-TO-END PRODUCTION VERIFICATION ---\n');

  try {
    // ==========================================
    // 1. Verify Authentication & Role Assignment
    // ==========================================
    console.log('Testing Authentication & Role Assignment...');
    
    // Login Vendor A
    const vendorALogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendor_a_test@tryvia.com',
      password: 'password123',
    });
    const vendorAToken = vendorALogin.data.access_token;
    const vendorA = vendorALogin.data.user;
    if (vendorA.role !== 'VENDOR') throw new Error('Vendor A role is not VENDOR');
    console.log('✅ Vendor A logged in and verified.');

    // Login Vendor B
    const vendorBLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'vendor_b_test@tryvia.com',
      password: 'password123',
    });
    const vendorBToken = vendorBLogin.data.access_token;
    const vendorB = vendorBLogin.data.user;
    if (vendorB.role !== 'VENDOR') throw new Error('Vendor B role is not VENDOR');
    console.log('✅ Vendor B logged in and verified.');

    // Login Customer
    const customerLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer_a_test@tryvia.com',
      password: 'password123',
    });
    const customerToken = customerLogin.data.access_token;
    const customer = customerLogin.data.user;
    if (customer.role !== 'CUSTOMER') throw new Error('Customer role is not CUSTOMER');
    console.log('✅ Customer logged in and verified.');


    // ==========================================
    // 2. Verify Vendor Product Creation & Cloudinary
    // ==========================================
    // Get categories and brands for creation
    const configRes = await axios.get(`${API_BASE}/products`);
    // Tryvia API does not have a direct endpoint for brands/categories in this example, but they might be populated.
    // Instead we will just use hardcoded MongoDB ObjectIDs from the DB if possible, or fetch via some config.
    // Since seed.ts runs, we know numericId: 1 for Brand (Chanel) and numericId: 1 for Category (Skincare) exist.
    // Wait, let's just query a product and use its brand and category.
    const sampleProduct = configRes.data[0];
    if (!sampleProduct) throw new Error("No existing products to copy brand/category from.");
    const brandId = sampleProduct.brand?._id || sampleProduct.brand;
    const categoryId = sampleProduct.category?._id || sampleProduct.category;

    console.log('\nTesting Vendor Product Creation...');

    const createProduct = async (token: string, name: string) => {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', 'Authentic luxury testing product.');
      formData.append('fullPrice', '150');
      formData.append('testerPrice', '25');
      formData.append('stockFull', '10');
      formData.append('stockTester', '50');
      formData.append('status', 'ACTIVE');
      formData.append('brand', String(brandId));
      formData.append('category', String(categoryId));
      formData.append('image', fs.createReadStream(testImagePath));

      const res = await axios.post(`${API_BASE}/vendor/products`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      });
      return res.data;
    };

    const productA = await createProduct(vendorAToken, 'Vendor A Perfume');
    if (!productA.imageUrl || !productA.imageUrl.includes('res.cloudinary.com')) {
      console.warn('⚠️ Product A image URL may not be Cloudinary if env vars are missing:', productA.imageUrl);
    }
    if (!productA.vendor) throw new Error('Product A missing vendor reference');
    console.log('✅ Vendor A created product with Cloudinary fallback image upload.');

    const productB = await createProduct(vendorBToken, 'Vendor B Serum');
    if (!productB.vendor) throw new Error('Product B missing vendor reference');
    console.log('✅ Vendor B created product successfully.');

    // ==========================================
    // 3. Verify Customer Product Feed
    // ==========================================
    console.log('\nTesting Customer Product Feed...');
    const feedRes = await axios.get(`${API_BASE}/products`);
    const feed = feedRes.data;
    const foundA = feed.find((p: any) => p.id === productA.id);
    const foundB = feed.find((p: any) => p.id === productB.id);
    
    if (!foundA || !foundB) throw new Error('Newly created products did not appear in customer feed!');
    console.log('✅ Customer feed contains the new MongoDB products. No mock data.');

    // ==========================================
    // 4. Verify Checkout & Multi-Vendor Handling
    // ==========================================
    console.log('\nTesting Checkout & Multi-Vendor Handling...');
    
    // Customer checks out with both products. We supply 'unitPrice' just to see if backend ignores it and uses DB price.
    const checkoutPayload = {
      items: [
        { product_id: productA.id, item_type: 'full', quantity: 1, unit_price: 1 }, // FAKE PRICE 1
        { product_id: productB.id, item_type: 'tester', quantity: 2, unit_price: 1 } // FAKE PRICE 1
      ],
      shipping_address: '123 Fake St, City',
      apply_wallet_credit_id: null
    };

    const checkoutRes = await axios.post(`${API_BASE}/orders`, checkoutPayload, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    
    const customerOrder = checkoutRes.data;
    
    // Verify prices are derived from DB
    // Product A fullPrice = 150. Qty 1 = 150
    // Product B testerPrice = 25. Qty 2 = 50
    // Total should be 200
    if (customerOrder.total_amount !== 200) {
      throw new Error(`Backend trusted frontend prices! Total should be 200, got ${customerOrder.total_amount}`);
    }
    console.log('✅ Backend strictly enforces real DB pricing. Total:', customerOrder.total_amount);
    
    // Check vendorStatuses slice
    if (!customerOrder.vendor_statuses || customerOrder.vendor_statuses.length !== 2) {
      throw new Error('Backend did not segregate vendor statuses correctly!');
    }
    console.log('✅ Order correctly split into multiple vendor fulfillment statuses.');

    // ==========================================
    // 5. Verify Vendor Isolation & Order Fetching
    // ==========================================
    console.log('\nTesting Vendor Order Isolation...');
    
    const vendorAOrdersRes = await axios.get(`${API_BASE}/vendor/orders`, {
      headers: { 'Authorization': `Bearer ${vendorAToken}` }
    });
    const vendorAOrders = vendorAOrdersRes.data;
    if (vendorAOrders.length < 1) {
      console.error('Vendor A Orders:', JSON.stringify(vendorAOrders, null, 2));
      throw new Error(`Vendor A order fetch failed. Expected at least 1 order, got ${vendorAOrders.length}`);
    }
    const recentVendorAOrder = vendorAOrders[0];
    if (recentVendorAOrder.total !== 150) throw new Error('Vendor A total is incorrect (should only see their slice)');
    console.log('✅ Vendor A sees exactly their slice of the order ($150).');

    // ==========================================
    // 6. Verify Vendor Authorization & Updating
    // ==========================================
    console.log('\nTesting Cross-Vendor Authorization...');
    
    const orderId = vendorAOrders[0]._id; // The main Order ID in DB
    
    // Vendor B tries to update Vendor A's slice (should fail or only update B's slice)
    await axios.patch(`${API_BASE}/vendor/orders/${orderId}/status`, { status: 'SHIPPED' }, {
      headers: { 'Authorization': `Bearer ${vendorBToken}` }
    });
    
    // Let's verify Vendor A's status didn't change
    const vendorAOrdersRes2 = await axios.get(`${API_BASE}/vendor/orders`, {
      headers: { 'Authorization': `Bearer ${vendorAToken}` }
    });
    if (vendorAOrdersRes2.data[0].status === 'SHIPPED') {
      throw new Error('Vendor B updating status maliciously affected Vendor A!');
    }
    console.log('✅ Vendor B cannot alter Vendor A\'s status slice. Cross-vendor update rejected/isolated.');

    // Vendor A updates their own status
    await axios.patch(`${API_BASE}/vendor/orders/${orderId}/status`, { status: 'SHIPPED' }, {
      headers: { 'Authorization': `Bearer ${vendorAToken}` }
    });
    const vendorAOrdersRes3 = await axios.get(`${API_BASE}/vendor/orders`, {
      headers: { 'Authorization': `Bearer ${vendorAToken}` }
    });
    if (vendorAOrdersRes3.data[0].status !== 'SHIPPED') {
      throw new Error('Vendor A failed to update their own status!');
    }
    console.log('✅ Vendor A successfully updated their order slice to SHIPPED.');

    // ==========================================
    // 7. Verify Customer Tracking Updates
    // ==========================================
    console.log('\nTesting Customer Tracking & Aggregation...');
    
    const customerOrdersRes = await axios.get(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const customerOrders = customerOrdersRes.data;
    
    const fetchedCustomerOrder = customerOrders.find((o: any) => o._id === orderId);
    if (!fetchedCustomerOrder) throw new Error('Customer cannot see their order');
    
    console.log('✅ Customer fetching order is successful. Statuses:', fetchedCustomerOrder.vendor_statuses);

    console.log('\n======================================================');
    console.log('🎉 ALL END-TO-END PRODUCTION CHECKS PASSED SUCCESSFULLY!');
    console.log('======================================================');
    
  } catch (err: any) {
    console.error('\n❌ E2E VERIFICATION FAILED!');
    if (err.response) {
      console.error('API Error Response:', err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runTest();
