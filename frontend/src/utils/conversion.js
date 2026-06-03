// src/utils/conversion.js — Unit Conversion Utility (Frontend mirror of backend)
// Used for live price calculation in the order form

/**
 * Converts a quantity from the given unit to the product's base unit.
 * Base units: Weight → grams (g), Volume → milliliters (ml), Count → items (item)
 *
 * Examples:
 *   convertToBaseUnit(2, 'kg')  → 2000  (2 kg = 2000 g)
 *   convertToBaseUnit(1.5, 'l') → 1500  (1.5 L = 1500 mL)
 *   convertToBaseUnit(10, 'g')  → 10    (already base unit)
 */
export function convertToBaseUnit(qty, unit) {
  const factors = {
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
    item: 1,
  };
  const factor = factors[unit?.toLowerCase()];
  if (!factor) return qty;
  return qty * factor;
}

/**
 * Returns the available ordering units for a given base unit.
 */
export function getOrderingUnits(baseUnit) {
  if (baseUnit === 'g') return [{ value: 'g', label: 'Grams (g)' }, { value: 'kg', label: 'Kilograms (kg)' }];
  if (baseUnit === 'ml') return [{ value: 'ml', label: 'Milliliters (mL)' }, { value: 'l', label: 'Liters (L)' }];
  return [{ value: 'item', label: 'Items (pc)' }];
}
