/*
  graph-data.js — PLACEHOLDER DATA

  This is fake demo data shaped like an Obsidian vault export, so the graph
  page works today. Swap it for your real vault structure — see the
  instructions in graph.html for the two easy ways to do that.

  Expected shape:
  {
    nodes: [{ id: "Note Title", group: "cluster-name" }, ...],
    links: [{ source: "Note A", target: "Note B" }, ...]
  }
*/
const GRAPH_DATA = {
  nodes: [
    { id: "Cellular Automata", group: "sims" },
    { id: "Conway's Game of Life", group: "sims" },
    { id: "Neuron Simulation", group: "sims" },
    { id: "Spiking Networks", group: "sims" },
    { id: "Particle Physics", group: "sims" },
    { id: "Emergence", group: "concepts" },
    { id: "Complex Systems", group: "concepts" },
    { id: "Differential Equations", group: "concepts" },
    { id: "Rule 30", group: "concepts" },
    { id: "Obsidian Setup", group: "meta" },
    { id: "Portfolio Site", group: "meta" },
    { id: "Reading List", group: "meta" },
    { id: "JavaScript Canvas", group: "tools" },
    { id: "D3.js", group: "tools" },
    { id: "Python Notebooks", group: "tools" },
  ],
  links: [
    { source: "Cellular Automata", target: "Emergence" },
    { source: "Cellular Automata", target: "Conway's Game of Life" },
    { source: "Cellular Automata", target: "Rule 30" },
    { source: "Conway's Game of Life", target: "Complex Systems" },
    { source: "Neuron Simulation", target: "Spiking Networks" },
    { source: "Neuron Simulation", target: "Differential Equations" },
    { source: "Spiking Networks", target: "Complex Systems" },
    { source: "Particle Physics", target: "Differential Equations" },
    { source: "Emergence", target: "Complex Systems" },
    { source: "Complex Systems", target: "Reading List" },
    { source: "Portfolio Site", target: "JavaScript Canvas" },
    { source: "Portfolio Site", target: "D3.js" },
    { source: "Portfolio Site", target: "Obsidian Setup" },
    { source: "Obsidian Setup", target: "Reading List" },
    { source: "Neuron Simulation", target: "Python Notebooks" },
    { source: "Cellular Automata", target: "JavaScript Canvas" },
  ],
};
