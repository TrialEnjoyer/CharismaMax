import { useSupabaseClient } from "@supabase/auth-helpers-react";

export const asdfg = async (input) => {
  const supabase = useSupabaseClient().auth.admin;
  console.log(input);
};
