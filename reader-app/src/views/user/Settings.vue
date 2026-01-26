<template>
  <div class="settings-page">
    <van-nav-bar
      title="设置"
      left-arrow
      @click-left="router.back()"
    />

    <van-cell-group inset title="账户信息">
      <van-field
        v-model="form.nickname"
        label="昵称"
        placeholder="请输入昵称"
      />
      <van-field
        v-model="form.email"
        label="邮箱"
        placeholder="请输入邮箱"
      />
      <van-field
        v-model="form.phone"
        label="手机"
        placeholder="请输入手机号"
      />
    </van-cell-group>

    <div class="save-btn">
      <van-button type="primary" block :loading="saving" @click="handleSave">
        保存修改
      </van-button>
    </div>

    <van-cell-group inset title="修改密码">
      <van-field
        v-model="passwordForm.old_password"
        type="password"
        label="旧密码"
        placeholder="请输入旧密码"
      />
      <van-field
        v-model="passwordForm.new_password"
        type="password"
        label="新密码"
        placeholder="请输入新密码（至少6位）"
      />
      <van-field
        v-model="passwordForm.confirm_password"
        type="password"
        label="确认密码"
        placeholder="请再次输入新密码"
      />
    </van-cell-group>

    <div class="save-btn">
      <van-button type="primary" block :loading="changingPassword" @click="handleChangePassword">
        修改密码
      </van-button>
    </div>

    <van-cell-group inset title="其他">
      <van-cell title="清除浏览历史" is-link @click="handleClearHistory" />
      <van-cell title="关于" is-link @click="showAbout = true" />
    </van-cell-group>

    <!-- 关于弹窗 -->
    <van-dialog v-model:show="showAbout" title="关于" confirm-button-text="知道了">
      <div class="about-content">
        <p>电子书阅读 v1.0.0</p>
        <p>一个简洁的电子书阅读应用</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useAuthStore } from '@/stores/auth';
import { userApi } from '@/api/user';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  nickname: '',
  email: '',
  phone: '',
});

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

const saving = ref(false);
const changingPassword = ref(false);
const showAbout = ref(false);

// 保存信息
async function handleSave() {
  try {
    saving.value = true;
    await authStore.updateProfile({
      nickname: form.nickname,
      email: form.email || undefined,
      phone: form.phone || undefined,
    });
    showToast({
      message: '保存成功',
      type: 'success',
    });
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    saving.value = false;
  }
}

// 修改密码
async function handleChangePassword() {
  if (!passwordForm.old_password) {
    showToast('请输入旧密码');
    return;
  }
  if (!passwordForm.new_password) {
    showToast('请输入新密码');
    return;
  }
  if (passwordForm.new_password.length < 6) {
    showToast('新密码至少6位');
    return;
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    showToast('两次密码不一致');
    return;
  }

  try {
    changingPassword.value = true;
    await authStore.changePassword(passwordForm.old_password, passwordForm.new_password);
    showToast({
      message: '密码修改成功',
      type: 'success',
    });
    // 清空表单
    passwordForm.old_password = '';
    passwordForm.new_password = '';
    passwordForm.confirm_password = '';
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    changingPassword.value = false;
  }
}

// 清除浏览历史
async function handleClearHistory() {
  try {
    await showConfirmDialog({
      title: '提示',
      message: '确定要清空所有浏览历史吗？',
    });
    await userApi.clearViewHistory();
    showToast('已清空');
  } catch {
    // 取消
  }
}

// 初始化表单
function initForm() {
  if (authStore.user) {
    form.nickname = authStore.user.nickname || '';
    form.email = authStore.user.email || '';
    form.phone = authStore.user.phone || '';
  }
}

onMounted(() => {
  initForm();
});
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.save-btn {
  padding: 16px;
}

.about-content {
  padding: 20px;
  text-align: center;
  color: #646566;

  p {
    margin: 8px 0;
  }
}
</style>
