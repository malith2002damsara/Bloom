# Admin Frontend Implementation Guide

## ✅ Completed Backend Features

### 1. Commission Payment System
- **Model**: `backend/models/CommissionPayment.js`
- **Controller**: `backend/controllers/adminCommissionController.js`
- **Endpoints**:
  - GET `/api/admin/commission/pending` - Get pending commission
  - POST `/api/admin/commission/pay-with-cash` - Submit cash payment
  - POST `/api/admin/commission/create-payment-intent` - Create Stripe intent
  - POST `/api/admin/commission/confirm-stripe-payment` - Confirm Stripe payment
  - GET `/api/admin/commission/history` - Get payment history
  - GET `/api/admin/commission/stats` - Get payment statistics

### 2. Admin Analytics
- **Controller**: `backend/controllers/adminAnalyticsController.js`
- **Endpoints**:
  - GET `/api/admin/analytics/top-products?period=last_30_days` - Top selling products
  - GET `/api/admin/recent-reviews` - Recent customer feedback (last 7)
  - GET `/api/admin/dashboard` - Simplified dashboard (no order IDs/customer info)

### 3. Admin Profile
- **Controller**: `backend/controllers/adminProfileController.js`
- **Model Updates**: Added `shopName`, `shopDescription`, `address`, `contactInfo` to Admin model
- **Endpoints**:
  - GET `/api/admin/profile` - Get admin profile
  - PUT `/api/admin/profile` - Update profile
  - GET `/api/admin/shop-info` - Get shop info
  - PUT `/api/admin/profile/password` - Change password

---

## 🎨 Frontend Components to Build

### ✅ COMPLETED:
1. **CommissionPaymentModal.jsx** - Modal with Cash/Card payment options
2. **CommissionPayments.jsx** - Payment history page

### 📋 REMAINING COMPONENTS:

### 3. Analytics Page (`admin/src/pages/Analytics.jsx`)

**Purpose**: Display top-selling products with charts and statistics

**Features**:
- Period selector (7 days, 30 days, 90 days, this month, this year, all time)
- Top 10 products horizontal bar chart
- Product cards with:
  - Product image
  - Product name
  - Total quantity sold
  - Total revenue
  - Number of orders
  - Average rating
  - Current stock
  - Discount percentage

**API Call**:
```javascript
GET /api/admin/analytics/top-products?period=last_30_days&limit=10
```

**UI Layout**:
```
┌────────────────────────────────────────┐
│  Analytics - Top Selling Products      │
│                                         │
│  [7 Days] [30 Days] [90 Days] [...]   │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ Horizontal Bar Chart            │  │
│  │ Product A ████████████ 150 sold │  │
│  │ Product B ████████ 120 sold     │  │
│  │ Product C ██████ 90 sold        │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ Card │  │ Card │  │ Card │        │
│  └──────┘  └──────┘  └──────┘        │
└────────────────────────────────────────┘
```

---

### 4. Update Dashboard (`admin/src/pages/Dashboard.jsx`)

**Changes Required**:

#### A. Add Recent Orders Widget (Simplified)
- Remove order ID display
- Remove customer name, email, phone
- Show only:
  - Product image
  - Product name
  - Quantity
  - Total amount
  - Status badge
  - Order date

**API Call**:
```javascript
GET /api/admin/dashboard
// Returns: { admin, stats, recentOrders }
// recentOrders = [{ productName, productImage, quantity, totalAmount, status, orderDate }]
```

#### B. Add Recent Feedback Widget
- Display last 5-7 customer reviews
- Show:
  - Product image (small thumbnail)
  - Product name
  - Customer name
  - Rating (stars)
  - Comment text (truncated)
  - Date

**API Call**:
```javascript
GET /api/admin/recent-reviews?limit=7
```

#### C. Add Promo Code Display
- Show admin's unique code prominently
- Format: Large card with copy button
- Example: "SHOP_JOHN"

