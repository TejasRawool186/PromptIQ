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
  prompts?: any[];
}

const NODE_COLORS: Record<string, string> = {
  developer: "#8B5CF6",
  skill: "#06b6d4",
  prompt: "#10B981",
  project: "#F59E0B",
  model: "#F43F5E",
  category: "#EC4899",
};

export function MemoryGraph({ width = 800, height = 500, prompts = [] }: MemoryGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!prompts || prompts.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodeMap = new Map<string, Omit<GraphNode, "x" | "y">>();
    const edgeList: GraphEdge[] = [];

    prompts.forEach((p) => {
      const userLabel = p.user_id ? p.user_id.slice(0, 8).toUpperCase() : "DEV";
      const userId = p.user_id || "default_user";
      const promptId = p.id;
      const promptLabel = p.prompt_text.length > 18 ? p.prompt_text.slice(0, 15) + "..." : p.prompt_text;
      const skillId = p.skill_domain || "unknown_skill";
      const modelId = p.model_used || "unknown_model";
      const categoryId = p.category || "unknown_category";

      // Add developer node
      if (!nodeMap.has(userId)) {
        nodeMap.set(userId, { id: userId, label: userLabel, type: "developer", size: 24 });
      }
      // Add prompt node
      nodeMap.set(promptId, { id: promptId, label: promptLabel, type: "prompt", size: 13 });
      
      // Add skill domain node
      if (!nodeMap.has(skillId)) {
        nodeMap.set(skillId, { id: skillId, label: skillId.toUpperCase(), type: "skill", size: 18 });
      }
      // Add model node
      if (!nodeMap.has(modelId)) {
        nodeMap.set(modelId, { id: modelId, label: modelId, type: "model", size: 16 });
      }
      // Add category node
      if (!nodeMap.has(categoryId)) {
        nodeMap.set(categoryId, { id: categoryId, label: categoryId.replace(/_/g, " ").toUpperCase(), type: "category", size: 15 });
      }

      // Add relationships/edges
      edgeList.push({ source: userId, target: promptId, label: "submitted" });
      edgeList.push({ source: promptId, target: skillId, label: "requires_skill" });
      edgeList.push({ source: promptId, target: modelId, label: "used_model" });
      edgeList.push({ source: promptId, target: categoryId, label: "categorized_as" });
    });

    const nodeList = Array.from(nodeMap.values());
    const cx = width / 2;
    const cy = height / 2;

    const positionedNodes = nodeList.map((n, i) => {
      const angle = (i / nodeList.length) * 2 * Math.PI;
      let radius: number;

      switch (n.type) {
        case "developer":
          radius = 60;
          break;
        case "skill":
          radius = 130;
          break;
        case "prompt":
          radius = 210;
          break;
        case "model":
          radius = 160;
          break;
        case "category":
          radius = 125;
          break;
        default:
          radius = 150;
      }

      const offsetX = Math.sin(i * 2.7) * 25;
      const offsetY = Math.cos(i * 1.9) * 20;

      return {
        ...n,
        x: cx + Math.cos(angle) * radius + offsetX,
        y: cy + Math.sin(angle) * radius + offsetY,
      } as GraphNode;
    });

    return { nodes: positionedNodes, edges: edgeList };
  }, [prompts, width, height]);

  const nodeMap = useMemo(() => {
    const map: Record<string, GraphNode> = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    connected.add(hoveredNode);
    edges.forEach((e) => {
      if (e.source === hoveredNode) connected.add(e.target);
      if (e.target === hoveredNode) connected.add(e.source);
    });
    return connected;
  }, [hoveredNode, edges]);

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center text-xs text-[var(--text-muted)]">
        Knowledge graph is empty. Log prompts to see semantic links build dynamically.
      </div>
    );
  }

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
        {edges.map((edge, i) => {
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
        {edges.slice(0, 8).map((edge, i) => {
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
