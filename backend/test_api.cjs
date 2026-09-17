const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:8000/api/v1/products');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
