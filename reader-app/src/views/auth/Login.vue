<template>
  <div class="login-page">
    <van-nav-bar
      title="登录"
      left-arrow
      @click-left="router.back()"
    />

    <div class="login-content">
      <div class="logo">
        <van-icon name="records" size="60" color="#1989fa" />
        <h1>电子书阅读</h1>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.account"
            name="account"
            label="账户"
            placeholder="用户名/邮箱/手机"
            :rules="[{ required: true, message: '请输入账户' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="submit-btn">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            登录
          </van-button>
        </div>
      </van-form>

      <div class="footer-links">
        <span @click="router.push('/register')">注册账号</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { showToast } from 'vant';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const form = reactive({
  account: '',
  password: '',
});

async function onSubmit() {
  try {
    loading.value = true;
    await authStore.login(form.account, form.password);
    showToast({
      message: '登录成功',
      type: 'success',
    });
    // 跳转到之前的页面或首页
    const redirect = route.query.redirect as string;
    router.replace(redirect || '/');
  } catch (error: any) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.login-content {
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
  color: #1989fa;

  span {
    cursor: pointer;
  }
}
</style>
