# 🧪 Testing Guide - KovaiCrave New Features

## 🚀 Quick Start

**Dev Server**: http://localhost:8081/

---

## ✅ Test Veg/Non-Veg Filters

### Steps:
1. Navigate to **Home** (/)
2. Click on any restaurant card (e.g., "Hotel Junior Kuppanna")
3. You'll see filter buttons at the top:
   - **🟢 Veg** - Shows only vegetarian items
   - **🍗 Non-Veg** - Shows only non-vegetarian items
   - **All Items** - Shows complete menu

### Expected Results:
- ✅ Green veg indicator for vegetarian items
- ✅ Orange non-veg indicator for non-vegetarian items
- ✅ Filters toggle smoothly with gradient highlighting
- ✅ Category filters work independently

### Test Cases:
```
1. Click "Veg" filter → Should show only items with isVeg: true
2. Click "Non-Veg" filter → Should show only chicken, mutton dishes
3. Click "All Items" → Should show entire menu
4. Combine with category filter → Should filter both criteria
```

---

## 🔐 Test Advanced Login Page

### Location: 
Navigate to `/login` or click **Login** button in navbar

### Test Login:
```
Email: test@example.com
Password: password123
Result: ✅ Should show login success toast
```

### Test Sign Up:
1. Click **Sign Up** tab
2. Enter:
   - Full Name: John Doe
   - Phone: 9876543210
   - Address: 123 Main St, Coimbatore
   - Email: newuser@example.com
   - Password: SecurePass123
   - Confirm: SecurePass123
3. Click **Create Account**

### Expected Results:
- ✅ Form validates all fields
- ✅ Password confirmation check
- ✅ Success toast when account created
- ✅ Smooth animations

### Test OAuth (Social Login):
1. Click **Google** button → Should redirect to Google OAuth
2. Click **GitHub** button → Should redirect to GitHub OAuth

### Test Password Reset:
1. Click **Reset** tab
2. Enter email: yourEmail@example.com
3. Click **Send Reset Link**
4. ✅ Should show success message

---

## 💳 Test Payment Methods

### Location:
Go to Cart → Checkout page

### Test 1: Cash on Delivery (COD)
```
1. Add items to cart
2. Go to Checkout
3. Enter delivery address:
   - Name: John Doe
   - Phone: 9876543210
   - Address: 123 Main Street
   - Area/Landmark: Near Bus Stop
   - Pincode: 641001
4. Select "💵 Cash on Delivery"
5. Click "Confirm Order"
Result: ✅ Order placed with COD payment
```

### Test 2: UPI Payment
```
1. Follow steps 1-4 above
2. Select "📱 UPI Payment"
3. Click to show UPI details
4. See QR code and UPI ID: kovai@upi
5. Copy UPI ID button works
6. Click "✅ I have paid"
Result: ✅ Order confirmed with UPI payment
```

### Test 3: Card Payment (Stripe)
```
1. Follow steps 1-4 in Test 1
2. Select "💳 Credit/Debit Card"
3. Enter Demo Card Details:
   - Cardholder Name: John Doe
   - Card Number: 4242 4242 4242 4242
   - Expiry: 12/25 (or any future date)
   - CVV: 123
4. Click "Pay with Card"
Result: ✅ Card form shows with validation
```

### Card Validation Tests:
```
Test Invalid Card Number:
- Enter: 1234 5678 (too short)
- Expected: Error "Invalid card number"

Test Expired Card:
- Enter: Expiry 01/20 (past date)
- Expected: Error "Card has expired"

Test Invalid CVV:
- Enter: CV (only 2 digits)
- Expected: Error "Invalid CVV"

Test Empty Name:
- Leave name blank
- Expected: Error "Invalid cardholder name"
```

---

## 🏨 Test Hotel Names Display

### Verify all restaurants show "Hotel" prefix:

```
Expected names:
- Hotel Sree Annapoorna
- Hotel Junior Kuppanna
- Hotel Haribhavanam
- Hotel A2B - Adyar Ananda Bhavan
- Hotel Gowri Krishna
- Hotel Anandhas Quality Veg
- Hotel Shree Akshayam
```

### Test on:
1. **Home Page** - Restaurant list
2. **Restaurants Page** - Full listing
3. **Restaurant Details** - Header section

---

## 📊 Test Order Summary

### Inside Checkout:
1. View items with veg/non-veg indicators
2. Verify price calculations:
   - Subtotal: Sum of (price × quantity)
   - Delivery Fee: ₹0 if > ₹199, else ₹30
   - Tax: 5% of subtotal
   - Grand Total: Subtotal + Delivery + Tax - Discount

### Example Calculation:
```
Item 1: Dosa × 2 = ₹170
Item 2: Biryani × 1 = ₹260
Subtotal: ₹430

Delivery Fee: ₹0 (> ₹199)
Tax (5%): ₹21.50 → ₹22
Grand Total: ₹452
```

---

## 🔄 Test Restaurant Filtering

### Non-Veg Only Hotels:
1. Go to "Hotel Junior Kuppanna" (non-veg restaurant)
2. Click "Non-Veg" filter
3. ✅ Should show: Chicken Chettinad, Mutton Biryani, etc.

### Veg Only Hotels:
1. Go to "Hotel Sree Annapoorna" (veg restaurant)
2. Click "Non-Veg" filter
3. ✅ Should show: 0 items (no non-veg dishes)

### Mixed Restaurant:
1. Go to "Hotel Kovai Biriyani" (mixed)
2. Click "Veg" filter
3. ✅ Should show: Veg Biryani, Raita, etc.
4. Click "Non-Veg" filter
5. ✅ Should show: Chicken dishes, Biryani, etc.

---

## 🧚 Feature Completeness Checklist

```
✅ Veg Filter
✅ Non-Veg Filter
✅ All Items Filter
✅ Category-based Filtering
✅ Advanced Login Page
✅ Sign Up with Profile
✅ OAuth Google
✅ OAuth GitHub
✅ Password Reset
✅ COD Payment
✅ UPI Payment with QR
✅ Card Payment Form
✅ Card Validation
✅ Order Summary
✅ Delivery Address Form
✅ Hotel Name Updates
✅ Veg/Non-Veg Indicators
✅ Responsive Design
✅ Dark/Light Theme Support
```

---

## 🐛 Troubleshooting

### Issue: Filters not working
- Clear browser cache
- Refresh page (Ctrl+R)
- Check console for errors (F12)

### Issue: Login not working
- Ensure Supabase keys are set in `.env.local`
- Check browser console for API errors
- Verify email format

### Issue: Card validation failing
- Use test card: 4242 4242 4242 4242
- Use future date (e.g., 12/25)
- Use any 3-digit CVV

### Issue: OAuth not working
- Ensure OAuth apps are configured (Google/GitHub)
- Check redirect URLs are correct
- Verify credentials in env file

---

## 📝 Performance Notes

- ✅ Build size: ~757 KB (with Stripe)
- ✅ Load time: < 1 second
- ✅ No major console errors
- ⚠️ Warning: Chunk size > 500 KB (optimize if needed)

---

## 🎯 Next Steps

After testing, consider:

1. **Set up Supabase Backend**
   - Create `orders` table
   - Set up authentication
   - Add row-level security

2. **Configure Stripe**
   - Add real Stripe keys
   - Create payment intent endpoint
   - Handle webhooks

3. **Deploy**
   - Test in production environment
   - Enable SSL/HTTPS
   - Set up monitoring

---

**Last Updated**: April 3, 2026
**Status**: ✅ Ready for Testing