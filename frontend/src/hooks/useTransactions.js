import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { txApi } from '@/api'

export function useTransactions(filters = {}) {
  const queryClient = useQueryClient()

  const historyQuery = useQuery({
    queryKey: ['transactions', 'history', filters],
    queryFn:  () => txApi.history(filters).then(r => r.data),
    staleTime: 5_000,
  })

  const sendMutation = useMutation({
    mutationFn: (data) => txApi.send(data).then(r => r.data),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  return { historyQuery, sendMutation }
}
