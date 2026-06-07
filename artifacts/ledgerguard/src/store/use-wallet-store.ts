import { create } from 'zustand';

interface WalletState {
  address: string | null;
  network: string;
  setAddress: (address: string | null) => void;
  setNetwork: (network: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  network: 'devnet',
  setAddress: (address) => set({ address }),
  setNetwork: (network) => set({ network }),
}));
