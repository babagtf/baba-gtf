import { create } from 'zustand';
import type { AppState } from '../types';
import { buildSeed } from '../lib/seed';
import { db, isFirebaseEnabled } from '../firebase';
import {
  doc, getDoc, setDoc, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { useAuthStore, isBypassAuth } from './useAuthStore';
import { message } from 'antd';
const FALLBACK_KEY = 'baba-gtf-dev';

// Guarda o listener ativo (pra limpar quando trocar de usuário/sessão)
let currentUnsubscribe: Unsubscribe | null = null;

interface Store {
  state: AppState;
  loading: boolean;
  init: () => Promise<void>;
  setState: (updater: (s: AppState) => AppState) => void;
  reset: () => Promise<void>;
  clearLocalAndReload: () => Promise<void>;
}

export const useAppStore = create<Store>((set, get) => ({
  state: buildSeed(),
  loading: true,

  init: async () => {
    // Limpa listener anterior — evita duplicatas no StrictMode e em
    // logout/login sem reload
    if (currentUnsubscribe) {
      currentUnsubscribe();
      currentUnsubscribe = null;
    }

    // ===== MODO DEV (localStorage) =====
    if (isBypassAuth || !isFirebaseEnabled || !db) {
      try {
        const raw = localStorage.getItem(FALLBACK_KEY);
        if (raw) {
          set({ state: JSON.parse(raw), loading: false });
          return;
        }
      } catch (e) {
        console.warn('Falha ao ler localStorage', e);
      }
      const seed = buildSeed();
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(seed));
      set({ state: seed, loading: false });
      return;
    }

    // ===== MODO PRODUÇÃO (Firestore) =====
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ loading: false });
      return;
    }

    try {
      const ref = doc(db, 'config', 'geral');
      const snap = await getDoc(ref);

      // Semeia na primeira vez
      if (!snap.exists()) {
        const seed = buildSeed();
        await setDoc(ref, seed);
      }

      // Assina mudanças em tempo real
      currentUnsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            set({
              state: snapshot.data() as AppState,
              loading: false,
            });
          }
        },
        (error) => {
          console.error('[Firestore] onSnapshot error:', error);
          set({ loading: false });
        },
      );
    } catch (e) {
      console.error('[Firestore] Erro ao carregar:', e);
      message.error('Erro de conexão. Não foi possível carregar os dados.');
      set({ state: buildSeed(), loading: false });
    }
  },

  setState: (updater) => {
    // 1. Atualiza local imediatamente (otimista)
    const next = updater(get().state);
    set({ state: next });

    // 2. Persiste
    if (isBypassAuth || !isFirebaseEnabled || !db) {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(next));
    } else {
      setDoc(doc(db, 'config', 'geral'), next).catch((e) => {
        console.error('[Firestore] setDoc error:', e);
        message.error('Falha ao salvar na nuvem. Verifique sua internet.');
      });
    }
  },

  reset: async () => {
    const seed = buildSeed();
    set({ state: seed });
    if (isBypassAuth || !isFirebaseEnabled || !db) {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(seed));
    } else if (db) {
      await setDoc(doc(db, 'config', 'geral'), seed);
    }
  },

  clearLocalAndReload: async () => {
    localStorage.removeItem('baba-gtf-dev');
    localStorage.removeItem('baba-gtf-v3');
    set({ loading: true });
    await get().init();
  },
}));