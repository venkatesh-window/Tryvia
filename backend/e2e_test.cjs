const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
  try {
    // 1. Vendor Login to get JWT (assuming vendor was created by subagent)
    console.log('Logging in vendor...');
    const loginRes = await axios.post('http://localhost:8000/api/v1/auth/login', {
      email: 'e2e_vendor_1@example.com',
      password: 'password123'
    });
    const vendorToken = loginRes.data.access_token;
    
    // 2. Upload Product with Image via Vendor API
    console.log('Uploading product...');
    const form = new FormData();
    form.append('name', 'Cloudinary Test Serum');
    form.append('description', 'A test product with a real image to verify Cloudinary.');
    form.append('fullPrice', '899');
    form.append('testerPrice', '299');
    form.append('stockFull', '50');
    form.append('stockTester', '50');
    form.append('category', '6a914796daeae241df4d5430');
    form.append('brand', '6a914796daeae241df4d5428');
    form.append('status', 'ACTIVE');
    form.append('image', fs.createReadStream('c:/Users/gsven/.gemini/antigravity-ide/scratch/tryvia/serum.jpg'));

    const productRes = await axios.post('http://localhost:8000/api/v1/vendor/products', form, {
      headers: {
        'Authorization': `Bearer ${vendorToken}`,
        ...form.getHeaders()
      }
    });
    
    console.log('Product created:', productRes.data);
    
    // 3. Customer Registration
    console.log('Registering customer...');
    const custEmail = `cust_${Date.now()}@example.com`;
    const custRes = await axios.post('http://localhost:8000/api/v1/auth/register', {
      full_name: 'E2E Customer',
      email: custEmail,
      password: 'password123',
      phone: '9876543210'
    });
    const custToken = custRes.data.access_token;
    
    // 4. Place Order
    console.log('Customer placing order...');
    const orderRes = await axios.post('http://localhost:8000/api/v1/orders', {
      items: [
        {
          product_id: productRes.data._id,
          quantity: 1,
          item_type: 'full'
        }
      ],
      shippingAddress: '123 Test Lane, Mumbai, MH 400001, India'
    }, {
      headers: { 'Authorization': `Bearer ${custToken}` }
    });
    
    console.log('Order placed:', orderRes.data);
    
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
run();
