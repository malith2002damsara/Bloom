# 🔔 Admin Notification System Documentation

## Overview
A complete real-time notification system for the Bloom Admin Dashboard that displays order updates with a bell icon, badge counter, and interactive dropdown.

---

## ✨ Features

### 1. **Real-Time Notifications**
- Auto-polling every 30 seconds for new notifications
- Red badge counter showing unread notification count
- Automatic updates without page refresh

### 2. **Notification Bell Component**
- Bell icon with animated badge
- Dropdown panel with notification list
- Mark as read functionality (individual or all)
- Delete notification functionality
- Responsive design with Tailwind CSS

### 3. **Notification Types**
- **New Order**: When a customer places an order with your products
- **Order Completed**: When an order is marked as delivered/completed
- **Order Cancelled**: When an order is cancelled
- **Low Stock**: When product stock falls below threshold

### 4. **Dashboard Charts** (NEW)
- **Sales Trend**: LineChart showing last 7 days of sales
- **Category Distribution**: PieChart of product categories
- **Orders by Status**: BarChart showing order status breakdown
- **Daily Revenue**: BarChart of revenue per day

---

## 🏗️ Architecture

### Frontend Components

#### **NotificationBell.jsx** (`admin/src/components/NotificationBell.jsx`)
```javascript
// Main Features:
- Displays bell icon with badge counter
- Dropdown panel with notifications
- Mark as read (single & all)
- Delete notifications
- Auto-refresh every 30 seconds
- Click outside to close dropdown
```

#### **DashboardCharts.jsx** (`admin/src/components/DashboardCharts.jsx`)
```javascript
// Chart Components:
- SalesTrendChart (LineChart)
- CategoryDistributionChart (PieChart)
- OrdersByStatusChart (BarChart)
- DailyRevenueChart (BarChart)
```

#### **Dashboard.jsx** (Updated)
```javascript
// Enhanced with:
- Real-time data fetching
- Chart data generation
- Refresh button
- Auto-refresh every 60 seconds
- Integration with DashboardCharts component
```

### Backend Components

#### **Notification Model** (`backend/models/Notification.js`)
```javascript
{
  adminId: ObjectId,      // Admin who receives notification
  type: String,           // new_order, order_completed, order_cancelled, low_stock
  title: String,          // Notification title
  message: String,        // Notification message
  orderId: String,        // Related order ID (optional)
  productId: String,      // Related product ID (optional)
  read: Boolean,          // Read status
  createdAt: Date,        // Auto-expires after 30 days
  updatedAt: Date
}
```

#### **Notification Controller** (`backend/controllers/notificationController.js`)
- `getNotifications()` - Get admin's notifications with unread count
- `markNotificationRead(id)` - Mark single notification as read
- `markAllNotificationsRead()` - Mark all notifications as read
- `deleteNotification(id)` - Delete a notification
- `createNotification(data)` - Helper to create notifications
- `createOrderNotification(order)` - Create notification when order placed

#### **Admin Routes** (`backend/routes/adminRoutes.js`)
```javascript
GET    /api/admin/notifications          // Get all notifications
PUT    /api/admin/notifications/:id/read // Mark as read
PUT    /api/admin/notifications/read-all // Mark all as read
DELETE /api/admin/notifications/:id      // Delete notification
```

---

## 🚀 Installation

### 1. Install Dependencies
```powershell
# Admin Dashboard
cd admin
npm install recharts

# Backend (if needed)
cd ../backend
npm install
```

### 2. Files Already Created
✅ `admin/src/components/NotificationBell.jsx`
✅ `admin/src/components/DashboardCharts.jsx`
✅ `backend/models/Notification.js`
✅ `backend/controllers/notificationController.js`
✅ Backend routes updated in `adminRoutes.js`
✅ Order controller updated to create notifications
✅ Dashboard page updated with charts integration

---

## 📖 Usage

### For Admins

#### **Viewing Notifications**
1. Look at the bell icon in the sidebar header
2. Red badge shows unread count
3. Click bell to open dropdown
4. Click notification to view details

