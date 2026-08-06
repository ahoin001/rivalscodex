<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:graphify-agent-rules -->
# Graphify is the codebase map

For broad questions about architecture, ownership, dependencies, callers, data flow, or affected areas, query `graphify-out/graph.json` before scanning the repository:

- `graphify query "<question>"` for broad context.
- `graphify path "<source>" "<target>"` for a dependency path.
- `graphify explain "<node>"` for a node and its immediate relationships.
- `graphify affected "<node>"` for reverse-impact analysis.

Treat Graphify as a navigation index, not a substitute for source verification. Read the referenced source files before making exact implementation claims or edits. If the graph is absent, rebuild it with the Graphify skill. After meaningful code changes, run `graphify update .`; after documentation or design-reference changes, run the full Graphify skill update so semantic relationships remain current. Do not start `graphify watch` unless the user explicitly requests a persistent watcher.
<!-- END:graphify-agent-rules -->
