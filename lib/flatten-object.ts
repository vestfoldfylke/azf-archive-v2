type FlattenOptions = {
  /** prefix for all property-names */
  prefix?: string;
  /** if you want to flatten arrays as well */
  flattenArray?: boolean;
};

const flattenObject = (obj: Record<string, unknown>, options: FlattenOptions = {}): Record<string, unknown> => {
  if (!options.prefix) {
    options.prefix = "";
  }
  if (!options.flattenArray) {
    options.flattenArray = false;
  }

  const flattened: Record<string, unknown> = {};

  Object.keys(obj).forEach((key: string) => {
    const value: unknown | unknown[] = obj[key];

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value as Record<string, unknown>, { prefix: `${options.prefix}${key}.`, flattenArray: options.flattenArray }));
      return;
    }

    if (options.flattenArray && value !== null && Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenObject(
          value.reduce(
            (a, v, i: number) => {
              a[`${options.prefix}${key}[${i}]`] = v;

              return a;
            },
            {} as Record<string, unknown>
          ),
          { prefix: `${options.prefix}${key}.`, flattenArray: options.flattenArray }
        )
      );

      return;
    }

    flattened[`${options.prefix}${key}`] = value;
  });

  return flattened;
};

export default flattenObject;
