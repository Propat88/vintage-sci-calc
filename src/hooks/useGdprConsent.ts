import { useState, useEffect, useRef } from 'react';

let mobileAdsModule: any = null;
let AdsConsentModule: any = null;

try {
  const Ads = require('react-native-google-mobile-ads');
  mobileAdsModule = Ads.default;
  AdsConsentModule = Ads.AdsConsent;
} catch {}

export interface GdprConsentState {
  consentLoaded: boolean;
  canRequestAds: boolean;
}

export function useGdprConsent(): GdprConsentState {
  const [state, setState] = useState<GdprConsentState>({
    consentLoaded: !mobileAdsModule,
    canRequestAds: false,
  });
  const initCalled = useRef(false);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    if (!mobileAdsModule || !AdsConsentModule) return;

    const mobileAds = mobileAdsModule;
    const AdsConsent = AdsConsentModule;

    async function startSDK() {
      try {
        await mobileAds().initialize();
        setState({ consentLoaded: true, canRequestAds: true });
      } catch {
        setState({ consentLoaded: true, canRequestAds: false });
      }
    }

    async function initConsent() {
      try {
        const { canRequestAds } = await AdsConsent.getConsentInfo();
        if (canRequestAds) {
          await startSDK();
        }
      } catch {}
    }

    initConsent();

    AdsConsent.gatherConsent()
      .then(async () => {
        const info = await AdsConsent.getConsentInfo();
        if (info.canRequestAds) {
          await startSDK();
        }
      })
      .catch(() => {
        startSDK();
      });
  }, []);

  return state;
}
