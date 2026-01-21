import { defineStore } from 'pinia'

interface AppState {
  sidebarCollapsed: boolean
  loading: boolean
  refreshing: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebarCollapsed: false,
    loading: false,
    refreshing: false,
  }),

  actions: {
    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setSidebarCollapsed(collapsed: boolean): void {
      this.sidebarCollapsed = collapsed
    },

    setLoading(loading: boolean): void {
      this.loading = loading
    },

    setRefreshing(refreshing: boolean): void {
      this.refreshing = refreshing
    },
  },

  persist: {
    key: 'ebook-admin-app',
    storage: localStorage,
    paths: ['sidebarCollapsed'],
  },
})
