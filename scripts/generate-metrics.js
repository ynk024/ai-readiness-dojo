#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { basename, dirname } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const THRESHOLDS = {
  // CRITICAL (exit 1)
  CRITICAL_FAN_OUT: 20,
  CRITICAL_DEPTH: 8,
  CRITICAL_DENSITY: 0.3,
  CRITICAL_GOD_MODULE: 15,

  // WARNING (exit 0)
  HIGH_FAN_OUT: 10,
  HIGH_FAN_IN: 15,
  HIGH_DEPTH: 6,
  HIGH_DENSITY: 0.2,
};

// Files exempt from coupling checks (composition roots)
const EXEMPT_PATTERNS = [/di\/container\.(ts|js)$/, /^index\.(ts|js)$/, /^main\.(ts|js)$/];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isExempt(filePath) {
  const fileName = basename(filePath);
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(filePath) || pattern.test(fileName));
}

function calculateCycles(graph) {
  // Find strongly connected components using Tarjan's algorithm
  const sccs = [];
  const stack = [];
  const indices = new Map();
  const lowLinks = new Map();
  const onStack = new Set();
  let index = 0;

  function strongConnect(v) {
    indices.set(v, index);
    lowLinks.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    const deps = graph[v] || [];
    for (const w of deps) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowLinks.set(v, Math.min(lowLinks.get(v), lowLinks.get(w)));
      } else if (onStack.has(w)) {
        lowLinks.set(v, Math.min(lowLinks.get(v), indices.get(w)));
      }
    }

    if (lowLinks.get(v) === indices.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);

      if (scc.length > 1) {
        sccs.push(scc);
      }
    }
  }

  for (const v of Object.keys(graph)) {
    if (!indices.has(v)) {
      strongConnect(v);
    }
  }

  const cycles = sccs.map((scc) => ({
    modules: scc,
    length: scc.length,
  }));

  const modulesInCycles = new Set(cycles.flatMap((c) => c.modules)).size;
  const totalModules = Object.keys(graph).length;

  return {
    cycleCount: cycles.length,
    avgCycleLength:
      cycles.length > 0 ? cycles.reduce((sum, c) => sum + c.length, 0) / cycles.length : 0,
    modulesInCycles,
    percentageInCycles: totalModules > 0 ? (modulesInCycles / totalModules) * 100 : 0,
    cycles,
  };
}

function calculateCoupling(graph) {
  const files = Object.keys(graph);
  const fanOut = new Map();
  const fanIn = new Map();

  // Initialize
  files.forEach((file) => {
    fanOut.set(file, graph[file].length);
    fanIn.set(file, 0);
  });

  // Calculate fan-in
  files.forEach((file) => {
    graph[file].forEach((dep) => {
      fanIn.set(dep, (fanIn.get(dep) || 0) + 1);
    });
  });

  const avgFanOut = Array.from(fanOut.values()).reduce((sum, v) => sum + v, 0) / files.length || 0;
  const avgFanIn = Array.from(fanIn.values()).reduce((sum, v) => sum + v, 0) / files.length || 0;

  const maxFanOut = Math.max(...Array.from(fanOut.values()), 0);
  const maxFanOutFile = Array.from(fanOut.entries()).find(([, v]) => v === maxFanOut)?.[0] || null;

  const maxFanIn = Math.max(...Array.from(fanIn.values()), 0);
  const maxFanInFile = Array.from(fanIn.entries()).find(([, v]) => v === maxFanIn)?.[0] || null;

  // Find violations
  const criticalCoupling = [];
  const highCoupling = [];
  const godModules = [];

  files.forEach((file) => {
    const out = fanOut.get(file);
    const in_ = fanIn.get(file);

    // Skip exempt files
    if (isExempt(file)) {
      return;
    }

    if (out >= THRESHOLDS.CRITICAL_FAN_OUT) {
      criticalCoupling.push({
        file,
        fanOut: out,
        fanIn: in_,
        severity: 'critical',
      });
    } else if (out >= THRESHOLDS.HIGH_FAN_OUT) {
      highCoupling.push({
        file,
        fanOut: out,
        fanIn: in_,
        severity: 'warning',
      });
    }

    if (out >= THRESHOLDS.CRITICAL_GOD_MODULE && in_ >= THRESHOLDS.CRITICAL_GOD_MODULE) {
      godModules.push({
        file,
        fanOut: out,
        fanIn: in_,
        severity: 'critical',
      });
    }
  });

  return {
    avgFanOut,
    maxFanOut,
    maxFanOutFile,
    avgFanIn,
    maxFanIn,
    maxFanInFile,
    criticalCoupling: criticalCoupling.sort((a, b) => b.fanOut - a.fanOut),
    highCoupling: highCoupling.sort((a, b) => b.fanOut - a.fanOut),
    godModules: godModules.sort((a, b) => b.fanOut + b.fanIn - (a.fanOut + a.fanIn)),
    fanOutMap: fanOut,
    fanInMap: fanIn,
  };
}

