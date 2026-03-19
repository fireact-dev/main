# Routing Patterns Reference

Fireact uses React Router v6 with three route groups. All routes are defined in `src/App.tsx`.

---

## App Structure

```tsx
<Router>
  <ConfigProvider firebaseConfig={...} appConfig={...} stripeConfig={...}>
    <AuthProvider>
      <LoadingProvider>
        <Routes>
          {/* Group 1: Authenticated routes */}
          <Route element={<AuthenticatedLayout ... />}>
            ...
          </Route>

          {/* Group 2: Subscription routes */}
          <Route path={appConfig.pages.subscription} element={
            <SubscriptionProvider>
              <SubscriptionLayout ... />
            </SubscriptionProvider>
          }>
            ...
          </Route>

          {/* Group 3: Public routes */}
          <Route element={<PublicLayout ... />}>
            ...
          </Route>
        </Routes>
      </LoadingProvider>
    </AuthProvider>
  </ConfigProvider>
</Router>
```

---

## Group 1: Authenticated Routes

Routes that require login but are NOT scoped to a subscription. Wrapped in `AuthenticatedLayout`.

```tsx
<Route element={
  <AuthenticatedLayout
    desktopMenuItems={<MainDesktopMenu />}
    mobileMenuItems={<MainMobileMenu />}
    logo={<Logo className="w-10 h-10" />}
  />
}>
  <Route path={appConfig.pages.home} element={<Navigate to={appConfig.pages.dashboard} />} />
  <Route path={appConfig.pages.dashboard} element={<Home />} />
  <Route path={appConfig.pages.profile} element={<Profile />} />
  <Route path={appConfig.pages.editName} element={<EditName />} />
  <Route path={appConfig.pages.editEmail} element={<EditEmail />} />
  <Route path={appConfig.pages.changePassword} element={<ChangePassword />} />
  <Route path={appConfig.pages.deleteAccount} element={<DeleteAccount />} />
  <Route path={appConfig.pages.createPlan} element={<CreatePlan PlansComponent={Plans} BillingFormComponent={BillingForm} />} />
  {/* Add new authenticated routes here */}
</Route>
```

**Adding a new authenticated route:**
1. Add to `app.config.json`: `"myPage": "/my-page"`
2. Add in the `AuthenticatedLayout` block:
   ```tsx
   <Route path={appConfig.pages.myPage} element={<MyPage />} />
   ```

---

## Group 2: Subscription Routes

Routes scoped to a specific subscription. Wrapped in `SubscriptionProvider > SubscriptionLayout`.

```tsx
<Route path={appConfig.pages.subscription} element={
  <SubscriptionProvider>
    <SubscriptionLayout
      desktopMenu={<SubscriptionDesktopMenu />}
      mobileMenu={<SubscriptionMobileMenu />}
      logo={<Logo className="w-10 h-10" />}
    />
  </SubscriptionProvider>
}>
  <Route index element={
    <ProtectedSubscriptionRoute requiredPermissions={['access']}>
      <SubscriptionDashboard />
    </ProtectedSubscriptionRoute>
  } />
  <Route path={appConfig.pages.users} element={
    <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
      <UserList />
    </ProtectedSubscriptionRoute>
  } />
  {/* ... more routes ... */}
</Route>
```

**Adding a new subscription route:**
1. Add to `app.config.json`: `"reports": "/subscription/:id/reports"`
2. Add inside the `SubscriptionProvider` block:
   ```tsx
   <Route path={appConfig.pages.reports} element={
     <ProtectedSubscriptionRoute requiredPermissions={['access']}>
       <Reports />
     </ProtectedSubscriptionRoute>
   } />
   ```

---

## Group 3: Public Routes

Routes that don't require login. Wrapped in `PublicLayout`.

```tsx
<Route element={<PublicLayout logo={<Logo className="w-20 h-20" />} />}>
  <Route path={appConfig.pages.signIn} element={<SignIn />} />
  <Route path={appConfig.pages.signUp} element={<SignUp />} />
  <Route path={appConfig.pages.resetPassword} element={<ResetPassword />} />
  <Route path={appConfig.pages.firebaseActions} element={<FirebaseAuthActions />} />
  {/* Add new public routes here */}
</Route>
```

---

## ProtectedSubscriptionRoute

Wraps subscription-level routes to enforce permission checks.

**Props:**
- `requiredPermissions: string[]` — permission levels required (e.g., `['access']`, `['admin']`, `['owner']`)
- `requireAll?: boolean` — if `true`, user must have ALL listed permissions; if `false` (default), any one suffices

**Common permission levels:**
- `'access'` — basic subscription access (default permission)
- `'editor'` — editor-level access
- `'admin'` — administrative access
- `'owner'` — subscription owner only (used for billing, cancel, transfer)

**Example:**
```tsx
{/* Any subscriber can see */}
<ProtectedSubscriptionRoute requiredPermissions={['access']}>
  <Dashboard />
</ProtectedSubscriptionRoute>

{/* Only admins */}
<ProtectedSubscriptionRoute requiredPermissions={['admin']}>
  <UserList />
</ProtectedSubscriptionRoute>

{/* Only the subscription owner */}
<ProtectedSubscriptionRoute requiredPermissions={['owner']}>
  <CancelSubscription />
</ProtectedSubscriptionRoute>
```

---

## How app.config.json Pages Map to Routes

The `pages` object in `src/config/app.config.json` defines all route paths:

```json
{
  "pages": {
    "home": "/",
    "dashboard": "/dashboard",
    "profile": "/profile",
    "signIn": "/signin",
    "subscription": "/subscription/:id",
    "billing": "/subscription/:id/billing",
    "users": "/subscription/:id/users",
    "settings": "/subscription/:id/settings"
  }
}
```

In `App.tsx`, these are referenced as `appConfig.pages.<key>`:

```tsx
import appConfig from './config/app.config.json';

<Route path={appConfig.pages.dashboard} element={<Home />} />
<Route path={appConfig.pages.billing} element={...} />
```

**Subscription route paths** always follow the pattern: `/subscription/:id/<slug>`

The `:id` parameter is the Firestore subscription document ID and is automatically extracted by `useParams()` inside `SubscriptionProvider`.

---

## Import Pattern

All framework components are imported from `@fireact.dev/app` in a single destructured import:

```tsx
import {
  AuthProvider,
  LoadingProvider,
  ConfigProvider,
  SubscriptionProvider,
  SignIn,
  SignUp,
  Profile,
  // ... other components
  AuthenticatedLayout,
  PublicLayout,
  SubscriptionLayout,
  SubscriptionDesktopMenu,
  SubscriptionMobileMenu,
  MainDesktopMenu,
  MainMobileMenu,
  ProtectedSubscriptionRoute,
  Logo,
} from '@fireact.dev/app';
```

When replacing a component with a local version, remove it from this import and add a separate local import:

```tsx
// Remove SubscriptionDashboard from @fireact.dev/app import
import SubscriptionDashboard from './components/SubscriptionDashboard';
```
