<template>
  <div class="epub-reader">
    <!-- 阅读区域 -->
    <div ref="readerRef" class="reader-container"></div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-overlay">
      <van-loading size="40" vertical>{{ loadingText }}</van-loading>
    </div>

    <!-- 加载错误 -->
    <div v-if="errorMsg" class="error-overlay">
      <van-empty image="error" :description="errorMsg">
        <van-button type="primary" size="small" @click="initReader">重试</van-button>
      </van-empty>
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar top-toolbar">
        <van-nav-bar
          :title="bookTitle || '阅读'"
          left-arrow
          @click-left="$emit('back')"
        >
          <template #right>
            <van-icon name="bars" size="20" style="margin-right: 16px" @click="showToc = true" />
            <van-icon name="down" size="20" @click="$emit('download')" />
          </template>
        </van-nav-bar>
    </div>

    <!-- 底部工具栏 -->
    <div class="toolbar bottom-toolbar">
        <!-- 进度条 -->
        <div class="progress-section">
          <span class="progress-text">{{ currentChapter }}</span>
          <van-slider
            v-model="progress"
            :min="0"
            :max="100"
            @change="onProgressChange"
          />
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <div class="action-btn" @click="prevPage">
            <van-icon name="arrow-left" />
            <span>上一页</span>
          </div>
          <div class="action-btn" @click="showSettings = true">
            <van-icon name="setting-o" />
            <span>设置</span>
          </div>
          <div class="action-btn" @click="nextPage">
            <van-icon name="arrow" />
            <span>下一页</span>
          </div>
        </div>
    </div>

    <!-- 目录弹出层 -->
    <van-popup
      v-model:show="showToc"
      position="left"
      :style="{ width: '75%', height: '100%' }"
    >
      <div class="toc-panel">
        <div class="toc-header">目录</div>
        <div class="toc-list">
          <div
            v-for="(item, index) in tocList"
            :key="index"
            class="toc-item"
            :class="{ active: currentHref === item.href }"
            :style="{ paddingLeft: (item.level || 0) * 16 + 16 + 'px' }"
            @click="goToChapter(item.href)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 设置弹出层 -->
    <van-popup
      v-model:show="showSettings"
      position="bottom"
      :style="{ height: '40%' }"
      round
    >
      <div class="settings-panel">
        <div class="settings-header">阅读设置</div>

        <!-- 字体大小 -->
        <div class="settings-item">
          <span class="label">字体大小</span>
          <div class="font-size-control">
            <van-button size="small" @click="changeFontSize(-2)">A-</van-button>
            <span class="font-size-value">{{ fontSize }}px</span>
            <van-button size="small" @click="changeFontSize(2)">A+</van-button>
          </div>
        </div>

        <!-- 行高 -->
        <div class="settings-item">
          <span class="label">行高</span>
          <van-slider
            v-model="lineHeight"
            :min="120"
            :max="200"
            :step="10"
            @change="applyStyles"
          />
          <span class="value">{{ lineHeight }}%</span>
        </div>

        <!-- 背景色 -->
        <div class="settings-item">
          <span class="label">背景</span>
          <div class="theme-options">
            <div
              v-for="theme in themes"
              :key="theme.name"
              class="theme-option"
              :class="{ active: currentTheme === theme.name }"
              :style="{ backgroundColor: theme.bg }"
              @click="changeTheme(theme)"
            >
              <span :style="{ color: theme.color }">A</span>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import ePub from 'epubjs';
import type { Book, Rendition, NavItem } from 'epubjs';

interface TocItem {
  label: string;
  href: string;
  level?: number;
}

interface Theme {
  name: string;
  bg: string;
  color: string;
}

const props = defineProps<{
  url: string;
  title?: string;
  initialProgress?: number;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'download'): void;
  (e: 'loaded'): void;
  (e: 'progress-change', data: { progress: number; cfi: string }): void;
}>();

const readerRef = ref<HTMLElement | null>(null);
const loading = ref(true);
const loadingText = ref('正在加载...');
const errorMsg = ref('');
const showToolbar = ref(true); // 工具栏常驻显示
const showToc = ref(false);
const showSettings = ref(false);

const bookTitle = ref('');
const tocList = ref<TocItem[]>([]);
const currentChapter = ref('');
const currentHref = ref('');
const progress = ref(0);

// 阅读设置
const fontSize = ref(16);
const lineHeight = ref(150);
const currentTheme = ref('light');

