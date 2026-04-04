import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import type { Channel } from "@/stores/chatStore"

export function useChannels() {
  return useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .order("created_at")

      if (error) throw error
      return data as Channel[]
    },
  })
}

export function useCreateChannel() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("channels")
        .insert({ name, type: 10, created_by: user?.id })
        .select()
        .single()

      if (error) throw error
      return data as Channel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
  })
}
