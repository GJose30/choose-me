import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";

export function useSupabaseUserProfile() {
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      if (user?.id) {
        const { data, error } = await supabase
          .from("user")
          .select("username, fullname, profile_pic, email")
          .eq("clerk_id", user.id)
          .single();
        if (!ignore) {
          setProfile(data);
          setError(error);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    };
    fetchProfile();
    return () => { ignore = true }
  }, [user?.id]);

  return { profile, loading, error };
}
