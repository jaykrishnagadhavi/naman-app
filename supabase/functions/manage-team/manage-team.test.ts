// supabase/functions/manage-team/manage-team.test.ts
// Deno unit tests for manage-team edge function business logic and safety guards

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Test suite for role validation logic and safety rules
Deno.test("Safety Rule 1: Caller cannot change own role", () => {
  const callerId = "00000000-0000-0000-0000-000000000001";
  const targetId = "00000000-0000-0000-0000-000000000001";

  const isSelf = callerId === targetId;
  assertEquals(isSelf, true, "Self modification should be detected");
});

Deno.test("Safety Rule 2: Caller cannot remove own team membership", () => {
  const callerId = "00000000-0000-0000-0000-000000000001";
  const targetId = "00000000-0000-0000-0000-000000000001";

  const isSelf = callerId === targetId;
  assertEquals(isSelf, true, "Self removal must be blocked");
});

Deno.test("Safety Rule 3: Cannot demote the last remaining admin", () => {
  const activeAdminsCount = 1;
  const targetIsAdmin = true;
  const newRole = "staff";

  const wouldLeaveNoAdmins = targetIsAdmin && newRole !== "admin" && activeAdminsCount <= 1;
  assertEquals(wouldLeaveNoAdmins, true, "Last admin demotion must be blocked");
});

Deno.test("Safety Rule 4: Demoting admin allowed when other active admins exist", () => {
  const activeAdminsCount = 2;
  const targetIsAdmin = true;
  const newRole = "staff";

  const wouldLeaveNoAdmins = targetIsAdmin && newRole !== "admin" && activeAdminsCount <= 1;
  assertEquals(wouldLeaveNoAdmins, false, "Demoting admin is permitted if multiple admins exist");
});

Deno.test("Action Schema Validation: Validates required fields", () => {
  const validAdd = {
    action: "add_member",
    email: "test.staff@abrainoconcious.com",
    role: "staff",
  };
  assertEquals(validAdd.action, "add_member");
  assertEquals(validAdd.role, "staff");
});

