# Multi-Admin System - Quick Reference Guide

## 🚀 Quick Start

### For Developers

```bash
# 1. Start the backend server
cd backend
npm run dev

# 2. Run migration (ONE TIME ONLY - if you have existing orders)
node backend/migrations/addAdminIdToOrderItems.js

# 3. Test the system
# Use Postman or Thunder Client with API_TESTING_GUIDE.md
```

---

## 📋 Quick API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication Header
```
Authorization: Bearer {token}
```

---

## 🔑 Quick Endpoints

### USER ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | View all products (all admins) |
| POST | `/orders` | Create order (auto-assigns adminId to items) |
| GET | `/orders` | View own orders |
| GET | `/orders/:id` | View single order (own only) |

### ADMIN ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create product (adminId auto-assigned) |
| GET | `/products?adminId={id}` | Get own products |
| GET | `/orders/admin/all` | Get orders with admin's products |
| PUT | `/orders/:id/status` | Update order status |
| GET | `/admin/dashboard/stats` | 📊 Dashboard overview |
| GET | `/admin/products/stats` | 📊 Product analytics |
| GET | `/admin/orders/stats` | 📊 Order analytics |
| GET | `/admin/revenue?period=month` | 💰 Revenue report |

### SUPER ADMIN ENDPOINTS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/superadmin/dashboard/stats` | 📊 System overview + admin-wise stats |
| GET | `/superadmin/admins` | List all admins |
| POST | `/superadmin/admins` | Create admin |
| PATCH | `/superadmin/admins/:id/activate` | Activate admin |
| PATCH | `/superadmin/admins/:id/deactivate` | Deactivate admin |

---

## 🎯 Key Concepts

### Order Structure (After Migration)
```json
{
  "orderNumber": "BG-123456",
  "userId": "user_id",
  "items": [
    {
      "productId": "product_1",
      "adminId": "admin_1",  // ✅ Admin who owns this product
      "name": "Red Roses",
      "price": 50,
      "quantity": 2
    },
    {
      "productId": "product_2",
      "adminId": "admin_2",  // ✅ Different admin's product
      "name": "Teddy Bear",
      "price": 30,
      "quantity": 1
    }
  ],
  "total": 130
}
```

### What Each Role Sees

**User:**
- ✅ All products from active admins
- ✅ All items in their orders
- ❌ Cannot see other users' orders

**Admin (e.g., admin_1):**
- ✅ Only their own products
- ✅ Orders containing at least one of their products
- ✅ In each order, only THEIR items are shown
- ✅ `adminTotal` field shows their revenue
- ❌ Cannot see other admins' products or full orders

**Super Admin:**
- ✅ Everything
- ✅ All products, all orders, all items
- ✅ Admin-wise statistics
- ✅ Can manage admin accounts

---

## 🔐 Security Rules

### Product Access
```javascript
✅ Create: Admin creates product → adminId = current admin
✅ Update: Admin can update only if product.adminId === admin._id
✅ Delete: Admin can delete only if product.adminId === admin._id
✅ View: Users see products from ACTIVE admins only
```

### Order Access
```javascript
✅ Create: User creates order → each item gets product's adminId
✅ View: Users see only their orders (userId filter)
✅ View: Admins see orders with items.adminId === admin._id
✅ Update: Admins can update if order has their products
```

---

## 📊 Analytics Quick Reference

### Admin Dashboard Response
```json
{
  "products": {
    "active": 10,
    "inactive": 2,
    "out_of_stock": 1,
    "total": 13
  },
  "orders": {
    "pending": 5,
    "delivered": 20,
    "total": 28
  },
  "revenue": {
    "total": 5000,
    "orderCount": 20
  }
}
```

### Super Admin Dashboard Response
```json
{
  "totalAdmins": 5,
  "totalProducts": 150,
  "totalOrders": 500,
  "adminWiseStats": [
    {
      "adminId": "...",
      "adminName": "Admin 1",
      "products": { "active": 10, "total": 13 },
      "orders": 45,
      "revenue": 5000
    }
  ]
}
```

---

## 🛠️ Common Tasks

### Test Multi-Admin Order
```javascript
// 1. Get products from different admins
GET /api/products
// Note adminId of different products

// 2. Create order with multiple admin products
POST /api/orders
{
  "items": [
    { "productId": "prod_from_admin1", ... },
    { "productId": "prod_from_admin2", ... }
  ]
}

// 3. Verify adminId assigned to each item
GET /api/orders/{orderId}
// Check each item has correct adminId
```

### Test Admin Filtering
```javascript
// 1. Login as Admin 1
POST /api/admin/login

// 2. View orders (should only show orders with Admin 1's products)
GET /api/orders/admin/all

// 3. Verify filtering
// - Order list should only show orders with admin's products
// - Each order's items should only show admin's items
// - adminTotal should show revenue from admin's items only
```

### Verify Security
```javascript
// Test 1: Admin cannot update other admin's product
PUT /api/products/{other_admin_product_id}
// Expected: 403 Forbidden

// Test 2: User cannot see other user's orders
GET /api/orders/{other_user_order_id}
// Expected: 404 Not Found

// Test 3: Admin endpoint with user token
GET /api/admin/dashboard/stats
// Expected: 403 Forbidden
```

---

## 🚨 Troubleshooting Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Orders not showing for admin | Run migration script |
| Admin sees all orders | Check items filtering in getAllOrders |
| Dashboard shows zeros | Verify adminId in order items |
| Products from deactivated admin visible | Check Admin.isActive filter |
| Cannot create order | Ensure products exist and admin is active |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/models/Order.js` | Order schema with adminId in items |
| `backend/controllers/orderController.js` | Order management logic |
| `backend/controllers/adminAnalyticsController.js` | Admin analytics |
| `backend/controllers/superAdminController.js` | Super admin features |
| `backend/migrations/addAdminIdToOrderItems.js` | Migration script |

---

## 💡 Tips

### For Testing
1. Create 2-3 admin accounts
2. Each admin creates 2-3 products
3. User places order with products from different admins
4. Login as each admin to verify they only see their data
5. Login as super admin to verify full visibility

### For Development
1. Check `adminId` is always present in order items
2. Use aggregation for analytics (better performance)
3. Filter at database level, not in code
4. Always verify admin ownership before updates
5. Log admin actions for audit trail

### For Production
1. Run migration script before deploying
2. Add database index: `db.orders.createIndex({ "items.adminId": 1 })`
3. Monitor query performance
4. Set up alerts for failed permission checks
5. Regular backup before schema changes

---

## 📚 Documentation Files

| Document | What It Contains |
|----------|------------------|
| `IMPLEMENTATION_SUMMARY.md` | Complete implementation details |
| `MULTI_ADMIN_SYSTEM_README.md` | System architecture and API specs |
| `API_TESTING_GUIDE.md` | Step-by-step testing examples |
| `QUICK_REFERENCE.md` | This file - quick lookup |

---

## ✅ Pre-Deployment Checklist

- [ ] Migration script tested
- [ ] All endpoints tested with Postman
- [ ] Security tests passed
- [ ] Admin filtering verified
- [ ] Super admin stats showing correctly
- [ ] Database indexes added
- [ ] Environment variables set
- [ ] Backup database
- [ ] Documentation reviewed

---

## 🎯 One-Line Summary

**What changed:** Order items now have `adminId`, admins see only their data, super admin sees admin-wise stats.

**Why:** Enable multiple admins to independently manage products and orders.

**How:** Filter queries by `items.adminId`, enrich order items with admin info, add analytics.

---

**Last Updated:** November 1, 2025  
**Version:** 1.0.0