function calculateDepth(graph) {
  const files = Object.keys(graph);
  const maxDepths = new Map();
  const visited = new Set();

  function dfs(node, path = []) {
    if (path.includes(node)) {
      return 0; // Cycle detected, return 0
    }

    if (maxDepths.has(node)) {
      return maxDepths.get(node);
    }

    const deps = graph[node] || [];
    if (deps.length === 0) {
      maxDepths.set(node, 0);
      return 0;
    }

    let maxDepth = 0;
    for (const dep of deps) {
      const depth = 1 + dfs(dep, [...path, node]);
      maxDepth = Math.max(maxDepth, depth);
    }

    maxDepths.set(node, maxDepth);
    return maxDepth;
  }

  // Calculate depth for all nodes
  files.forEach((file) => {
    if (!maxDepths.has(file)) {
      dfs(file);
    }
  });

  const depths = Array.from(maxDepths.values());
  const longestChain = Math.max(...depths, 0);
  const avgDepth = depths.length > 0 ? depths.reduce((sum, v) => sum + v, 0) / depths.length : 0;

  const criticalDepth = [];
  const deepModules = [];

  files.forEach((file) => {
    const depth = maxDepths.get(file);
    if (depth >= THRESHOLDS.CRITICAL_DEPTH) {
      criticalDepth.push({
        file,
        maxDepth: depth,
        severity: 'critical',
      });
    } else if (depth >= THRESHOLDS.HIGH_DEPTH) {
      deepModules.push({
        file,
        maxDepth: depth,
        severity: 'warning',
      });
    }
  });

  return {
    longestChain,
    avgDepth,
    criticalDepth: criticalDepth.sort((a, b) => b.maxDepth - a.maxDepth),
    deepModules: deepModules.sort((a, b) => b.maxDepth - a.maxDepth),
    depthMap: maxDepths,
  };
}

function calculateCohesion(graph) {
  const files = Object.keys(graph);
  const directories = new Map();

  // Group by directory
  files.forEach((file) => {
    const dir = dirname(file) + '/';
    if (!directories.has(dir)) {
      directories.set(dir, {
        files: [],
        internalImports: 0,
        externalImports: 0,
      });
    }
    directories.get(dir).files.push(file);
  });

  // Calculate internal vs external imports
  files.forEach((file) => {
    const dir = dirname(file) + '/';
    const deps = graph[file] || [];

    deps.forEach((dep) => {
      const depDir = dirname(dep) + '/';
      if (depDir === dir) {
        directories.get(dir).internalImports++;
      } else {
        directories.get(dir).externalImports++;
      }
    });
  });

  // Calculate cohesion scores
  const byDirectory = {};
  directories.forEach((data, dir) => {
    const total = data.internalImports + data.externalImports;
    const cohesionScore = total > 0 ? (data.internalImports / total) * 100 : 0;

    byDirectory[dir] = {
      totalModules: data.files.length,
      internalImports: data.internalImports,
      externalImports: data.externalImports,
      cohesionScore: Math.round(cohesionScore * 10) / 10,
    };
  });

  // Find orphaned modules
  const orphanedModules = files.filter((file) => {
    const hasNoDeps = graph[file].length === 0;
    const notImported = !files.some((f) => graph[f].includes(file));
    return hasNoDeps && notImported;
  });

  return {
    orphanedModules,
    isolatedCount: orphanedModules.length,
    byDirectory,
  };
}