const themes: Theme[] = [
  { name: 'light', bg: '#ffffff', color: '#333333' },
  { name: 'warm', bg: '#f5e6c8', color: '#5c4b37' },
  { name: 'green', bg: '#cce8cf', color: '#3d5c3d' },
  { name: 'dark', bg: '#1a1a1a', color: '#c0c0c0' },
];

let book: Book | null = null;
let rendition: Rendition | null = null;

// 初始化阅读器
async function initReader() {
  if (!readerRef.value) return;

  try {
    loading.value = true;
    errorMsg.value = '';
    loadingText.value = '正在下载书籍...';

    console.log('开始加载 EPUB:', props.url);

    // 先下载整个 EPUB 文件为 ArrayBuffer
    const response = await fetch(props.url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    loadingText.value = '正在解析书籍...';
    const arrayBuffer = await response.arrayBuffer();
    console.log('EPUB 文件下载完成, 大小:', arrayBuffer.byteLength);

    // 使用 ArrayBuffer 创建 epub 实例
    book = ePub(arrayBuffer);

    loadingText.value = '正在渲染...';
    rendition = book.renderTo(readerRef.value, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: 'paginated',
    });

    // 获取书籍元数据
    loadingText.value = '正在解析元数据...';
    const metadata = await book.loaded.metadata;
    console.log('元数据加载完成:', metadata);
    bookTitle.value = props.title || metadata.title || '未知书名';

    // 获取目录
    loadingText.value = '正在加载目录...';
    const navigation = await book.loaded.navigation;
    tocList.value = flattenToc(navigation.toc);
    console.log('目录加载完成, 章节数:', tocList.value.length);

    // 应用初始样式
    applyStyles();

    // 监听位置变化
    rendition.on('relocated', (location: any) => {
      if (location.start) {
        const percentage = book!.locations.percentageFromCfi(location.start.cfi);
        progress.value = Math.round(percentage * 100);
        currentHref.value = location.start.href;

        // 更新当前章节名
        const chapter = tocList.value.find(item =>
          location.start.href.includes(item.href.split('#')[0])
        );
        if (chapter) {
          currentChapter.value = chapter.label;
        }

        // 发送进度更新
        emit('progress-change', {
          progress: percentage,
          cfi: location.start.cfi,
        });
      }
    });

    // 先显示内容，再生成位置信息
    loadingText.value = '正在显示内容...';
    if (props.initialProgress && props.initialProgress > 0) {
      await rendition.display();
    } else {
      await rendition.display();
    }

    loading.value = false;
    emit('loaded');
    console.log('EPUB 加载完成');

    // 后台生成位置信息（不阻塞显示）
    book.locations.generate(1024).then(() => {
      console.log('位置信息生成完成');
      // 恢复阅读进度
      if (props.initialProgress && props.initialProgress > 0 && book) {
        const cfi = book.locations.cfiFromPercentage(props.initialProgress / 100);
        rendition?.display(cfi);
      }
    }).catch(err => {
      console.warn('生成位置信息失败:', err);
    });

  } catch (error: any) {
    console.error('初始化EPUB阅读器失败:', error);
    errorMsg.value = error?.message || '加载失败，请重试';
    loading.value = false;
  }
}

// 展平目录
function flattenToc(items: NavItem[], level = 0): TocItem[] {
  const result: TocItem[] = [];
  for (const item of items) {
    result.push({
      label: item.label,
      href: item.href,
      level,
    });
    if (item.subitems && item.subitems.length > 0) {
      result.push(...flattenToc(item.subitems, level + 1));
    }
  }
  return result;
}

// 跳转到章节
async function goToChapter(href: string) {
  if (rendition) {
    await rendition.display(href);
    showToc.value = false;
  }
}

// 上一页
function prevPage() {
  if (rendition) {
    rendition.prev();
  }
}

// 下一页
function nextPage() {
  if (rendition) {
    rendition.next();
  }
}

// 进度变化
function onProgressChange(value: number) {
  if (book && rendition) {
    const cfi = book.locations.cfiFromPercentage(value / 100);
    rendition.display(cfi);
  }
}

// 修改字体大小
function changeFontSize(delta: number) {
  fontSize.value = Math.max(12, Math.min(28, fontSize.value + delta));
  applyStyles();
}

// 应用样式
function applyStyles() {
  if (!rendition) return;

  const theme = themes.find(t => t.name === currentTheme.value) || themes[0];

  rendition.themes.default({
    body: {
      'font-size': `${fontSize.value}px !important`,
      'line-height': `${lineHeight.value}% !important`,
      'background-color': `${theme.bg} !important`,
      'color': `${theme.color} !important`,
    },
    'p, div, span': {
      'font-size': `${fontSize.value}px !important`,
      'line-height': `${lineHeight.value}% !important`,
    },
  });

  // 更新阅读器容器背景
  if (readerRef.value) {
    readerRef.value.style.backgroundColor = theme.bg;
  }
}

