# 🧪 Complete Testing Guide for Hyundai Spare Parts System

## 🎯 **Testing Strategy Overview**

This guide covers testing at three levels:

1. **Local Development Testing** - Test on your machine
2. **Staging Testing** - Test before production
3. **Production Testing** - Test live system

---

## 🖥️ **1. Local Development Testing**

### **1.1 Start Your Application**

```bash
# Terminal 1: Start Backend
npm run dev

# Terminal 2: Start Frontend (if needed)
npm run dev:client
```

### **1.2 Test Backend API Endpoints**

```bash
# Health Check
curl http://localhost:3000/api/health

# Expected Response:
{
  "status": "ok",
  "timestamp": "2025-01-20T...",
  "version": "1.0.0"
}
```

### **1.3 Test Stripe Integration (Local)**

```bash
# Test Stripe Config (will show mock mode)
curl http://localhost:3000/api/stripe/config

# Expected Response:
{
  "success": true,
  "data": {
    "publishableKey": null,
    "currency": "SAR",
    "currency": "SAR",
    "supportedPaymentMethods": ["card"]
  }
}
```

---

## 🧪 **2. Component Testing**

### **2.1 Test Customer Landing Page**

- [ ] **Form Validation**
  - Try submitting empty form
  - Test invalid email formats
  - Test invalid phone numbers
  - Test required field validation

- [ ] **Form Submission**
  - Submit valid form
  - Check confirmation message
  - Verify data appears in admin dashboard

### **2.2 Test Admin Dashboard**

- [ ] **Authentication**
  - Login with valid credentials
  - Try invalid credentials
  - Test logout functionality

- [ ] **Request Management**
  - View all requests
  - Filter by status
  - Search functionality
  - Update request status

---

## 🚀 **3. Stripe Testing (Development)**

### **3.1 Test Card Numbers**

Use these Stripe test cards:

```bash
# Successful Payment
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

# Declined Payment
Card: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## 🌐 **4. Browser Testing**

### **4.1 Cross-Browser Testing**

Test on these browsers:

- [ ] **Chrome** (Latest)
- [ ] **Firefox** (Latest)
- [ ] **Safari** (Latest)
- [ ] **Edge** (Latest)

### **4.2 Mobile Testing**

- [ ] **iPhone Safari**
- [ ] **Android Chrome**
- [ ] **Tablet browsers**

---

## 🔒 **5. Security Testing**

### **5.1 Authentication Testing**

- [ ] **Valid Login**
- [ ] **Invalid Credentials**
- [ ] **Session Management**
- [ ] **Route Protection**

### **5.2 Payment Security**

- [ ] **Stripe Webhook Verification**
- [ ] **Payment Data Encryption**
- [ ] **PCI Compliance Check**

---

## 🚂 **6. Railway Backend Testing**

### **6.1 Test Railway Backend**

```bash
# Health Check
curl https://your-app-name.railway.app/api/health

# Stripe Config
curl https://your-app-name.railway.app/api/stripe/config
```

---

## 🚀 **7. Vercel Frontend Testing**

### **7.1 Test Vercel Frontend**

1. Visit your Vercel domain
2. Test all functionality
3. Verify API calls to Railway backend
4. Test payment flow end-to-end

---

## 🔄 **8. End-to-End Testing**

### **8.1 Complete Customer Journey**

1. **Customer submits request** → Verify admin receives it
2. **Admin processes request** → Set pricing and generate payment
3. **Customer receives WhatsApp** → Click payment link
4. **Complete payment** → Use Stripe test cards
5. **Verify webhook** → Check order status updates
6. **Admin sees confirmation** → Process order

---

## 🎯 **9. Testing Checklist**

### **Before Production**

- [ ] All local tests pass
- [ ] Railway backend deployed and tested
- [ ] Vercel frontend deployed and tested
- [ ] Stripe webhooks configured
- [ ] Payment flow tested end-to-end
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Security tests passed
- [ ] Performance benchmarks met

---

## 🆘 **10. Troubleshooting Common Issues**

### **Issue: Payment Links Not Working**

**Solution**: Check Stripe API keys and webhook configuration

### **Issue: Frontend Can't Connect to Backend**

**Solution**: Verify `VITE_API_BASE_URL` environment variable

### **Issue: Webhooks Not Receiving Events**

**Solution**: Check webhook URL and secret in Stripe dashboard

---

**🚀 Ready to test? Start with local testing and work your way up to production deployment!**
