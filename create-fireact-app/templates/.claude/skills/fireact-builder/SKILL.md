---
name: fireact-builder
description: Helps customize and extend Fireact SaaS apps after installation. Auto-detects Fireact projects by checking for @fireact.dev/app in package.json. Invoke when the user wants to add features, pages, custom components, navigation, branding, Cloud Functions, or i18n.
user_invocable: true
---

# Fireact Builder — Post-Installation Customization Skill

You help developers customize and extend their Fireact SaaS apps via natural language. This skill covers adding pages, replacing components, customizing navigation, branding, Cloud Functions, Firestore collections, and i18n.

---

## 1. Project Detection

Before doing anything, confirm this is a Fireact project:

1. Check `package.json` for `@fireact.dev/app` in dependencies
2. Check `src/config/app.config.json` exists
3. Check `src/App.tsx` imports from `@fireact.dev/app`

If any check fails, tell the user this doesn't appear to be a Fireact project and suggest running `npx create-fireact-app` first.

---

## 2. State Reading Protocol

**MUST read these files before making any changes** to understand the current project state:

| File | What to learn |
|------|---------------|
| `src/App.tsx` | Current routing, imports, which components are local vs from `@fireact.dev/app` |
| `src/config/app.config.json` | Route paths, permissions, settings |
| `src/config/stripe.config.json` | Subscription plans |
| `src/i18n/en.ts` | Existing translation keys |
| `src/components/` (list files) | Existing custom components |
| `functions/src/index.ts` | Existing Cloud Functions |
| `firestore.rules` | Existing security rules |

---

## 3. Customization Playbooks

### A. Add New Subscription Page

Use when the user wants a page scoped to a subscription (e.g., "add a reports page", "add an analytics page").

**Steps:**

1. **Create component** at `src/components/<PageName>.tsx`:
   - Import `useSubscription`, `useConfig`, `useTranslation` from `@fireact.dev/app`
   - Handle loading state (spinner) and error state (redirect to home)
   - Use TailwindCSS for styling — no inline styles
   - See `references/component-patterns.md` for template

2. **Add route key** to `src/config/app.config.json` under `pages`:
   ```json
   "<pageName>": "/subscription/:id/<slug>"
   ```

3. **Add route** in `src/App.tsx` inside the `SubscriptionProvider > SubscriptionLayout` route block:
   ```tsx
   <Route path={appConfig.pages.<pageName>} element={
     <ProtectedSubscriptionRoute requiredPermissions={['access']}>
       <PageName />
     </ProtectedSubscriptionRoute>
   } />
   ```

4. **Add import** at top of `src/App.tsx`:
   ```tsx
   import PageName from './components/PageName';
   ```

5. **Add i18n keys** to `src/i18n/en.ts` (and other language files)

6. **Optionally** add to navigation menu (see Playbook E)

### B. Add New Authenticated Page

Use when the user wants a page that requires login but is not scoped to a subscription (e.g., "add an API keys page", "add a settings page").

**Steps:**

1. **Create component** at `src/components/<PageName>.tsx`:
   - Import `useAuth`, `useConfig` from `@fireact.dev/app`
   - See `references/component-patterns.md` for template

2. **Add route key** to `src/config/app.config.json` under `pages`:
   ```json
   "<pageName>": "/<slug>"
   ```

3. **Add route** inside `AuthenticatedLayout` block in `src/App.tsx`:
   ```tsx
   <Route path={appConfig.pages.<pageName>} element={<PageName />} />
   ```

4. **Add import and translations**

### C. Add New Public Page

Use when the user wants a page that doesn't require login (e.g., "add a landing page", "add a pricing page").

**Steps:**

1. **Create component** at `src/components/<PageName>.tsx`

2. **Add route** inside `PublicLayout` block in `src/App.tsx`:
   ```tsx
   <Route path="/<slug>" element={<PageName />} />
   ```

3. **Add translations**

### D. Replace/Customize Existing Component

Use when the user wants to change an existing component from `@fireact.dev/app` (e.g., "customize the sign-in page", "change the dashboard").

**Steps:**

1. **Identify** which `@fireact.dev/app` component to replace (see `references/component-patterns.md` for the full export list)

2. **Create local version** at `src/components/<ComponentName>.tsx` maintaining the same hook/context contract as the original

3. **Change import in `src/App.tsx`**:
   - Remove the component from the `@fireact.dev/app` destructured import
   - Add a local import:
     ```tsx
     import ComponentName from './components/ComponentName';
     ```

4. **Reference** `references/component-patterns.md` for the expected patterns of each component type

### E. Customize Navigation

Use when the user wants to add, remove, or reorder navigation items.

**Steps:**

1. **Create custom menu components** (e.g., `src/components/CustomSubscriptionDesktopMenu.tsx` and `CustomSubscriptionMobileMenu.tsx`)

