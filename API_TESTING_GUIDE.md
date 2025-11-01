# API Testing Guide for Multi-Admin System

This guide provides sample API calls to test the multi-admin system functionality.

## Prerequisites

1. Start the backend server
2. Have at least one user, one admin, and one superadmin account
3. Use Postman, Thunder Client, or curl for testing

## Base URL
```
http://localhost:5000/api
```

---

## 1. USER ROLE TESTS

### 1.1 User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### 1.2 User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response includes token - save it for subsequent requests**

### 1.3 View All Products (from all active admins)
```http
GET /products
Authorization: Bearer {user_token}
```

**Expected:** Products from all active admins

### 1.4 Create Order with Products from Multiple Admins
```http
POST /orders
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "items": [
    {
      "productId": "67xxx...admin1_product",
      "name": "Red Roses Bouquet",
      "price": 50,
      "quantity": 2,
      "image": "https://..."
    },
    {
      "productId": "67xxx...admin2_product",
      "name": "Teddy Bear",
      "price": 30,
      "quantity": 1,
      "image": "https://..."
    }
  ],
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "paymentMethod": "cod",
  "subtotal": 130,
  "tax": 0,
  "shipping": 0,
  "discount": 0,
  "total": 130
}
```

**Expected:** 
- Order created successfully
- Each item automatically assigned adminId
- Both admins receive notifications

### 1.5 View User's Orders
```http
GET /orders
Authorization: Bearer {user_token}
```

**Expected:** Only user's own orders

### 1.6 View Single Order
```http
GET /orders/{orderId}
Authorization: Bearer {user_token}
```

**Expected:** Order details (only if it belongs to this user)

### 1.7 Try to Access Another User's Order (Should Fail)
```http
GET /orders/{other_user_order_id}
Authorization: Bearer {user_token}
```

**Expected:** 404 Not Found (security check working)

---

## 2. ADMIN ROLE TESTS

### 2.1 Admin Login
```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response includes token - save it**

### 2.2 View Own Products
```http
GET /products?adminId={admin_id}
Authorization: Bearer {admin_token}
```

**Expected:** Only this admin's products

### 2.3 Create Product (adminId auto-assigned)
```http
POST /products
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

