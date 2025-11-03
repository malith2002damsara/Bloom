# 🚀 Multi-Vendor E-Commerce Platform - Implementation Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles](#user-roles)
3. [New Database Models](#new-database-models)
4. [API Endpoints](#api-endpoints)
5. [Business Logic Rules](#business-logic-rules)
6. [Frontend Implementation Guide](#frontend-implementation-guide)
7. [Testing Guide](#testing-guide)

---

## 🎯 System Overview

This is a multi-vendor flower e-commerce platform with 3 user roles:
- **Customer (User)**: Browse, order, review products
- **Admin (Seller)**: Manage products, view orders, handle feedback
- **Super Admin**: Manage admins, calculate commissions, generate reports

---

## 👥 User Roles

### 1. Customer (User)
- Register/Login with unique phone number
- Browse products with filters (price, name, category, admin code)
- View discounted prices and discount percentages
- Place orders (COD, Mastercard, Visa)
- Track orders and submit feedback after delivery
- View top 10 latest product reviews

### 2. Admin (Seller)
- Unique admin code auto-generated (e.g., "JOH1234")
- Manage their own products
- Set discount rates on products
- View orders containing their products only
- View feedback/ratings for their products
- Track earnings and commission dues
- Pay monthly commission (Cash, Mastercard, Visa)
- Auto-deactivated if commission overdue by 14 days

### 3. Super Admin
- Create and manage admin accounts
- View all orders and products
- Calculate monthly commissions
- Generate monthly reports
- Track pending payments
- Deactivate/activate admins

---

## 🗄️ New Database Models

### 1. **Feedback Model** (`backend/models/Feedback.js`)
```javascript
{
  userId: ObjectId,           // Reference to User
  orderId: ObjectId,          // Reference to Order
  productId: ObjectId,        // Reference to Product
  adminId: ObjectId,          // Reference to Admin
  rating: Number (1-5),       // Star rating
  comment: String (max 500),  // Review text
  status: 'approved',         // Auto-approved
  isVerifiedPurchase: true,   // Always true
  helpfulCount: Number,       // For future feature
  timestamps: true
}
```

### 2. **Updated Admin Model**
```javascript
{
  // ... existing fields
  phone: String (unique, required),
  adminCode: String (unique, auto-generated),
  
  earnings: {
    total: Number,           // Total lifetime earnings
    thisMonth: Number,       // Current month earnings
    lastMonthPaid: Number    // Last paid amount
  },
  
  commission: {
    threshold: 50000,        // Rs. 50,000 before commission
    rate: 10,                // 10% commission
    totalDue: Number,        // Current amount due
    lastPaidDate: Date,      // Last payment date
    nextDueDate: Date        // Next payment deadline
  },
  
  deactivationReason: String,
  deactivatedAt: Date
}
```

### 3. **Updated Product Model**
```javascript
{
  // ... existing fields
  discount: Number (0-100),       // Discount percentage
  discountedPrice: Number,        // Auto-calculated
  ratings: {
    average: Number (0-5),        // Auto-calculated from feedback
    count: Number                 // Number of ratings
  }
}
```

### 4. **Updated Order Model**
```javascript
{
  // ... existing fields
  feedbackSubmitted: Boolean,     // Track if feedback given
  feedbackRequestedAt: Date       // When feedback popup was shown
}
```

### 5. **Updated Transaction Model**
```javascript
{
  // ... existing fields
  paymentMethod: ['bank_transfer', 'cash', 'mastercard', 'visa', ...],
  paymentTransaction: {
    transactionId: String,
    cardLastFour: String,
    cardType: 'mastercard' | 'visa' | 'other'
  }
}
```

---

## 🔌 API Endpoints

### **Feedback Endpoints**

#### 1. Submit Feedback (Customer)
```http
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "6543210abcdef",
  "productId": "1234567890abc",
  "rating": 5,
  "comment": "Beautiful flowers, very fresh!"
}

Response:
{
  "success": true,
  "message": "Thank you for your feedback!",
  "data": { ... }
}
```

#### 2. Get Product Feedback (Public)
```http
GET /api/feedback/product/:productId?page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "feedbacks": [...],
    "ratingDistribution": {
      "5": 10, "4": 5, "3": 2, "2": 0, "1": 0
    },
    "pagination": { ... }
  }
}
```

#### 3. Get Top 10 Comments (Public)
```http
GET /api/feedback/top-comments

Response:
{
  "success": true,
  "data": {
    "comments": [...]  // Latest 10, sorted by rating & date
  }
}
```

#### 4. Check Feedback Eligibility (Customer)
```http
GET /api/feedback/check/:orderId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "canSubmit": true,
    "orderStatus": "delivered",
    "feedbackSubmitted": false,
    "products": [...]
  }
}
```

#### 5. Get Admin Feedback (Admin)
```http
GET /api/feedback/admin?productId=xxx&page=1
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "feedbacks": [...],
    "statistics": {
      "averageRating": 4.5,
      "totalFeedbacks": 25
    },
    "pagination": { ... }
  }
}
```

---

### **Product Endpoints (Updated)**

#### 1. Get Home Page Products
```http
GET /api/products/home

Response:
{
  "success": true,
  "data": {
    "products": [...]  // 10 newest from different admins
  }
}
```

#### 2. Get Products with Filters
```http
GET /api/products?
  category=fresh&
  search=rose&
  adminCode=JOH1234&
  minPrice=500&
  maxPrice=5000&
  sortBy=rating&
  page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "products": [...],  // Includes discount, discountedPrice, ratings
    "pagination": { ... }
  }
}
```

---

### **Commission Endpoints**

#### 1. Calculate Monthly Commission (SuperAdmin)
```http
POST /api/commission/calculate/:adminId
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": 11,
  "year": 2025
}

Response:
{
  "success": true,
  "data": {
    "transaction": { ... },
    "adminEarnings": { ... },
    "commissionApplies": true,
    "threshold": 50000
  }
}
```

#### 2. Pay Commission (Admin or SuperAdmin)
```http
POST /api/commission/pay/:transactionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "mastercard",
  "paymentReference": "TXN123456",
  "cardLastFour": "4321",
  "cardType": "mastercard"
}

Response:
{
  "success": true,
  "message": "Commission payment recorded successfully",
  "data": {
    "transaction": { ... },
    "admin": {
      "remainingDue": 5000
    }
  }
}
```

#### 3. Get Commission History (Admin)
```http
GET /api/commission/history?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "transactions": [...],
    "admin": {
      "adminCode": "JOH1234",
      "totalEarnings": 75000,
      "currentDue": 2500,
      "nextDueDate": "2025-12-01",
      "threshold": 50000,
      "rate": 10
    },
    "pagination": { ... }
  }
}
```

#### 4. Get Pending Commissions (SuperAdmin)
```http
GET /api/commission/pending
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "transactions": [...],
    "summary": {
      "totalPending": 25000,
      "count": 5
    }
  }
}
```

#### 5. Generate Monthly Report (SuperAdmin)
```http
POST /api/commission/generate-monthly-report
Authorization: Bearer <token>
Content-Type: application/json

{
  "month": 11,
  "year": 2025
}

Response:
{
  "success": true,
  "data": {
    "period": { "month": 11, "year": 2025 },
    "summary": {
      "totalRevenue": 500000,
      "totalCommission": 45000,
      "adminsCount": 10
    },
    "reports": [
      {
        "admin": { ... },
        "revenue": 75000,
        "commission": 2500,
        "commissionApplies": true,
        "orderCount": 25
      },
      ...
    ]
  }
}
```

---

## 📜 Business Logic Rules

### **Phone Number Uniqueness**
- Each phone number must be unique across Users, Admins, and Super Admins
- Error message: *"That number already exists, please use another number."*

### **Admin Code Generation**
- Auto-generated on admin creation
- Format: First 3 letters of name (uppercase) + 4 random digits
- Example: "John Doe" → "JOH1234"
- Must be unique

### **Home Page Products**
- Show only 10 newest products
- Each product must be from a different admin
- Only active admins' products shown

### **Product Discounts**
- Admin can set discount (0-100%)
- `discountedPrice` = `price - (price * discount / 100)`
- Display both original price and discounted price with percentage badge

### **Feedback System**
- Only for delivered orders
- One feedback per user per product per order
- Auto-approved
- Updates product's average rating immediately
- Shows top 10 comments sorted by rating (highest first), then date

### **Commission System**

#### Threshold Rule
- **No commission** until admin earns **Rs. 50,000**
- After Rs. 50,000, **10% commission** on all future earnings

#### Monthly Cycle
1. At end of month, calculate each admin's revenue
2. If total earnings > 50,000, calculate 10% commission
3. Set due date to 1st of next month
4. Admin has until due date + 14 days grace period
5. Auto-deactivate if not paid within grace period

#### Payment Methods
- Cash
- Mastercard
- Visa
- Bank Transfer
- Digital Wallet

#### Auto-Deactivation
- Triggered if payment is 14 days overdue
- Admin's products become hidden
- Admin cannot login
- Can be reactivated by Super Admin after payment

---

## 🎨 Frontend Implementation Guide

### **Customer Frontend Features**

#### 1. Home Page (`frontend/src/pages/Home.jsx`)
```jsx
// Fetch 10 newest products from different admins
useEffect(() => {
  const fetchHomeProducts = async () => {
    const response = await fetch('/api/products/home');
    const data = await response.json();
    setProducts(data.data.products);
  };
  fetchHomeProducts();
}, []);

// Display with discount badges
<ProductCard
  product={product}
  showDiscount={true}  // Show discount % badge
  showRating={true}    // Show star rating
/>
```

#### 2. Collection Page (`frontend/src/pages/Collection.jsx`)
```jsx
// Filters state
const [filters, setFilters] = useState({
  category: 'all',
  search: '',
  adminCode: '',
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest'  // Options: newest, price-low, price-high, rating, discount
});

// Fetch with filters
const fetchProducts = async () => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/products?${params}`);
  const data = await response.json();
  setProducts(data.data.products);
};

// Admin Code Filter Input
<input
  type="text"
  placeholder="Enter Admin Code"
  value={filters.adminCode}
  onChange={(e) => setFilters({...filters, adminCode: e.target.value})}
/>

// Product Card with Discount Badge
<div className="product-card">
  {product.discount > 0 && (
    <div className="discount-badge">-{product.discount}%</div>
  )}
  <img src={product.images[0]} alt={product.name} />
  <h3>{product.name}</h3>
  <div className="price">
    {product.discount > 0 ? (
      <>
        <span className="original-price">Rs. {product.price}</span>
        <span className="discounted-price">Rs. {product.discountedPrice}</span>
      </>
    ) : (
      <span>Rs. {product.price}</span>
    )}
  </div>
  <div className="rating">
    ⭐ {product.ratings.average.toFixed(1)} ({product.ratings.count})
  </div>
</div>
```

#### 3. My Orders Page (`frontend/src/pages/MyOrders.jsx`)
```jsx
// Don't show: order ID, customer name, email, phone, payment status
// Show: actual product images, delivery status, feedback button

<OrderCard>
  <div className="order-items">
    {order.items.map(item => (
      <div key={item._id}>
        <img src={item.image} alt={item.name} />  {/* Real image, not placeholder */}
        <span>{item.name}</span>
        <span>Rs. {item.price} x {item.quantity}</span>
      </div>
    ))}
  </div>
  
  <div className="order-status">{order.orderStatus}</div>
  <div className="total">Rs. {order.total}</div>
  
  {/* Hide these: */}
  {/* <div>Order ID: {order.orderNumber}</div> */}
  {/* <div>Customer: {order.customerInfo.name}</div> */}
  {/* <div>Payment: {order.paymentStatus}</div> */}
  
  {order.orderStatus === 'delivered' && !order.feedbackSubmitted && (
    <button onClick={() => openFeedbackModal(order)}>
      Submit Feedback
    </button>
  )}
</OrderCard>
```

#### 4. Feedback Modal Component
```jsx
const FeedbackModal = ({ order, onClose }) => {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  const submitFeedback = async (productId) => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        orderId: order._id,
        productId,
        rating: ratings[productId],
        comment: comments[productId]
      })
    });
  };

  return (
    <Modal>
      <h2>Rate Your Products</h2>
      {order.items.map(item => (
        <div key={item.productId}>
          <h3>{item.name}</h3>
          <StarRating
            value={ratings[item.productId] || 0}
            onChange={(val) => setRatings({...ratings, [item.productId]: val})}
          />
          <textarea
            placeholder="Write your review..."
            value={comments[item.productId] || ''}
            onChange={(e) => setComments({...comments, [item.productId]: e.target.value})}
            maxLength={500}
          />
          <button onClick={() => submitFeedback(item.productId)}>
            Submit
          </button>
        </div>
      ))}
    </Modal>
  );
};
```

#### 5. Product Reviews Display
```jsx
const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetch(`/api/feedback/product/${productId}?limit=10`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.data.feedbacks);
        setStats(data.data.ratingDistribution);
      });
  }, [productId]);

  return (
    <div className="reviews-section">
      <h3>Customer Reviews</h3>
      
      {/* Rating Distribution */}
      <div className="rating-stats">
        {[5,4,3,2,1].map(star => (
          <div key={star}>
            {star} ⭐ <progress value={stats[star]} max={reviews.length} />
            ({stats[star]})
          </div>
        ))}
      </div>

      {/* Latest 10 Reviews */}
      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <span>{review.userId.name}</span>
              <span>{'⭐'.repeat(review.rating)}</span>
              {review.isVerifiedPurchase && <span>✓ Verified</span>}
            </div>
            <p>{review.comment}</p>
            <small>{new Date(review.createdAt).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### **Admin Frontend Features**

#### 1. Dashboard (`admin/src/pages/Dashboard.jsx`)
```jsx
// Hide: order ID, customer column from recent orders table

<RecentOrdersTable>
  <thead>
    <tr>
      {/* <th>Order ID</th> */}  {/* Hidden */}
      <th>Products</th>
      {/* <th>Customer</th> */}   {/* Hidden */}
      <th>Status</th>
      <th>Amount</th>
      <th>Date</th>
      <th>Actions</th>
    </tr>
  </thead>
</RecentOrdersTable>
```

#### 2. Analytics (`admin/src/pages/Analytics.jsx`)
```jsx
// Add Top Selling Products chart

const TopSellingProducts = () => {
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    // Fetch admin's products sorted by sales count
    fetch(`/api/products?adminId=${adminId}&sortBy=sales&limit=10`)
      .then(res => res.json())
      .then(data => setTopProducts(data.data.products));
  }, []);

  return (
    <div className="top-products-chart">
      <h3>Top Selling Products</h3>
      <BarChart data={topProducts} />
    </div>
  );
};
```

#### 3. Product Management - Discount Setting
```jsx
const ProductForm = () => {
  const [discount, setDiscount] = useState(0);

  return (
    <form>
      {/* ... other fields ... */}
      
      <div className="form-group">
        <label>Discount (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
        <small>Set discount percentage (0-100%)</small>
      </div>

      {discount > 0 && (
        <div className="price-preview">
          <span>Original: Rs. {price}</span>
          <span>Discounted: Rs. {price - (price * discount / 100)}</span>
        </div>
      )}
    </form>
  );
};
```

#### 4. Feedback View (`admin/src/pages/Feedback.jsx`)
```jsx
const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({});
  const [adminCode, setAdminCode] = useState('');

  useEffect(() => {
    fetch('/api/feedback/admin', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFeedbacks(data.data.feedbacks);
        setStats(data.data.statistics);
      });

    // Get admin code
    fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAdminCode(data.data.admin.adminCode));
  }, []);

  return (
    <div className="admin-feedback-page">
      <div className="admin-code-section">
        <h3>Your Admin Code</h3>
        <div className="code-display">
          <span className="code">{adminCode}</span>
          <button onClick={() => navigator.clipboard.writeText(adminCode)}>
            Copy
          </button>
        </div>
        <p>Share this code with customers to show only your products</p>
      </div>

      <div className="feedback-stats">
        <h3>Overall Rating</h3>
        <div className="big-rating">
          ⭐ {stats.averageRating?.toFixed(1)} / 5
        </div>
        <p>{stats.totalFeedbacks} reviews</p>
      </div>

      <div className="feedback-list">
        {feedbacks.map(feedback => (
          <FeedbackCard key={feedback._id} feedback={feedback} />
        ))}
      </div>
    </div>
  );
};
```

#### 5. Commission & Payments (`admin/src/pages/Commission.jsx`)
```jsx
const CommissionPage = () => {
  const [history, setHistory] = useState([]);
  const [adminInfo, setAdminInfo] = useState({});
  const [paymentModal, setPaymentModal] = useState(false);

  useEffect(() => {
    fetch('/api/commission/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setHistory(data.data.transactions);
        setAdminInfo(data.data.admin);
      });
  }, []);

  const payCommission = async (transactionId, paymentData) => {
    await fetch(`/api/commission/pay/${transactionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });
  };

  return (
    <div className="commission-page">
      <div className="commission-summary">
        <div className="stat-card">
          <h4>Total Earnings</h4>
          <p className="big-number">Rs. {adminInfo.totalEarnings}</p>
        </div>
        <div className="stat-card">
          <h4>Current Due</h4>
          <p className="big-number red">Rs. {adminInfo.currentDue}</p>
        </div>
        <div className="stat-card">
          <h4>Next Due Date</h4>
          <p>{new Date(adminInfo.nextDueDate).toLocaleDateString()}</p>
        </div>
        <div className="stat-card">
          <h4>Commission Rate</h4>
          <p>{adminInfo.rate}%</p>
        </div>
      </div>

      <div className="threshold-info">
        <p>Commission applies after Rs. {adminInfo.threshold} earnings</p>
        {adminInfo.totalEarnings < adminInfo.threshold && (
          <progress
            value={adminInfo.totalEarnings}
            max={adminInfo.threshold}
          />
        )}
      </div>

      {adminInfo.currentDue > 0 && (
        <button onClick={() => setPaymentModal(true)} className="pay-btn">
          Pay Commission
        </button>
      )}

      <CommissionHistory transactions={history} />

      {paymentModal && (
        <PaymentModal
          amount={adminInfo.currentDue}
          onPay={(method, details) => {
            // Find unpaid transaction
            const unpaid = history.find(t => t.paymentStatus === 'unpaid');
            payCommission(unpaid._id, { paymentMethod: method, ...details });
          }}
          onClose={() => setPaymentModal(false)}
        />
      )}
    </div>
  );
};
```

---

### **Super Admin Frontend Features**

#### 1. Dashboard (`superadmin/src/pages/Dashboard.jsx`)
```jsx
const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    deliveredOrders: 0,
    canceledOrders: 0,
    totalRevenue: 0,
    pendingCommissions: 0
  });

  useEffect(() => {
    // Fetch order counts
    fetch('/api/orders/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const orders = data.data.orders;
        setStats({
          pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
          deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
          canceledOrders: orders.filter(o => o.orderStatus === 'cancelled').length,
          totalRevenue: orders.reduce((sum, o) => sum + o.total, 0)
        });
      });

    // Fetch pending commissions
    fetch('/api/commission/pending', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          pendingCommissions: data.data.summary.totalPending
        }));
      });
  }, []);

  return (
    <div className="superadmin-dashboard">
      <div className="stats-grid">
        <StatCard title="Pending Orders" value={stats.pendingOrders} color="yellow" />
        <StatCard title="Delivered Orders" value={stats.deliveredOrders} color="green" />
        <StatCard title="Canceled Orders" value={stats.canceledOrders} color="red" />
        <StatCard title="Total Revenue" value={`Rs. ${stats.totalRevenue}`} color="blue" />
        <StatCard title="Pending Commissions" value={`Rs. ${stats.pendingCommissions}`} color="orange" />
      </div>

      <RecentActivity />
      <AdminsList />
    </div>
  );
};
```

#### 2. Commission Management (`superadmin/src/pages/Commissions.jsx`)
```jsx
const SuperAdminCommissions = () => {
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [reportData, setReportData] = useState(null);

  const generateMonthlyReport = async () => {
    const now = new Date();
    const response = await fetch('/api/commission/generate-monthly-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        month: now.getMonth() + 1,
        year: now.getFullYear()
      })
    });
    const data = await response.json();
    setReportData(data.data);
  };

  const calculateCommission = async (adminId) => {
    const now = new Date();
    await fetch(`/api/commission/calculate/${adminId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        month: now.getMonth() + 1,
        year: now.getFullYear()
      })
    });
  };

  return (
    <div className="commissions-management">
      <div className="actions">
        <button onClick={generateMonthlyReport}>
          Generate Monthly Report
        </button>
      </div>

      <div className="pending-commissions">
        <h2>Pending Commissions</h2>
        <table>
          <thead>
            <tr>
              <th>Admin</th>
              <th>Code</th>
              <th>Amount Due</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingCommissions.map(commission => (
              <tr key={commission._id}>
                <td>{commission.adminId.name}</td>
                <td>{commission.adminId.adminCode}</td>
                <td>Rs. {commission.commissionAmount}</td>
                <td>{new Date(commission.dueDate).toLocaleDateString()}</td>
                <td>
                  <span className={`status ${commission.paymentStatus}`}>
                    {commission.paymentStatus}
                  </span>
                </td>
                <td>
                  <button onClick={() => viewDetails(commission)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reportData && (
        <MonthlyReport data={reportData} />
      )}
    </div>
  );
};
```

---

## 🧪 Testing Guide

### **1. Phone Number Uniqueness**
```bash
# Test: Register user with existing phone
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "1234567890",  # Existing phone
  "password": "test123"
}

Expected: 400 - "That number already exists, please use another number."
```

### **2. Admin Code Generation**
```bash
# Create admin and verify code is generated
POST /api/superadmin/admins
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "admin123"
}

Expected Response includes: "adminCode": "JOH1234" (or similar)
```

### **3. Home Page Products**
```bash
# Test: Get 10 products from different admins
GET /api/products/home

Expected:
- Returns exactly 10 products (or less if fewer admins)
- Each product has different adminId
- Sorted by createdAt (newest first)
```

### **4. Product Filters**
```bash
# Test: Filter by admin code
GET /api/products?adminCode=JOH1234

Expected: Only products from admin with code "JOH1234"

# Test: Price range filter
GET /api/products?minPrice=1000&maxPrice=5000

Expected: Products with discountedPrice between 1000-5000

# Test: Sort by rating
GET /api/products?sortBy=rating

Expected: Products sorted by ratings.average (highest first)
```

### **5. Discount Calculation**
```bash
# Create product with discount
POST /api/products
{
  "name": "Rose Bouquet",
  "price": 2000,
  "discount": 20,
  ...
}

Expected: discountedPrice = 1600 (2000 - 20%)
```

### **6. Feedback Submission**
```bash
# Test: Submit feedback for delivered order
POST /api/feedback
{
  "orderId": "xxx",
  "productId": "yyy",
  "rating": 5,
  "comment": "Excellent!"
}

# Verify:
1. Feedback created
2. Product rating updated
3. Order.feedbackSubmitted = true
```

### **7. Commission Calculation**
```bash
# Test: Calculate commission for admin below threshold
POST /api/commission/calculate/adminId
{
  "month": 11,
  "year": 2025
}

# Scenario 1: Admin earned Rs. 40,000 (below 50,000)
Expected: commissionAmount = 0, commissionApplies = false

# Scenario 2: Admin earned Rs. 60,000 (above 50,000)
Expected: commissionAmount = 6,000 (10%), commissionApplies = true
```

### **8. Auto-Deactivation**
```bash
# Test: Check admin deactivation after grace period

# Step 1: Create overdue commission (15 days past due)
# Step 2: Call GET /api/commission/pending
# Step 3: Verify admin.isActive = false
```

---

## 📝 Environment Variables

Add to `.env`:
```env
# Existing variables
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000

# Payment Gateway (Add when implementing)
MASTERCARD_API_KEY=your-mastercard-key
VISA_API_KEY=your-visa-key

# Cloudinary (existing)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🚀 Deployment Checklist

- [ ] Update all models with new fields
- [ ] Test all API endpoints
- [ ] Add indexes for feedback and commission queries
- [ ] Set up cron job for monthly commission calculation
- [ ] Implement payment gateway integration
- [ ] Test auto-deactivation logic
- [ ] Update frontend components
- [ ] Test phone uniqueness across all forms
- [ ] Verify discount calculations
- [ ] Test feedback system end-to-end
- [ ] Create admin onboarding guide with admin code explanation

---

## 📚 Additional Resources

### Cron Job for Auto-Report Generation
```javascript
// backend/scripts/cronJobs.js
const cron = require('node-cron');
const { generateMonthlyReport } = require('../controllers/commissionController');

// Run on 1st of every month at 00:01
cron.schedule('1 0 1 * *', async () => {
  console.log('Running monthly commission report...');
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  
  // Auto-generate report
  await generateMonthlyReport(null, {
    body: { month: lastMonth, year },
    user: { role: 'superadmin' }  // System user
  });
});
```

---

## 🎉 Conclusion

All backend features are now implemented! Next steps:

1. **Test all endpoints** using Postman or similar
2. **Build frontend components** following the guide above
3. **Integrate payment gateways** (Mastercard, Visa)
4. **Set up cron jobs** for automated report generation
5. **Deploy to production** with environment variables configured

For questions or issues, refer to the code comments and this documentation.

---

**Last Updated:** November 3, 2025  
**Version:** 1.0  
**Author:** Copilot AI Assistant
