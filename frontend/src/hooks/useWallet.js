import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '@/api'

export function useWallet() {
  const queryClient = useQueryClient()

  const balanceQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn:  () => walletApi.getBalance().then(r => r.data),
    staleTime: 10_000,
  })

  const topUpMutation = useMutation({
    mutationFn: (amount) => walletApi.topUp(amount).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['wallet'] }),
  })

  return { balanceQuery, topUpMutation }
}
