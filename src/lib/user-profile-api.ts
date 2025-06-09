import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  google_sheet_id: string | null;
  google_sheet_tab: string | null;
}

/**
 * Fetches the profile for the current authenticated user.
 * @returns The UserProfile object or null if not found.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error("Error fetching user profile:", error.message);
    throw new Error(`Erreur lors de la récupération du profil : ${error.message}`);
  }

  return data || null;
}

/**
 * Updates the profile for the current authenticated user.
 * @param updates An object containing the fields to update.
 * @returns The updated UserProfile object.
 */
export async function updateUserProfile(updates: Partial<Omit<UserProfile, 'id'>>): Promise<UserProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error.message);
    throw new Error(`Erreur lors de la mise à jour du profil : ${error.message}`);
  }
  return data;
}