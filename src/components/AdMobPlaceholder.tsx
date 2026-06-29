import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { useGdprConsent } from '../hooks/useGdprConsent';

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

try {
  const Ads = require('react-native-google-mobile-ads');
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  TestIds = Ads.TestIds;
} catch {}

const adUnitId = TestIds
  ? (__DEV__ ? TestIds.BANNER : 'ca-app-pub-8321683523431977/8937335090')
  : '';

export const AdMobPlaceholder = memo(function AdMobPlaceholder() {
  const { consentLoaded, canRequestAds } = useGdprConsent();

  if (!BannerAd || !canRequestAds) {
    if (!consentLoaded) {
      return (
        <View style={{ minHeight: 60, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#333', fontSize: 9 }}>CARGANDO...</Text>
        </View>
      );
    }
    return (
      <View style={{ minHeight: 60, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#444', fontSize: 10, fontWeight: 'bold' }}>
          ANUNCIO DISPONIBLE EN PRODUCCIÓN
        </Text>
      </View>
    );
  }

  return (
    <View style={{ minHeight: 60, alignItems: 'center', justifyContent: 'center' }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
      />
    </View>
  );
});
