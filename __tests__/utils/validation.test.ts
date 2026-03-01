import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
} from "@/utils/validation";

describe("Validation Schemas", () => {
  describe("emailSchema", () => {
    it("accepts a valid email", () => {
      expect(emailSchema.safeParse("user@example.com").success).toBe(true);
    });

    it("rejects empty string", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      expect(emailSchema.safeParse("not-an-email").success).toBe(false);
      expect(emailSchema.safeParse("@missing-user.com").success).toBe(false);
      expect(emailSchema.safeParse("user@").success).toBe(false);
    });
  });

  describe("passwordSchema", () => {
    const validPassword = "MyP@ssw0rd";

    it("accepts a valid password", () => {
      expect(passwordSchema.safeParse(validPassword).success).toBe(true);
    });

    it("rejects empty string", () => {
      expect(passwordSchema.safeParse("").success).toBe(false);
    });

    it("rejects passwords shorter than 8 characters", () => {
      expect(passwordSchema.safeParse("Ab1!").success).toBe(false);
    });

    it("rejects passwords without uppercase letter", () => {
      expect(passwordSchema.safeParse("myp@ssw0rd").success).toBe(false);
    });

    it("rejects passwords without lowercase letter", () => {
      expect(passwordSchema.safeParse("MYP@SSW0RD").success).toBe(false);
    });

    it("rejects passwords without a number", () => {
      expect(passwordSchema.safeParse("MyP@ssword").success).toBe(false);
    });

    it("rejects passwords without a special character", () => {
      expect(passwordSchema.safeParse("MyPassw0rd").success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid login data", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anything",
      });
      expect(result.success).toBe(true);
    });

    it("requires email", () => {
      const result = loginSchema.safeParse({ email: "", password: "test" });
      expect(result.success).toBe(false);
    });

    it("requires password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("does not enforce password complexity (only registration does)", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "simple",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("registerSchema", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      password: "MyP@ssw0rd",
      confirmPassword: "MyP@ssw0rd",
    };

    it("accepts valid registration data", () => {
      expect(registerSchema.safeParse(validData).success).toBe(true);
    });

    it("rejects when passwords don't match", () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: "Different1!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."));
        expect(paths).toContain("confirmPassword");
      }
    });

    it("enforces password complexity", () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: "weak",
        confirmPassword: "weak",
      });
      expect(result.success).toBe(false);
    });

    it("requires name with minimum 2 characters", () => {
      const result = registerSchema.safeParse({
        ...validData,
        name: "J",
      });
      expect(result.success).toBe(false);
    });
  });
});
