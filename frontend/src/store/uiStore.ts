import { create } from 'zustand'
import type { ViewType } from '../types/graph'

interface UIState {
  selectedNamespace: string
  viewType: ViewType
  selectedNodeId: string | null
  setNamespace: (ns: string) => void
  setViewType: (vt: ViewType) => void
  setSelectedNode: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNamespace: 'default',
  viewType: 'graph',
  selectedNodeId: null,
  setNamespace: (ns) => set({ selectedNamespace: ns }),
  setViewType: (vt) => set({ viewType: vt }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
}))
