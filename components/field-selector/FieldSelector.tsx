"use client";

import { useState } from "react";

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

  function toggle(path: string) {
    onChange(
      selected.includes(path)
        ? selected.filter((p) => p !== path)
        : [...selected, path]
    );
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


  function renderNode(node: FieldNode, depth = 0) {
    const isLeaf = !node.children;
    const isCollapsed = collapsed[node.path];

    const { checked, indeterminate } = getNodeState(node);

    return (
      <div key={node.path} style={{ paddingLeft: depth * 12 }}>
        <div className="flex items-center gap-2 text-sm">
          {/* Expand / collapse */}
          {!isLeaf && (
            <button
              type="button"
              onClick={() => toggleCollapse(node.path)}
              className="text-xs w-4 text-muted hover:text-foreground"
            >
              {isCollapsed ? "▶" : "▼"}
            </button>
          )}

          {/* Checkbox (parent + leaf) */}
          <input
            type="checkbox"
            checked={checked}
            ref={(el) => {
              if (el) el.indeterminate = indeterminate;
            }}
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
            className={`font-mono text-xs ${!isLeaf ? "font-semibold text-foreground" : ""
              }`}
          >
            {node.path.split(".").pop()}
          </span>

          {/* Sample value */}
          {isLeaf && node.sample !== undefined && (
            <span className="text-xs text-muted truncate">
              = {String(node.sample)}
            </span>
          )}
        </div>

        {/* Children */}
        {!isLeaf && !isCollapsed &&
          node.children!.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  }

  return (
    <div className="max-h-56 overflow-auto rounded-md border border-border p-2 space-y-1">
      {tree.map((n) => renderNode(n))}
    </div>
  );
}
