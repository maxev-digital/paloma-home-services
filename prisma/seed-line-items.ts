import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const items = [
  // ─── TV Mounting & AV Setup ──────────────────────────────────────
  { id: 'tv-mount-standard', label: 'TV Mount — Standard (up to 65")', unit: 'EA', rate: 149, cost: 45, category: 'AV & TV Mounting', sort_order: 10 },
  { id: 'tv-mount-large', label: 'TV Mount — Large (65"–85")', unit: 'EA', rate: 199, cost: 60, category: 'AV & TV Mounting', sort_order: 20 },
  { id: 'tv-mount-fireplace', label: 'TV Mount — Above Fireplace', unit: 'EA', rate: 249, cost: 75, category: 'AV & TV Mounting', sort_order: 30 },
  { id: 'tv-mount-outdoor', label: 'TV Mount — Outdoor', unit: 'EA', rate: 275, cost: 85, category: 'AV & TV Mounting', sort_order: 40 },
  { id: 'tv-cord-conceal', label: 'Cord Concealment (in-wall)', unit: 'EA', rate: 125, cost: 35, category: 'AV & TV Mounting', sort_order: 50 },
  { id: 'tv-cord-conceal-surface', label: 'Cord Concealment (surface raceway)', unit: 'EA', rate: 75, cost: 20, category: 'AV & TV Mounting', sort_order: 55 },
  { id: 'soundbar-install', label: 'Soundbar Installation', unit: 'EA', rate: 89, cost: 25, category: 'AV & TV Mounting', sort_order: 60 },
  { id: 'surround-sound', label: 'Surround Sound Setup (5.1)', unit: 'EA', rate: 350, cost: 100, category: 'AV & TV Mounting', sort_order: 70 },
  { id: 'receiver-setup', label: 'AV Receiver / Streaming Device Setup', unit: 'EA', rate: 75, cost: 20, category: 'AV & TV Mounting', sort_order: 80 },
  { id: 'projector-install', label: 'Projector & Screen Installation', unit: 'EA', rate: 299, cost: 90, category: 'AV & TV Mounting', sort_order: 90 },

  // ─── Flooring ────────────────────────────────────────────────────
  { id: 'floor-lvp-install', label: 'LVP / Vinyl Plank Install', unit: 'SQFT', rate: 4.50, cost: 1.75, category: 'Flooring', sort_order: 10 },
  { id: 'floor-laminate-install', label: 'Laminate Flooring Install', unit: 'SQFT', rate: 4.00, cost: 1.50, category: 'Flooring', sort_order: 20 },
  { id: 'floor-hardwood-install', label: 'Hardwood Flooring Install', unit: 'SQFT', rate: 8.00, cost: 3.50, category: 'Flooring', sort_order: 30 },
  { id: 'floor-tile-install', label: 'Floor Tile Install (standard)', unit: 'SQFT', rate: 12.00, cost: 5.00, category: 'Flooring', sort_order: 40 },
  { id: 'floor-tile-large-format', label: 'Floor Tile — Large Format (24"+)', unit: 'SQFT', rate: 15.00, cost: 6.50, category: 'Flooring', sort_order: 45 },
  { id: 'floor-demo-remove', label: 'Flooring Demo & Removal', unit: 'SQFT', rate: 2.50, cost: 1.00, category: 'Flooring', sort_order: 50 },
  { id: 'floor-baseboards', label: 'Baseboard Install / Replace', unit: 'LF', rate: 4.50, cost: 1.75, category: 'Flooring', sort_order: 60 },
  { id: 'floor-transition-strip', label: 'Transition Strip Install', unit: 'EA', rate: 35, cost: 12, category: 'Flooring', sort_order: 70 },
  { id: 'floor-subfloor-repair', label: 'Subfloor Repair', unit: 'SQFT', rate: 6.00, cost: 2.50, category: 'Flooring', sort_order: 80 },
  { id: 'floor-carpet-install', label: 'Carpet Install', unit: 'SQFT', rate: 3.50, cost: 1.25, category: 'Flooring', sort_order: 90 },

  // ─── Tile Work ───────────────────────────────────────────────────
  { id: 'tile-backsplash', label: 'Kitchen Backsplash Tile', unit: 'SQFT', rate: 18.00, cost: 7.50, category: 'Tile Work', sort_order: 10 },
  { id: 'tile-shower-wall', label: 'Shower Wall Tile', unit: 'SQFT', rate: 20.00, cost: 8.00, category: 'Tile Work', sort_order: 20 },
  { id: 'tile-shower-floor', label: 'Shower Floor Tile (mosaic)', unit: 'SQFT', rate: 25.00, cost: 10.00, category: 'Tile Work', sort_order: 30 },
  { id: 'tile-shower-pan', label: 'Shower Pan — Mud Bed', unit: 'EA', rate: 650, cost: 250, category: 'Tile Work', sort_order: 35 },
  { id: 'tile-bathroom-floor', label: 'Bathroom Floor Tile', unit: 'SQFT', rate: 14.00, cost: 5.50, category: 'Tile Work', sort_order: 40 },
  { id: 'tile-accent-wall', label: 'Accent Wall Tile', unit: 'SQFT', rate: 16.00, cost: 6.50, category: 'Tile Work', sort_order: 50 },
  { id: 'tile-grout-regrout', label: 'Regrout Existing Tile', unit: 'SQFT', rate: 8.00, cost: 3.00, category: 'Tile Work', sort_order: 60 },
  { id: 'tile-caulk-reseal', label: 'Caulk & Reseal (tub/shower)', unit: 'EA', rate: 125, cost: 30, category: 'Tile Work', sort_order: 70 },
  { id: 'tile-demo', label: 'Tile Demo & Removal', unit: 'SQFT', rate: 4.00, cost: 1.50, category: 'Tile Work', sort_order: 80 },

  // ─── Interior Painting ───────────────────────────────────────────
  { id: 'paint-interior-wall', label: 'Interior Wall Paint (2 coats)', unit: 'SQFT', rate: 3.00, cost: 1.00, category: 'Painting', sort_order: 10 },
  { id: 'paint-interior-room', label: 'Interior Room Paint (avg 12x12)', unit: 'EA', rate: 450, cost: 150, category: 'Painting', sort_order: 15 },
  { id: 'paint-ceiling', label: 'Ceiling Paint', unit: 'SQFT', rate: 2.50, cost: 0.85, category: 'Painting', sort_order: 20 },
  { id: 'paint-trim', label: 'Trim / Baseboards Paint', unit: 'LF', rate: 3.00, cost: 1.00, category: 'Painting', sort_order: 30 },
  { id: 'paint-door', label: 'Door Paint (per side)', unit: 'EA', rate: 85, cost: 25, category: 'Painting', sort_order: 40 },
  { id: 'paint-cabinet', label: 'Cabinet Painting (per linear ft of face)', unit: 'LF', rate: 45, cost: 18, category: 'Painting', sort_order: 50 },
  { id: 'paint-accent-wall', label: 'Accent Wall (single wall, 2 coats)', unit: 'EA', rate: 200, cost: 65, category: 'Painting', sort_order: 60 },
  { id: 'paint-exterior-wall', label: 'Exterior Paint', unit: 'SQFT', rate: 3.50, cost: 1.25, category: 'Painting', sort_order: 70 },
  { id: 'paint-stain-fence', label: 'Fence Stain / Paint', unit: 'LF', rate: 8.00, cost: 3.00, category: 'Painting', sort_order: 80 },
  { id: 'paint-pressure-wash', label: 'Pressure Wash (before paint)', unit: 'SQFT', rate: 0.50, cost: 0.15, category: 'Painting', sort_order: 90 },
  { id: 'paint-drywall-patch', label: 'Drywall Patch & Texture (per patch)', unit: 'EA', rate: 95, cost: 25, category: 'Painting', sort_order: 95 },

  // ─── Fencing ─────────────────────────────────────────────────────
  { id: 'fence-wood-privacy-6ft', label: 'Wood Privacy Fence — 6ft (new)', unit: 'LF', rate: 38, cost: 18, category: 'Fencing', sort_order: 10 },
  { id: 'fence-wood-privacy-8ft', label: 'Wood Privacy Fence — 8ft (new)', unit: 'LF', rate: 48, cost: 24, category: 'Fencing', sort_order: 15 },
  { id: 'fence-cedar-picket', label: 'Cedar Picket Fence (new)', unit: 'LF', rate: 32, cost: 15, category: 'Fencing', sort_order: 20 },
  { id: 'fence-iron-ornamental', label: 'Iron / Ornamental Fence', unit: 'LF', rate: 55, cost: 28, category: 'Fencing', sort_order: 25 },
  { id: 'fence-repair-section', label: 'Fence Section Repair (per panel)', unit: 'EA', rate: 185, cost: 65, category: 'Fencing', sort_order: 30 },
  { id: 'fence-post-replace', label: 'Fence Post Replace', unit: 'EA', rate: 150, cost: 55, category: 'Fencing', sort_order: 40 },
  { id: 'fence-gate-install', label: 'Gate Install (single walk-through)', unit: 'EA', rate: 350, cost: 125, category: 'Fencing', sort_order: 50 },
  { id: 'fence-gate-double', label: 'Gate Install (double / driveway)', unit: 'EA', rate: 650, cost: 250, category: 'Fencing', sort_order: 55 },
  { id: 'fence-stain-seal', label: 'Fence Stain & Seal', unit: 'LF', rate: 6.00, cost: 2.00, category: 'Fencing', sort_order: 60 },
  { id: 'fence-demo-remove', label: 'Old Fence Demo & Haul-Off', unit: 'LF', rate: 5.00, cost: 2.00, category: 'Fencing', sort_order: 70 },

  // ─── General Handyman ────────────────────────────────────────────
  { id: 'handyman-hourly', label: 'General Handyman — Hourly Rate', unit: 'HR', rate: 85, cost: 35, category: 'General Handyman', sort_order: 10 },
  { id: 'handyman-half-day', label: 'Handyman — Half Day (4 hrs)', unit: 'EA', rate: 299, cost: 130, category: 'General Handyman', sort_order: 20 },
  { id: 'handyman-full-day', label: 'Handyman — Full Day (8 hrs)', unit: 'EA', rate: 549, cost: 250, category: 'General Handyman', sort_order: 30 },
  { id: 'furniture-assembly', label: 'Furniture Assembly', unit: 'HR', rate: 75, cost: 30, category: 'General Handyman', sort_order: 40 },
  { id: 'shelf-install', label: 'Shelf / Floating Shelf Install', unit: 'EA', rate: 65, cost: 20, category: 'General Handyman', sort_order: 50 },
  { id: 'curtain-rod-install', label: 'Curtain Rod / Blinds Install', unit: 'EA', rate: 55, cost: 15, category: 'General Handyman', sort_order: 60 },
  { id: 'mirror-art-hang', label: 'Mirror / Heavy Art Hanging', unit: 'EA', rate: 55, cost: 15, category: 'General Handyman', sort_order: 70 },
  { id: 'caulking-general', label: 'Caulking (kitchen/bath/windows)', unit: 'EA', rate: 95, cost: 20, category: 'General Handyman', sort_order: 80 },
  { id: 'weatherstrip-door', label: 'Door Weatherstripping', unit: 'EA', rate: 65, cost: 18, category: 'General Handyman', sort_order: 90 },
  { id: 'smoke-detector', label: 'Smoke / CO Detector Install', unit: 'EA', rate: 45, cost: 12, category: 'General Handyman', sort_order: 95 },

  // ─── Kitchen & Bath ──────────────────────────────────────────────
  { id: 'faucet-install', label: 'Faucet Install / Replace', unit: 'EA', rate: 165, cost: 50, category: 'Kitchen & Bath', sort_order: 10 },
  { id: 'garbage-disposal', label: 'Garbage Disposal Install', unit: 'EA', rate: 185, cost: 60, category: 'Kitchen & Bath', sort_order: 20 },
  { id: 'toilet-install', label: 'Toilet Install / Replace', unit: 'EA', rate: 195, cost: 65, category: 'Kitchen & Bath', sort_order: 30 },
  { id: 'vanity-install', label: 'Bathroom Vanity Install', unit: 'EA', rate: 350, cost: 120, category: 'Kitchen & Bath', sort_order: 40 },
  { id: 'countertop-install', label: 'Countertop Install (laminate, per LF)', unit: 'LF', rate: 45, cost: 18, category: 'Kitchen & Bath', sort_order: 50 },
  { id: 'countertop-granite', label: 'Granite / Quartz Countertop (per SQFT installed)', unit: 'SQFT', rate: 75, cost: 40, category: 'Kitchen & Bath', sort_order: 55 },
  { id: 'cabinet-hardware', label: 'Cabinet Hardware Install (per piece)', unit: 'EA', rate: 8, cost: 2, category: 'Kitchen & Bath', sort_order: 60 },
  { id: 'towel-bar-tp-holder', label: 'Towel Bar / TP Holder Install', unit: 'EA', rate: 45, cost: 12, category: 'Kitchen & Bath', sort_order: 70 },
  { id: 'shower-head-replace', label: 'Shower Head Replace', unit: 'EA', rate: 75, cost: 20, category: 'Kitchen & Bath', sort_order: 80 },
  { id: 'bath-exhaust-fan', label: 'Bathroom Exhaust Fan Install', unit: 'EA', rate: 225, cost: 75, category: 'Kitchen & Bath', sort_order: 90 },

  // ─── Doors & Windows ─────────────────────────────────────────────
  { id: 'interior-door-install', label: 'Interior Door Install (prehung)', unit: 'EA', rate: 250, cost: 85, category: 'Doors & Windows', sort_order: 10 },
  { id: 'interior-door-slab', label: 'Interior Door — Slab Only Swap', unit: 'EA', rate: 175, cost: 55, category: 'Doors & Windows', sort_order: 15 },
  { id: 'exterior-door-install', label: 'Exterior Door Install', unit: 'EA', rate: 450, cost: 175, category: 'Doors & Windows', sort_order: 20 },
  { id: 'door-knob-deadbolt', label: 'Door Knob / Deadbolt Replace', unit: 'EA', rate: 65, cost: 18, category: 'Doors & Windows', sort_order: 30 },
  { id: 'door-frame-repair', label: 'Door Frame Repair', unit: 'EA', rate: 185, cost: 60, category: 'Doors & Windows', sort_order: 35 },
  { id: 'window-screen-replace', label: 'Window Screen Replace', unit: 'EA', rate: 45, cost: 15, category: 'Doors & Windows', sort_order: 40 },
  { id: 'window-blinds-install', label: 'Window Blinds Install', unit: 'EA', rate: 45, cost: 12, category: 'Doors & Windows', sort_order: 50 },
  { id: 'sliding-door-repair', label: 'Sliding Door Roller / Track Repair', unit: 'EA', rate: 175, cost: 55, category: 'Doors & Windows', sort_order: 60 },
  { id: 'storm-door-install', label: 'Storm Door Install', unit: 'EA', rate: 275, cost: 95, category: 'Doors & Windows', sort_order: 65 },
  { id: 'pet-door-install', label: 'Pet Door Install', unit: 'EA', rate: 195, cost: 65, category: 'Doors & Windows', sort_order: 70 },

  // ─── Lighting & Electrical ───────────────────────────────────────
  { id: 'light-fixture-install', label: 'Light Fixture Install / Replace', unit: 'EA', rate: 95, cost: 30, category: 'Lighting & Electrical', sort_order: 10 },
  { id: 'ceiling-fan-install', label: 'Ceiling Fan Install', unit: 'EA', rate: 165, cost: 55, category: 'Lighting & Electrical', sort_order: 20 },
  { id: 'ceiling-fan-replace', label: 'Ceiling Fan Replace (existing wiring)', unit: 'EA', rate: 125, cost: 40, category: 'Lighting & Electrical', sort_order: 25 },
  { id: 'recessed-light', label: 'Recessed Light (can light) Install', unit: 'EA', rate: 150, cost: 55, category: 'Lighting & Electrical', sort_order: 30 },
  { id: 'dimmer-switch', label: 'Dimmer Switch Install', unit: 'EA', rate: 75, cost: 20, category: 'Lighting & Electrical', sort_order: 40 },
  { id: 'outlet-switch-replace', label: 'Outlet / Switch Replace', unit: 'EA', rate: 55, cost: 15, category: 'Lighting & Electrical', sort_order: 50 },
  { id: 'gfci-outlet', label: 'GFCI Outlet Install', unit: 'EA', rate: 85, cost: 25, category: 'Lighting & Electrical', sort_order: 60 },
  { id: 'usb-outlet', label: 'USB Outlet Install', unit: 'EA', rate: 75, cost: 22, category: 'Lighting & Electrical', sort_order: 65 },
  { id: 'under-cabinet-light', label: 'Under-Cabinet Lighting', unit: 'LF', rate: 25, cost: 10, category: 'Lighting & Electrical', sort_order: 70 },
  { id: 'landscape-lighting', label: 'Landscape / Path Lighting (per fixture)', unit: 'EA', rate: 95, cost: 35, category: 'Lighting & Electrical', sort_order: 80 },
  { id: 'ring-doorbell-install', label: 'Ring / Smart Doorbell Install', unit: 'EA', rate: 85, cost: 25, category: 'Lighting & Electrical', sort_order: 90 },

  // ─── Light Plumbing ──────────────────────────────────────────────
  { id: 'plumb-leak-repair', label: 'Minor Leak Repair', unit: 'EA', rate: 145, cost: 40, category: 'Plumbing', sort_order: 10 },
  { id: 'plumb-drain-clear', label: 'Drain Clearing (snake)', unit: 'EA', rate: 165, cost: 45, category: 'Plumbing', sort_order: 20 },
  { id: 'plumb-shutoff-valve', label: 'Shut-Off Valve Replace', unit: 'EA', rate: 125, cost: 40, category: 'Plumbing', sort_order: 30 },
  { id: 'plumb-supply-line', label: 'Supply Line Replace', unit: 'EA', rate: 95, cost: 30, category: 'Plumbing', sort_order: 40 },
  { id: 'plumb-hose-bib', label: 'Hose Bib / Outdoor Faucet Replace', unit: 'EA', rate: 145, cost: 45, category: 'Plumbing', sort_order: 50 },
  { id: 'plumb-water-heater-flush', label: 'Water Heater Flush & Service', unit: 'EA', rate: 125, cost: 35, category: 'Plumbing', sort_order: 60 },

  // ─── Exterior Services ───────────────────────────────────────────
  { id: 'ext-pressure-wash-driveway', label: 'Pressure Wash — Driveway', unit: 'EA', rate: 175, cost: 50, category: 'Exterior', sort_order: 10 },
  { id: 'ext-pressure-wash-house', label: 'Pressure Wash — House Exterior', unit: 'SQFT', rate: 0.45, cost: 0.12, category: 'Exterior', sort_order: 20 },
  { id: 'ext-pressure-wash-patio', label: 'Pressure Wash — Patio / Deck', unit: 'SQFT', rate: 0.55, cost: 0.15, category: 'Exterior', sort_order: 25 },
  { id: 'ext-gutter-clean', label: 'Gutter Cleaning', unit: 'EA', rate: 150, cost: 40, category: 'Exterior', sort_order: 30 },
  { id: 'ext-gutter-repair', label: 'Gutter Repair (per section)', unit: 'EA', rate: 125, cost: 40, category: 'Exterior', sort_order: 35 },
  { id: 'ext-siding-repair', label: 'Siding Repair (per section)', unit: 'EA', rate: 225, cost: 80, category: 'Exterior', sort_order: 40 },
  { id: 'ext-soffit-repair', label: 'Soffit / Fascia Repair', unit: 'LF', rate: 18, cost: 7, category: 'Exterior', sort_order: 50 },
  { id: 'ext-deck-board-replace', label: 'Deck Board Replace', unit: 'SQFT', rate: 12, cost: 5, category: 'Exterior', sort_order: 60 },
  { id: 'ext-deck-stain-seal', label: 'Deck Stain & Seal', unit: 'SQFT', rate: 3.50, cost: 1.25, category: 'Exterior', sort_order: 70 },
  { id: 'ext-mailbox-install', label: 'Mailbox Install / Replace', unit: 'EA', rate: 125, cost: 40, category: 'Exterior', sort_order: 80 },
  { id: 'ext-garage-door-repair', label: 'Garage Door Minor Repair', unit: 'EA', rate: 175, cost: 55, category: 'Exterior', sort_order: 90 },
  { id: 'ext-garage-opener-install', label: 'Garage Door Opener Install', unit: 'EA', rate: 275, cost: 100, category: 'Exterior', sort_order: 95 },

  // ─── Make Ready / Turnover ───────────────────────────────────────
  { id: 'makeready-standard', label: 'Make Ready — Standard Unit (1BR)', unit: 'EA', rate: 850, cost: 350, category: 'Make Ready', sort_order: 10 },
  { id: 'makeready-2br', label: 'Make Ready — 2BR Unit', unit: 'EA', rate: 1200, cost: 500, category: 'Make Ready', sort_order: 20 },
  { id: 'makeready-3br', label: 'Make Ready — 3BR House', unit: 'EA', rate: 1800, cost: 750, category: 'Make Ready', sort_order: 30 },
  { id: 'makeready-deep-clean', label: 'Deep Clean (add-on)', unit: 'SQFT', rate: 0.35, cost: 0.12, category: 'Make Ready', sort_order: 40 },
  { id: 'makeready-touch-up-paint', label: 'Touch-Up Paint — Whole Unit', unit: 'EA', rate: 350, cost: 120, category: 'Make Ready', sort_order: 50 },
  { id: 'makeready-appliance-clean', label: 'Appliance Deep Clean (per appliance)', unit: 'EA', rate: 45, cost: 12, category: 'Make Ready', sort_order: 60 },

  // ─── Drywall ─────────────────────────────────────────────────────
  { id: 'drywall-patch-small', label: 'Drywall Patch — Small (up to 6")', unit: 'EA', rate: 85, cost: 20, category: 'Drywall', sort_order: 10 },
  { id: 'drywall-patch-medium', label: 'Drywall Patch — Medium (6"–24")', unit: 'EA', rate: 150, cost: 40, category: 'Drywall', sort_order: 20 },
  { id: 'drywall-patch-large', label: 'Drywall Patch — Large (24"+)', unit: 'EA', rate: 250, cost: 75, category: 'Drywall', sort_order: 30 },
  { id: 'drywall-hang-new', label: 'Drywall Hang (new, per sheet)', unit: 'EA', rate: 75, cost: 30, category: 'Drywall', sort_order: 40 },
  { id: 'drywall-tape-mud', label: 'Drywall Tape, Mud & Sand', unit: 'SQFT', rate: 2.50, cost: 0.85, category: 'Drywall', sort_order: 50 },
  { id: 'drywall-texture-match', label: 'Texture Match & Apply', unit: 'SQFT', rate: 3.00, cost: 1.00, category: 'Drywall', sort_order: 60 },
  { id: 'drywall-water-damage', label: 'Water Damage Drywall Repair', unit: 'SQFT', rate: 8.00, cost: 3.00, category: 'Drywall', sort_order: 70 },

  // ─── Miscellaneous / Materials ───────────────────────────────────
  { id: 'misc-trip-charge', label: 'Trip / Service Call Fee', unit: 'EA', rate: 49, cost: 15, category: 'Miscellaneous', sort_order: 10 },
  { id: 'misc-materials-markup', label: 'Materials (at cost + 20%)', unit: 'LOT', rate: 0, cost: 0, category: 'Miscellaneous', sort_order: 20 },
  { id: 'misc-haul-off', label: 'Debris Haul-Off (per truck load)', unit: 'EA', rate: 175, cost: 65, category: 'Miscellaneous', sort_order: 30 },
  { id: 'misc-permit-pull', label: 'Permit Pull (if required)', unit: 'EA', rate: 150, cost: 75, category: 'Miscellaneous', sort_order: 40 },
  { id: 'misc-after-hours', label: 'After-Hours / Weekend Premium', unit: 'HR', rate: 125, cost: 50, category: 'Miscellaneous', sort_order: 50 },
  { id: 'misc-emergency-call', label: 'Emergency / Same-Day Call', unit: 'EA', rate: 149, cost: 50, category: 'Miscellaneous', sort_order: 60 },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const item of items) {
    try {
      await prisma.line_item_master.upsert({
        where: { id: item.id },
        update: { label: item.label, unit: item.unit, rate: item.rate, cost: item.cost, category: item.category, sort_order: item.sort_order, active: true },
        create: { ...item, active: true },
      });
      created++;
    } catch (e: any) {
      console.error('Failed:', item.id, e.message);
      skipped++;
    }
  }
  console.log(`Done: ${created} items upserted, ${skipped} skipped`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
