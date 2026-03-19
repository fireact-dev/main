# Hooks & Contexts API Reference

All hooks and types are imported from `@fireact.dev/app`.

---

## useConfig()

Returns the app configuration context. Must be used within `<ConfigProvider>`.

```typescript
interface ConfigContextType {
  firebase: FirebaseConfig;
  appConfig: AppConfiguration;
  auth: Auth;              // Firebase Auth instance
  db: Firestore;           // Firestore instance
  functions: Functions;    // Cloud Functions instance (for httpsCallable)
  emulators?: EmulatorsConfig;
  pages: PagesConfig;
  socialLogin: SocialLoginConfig;
}
```

**Usage:**
```tsx
import { useConfig } from '@fireact.dev/app';

const config = useConfig();
// config.db — Firestore instance for queries
// config.functions — Functions instance for httpsCallable
// config.auth — Firebase Auth instance
// config.appConfig — full merged configuration
// config.appConfig.pages — route path mappings
// config.appConfig.permissions — permission definitions
// config.appConfig.stripe?.plans — subscription plans array
// config.appConfig.settings — subscription settings schema
```

---

## useSubscription()

Returns subscription data for the current route. Must be used within `<SubscriptionProvider>`.

```typescript
interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  userPermissions: string[];   // e.g., ['access', 'editor', 'admin']
  hasPermission: (permission: string) => boolean;
  updateSubscription: (data: Partial<Subscription>) => void;
}
```

**Usage:**
```tsx
import { useSubscription } from '@fireact.dev/app';

const { subscription, loading, error, hasPermission } = useSubscription();

// Check permissions
if (hasPermission('admin')) { /* show admin UI */ }

// Access plan info
const config = useConfig();
const planConfig = config.appConfig.stripe?.plans?.find(p => p.id === subscription.plan_id);
```

---

## useAuth()

Returns auth state and methods. Must be used within `<AuthProvider>`.

```typescript
interface AuthContextType {
  currentUser: User | null;   // Firebase User object
  signup: (email: string, password: string, name: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  auth: Auth;                 // Firebase Auth instance
}
```

**Usage:**
```tsx
import { useAuth } from '@fireact.dev/app';

const { currentUser, signout } = useAuth();
// currentUser.uid — user's unique ID
// currentUser.email — user's email
```

---

## useSubscriptionInvoices()

Fetches paginated invoices for a subscription.

```typescript
interface UseSubscriptionInvoicesProps {
  subscriptionId: string;
  pageSize?: number;  // default: 10
}

interface UseSubscriptionInvoicesResult {
  invoices: Invoice[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}
```

**Usage:**
```tsx
import { useSubscriptionInvoices } from '@fireact.dev/app';

const { invoices, loading, hasMore, loadMore } = useSubscriptionInvoices({
  subscriptionId: subscription.id,
  pageSize: 20
});
```

---

## Exported Types

All types are importable from `@fireact.dev/app`:

```typescript
import type {
  Plan,
  Subscription,
  UserData,
  UserDetails,
  Invite,
  Invoice,
  AppConfiguration,
  FirebaseConfig,
  StripeConfig,
  PagesConfig,
  PermissionsConfig,
  EmulatorsConfig,
  SocialLoginConfig,
  SubscriptionSettings,
  UserPermissions,
} from '@fireact.dev/app';
```

### Plan
```typescript
interface Plan {
  id: string;
  titleKey: string;
  popular: boolean;
  priceIds: string[];
  currency: string;
  price: number;
  frequency: string;        // 'week' | 'month' | 'year'
  descriptionKeys: string[];
  free: boolean;
  legacy: boolean;
}
```

### Subscription
```typescript
interface Subscription {
  id: string;
  plan_id: string;
  status: string;           // 'active', 'canceled', etc.
  permissions: UserPermissions;  // Record<string, string[]>
  settings?: SubscriptionSettings;  // Record<string, string>
  owner_id: string;
}
```

### UserData
```typescript
interface UserData {
  display_name: string;
  create_time: any;
  email: string;
  avatar_url: string | null;
}
```

### UserDetails
```typescript
interface UserDetails {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  create_timestamp: number;
  permissions: string[];
  status?: 'active' | 'pending';
  invite_id?: string;
  pending_permissions?: string[];
}
```

### Invite
```typescript
interface Invite {
  id: string;
  subscription_id: string;
  subscription_name: string;
  host_uid: string;
  host_name: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  create_time: any;
  permissions: string[];
  accept_time?: any;
  accepted_by?: string;
  reject_time?: any;
  rejected_by?: string;
  revoke_time?: any;
  revoked_by?: string;
}
```

### Invoice
```typescript
interface Invoice {
  id: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;
  customer: string;
  customer_email: string | null;
  customer_name: string | null;
  description: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  number: string | null;
  paid: boolean;
  payment_intent: string | null;
  period_end: number;
  period_start: number;
  status: string;
  subscription_id: string;
  total: number;
  created: number;
  due_date: number | null;
  updated: number;
}
```

### AppConfiguration
```typescript
interface AppConfiguration {
  name: string;
  socialLogin: SocialLoginConfig;
  pages: PagesConfig;                    // Record<string, string>
  permissions: PermissionsConfig;
  emulators?: EmulatorsConfig;
  settings?: Record<string, {
    type: string;
    required: boolean;
    label: string;
    placeholder: string;
  }>;
  stripe?: StripeConfig;
  firebase?: FirebaseConfig;
}
```

### PermissionsConfig
```typescript
interface PermissionsConfig {
  [key: string]: {
    label: string;
    default: boolean;
    admin: boolean;
  };
}
```

### Other Types
```typescript
type UserPermissions = Record<string, string[]>;
type SubscriptionSettings = Record<string, string>;
interface PagesConfig extends Record<string, string> {}

interface SocialLoginConfig {
  google: boolean;
  microsoft: boolean;
  facebook: boolean;
  apple: boolean;
  github: boolean;
  twitter: boolean;
  yahoo: boolean;
}

interface EmulatorsConfig {
  enabled: boolean;
  host: string;
  ports: {
    functions: number;
    firestore: number;
    auth: number;
    hosting: number;
  };
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface StripeConfig {
  public_api_key: string;
  plans?: Plan[];
}
```
