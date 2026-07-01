"use client";

import React, { useMemo, useEffect, useState } from "react";

interface GraphNode {
  id: string;
  label: string;
  type: "developer" | "skill" | "prompt" | "project" | "model" | "category";
  x: number;
  y: number;
  size: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

interface MemoryGraphProps {
  width?: number;
  height?: number;
}

const NODE_COLORS: Record<string, string> = {
  developer: "#8B5CF6",
  skill: "#ef4444",
  prompt: "#10B981",
  project: "#F59E0B",
  model: "#F43F5E",
  category: "#EC4899",
};

const MOCK_NODES: Omit<GraphNode, "x" | "y">[] = [
  { id: "dev1", label: "Alice Chen", type: "developer", size: 28 },
  { id: "dev2", label: "Bob Kumar", type: "developer", size: 24 },
  { id: "sk1", label: "React", type: "skill", size: 18 },
  { id: "sk2", label: "Python", type: "skill", size: 20 },
  { id: "sk3", label: "SQL", type: "skill", size: 16 },
  { id: "sk4", label: "Docker", type: "skill", size: 14 },
  { id: "sk5", label: "TypeScript", type: "skill", size: 17 },
  { id: "sk6", label: "AWS", type: "skill", size: 15 },
  { id: "p1", label: "Debug useState", type: "prompt", size: 12 },
  { id: "p2", label: "SQL Query Opt", type: "prompt", size: 11 },
  { id: "p3", label: "Docker Config", type: "prompt", size: 10 },
  { id: "p4", label: "API Design", type: "prompt", size: 13 },
  { id: "p5", label: "Unit Tests", type: "prompt", size: 11 },
  { id: "p6", label: "CI/CD Pipeline", type: "prompt", size: 12 },
  { id: "pr1", label: "PromptIQ", type: "project", size: 22 },
  { id: "pr2", label: "DataPipeline", type: "project", size: 18 },
  { id: "m1", label: "GPT-4o", type: "model", size: 16 },
  { id: "m2", label: "Claude Opus", type: "model", size: 16 },
  { id: "m3", label: "Gemini Flash", type: "model", size: 14 },
  { id: "c1", label: "Debugging", type: "category", size: 15 },
  { id: "c2", label: "Code Gen", type: "category", size: 15 },
  { id: "c3", label: "DevOps", type: "category", size: 14 },
];

const MOCK_EDGES: GraphEdge[] = [
  { source: "dev1", target: "sk1", label: "has_skill" },
  { source: "dev1", target: "sk2", label: "has_skill" },
  { source: "dev1", target: "sk5", label: "has_skill" },
  { source: "dev2", target: "sk2", label: "has_skill" },
  { source: "dev2", target: "sk3", label: "has_skill" },
  { source: "dev2", target: "sk4", label: "has_skill" },
  { source: "dev2", target: "sk6", label: "has_skill" },
  { source: "dev1", target: "p1", label: "submitted" },
  { source: "dev1", target: "p4", label: "submitted" },
  { source: "dev1", target: "p5", label: "submitted" },
  { source: "dev2", target: "p2", label: "submitted" },
  { source: "dev2", target: "p3", label: "submitted" },
  { source: "dev2", target: "p6", label: "submitted" },
  { source: "p1", target: "c1", label: "categorized_as" },
  { source: "p4", target: "c2", label: "categorized_as" },
  { source: "p3", target: "c3", label: "categorized_as" },
  { source: "p5", target: "c2", label: "categorized_as" },
  { source: "p6", target: "c3", label: "categorized_as" },
  { source: "p2", target: "c1", label: "categorized_as" },
  { source: "p1", target: "m1", label: "used_model" },
  { source: "p2", target: "m2", label: "used_model" },
  { source: "p3", target: "m3", label: "used_model" },
  { source: "p4", target: "m2", label: "used_model" },
  { source: "p5", target: "m1", label: "used_model" },
  { source: "p6", target: "m3", label: "used_model" },
  { source: "dev1", target: "pr1", label: "works_on" },
  { source: "dev2", target: "pr1", label: "works_on" },
  { source: "dev2", target: "pr2", label: "works_on" },
  { source: "sk1", target: "sk5", label: "related_to" },
  { source: "p1", target: "p4", label: "similar_to" },
];

export function MemoryGraph({ width = 800, height = 500 }: MemoryGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const nodes = useMemo<GraphNode[]>(() => {
    const cx = width / 2;
    const cy = height / 2;

    // Position nodes in organic clusters
    return MOCK_NODES.map((n, i) => {
      const angle = (i / MOCK_NODES.length) * 2 * Math.PI;
      let radius: number;

      switch (n.type) {
        case "developer":
          radius = 60;
          break;
        case "skill":
          radius = 150;
          break;
        case "prompt":
          radius = 200;
          break;
        case "project":
          radius = 100;
          break;
        case "model":
          radius = 170;
          break;
        case "category":
          radius = 140;
          break;
        default:
          radius = 160;
      }

      // Add some organic offsets
      const offsetX = Math.sin(i * 2.7) * 30;
      const offsetY = Math.cos(i * 1.9) * 25;

      return {
        ...n,
        x: cx + Math.cos(angle) * radius + offsetX,
        y: cy + Math.sin(angle) * radius + offsetY,
      };
    });
  }, [width, height]);

  const nodeMap = useMemo(() => {
    const map: Record<string, GraphNode> = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    MOCK_EDGES.forEach((e) => {
      if (e.source === hoveredNode) connected.add(e.target);
      if (e.target === hoveredNode) connected.add(e.source);
    });
    return connected;
  }, [hoveredNode]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height }}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[rgba(5,2,10,0.8)]" />
      <div
        className="absolute w-96 h-96 rounded-full blur-[120px] opacity-20"
        style={{
          background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          left: "30%",
          top: "20%",
          transform: `translate(${Math.sin(animationPhase * 0.01) * 15}px, ${Math.cos(animationPhase * 0.01) * 10}px)`,
        }}
      />
      <div
        className="absolute w-72 h-72 rounded-full blur-[100px] opacity-15"
        style={{
          background: "radial-gradient(circle, #ef4444 0%, transparent 70%)",
          right: "20%",
          bottom: "20%",
          transform: `translate(${Math.cos(animationPhase * 0.008) * 12}px, ${Math.sin(animationPhase * 0.008) * 8}px)`,
        }}
      />

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="relative z-10"
      >
        {/* Edges */}
        {MOCK_EDGES.map((edge, i) => {
          const source = nodeMap[edge.source];
          const target = nodeMap[edge.target];
          if (!source || !target) return null;

          const isHighlighted =
            hoveredNode && (connectedNodes.has(edge.source) && connectedNodes.has(edge.target));
          const isDimmed = hoveredNode && !isHighlighted;

          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={
                isHighlighted
                  ? "rgba(139,92,246,0.5)"
                  : "rgba(139,92,246,0.1)"
              }
              strokeWidth={isHighlighted ? 2 : 1}
              opacity={isDimmed ? 0.3 : 1}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Animated particles along edges */}
        {MOCK_EDGES.slice(0, 8).map((edge, i) => {
          const source = nodeMap[edge.source];
          const target = nodeMap[edge.target];
          if (!source || !target) return null;

          const t = ((animationPhase + i * 45) % 360) / 360;
          const px = source.x + (target.x - source.x) * t;
          const py = source.y + (target.y - source.y) * t;

          return (
            <circle
              key={`particle-${i}`}
              cx={px}
              cy={py}
              r={2}
              fill="#8B5CF6"
              opacity={0.6}
            >
              <animate
                attributeName="opacity"
                values="0.2;0.8;0.2"
                dur={`${2 + i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const color = NODE_COLORS[node.type] || "#8B5CF6";
          const isHovered = hoveredNode === node.id;
          const isConnected = connectedNodes.has(node.id);
          const isDimmed = hoveredNode !== null && !isConnected;

          const floatX =
            Math.sin((animationPhase * 0.02 + parseInt(node.id.replace(/\D/g, "") || "0")) * 0.5) * 3;
          const floatY =
            Math.cos((animationPhase * 0.015 + parseInt(node.id.replace(/\D/g, "") || "0")) * 0.7) * 3;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x + floatX}, ${node.y + floatY})`}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer transition-all duration-300"
              opacity={isDimmed ? 0.3 : 1}
            >
              {/* Glow */}
              {(isHovered || isConnected) && (
                <circle
                  r={node.size + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.3}
                >
                  <animate
                    attributeName="r"
                    values={`${node.size + 4};${node.size + 12};${node.size + 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0.1;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Node circle */}
              <circle
                r={isHovered ? node.size + 3 : node.size}
                fill={`${color}20`}
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="transition-all duration-200"
                style={{
                  filter: isHovered
                    ? `drop-shadow(0 0 12px ${color}60)`
                    : `drop-shadow(0 0 4px ${color}30)`,
                }}
              />

              {/* Label */}
              <text
                textAnchor="middle"
                dy="0.35em"
                fill="white"
                fontSize={node.size > 20 ? 10 : 8}
                fontWeight={node.type === "developer" ? 600 : 400}
                className="pointer-events-none select-none"
              >
                {node.label}
              </text>

              {/* Type indicator below */}
              {isHovered && (
                <text
                  textAnchor="middle"
                  dy={node.size + 14}
                  fill={color}
                  fontSize={9}
                  fontWeight={500}
                  opacity={0.8}
                  className="pointer-events-none"
                >
                  {node.type.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div
            key={type}
            className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: color }}
            />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
