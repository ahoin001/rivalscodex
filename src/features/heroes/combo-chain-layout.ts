import type { ComboStep } from "@/data/schema";

export type ComboChainLinearSegment = {
  type: "linear";
  indices: number[];
};

export type ComboChainForkSegment = {
  type: "fork";
  /** Step index the branch options diverge from (shared prefix ends here). */
  anchorIndex: number;
  /** Parallel options after the shared setup. */
  branchIndices: number[];
};

export type ComboChainSegment = ComboChainLinearSegment | ComboChainForkSegment;

function range(start: number, endExclusive: number): number[] {
  return Array.from({ length: endExclusive - start }, (_, i) => start + i);
}

/**
 * Groups steps so `or`-modifier branches render as a visual fork instead of a
 * flat left-to-right chain.
 *
 * Authoring pattern for `E → LMB×3 or Q`:
 * 1. E  2. LMB×3  3. Q (modifier: Or)
 */
export function buildComboChainSegments(steps: ComboStep[]): ComboChainSegment[] {
  const segments: ComboChainSegment[] = [];
  let cursor = 0;

  while (cursor < steps.length) {
    let forkAt = -1;
    for (let j = cursor + 1; j < steps.length; j++) {
      if (steps[j].modifier === "or") {
        forkAt = j;
        break;
      }
    }

    if (forkAt === -1) {
      segments.push({ type: "linear", indices: range(cursor, steps.length) });
      break;
    }

    if (forkAt === cursor + 1) {
      segments.push({ type: "linear", indices: [cursor] });
      segments.push({
        type: "fork",
        anchorIndex: cursor,
        branchIndices: [forkAt],
      });
      cursor = forkAt + 1;
      continue;
    }

    const anchorIndex = forkAt - 2;
    segments.push({
      type: "linear",
      indices: range(cursor, anchorIndex + 1),
    });

    const branchIndices: number[] = [forkAt - 1];
    let branchCursor = forkAt;
    while (
      branchCursor < steps.length &&
      steps[branchCursor].modifier === "or"
    ) {
      if (branchCursor !== forkAt - 1) {
        branchIndices.push(branchCursor);
      }
      branchCursor += 1;
    }
    if (!branchIndices.includes(forkAt)) {
      branchIndices.push(forkAt);
    }

    segments.push({
      type: "fork",
      anchorIndex,
      branchIndices,
    });

    cursor = branchCursor;
  }

  return segments;
}
