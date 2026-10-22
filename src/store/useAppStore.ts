import { create } from 'zustand';
import type { AppState } from '../types';
import { buildSeed } from '../lib/seed';
import { db, isFirebaseEnabled } from '../firebase';
import {
  doc, getDoc, setDoc, onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { useAuthStore, isBypassAuth } from './useAuthStore';

const FALLBACK_KEY = 'baba-gtf-dev';
let currentUnsubscribe: Unsubscribe | null = null;

interface Store {
  state: AppState;
  anoVisualizado: number;
  loading: boolean;
  init: () => Promise<void>;
  setState: (updater: (s: AppState) => AppState) => void;
  setAnoVisualizado: (ano: number) => void;
  reset: () => Promise<void>;
  clearLocalAndReload: () => Promise<void>;
}

export const useAppStore = create<Store>((set, get) => ({
  state: buildSeed(),
  anoVisualizado: new Date().getFullYear(),
  loading: true,

  init: async () => {
    if (currentUnsubscribe) {
      currentUnsubscribe();
      currentUnsubscribe = null;
    }

    // Modo dev
    if (isBypassAuth || !isFirebaseEnabled || !db) {
      try {
        const raw = localStorage.getItem(FALLBACK_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          set({
            state: parsed,
            anoVisualizado: parsed.config.anoExercicio,
            loading: false,
          });
          return;
        }
      } catch (e) {
        console.warn('Falha ao ler localStorage', e);
      }
      const seed = buildSeed();
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(seed));
      set({
        state: seed,
        anoVisualizado: seed.config.anoExercicio,
        loading: false,
      });
      return;
    }

    // Modo produção
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ loading: false });
      return;
    }

    try {
      const ref = doc(db, 'config', 'geral');
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const seed = buildSeed();
        await setDoc(ref, seed);
      }

      currentUnsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AppState;
            const anoAtual = get().anoVisualizado;
            // Se o anoVisualizado ainda é o "default" (não escolhido), sincroniza
            set({
              state: data,
              anoVisualizado:
                anoAtual === new Date().getFullYear()
                  ? data.config.anoExercicio
                  : anoAtual,
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
      set({ state: buildSeed(), loading: false });
    }
  },

  setState: (updater) => {
    const next = updater(get().state);
    set({ state: next });
    if (isBypassAuth || !isFirebaseEnabled || !db) {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(next));
    } else {
      setDoc(doc(db, 'config', 'geral'), next).catch((e) =>
        console.error('[Firestore] setDoc error:', e),
      );
    }
  },

  setAnoVisualizado: (ano) => set({ anoVisualizado: ano }),

  reset: async () => {
    const seed = buildSeed();
    set({ state: seed, anoVisualizado: seed.config.anoExercicio });
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