**API Response** (from GET `/api/admin/dashboard`):
```javascript
{
  admin: {
    name: "John Doe",
    email: "john@example.com",
    promoCode: "JOH1234",
    isActive: true
  }
}
```

#### D. Add Pending Commission Card
- Display pending commission amount
- "Pay Now" button → Opens CommissionPaymentModal
- Show last payment date

---

### 5. Update Product Add/Edit Pages (`admin/src/pages/Add.jsx`)

**Changes Required**:

#### A. Remove Seller Dropdown
- Delete any "Seller" selection fields
- Auto-set `adminId` from authenticated admin (backend handles this)

#### B. Add Discount Input
- Field: "Discount %"
- Type: Number input (0-100)
- Location: After price field
- Display: Shows calculated final price in real-time

**Code Example**:
```jsx
<div>
  <label>Price (Rs.)</label>
  <input
    type="number"
    value={price}
    onChange={(e) => setPrice(e.target.value)}
  />
</div>

<div>
  <label>Discount (%)</label>
  <input
    type="number"
    min="0"
    max="100"
    value={discount}
    onChange={(e) => setDiscount(e.target.value)}
  />
</div>

{discount > 0 && (
  <div className="bg-green-50 p-3 rounded">
    <p className="text-sm text-gray-700">
      Final Price: Rs. {(price * (1 - discount / 100)).toFixed(2)}
    </p>
    <p className="text-xs text-gray-500">
      You save: Rs. {(price * (discount / 100)).toFixed(2)}
    </p>
  </div>
)}
```

#### C. Auto-Filter Products (List Page)
- Backend already filters by `adminId`
- No frontend changes needed for filtering
- Just ensure API calls include auth token

---

### 6. Update Orders Page (`admin/src/pages/Orders.jsx`)

**Changes Required**:

#### A. Remove Order ID Column from Table
- Delete "Order ID" column header
- Delete order ID cell in table rows
- Keep: Date, Customer, Items, Total, Status, Actions

**Before**:
```
| Order ID | Date | Customer | Items | Total | Status | Actions |
```

**After**:
```
| Date | Customer | Items | Total | Status | Actions |
```

#### B. Update Order Details View
- Hide/minimize order ID display (or show only last 8 digits)
- Focus on:
  - Customer details (name, address, phone)
  - Order items with images
  - Status timeline
  - Update status buttons

---

### 7. Fix Notification System (`admin/src/components/NotificationBell.jsx`)

**CSS Fixes**:
```css
.notification-dropdown {
  max-height: 400px;
  overflow-y: auto;
  min-width: 320px;
  /* Prevent clipping */
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 50;
}
```

**Navigation Fix**:
```jsx
const handleNotificationClick = (notification) => {
  // Mark as read
  markAsRead(notification._id);
  
  // Navigate to order details
  if (notification.orderId) {
    navigate(`/admin/orders/${notification.orderId}`);
  }
};
```

---

### 8. Create Admin Profile Page (`admin/src/pages/Profile.jsx`)

**Sections**:

#### A. Shop Information Card
- Editable fields:
  - Shop Name
  - Shop Description (textarea)
  - Contact Info
  - Address
- Save button

#### B. Promo Code Display
- Large, prominent display
- Copy to clipboard button
- Example: "Your Store Code: SHOP_JOHN"

#### C. Personal Information Card
- Name
- Email
- Phone (with validation)
- Change Password button → Modal

#### D. Account Statistics
- Total products
- Total orders
- Total earnings
- Account status (Active/Inactive)

**API Calls**:
```javascript
GET /api/admin/profile
PUT /api/admin/profile
GET /api/admin/shop-info
PUT /api/admin/profile/password
```

---

## 🔧 Implementation Priority

### High Priority (Do First):
1. ✅ Commission Payment Modal - DONE
2. ✅ Commission Payment History - DONE
3. **Dashboard Updates** (Recent orders, feedback, promo code)
4. **Product Management** (Remove seller dropdown, add discount)

