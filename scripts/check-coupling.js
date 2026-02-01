#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join } from 'path';

const COUPLING_THRESHOLDS = {
  high: 10, // Warning: file imports >10 modules
  critical: 20, // Critical: file imports >20 modules
};

const CENTRALITY_THRESHOLDS = {
  high: 15, // Warning: file imported by >15 modules
  critical: 30, // Critical: file imported by >30 modules
};

function analyzeDependencyGraph(graphPath, appName) {
  console.log(`\n📊 Analyzing ${appName} coupling...`);

  let graph;
  try {
    graph = JSON.parse(readFileSync(graphPath, 'utf-8'));
  } catch (error) {
    console.log(`⚠️  Could not read ${graphPath}: ${error.message}`);
    return { hasWarnings: false };
  }

  const files = Object.keys(graph);
  let hasWarnings = false;

  // Analysis 1: Files with too many dependencies (high coupling)
  const highCoupling = files
    .map((file) => ({
      file: file.replace(/^apps\/(client|server)\/src\//, ''),
      depCount: graph[file].length,
    }))
    .filter((item) => item.depCount >= COUPLING_THRESHOLDS.high)
    .sort((a, b) => b.depCount - a.depCount);

  if (highCoupling.length > 0) {
    hasWarnings = true;
    console.log(`\n⚠️  Files with high coupling (imports >${COUPLING_THRESHOLDS.high} modules):`);
    highCoupling.forEach(({ file, depCount }) => {
      const marker = depCount >= COUPLING_THRESHOLDS.critical ? '🔴' : '⚠️ ';
      console.log(`  ${marker} ${file}: ${depCount} imports`);
    });
    console.log(
      `\n  💡 Consider: Extract shared logic, use dependency injection, or split into smaller modules`,
    );
  }

  // Analysis 2: Files imported by many others (centrality - fragility risk)
  const importedBy = {};
  files.forEach((file) => {
    graph[file].forEach((dep) => {
      if (!importedBy[dep]) importedBy[dep] = [];
      importedBy[dep].push(file);
    });
  });

  const highCentrality = Object.entries(importedBy)
    .map(([file, importers]) => ({
      file: file.replace(/^apps\/(client|server)\/src\//, ''),
      importerCount: importers.length,
    }))
    .filter((item) => item.importerCount >= CENTRALITY_THRESHOLDS.high)
    .sort((a, b) => b.importerCount - a.importerCount);

  if (highCentrality.length > 0) {
    hasWarnings = true;
    console.log(`\n⚠️  Core modules (imported by >${CENTRALITY_THRESHOLDS.high} files):`);
    highCentrality.forEach(({ file, importerCount }) => {
      const marker = importerCount >= CENTRALITY_THRESHOLDS.critical ? '🔴' : 'ℹ️ ';
      console.log(`  ${marker} ${file}: imported by ${importerCount} files`);
    });
    console.log(
      `\n  💡 These are core modules - changes here have wide impact. Consider careful testing.`,
    );
  }

  // Analysis 3: Orphaned files (no imports or exports)
  const orphaned = files.filter((file) => {
    const hasNoDeps = graph[file].length === 0;
    const notImported = !importedBy[file] || importedBy[file].length === 0;
    return hasNoDeps && notImported;
  });

  if (orphaned.length > 0) {
    console.log(`\nℹ️  Isolated files (${orphaned.length} files with no imports/exports):`);
    orphaned.slice(0, 5).forEach((file) => {
      console.log(`  • ${file.replace(/^apps\/(client|server)\/src\//, '')}`);
    });
    if (orphaned.length > 5) {
      console.log(`  ... and ${orphaned.length - 5} more`);
    }
    console.log(`\n  💡 These might be entry points, utilities, or dead code.`);
  }

  // Summary
  console.log(`\n📈 ${appName} Summary:`);
  console.log(`  • Total modules: ${files.length}`);
  console.log(`  • High coupling: ${highCoupling.length} files`);
  console.log(`  • Core modules: ${highCentrality.length} files`);
  console.log(`  • Isolated files: ${orphaned.length} files`);

  return { hasWarnings };
}

// Main execution
let hasAnyWarnings = false;

const clientResult = analyzeDependencyGraph('docs/dependencies/client-deps.json', 'Client');
const serverResult = analyzeDependencyGraph('docs/dependencies/server-deps.json', 'Server');

hasAnyWarnings = clientResult.hasWarnings || serverResult.hasWarnings;

if (!hasAnyWarnings) {
  console.log('\n✅ No coupling concerns detected!');
} else {
  console.log('\n⚠️  Coupling warnings detected (non-blocking)');
  console.log('   Review the suggestions above to improve code maintainability.');
}

// Exit 0 (success) - warnings are informational only
process.exit(0);
