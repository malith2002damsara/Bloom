# Frontend Features Testing Guide

## 🧪 How to Test the New Frontend Features

### Prerequisites
1. Backend server running on `http://localhost:5000`
2. Frontend server running on `http://localhost:5173` (or your port)
3. At least one user account created
4. At least one admin with products
5. At least one completed/delivered order

---

## 📋 Testing Checklist

### 1. **Product Discount & Rating Badges**

#### Test Steps:
1. Navigate to home page or collection page
2. Look at product cards

#### Expected Results:
- ✅ Products with discounts show red badge in top-left corner: `-15% OFF`
- ✅ Products with ratings show yellow star badge in top-right: `⭐ 4.5`
- ✅ Price displays discounted amount first, original price struck through
- ✅ Products without discounts/ratings don't show badges

#### Test Data Setup:
```javascript
// In admin panel, edit a product:
- Set discount: 15 (%)
- Save product

// Discount automatically calculated by backend
```

---

### 2. **Product Reviews Display**

#### Test Steps:
1. Go to a product detail page (if ProductReviews component is added)
2. Or check product modal in collection

#### Expected Results:
- ✅ Shows "Customer Reviews" section
- ✅ Two tabs: "All Reviews" and "Top Comments"
- ✅ All Reviews shows paginated list (5 per page)
- ✅ Top Comments shows 10 highest-rated reviews
- ✅ Each review shows:
  - User avatar/name
  - Star rating (1-5)
  - Comment text
  - Date posted
- ✅ Pagination controls work (if more than 5 reviews)

