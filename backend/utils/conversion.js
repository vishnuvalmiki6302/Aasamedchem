// utils/conversion.js — Unit Conversion Utility (Backend)
// This is the SINGLE source of truth for unit conversions in the backend.
// The frontend has an identical copy in frontend/src/utils/conversion.js

/**
 * Converts a quantity from the given unit to the product's base unit.
 *
 * Base units:
 *   Weight → grams (g)
 *   Volume → milliliters (ml)
 *   Count  → items (item)
 *
 * Examples:
 *   convertToBaseUnit(2, 'kg')   → 2000   (2 kg = 2000 g)
 *   convertToBaseUnit(500, 'ml') → 500    (already in base unit)
 *   convertToBaseUnit(1.5, 'l')  → 1500   (1.5 L = 1500 mL)
 *   convertToBaseUnit(10, 'g')   → 10     (already in base unit)
 */
const convertToBaseUnit = (qty, unit) => {
  // Conversion factors: how many BASE UNITS equal 1 of this unit
  const factors = {
    g: 1,       // 1 gram = 1 gram (base)
    kg: 1000,   // 1 kg = 1000 grams
    ml: 1,      // 1 mL = 1 mL (base)
    l: 1000,    // 1 L = 1000 mL
    item: 1,    // 1 item = 1 item (base)
  };

  const factor = factors[unit.toLowerCase()];

  if (!factor) {
    throw new Error(`Unknown unit: ${unit}`);
  }

  return qty * factor;
};

module.exports = { convertToBaseUnit };
