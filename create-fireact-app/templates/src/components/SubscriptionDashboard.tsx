import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig, useSubscription } from '@fireact.dev/app';


export default function SubscriptionDashboard() {
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

  // Find the plan configuration
  const planConfig = config.appConfig.stripe?.plans?.find(plan => plan.id === subscription.plan_id);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-semibold">
              {subscription.settings?.name || t('subscription.untitled')}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              subscription.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {subscription.status}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('subscription.id')}
              </label>
              <div className="mt-1 text-sm text-gray-900 font-mono">
                {subscription.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('plans.title')}
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {t(`plans.${subscription.plan_id}.title`)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <h3 className="text-lg font-medium p-6">
            {t('subscription.features')}
          </h3>
        </div>
        <div className="p-6">
          <ul role="list" className="grid gap-4 sm:grid-cols-2 text-sm leading-6 text-gray-600">
            {planConfig?.descriptionKeys.map((featureKey, index) => (
              <li key={index} className="flex gap-x-3">
                <svg
                  className="h-6 w-5 flex-none text-indigo-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                {t(featureKey)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
