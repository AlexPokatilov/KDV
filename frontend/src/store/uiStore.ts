import { create } from 'zustand'
import type { ResourceKind, ViewType } from '../types/graph'
import { ALL_KINDS } from '../utils/kindMeta'

const savedTheme = (localStorage.getItem('kdv-theme') as 'dark' | 'light') ?? 'dark'
document.documentElement.dataset.theme = savedTheme

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
  rankSep: number
  nodeSep: number
  theme: 'dark' | 'light'
  forceStrength: number
  forceDistance: number
  setNamespace: (ns: string) => void
  setViewType: (vt: ViewType) => void
  setSelectedNode: (id: string | null) => void
  toggleKind: (kind: ResourceKind) => void
  setAllKindsVisible: () => void
  clearKinds: () => void
  setNameFilter: (q: string) => void
  setLayoutDirection: (d: 'TB' | 'LR') => void
  setRankSep: (v: number) => void
  setNodeSep: (v: number) => void
  toggleTheme: () => void
  setForceStrength: (v: number) => void
  setForceDistance: (v: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNamespace: 'default',
  viewType: 'graph' as ViewType,
  selectedNodeId: null,
  visibleKinds: allVisible(),
  nameFilter: '',
  layoutDirection: 'TB',
  rankSep: 100,
  nodeSep: 50,
  theme: savedTheme,
  forceStrength: -300,
  forceDistance: 150,
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
  setRankSep: (v) => set({ rankSep: v }),
  setNodeSep: (v) => set({ nodeSep: v }),
  setForceStrength: (v) => set({ forceStrength: v }),
  setForceDistance: (v) => set({ forceDistance: v }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('kdv-theme', next)
    return { theme: next }
  }),
}))
