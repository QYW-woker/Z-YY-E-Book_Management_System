import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';

// Vant 完整导入（确保所有组件可用）
import Vant from 'vant';
import 'vant/lib/index.css';

// 全局样式
import './assets/styles/global.scss';

// 触摸模拟器（开发时在桌面端使用）
import '@vant/touch-emulator';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(Vant);

app.mount('#app');
