<template>
  <div class="page-container book-edit-page">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">{{ isEdit ? '编辑电子书' : '新增电子书' }}</h1>
        <p class="page-description">{{ isEdit ? '修改电子书信息' : '添加新的电子书' }}</p>
      </div>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
    </div>

    <div class="edit-content">
      <el-row :gutter="20">
        <!-- 左侧表单 -->
        <el-col :xs="24" :lg="16">
          <div class="card">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-width="100px"
              v-loading="loading"
            >
              <el-form-item label="书名" prop="title">
                <el-input v-model="form.title" placeholder="请输入书名" maxlength="200" show-word-limit />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="作者" prop="author">
                    <el-input v-model="form.author" placeholder="请输入作者" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="出版社" prop="publisher">
                    <el-input v-model="form.publisher" placeholder="请输入出版社" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="出版日期" prop="publish_date">
                    <el-date-picker
                      v-model="form.publish_date"
                      type="date"
                      placeholder="选择日期"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="ISBN" prop="isbn">
                    <el-input v-model="form.isbn" placeholder="请输入ISBN" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="语言" prop="language">
                    <el-select v-model="form.language" placeholder="选择语言" style="width: 100%">
                      <el-option v-for="lang in languageOptions" :key="lang.value" :label="lang.label" :value="lang.value" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="状态" prop="status">
                    <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
                      <el-option label="草稿" value="draft" />
                      <el-option label="已上架" value="published" />
                      <el-option label="已下架" value="archived" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="分类" prop="category_ids">
                <el-cascader
                  v-model="form.category_ids"
                  :options="categoryTree"
                  :props="{ value: 'id', label: 'name', multiple: true, checkStrictly: true, emitPath: false }"
                  placeholder="选择分类"
                  clearable
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item label="标签" prop="tag_ids">
                <el-select v-model="form.tag_ids" multiple placeholder="选择标签" style="width: 100%">
                  <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id">
                    <span>{{ tag.name }}</span>
                    <span style="float: right; color: #909399; font-size: 12px">{{ tag.book_count }}本</span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="关键词" prop="keywords">
                <el-select
                  v-model="form.keywords"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="输入关键词后按回车添加"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item label="简介" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="6"
                  placeholder="请输入书籍简介"
                  maxlength="5000"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </div>
        </el-col>

        <!-- 右侧封面和文件信息 -->
        <el-col :xs="24" :lg="8">
          <div class="card cover-card">
            <div class="card-header">
              <h3 class="card-title">封面图片</h3>
              <el-button
                v-if="isEdit"
                type="primary"
                size="small"
                :loading="extractingCover"
                @click="handleExtractCover"
              >
                一键提取封面
              </el-button>
            </div>
            <div class="cover-upload">
              <el-upload
                class="cover-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :http-request="uploadCover"
                accept="image/jpeg,image/png"
              >
                <img v-if="form.cover_path" :src="getCoverUrl(form.cover_path)" class="cover-preview" />
                <div v-else class="cover-placeholder">
                  <el-icon :size="40"><Plus /></el-icon>
                  <span>上传封面</span>
                </div>
              </el-upload>
              <div class="cover-tips">
                <p>建议尺寸: 400x600 (比例2:3)</p>
                <p>格式: JPG/PNG, 最大2MB</p>
              </div>
              <el-button v-if="form.cover_path" type="danger" text size="small" @click="form.cover_path = ''">
                删除封面
              </el-button>
            </div>
          </div>

          <div class="card file-card">
            <h3 class="card-title">文件信息</h3>
            <div v-if="isEdit && form.file_path" class="file-info">
              <div class="info-item">
                <span class="label">文件格式:</span>
                <el-tag size="small">{{ form.format?.toUpperCase() }}</el-tag>
              </div>
              <div class="info-item">
                <span class="label">文件大小:</span>
                <span>{{ formatFileSize(form.file_size || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="label">浏览量:</span>
                <span>{{ formatNumber(form.view_count || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="label">下载量:</span>
                <span>{{ formatNumber(form.download_count || 0) }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间:</span>
                <span>{{ formatDate(form.created_at || '') }}</span>
              </div>
              <div class="info-item">
                <span class="label">更新时间:</span>
                <span>{{ formatDate(form.updated_at || '') }}</span>
              </div>
            </div>
            <el-empty v-else description="新建书籍暂无文件信息" />
          </div>
        </el-col>
      </el-row>

      <!-- 底部操作栏 -->
      <div class="action-bar">
        <el-button @click="$router.back()">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
        <el-button v-if="isEdit" type="success" :loading="saving" @click="handleSave(true)">
          保存并继续编辑
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadRawFile } from 'element-plus'
import type { BookMetadata, Category, Tag } from '@/types'
import { booksApi } from '@/api/books'
import { categoriesApi } from '@/api/categories'
import { tagsApi } from '@/api/tags'
import { formatDate, formatFileSize, formatNumber, languageOptions } from '@/utils'

const route = useRoute()
const router = useRouter()

const bookId = computed(() => route.params.id as string)
const isEdit = computed(() => !!bookId.value && bookId.value !== 'new')

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const extractingCover = ref(false)

// 获取封面完整URL
const getCoverUrl = (coverPath: string | undefined | null): string => {
  if (!coverPath) return ''
  // 如果是base64数据或已经是完整URL，直接返回
  if (coverPath.startsWith('data:') || coverPath.startsWith('http') || coverPath.startsWith('/')) {
    return coverPath
  }
  // 添加/uploads/前缀
  return `/uploads/${coverPath}`
}

const form = reactive<Partial<BookMetadata>>({
  title: '',
  author: '',
  publisher: '',
  publish_date: '',
  isbn: '',
  language: 'zh-CN',
  format: '',
  description: '',
  keywords: [],
  file_path: '',
  file_size: 0,
  cover_path: '',
  status: 'draft',
  category_ids: [],
  tag_ids: [],
  view_count: 0,
  download_count: 0,
  created_at: '',
  updated_at: '',
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入书名', trigger: 'blur' },
    { max: 200, message: '书名不能超过200个字符', trigger: 'blur' },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

// 分类和标签
const categoryTree = ref<Category[]>([])
const tags = ref<Tag[]>([])

// 获取书籍详情
const fetchBook = async () => {
  if (!isEdit.value) return

  loading.value = true
  try {
    const book = await booksApi.getById(bookId.value)
    Object.assign(form, book)
  } catch {
    ElMessage.error('获取书籍信息失败')
    router.back()
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

// 封面上传前校验
const beforeCoverUpload = (file: UploadRawFile): boolean => {
  const isImage = ['image/jpeg', 'image/png'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('封面图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 上传封面
const uploadCover = async (options: { file: File }) => {
  if (!isEdit.value) {
    // 新建模式下，先预览本地图片
    const reader = new FileReader()
    reader.onload = (e) => {
      form.cover_path = e.target?.result as string
    }
    reader.readAsDataURL(options.file)
    return
  }

  try {
    const result = await booksApi.uploadCover(bookId.value, options.file)
    form.cover_path = result.cover_path
    ElMessage.success('封面上传成功')
  } catch {
    ElMessage.error('封面上传失败')
  }
}

// 从PDF提取封面
const handleExtractCover = async () => {
  if (!isEdit.value) return

  extractingCover.value = true
  try {
    const result = await booksApi.extractCover(bookId.value)
    form.cover_path = result.cover_path
    ElMessage.success('封面提取成功')
  } catch (err: any) {
    ElMessage.error(err.message || '封面提取失败')
  } finally {
    extractingCover.value = false
  }
}

// 保存
const handleSave = async (continueEdit = false) => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value) {
      await booksApi.update(bookId.value, form)
      ElMessage.success('保存成功')
    } else {
      const newBook = await booksApi.create(form)
      ElMessage.success('创建成功')
      if (continueEdit) {
        router.replace(`/books/${newBook.book_id}/edit`)
        return
      }
    }

    if (!continueEdit) {
      router.push('/books')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCategoriesAndTags()
  if (isEdit.value) {
    fetchBook()
  }
})
</script>

<style lang="scss" scoped>
.book-edit-page {
  .edit-content {
    margin-top: 20px;
  }

  .card {
    margin-bottom: 20px;

    &.cover-card,
    &.file-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .card-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .cover-upload {
    text-align: center;

    .cover-uploader {
      :deep(.el-upload) {
        border: 2px dashed #d9d9d9;
        border-radius: 8px;
        cursor: pointer;
        overflow: hidden;
        transition: border-color 0.3s;

        &:hover {
          border-color: #409eff;
        }
      }
    }

    .cover-preview {
      width: 200px;
      height: 300px;
      object-fit: cover;
    }

    .cover-placeholder {
      width: 200px;
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      background: #fafafa;

      span {
        margin-top: 8px;
        font-size: 14px;
      }
    }

    .cover-tips {
      margin-top: 12px;

      p {
        margin: 4px 0;
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .file-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f2f5;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #909399;
      }
    }
  }

  .action-bar {
    position: sticky;
    bottom: 0;
    background: #fff;
    padding: 16px 20px;
    margin: 0 -20px -20px;
    border-top: 1px solid #f0f2f5;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    z-index: 10;
  }
}
</style>
