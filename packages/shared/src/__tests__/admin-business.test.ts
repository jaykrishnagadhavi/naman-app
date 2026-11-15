import { describe, it, expect } from 'vitest';
import {
  escapeCsvCell,
  generateCsv,
  calculateCouponDiscount,
  CouponFormSchema,
  BlockStudentSchema,
  AddTeamMemberSchema,
  ChangeTeamRoleSchema,
  ROLE_PERMISSIONS,
} from '../index';

describe('Admin Business & Security Unit Tests (Step 9)', () => {
  // =========================================================================
  // 1. CSV Formula Injection Protection Tests (CWE-1236)
  // =========================================================================
  describe('CSV Formula Injection Escaping', () => {
    it('prefixes formula trigger characters with a single quote', () => {
      expect(escapeCsvCell('=1+1')).toBe("'=1+1");
      expect(escapeCsvCell('+SUM(A1:A10)')).toBe("'+SUM(A1:A10)");
      expect(escapeCsvCell('-20')).toBe("'-20");
      expect(escapeCsvCell('@cmd|/c')).toBe("'@cmd|/c");
      expect(escapeCsvCell('\tmalicious')).toBe("'\tmalicious");
    });

    it('handles standard RFC 4180 commas, quotes, and newlines', () => {
      expect(escapeCsvCell('Hello, World')).toBe('"Hello, World"');
      expect(escapeCsvCell('He said "Hello"')).toBe('"He said ""Hello"""');
      expect(escapeCsvCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    it('safely processes normal non-malicious values', () => {
      expect(escapeCsvCell('Naman Sharma')).toBe('Naman Sharma');
      expect(escapeCsvCell(12345)).toBe('12345');
      expect(escapeCsvCell(true)).toBe('true');
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
    });

    it('generates well-formed CSV rows with injection immunity', () => {
      const headers = ['Name', 'Email', 'Formula Attack'];
      const rows = [
        ['John Doe', 'john@example.com', '=cmd|calc.exe'],
        ['Jane Smith', 'jane@example.com', '+123456'],
      ];

      const csv = generateCsv(headers, rows);
      expect(csv).toContain("Name,Email,Formula Attack\r\n");
      expect(csv).toContain("John Doe,john@example.com,'=cmd|calc.exe\r\n");
      expect(csv).toContain("Jane Smith,jane@example.com,'+123456");
    });
  });

  // =========================================================================
  // 2. Paise and Percent Coupon Calculations
  // =========================================================================
  describe('Coupon Discount Engine Calculations', () => {
    it('correctly calculates percentage discounts in integer paise', () => {
      // ₹1,000 (100,000 paise) with 20% discount = ₹200 (20,000 paise)
      const res20 = calculateCouponDiscount({ discount_type: 'percent', value: 20 }, 100000);
      expect(res20.discountPaise).toBe(20000);
      expect(res20.finalPricePaise).toBe(80000);

      // 100% discount reduces price to 0
      const res100 = calculateCouponDiscount({ discount_type: 'percent', value: 100 }, 100000);
      expect(res100.discountPaise).toBe(100000);
      expect(res100.finalPricePaise).toBe(0);
    });

    it('correctly calculates flat rupee discounts in integer paise', () => {
      // ₹2,999 (299,900 paise) with ₹500 flat discount (50,000 paise)
      const resFlat = calculateCouponDiscount({ discount_type: 'flat', value: 50000 }, 299900);
      expect(resFlat.discountPaise).toBe(50000);
      expect(resFlat.finalPricePaise).toBe(249900);
    });

    it('caps flat discount at original program price (never negative)', () => {
      // ₹500 (50,000 paise) with ₹1,000 flat discount (100,000 paise)
      const resOver = calculateCouponDiscount({ discount_type: 'flat', value: 100000 }, 50000);
      expect(resOver.discountPaise).toBe(50000);
      expect(resOver.finalPricePaise).toBe(0);
    });

    it('handles zero or negative program prices gracefully', () => {
      const resZero = calculateCouponDiscount({ discount_type: 'percent', value: 50 }, 0);
      expect(resZero.discountPaise).toBe(0);
      expect(resZero.finalPricePaise).toBe(0);
    });
  });

  // =========================================================================
  // 3. Coupon Form Zod Validation
  // =========================================================================
  describe('Coupon Form Zod Schema', () => {
    it('normalizes coupon code to uppercase and validates alphanumeric characters', () => {
      const parsed = CouponFormSchema.parse({
        code: 'mindset-2026',
        discount_type: 'percent',
        value: 25,
        valid_from: '2026-11-01T00:00:00Z',
        valid_until: '2026-12-01T00:00:00Z',
      });
      expect(parsed.code).toBe('MINDSET-2026');
      expect(parsed.value).toBe(25);
    });

    it('rejects percentage discount greater than 100%', () => {
      const result = CouponFormSchema.safeParse({
        code: 'OVER100',
        discount_type: 'percent',
        value: 120,
        valid_from: '2026-11-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('between 1% and 100%');
      }
    });

    it('rejects expiry date earlier than start date', () => {
      const result = CouponFormSchema.safeParse({
        code: 'DATEFAIL',
        discount_type: 'percent',
        value: 10,
        valid_from: '2026-12-01T00:00:00Z',
        valid_until: '2026-11-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('on or after the start date');
      }
    });
  });

  // =========================================================================
  // 4. Student Account Moderation & Block Schema
  // =========================================================================
  describe('Student Account Block Schema', () => {
    it('requires a clear reason when blocking an account', () => {
      const failResult = BlockStudentSchema.safeParse({
        user_id: '00000000-0000-0000-0000-000000000001',
        is_blocked: true,
        reason: '',
      });
      expect(failResult.success).toBe(false);

      const passResult = BlockStudentSchema.safeParse({
        user_id: '00000000-0000-0000-0000-000000000001',
        is_blocked: true,
        reason: 'Payment chargeback dispute investigation',
      });
      expect(passResult.success).toBe(true);
    });

    it('permits unblocking without requiring a new reason', () => {
      const unblockResult = BlockStudentSchema.safeParse({
        user_id: '00000000-0000-0000-0000-000000000001',
        is_blocked: false,
      });
      expect(unblockResult.success).toBe(true);
    });
  });

  // =========================================================================
  // 5. Team RBAC & Safety Rules Verification
  // =========================================================================
  describe('Team Management Safety Rules', () => {
    it('validates team addition payloads', () => {
      const valid = AddTeamMemberSchema.parse({
        email: 'STAFF@ABRAINOCONCIOUS.COM',
        role: 'staff',
      });
      expect(valid.email).toBe('staff@abrainoconcious.com');
      expect(valid.role).toBe('staff');

      const changeRole = ChangeTeamRoleSchema.parse({
        user_id: '00000000-0000-0000-0000-000000000001',
        new_role: 'admin',
      });
      expect(changeRole.new_role).toBe('admin');
    });

    it('enforces RBAC separation matrix for Staff vs Admin', () => {
      const paymentsPerm = ROLE_PERMISSIONS.find((p) => p.feature === 'Orders, Revenue & Invoices');
      expect(paymentsPerm?.admin).toBe(true);
      expect(paymentsPerm?.staff).toBe(false);

      const couponsPerm = ROLE_PERMISSIONS.find((p) => p.feature === 'Discount Coupons Engine');
      expect(couponsPerm?.admin).toBe(true);
      expect(couponsPerm?.staff).toBe(false);

      const teamPerm = ROLE_PERMISSIONS.find((p) => p.feature === 'Team & RBAC Management');
      expect(teamPerm?.admin).toBe(true);
      expect(teamPerm?.staff).toBe(false);

      const sessionsPerm = ROLE_PERMISSIONS.find((p) => p.feature === 'Live Sessions & Recordings');
      expect(sessionsPerm?.admin).toBe(true);
      expect(sessionsPerm?.staff).toBe(true);
    });
  });
});
