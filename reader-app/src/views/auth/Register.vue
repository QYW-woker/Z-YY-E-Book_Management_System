<template>
  <div class="register-page">
    <van-nav-bar
      title="注册"
      left-arrow
      @click-left="router.back()"
    />

    <div class="register-content">
      <div class="logo">
        <van-icon name="records" size="60" color="#1989fa" />
        <h1>电子书阅读</h1>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="用户名"
            placeholder="4-20位字母数字下划线"
            :rules="[
              { required: true, message: '请输入用户名' },
              { pattern: /^[a-zA-Z0-9_]{4,20}$/, message: '用户名格式不正确' }
            ]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="至少6位"
            :rules="[
              { required: true, message: '请输入密码' },
              { validator: validatePassword, message: '密码至少6位' }
            ]"
          />
          <van-field
            v-model="form.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="再次输入密码"
            :rules="[
              { required: true, message: '请确认密码' },
              { validator: validateConfirmPassword, message: '两次密码不一致' }
            ]"
          />
          <van-field
            v-model="form.email"
            name="email"
            label="邮箱"
            placeholder="选填"
            :rules="[
              { pattern: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
            ]"
          />
        </van-cell-group>

        <div class="submit-btn">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            注册
          </van-button>
        </div>
      </van-form>

      <div class="footer-links">
        <span>已有账号？</span>
        <span class="link" @click="router.push('/login')">去登录</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
});

function validatePassword(value: string): boolean {
  return value.length >= 6;
}

function validateConfirmPassword(value: string): boolean {
  return value === form.password;
}

async function onSubmit() {
  try {
    loading.value = true;
    await authStore.register(
      form.username,
      form.password,
      form.email || undefined
    );
    showToast({
      message: '注册成功',
      type: 'success',
    });
    router.replace('/');
  } catch (error: any) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.register-content {
  padding: 40px 16px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;

  h1 {
    margin-top: 12px;
    font-size: 24px;
    color: #323233;
  }
}

.submit-btn {
  margin: 24px 16px;
}

.footer-links {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #969799;

  .link {
    color: #1989fa;
    cursor: pointer;
  }
}
</style>
