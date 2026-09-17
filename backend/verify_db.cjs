const axios = require('axios');

async function verifyCustomerOrder() {
  try {
    console.log('Logging in customer...');
    // We can just query by logging in, but we didn't save the customer's email in a variable outside the e2e_test.cjs.
    // However, I can query MongoDB directly to verify the final state.
    const mongoose = require('mongoose');
    require('dotenv').config({path: './.env'});
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Order = require('./src/models/Order.js').Order;
    const order = await Order.findOne({ numericId: 8929 });
    
    if (order) {
      console.log('Order found in MongoDB!');
      console.log('Order Status:', order.status);
      console.log('Vendor Status:', order.vendorStatuses[0].status);
      console.log('Tracking Number:', order.vendorStatuses[0].trackingNumber);
      console.log('Shipping Partner:', order.vendorStatuses[0].shippingPartner);
    } else {
      console.log('Order not found!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}
verifyCustomerOrder();
