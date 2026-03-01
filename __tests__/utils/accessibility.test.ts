import {
  buttonA11y,
  linkA11y,
  inputA11y,
  toggleA11y,
  headerA11y,
  imageA11y,
  listItemA11y,
  progressA11y,
  tabA11y,
  alertA11y,
} from "@/utils/accessibility";

describe("Accessibility Builder Functions", () => {
  describe("buttonA11y", () => {
    it("returns button role and label", () => {
      const props = buttonA11y("Submit");

      expect(props.accessible).toBe(true);
      expect(props.accessibilityRole).toBe("button");
      expect(props.accessibilityLabel).toBe("Submit");
    });

    it("sets disabled state when disabled", () => {
      const props = buttonA11y("Submit", { disabled: true });

      expect(props.accessibilityState?.disabled).toBe(true);
    });

    it("sets busy state when loading", () => {
      const props = buttonA11y("Submit", { loading: true });

      expect(props.accessibilityState?.busy).toBe(true);
      expect(props.accessibilityState?.disabled).toBe(true);
    });

    it("includes hint when provided", () => {
      const props = buttonA11y("Submit", { hint: "Double tap to submit" });

      expect(props.accessibilityHint).toBe("Double tap to submit");
    });

    it("includes testID when provided", () => {
      const props = buttonA11y("Submit", { testID: "submit-btn" });

      expect(props.testID).toBe("submit-btn");
    });
  });

  describe("linkA11y", () => {
    it("returns link role with default hint", () => {
      const props = linkA11y("Learn more");

      expect(props.accessibilityRole).toBe("link");
      expect(props.accessibilityLabel).toBe("Learn more");
      expect(props.accessibilityHint).toBe("Double tap to open");
    });

    it("allows custom hint", () => {
      const props = linkA11y("Website", { hint: "Opens in browser" });

      expect(props.accessibilityHint).toBe("Opens in browser");
    });
  });

  describe("inputA11y", () => {
    it("returns label with default hint", () => {
      const props = inputA11y("Email");

      expect(props.accessible).toBe(true);
      expect(props.accessibilityLabel).toBe("Email");
      expect(props.accessibilityHint).toBe("Double tap to edit");
    });

    it("appends required to label", () => {
      const props = inputA11y("Email", { required: true });

      expect(props.accessibilityLabel).toBe("Email, required");
    });

    it("appends error to label", () => {
      const props = inputA11y("Email", { error: "Invalid email" });

      expect(props.accessibilityLabel).toBe("Email, error: Invalid email");
    });

    it("appends both required and error", () => {
      const props = inputA11y("Email", {
        required: true,
        error: "Required field",
      });

      expect(props.accessibilityLabel).toBe(
        "Email, required, error: Required field"
      );
    });
  });

  describe("toggleA11y", () => {
    it("returns checkbox role with checked state", () => {
      const props = toggleA11y("Dark mode", true);

      expect(props.accessibilityRole).toBe("checkbox");
      expect(props.accessibilityState?.checked).toBe(true);
      expect(props.accessibilityHint).toBe("Double tap to uncheck");
    });

    it("updates hint when unchecked", () => {
      const props = toggleA11y("Dark mode", false);

      expect(props.accessibilityState?.checked).toBe(false);
      expect(props.accessibilityHint).toBe("Double tap to check");
    });

    it("sets disabled state", () => {
      const props = toggleA11y("Locked", true, { disabled: true });

      expect(props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe("headerA11y", () => {
    it("returns header role with level", () => {
      const props = headerA11y("Settings");

      expect(props.accessibilityRole).toBe("header");
      expect(props.accessibilityLabel).toBe("Settings, heading level 1");
    });

    it("supports custom heading level", () => {
      const props = headerA11y("Subsection", 3);

      expect(props.accessibilityLabel).toBe("Subsection, heading level 3");
    });
  });

  describe("imageA11y", () => {
    it("returns image role with description", () => {
      const props = imageA11y("User avatar");

      expect(props.accessibilityRole).toBe("image");
      expect(props.accessibilityLabel).toBe("User avatar");
      expect(props.accessible).toBe(true);
    });

    it("marks decorative images as not accessible", () => {
      const props = imageA11y("decoration", { isDecorative: true });

      expect(props.accessible).toBe(false);
    });
  });

  describe("listItemA11y", () => {
    it("includes position info in label", () => {
      const props = listItemA11y("Item A", 2, 5);

      expect(props.accessibilityLabel).toBe("Item A, 2 of 5");
    });

    it("sets selected state", () => {
      const props = listItemA11y("Item A", 1, 3, { selected: true });

      expect(props.accessibilityState?.selected).toBe(true);
    });
  });

  describe("progressA11y", () => {
    it("returns progressbar role with percentage", () => {
      const props = progressA11y("Upload", 50);

      expect(props.accessibilityRole).toBe("progressbar");
      expect(props.accessibilityLabel).toBe("Upload, 50% complete");
      expect(props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 50,
        text: "50%",
      });
    });

    it("calculates percentage with custom min/max", () => {
      const props = progressA11y("Download", 75, { min: 50, max: 100 });

      expect(props.accessibilityLabel).toBe("Download, 50% complete");
      expect(props.accessibilityValue?.now).toBe(75);
    });
  });

  describe("tabA11y", () => {
    it("returns tab role with position and selection", () => {
      const props = tabA11y("Home", true, 1, 3);

      expect(props.accessibilityRole).toBe("tab");
      expect(props.accessibilityLabel).toBe("Home, tab 1 of 3");
      expect(props.accessibilityState?.selected).toBe(true);
    });

    it("marks unselected tabs", () => {
      const props = tabA11y("Settings", false, 3, 3);

      expect(props.accessibilityState?.selected).toBe(false);
    });
  });

  describe("alertA11y", () => {
    it("returns alert role", () => {
      const props = alertA11y("Something went wrong");

      expect(props.accessibilityRole).toBe("alert");
      expect(props.accessibilityLabel).toBe("Something went wrong");
    });

    it("prepends type to label", () => {
      const props = alertA11y("Saved successfully", { type: "success" });

      expect(props.accessibilityLabel).toBe("success: Saved successfully");
    });

    it("handles error type", () => {
      const props = alertA11y("Connection lost", { type: "error" });

      expect(props.accessibilityLabel).toBe("error: Connection lost");
    });
  });
});