function calculateGraph(graph) {
  const files = Object.keys(graph);
  const nodeCount = files.length;
  const edgeCount = files.reduce((sum, file) => sum + graph[file].length, 0);
  const maxPossibleEdges = nodeCount * (nodeCount - 1);
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
  const avgDegree = nodeCount > 0 ? (edgeCount * 2) / nodeCount : 0;

  return {
    nodeCount,
    edgeCount,
    density: Math.round(density * 1000) / 1000,
    avgDegree: Math.round(avgDegree * 100) / 100,
    maxPossibleEdges,
  };
}

function calculateHealthScore(metrics) {
  const scores = {
    coupling: 100,
    depth: 100,
    cohesion: 100,
    modularity: 100,
  };

  // Coupling score (based on avg fan-out)
  const { avgFanOut } = metrics.coupling;
  if (avgFanOut >= THRESHOLDS.CRITICAL_FAN_OUT) {
    scores.coupling = 0;
  } else if (avgFanOut >= THRESHOLDS.HIGH_FAN_OUT) {
    scores.coupling = 50;
  } else if (avgFanOut >= 5) {
    scores.coupling = 75;
  }

  // Depth score (based on avg depth)
  const { avgDepth } = metrics.depth;
  if (avgDepth >= THRESHOLDS.CRITICAL_DEPTH) {
    scores.depth = 0;
  } else if (avgDepth >= THRESHOLDS.HIGH_DEPTH) {
    scores.depth = 50;
  } else if (avgDepth >= 4) {
    scores.depth = 75;
  }

  // Cohesion score (based on directory cohesion)
  const cohesionScores = Object.values(metrics.cohesion.byDirectory).map((d) => d.cohesionScore);
  const avgCohesion =
    cohesionScores.length > 0
      ? cohesionScores.reduce((sum, v) => sum + v, 0) / cohesionScores.length
      : 100;
  scores.cohesion = Math.round(avgCohesion);

  // Modularity score (based on graph density)
  const { density } = metrics.graph;
  if (density >= THRESHOLDS.CRITICAL_DENSITY) {
    scores.modularity = 0;
  } else if (density >= THRESHOLDS.HIGH_DENSITY) {
    scores.modularity = 50;
  } else if (density >= 0.15) {
    scores.modularity = 75;
  }

  const overall = Math.round(
    (scores.coupling + scores.depth + scores.cohesion + scores.modularity) / 4,
  );

  return {
    overall,
    breakdown: scores,
  };
}

function getTopModules(coupling, depth, limit = 10) {
  const { fanOutMap, fanInMap } = coupling;
  const { depthMap } = depth;

  const mostCoupled = Array.from(fanOutMap.entries())
    .map(([file, fanOut]) => ({ file, fanOut }))
    .sort((a, b) => b.fanOut - a.fanOut)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const mostDepended = Array.from(fanInMap.entries())
    .map(([file, fanIn]) => ({ file, fanIn }))
    .filter(({ fanIn }) => fanIn > 0)
    .sort((a, b) => b.fanIn - a.fanIn)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const deepest = Array.from(depthMap.entries())
    .map(([file, maxDepth]) => ({ file, maxDepth }))
    .filter(({ maxDepth }) => maxDepth > 0)
    .sort((a, b) => b.maxDepth - a.maxDepth)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    mostCoupled,
    mostDepended,
    deepest,
  };
}

