# Feedback Duplicate Submission Fix

## Problem
Users were seeing the error "You have already submitted feedback for this product" when trying to submit feedback through the FeedbackModal. This was happening because:

1. **No Per-Product Feedback Tracking**: The frontend didn't know which products in an order already had feedback
2. **UI Not Updating**: The "Write Review" button was showing for all products in delivered orders, even if feedback was already submitted
3. **Backend Validation Working**: The backend correctly prevented duplicate submissions, but users were confused by the error

## Root Cause
- The `Order` model had a single `feedbackSubmitted` boolean at the order level
- The UI checked `item.feedbackSubmitted` (which didn't exist in the API response)
- When fetching orders, the backend didn't include per-product feedback status
- The `Feedback` model has a unique compound index: `{ userId, productId, orderId }` which prevents duplicates

## Solution Implemented

### Backend Changes (orderController.js)

#### 1. Added Feedback Model Import
```javascript
const Feedback = require('../models/Feedback');
```

#### 2. Updated `getUserOrders` Function
Added logic to check feedback status for each product in delivered orders:

```javascript
// Check feedback status for each product in delivered orders
for (const order of orders) {
  if (order.orderStatus === 'delivered' && order.items && order.items.length > 0) {
    // Get all feedback for this user and order
    const feedbacks = await Feedback.find({
      userId: req.user._id,
      orderId: order._id
    }).select('productId').lean();

    // Create a Set of product IDs that have feedback
    const feedbackProductIds = new Set(
      feedbacks.map(f => f.productId.toString())
    );

    // Mark each item with feedback status
    order.items.forEach(item => {
      item.feedbackSubmitted = feedbackProductIds.has(item.productId.toString());
    });
  } else if (order.items) {
    // For non-delivered orders, mark all items as no feedback
    order.items.forEach(item => {
      item.feedbackSubmitted = false;
    });
  }
}
```

#### 3. Updated `getOrderById` Function
Added the same feedback checking logic for single order retrieval:

```javascript
// Check feedback status for each product if order is delivered
if (order.orderStatus === 'delivered' && order.items && order.items.length > 0) {
  const feedbacks = await Feedback.find({
    userId: req.user._id,
    orderId: order._id
  }).select('productId').lean();

  const feedbackProductIds = new Set(
    feedbacks.map(f => f.productId.toString())
  );

  order.items.forEach(item => {
    item.feedbackSubmitted = feedbackProductIds.has(item.productId.toString());
  });
} else if (order.items) {
  order.items.forEach(item => {
    item.feedbackSubmitted = false;
  });
}
```

### Frontend (Already Correct)
The frontend code in `MyOrders.jsx` was already checking `item.feedbackSubmitted`:

```jsx
{/* Feedback Button - Only show for delivered orders */}
{order.orderStatus?.toLowerCase() === 'delivered' && !item.feedbackSubmitted && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleFeedbackClick(order, item);
    }}
    className="mt-2 flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full hover:from-yellow-500 hover:to-orange-500 transition-all shadow-sm"
  >
    <FiMessageCircle size={12} />
    <span>Write Review</span>
  </button>
)}

{/* Feedback Submitted Badge */}
{item.feedbackSubmitted && (
  <div className="mt-2 flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
    <FiCheck size={12} />
    <span>Review Submitted</span>
  </div>
)}
```

## How It Works Now

1. **User views orders**: Backend fetches all orders for the user
2. **Feedback check**: For each delivered order, backend queries the Feedback collection to find which products have feedback
3. **Status enrichment**: Each order item is enriched with `feedbackSubmitted: true/false`
4. **UI updates**: Frontend shows/hides the "Write Review" button based on `item.feedbackSubmitted`
5. **Badge display**: Products with feedback show "Review Submitted" badge instead of the button

## Benefits

✅ **Prevents Confusion**: Users only see "Write Review" button for products they haven't reviewed
✅ **Better UX**: Clear visual feedback about which products have been reviewed
✅ **Performance**: Efficient query using lean() and Set for fast lookups
✅ **Data Integrity**: Backend validation still prevents duplicates as a safety measure
✅ **Per-Product Tracking**: Each product in an order can have independent feedback status

## Testing

To test the fix:

1. Place an order with multiple products
2. Admin marks order as "delivered"
3. User sees "Write Review" button for all products
4. User submits feedback for one product
5. Refresh page - that product should show "Review Submitted" badge
6. Other products should still show "Write Review" button
7. Attempting to submit duplicate feedback is prevented at both UI and API level

## Files Modified

- `backend/controllers/orderController.js`: Added feedback status checking to order retrieval functions
- No frontend changes needed (already implemented correctly)

## Related Models

- **Order Model** (`backend/models/Order.js`): Contains order items with productId
- **Feedback Model** (`backend/models/Feedback.js`): Has unique compound index `{ userId, productId, orderId }`
- **Frontend** (`frontend/src/pages/MyOrders.jsx`): Displays feedback buttons and badges

## Date
November 3, 2025
