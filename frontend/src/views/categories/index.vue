<template>
  <div class="page-container categories-page">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">分类管理</h1>
        <p class="page-description">管理电子书分类，支持多级分类</p>
      </div>
      <el-button type="primary" @click="handleAdd()">
        <el-icon><Plus /></el-icon>新增分类
      </el-button>
    </div>

    <div class="card">
      <el-tree
        ref="treeRef"
        v-loading="loading"
        :data="categoryTree"
        :props="treeProps"
        node-key="id"
        default-expand-all
        draggable
        :allow-drop="allowDrop"
        @node-drop="handleDrop"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="node-label">{{ node.label }}</span>
            <span class="node-count">({{ data.book_count }}本)</span>
            <div class="node-actions">
              <el-button text type="primary" size="small" @click.stop="handleAdd(data)">
                添加子分类
              </el-button>
              <el-button text type="primary" size="small" @click.stop="handleEdit(data)">
                编辑
              </el-button>
              <el-popconfirm
                title="确定要删除该分类吗？"
                @confirm="handleDelete(data.id)"
              >
                <template #reference>
                  <el-button text type="danger" size="small" @click.stop>删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
      </el-tree>

      <el-empty v-if="!loading && categoryTree.length === 0" description="暂无分类" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingCategory ? '编辑分类' : '新增分类'" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="父级分类">
          <el-cascader
            v-model="form.parent_id"
            :options="categoryTree"
            :props="{ value: 'id', label: 'name', checkStrictly: true, emitPath: false }"
            placeholder="选择父级分类（可选）"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
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
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { Category } from '@/types'
import { categoriesApi } from '@/api/categories'

const treeRef = ref()
const loading = ref(false)
const categoryTree = ref<Category[]>([])

const treeProps = {
  children: 'children',
  label: 'name',
}

// 弹窗相关
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const editingCategory = ref<Category | null>(null)
const parentCategory = ref<Category | null>(null)

const form = reactive({
  name: '',
  parent_id: null as string | null,
  sort_order: 0,
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 50, message: '分类名称不能超过50个字符', trigger: 'blur' },
  ],
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    categoryTree.value = await categoriesApi.getTree()
  } catch {
    // 使用模拟数据
    categoryTree.value = [
      {
        id: '1',
        name: '文学',
        parent_id: null,
        sort_order: 1,
        book_count: 1234,
        created_at: '',
        updated_at: '',
        children: [
          { id: '1-1', name: '小说', parent_id: '1', sort_order: 1, book_count: 500, created_at: '', updated_at: '' },
          { id: '1-2', name: '诗歌', parent_id: '1', sort_order: 2, book_count: 200, created_at: '', updated_at: '' },
        ],
      },
      {
        id: '2',
        name: '科技',
        parent_id: null,
        sort_order: 2,
        book_count: 890,
        created_at: '',
        updated_at: '',
        children: [
          { id: '2-1', name: '计算机', parent_id: '2', sort_order: 1, book_count: 400, created_at: '', updated_at: '' },
          { id: '2-2', name: '物理', parent_id: '2', sort_order: 2, book_count: 150, created_at: '', updated_at: '' },
        ],
      },
    ]
  } finally {
    loading.value = false
  }
}

// 新增分类
const handleAdd = (parent?: Category) => {
  editingCategory.value = null
  parentCategory.value = parent || null
  form.name = ''
  form.parent_id = parent?.id || null
  form.sort_order = 0
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (category: Category) => {
  editingCategory.value = category
  form.name = category.name
  form.parent_id = category.parent_id
  form.sort_order = category.sort_order
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    if (editingCategory.value) {
      await categoriesApi.update(editingCategory.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await categoriesApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchCategories()
  } finally {
    submitting.value = false
  }
}

// 删除分类
const handleDelete = async (id: string) => {
  try {
    await categoriesApi.delete(id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch {}
}

// 拖拽排序
const allowDrop = (_draggingNode: any, _dropNode: any, type: string) => {
  return type !== 'inner' || true
}

const handleDrop = async (draggingNode: any, dropNode: any, type: string) => {
  const newParentId = type === 'inner' ? dropNode.data.id : dropNode.data.parent_id
  const siblings = type === 'inner' ? dropNode.data.children || [] : (dropNode.parent.data.children || dropNode.parent.data)

  const sortData = siblings.map((item: Category, index: number) => ({
    id: item.id,
    sort_order: index,
    parent_id: newParentId,
  }))

  try {
    await categoriesApi.updateSort(sortData)
    ElMessage.success('排序更新成功')
  } catch {
    fetchCategories()
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style lang="scss" scoped>
.categories-page {
  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 4px 0;

    .node-label {
      font-size: 14px;
    }

    .node-count {
      margin-left: 8px;
      font-size: 12px;
      color: #909399;
    }

    .node-actions {
      margin-left: auto;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .node-actions {
      opacity: 1;
    }
  }

  :deep(.el-tree-node__content) {
    height: 40px;
  }
}
</style>
