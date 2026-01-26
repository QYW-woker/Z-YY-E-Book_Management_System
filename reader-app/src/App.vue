<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="['Home', 'Category', 'Search']">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
// App 根组件
</script>

<style lang="scss">
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