function collectViolations(metrics) {
  const critical = [];
  const warnings = [];

  // Critical coupling
  metrics.coupling.criticalCoupling.forEach((item) => {
    critical.push({
      type: 'CRITICAL_COUPLING',
      file: item.file,
      metric: 'fanOut',
      value: item.fanOut,
      threshold: THRESHOLDS.CRITICAL_FAN_OUT,
      message: `Module imports ${item.fanOut} dependencies (threshold: ${THRESHOLDS.CRITICAL_FAN_OUT})`,
    });
  });

  // High coupling
  metrics.coupling.highCoupling.forEach((item) => {
    warnings.push({
      type: 'HIGH_COUPLING',
      file: item.file,
      metric: 'fanOut',
      value: item.fanOut,
      threshold: THRESHOLDS.HIGH_FAN_OUT,
      message: `Module imports ${item.fanOut} dependencies (threshold: ${THRESHOLDS.HIGH_FAN_OUT})`,
    });
  });

  // God modules
  metrics.coupling.godModules.forEach((item) => {
    critical.push({
      type: 'GOD_MODULE',
      file: item.file,
      metric: 'fanOut+fanIn',
      value: item.fanOut + item.fanIn,
      threshold: THRESHOLDS.CRITICAL_GOD_MODULE * 2,
      message: `God module: ${item.fanOut} dependencies + ${item.fanIn} dependents (threshold: ${THRESHOLDS.CRITICAL_GOD_MODULE} each)`,
    });
  });

  // Critical depth
  metrics.depth.criticalDepth.forEach((item) => {
    critical.push({
      type: 'CRITICAL_DEPTH',
      file: item.file,
      metric: 'maxDepth',
      value: item.maxDepth,
      threshold: THRESHOLDS.CRITICAL_DEPTH,
      message: `Dependency chain depth: ${item.maxDepth} levels (threshold: ${THRESHOLDS.CRITICAL_DEPTH})`,
    });
  });

  // High depth
  metrics.depth.deepModules.forEach((item) => {
    warnings.push({
      type: 'HIGH_DEPTH',
      file: item.file,
      metric: 'maxDepth',
      value: item.maxDepth,
      threshold: THRESHOLDS.HIGH_DEPTH,
      message: `Dependency chain depth: ${item.maxDepth} levels (threshold: ${THRESHOLDS.HIGH_DEPTH})`,
    });
  });

  // Critical density
  if (metrics.graph.density >= THRESHOLDS.CRITICAL_DENSITY) {
    critical.push({
      type: 'CRITICAL_DENSITY',
      file: null,
      metric: 'density',
      value: metrics.graph.density,
      threshold: THRESHOLDS.CRITICAL_DENSITY,
      message: `Graph density ${Math.round(metrics.graph.density * 100)}% (threshold: ${Math.round(THRESHOLDS.CRITICAL_DENSITY * 100)}%)`,
    });
  } else if (metrics.graph.density >= THRESHOLDS.HIGH_DENSITY) {
    warnings.push({
      type: 'HIGH_DENSITY',
      file: null,
      metric: 'density',
      value: metrics.graph.density,
      threshold: THRESHOLDS.HIGH_DENSITY,
      message: `Graph density ${Math.round(metrics.graph.density * 100)}% (threshold: ${Math.round(THRESHOLDS.HIGH_DENSITY * 100)}%)`,
    });
  }

  return { critical, warnings };
}

// ============================================================================
// METRICS GENERATION
// ============================================================================

