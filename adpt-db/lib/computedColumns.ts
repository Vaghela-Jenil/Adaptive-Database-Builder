import { ComputedColumnField, ComputedColumnOperation } from "@/components/DatabaseBuilder/ComputedColumnPanel";
import { FieldAttributes } from "@/components/DatabaseBuilder/types";

export const parseNumericValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return null;
    const converted = Number(normalized);
    return Number.isFinite(converted) ? converted : null;
  }
  return null;
};

export const computeColumnValue = (
  recordData: Record<string, any>,
  column: ComputedColumnField,
  fields: FieldAttributes[]
): string | number | null => {
  try {
    const sourceFieldsData = column.sourceFields
      .map((fieldId) => recordData[fieldId])
      .filter((v) => v !== undefined && v !== null);

    if (sourceFieldsData.length === 0) {
      return null;
    }

    switch (column.operation) {
      case "average": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length === 0) return null;
        const sum = numericValues.reduce((a, b) => a + b, 0);
        return Number((sum / numericValues.length).toFixed(2));
      }

      case "sum": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length === 0) return null;
        return Number(
          numericValues.reduce((a, b) => a + b, 0).toFixed(2)
        );
      }

      case "concatenate": {
        return sourceFieldsData
          .map((v) => String(v).trim())
          .filter((v) => v.length > 0)
          .join(" ");
      }

      case "add": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length < 2) return null;

        if (column.formula) {
          return evaluateFormula(column.formula, numericValues);
        }

        return Number(numericValues.reduce((a, b) => a + b, 0).toFixed(2));
      }

      case "subtract": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length < 2) return null;

        if (column.formula) {
          return evaluateFormula(column.formula, numericValues);
        }

        let result = numericValues[0];
        for (let i = 1; i < numericValues.length; i++) {
          result -= numericValues[i];
        }
        return Number(result.toFixed(2));
      }

      case "multiply": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length < 2) return null;

        if (column.formula) {
          return evaluateFormula(column.formula, numericValues);
        }

        const result = numericValues.reduce((a, b) => a * b, 1);
        return Number(result.toFixed(2));
      }

      case "divide": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length < 2) return null;

        // Check for division by zero
        for (let i = 1; i < numericValues.length; i++) {
          if (numericValues[i] === 0) {
            return null;
          }
        }

        if (column.formula) {
          return evaluateFormula(column.formula, numericValues);
        }

        let result = numericValues[0];
        for (let i = 1; i < numericValues.length; i++) {
          result /= numericValues[i];
        }
        return Number(result.toFixed(2));
      }

      case "modulus": {
        const numericValues = sourceFieldsData
          .map((v) => parseNumericValue(v))
          .filter((v): v is number => v !== null);

        if (numericValues.length < 2) return null;

        // Check for modulus by zero
        for (let i = 1; i < numericValues.length; i++) {
          if (numericValues[i] === 0) {
            return null;
          }
        }

        let result = numericValues[0];
        for (let i = 1; i < numericValues.length; i++) {
          result = result % numericValues[i];
        }
        return Number(result.toFixed(2));
      }

      default:
        return null;
    }
  } catch (error) {
    console.error("Error computing column value:", error);
    return null;
  }
};

export const evaluateFormula = (
  formula: string,
  values: number []
): number | null => {
  try {
    let evaluableFormula = formula;

    // Replace field numbers (1, 2, 3...) with actual values
    for (let i = 1; i <= values.length; i++) {
      // Use word boundary to avoid replacing numbers within larger numbers
      const regex = new RegExp(`\\b${i}\\b`, "g");
      evaluableFormula = evaluableFormula.replace(regex, `(${values[i - 1]})`);
    }

    // Validate formula contains only allowed characters
    if (!/^[0-9\s\(\)\+\-\*\/\.%]+$/.test(evaluableFormula)) {
      return null;
    }

    // Use Function constructor for safe evaluation (still risky, but safer than eval)
    // Better approach: use a math expression parser
    const result = Function('"use strict"; return (' + evaluableFormula + ')')();
    
    if (typeof result === "number" && Number.isFinite(result)) {
      return Number(result.toFixed(2));
    }
    return null;
  } catch (error) {
    console.error("Error evaluating formula:", error);
    return null;
  }
};

export const validateComputedColumn = (
  column: ComputedColumnField,
  fields: FieldAttributes[]
): { valid: boolean; error?: string } => {
  // Check if column name is valid
  if (!column.name || column.name.trim().length === 0) {
    return { valid: false, error: "Column name is required" };
  }

  // Check if column name already exists
  if (fields.some((f) => f.label.toLowerCase() === column.name.toLowerCase())) {
    return { valid: false, error: "A field with this name already exists" };
  }

  // Check if sourceFields are valid
  if (!column.sourceFields || column.sourceFields.length === 0) {
    return { valid: false, error: "No source fields selected" };
  }

  // Verify all source fields exist
  const invalidFields = column.sourceFields.filter(
    (fieldId) => !fields.some((f) => f.id === fieldId)
  );

  if (invalidFields.length > 0) {
    return {
      valid: false,
      error: `Invalid fields: ${invalidFields.join(", ")}`,
    };
  }

  return { valid: true };
};
