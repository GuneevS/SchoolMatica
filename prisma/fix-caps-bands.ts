/**
 * Data migration: Fix incorrect CAPS grading bands for existing schools.
 *
 * The original seed/school-creation code had wrong thresholds:
 *   - Level 2 started at 40% (should be 30%)
 *   - Level 7 started at 90% (should be 80%)
 *
 * This script finds all GradingConfig records with wrong bands and corrects them.
 *
 * Run with: npx tsx prisma/fix-caps-bands.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Band {
  minPercent: number;
  level: number;
  descriptor: string;
}

async function main() {
  const configs = await prisma.gradingConfig.findMany();
  let fixed = 0;

  for (const config of configs) {
    const phases = config.phasesJson as Record<string, Band[]>;
    let changed = false;

    for (const phase of Object.keys(phases)) {
      const bands = phases[phase];
      if (!Array.isArray(bands)) continue;

      for (const band of bands) {
        // Fix Level 2: 40% -> 30% (except Foundation which uses 35%)
        if (band.level === 2 && band.minPercent === 40 && phase !== "Foundation") {
          band.minPercent = 30;
          changed = true;
        }
        // Fix Level 7: 90% -> 80%
        if (band.level === 7 && band.minPercent === 90) {
          band.minPercent = 80;
          changed = true;
        }
      }
    }

    if (changed) {
      await prisma.gradingConfig.update({
        where: { id: config.id },
        data: { phasesJson: phases },
      });
      fixed++;
      console.log(`Fixed grading config: ${config.id} (${config.name})`);
    }
  }

  console.log(`\nDone. Fixed ${fixed} of ${configs.length} grading configs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
