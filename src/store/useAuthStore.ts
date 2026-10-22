import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signOutGoogle } from '../firebase';
import { isAdminEmail } from '../config/admins';

const BYPASS = import.meta.env.VITE_BYPASS_AUTH === 'true';

const fakeUser = {
  uid: 'dev-user',
  email: 'dev@babagtf.local',
  displayName: 'Dev Admin',
  emailVerified: true,
} as unknown as User;

interface AuthState {
  user: User | null;
  loading: boolean;
  erro: string | null;
  init: () => void;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  limparErro: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: BYPASS ? fakeUser : null,
  loading: BYPASS ? false : true,
  erro: null,

  init: () => {
    if (BYPASS) {
      set({ user: fakeUser, loading: false });
      return;
    }
    onAuthChange(async (user) => {
      // Se há sessão restaurada mas o e-mail não é mais admin → desloga
      if (user && !isAdminEmail(user.email)) {
        await signOutGoogle();
        set({
          user: null,
          loading: false,
          erro: 'Sua conta não está mais autorizada. Fale com a diretoria.',
        });
        return;
      }
      set({ user, loading: false, erro: null });
    });
  },

  loginGoogle: async () => {
    if (BYPASS) {
      set({ user: fakeUser, erro: null });
      return;
    }
    try {
      const user = await signInWithGoogle();
      set({ user, erro: null });
    } catch (e: any) {
      if (e?.message === 'ACESSO_NEGADO') {
        set({
          user: null,
          erro:
            'Sua conta Google não está autorizada a acessar o BABA GTF. Fale com a diretoria.',
        });
      } else {
        set({
          user: null,
          erro: 'Não foi possível fazer login. Tente novamente.',
        });
        console.error(e);
      }
    }
  },

  logout: async () => {
    if (BYPASS) {
      set({ user: null });
      return;
    }
    await signOutGoogle();
    set({ user: null, erro: null });
  },

  limparErro: () => set({ erro: null }),
}));

export const isBypassAuth = BYPASS;