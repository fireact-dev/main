# Component Patterns Reference

Templates and patterns for building Fireact components.

---

## Subscription-Level Page Template

Use for pages inside a subscription context (e.g., reports, analytics, settings).

```tsx
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig, useSubscription } from '@fireact.dev/app';

export default function MyPage() {
  const { subscription, loading, error } = useSubscription();
  const { t } = useTranslation();
  const config = useConfig();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !subscription) {
    return <Navigate to={config.appConfig.pages.home} replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-semibold">{t('myPage.title')}</h2>
          </div>
        </div>
        <div className="p-6">
          {/* Page content here */}
        </div>
      </div>
    </div>
  );
}
```

---

## Authenticated-Level Page Template

Use for pages that require login but aren't scoped to a subscription.

```tsx
import { useTranslation } from 'react-i18next';
import { useAuth, useConfig } from '@fireact.dev/app';

export default function MyPage() {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const config = useConfig();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <h2 className="text-xl font-semibold p-6">{t('myPage.title')}</h2>
        </div>
        <div className="p-6">
          {/* Page content here */}
        </div>
      </div>
    </div>
  );
}
```

---

## Public Page Template

Use for pages that don't require login.

```tsx
import { useTranslation } from 'react-i18next';

export default function MyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('myPage.title')}</h1>
        {/* Page content here */}
      </div>
    </div>
  );
}
```

---

## Firestore-Connected Component

Use when a component needs to read/write custom Firestore data within a subscription.

```tsx
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { useConfig, useSubscription } from '@fireact.dev/app';

interface MyItem {
  id: string;
  title: string;
  created_at: number;
}

export default function MyItemsList() {
  const { subscription, loading: subLoading, error } = useSubscription();
  const config = useConfig();
  const { t } = useTranslation();
  const [items, setItems] = useState<MyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      if (!subscription) return;
      try {
        const itemsRef = collection(config.db, 'subscriptions', subscription.id, 'myItems');
        const q = query(itemsRef, orderBy('created_at', 'desc'));
        const snapshot = await getDocs(q);
        setItems(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MyItem)));
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [subscription, config.db]);

  if (subLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !subscription) {
    return <Navigate to={config.appConfig.pages.home} replace />;
  }

  const handleAdd = async () => {
    await addDoc(collection(config.db, 'subscriptions', subscription.id, 'myItems'), {
      title: 'New Item',
      created_at: Date.now()
    });
    // Refresh items...
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('myItems.title')}</h2>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {t('myItems.add')}
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {items.map(item => (
            <li key={item.id} className="py-4">
              <span className="text-sm text-gray-900">{item.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Replacing an Existing Component (Import Swap Pattern)

When customizing a built-in component from `@fireact.dev/app`:

### Before (using package component):
```tsx
// src/App.tsx
import {
  SubscriptionDashboard,
  // ... other imports
} from '@fireact.dev/app';
```

### After (using local component):
```tsx
// src/App.tsx
import {
  // SubscriptionDashboard removed from here
  // ... other imports
} from '@fireact.dev/app';
import SubscriptionDashboard from './components/SubscriptionDashboard';
```

The local component should maintain the same hook/context contract. For example, a custom `SubscriptionDashboard` should still use `useSubscription()` and handle loading/error states.

---

## Accessing Plan Information

To display plan details within a subscription component:

```tsx
const config = useConfig();
const { subscription } = useSubscription();

// Find the plan configuration for the current subscription
const planConfig = config.appConfig.stripe?.plans?.find(
  plan => plan.id === subscription?.plan_id
);

// Access plan properties
planConfig?.titleKey     // i18n key for plan name
planConfig?.price        // numeric price
planConfig?.currency     // e.g., '$'
planConfig?.frequency    // e.g., 'month'
planConfig?.descriptionKeys  // array of i18n keys for features
planConfig?.free         // boolean
```

---

## All Exported Components from @fireact.dev/app

**Auth components:**
- `SignIn`, `SignUp`, `Profile`, `EditName`, `EditEmail`, `ResetPassword`, `FirebaseAuthActions`, `ChangePassword`, `DeleteAccount`

**Subscription components:**
- `SubscriptionDashboard`, `Billing`, `SubscriptionSettings`, `ChangePlan`, `CancelSubscription`, `ManagePaymentMethods`, `UpdateBillingDetails`, `TransferSubscriptionOwnership`, `InviteUser`, `UserList`

**Layouts:**
- `AuthenticatedLayout`, `SubscriptionLayout`, `PublicLayout`

**Navigation:**
- `MainDesktopMenu`, `MainMobileMenu`, `SubscriptionDesktopMenu`, `SubscriptionMobileMenu`, `PrivateRoute`, `ProtectedSubscriptionRoute`

**Common components:**
- `Logo`, `Plans`, `BillingForm`, `Avatar`, `Message`, `Pagination`, `InvoiceList`, `InvoiceTable`, `EditPermissionsModal`, `UserTable`, `LanguageSwitcher`

**Contexts & providers:**
- `ConfigProvider`, `AuthProvider`, `SubscriptionProvider`, `LoadingProvider`

**Hooks:**
- `useConfig`, `useSubscription`, `useAuth`, `useSubscriptionInvoices`
