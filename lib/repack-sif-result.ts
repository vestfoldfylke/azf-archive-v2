import type { SIFOptions, SIFRawResponse } from "../types/sif.js";

type SIFResult = {
  Status: string;
};

const excludeRepackProperties: string[] = ["ErrorDetails", "ErrorMessage", "Successful", "TotalCount", "TotalPageCount", "NextDeltaLastDate"];

const hasSifError = (response: SIFRawResponse): boolean => {
  if (Object.hasOwn(response, "Successful") && !response.Successful) {
    return true;
  }

  return Object.hasOwn(response, "ErrorMessage") && typeof response.ErrorMessage === "string" && response.ErrorMessage.trim().length > 0 && response.ErrorMessage !== "\n";
};

const repackUglySifError = (response: SIFRawResponse): SIFRawResponse => {
  response.ErrorMessage =
    response.ErrorMessage && typeof response.ErrorMessage === "string" && response.ErrorMessage.includes("Exception:")
      ? response.ErrorMessage.split("Exception:")[1].split("<operation>")[0]
      : response.ErrorMessage;

  if (response.ErrorMessage) {
    response.ErrorMessage = response.ErrorMessage.replace(/\\"/g, "").replace(/'/g, "").replace(/"/g, "").replace(/"/g, "`").trim();
  }

  return response;
};

const repackSifResult = (sifResult: SIFRawResponse): unknown => {
  const keysToInclude: string[] = Object.keys(sifResult).filter((key: string) => !excludeRepackProperties.includes(key));
  if (keysToInclude.length === 0) {
    return null; // No data
  }

  if (keysToInclude.length > 1) {
    return sifResult; // More than one property - return all data WHY did i do this... oh well
  }

  return sifResult[keysToInclude[0]];
};

const filterSifResult = (result: unknown[], options: SIFOptions): unknown | unknown[] | null => {
  if (!options) {
    throw new Error("No options provided to filterSifResult");
  }

  let filteredResult: unknown[] = [...result];

  // Only open or exclude expired Cases Option
  if (options.onlyOpenCases) {
    filteredResult = filteredResult.filter((e: unknown) => (e as unknown as SIFResult).Status === "Under behandling");
  } else if (options.excludeExpiredCases) {
    filteredResult = filteredResult.filter((e: unknown) => (e as unknown as SIFResult).Status !== "Utgår");
  }

  // Limit options
  if (options.limit === 1) {
    if (filteredResult.length > 0) {
      return filteredResult[0];
    }

    return null; // jaja...
  }

  if (options.limit && options.limit > 1) {
    return filteredResult.slice(0, options.limit);
  }

  return result;
};

export { filterSifResult, hasSifError, repackSifResult, repackUglySifError };
