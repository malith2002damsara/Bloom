# Multi-Admin Product and Order Management System

## Overview

This system implements a comprehensive multi-admin architecture where:
- **Users** can view products from all admins and place orders
- **Admins** can only manage their own products and view orders containing their products
- **Super Admins** have full system visibility with admin-wise analytics

## Database Schema

### Order Model Enhancement
Each order item now includes `adminId` to track which admin owns each product:

```javascript
{
  productId: String,
  adminId: ObjectId (ref: 'Admin'),  // NEW FIELD
  name: String,
  price: Number,
  quantity: Number,
  image: String
}
```

### Product Model
Products are already linked to admins via `adminId` field:
```javascript
{
  name: String,
  adminId: ObjectId (ref: 'Admin'),
  status: ['active', 'inactive', 'out_of_stock'],
  // ... other fields
}
```

## Role-Based Access Control (RBAC)

### User Role
**Permissions:**
- View all products from active admins
- Place orders with products from multiple admins
- View their own orders only
- Cancel their own orders (before shipping)

**Endpoints:**
- `GET /api/products` - View all products
- `GET /api/products/:id` - View single product
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get own orders
- `GET /api/orders/:id` - Get single order (own only)
- `PUT /api/orders/:id/cancel` - Cancel order

### Admin Role
**Permissions:**
- Manage only their own products (create, update, delete)
- View orders containing at least one of their products
- Update order status for orders with their products
- View analytics for their own products and orders
- Cannot access other admins' data

**Endpoints:**

**Product Management:**
- `POST /api/products` - Create product (auto-assigns adminId)
- `PUT /api/products/:id` - Update own product
- `DELETE /api/products/:id` - Delete own product
- `GET /api/products?adminId={adminId}` - Get own products

**Order Management:**
- `GET /api/orders/admin/all` - Get orders with admin's products (filtered)
- `PUT /api/orders/:id/status` - Update order status

**Analytics:**
- `GET /api/admin/dashboard/stats` - Dashboard overview
  - Product counts by status
  - Order counts by status
  - Revenue statistics
  - Recent orders and products
  
- `GET /api/admin/products/stats` - Detailed product statistics
  - By status and category
  - Stock information
  - Price analytics
  
- `GET /api/admin/orders/stats` - Order analytics
  - Order trends by status
  - Monthly trends
  - Top selling products
  
- `GET /api/admin/revenue?period={all|today|week|month|year}` - Revenue reports
  - Revenue by status
  - Revenue by category
  - Pending and completed revenue

### Super Admin Role
**Permissions:**
- View all system data
- Manage admin accounts
- View admin-wise statistics
- Access transaction management
- Full system analytics

**Endpoints:**

**Admin Management:**
- `POST /api/superadmin/admins` - Create admin
- `GET /api/superadmin/admins` - Get all admins
- `GET /api/superadmin/admins/:id` - Get single admin
- `PUT /api/superadmin/admins/:id` - Update admin
- `PATCH /api/superadmin/admins/:id/activate` - Activate admin
- `PATCH /api/superadmin/admins/:id/deactivate` - Deactivate admin
- `DELETE /api/superadmin/admins/:id` - Delete admin

**Dashboard & Analytics:**
- `GET /api/superadmin/dashboard/stats` - System overview with admin-wise stats
  - Returns:
    ```json
    {
      "totalAdmins": 10,
      "activeAdmins": 8,
      "totalProducts": 150,
      "totalOrders": 500,
      "totalRevenue": 50000,
      "adminWiseStats": [
        {
          "adminId": "...",
          "adminName": "Admin Name",
          "products": {
            "active": 10,
            "inactive": 2,
            "out_of_stock": 1,
            "total": 13
          },
          "orders": 45,
          "revenue": 5000
        }
      ]
    }
    ```

**Transaction Management:**
- `GET /api/superadmin/transactions` - Get all transactions
  - Query params: status, paymentStatus, type, adminId, month, year
  
- `POST /api/superadmin/transactions/generate-monthly` - Generate commission transactions
  
- `GET /api/superadmin/transactions/:id` - Get transaction details
  
- `PUT /api/superadmin/transactions/:id/status` - Update transaction status
  
- `PUT /api/superadmin/transactions/:id/payment` - Update payment info
  
- `GET /api/superadmin/admins/:id/commission-report` - Admin commission report

## Key Features Implemented

### 1. Order Assignment to Multiple Admins
When a user places an order with products from different admins:
- Each order item is automatically assigned its admin's ID
- Order is created with all items
- Each admin receives notification for their products
- Each admin can only see their items in the order

**Example Order:**
```json
{
  "orderNumber": "BG-123456",
  "userId": "user123",
  "items": [
    {
      "productId": "prod1",
      "adminId": "admin1",  // Admin 1's product
      "name": "Red Roses",
      "price": 50,
      "quantity": 2
    },
    {
      "productId": "prod2",
      "adminId": "admin2",  // Admin 2's product
      "name": "Teddy Bear",
      "price": 30,
      "quantity": 1
    }
  ],
  "total": 130
}
```

### 2. Product Filtering
**For Users:**
- See all products from active admins
- Products from deactivated admins are hidden

**For Admins:**
- Can only see and manage their own products
- `GET /api/products?adminId={adminId}` returns only their products

**For Super Admin:**
- Can view all products
- Can filter by specific admin

### 3. Order Filtering
**For Users:**
- See only their own orders with all items

**For Admins:**
- Query: `GET /api/orders/admin/all`
- Returns orders containing at least one of their products
- Items in each order are filtered to show only admin's products
- `adminTotal` field shows revenue from admin's items only