// 切换主题
function changeTheme(theme: Theme) {
  currentTheme.value = theme.name;
  applyStyles();
}

// 键盘导航
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    prevPage();
  } else if (e.key === 'ArrowRight') {
    nextPage();
  }
}

// 触摸滑动
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e: TouchEvent) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      nextPage();
    } else {
      prevPage();
    }
  }
}

onMounted(() => {
  initReader();
  document.addEventListener('keydown', handleKeydown);
  if (readerRef.value) {
    readerRef.value.addEventListener('touchstart', handleTouchStart);
    readerRef.value.addEventListener('touchend', handleTouchEnd);
  }
});

onUnmounted(() => {
  if (book) {
    book.destroy();
  }
  document.removeEventListener('keydown', handleKeydown);
});

// 监听 URL 变化
watch(() => props.url, () => {
  if (book) {
    book.destroy();
  }
  initReader();
});
</script>

<style lang="scss" scoped>
// ============================================
// EPUB Reader - iOS (Mobile) + Material Design (PC)
// ============================================

.epub-reader {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #fff;
}

.reader-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  // iOS style
  @media (max-width: 767px) {
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  // Material Design style
  @media (min-width: 768px) {
    background-color: rgba(255, 255, 255, 0.9);
  }
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  z-index: 100;
}

.toolbar {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 99;
}

.top-toolbar {
  top: 0;

  // iOS NavBar style
  :deep(.van-nav-bar) {
    @media (max-width: 767px) {
      background: rgba(249, 249, 249, 0.94);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);

      &::after {
        background-color: var(--ios-separator);
      }

      .van-nav-bar__title {
        font-size: 17px;
        font-weight: 600;
      }

      .van-nav-bar__right .van-icon {
        color: var(--ios-blue);
      }
    }

    @media (min-width: 768px) {
      background: var(--md-surface);
      box-shadow: var(--md-elevation-1);

      .van-nav-bar__title {
        font-size: 20px;
        font-weight: 500;
      }

      .van-nav-bar__right .van-icon {
        color: var(--md-primary);
        transition: color 0.28s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          color: var(--md-primary-dark);
        }
      }
    }
  }
}

.bottom-toolbar {
  bottom: 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));

  // iOS style
  @media (max-width: 767px) {
    background: rgba(249, 249, 249, 0.94);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    padding: var(--ios-spacing-md);
    padding-bottom: calc(var(--ios-spacing-md) + env(safe-area-inset-bottom));

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 0.5px;
      background: var(--ios-separator);
    }
  }

  // Material Design style
  @media (min-width: 768px) {
    background: var(--md-surface);
    padding: var(--md-spacing-md) var(--md-spacing-lg);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  }
}

.progress-section {
  display: flex;
  align-items: center;
  gap: var(--ios-spacing-md);
  margin-bottom: var(--ios-spacing-md);

  @media (min-width: 768px) {
    gap: var(--md-spacing-md);
    margin-bottom: var(--md-spacing-md);
  }

  .progress-text {
    white-space: nowrap;

    @media (max-width: 767px) {
      font-size: 13px;
      color: var(--ios-gray);
      min-width: 40px;
    }

    @media (min-width: 768px) {
      font-size: 14px;
      color: var(--md-on-surface-medium);
      min-width: 50px;
    }

    &:first-child {
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .van-slider {
    flex: 1;
  }
}

.action-buttons {
  display: flex;
  justify-content: space-around;

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;

    // iOS style
    @media (max-width: 767px) {
      padding: var(--ios-spacing-sm) var(--ios-spacing-md);
      color: var(--ios-blue);

      &:active {
        opacity: 0.5;
      }

      .van-icon {
        font-size: 22px;
        margin-bottom: 4px;
      }

      span {
        font-size: 11px;
      }
    }

    // Material Design style
    @media (min-width: 768px) {
      padding: var(--md-spacing-sm) var(--md-spacing-lg);
      color: var(--md-primary);
      border-radius: var(--md-radius-md);
      transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background-color: rgba(25, 118, 210, 0.08);
      }

      .van-icon {
        font-size: 24px;
        margin-bottom: 6px;
      }

      span {
        font-size: 13px;
        font-weight: 500;
      }
    }
  }
}

