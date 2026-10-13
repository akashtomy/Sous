import { Image } from 'expo-image';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { T } from './ui';

export const APP_NAME = 'Sous';
export const TAGLINE = 'Your second-in-command in the kitchen';

/** The Sous app tile (S + saffron leaf). */
export function BrandMark({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/images/sous-logo.png')}
      style={{ width: size, height: size }}
      accessibilityLabel="Sous logo"
    />
  );
}

/** Logo, name and tagline, centred: sign-in and setup screens. */
export function BrandHeader({ subtitle = TAGLINE }: { subtitle?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl, paddingBottom: Spacing.md }}>
      <BrandMark size={88} />
      <T variant="title" style={{ fontSize: 34, lineHeight: 40, letterSpacing: -0.5 }}>
        {APP_NAME}
      </T>
      <T color="textMuted" style={{ textAlign: 'center' }}>
        {subtitle}
      </T>
    </View>
  );
}