#### **Managing Notifications**
- **Mark as Read**: Click the check icon on a notification
- **Mark All as Read**: Click "Mark all as read" button
- **Delete**: Click the X icon on a notification
- **Auto-Refresh**: Notifications update every 30 seconds automatically

#### **Dashboard Charts**
1. View sales trends over last 7 days
2. See product category distribution
3. Monitor order status breakdown
4. Track daily revenue
5. Click refresh button for latest data

### For Developers

#### **Creating Notifications Programmatically**
```javascript
const { createOrderNotification } = require('../controllers/notificationController');

// When an order is created/updated
await createOrderNotification(order);
```

#### **Custom Notification Creation**
```javascript
const Notification = require('../models/Notification');

await Notification.create({
  adminId: adminId,
  type: 'custom',
  title: 'Custom Title',
  message: 'Custom message',
  orderId: orderId, // optional
  productId: productId, // optional
  read: false
});
```

#### **Adding New Chart Types**
```javascript
// In DashboardCharts.jsx
const MyCustomChart = ({ data }) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">My Chart</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        {/* Your chart configuration */}
      </LineChart>
    </ResponsiveContainer>
  </div>
);
```

---

## 🔧 Configuration

### Polling Interval
```javascript
// In NotificationBell.jsx
const POLL_INTERVAL = 30000; // 30 seconds

// To change:
useEffect(() => {
  const interval = setInterval(fetchNotifications, 60000); // 1 minute
  return () => clearInterval(interval);
}, []);
```

### Notification Auto-Delete
```javascript
// In backend/models/Notification.js
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 } // 30 days (change this value)
);
```

### Chart Colors
```javascript
// In DashboardCharts.jsx
const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
// Modify these colors as needed
```

---

## 🧪 Testing

### Manual Testing

#### **Test Notification Creation**
1. Place a test order from the frontend
2. Check if notification appears in admin bell
3. Verify badge counter increases
4. Check notification details are correct

#### **Test Mark as Read**
1. Click check icon on unread notification
2. Verify it turns gray
3. Check badge counter decreases
4. Verify "Mark all as read" works

#### **Test Delete**
1. Click X icon on a notification
2. Verify it disappears from list
3. Check badge counter updates

#### **Test Auto-Refresh**
1. Open notification dropdown
2. Wait 30 seconds
3. Create a new order in another tab
4. Verify new notification appears automatically

#### **Test Charts**
1. Navigate to Dashboard page
2. Verify all 4 charts render correctly
3. Test refresh button
4. Check responsive layout on mobile

### API Testing (Postman/cURL)

