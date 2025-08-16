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

// Export cloud functions from package
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