// ============================================
// TOC Panel
// ============================================
.toc-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  // iOS style
  @media (max-width: 767px) {
    background: var(--ios-card-bg);
  }

  // Material Design style
  @media (min-width: 768px) {
    background: var(--md-surface);
  }

  .toc-header {
    border-bottom: 0.5px solid var(--ios-separator);

    @media (max-width: 767px) {
      padding: var(--ios-spacing-md);
      font-size: 17px;
      font-weight: 600;
      color: #1C1C1E;
    }

    @media (min-width: 768px) {
      padding: var(--md-spacing-md) var(--md-spacing-lg);
      font-size: 20px;
      font-weight: 500;
      color: var(--md-on-surface);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }
  }

  .toc-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .toc-item {
    cursor: pointer;
    position: relative;

    // iOS style
    @media (max-width: 767px) {
      padding: var(--ios-spacing-md);
      font-size: 15px;
      color: #1C1C1E;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: var(--ios-spacing-md);
        right: 0;
        height: 0.5px;
        background: var(--ios-separator);
      }

      &:active {
        background: var(--ios-gray-5);
      }

      &.active {
        color: var(--ios-blue);
        background: rgba(0, 122, 255, 0.08);
      }
    }

    // Material Design style
    @media (min-width: 768px) {
      padding: var(--md-spacing-md) var(--md-spacing-lg);
      font-size: 14px;
      color: var(--md-on-surface);
      transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      &.active {
        color: var(--md-primary);
        background: rgba(25, 118, 210, 0.12);
        font-weight: 500;
      }
    }
  }
}

// ============================================
// Settings Panel
// ============================================
.settings-panel {
  // iOS style
  @media (max-width: 767px) {
    padding: var(--ios-spacing-md);
    background: var(--ios-card-bg);
  }

  // Material Design style
  @media (min-width: 768px) {
    padding: var(--md-spacing-lg);
    background: var(--md-surface);
  }

  .settings-header {
    text-align: center;

    @media (max-width: 767px) {
      font-size: 17px;
      font-weight: 600;
      color: #1C1C1E;
      margin-bottom: var(--ios-spacing-lg);
    }

    @media (min-width: 768px) {
      font-size: 20px;
      font-weight: 500;
      color: var(--md-on-surface);
      margin-bottom: var(--md-spacing-lg);
    }
  }

  .settings-item {
    display: flex;
    align-items: center;

    @media (max-width: 767px) {
      margin-bottom: var(--ios-spacing-lg);
    }

    @media (min-width: 768px) {
      margin-bottom: var(--md-spacing-lg);
    }

    .label {
      width: 70px;

      @media (max-width: 767px) {
        font-size: 15px;
        color: #1C1C1E;
      }

      @media (min-width: 768px) {
        font-size: 14px;
        color: var(--md-on-surface);
        font-weight: 500;
      }
    }

    .van-slider {
      flex: 1;
      margin: 0 var(--ios-spacing-md);

      @media (min-width: 768px) {
        margin: 0 var(--md-spacing-md);
      }
    }

    .value {
      width: 50px;
      text-align: right;

      @media (max-width: 767px) {
        font-size: 13px;
        color: var(--ios-gray);
      }

      @media (min-width: 768px) {
        font-size: 14px;
        color: var(--md-on-surface-medium);
      }
    }
  }

  .font-size-control {
    display: flex;
    align-items: center;
    gap: var(--ios-spacing-md);

    @media (min-width: 768px) {
      gap: var(--md-spacing-md);
    }

    .font-size-value {
      min-width: 50px;
      text-align: center;

      @media (max-width: 767px) {
        font-size: 15px;
        color: #1C1C1E;
      }

      @media (min-width: 768px) {
        font-size: 16px;
        color: var(--md-on-surface);
        font-weight: 500;
      }
    }
  }

  .theme-options {
    display: flex;
    gap: var(--ios-spacing-md);

    @media (min-width: 768px) {
      gap: var(--md-spacing-md);
    }

    .theme-option {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s ease;

      @media (max-width: 767px) {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid transparent;
        font-size: 17px;

        &:active {
          transform: scale(0.95);
        }

        &.active {
          border-color: var(--ios-blue);
        }
      }

      @media (min-width: 768px) {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid transparent;
        font-size: 18px;
        box-shadow: var(--md-elevation-1);

        &:hover {
          box-shadow: var(--md-elevation-2);
        }

        &.active {
          border-color: var(--md-primary);
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
      }
    }
  }
}
</style>
