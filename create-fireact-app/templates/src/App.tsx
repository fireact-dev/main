import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  AuthProvider,
  LoadingProvider,
  ConfigProvider,
  SubscriptionProvider,
  SignIn,
  SignUp,
  Profile,
  EditName,
  EditEmail,
  ResetPassword,
  FirebaseAuthActions,
  ChangePassword,
  DeleteAccount,
  AuthenticatedLayout,
  PublicLayout,
  Logo,
  CreatePlan,
  Home,
  SubscriptionDashboard,
  Plans,
  BillingForm,
  SubscriptionLayout,
  SubscriptionDesktopMenu,
  SubscriptionMobileMenu,
  MainDesktopMenu,
  MainMobileMenu,
  Billing,
  SubscriptionSettings,
  ProtectedSubscriptionRoute,
  UserList,
  InviteUser,
  ChangePlan,
  CancelSubscription,
  ManagePaymentMethods,
  UpdateBillingDetails,
  TransferSubscriptionOwnership
} from '@fireact.dev/app';
import firebaseConfig from './config/firebase.config.json';
import appConfig from './config/app.config.json';
import stripeConfig from './config/stripe.config.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './i18n/en';
import zh from './i18n/zh';
import de from './i18n/de';
import zhtw from './i18n/zhtw';
import fr from './i18n/fr';
import es from './i18n/es';
import pt from './i18n/pt';
import ja from './i18n/ja';
import ko from './i18n/ko';


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      zh: {
        translation: zh
      },
      zhtw: {
        translation: zhtw
      },
      de: {
        translation: de
      },
      fr: {
        translation: fr
      },
      es: {
        translation: es
      },
      pt: {
        translation: pt
      },
      ja: {
        translation: ja
      },
      ko: {
        translation: ko
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

function App() {
  return (
    <Router>
      <ConfigProvider firebaseConfig={firebaseConfig.firebase} appConfig={appConfig} stripeConfig={stripeConfig.stripe}>
        <AuthProvider>
          <LoadingProvider>
            <Routes>
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
              </Route>
              
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
                <Route path={appConfig.pages.invite} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <InviteUser />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.billing} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <Billing />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.settings} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <SubscriptionSettings />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.changePlan} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <ChangePlan PlansComponent={Plans} BillingFormComponent={BillingForm} />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.cancelSubscription} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <CancelSubscription />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.managePaymentMethods} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <ManagePaymentMethods />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.updateBillingDetails} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <UpdateBillingDetails />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.transferOwnership} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <TransferSubscriptionOwnership />
                  </ProtectedSubscriptionRoute>
                } />
              </Route>

              <Route element={<PublicLayout logo={<Logo className="w-20 h-20" />} />}>
                <Route path={appConfig.pages.signIn} element={<SignIn />} />
                <Route path={appConfig.pages.signUp} element={<SignUp />} />
                <Route path={appConfig.pages.resetPassword} element={<ResetPassword />} />
                <Route path={appConfig.pages.firebaseActions} element={<FirebaseAuthActions />} />
              </Route>
            </Routes>
          </LoadingProvider>
        </AuthProvider>
      </ConfigProvider>
    </Router>
  );
}

export default App;
