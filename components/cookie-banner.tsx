'use client';

import { useEffect, useState } from 'react';
import { CookieIcon } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';

import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export const cookieConsentGiven = (): string | null => {
  if (!localStorage.getItem('cookie_consent')) {
    return 'undecided';
  }
  return localStorage.getItem('cookie_consent');
};

export const CookieBanner = () => {
  const [consentGiven, setConsentGiven] = useState('');
  const posthog = usePostHog();

  useEffect(() => {
    // We want this to only run once the client loads
    // or else it causes a hydration error
    const hasCookieConsentGiven = cookieConsentGiven();
    if (hasCookieConsentGiven) {
      setConsentGiven(hasCookieConsentGiven);
    }
  }, []);

  useEffect(() => {
    if (consentGiven !== '') {
      posthog.set_config({ persistence: consentGiven === 'yes' ? 'localStorage+cookie' : 'memory' });
    }
  }, [consentGiven]);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'yes');
    setConsentGiven('yes');
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie_consent', 'no');
    setConsentGiven('no');
  };

  return (
    <div>
      {consentGiven === 'undecided' && (
        <div
          className={cn('fixed z-[200] bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700')}>
          <div className="dark:bg-secondary bg-background rounded-md m-3 border border-border shadow-lg dark:shadow-none">
            <div className="grid gap-2">
              <div className="border-b border-border dark:border-background/20 h-14 flex items-center justify-between p-4">
                <h1 className="text-lg font-medium">We use cookies</h1>
                <CookieIcon className="h-[1.2rem] w-[1.2rem]" />
              </div>
              <div className="p-4">
                <p className="text-sm font-normal text-start">
                  We use tracking cookies to understand how you use the product and help us improve it. Please accept
                  cookies to help us improve.
                </p>
              </div>
              <div className="flex gap-2 p-4 py-5 border-t border-border dark:bg-background/20">
                <Button onClick={handleAcceptCookies} className="w-full">
                  Accept
                </Button>
                <Button onClick={handleDeclineCookies} className="w-full" variant="secondary">
                  Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
