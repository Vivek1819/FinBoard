"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Check, Minus } from "lucide-react";

type FieldNode = {
  path: string;
  children?: FieldNode[];
  sample?: any;
};

type Props = {
  fields: { path: string }[];
  sample?: any;
  selected: string[];
  onChange: (next: string[]) => void;
  filter?: (path: string) => boolean;
};

function buildTree(paths: string[], sample: any): FieldNode[] {
  const root: any = {};

  for (const path of paths) {
    const parts = path.split(".");
    let curr = root;

    parts.forEach((part, idx) => {
      curr[part] ??= { __children: {}, __path: parts.slice(0, idx + 1).join(".") };
      curr = curr[part].__children;
    });
  }

  function toNodes(obj: any): FieldNode[] {
    return Object.values(obj).map((n: any) => {
      const value = n.__path
        .split(".")
        .reduce((acc: any, k: string) => acc?.[k], sample);

      const children = Object.keys(n.__children).length
        ? toNodes(n.__children)
        : undefined;

      return {
        path: n.__path,
        children,
        sample: children ? undefined : value,
      };
    });
  }

  return toNodes(root);
}

export default function FieldSelector({
  fields,
  sample,
  selected,
  onChange,
  filter,
}: Props) {
  const paths = fields
    .map((f) => f.path)
    .filter((p) => (filter ? filter(p) : true));

  const tree = buildTree(paths, sample);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleCollapse(path: string) {
    setCollapsed(prev => ({
      ...prev,
      [path]: !prev[path],
    }));
  }

  function collectLeafPaths(node: FieldNode): string[] {
    if (!node.children) return [node.path];
    return node.children.flatMap(collectLeafPaths);
  }

  function getNodeState(node: FieldNode) {
    const leaves = collectLeafPaths(node);
    const selectedCount = leaves.filter(p => selected.includes(p)).length;

    return {
      checked: selectedCount === leaves.length,
      indeterminate: selectedCount > 0 && selectedCount < leaves.length,
    };
  }

  // Custom checkbox component
  const CustomCheckbox = ({
    checked,
    indeterminate,
    onChange
  }: {
    checked: boolean;
    indeterminate: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked || indeterminate
        ? "bg-primary border-primary text-primary-foreground"
        : "border-border hover:border-primary/50 bg-background"
        }`}
    >
      {checked && <Check size={10} strokeWidth={3} />}
      {indeterminate && !checked && <Minus size={10} strokeWidth={3} />}
    </button>
  );

  function renderNode(node: FieldNode, depth = 0) {
    const isLeaf = !node.children;
    const isCollapsed = collapsed[node.path];
    const { checked, indeterminate } = getNodeState(node);
    const label = node.path.split(".").pop() ?? "";

    return (
      <div key={node.path}>
        <div
          className={`group flex items-center gap-2 py-1.5 px-2.5 rounded-lg transition-all cursor-pointer ${checked
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted/70 text-foreground/80 hover:text-foreground"
            }`}
          style={{ paddingLeft: depth * 16 + 10 }}
          onClick={() => {
            const paths = collectLeafPaths(node);
            onChange(
              checked
                ? selected.filter((p) => !paths.includes(p))
                : Array.from(new Set([...selected, ...paths]))
            );
          }}
        >
          {/* Expand / collapse button */}
          {!isLeaf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.path);
              }}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Spacer for leaves to align with parent checkboxes */}
          {isLeaf && <div className="w-4" />}

          {/* Checkbox */}
          <CustomCheckbox
            checked={checked}
            indeterminate={indeterminate}
            onChange={() => {
              const paths = collectLeafPaths(node);
              onChange(
                checked
                  ? selected.filter((p) => !paths.includes(p))
                  : Array.from(new Set([...selected, ...paths]))
              );
            }}
          />

          {/* Label */}
          <span
            className={`text-sm select-none truncate ${!isLeaf
              ? "font-semibold tracking-tight"
              : checked
                ? "font-medium"
                : ""
              }`}
          >
            {label.replace(/_/g, " ")}
          </span>

          {/* Sample value badge */}
          {isLeaf && node.sample !== undefined && (
            <span className="ml-auto text-[10px] text-muted-foreground/70 bg-background/50 border border-border/50 px-1.5 py-0.5 rounded-md truncate max-w-[100px] font-mono shadow-sm">
              {String(node.sample)}
            </span>
          )}
        </div>

        {/* Children */}
        {!isLeaf && !isCollapsed && (
          <div className="border-l border-border/40 ml-[25px] mt-0.5 mb-1 pl-1">
            {node.children!.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-h-60 overflow-auto rounded-xl border border-border/50 bg-muted/20 p-2 space-y-0.5 custom-scrollbar">
      {tree.map((n) => renderNode(n))}
    </div>
  );
}
