<template>
  <div class="page-container import-page">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">导入电子书</h1>
        <p class="page-description">支持批量上传PDF、EPUB、MOBI、AZW3格式电子书</p>
      </div>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
    </div>

    <div class="card">
      <!-- 上传区域 -->
      <el-upload
        ref="uploadRef"
        class="upload-area"
        drag
        multiple
        :auto-upload="false"
        :accept="acceptTypes"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持格式: PDF、EPUB、MOBI、AZW3，单个文件最大500MB
          </div>
        </template>
      </el-upload>

      <!-- 文件列表 -->
      <div v-if="uploadFiles.length > 0" class="file-list">
        <div class="file-list-header flex-between">
          <span>待上传文件 ({{ uploadFiles.length }})</span>
          <div>
            <el-button size="small" @click="clearFiles">清空列表</el-button>
            <el-button type="primary" size="small" :loading="uploading" @click="startUpload">
              开始导入
            </el-button>
          </div>
        </div>

        <el-table :data="uploadFiles" max-height="400">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="封面" width="80">
            <template #default="{ row }">
              <div class="cover-cell">
                <el-image
                  v-if="row.cover"
                  :src="row.cover"
                  fit="cover"
                  class="cover-preview"
                />
                <div v-else-if="row.coverLoading" class="cover-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
                </div>
                <div v-else class="cover-empty">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="文件名" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="file-name">
                <el-icon><Document /></el-icon>
                <span>{{ row.filename }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="格式" width="80">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ getFileFormat(row.filename) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.file?.size || 0) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-progress
                v-if="row.status === 'uploading'"
                :percentage="row.progress"
                :stroke-width="6"
                :show-text="false"
              />
              <el-tag v-else-if="row.status === 'success'" type="success" size="small">
                成功
              </el-tag>
              <el-tag v-else-if="row.status === 'error'" type="danger" size="small">
                失败
              </el-tag>
              <el-tag v-else size="small">等待上传</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="错误信息" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.error" class="error-text">{{ row.error }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row, $index }">
              <el-button
                text
                type="danger"
                size="small"
                :disabled="row.status === 'uploading'"
                @click="removeFile($index)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 导入结果 -->
      <div v-if="importResult" class="import-result">
        <el-divider />
        <h3>导入结果</h3>
        <div class="result-summary">
          <div class="result-item success">
            <el-icon><SuccessFilled /></el-icon>
            <span>成功: {{ importResult.success }} 本</span>
          </div>
          <div class="result-item error">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>失败: {{ importResult.failed }} 本</span>
          </div>
        </div>

        <el-table v-if="importResult.results.length > 0" :data="importResult.results" max-height="300">
          <el-table-column prop="filename" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="错误原因" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.error || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button
                v-if="row.success && row.book_id"
                text
                type="primary"
                size="small"
                @click="$router.push(`/books/${row.book_id}/edit`)"
              >
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="result-actions">
          <el-button @click="resetImport">继续导入</el-button>
          <el-button type="primary" @click="$router.push('/books')">查看书籍列表</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Loading, Picture } from '@element-plus/icons-vue'
import type { ImportResult, UploadProgress } from '@/types'
import { booksApi } from '@/api/books'
import { formatFileSize, getFileExtension } from '@/utils'

interface UploadFileItem extends UploadProgress {
  file: File
  cover?: string
  coverLoading?: boolean
}

const acceptTypes = '.pdf,.epub,.mobi,.azw3'
const allowedFormats = ['pdf', 'epub', 'mobi', 'azw3']
const maxFileSize = 500 * 1024 * 1024 // 500MB

const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadFile[]>([])
const uploadFiles = ref<UploadFileItem[]>([])
const uploading = ref(false)
const importResult = ref<ImportResult | null>(null)

// 获取文件格式
const getFileFormat = (filename: string): string => {
  return getFileExtension(filename).toUpperCase()
}

// 提取电子书封面预览
const extractCoverPreview = async (filename: string, file: File) => {
  console.log('[extractCoverPreview] ====== Function called ======')
  console.log('[extractCoverPreview] filename:', filename)
  console.log('[extractCoverPreview] file:', file)
  const ext = getFileExtension(filename)
  console.log('[extractCoverPreview] extension:', ext)
  const supportedFormats = ['pdf', 'epub', 'mobi', 'azw3', 'azw']
  if (!supportedFormats.includes(ext)) {
    console.log('[extractCoverPreview] Format not supported, returning')
    return
  }

  // 找到数组中的索引
  const index = uploadFiles.value.findIndex(f => f.filename === filename)
  console.log('[extractCoverPreview] Found index:', index)
  if (index === -1) {
    console.log('[extractCoverPreview] File not found in uploadFiles, returning')
    return
  }

  // 通过索引更新，确保触发Vue响应式
  uploadFiles.value[index].coverLoading = true

  // 添加超时控制
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('封面提取超时')), 60000)
  })

  try {
    console.log('[extractCoverPreview] Starting cover extraction for:', filename)
    console.log('[extractCoverPreview] File size:', file.size, 'bytes')
    const result = await Promise.race([
      booksApi.previewCover(file),
      timeoutPromise
    ])
    console.log('[extractCoverPreview] API response:', result)
    // 重新查找索引（防止数组变化）
    const currentIndex = uploadFiles.value.findIndex(f => f.filename === filename)
    if (currentIndex !== -1 && result.cover) {
      uploadFiles.value[currentIndex].cover = result.cover
      uploadFiles.value[currentIndex].coverLoading = false
      console.log('[extractCoverPreview] Cover set successfully for:', filename)
    } else {
      console.log('[extractCoverPreview] No cover in response or file not found')
      if (currentIndex !== -1) {
        uploadFiles.value[currentIndex].coverLoading = false
      }
    }
  } catch (err: any) {
    console.error('[extractCoverPreview] Failed to extract cover preview:', err)
    const currentIndex = uploadFiles.value.findIndex(f => f.filename === filename)
    if (currentIndex !== -1) {
      uploadFiles.value[currentIndex].coverLoading = false
    }
  }
}

