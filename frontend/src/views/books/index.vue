<template>
  <div class="page-container books-page">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">电子书管理</h1>
        <p class="page-description">管理所有电子书资源，支持批量操作</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="$router.push('/books/import')">
          <el-icon><Upload /></el-icon>导入电子书
        </el-button>
      </div>
    </div>

    <div class="card">
      <!-- 搜索和筛选 -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索书名、作者、ISBN..."
            clearable
            style="width: 240px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="handleFilter">
            <el-option label="已上架" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已下架" value="archived" />
          </el-select>

          <el-cascader
            v-model="filterCategory"
            :options="categoryTree"
            :props="{ value: 'id', label: 'name', checkStrictly: true, emitPath: false }"
            placeholder="选择分类"
            clearable
            style="width: 160px"
            @change="handleFilter"
          />

          <el-select
            v-model="filterTags"
            multiple
            collapse-tags
            placeholder="选择标签"
            clearable
            style="width: 180px"
            @change="handleFilter"
          >
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </div>

        <div class="toolbar-right">
          <el-button
            :disabled="selectedIds.length === 0"
            @click="handleBatchDownload"
          >
            <el-icon><Download /></el-icon>批量下载{{ selectedIds.length > 0 ? ` (${selectedIds.length})` : '' }}
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            <el-icon><Delete /></el-icon>批量删除{{ selectedIds.length > 0 ? ` (${selectedIds.length})` : '' }}
          </el-button>
          <el-button v-if="selectedIds.length > 0" @click="handleBatchEdit">
            <el-icon><Edit /></el-icon>批量编辑 ({{ selectedIds.length }})
          </el-button>
          <el-dropdown v-if="selectedIds.length > 0" trigger="click" @command="handleBatchStatus">
            <el-button>
              批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="published">批量上架</el-dropdown-item>
                <el-dropdown-item command="archived">批量下架</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button @click="showColumnConfig = true">
            <el-icon><Setting /></el-icon>列配置
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="books"
        row-key="book_id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" fixed />

        <el-table-column label="序号" width="70" fixed>
          <template #default="{ $index }">
            {{ (page - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>

        <el-table-column v-if="isColumnVisible('cover')" label="封面" width="80" fixed>
          <template #default="{ row }">
            <img
              :src="getCoverUrl(row.cover_path)"
              class="book-cover"
              @error="(e: Event) => (e.target as HTMLImageElement).src = defaultCover"
            />
          </template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('title')"
          prop="title"
          label="书名"
          min-width="200"
          sortable="custom"
          show-overflow-tooltip
          fixed
        >
          <template #default="{ row }">
            <router-link :to="`/books/${row.book_id}/edit`" class="book-title-link">
              {{ row.title }}
            </router-link>
          </template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('author')"
          prop="author"
          label="作者"
          width="120"
          sortable="custom"
          show-overflow-tooltip
        />

        <el-table-column
          v-if="isColumnVisible('publisher')"
          prop="publisher"
          label="出版社"
          width="120"
          show-overflow-tooltip
        />

        <el-table-column
          v-if="isColumnVisible('isbn')"
          prop="isbn"
          label="ISBN"
          width="140"
          show-overflow-tooltip
        />

        <el-table-column v-if="isColumnVisible('format')" prop="format" label="格式" width="80">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.format?.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('file_size')"
          prop="file_size"
          label="大小"
          width="100"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>

        <el-table-column v-if="isColumnVisible('status')" prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('view_count')"
          prop="view_count"
          label="浏览量"
          width="100"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatNumber(row.view_count) }}
          </template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('download_count')"
          prop="download_count"
          label="下载量"
          width="100"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatNumber(row.download_count) }}
          </template>
        </el-table-column>

        <el-table-column
          v-if="isColumnVisible('created_at')"
          prop="created_at"
          label="创建时间"
          width="160"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column v-if="isColumnVisible('actions')" label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button text type="primary" size="small" @click="$router.push(`/books/${row.book_id}/edit`)">
                编辑
              </el-button>
              <el-button text type="primary" size="small" @click="handleDownload(row)">
                下载
              </el-button>
              <el-popconfirm title="确定要删除这本书吗？" @confirm="handleDelete(row.book_id)">
                <template #reference>
                  <el-button text type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchBooks"
          @current-change="fetchBooks"
        />
      </div>
    </div>

    <!-- 列配置弹窗 -->
    <el-dialog v-model="showColumnConfig" title="列配置" width="400px">
      <el-checkbox-group v-model="visibleColumnKeys">
        <div v-for="col in columnConfig" :key="col.key" class="column-config-item">
          <el-checkbox :value="col.key" :disabled="col.key === 'title' || col.key === 'actions'">
            {{ col.label }}
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="resetColumnConfig">重置</el-button>
        <el-button type="primary" @click="showColumnConfig = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹窗 -->
    <el-dialog v-model="showBatchEdit" title="批量编辑" width="500px">
      <el-form label-width="80px">
        <el-form-item label="状态">
          <el-select v-model="batchForm.status" placeholder="不修改" clearable style="width: 100%">
            <el-option label="已上架" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已下架" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="语言">
          <el-select v-model="batchForm.language" placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="lang in languageOptions" :key="lang.value" :label="lang.label" :value="lang.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="出版社">
          <el-input v-model="batchForm.publisher" placeholder="不修改" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-cascader
            v-model="batchForm.category_ids"
            :options="categoryTree"
            :props="{ value: 'id', label: 'name', multiple: true, checkStrictly: true, emitPath: false }"
            placeholder="不修改"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="batchForm.tag_ids" multiple placeholder="不修改" clearable style="width: 100%">
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchEdit = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="submitBatchEdit">
          确定修改 ({{ selectedIds.length }} 本)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { BookMetadata, Category, Tag, BookStatus, ColumnConfig } from '@/types'
