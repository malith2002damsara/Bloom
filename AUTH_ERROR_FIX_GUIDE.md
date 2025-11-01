# Authentication Error Fix Guide 🔐

## Problem
Getting "Invalid token" error when trying to view orders:
```
API request failed: Error: Invalid token
```

## Root Cause
The authentication token stored in your browser is either:
1. **Expired** - Token has passed its expiration time
2. **Invalid** - Token format is incorrect or corrupted
3. **Missing** - No token in localStorage
4. **Not logged in** - User never logged in

## Solutions

### Solution 1: Login Again (Recommended) ✅

**Steps:**
1. Open your browser
2. Go to the application
3. Click on **Login** in the navigation bar
4. Enter your credentials:
   - Email: your registered email
   - Password: your password
5. Click **Login** button
6. You should now be able to view your orders

### Solution 2: Clear Browser Data 🧹

If logging in doesn't work:

**Method A - Clear Application Data:**
1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under **Local Storage**, select your domain
4. Delete these items:
   - `token`
   - `user`
5. Refresh the page
6. Login again

**Method B - Clear Browser Cache:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Select "Cookies and other site data"
4. Click "Clear data"
5. Refresh and login again

### Solution 3: Register New Account 📝

If you don't have an account:

1. Click **Sign Up** in navigation
2. Fill in the registration form:
   - Name
   - Email
   - Password
   - Phone
   - Address
3. Click **Sign Up**
4. You'll be automatically logged in
5. Start shopping and place orders

## What Was Fixed

### 1. Better Error Handling ✅
The API service now:
- Detects invalid/expired tokens
- Automatically clears invalid tokens
- Shows clear error messages
- Redirects to login when needed

### 2. Token Verification ✅
The AuthContext now:
- Verifies token on page load
- Checks if token is still valid
- Clears invalid tokens automatically
- Updates user data from server

### 3. Auto-Logout ✅
When token is invalid:
- User is automatically logged out
- Invalid data is cleared
- Clear message is shown
- User is redirected to login

### 4. Graceful Handling ✅
MyOrders page now:
- Checks authentication before fetching
- Shows clear error message
- Redirects to login after 2 seconds
- Prevents unnecessary API calls

## How to Test

### Test 1: Valid Login Flow
```
1. Go to /login
2. Enter valid credentials
3. Should login successfully
4. Go to /myorders
5. Should see your orders
✅ Success!
```

### Test 2: Invalid Token Handling
```
1. Open DevTools → Application → Local Storage
2. Manually edit the 'token' value to invalid text
3. Go to /myorders
4. Should see error message
5. Should redirect to login after 2s
✅ Success!
```

### Test 3: No Token Flow
```
1. Clear localStorage completely
2. Go to /myorders
3. Should see "Please Login" message
4. Click login button
5. Should navigate to /login
✅ Success!
```

## Preventing Future Issues

### For Users:
1. **Don't edit localStorage manually**
2. **Login when token expires**
3. **Use "Remember Me" if available**
4. **Don't clear browser data unnecessarily**

### For Developers:
1. ✅ Token validation on mount
2. ✅ Automatic token refresh
3. ✅ Clear error messages
4. ✅ Graceful error handling
5. ✅ Redirect to login when needed

## Common Scenarios

### Scenario 1: "I just logged in but still get error"
**Solution:**
- Check if login was successful (look for success message)
- Check browser console for errors
- Try hard refresh (Ctrl + F5)
- Clear cache and login again

### Scenario 2: "I was logged in, now I'm not"
**Solution:**
- Token may have expired (default: 30 days)
- Just login again
- This is normal security behavior

### Scenario 3: "Orders page is blank"
**Solution:**
- You might have no orders yet
- Click "Start Shopping" to place an order
- Check if you're logged in (profile icon in navbar)

### Scenario 4: "Getting 'User not found' error"
**Solution:**
- Your account might have been deleted
- Register a new account
- Contact support if this is an error

## API Token Information

### Token Structure:
```javascript
{
  userId: "user_id_here",
  role: "user", // or "admin", "superadmin"
  iat: 1234567890, // issued at timestamp
  exp: 1234567890  // expiration timestamp
}
```

### Token Lifespan:
- **Default**: 30 days
- **After password change**: Immediate invalidation
- **After account disable**: Immediate invalidation

### Token Storage:
- Location: `localStorage.token`
- Format: JWT (JSON Web Token)
- Encoding: Bearer token
- Security: HTTPs only in production

## Debug Commands

### Check if logged in (Browser Console):
```javascript
// Check token exists
localStorage.getItem('token')

// Check user data
JSON.parse(localStorage.getItem('user'))

// Check if authenticated
!!localStorage.getItem('token')
```

### Clear auth data (Browser Console):
```javascript
// Clear token and user
localStorage.removeItem('token');
localStorage.removeItem('user');
location.reload();
```

### Test API with token (Browser Console):
```javascript
// Test if token is valid
fetch('http://localhost:5000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

## Backend Token Validation

The server checks:
1. ✅ Token exists
2. ✅ Token format is valid
3. ✅ Token signature is correct
4. ✅ Token not expired
5. ✅ User still exists
6. ✅ User account is active
7. ✅ Password not changed after token issued

If any check fails → `401 Unauthorized`

## Support

Still having issues? 

### Quick Fixes:
1. Try incognito/private mode
2. Try different browser
3. Disable browser extensions
4. Check internet connection
5. Check if backend is running

### Get Help:
- Check browser console for errors
- Check network tab for API responses
- Copy error message
- Contact technical support

## Summary

The authentication system now:
- ✅ **Automatically validates tokens** on page load
- ✅ **Clears invalid tokens** automatically
- ✅ **Shows clear error messages** to users
- ✅ **Redirects to login** when needed
- ✅ **Prevents unnecessary API calls** when not authenticated
- ✅ **Handles all error cases** gracefully

**Just login again and you're good to go!** 🎉
