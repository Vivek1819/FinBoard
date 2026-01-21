export type FieldType = "string" | "number" | "boolean";

export type Field = {
  path: string;
  type: FieldType;
};

function getFieldType(value: unknown): FieldType | null {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return null;
}

export function extractFields(
  data: unknown,
  parentPath = ""
): Field[] {
  let fields: Field[] = [];

  if (Array.isArray(data)) {
    if (data.length > 0) {
      fields.push(...extractFields(data[0], parentPath));
    }
    return fields;
  }

  if (typeof data === "object" && data !== null) {
    for (const key of Object.keys(data as object)) {
      const value = (data as any)[key];
      const path = parentPath ? `${parentPath}.${key}` : key;

      const fieldType = getFieldType(value);

      if (fieldType) {
        fields.push({
          path,
          type: fieldType, // ✅ TS-safe
        });
      } else if (typeof value === "object" && value !== null) {
        fields.push(...extractFields(value, path));
      }
    }
  }

  return fields;
}
