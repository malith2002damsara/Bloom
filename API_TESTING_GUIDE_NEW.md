# 🧪 API Testing Guide - Postman Collection

## Base URL
```
http://localhost:5000/api
```

---

## 1️⃣ Feedback System Tests

### 1. Submit Feedback (Customer - Requires Auth)
```http
POST {{baseUrl}}/feedback
Authorization: Bearer {{customerToken}}
Content-Type: application/json

{
  "orderId": "6543210abcdef1234567890",
  "productId": "1234567890abcdef654321",
  "rating": 5,
  "comment": "Beautiful flowers! Very fresh and arrived on time."
}
```

### 2. Get Product Feedback (Public)
```http
GET {{baseUrl}}/feedback/product/1234567890abcdef654321?page=1&limit=10
```

### 3. Get Top 10 Comments (Public)
```http
GET {{baseUrl}}/feedback/top-comments
```

### 4. Get Admin Feedback (Admin - Requires Auth)
```http
GET {{baseUrl}}/feedback/admin?page=1&limit=20
Authorization: Bearer {{adminToken}}
```

### 5. Check Feedback Eligibility (Customer - Requires Auth)
```http
GET {{baseUrl}}/feedback/check/6543210abcdef1234567890
Authorization: Bearer {{customerToken}}
```

---

## 2️⃣ Product System Tests

### 6. Get Home Page Products (Public)
```http
GET {{baseUrl}}/products/home
```

### 7. Get Products with Admin Code Filter (Public)
```http
GET {{baseUrl}}/products?adminCode=JOH1234&page=1&limit=20
```

### 8. Get Products with Price Filter (Public)
```http
GET {{baseUrl}}/products?minPrice=1000&maxPrice=5000&sortBy=price-low
```

### 9. Get Products Sorted by Rating (Public)
```http
GET {{baseUrl}}/products?sortBy=rating&page=1&limit=20
```

### 10. Get Products Sorted by Discount (Public)
```http
GET {{baseUrl}}/products?sortBy=discount&page=1&limit=20
```

---

## 3️⃣ Commission System Tests

### 11. Calculate Monthly Commission (SuperAdmin - Requires Auth)
```http
POST {{baseUrl}}/commission/calculate/adminId123456
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json

{
  "month": 11,
  "year": 2025
}
```

### 12. Pay Commission (Admin/SuperAdmin - Requires Auth)
```http
POST {{baseUrl}}/commission/pay/transactionId123
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "paymentMethod": "mastercard",
  "paymentReference": "TXN20251103123456",
  "cardLastFour": "4321",
  "cardType": "mastercard"
}
```

### 13. Get Commission History (Admin - Requires Auth)
```http
GET {{baseUrl}}/commission/history?page=1&limit=20
Authorization: Bearer {{adminToken}}
```

### 14. Get Pending Commissions (SuperAdmin - Requires Auth)
```http
GET {{baseUrl}}/commission/pending
Authorization: Bearer {{superAdminToken}}
```

### 15. Generate Monthly Report (SuperAdmin - Requires Auth)
```http
POST {{baseUrl}}/commission/generate-monthly-report
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json

{
  "month": 11,
  "year": 2025
}
```

---

## 4️⃣ Auth System Tests (Updated)

### 16. Register User with Phone Uniqueness Check
```http
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "testuser@example.com",
  "phone": "1234567890",
  "password": "test123456"
}
```

**Test Case**: Try registering with same phone - should get error:
```
"That number already exists, please use another number."
```

### 17. Create Admin (SuperAdmin - Requires Auth)
```http
POST {{baseUrl}}/superadmin/admins
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "admin123"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "data": {
    "admin": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "adminCode": "JOH1234",  // Auto-generated!
      "isActive": true
    }
  }
}
```

---

## 5️⃣ Test Scenarios

### Scenario 1: Phone Uniqueness Validation
```bash
# Step 1: Register user with phone "1234567890"
POST /api/auth/register
{ "phone": "1234567890", ... }
✅ Success

# Step 2: Try registering another user with same phone
POST /api/auth/register
{ "phone": "1234567890", ... }
❌ Error: "That number already exists, please use another number."

# Step 3: Try creating admin with same phone
POST /api/superadmin/admins
{ "phone": "1234567890", ... }
❌ Error: "That number already exists, please use another number."
```

### Scenario 2: Admin Code Generation & Product Filtering
```bash
# Step 1: Create admin "John Doe"
POST /api/superadmin/admins
✅ Response includes: "adminCode": "JOH1234"

# Step 2: Create product as this admin
POST /api/products
Authorization: Bearer <admin-token>
✅ Product created

# Step 3: Customer searches by admin code
GET /api/products?adminCode=JOH1234
✅ Returns only John's products
```

### Scenario 3: Discount System
```bash
# Step 1: Create product with discount
POST /api/products
{
  "name": "Rose Bouquet",
  "price": 2000,
  "discount": 20,
  ...
}

# Expected:
price: 2000
discount: 20
discountedPrice: 1600  // Auto-calculated

# Step 2: Update discount
PUT /api/products/:id
{ "discount": 30 }

# Expected:
discountedPrice: 1400  // Auto-updated
```

