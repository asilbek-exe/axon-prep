import { describe, expect, it } from "vitest";
import { appPath, questionHref, sitePath } from "@/lib/paths";

describe("static hosting paths", () => {
  it("normalizes project URLs without stripping unrelated prefixes", () => {
    expect(appPath("/axon-prep/dashboard/", "/axon-prep")).toBe("/dashboard");
    expect(appPath("/axon-prep/", "/axon-prep")).toBe("/");
    expect(appPath("/axon-prep-other/", "/axon-prep")).toBe("/axon-prep-other");
    expect(appPath("/questions/intro/", "/axon-prep")).toBe("/questions/intro");
  });
  it("uses a prebuilt editor route for browser-created question IDs", () => {
    expect(questionHref("custom / ? &")).toBe(
      "/questions/edit?id=custom%20%2F%20%3F%20%26",
    );
  });
  it("leaves external source URLs intact", () => {
    expect(sitePath("https://www.axon.com/")).toBe("https://www.axon.com/");
  });
});
