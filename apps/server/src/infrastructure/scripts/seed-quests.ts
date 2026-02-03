#!/usr/bin/env tsx

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/use-unknown-in-catch-callback-variable */

/**
 * Quest Catalog Seed Script
 *
 * Populates the Firestore database with initial quest definitions.
 * This script is idempotent - it will skip quests that already exist.
 *
 * Usage:
 *   pnpm seed:quests
 *
 * Prerequisites:
 *   - Firestore emulator running (for development) OR
 *   - Production Firestore configured (for production seeding)
 */

import { QuestId } from '../../domain/quest/quest-value-objects.js';
import { Quest, QuestLevel } from '../../domain/quest/quest.js';
import { ProgrammingLanguage } from '../../domain/shared/programming-language.js';
import { loadEnvironmentConfig } from '../config/environment.js';
import { FirebaseConfig } from '../config/firebase.config.js';
import { FirestoreClient } from '../persistence/firestore/firestore-client.js';
import { FirestoreQuestRepository } from '../persistence/firestore/repositories/firestore-quest-repository.js';

/**
 * Initial quest definitions based on current ingest mapper
 */
interface SeedQuest {
  key: string;
  title: string;
  category: string;
  description: string;
  active: boolean;
  levels: QuestLevel[];
  languages?: string[]; // Optional: language tags for language-specific quests
}

const SEED_QUESTS: SeedQuest[] = [
  {
    key: 'docs.agents_md_present',
    title: 'AGENTS.md exists',
    category: 'documentation',
    description: 'Checks if AGENTS.md file is present in repository',
    active: true,
    levels: [{ level: 1, description: 'Present', condition: { type: 'pass' } }],
    // No languages = universal quest (applies to all repos)
  },
  {
    key: 'docs.skill_md_count',
    title: 'Skills documented',
    category: 'documentation',
    description: 'Checks if skill markdown files exist (count > 0)',
    active: true,
    levels: [{ level: 1, description: 'Count > 0', condition: { type: 'count', min: 1 } }],
    // No languages = universal quest (applies to all repos)
  },
  {
    key: 'formatters.javascript.prettier_present',
    title: 'Prettier configured',
    category: 'formatters',
    description: 'Checks if Prettier formatter is configured',
    active: true,
    levels: [{ level: 1, description: 'Present', condition: { type: 'pass' } }],
    languages: ['javascript', 'typescript'], // Applies to JS and TS repos
  },
  {
    key: 'linting.javascript.eslint_present',
    title: 'ESLint configured',
    category: 'linting',
    description: 'Checks if ESLint linter is configured',
    active: true,
    levels: [{ level: 1, description: 'Present', condition: { type: 'pass' } }],
    languages: ['javascript', 'typescript'], // Applies to JS and TS repos
  },
  {
    key: 'sast.codeql_present',
    title: 'CodeQL enabled',
    category: 'sast',
    description: 'Checks if CodeQL SAST scanning is configured',
    active: true,
    levels: [{ level: 1, description: 'Present', condition: { type: 'pass' } }],
    // No languages = universal quest (CodeQL supports many languages)
  },
  {
    key: 'sast.semgrep_present',
    title: 'Semgrep enabled',
    category: 'sast',
    description: 'Checks if Semgrep SAST scanning is configured',
    active: true,
    levels: [{ level: 1, description: 'Present', condition: { type: 'pass' } }],
    // No languages = universal quest (Semgrep supports many languages)
  },
  {
    key: 'quality.coverage_available',
    title: 'Coverage reporting',
    category: 'quality',
    description: 'Checks if test coverage data is available',
    active: true,
    levels: [{ level: 1, description: 'Available', condition: { type: 'pass' } }],
    // No languages = universal quest (applies to all repos)
  },
  {
    key: 'quality.coverage_threshold_met',
    title: 'Coverage threshold met',
    category: 'quality',
    description: 'Checks if test coverage meets defined threshold',
    active: true,
    levels: [{ level: 1, description: 'Threshold met', condition: { type: 'pass' } }],
    // No languages = universal quest (applies to all repos)
  },
];

/**
 * Generate a deterministic quest ID from the quest key
 * This ensures the same quest always gets the same ID
 */
function generateQuestId(key: string): QuestId {
  // Simple deterministic ID: quest_<sanitized_key>
  const sanitized = key.replace(/\./g, '_');
  return QuestId.create(`quest_${sanitized}`);
}

/**
 * Seed a single quest if it doesn't already exist
 */
async function seedSingleQuest(
  seedQuest: (typeof SEED_QUESTS)[number],
  questRepository: FirestoreQuestRepository,
): Promise<'created' | 'skipped'> {
  const questId = generateQuestId(seedQuest.key);

  // Check if quest already exists by key
  const existing = await questRepository.findByKey(seedQuest.key);

  if (existing) {
    console.log(`⏭️  Skipped: ${seedQuest.key} (already exists)`);
    return 'skipped';
  }

  // Parse languages from string array to ProgrammingLanguage array
  const languages = seedQuest.languages
    ?.map((lang) => ProgrammingLanguage.fromString(lang))
    .filter((lang): lang is ProgrammingLanguage => lang !== null);

  // Create and save the quest
  const quest = Quest.create({
    id: questId,
    key: seedQuest.key,
    title: seedQuest.title,
    category: seedQuest.category,
    description: seedQuest.description,
    active: seedQuest.active,
    levels: seedQuest.levels,
    languages,
  });

  await questRepository.save(quest);
  console.log(`✅ Created: ${seedQuest.key}`);
  return 'created';
}

/**
 * Print seeding summary
 */
function printSummary(created: number, skipped: number): void {
  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📦 Total:   ${SEED_QUESTS.length}\n`);
  console.log('🎉 Quest catalog seeding completed successfully!');
}

/**
 * Seed the quest catalog
 */
async function seedQuests(): Promise<void> {
  console.log('🌱 Starting quest catalog seeding...\n');

  // Load environment configuration
  const config = loadEnvironmentConfig();
  console.log(`📦 Environment: ${config.nodeEnv}`);
  console.log(`🔥 Firebase Project: ${config.firebaseProjectId}\n`);

  // Initialize Firebase
  const firebaseConfig = new FirebaseConfig(config);
  firebaseConfig.initialize();

  const firestore = firebaseConfig.getFirestore();
  const firestoreClient = new FirestoreClient(firestore);
  const questRepository = new FirestoreQuestRepository(firestoreClient);

  let created = 0;
  let skipped = 0;

  try {
    for (const seedQuest of SEED_QUESTS) {
      const result = await seedSingleQuest(seedQuest, questRepository);
      if (result === 'created') {
        created++;
      } else {
        skipped++;
      }
    }

    printSummary(created, skipped);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    // Clean up Firebase connection
    await firebaseConfig.close();
  }
}

// Run the seed script
seedQuests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
