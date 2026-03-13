import {
  maskValue,
  maskEmail,
  maskName,
  maskPhone,
  maskAccountNumber,
  maskSSN,
} from "../src/masking";

describe("masking", () => {
  describe("maskValue", () => {
    it("masks all but last 4 characters by default", () => {
      expect(maskValue("1234567890")).toBe("******7890");
    });

    it("masks with custom visible chars", () => {
      expect(maskValue("1234567890", 2)).toBe("********90");
    });

    it("fully masks values shorter than visible chars", () => {
      expect(maskValue("ab")).toBe("**");
    });
  });

  describe("maskEmail", () => {
    it("masks the local part of an email", () => {
      const masked = maskEmail("robert.mitchell95@yahoo.com");
      expect(masked).toBe("ro***************@yahoo.com");
    });

    it("handles short local parts", () => {
      const masked = maskEmail("ab@example.com");
      expect(masked).toBe("ab@example.com");
    });
  });

  describe("maskName", () => {
    it("masks first and last name keeping only first character", () => {
      expect(maskName("Robert", "Mitchell")).toBe("R***** M*******");
    });
  });

  describe("maskPhone", () => {
    it("masks phone number keeping last 4 digits", () => {
      const masked = maskPhone("(207) 977-3615");
      expect(masked).toBe("******3615");
    });
  });

  describe("maskAccountNumber", () => {
    it("masks account number keeping last 4 digits", () => {
      expect(maskAccountNumber("00133890838")).toBe("*******0838");
    });
  });

  describe("maskSSN", () => {
    it("fully masks SSN", () => {
      expect(maskSSN("559-76-4558")).toBe("***-**-****");
    });
  });
});