### Scenario 4: Feedback & Rating System
```bash
# Step 1: Place order and mark as delivered
POST /api/orders
✅ Order created

# Update to delivered
PUT /api/orders/:id/status
{ "orderStatus": "delivered" }

# Step 2: Check feedback eligibility
GET /api/feedback/check/:orderId
✅ Returns: { "canSubmit": true }

# Step 3: Submit feedback
POST /api/feedback
{
  "orderId": "...",
  "productId": "...",
  "rating": 5,
  "comment": "Excellent!"
}
✅ Feedback created

# Step 4: Verify product rating updated
GET /api/products/:productId
✅ Response includes updated:
{
  "ratings": {
    "average": 5.0,
    "count": 1
  }
}

# Step 5: Try submitting again
POST /api/feedback (same order, product)
❌ Error: "You have already submitted feedback"
```

### Scenario 5: Commission Calculation (Below Threshold)
```bash
# Admin has earned Rs. 40,000 (below 50,000 threshold)

POST /api/commission/calculate/:adminId
{ "month": 11, "year": 2025 }

✅ Expected Response:
{
  "commissionApplies": false,
  "commissionAmount": 0,
  "adminRevenue": 40000,
  "threshold": 50000,
  "description": "Revenue below threshold"
}
```

### Scenario 6: Commission Calculation (Above Threshold)
```bash
# Admin has earned Rs. 60,000 (above 50,000 threshold)

POST /api/commission/calculate/:adminId
{ "month": 11, "year": 2025 }

✅ Expected Response:
{
  "commissionApplies": true,
  "commissionAmount": 6000,  // 10% of 60,000
  "adminRevenue": 60000,
  "threshold": 50000,
  "nextDueDate": "2025-12-01"
}
```

### Scenario 7: Auto-Deactivation
```bash
# Scenario: Admin has overdue commission (15 days past due)

# Step 1: Check pending commissions
GET /api/commission/pending
✅ Returns overdue transactions

# Step 2: Verify admin auto-deactivated
GET /api/superadmin/admins/:id
✅ Response:
{
  "isActive": false,
  "deactivationReason": "Overdue commission payment - grace period expired",
  "deactivatedAt": "2025-11-18"
}

# Step 3: Verify admin's products hidden
GET /api/products
❌ Admin's products not in results

# Step 4: Record payment
POST /api/commission/pay/:transactionId
{ "paymentMethod": "cash" }

# Step 5: Verify admin reactivated
GET /api/superadmin/admins/:id
✅ "isActive": true
```

### Scenario 8: Home Page Products
```bash
# Test: Get 10 products from different admins

GET /api/products/home

✅ Expected:
- Returns exactly 10 products (or fewer if < 10 active admins)
- Each product has different adminId
- Sorted by createdAt (newest first)
- All from active admins only

# Example Response:
{
  "products": [
    { "_id": "1", "adminId": "admin1", "createdAt": "2025-11-03" },
    { "_id": "2", "adminId": "admin2", "createdAt": "2025-11-02" },
    { "_id": "3", "adminId": "admin3", "createdAt": "2025-11-01" },
    ...
  ]
}
```

---

## 📊 Expected Response Codes

| Scenario | Code | Message |
|----------|------|---------|
| Success | 200 | Operation successful |
| Created | 201 | Resource created |
| Bad Request | 400 | Validation error |
| Unauthorized | 401 | No token or invalid token |
| Forbidden | 403 | No permission |
| Not Found | 404 | Resource not found |
| Server Error | 500 | Internal server error |

---

## 🔐 Authentication Tokens

To get tokens for testing:

### Customer Token
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}

Response: { "token": "eyJhbGc..." }
```

### Admin Token
```http
POST {{baseUrl}}/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response: { "token": "eyJhbGc..." }
```

### SuperAdmin Token
```http
POST {{baseUrl}}/superadmin/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "password123"
}

Response: { "token": "eyJhbGc..." }
```

---

## 🛠️ Environment Variables for Postman

Create these variables in Postman:

```
baseUrl = http://localhost:5000/api
customerToken = <get from login>
adminToken = <get from admin login>
superAdminToken = <get from superadmin login>
```

---

## ✅ Testing Checklist

### Basic Features
- [ ] Phone uniqueness (user registration)
- [ ] Phone uniqueness (admin creation)
- [ ] Admin code auto-generation
- [ ] Home page products (10 from different admins)
- [ ] Product discount calculation
- [ ] Product filtering by admin code
- [ ] Product filtering by price range
- [ ] Product sorting by rating
- [ ] Product sorting by discount

### Feedback System
- [ ] Submit feedback for delivered order
- [ ] Prevent duplicate feedback
- [ ] Product rating auto-update
- [ ] Get product reviews
- [ ] Get top 10 comments
- [ ] Admin view feedback

### Commission System
- [ ] Calculate commission (below threshold)
- [ ] Calculate commission (above threshold)
- [ ] Record commission payment (cash)
- [ ] Record commission payment (card)
- [ ] Get commission history
- [ ] Get pending commissions
- [ ] Generate monthly report
- [ ] Auto-deactivation on overdue
- [ ] Reactivation on payment

---

## 🐛 Common Issues & Solutions

### Issue: "Token expired or invalid"
**Solution**: Re-login to get fresh token

### Issue: "Admin not active"
**Solution**: Check if admin was auto-deactivated for overdue payment

### Issue: "Product not found"
**Solution**: Verify product belongs to active admin

### Issue: "Feedback already submitted"
**Solution**: Expected behavior - one feedback per order/product

### Issue: "Order not delivered"
**Solution**: Update order status to "delivered" first

---

**Last Updated**: November 3, 2025  
**Total Test Cases**: 8 scenarios + 30+ individual tests
