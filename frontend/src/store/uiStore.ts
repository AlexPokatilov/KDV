import { create } from 'zustand'
import type { ResourceKind, ViewType } from '../types/graph'
import { ALL_KINDS } from '../utils/kindMeta'

type KindVisibility = Record<ResourceKind, boolean>

const allVisible = (): KindVisibility =>
  Object.fromEntries(ALL_KINDS.map((k) => [k, true])) as KindVisibility

const noneVisible = (): KindVisibility =>
  Object.fromEntries(ALL_KINDS.map((k) => [k, false])) as KindVisibility

interface UIState {
  selectedNamespace: string
  viewType: ViewType
  selectedNodeId: string | null
  visibleKinds: KindVisibility
  nameFilter: string
  layoutDirection: 'TB' | 'LR'
  setNamespace: (ns: string) => void
  setViewType: (vt: ViewType) => void
  setSelectedNode: (id: string | null) => void
  toggleKind: (kind: ResourceKind) => void
  setAllKindsVisible: () => void
  clearKinds: () => void
  setNameFilter: (q: string) => void
  setLayoutDirection: (d: 'TB' | 'LR') => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNamespace: 'default',
  viewType: 'graph' as ViewType,
  selectedNodeId: null,
  visibleKinds: allVisible(),
  nameFilter: '',
  layoutDirection: 'TB',
  setNamespace: (ns) => set({ selectedNamespace: ns }),
  setViewType: (vt) => set({ viewType: vt }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  toggleKind: (kind) =>
    set((s) => ({
      visibleKinds: { ...s.visibleKinds, [kind]: !s.visibleKinds[kind] },
    })),
  setAllKindsVisible: () => set({ visibleKinds: allVisible() }),
  clearKinds: () => set({ visibleKinds: noneVisible() }),
  setNameFilter: (q) => set({ nameFilter: q }),
  setLayoutDirection: (d) => set({ layoutDirection: d }),
}))
