import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force'
import { useGraphQuery } from '../../api/graph'
import { useUIStore } from '../../store/uiStore'
import { filterByKinds, filterByName, computeEdgeStroke } from '../../utils/graphTransform'
import { KIND_COLORS, KIND_SHORT_LABELS } from '../../utils/kindMeta'
import { ErrorBanner } from '../common/ErrorBanner'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { NodeDetailPanel } from '../graph/NodeDetailPanel'
import type { GraphNode, GraphEdge, ResourceKind } from '../../types/graph'

const RADIUS = 28
const MINIMAP_W = 200
const MINIMAP_H = 120

interface SimNode extends SimulationNodeDatum {
  id: string
  graphNode: GraphNode
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  edgeId: string
}

interface Transform {
  x: number
  y: number
  k: number
}

export function BubblesView() {
  const {
    selectedNamespace,
    visibleKinds,
    nameFilter,
    theme,
    setSelectedNode,
    selectedNodeId,
    forceStrength,
    forceDistance,
  } = useUIStore()

  const { data, isLoading, isError, error } = useGraphQuery(selectedNamespace)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const nodeRefs = useRef<Map<string, SVGGElement>>(new Map())
  const edgeRefs = useRef<Map<string, SVGLineElement>>(new Map())

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const transformRef = useRef<Transform>({ x: 0, y: 0, k: 1 })

  const minimapNodeRefs = useRef<Map<string, SVGCircleElement>>(new Map())
  const minimapBoundsRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 })

  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  const filtered = useMemo(() => {
    if (!data) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] }
    let r = filterByKinds(data, visibleKinds)
    r = filterByName(r, nameFilter)
    return r
  }, [data, visibleKinds, nameFilter])

  const kindByNodeId = useMemo(
    () => new Map(filtered.nodes.map((n) => [n.id, n.kind as ResourceKind])),
    [filtered.nodes],
  )

  const edgeStyles = useMemo(
    () =>
      new Map(
        filtered.edges.map((e) => [e.id, computeEdgeStroke(e, kindByNodeId, theme)]),
      ),
    [filtered.edges, kindByNodeId, theme],
  )

  const selectedNode = useMemo(
    () => filtered.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [filtered.nodes, selectedNodeId],
  )

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    const width = rect?.width ?? 800
    const height = rect?.height ?? 600

    const simNodes: SimNode[] = filtered.nodes.map((n) => ({ id: n.id, graphNode: n }))
    const nodeById = new Map(simNodes.map((n) => [n.id, n]))

    const simLinks: SimLink[] = filtered.edges.flatMap((e) => {
      const source = nodeById.get(e.source)
      const target = nodeById.get(e.target)
      if (!source || !target) return []
      return [{ source, target, edgeId: e.id }]
    })

    if (simRef.current) simRef.current.stop()

    const sim = forceSimulation(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(forceDistance),
      )
      .force('charge', forceManyBody<SimNode>().strength(forceStrength))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<SimNode>(RADIUS + 4))

    sim.on('tick', () => {
      simNodes.forEach((n) => {
        const el = nodeRefs.current.get(n.id)
        if (el && n.x != null && n.y != null) {
          el.setAttribute('transform', `translate(${n.x},${n.y})`)
        }
      })
      simLinks.forEach((l) => {
        const el = edgeRefs.current.get(l.edgeId)
        if (el) {
          const s = l.source as SimNode
          const t = l.target as SimNode
          el.setAttribute('x1', String(s.x ?? 0))
          el.setAttribute('y1', String(s.y ?? 0))
          el.setAttribute('x2', String(t.x ?? 0))
          el.setAttribute('y2', String(t.y ?? 0))
        }
      })

      // Update minimap bounds and node positions
      const xs = simNodes.filter((n) => n.x != null).map((n) => n.x!)
      const ys = simNodes.filter((n) => n.y != null).map((n) => n.y!)
      if (xs.length > 0) {
        const pad = RADIUS + 10
        const minX = Math.min(...xs) - pad
        const maxX = Math.max(...xs) + pad
        const minY = Math.min(...ys) - pad
        const maxY = Math.max(...ys) + pad
        const scale = Math.min(MINIMAP_W / (maxX - minX), MINIMAP_H / (maxY - minY))
        minimapBoundsRef.current = { scale, offsetX: -minX, offsetY: -minY }
      }
      simNodes.forEach((n) => {
        const el = minimapNodeRefs.current.get(n.id)
        if (el && n.x != null && n.y != null) {
          const { scale, offsetX, offsetY } = minimapBoundsRef.current
          el.setAttribute('cx', String((n.x + offsetX) * scale))
          el.setAttribute('cy', String((n.y + offsetY) * scale))
        }
      })
    })

    simRef.current = sim

    return () => {
      sim.stop()
    }
  }, [filtered, forceStrength, forceDistance])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const { x, y, k } = transformRef.current
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const newK = Math.min(Math.max(k * factor, 0.2), 4)
    const svgRect = svgRef.current?.getBoundingClientRect()
    if (!svgRect) return
    const mx = e.clientX - svgRect.left
    const my = e.clientY - svgRect.top
    const newX = mx - (mx - x) * (newK / k)
    const newY = my - (my - y) * (newK / k)
    const next = { x: newX, y: newY, k: newK }
    transformRef.current = next
    setTransform(next)
  }, [])

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isPanning.current = true
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transformRef.current.x,
      ty: transformRef.current.y,
    }
    e.preventDefault()
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const next = {
        ...transformRef.current,
        x: panStart.current.tx + dx,
        y: panStart.current.ty + dy,
      }
      transformRef.current = next
      setTransform(next)
    }
    const onMouseUp = () => {
      isPanning.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      if (e.button !== 0) return

      const sim = simRef.current
      if (!sim) return

      const simNodes = sim.nodes()
      const simNode = simNodes.find((n) => n.id === nodeId)
      if (!simNode) return

      let didDrag = false
      const startX = e.clientX
      const startY = e.clientY

      simNode.fx = simNode.x
      simNode.fy = simNode.y
      sim.alphaTarget(0.3).restart()

      const onMouseMove = (ev: MouseEvent) => {
        if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) {
          didDrag = true
        }
        const { k } = transformRef.current
        simNode.fx = (simNode.fx ?? 0) + ev.movementX / k
        simNode.fy = (simNode.fy ?? 0) + ev.movementY / k
      }

      const onMouseUp = () => {
        simNode.fx = null
        simNode.fy = null
        sim.alphaTarget(0)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        if (!didDrag) {
          setSelectedNode(nodeId)
        }
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [setSelectedNode],
  )

  const handleBgClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  const zoomAround = useCallback((factor: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const cx = (rect?.width ?? 800) / 2
    const cy = (rect?.height ?? 600) / 2
    const { x, y, k } = transformRef.current
    const newK = Math.min(Math.max(k * factor, 0.2), 4)
    const next = {
      x: cx - (cx - x) * (newK / k),
      y: cy - (cy - y) * (newK / k),
      k: newK,
    }
    transformRef.current = next
    setTransform(next)
  }, [])

  const handleZoomIn = useCallback(() => zoomAround(1.3), [zoomAround])
  const handleZoomOut = useCallback(() => zoomAround(1 / 1.3), [zoomAround])

  const handleFitView = useCallback(() => {
    const nodes = simRef.current?.nodes()
    if (!nodes?.length) return
    const rect = containerRef.current?.getBoundingClientRect()
    const W = rect?.width ?? 800
    const H = rect?.height ?? 600
    const xs = nodes.filter((n) => n.x != null).map((n) => n.x!)
    const ys = nodes.filter((n) => n.y != null).map((n) => n.y!)
    if (!xs.length) return
    const pad = RADIUS + 20
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad
    const k = Math.min(W / (maxX - minX), H / (maxY - minY), 4)
    const next = {
      x: W / 2 - ((minX + maxX) / 2) * k,
      y: H / 2 - ((minY + maxY) / 2) * k,
      k,
    }
    transformRef.current = next
    setTransform(next)
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorBanner message={(error as Error)?.message ?? 'Error loading graph'} />

  const DOT_GAP = 20
  const dotColor = theme === 'dark' ? '#334155' : '#cbd5e1'
  const patternSize = DOT_GAP * transform.k
  const patternX = ((transform.x % patternSize) + patternSize) % patternSize
  const patternY = ((transform.y % patternSize) + patternSize) % patternSize

  return (
    <div className="bubbles-container" ref={containerRef}>
      <svg ref={svgRef} className="bubbles-svg" onWheel={handleWheel}>
        <defs>
          <pattern
            id="bubbles-dots"
            x={patternX}
            y={patternY}
            width={patternSize}
            height={patternSize}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={transform.k / 2} cy={transform.k / 2} r={transform.k / 2} fill={dotColor} />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#bubbles-dots)"
          onMouseDown={handleBgMouseDown}
          onClick={handleBgClick}
        />
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {filtered.edges.map((e) => {
            const style = edgeStyles.get(e.id) ?? { stroke: '#64748b', dashed: false }
            return (
              <line
                key={e.id}
                ref={(el) => {
                  if (el) edgeRefs.current.set(e.id, el)
                  else edgeRefs.current.delete(e.id)
                }}
                className="bubble-edge"
                stroke={style.stroke}
                strokeWidth={1.5}
                strokeDasharray={style.dashed ? '6 3' : undefined}
              />
            )
          })}
          {filtered.nodes.map((n) => {
            const color = KIND_COLORS[n.kind]
            const abbr = KIND_SHORT_LABELS[n.kind]
            const isSelected = selectedNodeId === n.id
            return (
              <g
                key={n.id}
                ref={(el) => {
                  if (el) nodeRefs.current.set(n.id, el)
                  else nodeRefs.current.delete(n.id)
                }}
                className={`bubble${isSelected ? ' bubble--selected' : ''}`}
                onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
              >
                <circle
                  className="bubble__circle"
                  r={RADIUS}
                  fill="var(--bg-surface)"
                  stroke={color}
                />
                <text className="bubble__abbr">{abbr}</text>
                <text className="bubble__name" y={RADIUS + 14}>
                  {n.name}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
      {selectedNode && <NodeDetailPanel node={selectedNode} />}

      <div className="bubbles-controls">
        <button className="bubbles-controls__btn" onClick={handleZoomIn} title="Zoom in">
          <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor">
            <path d="M5 0h2v5h5v2H7v5H5V7H0V5h5z"/>
          </svg>
        </button>
        <button className="bubbles-controls__btn" onClick={handleZoomOut} title="Zoom out">
          <svg viewBox="0 0 12 2" width="12" height="2" fill="currentColor">
            <rect width="12" height="2"/>
          </svg>
        </button>
        <button className="bubbles-controls__btn" onClick={handleFitView} title="Fit view">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
            <path d="M1 1h5v2H3v3H1V1zm9 0h5v5h-2V3h-3V1zM1 10h2v3h3v2H1v-5zm12 3h-3v2h5v-5h-2v3z"/>
          </svg>
        </button>
      </div>

      <div className="bubbles-minimap">
        <svg width={MINIMAP_W} height={MINIMAP_H}>
          {filtered.nodes.map((n) => (
            <circle
              key={n.id}
              ref={(el) => {
                if (el) minimapNodeRefs.current.set(n.id, el)
                else minimapNodeRefs.current.delete(n.id)
              }}
              r={4}
              fill={KIND_COLORS[n.kind]}
              opacity={0.85}
            />
          ))}
          {(() => {
            const { scale: mms, offsetX: mmox, offsetY: mmoy } = minimapBoundsRef.current
            const rect = containerRef.current?.getBoundingClientRect()
            const W = rect?.width ?? 800
            const H = rect?.height ?? 600
            const vpX = (-transform.x / transform.k + mmox) * mms
            const vpY = (-transform.y / transform.k + mmoy) * mms
            const vpW = (W / transform.k) * mms
            const vpH = (H / transform.k) * mms
            const maskColor = theme === 'dark' ? 'rgba(15,23,42,0.7)' : 'rgba(187,187,187,0.7)'
            return (
              <>
                <defs>
                  <mask id="bubbles-minimap-mask">
                    <rect width={MINIMAP_W} height={MINIMAP_H} fill="white" />
                    <rect x={vpX} y={vpY} width={vpW} height={vpH} fill="black" />
                  </mask>
                </defs>
                <rect
                  width={MINIMAP_W}
                  height={MINIMAP_H}
                  fill={maskColor}
                  mask="url(#bubbles-minimap-mask)"
                />
              </>
            )
          })()}
        </svg>
      </div>
    </div>
  )
}
