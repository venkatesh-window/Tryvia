import urllib.request
import json

url = "http://192.168.29.16:8000/api/v1/orders/"
data = json.dumps({
    "items": [
        {
            "product_id": 1,
            "item_type": "full",
            "quantity": 1,
            "unit_price": 350
        }
    ]
}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(e.read().decode())
