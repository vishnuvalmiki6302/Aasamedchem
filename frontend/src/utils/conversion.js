// src/utils/conversion.js — Unit Conversion Utility (Frontend mirror of backend)
// Used for live price calculation in the order form

/**
 * Converts a quantity from the given unit to the product's base unit.
 * Base units: Weight → grams (g), Volume → milliliters (ml), Count → items (item)
 *
 * @param {number|string} qty - The quantity to convert
 * @param {string} unit - The unit string
 * @returns {number} The converted quantity in base units
 */
export function convertToBaseUnit(qty, unit) {
  const numericQty = Number(qty);
  if (isNaN(numericQty) || numericQty < 0) return 0; // Return 0 safely on frontend

  const factors = {
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
    item: 1,
  };
  
  const factor = factors[unit?.toLowerCase()?.trim()];
  if (!factor) return numericQty; // Fallback to raw qty if unit is invalid
  
  return numericQty * factor;
}

/**
 * Returns the available ordering units for a given base unit.
 */
export function getOrderingUnits(baseUnit) {
  if (baseUnit === 'g') return [{ value: 'g', label: 'Grams (g)' }, { value: 'kg', label: 'Kilograms (kg)' }];
  if (baseUnit === 'ml') return [{ value: 'ml', label: 'Milliliters (mL)' }, { value: 'l', label: 'Liters (L)' }];
  return [{ value: 'item', label: 'Items (pc)' }];
}
