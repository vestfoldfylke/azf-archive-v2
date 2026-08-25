/**
 *
 * @param {Object} obj - object that you want to flatten
 * @param {string} [options.prefix=''] - prefix for all property-names
 * @param {string} [options.flattenArray=false] - if you want to flatten arrays as well
 * @returns flattened object
 */
type FlattenOptions = { prefix?: string; flattenArray?: boolean };

const flattenObject = (obj: Record<string, unknown>, options: FlattenOptions = {}): Record<string, unknown> => {
  if (!options.prefix) options.prefix = "";
  if (!options.flattenArray) options.flattenArray = false;
  const flattened: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value as Record<string, unknown>, { prefix: `${options.prefix}${key}.`, flattenArray: options.flattenArray }));
    } else if (options.flattenArray && Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenObject(
          value.reduce(
            (a, v, i) => {
              a[`${options.prefix}${key}[${i}]`] = v;

              return a;
            },
            {} as Record<string, unknown>
          ),
          { prefix: `${options.prefix}${key}.`, flattenArray: options.flattenArray }
        )
      );
    } else {
      flattened[`${options.prefix}${key}`] = value;
    }
  });
  return flattened;
};

export default flattenObject;