### Medium Priority:
5. **Analytics Page** (Top products chart)
6. **Profile Page** (Shop info, promo code)
7. **Orders Cleanup** (Remove order ID)

### Low Priority:
8. **Notification Fixes** (CSS + navigation)

---

## 📦 Required Dependencies

### Already Installed:
- `react`
- `react-router-dom`
- `axios`
- `react-icons`

### Need to Install:
```bash
cd admin
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install recharts # For charts in Analytics page
```

---

## 🎨 Design Guidelines

### Color Scheme:
- Primary: Purple (`#9333EA`) to Pink (`#EC4899`)
- Success: Green (`#10B981`)
- Warning: Yellow (`#F59E0B`)
- Danger: Red (`#EF4444`)
- Info: Blue (`#3B82F6`)

### Card Styling:
```jsx
className="bg-white rounded-xl shadow-lg p-6"
```

### Button Styling:
```jsx
// Primary
className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg"

// Secondary
className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
```

### Badge Styling:
```jsx
// Status badges
className="px-3 py-1 rounded-full text-xs font-semibold"

// Pending: bg-yellow-100 text-yellow-800
// Success: bg-green-100 text-green-800
// Error: bg-red-100 text-red-800
```

---

## 🧪 Testing Checklist

### Commission Payment:
- [ ] Modal opens when clicking "Pay Commission"
- [ ] Cash payment submission works
- [ ] Card payment with Stripe works
- [ ] Payment history displays correctly
- [ ] Stats cards show correct values

### Analytics:
- [ ] Period selector works
- [ ] Chart displays top products
- [ ] Product cards show all data
- [ ] Data refreshes when period changes

### Dashboard:
- [ ] Recent orders show (no order ID/customer info)
- [ ] Recent feedback displays
- [ ] Promo code is visible and copyable
- [ ] Pending commission card works
- [ ] "Pay Now" button opens modal

### Products:
- [ ] No seller dropdown visible
- [ ] Discount input works (0-100%)
- [ ] Final price calculates correctly
- [ ] Products auto-filter to admin's products

### Orders:
- [ ] Order ID column removed from list
- [ ] Order details hide/minimize order ID
- [ ] Customer info displays properly
- [ ] Status updates work

### Profile:
- [ ] Shop info loads correctly
- [ ] Can edit and save shop details
- [ ] Promo code displays
- [ ] Can change password
- [ ] Statistics display

### Notifications:
- [ ] Dropdown doesn't clip
- [ ] Scrollable when many notifications
- [ ] Clicking navigates to order details
- [ ] Mark as read works

---

## 🚀 Quick Start Commands

```bash
# Start backend
cd backend
npm start

# Start admin frontend
cd admin
npm run dev

# Install Stripe dependencies
cd admin
npm install @stripe/stripe-js @stripe/react-stripe-js

# Install chart library
npm install recharts
```

---

## 📝 Environment Variables

Add to `admin/.env`:
```
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

---

## 🔗 API Endpoint Summary

### Dashboard:
- GET `/api/admin/dashboard` - Simplified dashboard data

### Analytics:
- GET `/api/admin/analytics/top-products?period=last_30_days`
- GET `/api/admin/recent-reviews?limit=7`

### Profile:
- GET `/api/admin/profile`
- PUT `/api/admin/profile`
- GET `/api/admin/shop-info`
- PUT `/api/admin/profile/password`

### Commission:
- GET `/api/admin/commission/pending`
- POST `/api/admin/commission/pay-with-cash`
- POST `/api/admin/commission/create-payment-intent`
- POST `/api/admin/commission/confirm-stripe-payment`
- GET `/api/admin/commission/history`
- GET `/api/admin/commission/stats`

---

**Last Updated**: December 2024  
**Status**: Backend ✅ Complete | Frontend 🚧 In Progress
