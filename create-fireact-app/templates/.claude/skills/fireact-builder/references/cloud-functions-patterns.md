# Cloud Functions Patterns Reference

How to add custom Cloud Functions to a Fireact project.

---

## functions/src/index.ts Structure

The entry point initializes Firebase Admin, sets up global config, and exports all cloud functions:

```typescript
import { initializeApp } from 'firebase-admin/app';
import * as stripeConfig from './config/stripe.config.json';
import * as appConfig from './config/app.config.json';
import type { Plan, Permission } from '@fireact.dev/functions';

// Initialize Firebase Admin at the entry point
initializeApp();

// Set up global config
declare global {
    var saasConfig: {
        stripe: {
            secret_api_key: string;
            end_point_secret: string;
        };
        emulators: {
            enabled: boolean;
            useTestKeys: boolean;
        };
        plans: Plan[];
        permissions: Record<string, Permission>;
    };
}

// Combine config files
global.saasConfig = {
    stripe: {
        secret_api_key: stripeConfig.stripe.secret_api_key,
        end_point_secret: stripeConfig.stripe.end_point_secret
    },
    emulators: appConfig.emulators,
    plans: stripeConfig.stripe.plans,
    permissions: appConfig.permissions
};

// Export built-in cloud functions from package
export {
  createSubscription,
  createInvite,
  getSubscriptionUsers,
  acceptInvite,
  rejectInvite,
  revokeInvite,
  removeUser,
  updateUserPermissions,
  stripeWebhook,
  changeSubscriptionPlan,
  cancelSubscription,
  getPaymentMethods,
  createSetupIntent,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  updateBillingDetails,
  getBillingDetails,
  transferSubscriptionOwnership
} from '@fireact.dev/functions';

// === Add custom function exports below ===
// export { myFunction } from './myFunction';
```

---

## New Cloud Function Template

Create a new file at `functions/src/<functionName>.ts`:

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export const myFunction = onCall(async (request) => {
  // 1. Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in');
  }

  const uid = request.auth.uid;
  const data = request.data;

  // 2. Access global config if needed
  const config = global.saasConfig;
  // config.plans — array of Plan objects
  // config.permissions — permission definitions
  // config.stripe.secret_api_key — Stripe secret key

  // 3. Access Firestore
  const db = getFirestore();

  // 4. Verify user has permission on the subscription
  const subscriptionDoc = await db.doc(`subscriptions/${data.subscriptionId}`).get();
  if (!subscriptionDoc.exists) {
    throw new HttpsError('not-found', 'Subscription not found');
  }

  const subscription = subscriptionDoc.data();
  if (!subscription?.permissions?.access?.includes(uid)) {
    throw new HttpsError('permission-denied', 'No access to this subscription');
  }

  // 5. Your business logic here
  // ...

  return { success: true };
});
```

---

## Export from index.ts

Add the export to `functions/src/index.ts`:

```typescript
// At the bottom of the file, after the @fireact.dev/functions exports:
export { myFunction } from './myFunction';
```

---

## Calling from Frontend

Use `httpsCallable` from the Firebase Functions SDK:

```typescript
import { httpsCallable } from 'firebase/functions';
import { useConfig, useSubscription } from '@fireact.dev/app';

function MyComponent() {
  const config = useConfig();
  const { subscription } = useSubscription();

  const handleAction = async () => {
    try {
      const myFunction = httpsCallable(config.functions, 'myFunction');
      const result = await myFunction({
        subscriptionId: subscription?.id,
        // ... other data
      });
      console.log(result.data);
    } catch (error) {
      console.error('Function call failed:', error);
    }
  };

  return <button onClick={handleAction}>Run Action</button>;
}
```

---

## Building Functions

After adding or modifying cloud functions:

```bash
cd functions && npm run build
```

This compiles TypeScript to JavaScript in `functions/lib/`.

---

## Firestore Security Rules Patterns

When your Cloud Function writes to a custom subcollection, add rules to `firestore.rules`:

### Read access for subscription members:
```
match /subscriptions/{docId}/myCollection/{itemId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.access.hasAny([request.auth.uid]);
}
```

### Write access for admins only:
```
match /subscriptions/{docId}/myCollection/{itemId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.access.hasAny([request.auth.uid]);
  allow write: if request.auth != null
    && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.admin.hasAny([request.auth.uid]);
}
```

### Write only through Cloud Functions (most secure):
```
match /subscriptions/{docId}/myCollection/{itemId} {
  allow read: if request.auth != null
    && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.access.hasAny([request.auth.uid]);
  allow write: if false;  // Only writable via Cloud Functions (admin SDK bypasses rules)
}
```

### Full firestore.rules structure:
```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Existing user rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Existing subscription rules
    match /subscriptions/{docId} {
      allow list: if request.auth != null;
      allow get: if request.auth != null
        && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.access.hasAny([request.auth.uid]);
      allow update: if request.auth != null
        && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.admin.hasAny([request.auth.uid])
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['settings']);
      allow create, delete: if false;

      // Invoices subcollection
      match /invoices/{invoiceId} {
        allow read: if request.auth != null
          && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.admin.hasAny([request.auth.uid]);
        allow write: if false;
      }

      // === Add custom subcollection rules here ===
      // match /myCollection/{itemId} {
      //   allow read: if request.auth != null
      //     && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.access.hasAny([request.auth.uid]);
      //   allow write: if false;
      // }
    }

    // Invites collection
    match /invites/{inviteId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/subscriptions/$(resource.data.subscription_id)).data.permissions.admin.hasAny([request.auth.uid])
        || (request.auth.token.email != null && request.auth.token.email.lower() == resource.data.email)
      );
      allow write: if false;
    }
  }
}
```

---

## Accessing Stripe in Cloud Functions

If your custom function needs Stripe:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(global.saasConfig.stripe.secret_api_key);

// Use stripe API
const customer = await stripe.customers.retrieve(customerId);
```

Make sure `stripe` is in your `functions/package.json` dependencies (it should already be there via `@fireact.dev/functions`).
