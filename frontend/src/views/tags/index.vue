<template>
  <div class="page-container tags-page">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">标签管理</h1>
        <p class="page-description">管理电子书标签，方便分类筛选</p>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>新增标签
      </el-button>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索标签名称"
            clearable
            style="width: 200px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="toolbar-right">
          <el-button v-if="selectedIds.length > 0" type="danger" @click="handleBatchDelete">
            批量删除 ({{ selectedIds.length }})
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredTags"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="标签名称" min-width="150">
          <template #default="{ row }">
            <el-tag :color="row.color" style="color: #fff" size="small">
              {{ row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="颜色" width="120">
          <template #default="{ row }">
            <div class="color-preview" :style="{ backgroundColor: row.color }"></div>
            <span>{{ row.color }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="book_count" label="书籍数量" width="120" sortable />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-popconfirm title="确定要删除该标签吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && filteredTags.length === 0" description="暂无标签" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingTag ? '编辑标签' : '新增标签'" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <el-color-picker v-model="form.color" show-alpha />
          <span class="color-text">{{ form.color }}</span>
        </el-form-item>
        <el-form-item label="预览">
          <el-tag :color="form.color" style="color: #fff">
            {{ form.name || '标签预览' }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Tag } from '@/types'
import { tagsApi } from '@/api/tags'
import { formatDate, debounce } from '@/utils'

const loading = ref(false)
const tags = ref<Tag[]>([])
const searchKeyword = ref('')
const selectedIds = ref<string[]>([])

// 过滤后的标签列表
const filteredTags = computed(() => {
  if (!searchKeyword.value) return tags.value
  return tags.value.filter((tag) =>
    tag.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 弹窗相关
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const editingTag = ref<Tag | null>(null)

const form = reactive({
  name: '',
  color: '#409eff',
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { max: 20, message: '标签名称不能超过20个字符', trigger: 'blur' },
  ],
  color: [{ required: true, message: '请选择标签颜色', trigger: 'change' }],
}

// 预设颜色
const presetColors = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#9c27b0',
  '#00bcd4',
  '#ff9800',
]

// 获取标签列表
const fetchTags = async () => {
  loading.value = true
  try {
    tags.value = await tagsApi.getList()
  } catch {
    // 使用模拟数据
    tags.value = [
      { id: '1', name: '热门', color: '#f56c6c', book_count: 520, created_at: new Date().toISOString(), updated_at: '' },
      { id: '2', name: '推荐', color: '#67c23a', book_count: 380, created_at: new Date().toISOString(), updated_at: '' },
      { id: '3', name: '经典', color: '#409eff', book_count: 256, created_at: new Date().toISOString(), updated_at: '' },
      { id: '4', name: '新书', color: '#e6a23c', book_count: 89, created_at: new Date().toISOString(), updated_at: '' },
    ]
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = debounce(() => {
  // 本地过滤，无需请求
}, 300)

// 选择变化
const handleSelectionChange = (selection: Tag[]) => {
  selectedIds.value = selection.map((item) => item.id)
}

// 新增标签
const handleAdd = () => {
  editingTag.value = null
  form.name = ''
  form.color = presetColors[Math.floor(Math.random() * presetColors.length)]
  dialogVisible.value = true
}

// 编辑标签
const handleEdit = (tag: Tag) => {
  editingTag.value = tag
  form.name = tag.name
  form.color = tag.color
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    if (editingTag.value) {
      await tagsApi.update(editingTag.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await tagsApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchTags()
  } finally {
    submitting.value = false
  }
}

// 删除标签
const handleDelete = async (id: string) => {
  try {
    await tagsApi.delete(id)
    ElMessage.success('删除成功')
    fetchTags()
  } catch {}
}

// 批量删除
const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个标签吗？`, '警告', {
    type: 'warning',
  })

  try {
    await tagsApi.batchDelete(selectedIds.value)
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchTags()
  } catch {}
}

onMounted(() => {
  fetchTags()
})
</script>

<style lang="scss" scoped>
.tags-page {
  .color-preview {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    margin-right: 8px;
    vertical-align: middle;
  }

  .color-text {
    margin-left: 12px;
    color: #909399;
  }
}
</style>