{
  "name": "Beautiful Rose Bouquet",
  "description": "Fresh red roses",
  "category": "fresh",
  "occasion": "romantic",
  "sizes": [
    {
      "size": "Medium",
      "flowerCount": "12",
      "price": 50,
      "dimensions": { "height": 30, "width": 20, "depth": 20 }
    }
  ],
  "freshFlowerSelections": [
    {
      "flower": "Rose",
      "colors": ["Red", "Pink"],
      "count": "12"
    }
  ],
  "seller": {
    "name": "Admin Shop",
    "contact": "1234567890"
  },
  "images": [file1, file2]
}
```

**Expected:** Product created with adminId = current admin's ID

### 2.4 View Orders Containing Admin's Products
```http
GET /orders/admin/all?page=1&limit=10
Authorization: Bearer {admin_token}
```

**Expected:** 
- Orders that contain at least one of admin's products
- Items filtered to show only admin's products
- `adminTotal` field shows revenue from admin's items

### 2.5 Update Order Status
```http
PUT /orders/{orderId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "orderStatus": "processing",
  "trackingNumber": "TRACK123"
}
```

**Expected:** 
- Success if order contains admin's products
- 403 if order doesn't contain admin's products

### 2.6 Admin Dashboard Stats
```http
GET /admin/dashboard/stats
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "products": {
      "active": 10,
      "inactive": 2,
      "out_of_stock": 1,
      "total": 13
    },
    "orders": {
      "pending": 5,
      "processing": 3,
      "delivered": 20,
      "total": 28
    },
    "revenue": {
      "total": 5000,
      "orderCount": 20
    },
    "pendingOrders": [...],
    "recentProducts": [...]
  }
}
```

### 2.7 Product Statistics
```http
GET /admin/products/stats
Authorization: Bearer {admin_token}
```

**Expected:** Detailed product analytics for admin's products

### 2.8 Order Statistics
```http
GET /admin/orders/stats
Authorization: Bearer {admin_token}
```

**Expected:** Order trends and top products for admin

### 2.9 Revenue Report
```http
GET /admin/revenue?period=month
Authorization: Bearer {admin_token}
```

**Expected:** Revenue breakdown by status and category

### 2.10 Try to Update Another Admin's Product (Should Fail)
```http
PUT /products/{other_admin_product_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

**Expected:** 403 Forbidden (security check working)

---

## 3. SUPER ADMIN ROLE TESTS

### 3.1 Super Admin Login
```http
POST /superadmin/login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "super123"
}
```

### 3.2 Create New Admin
```http
POST /superadmin/admins
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "admin123",
  "phone": "9876543210"
}
```

**Expected:** New admin account created

### 3.3 View All Admins
```http
GET /superadmin/admins
Authorization: Bearer {superadmin_token}
```

**Expected:** List of all admin accounts

### 3.4 Dashboard with Admin-Wise Stats
```http
GET /superadmin/dashboard/stats
Authorization: Bearer {superadmin_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalAdmins": 5,
    "activeAdmins": 4,
    "totalProducts": 150,
    "totalOrders": 500,
    "totalRevenue": 50000,
    "adminWiseStats": [
      {
        "adminId": "67xxx1",
        "adminName": "Admin 1",
        "adminEmail": "admin1@example.com",
        "products": {
          "active": 10,
          "inactive": 2,
          "out_of_stock": 1,
          "total": 13
        },
        "orders": 45,
        "revenue": 5000
      },
      {
        "adminId": "67xxx2",
        "adminName": "Admin 2",
        "products": {
          "active": 15,
          "inactive": 1,
          "out_of_stock": 0,
          "total": 16
        },
        "orders": 60,
        "revenue": 7500
      }
    ]
  }
}
```

### 3.5 Deactivate Admin
```http
PATCH /superadmin/admins/{adminId}/deactivate
Authorization: Bearer {superadmin_token}
```

**Expected:** 
- Admin account deactivated
- Their products no longer visible to users
- They cannot login

### 3.6 Activate Admin
```http
PATCH /superadmin/admins/{adminId}/activate
Authorization: Bearer {superadmin_token}
```

**Expected:** 
- Admin account reactivated
- Their products visible again
- They can login

### 3.7 View All Orders (All Admins)
```http
GET /orders/admin/all?page=1&limit=20
Authorization: Bearer {superadmin_token}
```

**Expected:** All orders with all items visible

### 3.8 Generate Monthly Commissions
```http
POST /superadmin/transactions/generate-monthly
Authorization: Bearer {superadmin_token}
Content-Type: application/json

{
  "month": 11,
  "year": 2025
}
```

**Expected:** Commission transactions created for all admins

### 3.9 View All Transactions
```http
GET /superadmin/transactions?page=1&limit=50
Authorization: Bearer {superadmin_token}
```

**Expected:** All commission transactions with admin details

### 3.10 Filter Transactions by Admin
```http
GET /superadmin/transactions?adminId={adminId}
Authorization: Bearer {superadmin_token}
```

**Expected:** Only transactions for specified admin

### 3.11 Admin Commission Report
```http
GET /superadmin/admins/{adminId}/commission-report
Authorization: Bearer {superadmin_token}
```

**Expected:** Detailed commission history for admin

---

## 4. SECURITY TESTS

### 4.1 Access Admin Endpoint as User (Should Fail)
```http
GET /admin/dashboard/stats
Authorization: Bearer {user_token}
```

**Expected:** 403 Forbidden

### 4.2 Access SuperAdmin Endpoint as Admin (Should Fail)
```http
GET /superadmin/admins
Authorization: Bearer {admin_token}
```

**Expected:** 403 Forbidden

### 4.3 Access Protected Endpoint Without Token (Should Fail)
```http
GET /orders
```

**Expected:** 401 Unauthorized

### 4.4 Admin Try to View Another Admin's Orders
```http
GET /orders/admin/all
Authorization: Bearer {admin1_token}
```

**Expected:** Only orders containing admin1's products (admin2's items filtered out)

