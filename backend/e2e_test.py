import asyncio
import httpx
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

# We use the mocked test user id in headers since auth is bypassed/mocked
HEADERS = {"Authorization": "Bearer mocked-token"}

async def main():
    async with httpx.AsyncClient(base_url=BASE_URL, headers=HEADERS) as client:
        print("--- TRYVIA E2E CYCLE TEST ---")
        
        # 1. Fetch products
        print("\n1. Fetching products...")
        resp = await client.get("/products/")
        products = resp.json()
        assert len(products) > 0, "No products found!"
        test_product = products[0]
        print(f"   Selected Product: {test_product['name']} (ID: {test_product['id']})")
        
        # 2. Buy a Tester
        print("\n2. Purchasing Tester...")
        order_payload = {
            "items": [
                {
                    "product_id": test_product["id"],
                    "item_type": "TESTER",
                    "quantity": 1
                }
            ]
        }
        resp = await client.post("/orders/", json=order_payload)
        order = resp.json()
        print(f"   Order Created: ID {order['id']}, Total: Rs. {order['total_amount']}")
        
        # 3. Check Wallet Balance
        print("\n3. Checking Wallet...")
        resp = await client.get("/wallet/balance")
        wallet = resp.json()
        print(f"   Wallet Total Balance: Rs. {wallet['total_balance']}")
        
        # 4. Fetch Experiences
        print("\n4. Fetching Experiences...")
        resp = await client.get("/experiences/")
        experiences = resp.json()
        assert len(experiences) > 0, "No experiences found!"
        exp = experiences[0]
        print(f"   Found Experience: ID {exp['id']}, Status: {exp['status']}")
        
        # 5. Mark Experienced
        print(f"\n5. Marking Experience {exp['id']} as EXPERIENCED...")
        resp = await client.post(f"/experiences/{exp['id']}/mark-experienced")
        print(f"   Result: {resp.json()}")
        
        # 6. Add Review
        print("\n6. Submitting Review...")
        review_payload = {
            "rating": 5,
            "content": "Incredible miniature! Will definitely buy full size."
        }
        resp = await client.post(f"/experiences/{exp['id']}/review", json=review_payload)
        print(f"   Result: {resp.json()}")
        
        # 7. Check Wallet Eligibility
        print(f"\n7. Checking Upgrade Eligibility for Product {test_product['id']}...")
        resp = await client.get(f"/wallet/eligibility/{test_product['id']}")
        eligibility = resp.json()
        print(f"   Eligibility: {eligibility}")
        assert eligibility["eligible"] == True, "Credit did not unlock!"
        credit_id = eligibility["credit"]["id"]
        
        # 8. Purchase Full Size with Upgrade Credit
        print("\n8. Purchasing Full Size with Upgrade Credit...")
        upgrade_payload = {
            "items": [
                {
                    "product_id": test_product["id"],
                    "item_type": "FULL",
                    "quantity": 1
                }
            ],
            "apply_wallet_credit_id": credit_id
        }
        resp = await client.post("/orders/", json=upgrade_payload)
        upgrade_order = resp.json()
        print(f"   Upgrade Order Created: ID {upgrade_order['id']}, Subtotal: Rs. {upgrade_order['subtotal']}, Discount: Rs. {upgrade_order['wallet_discount']}, Total Paid: Rs. {upgrade_order['total_amount']}")
        
        print("\n--- E2E CYCLE COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(main())
