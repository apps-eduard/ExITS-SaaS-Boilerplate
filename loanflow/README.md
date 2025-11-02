# LoanFlow - Ionic Angular Mobile App

**Production-ready mobile app for loan management** supporting both **Customer** and **Collector** roles with offline synchronization.

---

## 🎯 Overview

LoanFlow is a standalone Ionic Angular mobile application that extends the **ExITS-SaaS-Boilerplate** platform. It provides:

- **Customer Portal**: View loans, make payments, apply for new loans
- **Collector Portal**: Route management, visit tracking, offline collection
- **Offline Sync**: SQLite-based queueing with automatic sync
- **JWT Authentication**: Shared with web platform
- **Role-Based Access**: Dynamic routing based on user role

---

## 🛠️ Tech Stack (Matches Parent Project)

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Angular (Standalone) | 20.3.6 |
| **Mobile** | Ionic | 7.0.0 |
| **Native** | Capacitor | 6.0.0 |
| **Build** | Vite | 7.1.12 |
| **Styling** | Tailwind CSS | 3.4.18 |
| **Language** | TypeScript | 5.9.2 |
| **State** | RxJS | 7.8.0 |
| **Backend** | NestJS API | 10.4.20 |
| **Database** | PostgreSQL + SQLite (offline) | 15 + 6 |

---

## 📁 Folder Structure

```
loanflow/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services & interceptors
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts          # JWT authentication
│   │   │   │   ├── api.service.ts           # HTTP client wrapper
│   │   │   │   ├── sync.service.ts          # Offline sync (SQLite)
│   │   │   │   └── storage.service.ts       # Secure storage
│   │   │   └── interceptors/
│   │   │       └── jwt.interceptor.ts       # Adds Bearer token + tenant header
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── login.page.ts            # Login screen
│   │   │   ├── customer/                    # Customer role pages
│   │   │   │   ├── dashboard.page.ts        # Dashboard with stats
│   │   │   │   ├── loans.page.ts            # Loan list
│   │   │   │   ├── loan-details.page.ts     # Loan detail view
│   │   │   │   ├── payments.page.ts         # Payment history
│   │   │   │   └── apply-loan.page.ts       # Loan application
│   │   │   └── collector/                   # Collector role pages
│   │   │       ├── route.page.ts            # Daily collection route
│   │   │       ├── visit.page.ts            # Customer visit tracker
│   │   │       └── collect.page.ts          # Payment collection
│   │   ├── shared/
│   │   │   ├── components/                  # Reusable UI components
│   │   │   │   ├── loan-card.component.ts
│   │   │   │   ├── payment-button.component.ts
│   │   │   │   └── status-badge.component.ts
│   │   │   ├── guards/
│   │   │   │   └── role.guard.ts            # Role-based route protection
│   │   │   └── pipes/                       # Custom pipes (TODO)
│   │   ├── app.component.ts                 # Root component
│   │   ├── app.routes.ts                    # Application routing
│   │   └── main.ts                          # App bootstrap
│   ├── environments/
│   │   ├── environment.ts                   # Dev config
│   │   └── environment.prod.ts              # Prod config
│   ├── styles/
│   │   └── tailwind.css                     # Global styles
│   └── index.html
├── openapi/
│   └── api-client/                          # Auto-generated API client (run npm run generate:api)
├── capacitor.config.ts
├── ionic.config.json
├── vite.config.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- **Running NestJS API** at `http://localhost:3000`
- Ionic CLI (`npm install -g @ionic/cli`)

### Installation

```bash
cd loanflow

# Install dependencies
npm install

# Generate API client from OpenAPI spec (make sure NestJS API is running)
npm run generate:api

# Start development server
npm start
# or
ionic serve
```

The app will open at `http://localhost:8100`

---

## 📱 Building for Mobile

### Android

```bash
# Add Android platform
ionic cap add android

# Sync web assets to native project
npm run sync:android

# Run on device/emulator with live reload
npm run android
```

### iOS

```bash
# Add iOS platform (macOS only)
ionic cap add ios

# Sync web assets to native project
npm run sync:ios

# Run on device/simulator with live reload
npm run ios
```

---

## 🔐 Authentication Flow

1. User enters email/password
2. `AuthService.login()` calls `/api/auth/login`
3. Receives JWT access token + refresh token
4. Tokens stored in **Capacitor Secure Storage**
5. `jwtInterceptor` adds `Authorization: Bearer <token>` to all requests
6. Role extracted from JWT (`customer` or `collector`)
7. Router navigates to role-specific home:
   - Customer → `/customer/dashboard`
   - Collector → `/collector/route`

---

## 🌐 Offline Sync (Collector Only)

### How It Works

1. **Collector records visit/collection** while offline
2. Data queued in **SQLite** (`pending_sync` table)
3. `SyncService` monitors network status
4. When online, **auto-syncs** queued data to API
5. Synced items marked as complete
6. Old synced data (>7 days) automatically deleted

### Database Schema

```sql
CREATE TABLE pending_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,           -- 'visit' | 'collection' | 'payment'
  data TEXT NOT NULL,            -- JSON stringified payload
  timestamp INTEGER NOT NULL,
  synced INTEGER DEFAULT 0       -- 0 = pending, 1 = synced
);
```

### Usage

