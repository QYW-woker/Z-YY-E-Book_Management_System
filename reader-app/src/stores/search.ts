import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSearchStore = defineStore(
  'search',
  () => {
    // 搜索历史（最多保存10条）
    const searchHistory = ref<string[]>([]);

    // 添加搜索历史
    function addHistory(keyword: string) {
      if (!keyword.trim()) return;
      // 去重
      const index = searchHistory.value.indexOf(keyword);
      if (index > -1) {
        searchHistory.value.splice(index, 1);
      }
      // 添加到开头
      searchHistory.value.unshift(keyword);
      // 最多保存10条
      if (searchHistory.value.length > 10) {
        searchHistory.value.pop();
      }
    }

    // 删除单条历史
    function removeHistory(keyword: string) {
      const index = searchHistory.value.indexOf(keyword);
      if (index > -1) {
        searchHistory.value.splice(index, 1);
      }
    }

    // 清空历史
    function clearHistory() {
      searchHistory.value = [];
    }

    return {
      searchHistory,
      addHistory,
      removeHistory,
      clearHistory,
    };
  },
  {
    persist: {
      key: 'reader-search',
      paths: ['searchHistory'],
    },
  }
);
