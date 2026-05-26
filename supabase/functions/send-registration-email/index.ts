import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const projectUrl = Deno.env.get("PROJECT_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!projectUrl || !serviceRoleKey) {
      console.error("Missing Supabase admin secrets", {
        hasProjectUrl: Boolean(projectUrl),
        hasServiceRoleKey: Boolean(serviceRoleKey),
      });

      return new Response(
        JSON.stringify({
          error: "Missing PROJECT_URL or SERVICE_ROLE_KEY secret.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, full_name, role, barangay } = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({
          error: "Email and role are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const roleLabel =
      role === "lgu_admin"
        ? "LGU Admin"
        : role === "barangay_user"
        ? "Barangay User"
        : role === "collection_staff"
        ? "Collection Staff"
        : role;

    const adminClient = createClient(projectUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Sending Supabase invite email...", {
      email: normalizedEmail,
      role: roleLabel,
      barangay: barangay || null,
    });

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: {
          full_name: full_name || "",
          role,
          role_label: roleLabel,
          barangay: barangay || "",
          system: "SWRaCMS",
        },
        redirectTo: projectUrl,
      }
    );

    if (error) {
      console.error("Supabase invite email failed:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      return new Response(
        JSON.stringify({
          error: error.message || "Failed to send invite email.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Supabase invite email sent successfully", {
      invitedEmail: normalizedEmail,
      userId: data?.user?.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invite email sent successfully.",
        user: data?.user || null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected invite function error:", {
      message: error?.message,
      stack: error?.stack,
    });

    return new Response(
      JSON.stringify({
        error: error?.message || "Unexpected server error.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});