#### Test Data Setup:
Requires completed orders with submitted feedback (see test #3).

---

### 3. **Feedback Submission (Main Feature)**

#### Test Steps:

**Setup:**
1. Login as a customer
2. Place an order (add product to cart, checkout)
3. As admin, change order status to "delivered"
4. Logout and login as customer again

**Test Feedback Flow:**
1. Go to "My Orders" page
2. Find the delivered order
3. Look for products in that order

#### Expected Results:

**Before Feedback:**
- ✅ Each product shows yellow/orange **"Write Review"** button
- ✅ Button is only visible for delivered orders
- ✅ Button is clickable

**Click "Write Review":**
- ✅ Feedback modal opens
- ✅ Modal shows:
  - Product image and name
  - Order number (last 8 digits only)
  - 5-star rating selector (interactive with hover)
  - Comment textarea (10-500 chars)
  - Character counter
  - Submit button

**Eligibility Check:**
- ✅ If order is not delivered: Shows error message
- ✅ If already submitted feedback: Shows "Cannot Submit Feedback" message
- ✅ If eligible: Shows feedback form

**Submit Review:**
1. Select rating (1-5 stars)
2. Type comment (minimum 10 characters)
3. Click "Submit Review"

**Expected:**
- ✅ Success toast appears: "Thank you for your feedback!"
- ✅ Modal closes
- ✅ Page refreshes after 1.5 seconds
- ✅ "Write Review" button changes to green **"✓ Review Submitted"** badge
- ✅ Button is now disabled/not clickable

**After Feedback:**
- ✅ Product rating updates (check product card)
- ✅ Review appears in ProductReviews component
- ✅ Cannot submit feedback again for same product/order

---

### 4. **Feedback Validation Tests**

#### Test Invalid Submissions:

**Test 1: No Rating**
- Steps: Click "Write Review", type comment, don't select stars, click Submit
- Expected: Red toast error "Please select a rating"

**Test 2: Empty Comment**
- Steps: Select stars, leave comment empty, click Submit
- Expected: Red toast error "Please write a review"

**Test 3: Short Comment**
- Steps: Select stars, type "good" (< 10 chars), click Submit
- Expected: Red toast error "Review must be at least 10 characters long"

**Test 4: Duplicate Review**
- Steps: Submit review, try to submit again for same product/order
- Expected: Shows "Cannot Submit Feedback" with message

**Test 5: Non-Delivered Order**
- Steps: Try to write review for pending/shipped order
- Expected: "Write Review" button doesn't appear (or shows eligibility error)

---

### 5. **UI/UX Tests**

#### Visual Tests:
- ✅ All modals are centered and responsive
- ✅ Hover effects work on stars
- ✅ Badges have proper colors:
  - Discount: Red background
  - Rating: Yellow background  
  - Write Review: Yellow-orange gradient
  - Submitted: Green background
- ✅ Text is readable (proper contrast)
- ✅ Icons display correctly

#### Responsive Tests:
- ✅ Test on mobile width (< 768px)
- ✅ Test on tablet width (768px - 1024px)
- ✅ Test on desktop width (> 1024px)
- ✅ Modal is scrollable on small screens
- ✅ Buttons stack properly on mobile

#### Accessibility Tests:
- ✅ Can close modal with Escape key
- ✅ Can navigate with Tab key
- ✅ Screen reader friendly (aria-labels present)
- ✅ Focus states visible

---

### 6. **Integration Tests**

#### Backend Connection:
```bash
# Check browser console (F12)
# Should NOT see errors like:
- "Failed to fetch"
- "Network error"
- "401 Unauthorized"
- "500 Internal Server Error"
```

#### API Calls Verification:
1. Open browser DevTools → Network tab
2. Perform actions
3. Check API calls:

**When opening MyOrders page:**
- ✅ `GET /api/orders/user` (with auth header)

**When clicking "Write Review":**
- ✅ `GET /api/feedback/eligible/:orderId` (checks eligibility)

**When submitting feedback:**
- ✅ `POST /api/feedback` (submits review)

**When viewing product:**
- ✅ `GET /api/feedback/product/:productId` (gets reviews)
- ✅ `GET /api/feedback/top-comments` (gets top 10)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Write Review" button not appearing
**Cause**: Order status is not "delivered"
**Solution**: 
1. Login as admin
2. Go to Orders page
3. Change order status to "Delivered"
4. Refresh customer's My Orders page

---

### Issue 2: Modal shows "Cannot Submit Feedback"
**Possible Causes**:
1. Order not delivered yet
2. Already submitted feedback
3. Not the order owner

**Solution**: 
- Check order status
- Check if feedback badge shows "Review Submitted"
- Ensure you're logged in as the customer who placed the order

---

### Issue 3: Discount badge not showing
**Cause**: Product doesn't have discount set
**Solution**:
1. Login as admin
2. Edit product
3. Set discount percentage (e.g., 15)
4. Save product
5. Backend will automatically calculate discountedPrice

---

### Issue 4: Rating badge not showing
**Cause**: No feedback submitted for product yet
**Solution**: This is normal - badge only appears after first review is submitted

---

### Issue 5: 401 Unauthorized errors
**Cause**: JWT token expired or missing
**Solution**:
1. Logout and login again
2. Check if token is in localStorage: `localStorage.getItem('token')`
3. Ensure backend auth middleware is working

---

## 📊 Test Data Preparation

### Create Test Scenario:

```javascript
// 1. Create Products (As Admin)
Product 1: Roses Bouquet - Price: Rs. 1000, Discount: 20%
Product 2: Teddy Bear - Price: Rs. 500, Discount: 0%

// 2. Create Order (As Customer)
- Add both products to cart
- Complete checkout
- Note the order ID

// 3. Update Order Status (As Admin)
- Change to "Delivered"

// 4. Submit Feedback (As Customer)
- Go to My Orders
- Click "Write Review" on Product 1
- Rate: 5 stars
- Comment: "Beautiful roses, fresh delivery!"
- Submit

- Click "Write Review" on Product 2
- Rate: 4 stars  
- Comment: "Cute teddy bear, good quality material"
- Submit

// 5. Verify Results
- Product 1 should show: ⭐ 5.0 badge
- Product 2 should show: ⭐ 4.0 badge
- Both show discount badges if applicable
- Both show "Review Submitted" badge in My Orders
```

---

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ All discount badges display properly
2. ✅ Rating badges update after feedback submission
3. ✅ Feedback modal opens with proper validation
4. ✅ Reviews are saved to database
5. ✅ Product ratings recalculate automatically
6. ✅ "Write Review" button changes to "Review Submitted"
7. ✅ Cannot submit duplicate reviews
8. ✅ UI is responsive on all screen sizes
9. ✅ No console errors
10. ✅ All API calls succeed (200 status)

---

## 🎯 Quick Test Script

Run this in order:

```bash
# 1. Start Backend
cd backend
npm start

# 2. Start Frontend  
cd frontend
npm run dev

# 3. Open browser to http://localhost:5173

# 4. Test Flow:
- Create account/login as customer
- Browse products (verify badges)
- Add to cart and checkout
- Login as admin, change order to "delivered"
- Login as customer, go to My Orders
- Click "Write Review" on each product
- Submit feedback
- Verify badges updated
- Check ProductReviews component shows feedback
```

---

## 📝 Test Results Template

Use this to track your testing:

```
✅ = Pass | ❌ = Fail | ⏭️ = Skipped

Feature: Product Discount Badges
[ ] Shows on products with discount
[ ] Correct percentage displayed
[ ] Red background with white text
[ ] Positioned top-left corner

Feature: Product Rating Badges
[ ] Shows after feedback submitted
[ ] Displays correct average rating
[ ] Yellow background with star icon
[ ] Positioned top-right corner

Feature: Feedback Modal
[ ] Opens when clicking "Write Review"
[ ] Checks order eligibility
[ ] Shows proper error messages
[ ] Star rating interactive
[ ] Comment validation works
[ ] Submits successfully
[ ] Updates UI after submission

Feature: Review Display
[ ] All Reviews tab works
[ ] Top Comments tab works
[ ] Pagination functional
[ ] Shows user info
[ ] Displays ratings correctly

Feature: Integration
[ ] API calls succeed
[ ] No console errors
[ ] Responsive on mobile
[ ] Responsive on tablet
[ ] Responsive on desktop
```

---

**Happy Testing! 🎉**

If you encounter any issues not covered here, check:
1. Browser console for errors
2. Network tab for failed API calls
3. Backend logs for server errors
4. Database to verify data is saving

---

**Last Updated**: December 2024
**Version**: 1.0.0
