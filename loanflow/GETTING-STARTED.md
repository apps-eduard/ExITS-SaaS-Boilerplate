# 🚀 LoanFlow - Getting Started Guide

## Quick Start (3 Commands)

```powershell
# 1. Navigate to loanflow folder
cd k:\speed-space\ExITS-SaaS-Boilerplate\loanflow

# 2. Run automated setup
.\setup.ps1

# 3. Start development server
npm start
```

Open **http://localhost:8100** in your browser.

---

## What Just Happened?

✅ **Complete mobile app skeleton created** in `/loanflow`  
✅ All services, guards, and routing configured  
✅ Matches your existing tech stack exactly  
✅ Ready for UI implementation  

---

## ✨ What's Included

### **Core Services** (Ready to Use)
- ✅ `AuthService` - JWT login/logout with role detection
- ✅ `ApiService` - HTTP client for all API calls
- ✅ `SyncService` - Offline SQLite sync for collectors
- ✅ `StorageService` - Secure encrypted storage

### **Routing & Guards**
- ✅ Role-based routing (`/customer/*` and `/collector/*`)
- ✅ Route guards protecting customer/collector pages
- ✅ Automatic redirect based on JWT role

### **Configuration**
- ✅ Capacitor 6 (iOS + Android ready)
- ✅ Ionic 7 components
- ✅ Tailwind CSS (matching web dashboard)
- ✅ Vite 7 build system
- ✅ Angular 20 standalone components

---

## 📋 Next Steps (TODO)

### **1. Create Login Page**
```powershell
ionic g page features/auth/login
```
Then implement:
- Email/password form
- Call `authService.login()`
- Auto-navigate to dashboard/route based on role

### **2. Create Customer Pages**
```powershell
ionic g page features/customer/dashboard
ionic g page features/customer/loans
ionic g page features/customer/loan-details
ionic g page features/customer/payments
ionic g page features/customer/apply-loan
```

### **3. Create Collector Pages**
```powershell
ionic g page features/collector/route
ionic g page features/collector/visit
ionic g page features/collector/collect
```

### **4. Create Shared Components**
```powershell
ionic g component shared/components/loan-card
ionic g component shared/components/payment-button
ionic g component shared/components/status-badge
```

---

## 📱 Building for Mobile

### **Android**
```powershell
# Add Android platform
ionic cap add android

# Sync
npm run sync:android

# Run with live reload
npm run android
```

### **iOS (macOS only)**
```powershell
# Add iOS platform
ionic cap add ios

# Sync
npm run sync:ios

# Run with live reload
npm run ios
```

---

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Ionic dev server (port 8100) |
| `npm run build` | Build for production |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS device/simulator |
| `npm run generate:api` | Generate API client from OpenAPI spec |
| `npm run sync` | Sync Capacitor platforms |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |

---

## 🔗 Integration with NestJS API

### **Make Sure API is Running**
```powershell
# In another terminal
cd k:\speed-space\ExITS-SaaS-Boilerplate\api
npm run start:dev
```

API should be at: **http://localhost:3000**

### **Generate TypeScript API Client**
```powershell
npm run generate:api
```

This reads `http://localhost:3000/api-json` and creates:
- Type-safe API interfaces
- Service methods for all endpoints
- Models for DTOs

---

## 📖 Documentation

- **README.md** - Complete user guide with troubleshooting
- **PROJECT-SUMMARY.md** - Architecture & file structure
- Service files - All have inline comments

---

## 🎯 Example: Customer Login Flow

```typescript
// In login.page.ts
async login() {
  await this.authService.login({
    email: this.email,
    password: this.password
  }).subscribe({
    next: (response) => {
      // AuthService automatically:
      // 1. Stores JWT tokens securely
      // 2. Extracts user role from JWT
      // 3. Navigates to:
      //    - /customer/dashboard (if customer)
      //    - /collector/route (if collector)
    },
    error: (err) => {
      console.error('Login failed', err);
    }
  });
}
```

---

## 🎯 Example: Offline Collection

```typescript
// In collector collect.page.ts
async recordPayment() {
  const paymentData = {
    loanId: this.loanId,
    amount: this.amount,
    timestamp: Date.now(),
  };

  // If offline, queues to SQLite
  // If online, syncs immediately
  await this.syncService.queueForSync('collection', paymentData);
  
  // Check sync status
  const status = this.syncService.getSyncStatus();
  console.log('Pending sync:', status.pendingCount);
}
```

---

## 🛠️ Troubleshooting

### **Port 8100 already in use**
```powershell
ionic serve --port 8101
```

### **API calls fail**
1. Check NestJS API is running: `http://localhost:3000/api/health`
2. Check `src/environments/environment.ts` has correct `apiUrl`
3. Check JWT token is stored: `StorageService.getAccessToken()`

### **Generate API fails**
1. Make sure API is running
2. Check OpenAPI endpoint: `http://localhost:3000/api-json`
3. Install generator manually: `npm install -D @openapitools/openapi-generator-cli`

---

## 🎉 You're All Set!

Your mobile app is ready for development. Start by creating the login page and customer dashboard.

**Happy coding!** 💻📱

---

## Need Help?

| Resource | Link |
|----------|------|
| Ionic Docs | https://ionicframework.com/docs/angular/overview |
| Capacitor Docs | https://capacitorjs.com/docs |
| Angular Docs | https://angular.dev |
| Tailwind Docs | https://tailwindcss.com/docs |
| Parent Project | `../README.md` |
