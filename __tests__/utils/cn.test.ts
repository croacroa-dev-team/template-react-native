import { cn } from "@/utils/cn";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("filters out falsy values", () => {
    const result = cn("base", false && "hidden", null, undefined, "visible");
    expect(result).toBe("base visible");
  });

  it("handles array of classes", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("merges conflicting Tailwind classes correctly", () => {
    // tailwind-merge should keep the last conflicting class
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
  });

  it("handles object syntax", () => {
    const result = cn({
      "class-a": true,
      "class-b": false,
      "class-c": true,
    });
    expect(result).toBe("class-a class-c");
  });
});