// 处理文件变化
const handleFileChange = (file: UploadFile) => {
  console.log('[handleFileChange] ====== START ======')
  console.log('[handleFileChange] file.name:', file.name)
  console.log('[handleFileChange] file.raw:', file.raw)
  const ext = getFileExtension(file.name)
  console.log('[handleFileChange] extension:', ext)

  // 检查格式
  if (!allowedFormats.includes(ext)) {
    ElMessage.error(`不支持的文件格式: ${ext}`)
    fileList.value = fileList.value.filter((f) => f.uid !== file.uid)
    return
  }

  // 检查大小
  if (file.size && file.size > maxFileSize) {
    ElMessage.error(`文件过大: ${file.name}，最大支持500MB`)
    fileList.value = fileList.value.filter((f) => f.uid !== file.uid)
    return
  }

  // 添加到上传列表
  const rawFile = file.raw as File
  if (!rawFile) {
    console.error('file.raw is undefined!')
    return
  }
  const fileItem: UploadFileItem = {
    filename: file.name,
    progress: 0,
    status: 'pending',
    file: rawFile,
    cover: undefined,
    coverLoading: false,
  }
  uploadFiles.value.push(fileItem)

  // 自动提取封面预览（支持PDF、EPUB、MOBI、AZW3格式）
  console.log('[handleFileChange] About to call extractCoverPreview for:', file.name)
  extractCoverPreview(file.name, rawFile)
  console.log('[handleFileChange] extractCoverPreview called')
}

// 处理文件移除
const handleFileRemove = (file: UploadFile) => {
  const index = uploadFiles.value.findIndex((f) => f.filename === file.name)
  if (index > -1) {
    uploadFiles.value.splice(index, 1)
  }
}

// 移除单个文件
const removeFile = (index: number) => {
  const file = uploadFiles.value[index]
  uploadFiles.value.splice(index, 1)
  fileList.value = fileList.value.filter((f) => f.name !== file.filename)
}

// 清空文件列表
const clearFiles = () => {
  uploadFiles.value = []
  fileList.value = []
  uploadRef.value?.clearFiles()
}

// 开始上传
const startUpload = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  uploading.value = true
  importResult.value = null

  try {
    // 获取所有待上传的文件
    const files = uploadFiles.value.map((f) => f.file)

    // 收集已提取的封面数据
    const covers: Record<string, string> = {}
    uploadFiles.value.forEach((f) => {
      if (f.cover) {
        covers[f.filename] = f.cover
      }
    })

    // 更新状态为上传中
    uploadFiles.value.forEach((f) => {
      f.status = 'uploading'
      f.progress = 0
    })

    // 调用批量导入API，传递封面数据
    const result = await booksApi.import(files, covers, (progress) => {
      // 更新总进度
      uploadFiles.value.forEach((f) => {
        if (f.status === 'uploading') {
          f.progress = progress
        }
      })
    })

    // 更新各文件状态
    result.results.forEach((r) => {
      const file = uploadFiles.value.find((f) => f.filename === r.filename)
      if (file) {
        file.status = r.success ? 'success' : 'error'
        file.error = r.error
        file.progress = 100
      }
    })

    importResult.value = result
    ElMessage.success(`导入完成: 成功 ${result.success} 本, 失败 ${result.failed} 本`)
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
    uploadFiles.value.forEach((f) => {
      if (f.status === 'uploading') {
        f.status = 'error'
        f.error = error.message || '导入失败'
      }
    })
  } finally {
    uploading.value = false
  }
}

// 重置导入
const resetImport = () => {
  clearFiles()
  importResult.value = null
}
</script>

<style lang="scss" scoped>
.import-page {
  .upload-area {
    margin-bottom: 24px;

    :deep(.el-upload-dragger) {
      padding: 40px 20px;
    }

    :deep(.el-icon--upload) {
      font-size: 48px;
      color: #c0c4cc;
      margin-bottom: 16px;
    }
  }

  .file-list {
    .file-list-header {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 4px;
    }

    .cover-cell {
      width: 50px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;

      .cover-preview {
        width: 50px;
        height: 70px;
        border-radius: 4px;
        object-fit: cover;
      }

      .cover-loading,
      .cover-empty {
        width: 50px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
        border-radius: 4px;
        color: #c0c4cc;

        .el-icon {
          font-size: 20px;
        }
      }
    }

    .file-name {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #409eff;
      }
    }

    .error-text {
      color: #f56c6c;
      font-size: 12px;
    }
  }

  .import-result {
    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
    }

    .result-summary {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;

      .result-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;

        &.success {
          color: #67c23a;
        }

        &.error {
          color: #f56c6c;
        }

        .el-icon {
          font-size: 20px;
        }
      }
    }

    .result-actions {
      margin-top: 24px;
      display: flex;
      justify-content: center;
      gap: 16px;
    }
  }
}
</style>