```typescript
// In collector pages
await this.syncService.queueForSync('collection', {
  loanId: 123,
  amount: 500,
  customerId: 456,
  timestamp: Date.now(),
});

// Force sync manually
await this.syncService.forceSyncNow();

// Check sync status
const status = this.syncService.getSyncStatus();
// { isOnline: true, pendingCount: 3, isSyncing: false }
```

---

## 🎨 Styling with Tailwind

All components use **Tailwind utility classes** + **Ionic components**:

```html
<ion-card class="card-compact">
  <ion-card-header>
    <h2 class="text-lg font-bold text-gray-900 dark:text-white">Loan #1234</h2>
  </ion-card-header>
  <ion-card-content>
    <p class="text-sm text-gray-600 dark:text-gray-400">Balance: $5,000</p>
    <button class="btn-primary mt-2">Make Payment</button>
  </ion-card-content>
</ion-card>
```

### Custom Classes (defined in `tailwind.css`)

- `.card-compact` - Compact card with border
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.input-field` - Form input field

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start dev server (Ionic) |
| `npm run build` | Build for production |
| `npm run android` | Run on Android with live reload |
| `npm run ios` | Run on iOS with live reload |
| `npm run generate:api` | Generate TypeScript API client from OpenAPI spec |
| `npm run sync` | Sync Capacitor (run after config changes) |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |

---

## 🔄 API Integration

### Environment Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',  // ← Your NestJS API
  tenantId: '1',
  featureFlags: {
    offlineSync: true,
    pushNotifications: true,
  },
};
```

### Auto-Generated API Client

Run this when your NestJS API changes:

```bash
npm run generate:api
```

This reads `http://localhost:3000/api-json` and generates TypeScript models + services in `openapi/api-client/`.

---

## 🧩 Creating New Pages

### Customer Page Example

```bash
ionic g page features/customer/my-new-page
```

Then add to `app.routes.ts`:

```typescript
{
  path: 'customer',
  canActivate: [customerGuard],
  children: [
    {
      path: 'my-new-page',
      loadComponent: () => import('./features/customer/my-new-page.page').then(m => m.MyNewPagePage),
    },
  ],
},
```

### Collector Page Example

```bash
ionic g page features/collector/my-collector-page
```

Add to routes with `collectorGuard`.

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|---------------|
| **Token Storage** | Capacitor Secure Storage (encrypted on device) |
| **HTTP Interceptor** | Auto-adds `Authorization` + `x-tenant-id` headers |
| **Role Guards** | Prevents unauthorized access to customer/collector routes |
| **Refresh Tokens** | Automatic token refresh when expired |
| **Multi-Tenancy** | Tenant ID from environment/JWT |

---

## 🧪 Testing (TODO)

```bash
# Unit tests
npm test

# E2E tests (requires Appium or similar)
npm run test:e2e
```

---

## 📦 Capacitor Plugins Used

| Plugin | Purpose |
|--------|---------|
| `@capacitor/core` | Core Capacitor APIs |
| `@capacitor/splash-screen` | Splash screen control |
| `@capacitor/status-bar` | Status bar theming |
| `capacitor-secure-storage-plugin` | Encrypted storage |
| `@capacitor-community/sqlite` | Offline SQLite database |
| `@capacitor/network` | Network status monitoring |
| `@capacitor/camera` | Photo capture (for KYC, receipts) |
| `@capacitor/geolocation` | GPS tracking (for collector routes) |
| `@capacitor/push-notifications` | Push notifications |

---

## 🐛 Troubleshooting

### Issue: API calls fail with 401

**Solution**: Check that:
1. NestJS API is running
2. Login returns valid JWT
3. Token is stored in `StorageService`
4. `jwtInterceptor` is added to `provideHttpClient`

### Issue: Offline sync not working

**Solution**:
1. Check network status: `SyncService.isOnline()`
2. Verify SQLite initialized: Check console for "Database initialized"
3. Force sync: `syncService.forceSyncNow()`

### Issue: Dark mode not working

**Solution**:
1. Add `class="dark"` to `<body>` or `<ion-app>`
2. Check CSS variables in `tailwind.css`

---

## 🚀 Next Steps

| Task | File/Command |
|------|-------------|
| **Create login page** | `src/app/features/auth/login.page.ts` |
| **Build customer pages** | `src/app/features/customer/*.page.ts` |
| **Build collector pages** | `src/app/features/collector/*.page.ts` |
| **Create shared components** | `src/app/shared/components/*.component.ts` |
| **Add push notifications** | Integrate `@capacitor/push-notifications` |
| **Add camera for receipts** | Use `@capacitor/camera` in payment collection |
| **Deploy to app stores** | Build with `ionic cap build` → Submit to Google Play / App Store |

---

## 📞 Support

For issues related to:
- **Ionic/Angular**: [Ionic Docs](https://ionicframework.com/docs/angular/overview)
- **Capacitor**: [Capacitor Docs](https://capacitorjs.com/docs)
- **NestJS API**: Check parent project README
- **This boilerplate**: Open an issue on GitHub

---

## 📄 License

MIT - Same as parent project

---

**Ready to build?**

```bash
cd loanflow
npm install
npm run generate:api
ionic serve
```

You now have a **production-ready mobile app skeleton** that works with your existing NestJS backend! 🎉