function generateMetrics(graph, appName) {
  const circular = calculateCycles(graph);
  const coupling = calculateCoupling(graph);
  const depth = calculateDepth(graph);
  const cohesion = calculateCohesion(graph);
  const graphMetrics = calculateGraph(graph);

  const metrics = {
    circular,
    coupling: {
      avgFanOut: Math.round(coupling.avgFanOut * 100) / 100,
      maxFanOut: coupling.maxFanOut,
      maxFanOutFile: coupling.maxFanOutFile,
      avgFanIn: Math.round(coupling.avgFanIn * 100) / 100,
      maxFanIn: coupling.maxFanIn,
      maxFanInFile: coupling.maxFanInFile,
      criticalCoupling: coupling.criticalCoupling,
      highCoupling: coupling.highCoupling,
      godModules: coupling.godModules,
    },
    depth: {
      longestChain: depth.longestChain,
      avgDepth: Math.round(depth.avgDepth * 100) / 100,
      criticalDepth: depth.criticalDepth,
      deepModules: depth.deepModules,
    },
    cohesion,
    graph: graphMetrics,
  };

  const healthScore = calculateHealthScore(metrics);
  const topModules = getTopModules(coupling, depth);
  const violations = collectViolations(metrics);

  const status =
    violations.critical.length > 0 ? 'FAIL' : violations.warnings.length > 0 ? 'WARN' : 'PASS';

  return {
    metadata: {
      app: appName,
      generator: 'generate-metrics.js v1.0.0',
    },
    summary: {
      totalModules: graphMetrics.nodeCount,
      totalDependencies: graphMetrics.edgeCount,
      graphDensity: graphMetrics.density,
      avgFanOut: metrics.coupling.avgFanOut,
      avgFanIn: metrics.coupling.avgFanIn,
      healthScore: healthScore.overall,
      status,
    },
    circular: {
      cycleCount: circular.cycleCount,
      avgCycleLength: Math.round(circular.avgCycleLength * 100) / 100,
      modulesInCycles: circular.modulesInCycles,
      percentageInCycles: Math.round(circular.percentageInCycles * 10) / 10,
      cycles: circular.cycles,
    },
    coupling: metrics.coupling,
    depth: metrics.depth,
    cohesion: metrics.cohesion,
    graph: metrics.graph,
    topModules,
    violations,
    healthScore,
  };
}

// ============================================================================
// CONSOLE OUTPUT
// ============================================================================

