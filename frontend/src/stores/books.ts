import { defineStore } from 'pinia'
import type { BookMetadata, BookFilter, PaginatedData, ColumnConfig } from '@/types'
import { booksApi } from '@/api/books'

interface BooksState {
  list: BookMetadata[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  filter: BookFilter
  selectedIds: string[]
  columnConfig: ColumnConfig[]
}

const defaultColumnConfig: ColumnConfig[] = [
  { key: 'cover', label: '封面', visible: true, width: 80 },
  { key: 'title', label: '书名', visible: true, width: 200, sortable: true },
  { key: 'author', label: '作者', visible: true, width: 120, sortable: true },
  { key: 'publisher', label: '出版社', visible: true, width: 120 },
  { key: 'format', label: '格式', visible: true, width: 80 },
  { key: 'file_size', label: '大小', visible: true, width: 100, sortable: true },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'view_count', label: '浏览量', visible: true, width: 100, sortable: true },
  { key: 'download_count', label: '下载量', visible: true, width: 100, sortable: true },
  { key: 'created_at', label: '创建时间', visible: true, width: 160, sortable: true },
  { key: 'actions', label: '操作', visible: true, width: 180 },
]

export const useBooksStore = defineStore('books', {
  state: (): BooksState => ({
    list: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    filter: {},
    selectedIds: [],
    columnConfig: [...defaultColumnConfig],
  }),

  getters: {
    visibleColumns: (state): ColumnConfig[] => {
      return state.columnConfig.filter(col => col.visible)
    },
    selectedBooks: (state): BookMetadata[] => {
      return state.list.filter(book => state.selectedIds.includes(book.book_id))
    },
    hasSelection: (state): boolean => {
      return state.selectedIds.length > 0
    },
  },

  actions: {
    async fetchBooks(): Promise<void> {
      this.loading = true
      try {
        const response = await booksApi.getList({
          page: this.page,
          pageSize: this.pageSize,
          ...this.filter,
        })
        const data = response as PaginatedData<BookMetadata>
        this.list = data.list
        this.total = data.total
      } finally {
        this.loading = false
      }
    },

    setPage(page: number): void {
      this.page = page
    },

    setPageSize(pageSize: number): void {
      this.pageSize = pageSize
      this.page = 1
    },

    setFilter(filter: BookFilter): void {
      this.filter = filter
      this.page = 1
    },

    clearFilter(): void {
      this.filter = {}
      this.page = 1
    },

    setSelectedIds(ids: string[]): void {
      this.selectedIds = ids
    },

    clearSelection(): void {
      this.selectedIds = []
    },

    updateColumnConfig(config: ColumnConfig[]): void {
      this.columnConfig = config
    },

    resetColumnConfig(): void {
      this.columnConfig = [...defaultColumnConfig]
    },
  },

  persist: {
    key: 'ebook-admin-books',
    storage: localStorage,
    paths: ['pageSize', 'columnConfig'],
  },
})
