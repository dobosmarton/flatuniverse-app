'use client';

import React from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { cookieConsentGiven } from '@/components/cookie-banner';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: 'https://eu.posthog.com',
    person_profiles: 'always', // or 'always' to create profiles for anonymous users as well
    persistence: cookieConsentGiven() === 'yes' ? 'localStorage+cookie' : 'memory',
    capture_pageview: false,
  });
}
export const AnalyticsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
