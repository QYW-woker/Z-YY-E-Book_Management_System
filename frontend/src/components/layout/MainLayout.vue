<template>
  <el-container class="main-layout">
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <el-icon :size="24"><Reading /></el-icon>
        </div>
        <span v-show="!collapsed" class="logo-text">电子书管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item :index="route.path">
            <el-icon><component :is="route.meta?.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            :size="18"
            @click="toggleSidebar"
          >
            <component :is="collapsed ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute?.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="admin?.avatar" class="user-avatar">
                {{ admin?.nickname?.charAt(0) || 'A' }}
              </el-avatar>
              <span class="username">{{ admin?.nickname || admin?.username }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>

  <!-- 修改密码弹窗 -->
  <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
    <el-form
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="passwordRules"
      label-width="80px"
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
          placeholder="请确认新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="passwordDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="passwordLoading" @click="submitPassword">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { authApi } from '@/api/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)
const sidebarWidth = computed(() => (collapsed.value ? '64px' : '200px'))
const admin = computed(() => authStore.admin)

const currentRoute = computed(() => route)
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta?.activeMenu) {
    return meta.activeMenu as string
  }
  return path
})

// 菜单路由
const menuRoutes = computed(() => {
  const routes = router.getRoutes()
  return routes
    .filter((r) => r.meta?.icon && !r.meta?.hidden)
    .sort((a, b) => {
      const order = ['Dashboard', 'Books', 'Categories', 'Tags', 'Statistics', 'Settings']
      return order.indexOf(a.name as string) - order.indexOf(b.name as string)
    })
})

// 切换侧边栏
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

// 修改密码相关
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref<FormInstance>()
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

const submitPassword = async () => {
  const valid = await passwordFormRef.value?.validate()
  if (!valid) return

  passwordLoading.value = true
  try {
    await authApi.changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    })
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    passwordFormRef.value?.resetFields()
  } finally {
    passwordLoading.value = false
  }
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'password':
      passwordDialogVisible.value = true
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        authStore.logout()
      })
      break
  }
}
</script>

<style lang="scss" scoped>
$primary-color: #2E6BE6;
$primary-light: #5B8FF9;
$sidebar-bg: #ffffff;
$sidebar-border: #E5E6EB;

.main-layout {
  height: 100vh;
}

.sidebar {
  background: $sidebar-bg;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.05);
  border-right: 1px solid $sidebar-border;

  .logo {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    gap: 10px;
    background: $sidebar-bg;
    border-bottom: 1px solid $sidebar-border;

    .logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }

    .logo-text {
      color: #1F2329;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 1px;
    }
  }

  .sidebar-menu {
    border-right: none;
    background-color: transparent;
    padding: 8px;

    :deep(.el-menu-item) {
      height: 44px;
      line-height: 44px;
      margin: 4px 0;
      border-radius: 8px;
      color: #4E5969;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      .el-icon {
        font-size: 18px;
      }

      &:hover {
        color: $primary-color;
        background-color: #F2F3F5;
      }

      &.is-active {
        color: #fff;
        background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
        box-shadow: 0 4px 12px rgba($primary-color, 0.4);
      }
    }

    &.el-menu--collapse {
      :deep(.el-menu-item) {
        padding: 0 !important;
        justify-content: center;
      }
    }
  }
}

.main-container {
  background-color: #F5F7FA;
}

.header {
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 10;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      color: #4E5969;
      transition: all 0.25s;

      &:hover {
        background-color: #F2F3F5;
        color: $primary-color;
      }
    }

    :deep(.el-breadcrumb) {
      font-size: 14px;

      .el-breadcrumb__inner {
        color: #86909C;

        &.is-link:hover {
          color: $primary-color;
        }
      }

      .el-breadcrumb__item:last-child .el-breadcrumb__inner {
        color: #1F2329;
        font-weight: 500;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.25s;

      &:hover {
        background-color: #F2F3F5;
      }

      .user-avatar {
        background: linear-gradient(135deg, $primary-color 0%, $primary-light 100%);
        color: #fff;
        font-weight: 600;
      }

      .username {
        font-size: 14px;
        color: #1F2329;
        font-weight: 500;
      }

      .arrow-icon {
        color: #86909C;
        font-size: 12px;
      }
    }
  }
}

.main-content {
  padding: 0;
  overflow: auto;
  background-color: #F5F7FA;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
