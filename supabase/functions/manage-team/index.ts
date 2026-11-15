import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { z } from "https://esm.sh/zod@3.22.4";

// Environment Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ROOT_DOMAIN = Deno.env.get("VITE_ROOT_DOMAIN") || "abrainoconcious.com";

// In-Memory Rate Limiting: 60 requests per minute per IP / caller
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitEntry>();

function isRateLimited(identifier: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(identifier);

  if (!entry || entry.resetAt <= now) {
    rateLimits.set(identifier, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count += 1;
  return false;
}

// CORS Origin Validation
function getCorsHeaders(origin: string | null): HeadersInit {
  const isAllowed =
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    (ROOT_DOMAIN && origin.endsWith(ROOT_DOMAIN));

  return {
    "Access-Control-Allow-Origin": isAllowed && origin ? origin : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// Input Validation Schemas
const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list_team"),
  }),
  z.object({
    action: z.literal("add_member"),
    email: z.string().trim().email(),
    role: z.enum(["admin", "staff"]),
  }),
  z.object({
    action: z.literal("change_role"),
    user_id: z.string().uuid(),
    new_role: z.enum(["admin", "staff", "student"]),
  }),
  z.object({
    action: z.literal("remove_member"),
    user_id: z.string().uuid(),
  }),
]);

serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED", message: "Only POST requests are permitted" }),
      { status: 405, headers: corsHeaders }
    );
  }

  // Rate Limiting by Client IP
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown-ip";
  if (isRateLimited(clientIp, 60, 60000)) {
    return new Response(
      JSON.stringify({ ok: false, error: "RATE_LIMITED", message: "Too many requests. Please slow down." }),
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    // 2. Verify Caller JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ ok: false, error: "UNAUTHORIZED", message: "Missing or malformed Authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const jwt = authHeader.replace("Bearer ", "").trim();

    // Initialize Admin Supabase Client (Service Role for admin operations)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ ok: false, error: "UNAUTHORIZED", message: "Invalid or expired session token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const caller = userData.user;

    // 3. Verify Caller Profile & Role
    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_blocked, full_name")
      .eq("id", caller.id)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ ok: false, error: "FORBIDDEN", message: "Caller profile could not be verified" }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (callerProfile.role !== "admin" || callerProfile.is_blocked) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "ACCESS_DENIED",
          message: "Only unblocked administrators can perform team management actions.",
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 4. Parse & Validate Payload
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "INVALID_JSON", message: "Request body is not valid JSON" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const parsed = ActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "VALIDATION_ERROR",
          message: "Invalid action parameters",
          details: parsed.error.issues,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const payload = parsed.data;

    // Structured logging (no secrets)
    console.log(`[manage-team] action=${payload.action} actor=${caller.id}`);

    // Helper: Count active unblocked administrators
    const countActiveAdmins = async (): Promise<number> => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_blocked", false);

      if (error) throw error;
      return count || 0;
    };

    // 5. Execute Action
    switch (payload.action) {
      // -----------------------------------------------------------------------
      // Action A: List Team
      // -----------------------------------------------------------------------
      case "list_team": {
        // Fetch all team profiles
        const { data: teamProfiles, error: teamErr } = await supabase
          .from("profiles")
          .select("id, full_name, role, avatar_url, created_at, last_seen_at, is_blocked")
          .in("role", ["admin", "staff"])
          .order("created_at", { ascending: true });

        if (teamErr) throw teamErr;

        // Fetch user emails from auth
        const { data: authList, error: authListErr } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (authListErr) throw authListErr;

        const authMap = new Map((authList?.users || []).map((u) => [u.id, u]));

        const team = (teamProfiles || []).map((p) => {
          const authUser = authMap.get(p.id);
          return {
            id: p.id,
            full_name: p.full_name || authUser?.user_metadata?.full_name || null,
            email: authUser?.email || null,
            role: p.role,
            avatar_url: p.avatar_url,
            is_blocked: p.is_blocked,
            created_at: p.created_at,
            last_seen_at: p.last_seen_at || authUser?.last_sign_in_at || null,
            is_current_user: p.id === caller.id,
          };
        });

        return new Response(JSON.stringify({ ok: true, team }), { status: 200, headers: corsHeaders });
      }

      // -----------------------------------------------------------------------
      // Action B: Add Member
      // -----------------------------------------------------------------------
      case "add_member": {
        const cleanEmail = payload.email.trim().toLowerCase();
        const role = payload.role;

        // Find existing auth user or create
        const { data: userSearch, error: searchErr } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (searchErr) throw searchErr;

        let targetUser = (userSearch?.users || []).find(
          (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
        );
        let wasNewlyCreated = false;

        if (!targetUser) {
          const { data: newUserData, error: createErr } = await supabase.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: { role },
          });

          if (createErr || !newUserData?.user) {
            return new Response(
              JSON.stringify({ ok: false, error: "CREATE_USER_FAILED", message: createErr?.message || "Failed to create user" }),
              { status: 500, headers: corsHeaders }
            );
          }

          targetUser = newUserData.user;
          wasNewlyCreated = true;
        }

        // Upsert profile
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", targetUser.id)
          .maybeSingle();

        const previousRole = existingProfile?.role || "none";

        if (!existingProfile) {
          await supabase.from("profiles").insert({
            id: targetUser.id,
            role,
            is_blocked: false,
          });
        } else {
          await supabase
            .from("profiles")
            .update({ role, is_blocked: false, updated_at: new Date().toISOString() })
            .eq("id", targetUser.id);
        }

        // Audit Log Entry
        await supabase.from("audit_log").insert({
          actor_id: caller.id,
          actor_role: "admin",
          action: "team.add_member",
          entity: "profiles",
          entity_id: targetUser.id,
          diff: {
            email: cleanEmail,
            role,
            previous_role: previousRole,
            created_auth_user: wasNewlyCreated,
          },
          ip_address: clientIp,
          created_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            ok: true,
            member: {
              id: targetUser.id,
              email: cleanEmail,
              role,
              was_created: wasNewlyCreated,
            },
            message: `Successfully configured ${cleanEmail} as ${role}.`,
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // -----------------------------------------------------------------------
      // Action C: Change Role
      // -----------------------------------------------------------------------
      case "change_role": {
        const { user_id, new_role } = payload;

        // Safety Rule 1: Caller cannot change own role
        if (caller.id === user_id) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "SELF_ROLE_CHANGE_BLOCKED",
              message: "You cannot modify your own role.",
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        // Fetch target profile
        const { data: targetProfile, error: targetErr } = await supabase
          .from("profiles")
          .select("id, role, full_name")
          .eq("id", user_id)
          .maybeSingle();

        if (targetErr || !targetProfile) {
          return new Response(
            JSON.stringify({ ok: false, error: "USER_NOT_FOUND", message: "Target team member profile not found" }),
            { status: 404, headers: corsHeaders }
          );
        }

        // Safety Rule 2: Cannot demote the last remaining admin
        if (targetProfile.role === "admin" && new_role !== "admin") {
          const activeAdmins = await countActiveAdmins();
          if (activeAdmins <= 1) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "LAST_ADMIN_PROTECTED",
                message: "Cannot demote or remove the last remaining administrator.",
              }),
              { status: 400, headers: corsHeaders }
            );
          }
        }

        // Update role
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ role: new_role, updated_at: new Date().toISOString() })
          .eq("id", user_id);

        if (updateErr) throw updateErr;

        // Audit Log Entry
        await supabase.from("audit_log").insert({
          actor_id: caller.id,
          actor_role: "admin",
          action: "team.change_role",
          entity: "profiles",
          entity_id: user_id,
          diff: {
            target_name: targetProfile.full_name,
            previous_role: targetProfile.role,
            new_role,
          },
          ip_address: clientIp,
          created_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            ok: true,
            user_id,
            previous_role: targetProfile.role,
            new_role,
            message: `Role updated to ${new_role} successfully.`,
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // -----------------------------------------------------------------------
      // Action D: Remove Member (sets role to student)
      // -----------------------------------------------------------------------
      case "remove_member": {
        const { user_id } = payload;

        // Safety Rule 1: Caller cannot remove own account
        if (caller.id === user_id) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "SELF_REMOVAL_BLOCKED",
              message: "You cannot remove yourself from the team.",
            }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { data: targetProfile, error: targetErr } = await supabase
          .from("profiles")
          .select("id, role, full_name")
          .eq("id", user_id)
          .maybeSingle();

        if (targetErr || !targetProfile) {
          return new Response(
            JSON.stringify({ ok: false, error: "USER_NOT_FOUND", message: "Target team member not found" }),
            { status: 404, headers: corsHeaders }
          );
        }

        // Safety Rule 2: Cannot remove the last remaining admin
        if (targetProfile.role === "admin") {
          const activeAdmins = await countActiveAdmins();
          if (activeAdmins <= 1) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "LAST_ADMIN_PROTECTED",
                message: "Cannot demote or remove the last remaining administrator.",
              }),
              { status: 400, headers: corsHeaders }
            );
          }
        }

        // Set role to student
        const { error: demoteErr } = await supabase
          .from("profiles")
          .update({ role: "student", updated_at: new Date().toISOString() })
          .eq("id", user_id);

        if (demoteErr) throw demoteErr;

        // Audit Log Entry
        await supabase.from("audit_log").insert({
          actor_id: caller.id,
          actor_role: "admin",
          action: "team.remove_member",
          entity: "profiles",
          entity_id: user_id,
          diff: {
            target_name: targetProfile.full_name,
            previous_role: targetProfile.role,
            new_role: "student",
          },
          ip_address: clientIp,
          created_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({
            ok: true,
            user_id,
            previous_role: targetProfile.role,
            new_role: "student",
            message: "Team member removed. Permissions returned to student role.",
          }),
          { status: 200, headers: corsHeaders }
        );
      }
    }
  } catch (err: any) {
    console.error("[manage-team] Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "INTERNAL_ERROR",
        message: err?.message || "An unexpected error occurred while processing team management request",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

