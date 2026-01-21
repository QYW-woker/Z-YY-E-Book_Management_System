<template>
  <div class="page-container settings-page">
    <div class="page-header">
      <h1 class="page-title">系统设置</h1>
      <p class="page-description">管理个人信息和系统配置</p>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 个人信息 -->
      <el-tab-pane label="个人信息" name="profile">
        <div class="card">
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
            style="max-width: 500px"
          >
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
              >
                <el-avatar :size="80" :src="profileForm.avatar">
                  {{ profileForm.nickname?.charAt(0) || 'A' }}
                </el-avatar>
                <div class="avatar-overlay">
                  <el-icon><Camera /></el-icon>
                </div>
              </el-upload>
            </el-form-item>
            <el-form-item label="用户名">
              <el-input :model-value="admin?.username" disabled />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="角色">
              <el-tag>{{ admin?.role === 'super_admin' ? '超级管理员' : '编辑' }}</el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileSaving" @click="saveProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 安全设置 -->
      <el-tab-pane label="安全设置" name="security">
        <div class="card">
          <h3 class="section-title">修改密码</h3>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            style="max-width: 500px"
          >
            <el-form-item label="原密码" prop="old_password">
              <el-input
                v-model="passwordForm.old_password"
                type="password"
                show-password
                placeholder="请输入原密码"
              />
            </el-form-item>
            <el-form-item label="新密码" prop="new_password">
              <el-input
                v-model="passwordForm.new_password"
                type="password"
                show-password
                placeholder="请输入新密码"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirm_password">
              <el-input
                v-model="passwordForm.confirm_password"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordSaving" @click="savePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 系统信息 -->
      <el-tab-pane label="系统信息" name="system">
        <div class="card">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统名称">电子书后台管理系统</el-descriptions-item>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="前端框架">Vue 3 + TypeScript + Vite</el-descriptions-item>
            <el-descriptions-item label="UI框架">Element Plus</el-descriptions-item>
            <el-descriptions-item label="后端框架">Node.js + Express + TypeScript</el-descriptions-item>
            <el-descriptions-item label="数据库">SQLite / PostgreSQL</el-descriptions-item>
            <el-descriptions-item label="最后登录">{{ formatDate(admin?.last_login_at || '') }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules, UploadRawFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import { formatDate } from '@/utils'

const authStore = useAuthStore()
const admin = computed(() => authStore.admin)

const activeTab = ref('profile')

// 个人信息表单
const profileFormRef = ref<FormInstance>()
const profileSaving = ref(false)
const profileForm = reactive({
  nickname: '',
  avatar: '',
})

const profileRules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' },
  ],
}

// 密码表单
const passwordFormRef = ref<FormInstance>()
const passwordSaving = ref(false)
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 头像上传
const beforeAvatarUpload = (file: UploadRawFile): boolean => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('头像只能是图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }

  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    profileForm.avatar = e.target?.result as string
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}

// 保存个人信息
const saveProfile = async () => {
  const valid = await profileFormRef.value?.validate()
  if (!valid) return

  profileSaving.value = true
  try {
    await authApi.updateProfile({
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
    })
    authStore.updateProfile({
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
    })
    ElMessage.success('保存成功')
  } finally {
    profileSaving.value = false
  }
}

// 修改密码
const savePassword = async () => {
  const valid = await passwordFormRef.value?.validate()
  if (!valid) return

  passwordSaving.value = true
  try {
    await authApi.changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    })
    ElMessage.success('密码修改成功')
    passwordFormRef.value?.resetFields()
  } finally {
    passwordSaving.value = false
  }
}

// 初始化表单
onMounted(() => {
  if (admin.value) {
    profileForm.nickname = admin.value.nickname || ''
    profileForm.avatar = admin.value.avatar || ''
  }
})
</script>

<style lang="scss" scoped>
.settings-page {
  .settings-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .section-title {
    margin: 0 0 20px;
    font-size: 16px;
    font-weight: 600;
  }

  .avatar-uploader {
    position: relative;
    cursor: pointer;

    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      .el-icon {
        font-size: 24px;
        color: #fff;
      }
    }

    &:hover .avatar-overlay {
      opacity: 1;
    }
  }
}
</style>
