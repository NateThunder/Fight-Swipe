import type { Node } from "../FlowStore"

export type Direction = "left" | "right" | "up" | "down"
export type BranchKey = "leftBranches" | "rightBranches" | "upBranches" | "downBranches"

export function neighborKey(dir: Direction): keyof Node {
  switch (dir) {
    case "left":
      return "left"
    case "right":
      return "right"
    case "up":
      return "up"
    case "down":
      return "down"
  }
}

export function opposite(dir: Direction): Direction {
  switch (dir) {
    case "left":
      return "right"
    case "right":
      return "left"
    case "up":
      return "down"
    case "down":
      return "up"
  }
}

export function branchListKey(dir: Direction): BranchKey {
  switch (dir) {
    case "left":
      return "leftBranches"
    case "right":
      return "rightBranches"
    case "up":
      return "upBranches"
    case "down":
      return "downBranches"
  }
}

export function getBranchList(node: Node | undefined, dir: Direction): string[] {
  if (!node) return []
  const list = node[branchListKey(dir)] ?? []
  if (list.length > 0) return list
  const single = node[neighborKey(dir)]
  return single ? [single as string] : []
}

export function collectDescendants(startId: string, graph: Record<string, Node>): Set<string> {
  const toRemove = new Set<string>()
  const stack = [startId]

  while (stack.length) {
    const id = stack.pop()!
    if (toRemove.has(id)) continue
    toRemove.add(id)
    const n = graph[id]
    if (!n) continue

    ;(["left", "right", "up", "down"] as Direction[]).forEach((dir) => {
      const primary = n[dir]
      if (typeof primary === "string") stack.push(primary)
      const branches = n[branchListKey(dir)]
      if (branches?.length) branches.forEach((b) => stack.push(b))
    })
  }

  return toRemove
}
