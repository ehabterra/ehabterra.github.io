---
title: "The algorithms behind the prune"
permalink: /pruning-algorithms/
layout: single
author_profile: true
toc: true
toc_label: "Algorithms"
toc_sticky: true
excerpt: >-
  A paragraph each on every algorithm and idea named in "Pruning: Prove It Can't
  Matter, Then Skip It" — what it is, and where it shows up in that post.
---

[Pruning: Prove It Can't Matter, Then Skip It](/barren-subtree-pruning) leans on a dozen ideas without stopping to explain any of them. This page is the short version of each: what it is, and the one line about where it appears in that post. Nothing here is apispec-specific — it's the standard material, gathered so the post can move.

## Graph shapes

**Directed acyclic graph (DAG).** A directed graph with no path from a node back to itself. It matters because [memoisation](#caching-answers) is sound over a DAG and nowhere else: every subproblem finishes before anything asks for its answer, so a cached result is final. A call graph is not a DAG.

**Cycle.** A path that returns where it started — `weigh → normalize → trim → classify → score → weigh` in the post's fixture. A cycle means the answer for `x` depends on the answer for `y`, which depends on `x` again, so a naive recursion has no base case unless you supply one. Supplying one is easy; supplying one that isn't *wrong* is the bug the post spends a section on.

**Strongly connected component (SCC).** A maximal set of nodes in which every node reaches every other. Collapse each SCC to a single node and any directed graph becomes a DAG — the *condensation* — which restores memoisation. This is the standard fix for that bug, and the one the post avoided by running its analysis backwards instead.

**[Tarjan's algorithm](https://en.wikipedia.org/wiki/Tarjan%27s_strongly_connected_components_algorithm).** Finds every SCC in a single depth-first pass, in O(V+E), by tracking for each node its discovery index and the lowest index reachable from its subtree. Tarjan, ["Depth-first search and linear graph algorithms"](https://doi.org/10.1137/0201010), SIAM J. Computing 1972.

## Caching answers

**[Memoization](https://en.wikipedia.org/wiki/Memoization).** Cache a function's result per argument so a repeated call is free. Sound exactly when a cached answer can never change afterwards — which is what a cycle breaks: the in-progress guard returns "no", and memoising that "no" makes a temporary answer permanent.

**[Hash consing](https://en.wikipedia.org/wiki/Hash_consing).** Keep one canonical copy of each distinct value, so structurally equal things become physically identical and can be compared and cached by identity. The post's central move is the same idea applied to a *question* rather than a value: ask "can this reach a match?" once per distinct call instead of once per copy of it, which on one service is 12,882 questions instead of 7.1 million.

## Fixpoints and dataflow

**Worklist algorithm.** Hold a queue of items whose answer might still change. Pop one, update it, push anything that depends on it, and stop when the queue empties. Kildall, ["A Unified Approach to Global Program Optimization"](https://doi.org/10.1145/512927.512945) (POPL 1973), put program analysis on this footing; both passes of the post's `computeReach` are worklists.

**[Least fixed point](https://en.wikipedia.org/wiki/Least_fixed_point).** The smallest solution to `X = f(X)`. Reachability is one: the smallest set that contains the seeds and is closed under "a parent of a member is a member". [Knaster–Tarski](https://en.wikipedia.org/wiki/Knaster%E2%80%93Tarski_theorem) guarantees that solution exists and that iterating up from the empty set reaches it — which is why a worklist that only ever *adds* terminates, and terminates on the right answer.

**[Data-flow analysis](https://en.wikipedia.org/wiki/Data-flow_analysis).** Computing a fact about every point in a program by propagating it along the graph until nothing changes. Forward analyses push facts from causes to effects (what values can reach here?); backward analyses pull them from effects to causes (what here can reach the thing I care about?). The prune is the backward kind. Chapter 9 of the [Dragon Book](https://en.wikipedia.org/wiki/Compilers:_Principles,_Techniques,_and_Tools) is the standard treatment.

**[Live-variable analysis](https://en.wikipedia.org/wiki/Live-variable_analysis).** The textbook backward analysis: a variable is *live* at a point if some path from there reads it before overwriting it. Structurally it is the post's predicate with the nouns changed — "can reach a use" versus "can reach a match" — and recognising that is what made the backwards formulation trustworthy rather than merely clever.

## Reachability as a keep-rule

**[Tracing garbage collection](https://en.wikipedia.org/wiki/Tracing_garbage_collection), mark phase.** Start at the roots, follow every reference, mark everything you touch; whatever is unmarked is unreachable and can be freed. The prune computes the same transitive closure in the opposite direction — seed from the matches, keep every caller — so nothing a kept node can reach is ever dropped. The reference is Jones, Hosking & Moss, [*The Garbage Collection Handbook*](https://gchandbook.org).

**[Program slicing](https://en.wikipedia.org/wiki/Program_slicing).** Reduce a program to only the statements that can affect a chosen value, discarding the rest. The prune is a coarse slice: keep only what can affect the generated spec. Weiser, ["Program Slicing"](https://doi.org/10.1109/TSE.1984.5010248), ICSE 1981 / TSE 1984.

## Call graphs

**CHA → RTA → VTA.** A ladder of increasing precision for the question "which method does this interface call actually invoke?" [CHA](https://doi.org/10.1007/3-540-49538-X_5) (Dean, Grove & Chambers, ECOOP 1995) uses the class hierarchy alone. [RTA](https://doi.org/10.1145/236337.236371) (Bacon & Sweeney, OOPSLA 1996) narrows it to types the program actually instantiates. [VTA](https://doi.org/10.1145/353171.353189) (Sundaresan et al., OOPSLA 2000) propagates types through assignments. Each rung costs more analysis than the one below; [Tip & Palsberg](https://doi.org/10.1145/353171.353190) compare them end to end. The post's abandoned detour is the VTA rung.

**[SSA form](https://en.wikipedia.org/wiki/Static_single-assignment_form).** Static single assignment: every variable is written exactly once, so every use has one unambiguous definition. It is the representation the precise call-graph builders are written against — in Go, [`golang.org/x/tools/go/callgraph`](https://pkg.go.dev/golang.org/x/tools/go/callgraph) on top of `go/ssa`. Cytron et al., [TOPLAS 1991](https://doi.org/10.1145/115372.115320).

**Syntactic call graph.** The cheap alternative the post's tool uses: record what the source text writes, so a call through an interface is attributed to the interface rather than to whichever method will run. Imprecise in a known direction, and fast.

## The runtime side

**[Green Tea](https://go.dev/blog/greenteagc).** Go 1.26's garbage collector, on by default. It marks and scans small objects in contiguous 8 KiB spans rather than one object at a time, which turns scattered pointer-chasing into sequential work; the release notes expect 10–40% off GC overhead for GC-heavy programs. It makes marking a live object cheaper — it cannot make a live object dead.

**Size classes.** Go's allocator rounds every allocation up to one of a fixed set of sizes, so a 72-byte and an 80-byte struct land in different classes and cost differently per object. [Go 1.27](https://go.dev/doc/go1.27) added a specialized path for objects under 80 bytes. This is why shaving a few bytes off a struct can pay out in steps rather than smoothly.

**GOGC.** The knob setting how much the heap may grow between collections. Raising it trades memory for fewer collections — which does nothing when the heap is *live* rather than garbage, since there was never anything to collect.

## Being honest about approximation

**Over-approximation.** An analysis that deliberately includes too much rather than risk excluding something real. The prune is over-approximate by construction: the stand-in node it feeds a matcher withholds ancestry, and withholding information can only make a matcher accept fewer calls, which can only make the prune keep more. Naming the direction an approximation errs in is the whole of its safety argument.

**Soundiness.** The observation that every practical static analyser is unsound *somewhere* — reflection, dynamic loading, `unsafe` — and that the sin is not the unsoundness but failing to document it. [In Defense of Soundiness: A Manifesto](https://soundiness.org), Livshits et al., CACM 2015.
