import { Alert, Platform } from 'react-native';

/** Yes/no confirmation that works on web (window.confirm) and phones (Alert). */
export function confirm(title: string, message: string, onYes: () => void, yesLabel = 'OK') {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: yesLabel, style: 'destructive', onPress: onYes },
  ]);
}
