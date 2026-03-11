'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  GlobeIcon,
  UserSwitchIcon,
  RocketIcon,
} from '@synnovator/ui';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';

const COOKIE_NAME = 'synnovator_onboarded';
const COOKIE_MAX_AGE = 31536000; // 365 days

function hasOnboardedCookie(): boolean {
  return document.cookie
    .split('; ')
    .some((c) => c.startsWith(`${COOKIE_NAME}=`));
}

function setOnboardedCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

const features = [
  {
    icon: GlobeIcon,
    titleKey: 'welcome.browse_title',
    descKey: 'welcome.browse_desc',
  },
  {
    icon: UserSwitchIcon,
    titleKey: 'welcome.profile_title',
    descKey: 'welcome.profile_desc',
  },
  {
    icon: RocketIcon,
    titleKey: 'welcome.submit_title',
    descKey: 'welcome.submit_desc',
  },
] as const;

export function WelcomeDialog() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasOnboardedCookie()) {
      setOpen(true);
    }
  }, []);

  function handleClose() {
    setOnboardedCookie();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl font-heading">
            {t(lang, 'welcome.title')}
          </DialogTitle>
          <DialogDescription>
            {t(lang, 'welcome.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="bg-muted rounded-lg p-4 text-center"
            >
              <Icon
                className="mx-auto mb-2 text-primary"
                size={28}
                aria-hidden="true"
              />
              <h3 className="font-medium text-foreground text-sm mb-1">
                {t(lang, titleKey)}
              </h3>
              <p className="text-muted-foreground text-xs">
                {t(lang, descKey)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button onClick={handleClose} className="px-8">
            {t(lang, 'welcome.cta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
