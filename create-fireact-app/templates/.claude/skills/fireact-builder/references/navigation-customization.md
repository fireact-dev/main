# Navigation Customization Reference

How to create custom navigation menus for Fireact apps.

---

## SubscriptionLayout Props

```typescript
interface Props {
  desktopMenu: ReactNode;              // Sidebar menu for desktop
  mobileMenu: ReactNode;               // Menu for mobile hamburger drawer
  logo: ReactNode;                     // Logo component
  sidebarWidth?: string;               // Default: 'w-64'
  collapsedSidebarWidth?: string;      // Default: 'w-20'
  hideLanguageSwitcher?: boolean;      // Default: false
  additionalMenuItems?: ReactNode;     // Extra items in the top nav bar
  navBackgroundColor?: string;         // Top nav background CSS class (default: 'bg-gray-900')
  navTextColor?: string;               // Top nav text CSS class (default: 'text-white')
}
```

**Usage in App.tsx:**
```tsx
<SubscriptionLayout
  desktopMenu={<CustomDesktopMenu />}
  mobileMenu={<CustomMobileMenu />}
  logo={<Logo className="w-10 h-10" />}
  navBackgroundColor="bg-blue-900"
  navTextColor="text-blue-100"
/>
```

---

## Desktop Menu Pattern

The desktop menu renders in a sidebar that toggles between expanded (`w-64`) and collapsed (`w-20`).

**Key conventions:**
- Use `[.w-20_&]:hidden` to hide text when sidebar is collapsed
- Use `[.w-64_&]:mr-4` to add icon margin when sidebar is expanded
- Use `[.w-20_&]:mx-auto` to center icons when sidebar is collapsed

### Reference: SubscriptionDesktopMenu

```tsx
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig, useSubscription } from '@fireact.dev/app';

export const CustomSubscriptionDesktopMenu = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { hasPermission, subscription } = useSubscription();
  const config = useConfig();

  // Find admin permissions from config
  const adminPermissions = Object.entries(config.appConfig.permissions)
    .filter(([_, value]) => value.admin)
    .map(([key]) => key);
  const isAdmin = adminPermissions.some(permission => hasPermission(permission));

  // Build paths by replacing :id with actual subscription ID
  const basePath = config.appConfig.pages.subscription.replace(':id', subscription?.id || '');

  return (
    <nav className="mt-5 px-2 space-y-4">
      {/* Home / Projects Link */}
      <Link
        to={config.appConfig.pages.home}
        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
          location.pathname === config.pages.home
            ? 'bg-indigo-100 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <svg
          className={`[.w-20_&]:mx-auto [.w-64_&]:mr-4 h-6 w-6 ${
            location.pathname === config.pages.home
              ? 'text-indigo-600'
              : 'text-gray-400 group-hover:text-gray-500'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="[.w-20_&]:hidden">{t('subscription.plural')}</span>
      </Link>

      <div className="border-t border-gray-200"></div>

      {/* Dashboard Link */}
      <Link
        to={basePath}
        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
          !location.pathname.includes('/billing') &&
          !location.pathname.includes('/settings') &&
          !location.pathname.includes('/users')
            ? 'bg-indigo-100 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <svg
          className={`[.w-20_&]:mx-auto [.w-64_&]:mr-4 h-6 w-6 ...`}
          {/* ... icon SVG */}
        />
        <span className="[.w-20_&]:hidden">{t('ui.dashboard')}</span>
      </Link>

      {/* === ADD CUSTOM MENU ITEMS HERE === */}

      <div className="border-t border-gray-200"></div>

      {/* Admin-only items */}
      {isAdmin && (
        <div className="space-y-1">
          <Link to={config.appConfig.pages.users.replace(':id', subscription?.id || '')} ...>
            {t('subscription.users.menuItem')}
          </Link>
          <Link to={config.appConfig.pages.billing.replace(':id', subscription?.id || '')} ...>
            {t('subscription.billing')}
          </Link>
          <Link to={config.appConfig.pages.settings.replace(':id', subscription?.id || '')} ...>
            {t('subscription.settings')}
          </Link>
        </div>
      )}
    </nav>
  );
};
```

---

## Mobile Menu Pattern

The mobile menu renders in a hamburger drawer. Same hooks and logic, but without the sidebar-width responsive classes.

```tsx
export const CustomSubscriptionMobileMenu = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { hasPermission, subscription } = useSubscription();
  const config = useConfig();

  // Same permission logic as desktop...

  return (
    <div className="space-y-4">
      <Link to={config.appConfig.pages.home} className={`group flex items-center px-2 py-2 ...`}>
        <svg className="mr-4 h-6 w-6 ..." .../>
        <span>{t('subscription.plural')}</span>
      </Link>

      <div className="border-t border-gray-700"></div>

      <Link to={basePath} className={`group flex items-center px-2 py-2 ...`}>
        <svg className="mr-4 h-6 w-6 ..." .../>
        <span>{t('ui.dashboard')}</span>
      </Link>

      {/* Custom items */}

      <div className="border-t border-gray-700"></div>

      {isAdmin && (
        <div className="space-y-1">
          {/* Admin menu items */}
        </div>
      )}

      <div className="mt-4 border-t border-gray-700"></div>
    </div>
  );
};
```

**Key differences from desktop:**
- No sidebar-width responsive classes (`[.w-20_&]:...` / `[.w-64_&]:...`)
- Icon always has `mr-4` margin
- Divider border color is `border-gray-700` (dark background)
- Hover states use `hover:bg-gray-700 hover:text-white`

---

## Adding a Menu Item (Minimal Change)

If you only need to add one or two items, you can copy the existing menu components and add your items rather than writing from scratch:

1. Copy `SubscriptionDesktopMenu` and `SubscriptionMobileMenu` source into local files
2. Add your new `<Link>` items in the appropriate position
3. Swap imports in `App.tsx`

**New menu item template (desktop):**
```tsx
<Link
  to={config.appConfig.pages.reports.replace(':id', subscription?.id || '')}
  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
    location.pathname.includes('/reports')
      ? 'bg-indigo-100 text-indigo-600'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`}
>
  <svg
    className={`[.w-20_&]:mx-auto [.w-64_&]:mr-4 h-6 w-6 ${
      location.pathname.includes('/reports')
        ? 'text-indigo-600'
        : 'text-gray-400 group-hover:text-gray-500'
    }`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {/* Your SVG icon path */}
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  <span className="[.w-20_&]:hidden">{t('reports.menuItem')}</span>
</Link>
```

---

## Active State Detection

Active menu items use `location.pathname.includes('/slug')` for subscription pages:

```tsx
const isActive = location.pathname.includes('/reports');
```

For the dashboard (index route), use negative checks:
```tsx
const isDashboard = !location.pathname.includes('/billing')
  && !location.pathname.includes('/settings')
  && !location.pathname.includes('/users')
  && !location.pathname.includes('/reports');  // Add your new slugs
```

---

## Permission-Gated Menu Items

Show items only to users with specific permissions:

```tsx
// Single permission check
{hasPermission('admin') && (
  <Link to="...">{t('admin.menuItem')}</Link>
)}

// Check for any admin-level permission (recommended)
const adminPermissions = Object.entries(config.appConfig.permissions)
  .filter(([_, value]) => value.admin)
  .map(([key]) => key);
const isAdmin = adminPermissions.some(permission => hasPermission(permission));

{isAdmin && (
  <div className="space-y-1">
    {/* Admin menu items */}
  </div>
)}
```
