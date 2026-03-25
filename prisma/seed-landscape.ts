import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const items = [
  // ─── Lawn Care (Recurring) ───────────────────────────────────────
  { id: 'lawn-mow-small', label: 'Lawn Mow & Edge — Small Lot (up to 5,000 sqft)', unit: 'EA', rate: 45, cost: 18, category: 'Lawn Care', sort_order: 10 },
  { id: 'lawn-mow-medium', label: 'Lawn Mow & Edge — Medium Lot (5,000–10,000 sqft)', unit: 'EA', rate: 65, cost: 25, category: 'Lawn Care', sort_order: 20 },
  { id: 'lawn-mow-large', label: 'Lawn Mow & Edge — Large Lot (10,000–20,000 sqft)', unit: 'EA', rate: 95, cost: 38, category: 'Lawn Care', sort_order: 30 },
  { id: 'lawn-mow-xlarge', label: 'Lawn Mow & Edge — XL Lot (20,000+ sqft)', unit: 'EA', rate: 135, cost: 55, category: 'Lawn Care', sort_order: 35 },
  { id: 'lawn-weekly-plan', label: 'Weekly Mowing Plan (per month, 4 visits)', unit: 'MO', rate: 160, cost: 65, category: 'Lawn Care', sort_order: 40 },
  { id: 'lawn-biweekly-plan', label: 'Bi-Weekly Mowing Plan (per month, 2 visits)', unit: 'MO', rate: 90, cost: 38, category: 'Lawn Care', sort_order: 45 },
  { id: 'lawn-weed-eat', label: 'String Trimming / Weed Eating (add-on)', unit: 'EA', rate: 25, cost: 8, category: 'Lawn Care', sort_order: 50 },
  { id: 'lawn-blow', label: 'Blow Off Driveway, Walks & Patio', unit: 'EA', rate: 15, cost: 5, category: 'Lawn Care', sort_order: 55 },
  { id: 'lawn-scalp-spring', label: 'Spring Scalp & Cleanup', unit: 'EA', rate: 125, cost: 45, category: 'Lawn Care', sort_order: 60 },
  { id: 'lawn-aeration', label: 'Lawn Aeration', unit: 'SQFT', rate: 0.04, cost: 0.015, category: 'Lawn Care', sort_order: 70 },
  { id: 'lawn-overseed', label: 'Overseeding', unit: 'SQFT', rate: 0.06, cost: 0.025, category: 'Lawn Care', sort_order: 75 },
  { id: 'lawn-fertilize', label: 'Fertilizer Application', unit: 'SQFT', rate: 0.03, cost: 0.01, category: 'Lawn Care', sort_order: 80 },
  { id: 'lawn-weed-control', label: 'Weed Control / Pre-Emergent', unit: 'SQFT', rate: 0.03, cost: 0.012, category: 'Lawn Care', sort_order: 85 },

  // ─── Landscaping ─────────────────────────────────────────────────
  { id: 'land-mulch-install', label: 'Mulch Install (per yard delivered & spread)', unit: 'CY', rate: 85, cost: 35, category: 'Landscaping', sort_order: 10 },
  { id: 'land-rock-install', label: 'Decorative Rock / Gravel Install', unit: 'CY', rate: 110, cost: 50, category: 'Landscaping', sort_order: 15 },
  { id: 'land-bed-cleanup', label: 'Flower Bed Cleanup & Weeding', unit: 'HR', rate: 75, cost: 30, category: 'Landscaping', sort_order: 20 },
  { id: 'land-bed-design', label: 'Landscape Bed Design & Install', unit: 'SQFT', rate: 12, cost: 5, category: 'Landscaping', sort_order: 25 },
  { id: 'land-plant-install', label: 'Plant / Shrub Install (per plant, labor only)', unit: 'EA', rate: 35, cost: 12, category: 'Landscaping', sort_order: 30 },
  { id: 'land-tree-plant-small', label: 'Tree Planting — Small (up to 6ft)', unit: 'EA', rate: 125, cost: 45, category: 'Landscaping', sort_order: 35 },
  { id: 'land-tree-plant-large', label: 'Tree Planting — Large (6ft+)', unit: 'EA', rate: 250, cost: 100, category: 'Landscaping', sort_order: 40 },
  { id: 'land-sod-install', label: 'Sod Installation (Bermuda/St. Augustine)', unit: 'SQFT', rate: 1.50, cost: 0.65, category: 'Landscaping', sort_order: 45 },
  { id: 'land-sod-removal', label: 'Old Sod / Grass Removal', unit: 'SQFT', rate: 0.75, cost: 0.30, category: 'Landscaping', sort_order: 50 },
  { id: 'land-edging-steel', label: 'Steel Landscape Edging Install', unit: 'LF', rate: 8, cost: 3.50, category: 'Landscaping', sort_order: 55 },
  { id: 'land-edging-stone', label: 'Stone / Brick Border Edging', unit: 'LF', rate: 18, cost: 8, category: 'Landscaping', sort_order: 60 },
  { id: 'land-retaining-wall', label: 'Retaining Wall (block, per LF x height)', unit: 'SQFT', rate: 35, cost: 16, category: 'Landscaping', sort_order: 65 },
  { id: 'land-drainage-french', label: 'French Drain Install', unit: 'LF', rate: 28, cost: 12, category: 'Landscaping', sort_order: 70 },
  { id: 'land-drainage-catch', label: 'Catch Basin / Drain Box', unit: 'EA', rate: 225, cost: 85, category: 'Landscaping', sort_order: 75 },

  // ─── Tree & Hedge Service ───────────────────────────────────────
  { id: 'tree-trim-small', label: 'Tree Trimming — Small (under 15ft)', unit: 'EA', rate: 150, cost: 55, category: 'Tree & Hedge Service', sort_order: 10 },
  { id: 'tree-trim-medium', label: 'Tree Trimming — Medium (15–30ft)', unit: 'EA', rate: 350, cost: 130, category: 'Tree & Hedge Service', sort_order: 20 },
  { id: 'tree-trim-large', label: 'Tree Trimming — Large (30ft+)', unit: 'EA', rate: 650, cost: 250, category: 'Tree & Hedge Service', sort_order: 30 },
  { id: 'tree-removal-small', label: 'Tree Removal — Small (under 15ft)', unit: 'EA', rate: 350, cost: 140, category: 'Tree & Hedge Service', sort_order: 35 },
  { id: 'tree-removal-medium', label: 'Tree Removal — Medium (15–30ft)', unit: 'EA', rate: 750, cost: 300, category: 'Tree & Hedge Service', sort_order: 40 },
  { id: 'tree-stump-grind', label: 'Stump Grinding (per inch diameter)', unit: 'IN', rate: 8, cost: 3, category: 'Tree & Hedge Service', sort_order: 50 },
  { id: 'hedge-trim', label: 'Hedge / Bush Trimming', unit: 'HR', rate: 75, cost: 30, category: 'Tree & Hedge Service', sort_order: 60 },
  { id: 'hedge-trim-row', label: 'Hedge Row Trim (per 10ft section)', unit: 'EA', rate: 45, cost: 18, category: 'Tree & Hedge Service', sort_order: 65 },
  { id: 'bush-removal', label: 'Bush / Shrub Removal', unit: 'EA', rate: 85, cost: 30, category: 'Tree & Hedge Service', sort_order: 70 },
  { id: 'tree-debris-haul', label: 'Tree / Brush Debris Haul-Off', unit: 'EA', rate: 175, cost: 65, category: 'Tree & Hedge Service', sort_order: 80 },

  // ─── Seasonal & Cleanup ──────────────────────────────────────────
  { id: 'leaf-removal-yard', label: 'Leaf Removal — Full Yard', unit: 'EA', rate: 175, cost: 60, category: 'Seasonal Cleanup', sort_order: 10 },
  { id: 'leaf-removal-beds', label: 'Leaf Removal — Beds & Borders Only', unit: 'EA', rate: 95, cost: 35, category: 'Seasonal Cleanup', sort_order: 15 },
  { id: 'gutter-leaf-clean', label: 'Gutter Cleaning (leaf season)', unit: 'EA', rate: 150, cost: 40, category: 'Seasonal Cleanup', sort_order: 20 },
  { id: 'fall-cleanup-full', label: 'Fall Cleanup Package (leaf removal + bed cleanup + trim)', unit: 'EA', rate: 350, cost: 130, category: 'Seasonal Cleanup', sort_order: 30 },
  { id: 'spring-cleanup-full', label: 'Spring Cleanup Package (scalp + beds + mulch + trim)', unit: 'EA', rate: 450, cost: 175, category: 'Seasonal Cleanup', sort_order: 40 },
  { id: 'lot-clear-overgrown', label: 'Overgrown Lot Clearing', unit: 'SQFT', rate: 0.25, cost: 0.10, category: 'Seasonal Cleanup', sort_order: 50 },
  { id: 'debris-haul-landscape', label: 'Landscape Debris Haul-Off (per load)', unit: 'EA', rate: 150, cost: 55, category: 'Seasonal Cleanup', sort_order: 60 },

  // ─── Irrigation ──────────────────────────────────────────────────
  { id: 'irr-head-replace', label: 'Sprinkler Head Replace', unit: 'EA', rate: 35, cost: 12, category: 'Irrigation', sort_order: 10 },
  { id: 'irr-head-adjust', label: 'Sprinkler Head Adjust / Clean (per zone)', unit: 'EA', rate: 25, cost: 8, category: 'Irrigation', sort_order: 15 },
  { id: 'irr-valve-replace', label: 'Zone Valve Replace', unit: 'EA', rate: 125, cost: 45, category: 'Irrigation', sort_order: 20 },
  { id: 'irr-line-repair', label: 'Irrigation Line Repair (per break)', unit: 'EA', rate: 95, cost: 30, category: 'Irrigation', sort_order: 30 },
  { id: 'irr-controller-install', label: 'Smart Controller / Timer Install', unit: 'EA', rate: 195, cost: 75, category: 'Irrigation', sort_order: 40 },
  { id: 'irr-winterize', label: 'System Winterization (blowout)', unit: 'EA', rate: 75, cost: 25, category: 'Irrigation', sort_order: 50 },
  { id: 'irr-startup-spring', label: 'Spring Startup & Inspection', unit: 'EA', rate: 85, cost: 30, category: 'Irrigation', sort_order: 55 },
  { id: 'irr-zone-add', label: 'New Zone Add (trenching + heads)', unit: 'EA', rate: 450, cost: 180, category: 'Irrigation', sort_order: 60 },
  { id: 'irr-drip-install', label: 'Drip Line Install (beds, per LF)', unit: 'LF', rate: 4.50, cost: 1.75, category: 'Irrigation', sort_order: 70 },
];

async function main() {
  let created = 0;
  for (const item of items) {
    await prisma.line_item_master.upsert({
      where: { id: item.id },
      update: { label: item.label, unit: item.unit, rate: item.rate, cost: item.cost, category: item.category, sort_order: item.sort_order, active: true },
      create: { ...item, active: true },
    });
    created++;
  }
  console.log('Done: ' + created + ' landscape items upserted');
}

main().catch(console.error).finally(() => prisma.$disconnect());
