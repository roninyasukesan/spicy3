import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getMediaActor } from "@/lib/supabase/auth-server"

export const runtime = "nodejs"

const userSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(6).max(128),
  role: z.enum(["admin", "modelo", "cliente"]),
  plan: z.enum(["free", "vip"]).optional(),
})

function databaseRole(role: "admin" | "modelo" | "cliente") {
  if (role === "modelo") return "model"
  if (role === "cliente") return "client"
  return role
}

function applicationRole(role: string) {
  if (role === "model") return "modelo"
  if (role === "client") return "cliente"
  return role
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getMediaActor(request)
    if (!actor || actor.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 })
    }

    const admin = getSupabaseAdminClient()
    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] =
      await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin
          .from("profiles")
          .select("id,public_id,role,display_name,name,plan_tier"),
      ])

    if (authError) throw authError
    if (profileError) throw profileError

    const profilesById = new Map(
      (profiles || []).map((profile) => [String(profile.id), profile])
    )
    const users = authData.users.map((user) => {
      const profile = profilesById.get(user.id)
      const role = applicationRole(
        String(profile?.role || user.app_metadata?.role || "client")
      )

      return {
        id: user.id,
        publicProfileId:
          role === "modelo" ? String(profile?.public_id || "") || undefined : undefined,
        email: user.email || "",
        password: "",
        role,
        name: String(
          profile?.display_name ||
            profile?.name ||
            user.user_metadata?.display_name ||
            user.email?.split("@")[0] ||
            "Usuário"
        ),
        plan:
          role === "cliente"
            ? String(profile?.plan_tier || "free") === "free"
              ? "free"
              : "vip"
            : undefined,
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Failed to list managed users:", error)
    return NextResponse.json(
      { error: "Não foi possível carregar os usuários do Supabase." },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null

  try {
    const actor = await getMediaActor(request)
    if (!actor || actor.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 })
    }

    const parsed = userSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados de usuário inválidos." }, { status: 400 })
    }

    const input = parsed.data
    const role = databaseRole(input.role)
    const admin = getSupabaseAdminClient()
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email: input.email.toLowerCase(),
        password: input.password,
        email_confirm: true,
        app_metadata: {
          role,
          plan_tier: input.plan || "free",
        },
        user_metadata: {
          display_name: input.name,
        },
      })

    if (authError || !authData.user) {
      throw authError || new Error("Supabase Auth não retornou o usuário.")
    }
    createdUserId = authData.user.id

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: createdUserId,
        user_id: createdUserId,
        email: input.email.toLowerCase(),
        role,
        name: input.name,
        display_name: input.name,
        plan_tier: input.plan || "free",
      })
      .select("public_id")
      .single()

    if (profileError) throw profileError

    return NextResponse.json(
      {
        user: {
          id: createdUserId,
          publicProfileId:
            input.role === "modelo" ? String(profile.public_id) : undefined,
          email: input.email.toLowerCase(),
          password: input.password,
          role: input.role,
          name: input.name,
          plan: input.role === "cliente" ? input.plan || "free" : undefined,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (createdUserId) {
      try {
        await getSupabaseAdminClient().auth.admin.deleteUser(createdUserId)
      } catch (rollbackError) {
        console.error("Failed to roll back auth user:", rollbackError)
      }
    }

    console.error("Failed to create managed user:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o usuário no Supabase.",
      },
      { status: 503 }
    )
  }
}
