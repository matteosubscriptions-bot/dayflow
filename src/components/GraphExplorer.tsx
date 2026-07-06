"use client";

// Grafo delle connessioni: force-directed in SVG puro (drag, pan, zoom).
// Con un progetto selezionato diventa una mindmap radiale centrata sul
// nodo-progetto, con le sue note attorno e i collegamenti di similarità.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface GraphNode {
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
}

interface GraphLink {
  source: string;
  target: string;
  score: number;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
  isCenter?: boolean;
}

interface Props {
  projects: { id: string; name: string }[];
}

const W = 900;
const H = 640;

export function GraphExplorer({ projects }: Props) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>("");
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const rafRef = useRef(0);
  const dragRef = useRef<{ id: string | null; panStart?: { x: number; y: number; px: number; py: number } }>({ id: null });
  const svgRef = useRef<SVGSVGElement>(null);
  const [, forceRender] = useState(0);

  const mindmap = Boolean(projectId);
  const centerId = `project:${projectId}`;

  // Carica i dati del grafo (tutte le note o quelle del progetto).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/graph${projectId ? `?projectId=${projectId}` : ""}`)
      .then((r) => r.json())
      .then((data: { nodes: GraphNode[]; links: GraphLink[] }) => {
        if (cancelled) return;
        const project = projects.find((p) => p.id === projectId);
        const simNodes: SimNode[] = data.nodes.map((n, i) => {
          const angle = (i / Math.max(data.nodes.length, 1)) * Math.PI * 2;
          const radius = mindmap ? 190 : 150 + (i % 5) * 45;
          return {
            ...n,
            x: W / 2 + Math.cos(angle) * radius,
            y: H / 2 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
          };
        });
        let simLinks = data.links;
        if (mindmap && project) {
          // Nodo centrale = il progetto; raggi verso ogni nota.
          simNodes.unshift({
            id: centerId,
            title: project.name,
            projectId,
            projectName: project.name,
            x: W / 2,
            y: H / 2,
            vx: 0,
            vy: 0,
            fixed: true,
            isCenter: true,
          });
          simLinks = [
            ...data.nodes.map((n) => ({ source: centerId, target: n.id, score: 0.5 })),
            ...data.links,
          ];
        }
        nodesRef.current = simNodes;
        linksRef.current = simLinks;
        setNodes(simNodes);
        setLinks(simLinks);
        setLoading(false);
        setPan({ x: 0, y: 0 });
        setZoom(1);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Simulazione force-directed con raffreddamento.
  useEffect(() => {
    if (nodes.length === 0) return;
    let alpha = 1;
    const byId = new Map(nodesRef.current.map((n) => [n.id, n]));

    function tick() {
      const ns = nodesRef.current;
      // Repulsione tra nodi.
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i];
          const b = ns[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist2 = Math.max(dx * dx + dy * dy, 64);
          const force = (mindmap ? 5200 : 4200) / dist2;
          const dist = Math.sqrt(dist2);
          dx /= dist;
          dy /= dist;
          a.vx -= dx * force * alpha;
          a.vy -= dy * force * alpha;
          b.vx += dx * force * alpha;
          b.vy += dy * force * alpha;
        }
      }
      // Molle sui collegamenti.
      for (const l of linksRef.current) {
        const a = byId.get(l.source);
        const b = byId.get(l.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const target = a.isCenter || b.isCenter ? 200 : 140;
        const force = ((dist - target) / dist) * 0.04;
        a.vx += dx * force * alpha * 2;
        a.vy += dy * force * alpha * 2;
        b.vx -= dx * force * alpha * 2;
        b.vy -= dy * force * alpha * 2;
      }
      // Attrazione verso il centro + integrazione.
      for (const n of ns) {
        if (n.fixed) {
          n.x = W / 2;
          n.y = H / 2;
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += (W / 2 - n.x) * 0.0035 * alpha;
        n.vy += (H / 2 - n.y) * 0.0035 * alpha;
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
      }
      alpha *= 0.985;
      forceRender((v) => v + 1);
      if (alpha > 0.02) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links]);

  // Coordinate SVG dal puntatore (tiene conto di pan e zoom).
  const toGraph = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;
      return { x: (x - pan.x) / zoom, y: (y - pan.y) / zoom };
    },
    [pan, zoom],
  );

  function onPointerDown(e: React.PointerEvent, id?: string) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (id) {
      dragRef.current = { id };
    } else {
      dragRef.current = {
        id: null,
        panStart: { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y },
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (drag.id) {
      const p = toGraph(e.clientX, e.clientY);
      const node = nodesRef.current.find((n) => n.id === drag.id);
      if (node && !node.isCenter) {
        node.x = p.x;
        node.y = p.y;
        node.vx = 0;
        node.vy = 0;
        forceRender((v) => v + 1);
      }
    } else if (drag.panStart) {
      const rect = svgRef.current!.getBoundingClientRect();
      setPan({
        x: drag.panStart.px + ((e.clientX - drag.panStart.x) / rect.width) * W,
        y: drag.panStart.py + ((e.clientY - drag.panStart.y) / rect.height) * H,
      });
    }
  }

  function onPointerUp() {
    dragRef.current = { id: null };
  }

  const byId = new Map(nodesRef.current.map((n) => [n.id, n]));

  return (
    <div className="mt-8">
      {/* Selettore mindmap per progetto */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="label-muted">Vista:</span>
        <button
          onClick={() => setProjectId("")}
          className={`tag-chip ${!projectId ? "bg-ink !text-paper border-ink" : "hover:border-ink"}`}
        >
          Tutte le note
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setProjectId(p.id)}
            className={`tag-chip ${projectId === p.id ? "bg-ink !text-paper border-ink" : "hover:border-ink"}`}
          >
            ◈ {p.name}
          </button>
        ))}
      </div>

      <div className="framed relative mt-4 overflow-hidden p-0">
        {loading ? (
          <p className="p-10 italic text-muted">Carico il grafo…</p>
        ) : nodes.length === 0 ? (
          <p className="p-10 italic text-muted">
            {mindmap
              ? "Questo progetto non ha ancora note."
              : "Ancora nessuna nota da collegare."}
          </p>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-[70vh] w-full cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={(e) => onPointerDown(e)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onWheel={(e) => {
              setZoom((z) => Math.min(3, Math.max(0.4, z * (e.deltaY < 0 ? 1.08 : 0.92))));
            }}
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              {linksRef.current.map((l, i) => {
                const a = byId.get(l.source);
                const b = byId.get(l.target);
                if (!a || !b) return null;
                const spoke = a.isCenter || b.isCenter;
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="currentColor"
                    strokeOpacity={spoke ? 0.18 : 0.2 + Math.min(l.score, 0.5)}
                    strokeWidth={spoke ? 1 : 1 + l.score * 3}
                    strokeDasharray={spoke ? "4 4" : undefined}
                  />
                );
              })}
              {nodesRef.current.map((n) => (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  className={n.isCenter ? "" : "cursor-pointer"}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPointerDown(e, n.id);
                  }}
                  onClick={() => {
                    if (!n.isCenter) router.push(`/note/${n.id}`);
                  }}
                >
                  {n.isCenter ? (
                    <>
                      <circle r={34} className="fill-teal" opacity={0.95} />
                      <text
                        y={54}
                        textAnchor="middle"
                        className="fill-ink font-display italic"
                        fontSize={17}
                      >
                        {n.title}
                      </text>
                    </>
                  ) : (
                    <>
                      <circle r={16} className="fill-teal" opacity={0.75} />
                      <text
                        y={34}
                        textAnchor="middle"
                        className="fill-ink"
                        fontSize={13}
                      >
                        {n.title.length > 32 ? `${n.title.slice(0, 32)}…` : n.title}
                      </text>
                    </>
                  )}
                </g>
              ))}
            </g>
          </svg>
        )}

        {/* Controlli zoom */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
            className="px-2 text-lg"
            aria-label="Riduci"
          >
            −
          </button>
          <span className="font-mono text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z * 1.18))}
            className="px-2 text-lg"
            aria-label="Ingrandisci"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
