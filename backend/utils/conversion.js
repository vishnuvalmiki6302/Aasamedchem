// utils/conversion.js — Unit Conversion Utility (Backend)
// This is the SINGLE source of truth for unit conversions in the backend.

/**
 * Converts a quantity from the given unit to the product's base unit.
 *
 * @param {number} qty - The quantity to convert (must be a positive number)
 * @param {string} unit - The unit to convert from (e.g., 'kg', 'l', 'g', 'ml', 'item')
 * @returns {number} The quantity converted to the base unit
 * @throws {Error} If the quantity is invalid or the unit is unknown
 */
const convertToBaseUnit = (qty, unit) => {
  // Input validation
  const numericQty = Number(qty);
  if (isNaN(numericQty) || numericQty <= 0) {
    throw new Error(`Invalid quantity provided: ${qty}. Must be a positive number.`);
  }

  if (!unit || typeof unit !== 'string') {
    throw new Error('Unit must be a valid string.');
  }

  // Conversion factors: how many BASE UNITS equal 1 of this unit
  const factors = {
    g: 1,       // 1 gram = 1 gram (base)
    kg: 1000,   // 1 kg = 1000 grams
    ml: 1,      // 1 mL = 1 mL (base)
    l: 1000,    // 1 L = 1000 mL
    item: 1,    // 1 item = 1 item (base)
  };

  const factor = factors[unit.toLowerCase().trim()];

  if (!factor) {
    throw new Error(`Unknown or unsupported unit: "${unit}"`);
  }

  return numericQty * factor;
};

module.exports = { convertToBaseUnit };