2. **Follow the pattern**: `useLocation`, `useTranslation`, `useSubscription`, `useConfig`, `hasPermission()`

3. **Path replacement**: use `.replace(':id', subscription?.id || '')` for subscription paths

4. **Sidebar width classes**:
   - `[.w-20_&]:hidden` — hide text when sidebar collapsed
   - `[.w-64_&]:mr-4` — add margin for icon when sidebar expanded
   - `[.w-20_&]:mx-auto` — center icon when sidebar collapsed

5. **Swap imports in `src/App.tsx`** layout props:
   - Remove `SubscriptionDesktopMenu` / `SubscriptionMobileMenu` from `@fireact.dev/app` import
   - Import custom versions
   - Pass to `SubscriptionLayout` `desktopMenu` and `mobileMenu` props

See `references/navigation-customization.md` for full reference.

### F. Customize Branding & Theme

Use when the user wants to change colors, fonts, or logo.

**Steps:**

1. **Modify `tailwind.config.js`** for custom colors/fonts:
   ```js
   theme: {
     extend: {
       colors: {
         primary: { /* custom palette */ }
       }
     }
   }
   ```

2. **Modify `src/index.css`** for global styles

3. **Create custom Logo component** at `src/components/Logo.tsx` and import locally in `App.tsx`

4. **SubscriptionLayout** supports these props for nav theming:
   - `navBackgroundColor` — CSS class for nav background (e.g., `"bg-blue-900"`)
   - `navTextColor` — CSS class for nav text (e.g., `"text-blue-100"`)

### G. Add Custom Cloud Functions

Use when the user wants to add backend logic.

**Steps:**

1. **Create** `functions/src/<functionName>.ts`:
   ```typescript
   import { onCall } from 'firebase-functions/v2/https';

   export const myFunction = onCall(async (request) => {
     // Access global config
     const config = global.saasConfig;
     // Your logic here
     return { success: true };
   });
   ```

2. **Access `global.saasConfig`** for permissions, plans, Stripe keys

3. **Export from `functions/src/index.ts`**:
   ```typescript
   export { myFunction } from './<functionName>';
   ```

4. **Call from frontend**:
   ```typescript
   import { httpsCallable } from 'firebase/functions';

   const config = useConfig();
   const myFunction = httpsCallable(config.functions, 'myFunction');
   const result = await myFunction({ /* data */ });
   ```

5. **Build**: `cd functions && npm run build`

See `references/cloud-functions-patterns.md` for detailed patterns.

### H. Add Firestore Collections & Custom Data

Use when the user wants to store and retrieve custom data.

**Steps:**

1. **Use Firestore SDK** with `config.db` from `useConfig()`:
   ```typescript
   import { collection, doc, getDocs, addDoc } from 'firebase/firestore';

   const config = useConfig();

   // Read
   const snapshot = await getDocs(collection(config.db, 'subscriptions', subscriptionId, 'myCollection'));

   // Write
   await addDoc(collection(config.db, 'subscriptions', subscriptionId, 'myCollection'), { ... });
   ```

2. **Add security rules** to `firestore.rules` following existing patterns:
   ```
   match /subscriptions/{docId}/myCollection/{docId2} {
     allow read: if request.auth != null
       && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.access.hasAny([request.auth.uid]);
     allow write: if request.auth != null
       && get(/databases/$(database)/documents/subscriptions/$(docId)).data.permissions.admin.hasAny([request.auth.uid]);
   }
   ```

3. **Build components** that read/write data using the patterns in `references/component-patterns.md`

---

## 4. Key Conventions (Always Follow)

- **i18n**: Use `useTranslation()` with `t('key')` for ALL user-facing strings. Never hardcode display text.
- **Loading/error states**: Always handle in subscription components — show spinner while loading, redirect on error.
- **TailwindCSS only**: No inline styles. Use Tailwind utility classes.
- **Route config**: Always add route key to `src/config/app.config.json` when adding a page.
- **Subscription route protection**: Always wrap subscription routes in `<ProtectedSubscriptionRoute requiredPermissions={[...]}>`.
- **Subscription URL pattern**: Paths follow `/subscription/:id/<slug>`.
- **Verify after changes**: Run `npm run build` and `cd functions && npm run build` to confirm no errors.

---

## 5. References

For detailed API documentation and code templates, see:

- **[Hooks & Contexts API](references/hooks-and-contexts-api.md)** — All hooks, their return types, and exported TypeScript types
- **[Routing Patterns](references/routing-patterns.md)** — Three route groups, ProtectedSubscriptionRoute, config mapping
- **[Component Patterns](references/component-patterns.md)** — Templates for subscription, authenticated, and public pages
- **[Navigation Customization](references/navigation-customization.md)** — Menu component patterns, SubscriptionLayout props
- **[Cloud Functions Patterns](references/cloud-functions-patterns.md)** — Backend function templates, global config, frontend calling