function printMetrics(metrics, appName) {
  console.log(`\n📊 Analyzing ${appName} code quality metrics...\n`);

  // Summary
  console.log('📈 Summary:');
  console.log(`  • Total modules: ${metrics.summary.totalModules}`);
  console.log(`  • Total dependencies: ${metrics.summary.totalDependencies}`);
  console.log(`  • Graph density: ${Math.round(metrics.summary.graphDensity * 1000) / 10}%`);
  const scoreEmoji =
    metrics.summary.healthScore >= 90 ? '🟢' : metrics.summary.healthScore >= 75 ? '🟡' : '🔴';
  console.log(`  • Health score: ${metrics.summary.healthScore}/100 ${scoreEmoji}`);

  // Circular dependencies
  console.log('\n🔄 Circular Dependencies:');
  if (metrics.circular.cycleCount === 0) {
    console.log('  ✅ No circular dependencies detected');
  } else {
    console.log(`  ⚠️  ${metrics.circular.cycleCount} cycle(s) detected`);
    console.log(`  • Average cycle length: ${metrics.circular.avgCycleLength}`);
    console.log(
      `  • Modules in cycles: ${metrics.circular.modulesInCycles} (${metrics.circular.percentageInCycles}%)`,
    );
  }

  // Coupling
  console.log('\n🔗 Coupling Analysis:');
  console.log(`  • Average fan-out: ${metrics.coupling.avgFanOut}`);
  console.log(
    `  • Max fan-out: ${metrics.coupling.maxFanOut}${metrics.coupling.maxFanOutFile ? ` (${metrics.coupling.maxFanOutFile})` : ''}`,
  );
  if (isExempt(metrics.coupling.maxFanOutFile || '')) {
    console.log('    (EXEMPT: composition root)');
  }
  if (metrics.coupling.criticalCoupling.length === 0) {
    console.log('  ✅ No critical coupling issues');
  } else {
    console.log(`  🔴 ${metrics.coupling.criticalCoupling.length} critical coupling issue(s)`);
  }

  // Depth
  console.log('\n📏 Dependency Depth:');
  console.log(`  • Longest chain: ${metrics.depth.longestChain} levels`);
  console.log(`  • Average depth: ${metrics.depth.avgDepth}`);
  if (metrics.depth.criticalDepth.length === 0) {
    console.log('  ✅ No excessive depth detected');
  } else {
    console.log(`  🔴 ${metrics.depth.criticalDepth.length} critical depth issue(s)`);
  }

  // Cohesion
  console.log('\n🧩 Cohesion by Directory:');
  const dirs = Object.entries(metrics.cohesion.byDirectory).sort(
    ([, a], [, b]) => b.cohesionScore - a.cohesionScore,
  );
  dirs.slice(0, 10).forEach(([dir, data]) => {
    const emoji = data.cohesionScore >= 80 ? '🟢' : data.cohesionScore >= 60 ? '🟡' : '🔴';
    console.log(
      `  ${emoji} ${dir}: ${data.cohesionScore}% (${data.internalImports} internal / ${data.externalImports} external)`,
    );
  });

  // Violations
  if (metrics.violations.critical.length > 0) {
    console.log('\n🔴 CRITICAL VIOLATIONS:\n');
    metrics.violations.critical.forEach((v) => {
      console.log(`  ❌ ${v.file || 'Global'}`);
      console.log(`     ${v.message}`);
    });
    console.log('\n💡 These violations block the commit. Please refactor before committing.');
  }

  if (metrics.violations.warnings.length > 0) {
    console.log('\n⚠️  Warnings (non-blocking):\n');
    metrics.violations.warnings.slice(0, 5).forEach((v) => {
      console.log(`  ⚠️  ${v.file || 'Global'}`);
      console.log(`     ${v.message}`);
    });
    if (metrics.violations.warnings.length > 5) {
      console.log(`  ... and ${metrics.violations.warnings.length - 5} more warning(s)`);
    }
  }

  if (metrics.violations.critical.length === 0 && metrics.violations.warnings.length === 0) {
    console.log('\n✅ No violations detected!');
  }

  const statusEmoji =
    metrics.summary.status === 'PASS' ? '✅' : metrics.summary.status === 'WARN' ? '⚠️ ' : '❌';
  console.log(`\n${statusEmoji} Metrics generated: docs/dependencies/${appName}-metrics.json`);
}

function filterExemptFromGraph(graph) {
  const filteredGraph = {};
  Object.entries(graph).forEach(([file, deps]) => {
    if (!isExempt(file)) {
      filteredGraph[file] = deps.filter((dep) => isExempt(dep) === false);
    }
  });
  return filteredGraph;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const appFilter = args.find((arg) => arg.startsWith('--app='))?.split('=')[1];

  const apps = [
    {
      name: 'client',
      graphPath: 'docs/dependencies/client-deps.json',
      outputPath: 'docs/dependencies/client-metrics.json',
    },
    {
      name: 'server',
      graphPath: 'docs/dependencies/server-deps.json',
      outputPath: 'docs/dependencies/server-metrics.json',
    },
  ];

  let hasAnyFailures = false;

  apps
    .filter((app) => !appFilter || app.name === appFilter)
    .forEach((app) => {
      try {
        const graph = JSON.parse(readFileSync(app.graphPath, 'utf-8'));
        const filteredGraph = filterExemptFromGraph(graph);
        const metrics = generateMetrics(filteredGraph, app.name);

        // Print console output
        printMetrics(metrics, app.name);

        // Write JSON output
        writeFileSync(app.outputPath, JSON.stringify(metrics, null, 2));

        if (metrics.summary.status === 'FAIL') {
          hasAnyFailures = true;
        }
      } catch (error) {
        console.error(`\n❌ Error processing ${app.name}: ${error.message}`);
        hasAnyFailures = true;
      }
    });

  if (hasAnyFailures) {
    console.log('\n❌ Metrics generation completed with CRITICAL issues.');
    process.exit(1);
  } else {
    console.log('\n✅ Metrics generation completed successfully.');
    process.exit(0);
  }
}

main();
