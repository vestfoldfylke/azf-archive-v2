import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { repackAddress } from "../lib/repack-brreg-result.js";

describe("repackAddress returns as expected when", () => {
  test("address has one element and is string", () => {
    const addressList = ["gata 4"];
    const repackedAddress = repackAddress(addressList);
    assert.equal(repackedAddress, "gata 4");
  });
  test("address has four elements and one element is falsy", () => {
    const addressList = ["gata 4", "hei", null, "hepp"];
    const repackedAddress = repackAddress(addressList);
    assert.equal(repackedAddress, "gata 4, hei, hepp");
  });
  test("address has three elements and one is empty string", () => {
    const addressList = ["gata 4", "", "hei"];
    const repackedAddress = repackAddress(addressList);
    assert.equal(repackedAddress, "gata 4, hei");
  });
  test("address is empty", () => {
    const addressList = [];
    const repackedAddress = repackAddress(addressList);
    assert.equal(repackedAddress, "");
  });
});