**For Super Admin:**
- See all orders with all items
- Can filter by admin, status, date range

### 4. Admin Analytics

**Dashboard Stats (`/api/admin/dashboard/stats`):**
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
```

**Product Stats (`/api/admin/products/stats`):**
- Count by status and category
- Stock information (total, average, low stock, out of stock)
- Price analytics (average, min, max)

**Order Stats (`/api/admin/orders/stats`):**
- Orders by status with revenue
- Monthly trends (last 6 months)
- Top 10 selling products

**Revenue Report (`/api/admin/revenue?period=month`):**
- Total, pending, and cancelled revenue
- Revenue breakdown by order status
- Revenue by product category

### 5. Super Admin Features

**Admin-Wise Statistics:**
- Product counts by status per admin
- Order counts per admin
- Revenue per admin
- All displayed in dashboard stats

**Transaction Management:**
- Track commissions per admin
- Monthly commission generation
- Payment tracking and status updates
- Admin-specific commission reports

## Security Implementation

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based middleware (`auth`, `adminOnly`, `superAdminOnly`)
- Token includes user role for quick validation

### 2. Data Access Control

**Product Access:**
- Create/Update/Delete: Only product owner or superadmin
- Verification in controller:
  ```javascript
  if (req.user.role !== 'superadmin' && 
      product.adminId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  ```

**Order Access:**
- Users: Only their own orders
- Admins: Orders containing their products
- Query-level filtering in database:
  ```javascript
  // Admin filter
  { 'items.adminId': adminId }
  
  // User filter
  { userId: req.user._id }
  ```

**Admin Account Access:**
- Only super admin can create, update, activate/deactivate admins
- Admins can view/update only their own profile

### 3. Data Validation
- Product ownership verified on update/delete
- Order item adminId auto-assigned from product data
- Admin active status checked when fetching products
- Permission checks before status updates

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (dev mode only)"
}
```

## Testing Scenarios

### 1. User Flow
```bash
# User views all products (from all admins)
GET /api/products

# User places order with products from Admin1 and Admin2
POST /api/orders
Body: {
  "items": [
    { "productId": "prod_admin1", "quantity": 2 },
    { "productId": "prod_admin2", "quantity": 1 }
  ]
}

# User views their orders
GET /api/orders
```

### 2. Admin Flow
```bash
# Admin logs in
POST /api/admin/login

# Admin views dashboard
GET /api/admin/dashboard/stats

# Admin views their products only
GET /api/products?adminId={adminId}

# Admin creates new product (adminId auto-assigned)
POST /api/products

# Admin views orders containing their products
GET /api/orders/admin/all

# Admin updates order status
PUT /api/orders/{orderId}/status
```

### 3. Super Admin Flow
```bash
# Super admin logs in
POST /api/superadmin/login

# View system dashboard with admin-wise stats
GET /api/superadmin/dashboard/stats

# View all admins
GET /api/superadmin/admins

# Create new admin
POST /api/superadmin/admins

# Deactivate admin (their products become hidden)
PATCH /api/superadmin/admins/{id}/deactivate

# View all transactions
GET /api/superadmin/transactions

# Generate monthly commissions
POST /api/superadmin/transactions/generate-monthly
```

## Database Indexes

For optimal performance, the following indexes are created:

**Product Model:**
```javascript
{ adminId: 1 }
{ adminId: 1, category: 1 }
{ adminId: 1, status: 1 }
```

**Order Model:**
```javascript
{ userId: 1 }
{ 'items.adminId': 1 }
{ orderStatus: 1 }
{ createdAt: -1 }
```

**Transaction Model:**
```javascript
{ adminId: 1, 'period.year': 1, 'period.month': 1 }
{ status: 1, paymentStatus: 1 }
{ createdAt: -1 }
```

## Migration Guide

If you have existing orders without `adminId` in items, run this migration:

```javascript
const Order = require('./models/Order');
const Product = require('./models/Product');

async function migrateOrders() {
  const orders = await Order.find({});
  
  for (const order of orders) {
    let updated = false;
    
    for (const item of order.items) {
      if (!item.adminId) {
        const product = await Product.findById(item.productId);
        if (product) {
          item.adminId = product.adminId;
          updated = true;
        }
      }
    }
    
    if (updated) {
      await order.save();
      console.log(`Updated order ${order.orderNumber}`);
    }
  }
  
  console.log('Migration complete!');
}

migrateOrders();
```

## Environment Variables

Ensure these are set in your `.env` file:

```env
JWT_SECRET=your_secret_key
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
PORT=5000
```

## Best Practices

1. **Always verify admin ownership** before allowing product modifications
2. **Filter data at query level** rather than in application code for better performance
3. **Use aggregation pipelines** for complex analytics queries
4. **Cache admin product lists** if doing frequent lookups
5. **Log all admin actions** for audit trail
6. **Validate adminId exists and is active** before order creation
7. **Use transactions** for critical operations that modify multiple collections

## Future Enhancements

1. **Partial Order Fulfillment**: Allow each admin to ship their items separately
2. **Multi-warehouse Support**: Track inventory per admin location
3. **Commission Automation**: Auto-calculate and generate commission invoices
4. **Admin Permissions**: Granular permissions within admin role
5. **Order Split UI**: Show users which items come from which admin
6. **Admin Messaging**: Direct communication between admins and customers
7. **Review System**: Admin-specific product reviews
8. **Reporting Dashboard**: Advanced analytics with charts and exports

## Support

For issues or questions about the multi-admin system:
1. Check this documentation first
2. Review the controller code for implementation details
3. Test with Postman or similar API client
4. Check server logs for detailed error messages

---

**Last Updated:** November 2025
**Version:** 1.0.0