import { booksApi } from '@/api/books'
import { categoriesApi } from '@/api/categories'
import { tagsApi } from '@/api/tags'
import { formatDate, formatFileSize, formatNumber, getStatusText, getStatusType, languageOptions, debounce } from '@/utils'

const defaultCover = '/images/default-cover.png'

// 获取封面完整URL
const getCoverUrl = (coverPath: string | undefined | null): string => {
  if (!coverPath) return defaultCover
  // 如果已经是完整URL或以/开头，直接返回
  if (coverPath.startsWith('http') || coverPath.startsWith('/')) {
    return coverPath
  }
  // 添加/uploads/前缀
  return `/uploads/${coverPath}`
}

// 数据状态
const books = ref<BookMetadata[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

// 筛选条件
const searchKeyword = ref('')
const filterStatus = ref<BookStatus | ''>('')
const filterCategory = ref<string>('')
const filterTags = ref<string[]>([])

// 选中项
const selectedIds = ref<string[]>([])

// 分类和标签
const categoryTree = ref<Category[]>([])
const tags = ref<Tag[]>([])

// 列配置
const showColumnConfig = ref(false)
const columnConfig = ref<ColumnConfig[]>([
  { key: 'cover', label: '封面', visible: true, width: 80 },
  { key: 'title', label: '书名', visible: true, width: 200, sortable: true },
  { key: 'author', label: '作者', visible: true, width: 120, sortable: true },
  { key: 'publisher', label: '出版社', visible: true, width: 120 },
  { key: 'isbn', label: 'ISBN', visible: true, width: 140 },
  { key: 'format', label: '格式', visible: true, width: 80 },
  { key: 'file_size', label: '大小', visible: true, width: 100, sortable: true },
  { key: 'status', label: '状态', visible: true, width: 100 },
  { key: 'view_count', label: '浏览量', visible: true, width: 100, sortable: true },
  { key: 'download_count', label: '下载量', visible: true, width: 100, sortable: true },
  { key: 'created_at', label: '创建时间', visible: true, width: 160, sortable: true },
  { key: 'actions', label: '操作', visible: true, width: 150 },
])

const visibleColumnKeys = computed({
  get: () => columnConfig.value.filter((c) => c.visible).map((c) => c.key),
  set: (keys: string[]) => {
    columnConfig.value.forEach((col) => {
      col.visible = keys.includes(col.key)
    })
  },
})

const isColumnVisible = (key: string) => {
  return columnConfig.value.find((c) => c.key === key)?.visible ?? true
}

const resetColumnConfig = () => {
  columnConfig.value.forEach((col) => {
    col.visible = true
  })
}

// 批量编辑
const showBatchEdit = ref(false)
const batchLoading = ref(false)
const batchForm = reactive({
  status: '' as BookStatus | '',
  language: '',
  publisher: '',
  category_ids: [] as string[],
  tag_ids: [] as string[],
})

// 获取电子书列表
const fetchBooks = async () => {
  loading.value = true
  try {
    const response = await booksApi.getList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: filterStatus.value || undefined,
      category_id: filterCategory.value || undefined,
      tag_ids: filterTags.value.length > 0 ? filterTags.value : undefined,
    })
    books.value = response.list
    total.value = response.total
  } catch {
    // 使用模拟数据
    books.value = Array.from({ length: 20 }, (_, i) => ({
      book_id: `book-${i}`,
      title: `示例电子书 ${i + 1}`,
      author: `作者 ${i + 1}`,
      publisher: '示例出版社',
      publish_date: '2024-01-01',
      isbn: `978-7-XXX-XXXXX-${i}`,
      language: 'zh-CN',
      format: ['pdf', 'epub', 'mobi'][i % 3],
      description: '这是一本示例电子书的简介...',
      keywords: ['示例', '电子书'],
      file_path: `/uploads/books/example-${i}.pdf`,
      file_size: Math.floor(Math.random() * 50000000) + 1000000,
      cover_path: '',
      status: (['draft', 'published', 'archived'] as BookStatus[])[i % 3],
      category_ids: [],
      tag_ids: [],
      view_count: Math.floor(Math.random() * 10000),
      download_count: Math.floor(Math.random() * 5000),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    total.value = 100
  } finally {
    loading.value = false
  }
}

// 获取分类和标签
const fetchCategoriesAndTags = async () => {
  try {
    const [categoriesRes, tagsRes] = await Promise.all([categoriesApi.getTree(), tagsApi.getList()])
    categoryTree.value = categoriesRes
    tags.value = tagsRes
  } catch {
    // 使用模拟数据
    categoryTree.value = [
      { id: '1', name: '文学', parent_id: null, sort_order: 1, book_count: 100, created_at: '', updated_at: '' },
      { id: '2', name: '科技', parent_id: null, sort_order: 2, book_count: 80, created_at: '', updated_at: '' },
    ]
    tags.value = [
      { id: '1', name: '热门', color: '#f56c6c', book_count: 50, created_at: '', updated_at: '' },
      { id: '2', name: '推荐', color: '#67c23a', book_count: 30, created_at: '', updated_at: '' },
    ]
  }
}

// 搜索防抖
const handleSearch = debounce(() => {
  page.value = 1
  fetchBooks()
}, 300)

// 筛选
const handleFilter = () => {
  page.value = 1
  fetchBooks()
}

// 选择变化
const handleSelectionChange = (selection: BookMetadata[]) => {
  selectedIds.value = selection.map((item) => item.book_id)
}

// 批量编辑
const handleBatchEdit = () => {
  Object.assign(batchForm, {
    status: '',
    language: '',
    publisher: '',
    category_ids: [],
    tag_ids: [],
  })
  showBatchEdit.value = true
}

// 提交批量编辑
const submitBatchEdit = async () => {
  const updates: any = {}
  if (batchForm.status) updates.status = batchForm.status
  if (batchForm.language) updates.language = batchForm.language
  if (batchForm.publisher) updates.publisher = batchForm.publisher
  if (batchForm.category_ids.length > 0) updates.category_ids = batchForm.category_ids
  if (batchForm.tag_ids.length > 0) updates.tag_ids = batchForm.tag_ids

  if (Object.keys(updates).length === 0) {
    ElMessage.warning('请至少修改一项')
    return
  }

  batchLoading.value = true
  try {
    await booksApi.batchUpdate({
      book_ids: selectedIds.value,
      updates,
    })
    ElMessage.success('批量修改成功')
    showBatchEdit.value = false
    selectedIds.value = []
    fetchBooks()
  } finally {
    batchLoading.value = false
  }
}

// 批量状态操作
const handleBatchStatus = async (command: string) => {
  if (command === 'delete') {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 本书吗？`, '警告', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
    })
    try {
      await booksApi.batchDelete(selectedIds.value)
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      fetchBooks()
    } catch {}
  } else {
    try {
      await booksApi.batchUpdateStatus(selectedIds.value, command as BookStatus)
      ElMessage.success('批量更新状态成功')
      selectedIds.value = []
      fetchBooks()
    } catch {}
  }
}

// 下载
const handleDownload = async (book: BookMetadata) => {
  try {
    await booksApi.download(book.book_id)
  } catch {}
}

// 删除
const handleDelete = async (id: string) => {
  try {
    await booksApi.delete(id)
    ElMessage.success('删除成功')
    fetchBooks()
  } catch {}
}

// 批量下载
const handleBatchDownload = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要下载的书籍')
    return
  }
  ElMessage.info(`开始下载 ${selectedIds.value.length} 本书籍...`)
  for (const id of selectedIds.value) {
    try {
      await booksApi.download(id)
    } catch (err) {
      console.error(`下载失败: ${id}`, err)
    }
  }
  ElMessage.success('批量下载完成')
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的书籍')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 本书吗？此操作不可恢复！`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      }
    )
    await booksApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchBooks()
  } catch {}
}

onMounted(() => {
  fetchBooks()
  fetchCategoriesAndTags()
})

// 监听筛选条件变化
watch([filterStatus, filterCategory, filterTags], () => {
  handleFilter()
})
</script>

<style lang="scss" scoped>
.books-page {
  .header-actions {
    display: flex;
    gap: 12px;
  }

  .book-cover {
    width: 50px;
    height: 67px;
    object-fit: cover;
    border-radius: 4px;
    background-color: #f0f2f5;
  }

  .book-title-link {
    color: #303133;
    text-decoration: none;

    &:hover {
      color: #409eff;
    }
  }

  .text-danger {
    color: #f56c6c;
  }

  .column-config-item {
    padding: 8px 0;
    border-bottom: 1px solid #f0f2f5;

    &:last-child {
      border-bottom: none;
    }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;

    .el-button {
      padding: 4px 8px;
      margin: 0;
    }
  }
}
</style>