---

## 5. EDGE CASES

### 5.1 Create Order with Product from Deactivated Admin
```http
POST /orders
Authorization: Bearer {user_token}

{
  "items": [
    {
      "productId": "{deactivated_admin_product_id}",
      ...
    }
  ],
  ...
}
```

**Expected:** 500 error "Product is no longer available"

### 5.2 View Products After Admin Deactivation
```http
GET /products
Authorization: Bearer {user_token}
```

**Expected:** Deactivated admin's products not in list

### 5.3 Empty Order Items
```http
POST /orders
Authorization: Bearer {user_token}

{
  "items": [],
  ...
}
```

**Expected:** Validation error

### 5.4 Admin Update Product They Don't Own
```http
PUT /products/{product_id_from_different_admin}
Authorization: Bearer {admin_token}

{
  "name": "Hacked Name"
}
```

**Expected:** 403 Forbidden or 404 Not Found

---

## 6. DATA VALIDATION TESTS

### 6.1 Create Order with Invalid Product ID
```http
POST /orders
Authorization: Bearer {user_token}

{
  "items": [
    {
      "productId": "invalid_id_12345",
      ...
    }
  ],
  ...
}
```

**Expected:** Error "Product not found"

### 6.2 Create Product Missing Required Fields
```http
POST /products
Authorization: Bearer {admin_token}

{
  "name": "Incomplete Product"
  // Missing category, seller, images, etc.
}
```

**Expected:** Validation error with details

---

## Testing Checklist

- [ ] Users can view products from all active admins
- [ ] Users can create orders with products from multiple admins
- [ ] Users can only view their own orders
- [ ] Admins can only view their own products
- [ ] Admins can view orders containing their products
- [ ] Admin order items are filtered to show only their products
- [ ] Admins cannot modify other admins' products
- [ ] Admin dashboard shows correct statistics
- [ ] Super admin can view all data
- [ ] Super admin dashboard shows admin-wise statistics
- [ ] Deactivated admin products are hidden from users
- [ ] Order items have correct adminId assigned
- [ ] Commission transactions are generated correctly
- [ ] Security: Role-based access is enforced
- [ ] Security: Users cannot access other users' data
- [ ] Security: Admins cannot access other admins' data

---

## Common Issues & Solutions

### Issue: Orders not filtered properly for admin
**Solution:** Ensure order items have adminId field. Run migration if needed.

### Issue: Products from deactivated admin still showing
**Solution:** Clear cache, check Admin.isActive = true filter in query

### Issue: Admin dashboard showing zero values
**Solution:** Ensure adminId in Order items matches Product.adminId

### Issue: 401 Unauthorized on valid token
**Solution:** Check token expiration, verify JWT_SECRET matches

### Issue: Cannot create order
**Solution:** Verify all products exist and belong to active admins

---

## Sample Test Results

### Successful User Order Creation:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "67xxx",
      "orderNumber": "BG-123456",
      "items": [
        {
          "productId": "prod1",
          "adminId": "admin1",  // ✅ Auto-assigned
          "name": "Red Roses",
          "price": 50,
          "quantity": 2
        }
      ],
      "total": 100,
      "orderStatus": "pending"
    }
  }
}
```

### Admin Viewing Orders (Filtered):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order123",
        "orderNumber": "BG-123456",
        "items": [
          // ✅ Only shows this admin's items
          {
            "productId": "prod1",
            "adminId": "current_admin_id",
            "name": "Red Roses"
          }
          // ❌ Other admin's items filtered out
        ],
        "total": 130,  // Original order total
        "adminTotal": 100  // ✅ Revenue from admin's items only
      }
    ]
  }
}
```

---

**Last Updated:** November 2025
**Version:** 1.0.0
