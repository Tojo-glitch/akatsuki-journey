import { create } from 'zustand';
import { storageHelper } from '@kecha/shared-utils';

const AUTH_KEY = 'nostoi_auth_session_v1';
const PIN_KEY = 'nostoi_owner_pin_v1';
const DEFAULT_PIN = '1234';

interface AuthStoreState {
  isOwner: boolean;
  ownerPin: string;
  unlockOwner: (pin: string) => boolean;
  lockToViewer: () => void;
  updatePin: (oldPin: string, newPin: string) => boolean;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  isOwner: storageHelper.get<boolean>(AUTH_KEY, true),
  ownerPin: storageHelper.get<string>(PIN_KEY, DEFAULT_PIN),

  unlockOwner: (pin: string) => {
    if (pin === get().ownerPin) {
      storageHelper.set(AUTH_KEY, true);
      set({ isOwner: true });
      return true;
    }
    return false;
  },

  lockToViewer: () => {
    storageHelper.set(AUTH_KEY, false);
    set({ isOwner: false });
  },

  updatePin: (oldPin: string, newPin: string) => {
    if (oldPin === get().ownerPin && newPin.trim().length >= 4) {
      storageHelper.set(PIN_KEY, newPin.trim());
      set({ ownerPin: newPin.trim() });
      return true;
    }
    return false;
  }
}));
