import assert from "node:assert/strict";
import { describe, test } from "node:test";
import flattenObject from "../lib/flatten-object.js";

describe("flattenObject should return", () => {
  test("flat object with strings when flat object with strings is passed", () => {
    const data: Record<string, unknown> = {
      foo: "bar",
      bar: "baz"
    };

    const result: Record<string, unknown> = flattenObject(data);
    assert.equal(result["foo"], data["foo"]);
    assert.equal(result["bar"], data["bar"]);
  });

  test("flat object with strings (where keys are prefixed) when flat object with strings is passed and prefix is passed in options", () => {
    const data: Record<string, unknown> = {
      foo: "bar",
      bar: "baz"
    };

    const result: Record<string, unknown> = flattenObject(data, { prefix: "biz" });
    assert.equal(result["bizfoo"], data["foo"]);
    assert.equal(result["bizbar"], data["bar"]);
  });

  test("flat object with arrays-as-is when flat object with arrays is passed", () => {
    const dataFoo: string[] = ["bar", "biz"];
    const dataBar: string[] = ["baz", "boz"];
    const data: Record<string, unknown> = {
      foo: dataFoo,
      bar: dataBar
    };

    const result: Record<string, unknown> = flattenObject(data);
    const resultFoo: string[] = result["foo"] as string[];
    const resultBar: string[] = result["bar"] as string[];

    assert.equal(resultFoo.length, dataFoo.length);
    assert.equal(resultBar.length, dataBar.length);
    assert.equal(resultFoo[0], dataFoo[0]);
    assert.equal(resultBar[0], dataBar[0]);
    assert.equal(resultFoo[1], dataFoo[1]);
    assert.equal(resultBar[1], dataBar[1]);
  });

  test("flat object with arrays-prefixed when flat object with arrays is passed and prefix is passed in options", () => {
    const dataFoo: string[] = ["bar", "biz"];
    const dataBar: string[] = ["baz", "boz"];
    const data: Record<string, unknown> = {
      foo: dataFoo,
      bar: dataBar
    };

    const result: Record<string, unknown> = flattenObject(data, { prefix: "biz" });
    const resultFoo: string[] = result["bizfoo"] as string[];
    const resultBar: string[] = result["bizbar"] as string[];

    assert.equal(resultFoo.length, dataFoo.length);
    assert.equal(resultBar.length, dataBar.length);
    assert.equal(resultFoo[0], dataFoo[0]);
    assert.equal(resultBar[0], dataBar[0]);
    assert.equal(resultFoo[1], dataFoo[1]);
    assert.equal(resultBar[1], dataBar[1]);
  });

  test("flat object with flattened-arrays-prefixed when flat object with arrays is passed and prefix is passed in options", () => {
    const dataFoo: string[] = ["bar", "biz"];
    const dataBar: string[] = ["baz", "boz"];
    const data: Record<string, unknown> = {
      foo: dataFoo,
      bar: dataBar
    };

    const result: Record<string, unknown> = flattenObject(data, { prefix: "biz", flattenArray: true });
    const resultValues: [string, string][] = Object.entries(result) as [string, string][];

    assert.equal(resultValues[0][0], "bizfoo.bizfoo[0]");
    assert.equal(resultValues[0][1], dataFoo[0]);
    assert.equal(resultValues[1][0], "bizfoo.bizfoo[1]");
    assert.equal(resultValues[1][1], dataFoo[1]);

    assert.equal(resultValues[2][0], "bizbar.bizbar[0]");
    assert.equal(resultValues[2][1], dataBar[0]);
    assert.equal(resultValues[3][0], "bizbar.bizbar[1]");
    assert.equal(resultValues[3][1], dataBar[1]);
  });
});
