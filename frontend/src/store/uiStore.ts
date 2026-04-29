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
  setNamespace: (ns: string) => void
  setViewType: (vt: ViewType) => void
  setSelectedNode: (id: string | null) => void
  toggleKind: (kind: ResourceKind) => void
  setAllKindsVisible: () => void
  clearKinds: () => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNamespace: 'default',
  viewType: 'graph',
  selectedNodeId: null,
  visibleKinds: allVisible(),
  setNamespace: (ns) => set({ selectedNamespace: ns }),
  setViewType: (vt) => set({ viewType: vt }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  toggleKind: (kind) =>
    set((s) => ({
      visibleKinds: { ...s.visibleKinds, [kind]: !s.visibleKinds[kind] },
    })),
  setAllKindsVisible: () => set({ visibleKinds: allVisible() }),
  clearKinds: () => set({ visibleKinds: noneVisible() }),
}))
