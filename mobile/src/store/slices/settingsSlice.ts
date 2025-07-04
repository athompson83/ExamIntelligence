import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  language: string;
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
  pushNotificationsEnabled: boolean;
  offlineModeEnabled: boolean;
  autoSaveInterval: number;
  proctoringSettings: {
    cameraEnabled: boolean;
    microphoneEnabled: boolean;
    screenRecordingEnabled: boolean;
  };
  accessibilitySettings: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reduceMotion: boolean;
  };
}

const initialState: SettingsState = {
  language: 'en',
  theme: 'system',
  biometricEnabled: false,
  pushNotificationsEnabled: true,
  offlineModeEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  proctoringSettings: {
    cameraEnabled: true,
    microphoneEnabled: true,
    screenRecordingEnabled: false,
  },
  accessibilitySettings: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setPushNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.pushNotificationsEnabled = action.payload;
    },
    setOfflineModeEnabled: (state, action: PayloadAction<boolean>) => {
      state.offlineModeEnabled = action.payload;
    },
    setAutoSaveInterval: (state, action: PayloadAction<number>) => {
      state.autoSaveInterval = action.payload;
    },
    updateProctoringSettings: (state, action: PayloadAction<Partial<SettingsState['proctoringSettings']>>) => {
      state.proctoringSettings = { ...state.proctoringSettings, ...action.payload };
    },
    updateAccessibilitySettings: (state, action: PayloadAction<Partial<SettingsState['accessibilitySettings']>>) => {
      state.accessibilitySettings = { ...state.accessibilitySettings, ...action.payload };
    },
    resetSettings: () => initialState,
  },
});

export const {
  setLanguage,
  setTheme,
  setBiometricEnabled,
  setPushNotificationsEnabled,
  setOfflineModeEnabled,
  setAutoSaveInterval,
  updateProctoringSettings,
  updateAccessibilitySettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;