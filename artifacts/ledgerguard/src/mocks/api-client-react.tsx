// Mock implementation of @workspace/api-client-react
import { useQuery, useMutation } from "@tanstack/react-query";

// Auth hooks
export const useGetMe = () => ({ data: null, isLoading: false, error: null });
export const useSignIn = () => ({ mutateAsync: async () => ({ success: true }), isLoading: false });
export const useGetNonce = () => ({ data: "mock-nonce-123", isLoading: false });
export const useSignOut = () => ({ mutateAsync: async () => ({}), isLoading: false });

// Dashboard hooks
export const useGetDashboardStats = () => ({
  data: {
    totalVolume: 1000000,
    totalTransactions: 150,
    activePolicies: 5,
    treasuryHealth: 85
  },
  isLoading: false
});

export const useGetRecentActivity = () => ({
  data: [],
  isLoading: false
});

// Transaction hooks
export const useListTransactions = () => ({
  data: [],
  isLoading: false
});

export const useUpdateTransaction = () => ({
  mutateAsync: async () => ({}),
  isLoading: false
});

export const useGetTransactionRisk = () => ({
  data: { risk: "low", score: 0.1 },
  isLoading: false
});

export const getListTransactionsQueryKey = () => ["transactions"];

// AI hooks
export const useListAiConversations = () => ({
  data: [],
  isLoading: false
});

export const useSendAiMessage = () => ({
  mutateAsync: async (message: string) => ({ response: "Mock AI response" }),
  isLoading: false
});

export const useCreateTransaction = () => ({
  mutateAsync: async () => ({}),
  isLoading: false
});

export const getListAiConversationsQueryKey = () => ["ai-conversations"];

// Policy hooks
export const useListPolicies = () => ({
  data: [],
  isLoading: false
});

export const useCreatePolicy = () => ({
  mutateAsync: async () => ({}),
  isLoading: false
});

export const useUpdatePolicy = () => ({
  mutateAsync: async () => ({}),
  isLoading: false
});

export const useDeletePolicy = () => ({
  mutateAsync: async () => ({}),
  isLoading: false
});

export const getListPoliciesQueryKey = () => ["policies"];

// Analytics hooks
export const useGetSpendingAnalytics = () => ({
  data: { categories: [], total: 0 },
  isLoading: false
});

export const useGetTreasuryHealth = () => ({
  data: { score: 85, metrics: {} },
  isLoading: false
});

export const useGetTopRecipients = () => ({
  data: [],
  isLoading: false
});

// Audit hooks
export const useListAuditLogs = () => ({
  data: [],
  isLoading: false
});
