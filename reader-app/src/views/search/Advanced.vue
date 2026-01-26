<template>
  <div class="advanced-search-page">
    <van-nav-bar
      title="高级搜索"
      left-arrow
      @click-left="router.back()"
    />

    <van-form @submit="onSubmit">
      <van-cell-group inset title="搜索条件">
        <van-field
          v-model="form.keyword"
          label="关键词"
          placeholder="搜索书名、作者、简介"
        />
        <van-field
          v-model="form.title"
          label="书名"
          placeholder="精确搜索书名"
        />
        <van-field
          v-model="form.author"
          label="作者"
          placeholder="搜索作者"
        />
        <van-field
          v-model="form.isbn"
          label="ISBN"
          placeholder="搜索ISBN"
        />
      </van-cell-group>

      <van-cell-group inset title="筛选条件">
        <van-field
          v-model="categoryName"
          is-link
          readonly
          label="分类"
          placeholder="选择分类"
          @click="showCategoryPicker = true"
        />
        <van-field
          v-model="formatName"
          is-link
          readonly
          label="格式"
          placeholder="选择格式"
          @click="showFormatPicker = true"
        />
        <van-field
          v-model="languageName"
          is-link
          readonly
          label="语言"
          placeholder="选择语言"
          @click="showLanguagePicker = true"
        />
      </van-cell-group>

      <van-cell-group inset title="出版日期">
        <van-field
          v-model="form.publish_date_start"
          is-link
          readonly
          label="开始日期"
          placeholder="选择开始日期"
          @click="showStartDatePicker = true"
        />
        <van-field
          v-model="form.publish_date_end"
          is-link
          readonly
          label="结束日期"
          placeholder="选择结束日期"
          @click="showEndDatePicker = true"
        />
      </van-cell-group>

      <div class="submit-btns">
        <van-button type="default" block @click="resetForm">重置</van-button>
        <van-button type="primary" block native-type="submit">搜索</van-button>
      </div>
    </van-form>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom">
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>

    <!-- 格式选择器 -->
    <van-popup v-model:show="showFormatPicker" position="bottom">
      <van-picker
        :columns="formatColumns"
        @confirm="onFormatConfirm"
        @cancel="showFormatPicker = false"
      />
    </van-popup>

    <!-- 语言选择器 -->
    <van-popup v-model:show="showLanguagePicker" position="bottom">
      <van-picker
        :columns="languageColumns"
        @confirm="onLanguageConfirm"
        @cancel="showLanguagePicker = false"
      />
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showStartDatePicker" position="bottom">
      <van-date-picker
        v-model="startDate"
        title="选择开始日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onStartDateConfirm"
        @cancel="showStartDatePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showEndDatePicker" position="bottom">
      <van-date-picker
        v-model="endDate"
        title="选择结束日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onEndDateConfirm"
        @cancel="showEndDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { booksApi } from '@/api/books';
import type { Category } from '@/types';

const router = useRouter();

const form = reactive({
  keyword: '',
  title: '',
  author: '',
  isbn: '',
  category_id: '',
  format: '',
  language: '',
  publish_date_start: '',
  publish_date_end: '',
});

const categoryName = ref('');
const formatName = ref('');
const languageName = ref('');

const showCategoryPicker = ref(false);
const showFormatPicker = ref(false);
const showLanguagePicker = ref(false);
const showStartDatePicker = ref(false);
const showEndDatePicker = ref(false);

const categories = ref<Category[]>([]);
const minDate = new Date(1900, 0, 1);
const maxDate = new Date();
const startDate = ref(['2000', '01', '01']);
const endDate = ref(['2025', '12', '31']);

// 分类选项
const categoryColumns = computed(() => {
  const flatCategories = (cats: Category[], prefix = ''): { text: string; value: string }[] => {
    const result: { text: string; value: string }[] = [];
    for (const cat of cats) {
      result.push({ text: prefix + cat.name, value: cat.id });
      if (cat.children) {
        result.push(...flatCategories(cat.children, prefix + '  '));
      }
    }
    return result;
  };
  return [{ text: '全部', value: '' }, ...flatCategories(categories.value)];
});

// 格式选项
const formatColumns = [
  { text: '全部', value: '' },
  { text: 'PDF', value: 'pdf' },
  { text: 'EPUB', value: 'epub' },
  { text: 'MOBI', value: 'mobi' },
  { text: 'AZW3', value: 'azw3' },
];

// 语言选项
const languageColumns = [
  { text: '全部', value: '' },
  { text: '简体中文', value: 'zh-CN' },
  { text: '繁体中文', value: 'zh-TW' },
  { text: '英语', value: 'en' },
  { text: '日语', value: 'ja' },
  { text: '韩语', value: 'ko' },
];

// 分类确认
function onCategoryConfirm({ selectedOptions }: any) {
  const option = selectedOptions[0];
  form.category_id = option.value;
  categoryName.value = option.value ? option.text.trim() : '';
  showCategoryPicker.value = false;
}

// 格式确认
function onFormatConfirm({ selectedOptions }: any) {
  const option = selectedOptions[0];
  form.format = option.value;
  formatName.value = option.value ? option.text : '';
  showFormatPicker.value = false;
}

// 语言确认
function onLanguageConfirm({ selectedOptions }: any) {
  const option = selectedOptions[0];
  form.language = option.value;
  languageName.value = option.value ? option.text : '';
  showLanguagePicker.value = false;
}

// 开始日期确认
function onStartDateConfirm({ selectedValues }: any) {
  form.publish_date_start = selectedValues.join('-');
  showStartDatePicker.value = false;
}

// 结束日期确认
function onEndDateConfirm({ selectedValues }: any) {
  form.publish_date_end = selectedValues.join('-');
  showEndDatePicker.value = false;
}

// 重置表单
function resetForm() {
  form.keyword = '';
  form.title = '';
  form.author = '';
  form.isbn = '';
  form.category_id = '';
  form.format = '';
  form.language = '';
  form.publish_date_start = '';
  form.publish_date_end = '';
  categoryName.value = '';
  formatName.value = '';
  languageName.value = '';
}

// 提交搜索
function onSubmit() {
  const query: Record<string, string> = {};
  if (form.keyword) query.keyword = form.keyword;
  if (form.title) query.title = form.title;
  if (form.author) query.author = form.author;
  if (form.isbn) query.isbn = form.isbn;
  if (form.category_id) query.category_id = form.category_id;
  if (form.format) query.format = form.format;
  if (form.language) query.language = form.language;
  if (form.publish_date_start) query.publish_date_start = form.publish_date_start;
  if (form.publish_date_end) query.publish_date_end = form.publish_date_end;

  router.push({ path: '/search', query });
}

// 加载分类
async function loadCategories() {
  try {
    categories.value = await booksApi.getCategories();
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

onMounted(() => {
  loadCategories();
});
</script>

<style lang="scss" scoped>
.advanced-search-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.submit-btns {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-top: 16px;

  .van-button {
    flex: 1;
  }
}
</style>
