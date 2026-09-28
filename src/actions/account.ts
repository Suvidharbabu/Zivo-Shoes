"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addressSchema, firstError, profileSchema, uuidSchema } from "@/lib/validators";
import type { ActionResult } from "@/types";

export async function updateProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { ok: false, error: "Could not save your details." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveAddress(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please log in again." };

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = await createClient();
  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...parsed.data, user_id: user.id, is_default: !count })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Could not save the address." };

  revalidatePath("/account");
  return { ok: true, data: { id: data.id as string } };
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user || !uuidSchema.safeParse(id).success) return { ok: false, error: "Not allowed." };

  const supabase = await createClient();
  const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not delete the address." };

  revalidatePath("/account");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user || !uuidSchema.safeParse(id).success) return { ok: false, error: "Not allowed." };

  const supabase = await createClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "Could not update the address." };

  revalidatePath("/account");
  return { ok: true };
}