```bash
# Get notifications (requires auth token)
curl -X GET http://localhost:5000/api/admin/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PUT http://localhost:5000/api/admin/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark all as read
curl -X PUT http://localhost:5000/api/admin/notifications/read-all \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete notification
curl -X DELETE http://localhost:5000/api/admin/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: Notifications not showing
**Solution:**
1. Check backend is running: `npm start` in backend folder
2. Verify MongoDB connection
3. Check browser console for errors
4. Verify admin is logged in (token valid)
5. Check notification API endpoint: `GET /api/admin/notifications`

### Issue: Badge counter not updating
**Solution:**
1. Check polling is working (console logs)
2. Verify 30-second interval is active
3. Check browser Network tab for API calls
4. Clear browser cache and reload

### Issue: Charts not rendering
**Solution:**
1. Verify Recharts is installed: `npm list recharts`
2. Check data format matches chart requirements
3. Look for console errors
4. Verify DashboardCharts component is imported
5. Check responsive container width/height

### Issue: "Read" status not persisting
**Solution:**
1. Check API response in Network tab
2. Verify notification ID is correct
3. Check MongoDB for notification document
4. Verify auth middleware is passing adminId

### Issue: Auto-delete not working
**Solution:**
1. Check MongoDB TTL index: `db.notifications.getIndexes()`
2. Verify `createdAt` field exists in documents
3. Wait for MongoDB background task (runs every 60 seconds)
4. Check MongoDB logs

---

## 🎨 Customization

### Styling

#### **Change Bell Icon Color**
```jsx
// In NotificationBell.jsx
<Bell className="w-6 h-6 text-pink-500" /> // Change pink-500
```

#### **Change Badge Color**
```jsx
<span className="bg-red-500"> // Change to blue-500, green-500, etc.
```

#### **Chart Colors**
```javascript
// In DashboardCharts.jsx
const COLORS = ['#ec4899', '#your-color-hex', ...];
```

### Notification Types

#### **Add New Notification Type**
```javascript
// In backend/models/Notification.js
type: {
  type: String,
  required: true,
  enum: ['new_order', 'order_completed', 'order_cancelled', 'low_stock', 'your_new_type']
}
```

#### **Custom Notification Icons**
```jsx
// In NotificationBell.jsx
const getNotificationIcon = (type) => {
  switch (type) {
    case 'your_new_type':
      return <YourIcon className="w-5 h-5 text-your-color" />;
    default:
      return <Bell className="w-5 h-5 text-blue-500" />;
  }
};
```

---

## 📊 Performance Optimization

### Reduce Polling Frequency
```javascript
// Change from 30s to 60s to reduce server load
const POLL_INTERVAL = 60000;
```

### Add Pagination to Notifications
```javascript
// In backend controller
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const notifications = await Notification.find({ adminId })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
```

### Index Optimization
```javascript
// Already implemented in Notification.js:
notificationSchema.index({ adminId: 1, read: 1, createdAt: -1 });
```

---

## 🔐 Security Considerations

### ✅ Implemented Security
- **Authentication Required**: All notification endpoints require JWT auth
- **Admin-Only Access**: Only admins can access notification endpoints
- **Data Isolation**: Admins only see their own notifications
- **Input Validation**: Notification IDs validated before queries
- **XSS Prevention**: React automatically escapes content

### 🔒 Best Practices
1. Never expose notification endpoints without authentication
2. Always validate adminId matches logged-in admin
3. Sanitize notification content before display
4. Rate-limit notification creation to prevent spam
5. Use HTTPS in production

---

## 📈 Future Enhancements

### Potential Features
- [ ] Push notifications using Service Workers
- [ ] Email notifications for critical alerts
- [ ] Notification preferences/settings
- [ ] Notification categories filter
- [ ] Sound alerts for new notifications
- [ ] Bulk notification actions
- [ ] Notification templates
- [ ] WebSocket integration for true real-time updates
- [ ] More chart types (Area, Scatter, Radar)
- [ ] Export chart data to CSV/PDF
- [ ] Custom date range for charts
- [ ] Comparison with previous period

---

## 📝 API Reference

### Get Notifications
```http
GET /api/admin/notifications
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "notifications": [...],
    "unreadCount": 5
  }
}
```

### Mark Notification as Read
```http
PUT /api/admin/notifications/:id/read
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Mark All as Read
```http
PUT /api/admin/notifications/read-all
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### Delete Notification
```http
DELETE /api/admin/notifications/:id
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## 🤝 Contributing

### Adding Features
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Update documentation
5. Submit PR

### Code Style
- Use ES6+ features
- Follow existing patterns
- Add JSDoc comments
- Use meaningful variable names
- Keep functions small and focused

---

## 📞 Support

### Getting Help
- Check this documentation first
- Look at existing code examples
- Test in browser console
- Check MongoDB database directly
- Review backend logs

### Common Commands
```bash
# Check MongoDB notifications
mongosh
use bloom_db
db.notifications.find().pretty()

# Check notification indexes
db.notifications.getIndexes()

# Count notifications by admin
db.notifications.aggregate([
  { $group: { _id: "$adminId", count: { $sum: 1 } } }
])
```

---

## 📄 License
This notification system is part of the Bloom Admin Dashboard.

---

## 🎉 Changelog

### v1.0.0 (Current)
- ✅ Initial notification system
- ✅ Real-time polling (30s intervals)
- ✅ Badge counter
- ✅ Mark as read functionality
- ✅ Delete notifications
- ✅ Auto-delete after 30 days
- ✅ Dashboard charts with Recharts
- ✅ Sales trend visualization
- ✅ Category distribution chart
- ✅ Order status tracking
- ✅ Daily revenue chart
- ✅ Auto-refresh dashboard
- ✅ Responsive design

---

**Made with ❤️ for Bloom Admin Dashboard**
