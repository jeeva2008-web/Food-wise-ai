import { FoodRecord } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFoodRecord(
  data: Partial<FoodRecord>,
  existingRecords: FoodRecord[] = [],
  currentRecordId?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Food Name check
  if (!data.foodName || data.foodName.trim().length === 0) {
    errors.push('Food name is required.');
  }

  // Category check
  if (!data.category) {
    errors.push('Food category is required.');
  }

  // Numerical constraints
  const prepared = Number(data.quantityPreparedKg);
  const served = Number(data.quantityServedKg);
  const remaining = Number(data.quantityRemainingKg);
  const reused = Number(data.quantityReusedKg ?? 0);
  const redist = Number(data.quantityRedistributedKg ?? 0);
  const discarded = Number(data.quantityDiscardedKg ?? 0);
  const attendance = Number(data.studentAttendance ?? 0);
  const expectedServings = Number(data.expectedDemandServings ?? 0);

  if (isNaN(prepared) || prepared <= 0) {
    errors.push('Quantity prepared must be a positive number greater than 0 kg.');
  }

  if (isNaN(served) || served < 0) {
    errors.push('Quantity served cannot be negative.');
  }

  if (isNaN(remaining) || remaining < 0) {
    errors.push('Quantity remaining cannot be negative.');
  }

  if (served > prepared) {
    errors.push(`Quantity served (${served} kg) cannot exceed quantity prepared (${prepared} kg).`);
  }

  // Mass balance check: prepared = served + remaining
  const calculatedRemaining = Math.round((prepared - served) * 100) / 100;
  if (!isNaN(prepared) && !isNaN(served) && !isNaN(remaining)) {
    const balanceDelta = Math.abs(prepared - (served + remaining));
    if (balanceDelta > 0.05) {
      warnings.push(
        `Mass balance discrepancy detected: Prepared (${prepared} kg) does not equal Served (${served} kg) + Remaining (${remaining} kg). Expected remaining is ${calculatedRemaining} kg.`
      );
    }
  }

  // Disposal limits: reused + redistributed + discarded <= remaining
  const totalDisposed = reused + redist + discarded;
  if (totalDisposed > remaining + 0.05) {
    errors.push(
      `Total handled surplus (Reused: ${reused}kg + Redistributed: ${redist}kg + Discarded: ${discarded}kg = ${totalDisposed.toFixed(1)}kg) exceeds available leftover (${remaining}kg).`
    );
  }

  if (attendance < 0) {
    errors.push('Student attendance count cannot be negative.');
  }

  if (expectedServings < 0) {
    errors.push('Expected demand in servings cannot be negative.');
  }

  // Date and Time validations
  if (!data.preparationDateTime) {
    errors.push('Preparation date and time is required.');
  } else {
    const prepDate = new Date(data.preparationDateTime);
    if (isNaN(prepDate.getTime())) {
      errors.push('Preparation date and time is not a valid date.');
    } else {
      if (data.useByDateTime) {
        const useByDate = new Date(data.useByDateTime);
        if (isNaN(useByDate.getTime())) {
          errors.push('Use-by date and time is not a valid date.');
        } else if (useByDate.getTime() < prepDate.getTime()) {
          errors.push('Use-by date cannot be earlier than preparation date.');
        }
      } else {
        warnings.push('No use-by datetime provided. Recommended for perishable cooked canteen foods.');
      }
    }
  }

  // Duplicate record detection
  if (data.foodName && data.preparationDateTime) {
    const duplicate = existingRecords.find(
      (r) =>
        r.id !== currentRecordId &&
        r.foodName.trim().toLowerCase() === data.foodName!.trim().toLowerCase() &&
        r.preparationDateTime === data.preparationDateTime
    );
    if (duplicate) {
      errors.push(
        `Duplicate record detected: An entry for "${data.foodName}" at "${data.preparationDateTime}" already exists (ID: ${duplicate.id}).`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
