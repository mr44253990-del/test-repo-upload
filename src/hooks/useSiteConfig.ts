import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { SiteConfig } from '@/types';

const defaultConfig: SiteConfig = {
  siteName: 'MTXR Fund Management',
  siteTitle: 'MTXR - Fund Management System',
  logoUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  welcomeMessage: 'স্বাগতম! আমাদের ফান্ড ম্যানেজমেন্ট সিস্টেমে আপনাকে স্বাগতম।',
  footerText: '© 2024 MTXR Fund Management. All rights reserved.',
};

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = ref(db, 'siteConfig');
    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setConfig({ ...defaultConfig, ...snapshot.val() });
      } else {
        // Initialize with default config if not exists
        set(configRef, defaultConfig);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading site config:', error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const updateConfig = useCallback(async (updates: Partial<SiteConfig>) => {
    const configRef = ref(db, 'siteConfig');
    const newConfig = { ...config, ...updates };
    await set(configRef, newConfig);
    setConfig(newConfig);
  }, [config]);

  return {
    config,
    loading,
    updateConfig,
  };
}
