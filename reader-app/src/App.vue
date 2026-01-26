<template>
  <div class="app-wrapper">
    <router-view v-slot="{ Component }">
      <keep-alive :include="['Home', 'Category', 'Search']">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// App 根组件
</script>

<style lang="scss">
// ============================================
// Design System Variables
// ============================================

// iOS Design System Colors
:root {
  // iOS System Colors
  --ios-blue: #007AFF;
  --ios-green: #34C759;
  --ios-red: #FF3B30;
  --ios-orange: #FF9500;
  --ios-gray: #8E8E93;
  --ios-gray-2: #AEAEB2;
  --ios-gray-3: #C7C7CC;
  --ios-gray-4: #D1D1D6;
  --ios-gray-5: #E5E5EA;
  --ios-gray-6: #F2F2F7;
  --ios-background: #F2F2F7;
  --ios-card-bg: #FFFFFF;
  --ios-separator: rgba(60, 60, 67, 0.12);

  // iOS Typography
  --ios-title-size: 17px;
  --ios-body-size: 17px;
  --ios-caption-size: 12px;
  --ios-large-title: 34px;

  // iOS Spacing
  --ios-spacing-xs: 4px;
  --ios-spacing-sm: 8px;
  --ios-spacing-md: 16px;
  --ios-spacing-lg: 20px;
  --ios-spacing-xl: 32px;

  // iOS Corner Radius
  --ios-radius-sm: 8px;
  --ios-radius-md: 12px;
  --ios-radius-lg: 16px;
  --ios-radius-xl: 20px;

  // Material Design Colors (PC)
  --md-primary: #1976D2;
  --md-primary-dark: #1565C0;
  --md-primary-light: #42A5F5;
  --md-secondary: #9C27B0;
  --md-surface: #FFFFFF;
  --md-background: #FAFAFA;
  --md-error: #B00020;
  --md-on-primary: #FFFFFF;
  --md-on-surface: rgba(0, 0, 0, 0.87);
  --md-on-surface-medium: rgba(0, 0, 0, 0.60);
  --md-on-surface-disabled: rgba(0, 0, 0, 0.38);

  // Material Design Elevation
  --md-elevation-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  --md-elevation-2: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12);
  --md-elevation-3: 0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10);
  --md-elevation-4: 0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05);
  --md-elevation-hover: 0 8px 16px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.10);

  // Material Design Spacing (8dp grid)
  --md-spacing-xs: 4px;
  --md-spacing-sm: 8px;
  --md-spacing-md: 16px;
  --md-spacing-lg: 24px;
  --md-spacing-xl: 32px;
  --md-spacing-xxl: 48px;

  // Material Design Corner Radius
  --md-radius-sm: 4px;
  --md-radius-md: 8px;
  --md-radius-lg: 12px;
  --md-radius-xl: 16px;

  // Material Design Typography Scale
  --md-headline-1: 96px;
  --md-headline-2: 60px;
  --md-headline-3: 48px;
  --md-headline-4: 34px;
  --md-headline-5: 24px;
  --md-headline-6: 20px;
  --md-subtitle-1: 16px;
  --md-subtitle-2: 14px;
  --md-body-1: 16px;
  --md-body-2: 14px;
  --md-caption: 12px;
}

// ============================================
// Base Styles
// ============================================

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--ios-background);

  @media (min-width: 768px) {
    background-color: var(--md-background);
  }
}

#app {
  // iOS: San Francisco system font
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: var(--ios-body-size);
  color: #1C1C1E;
  line-height: 1.47;
  letter-spacing: -0.022em;

  // PC: Roboto for Material Design
  @media (min-width: 768px) {
    font-family: 'Roboto', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: var(--md-body-1);
    color: var(--md-on-surface);
    line-height: 1.5;
    letter-spacing: 0.00938em;
  }
}

.app-wrapper {
  min-height: 100vh;
  background-color: var(--ios-background);

  @media (min-width: 768px) {
    background-color: var(--md-background);
  }
}

// ============================================
// iOS Specific Styles (Mobile)
// ============================================

@media (max-width: 767px) {
  // iOS-style touch feedback
  .ios-touch-active {
    transition: opacity 0.1s ease, transform 0.1s ease;

    &:active {
      opacity: 0.7;
      transform: scale(0.98);
    }
  }

  // iOS minimum touch target (44x44 points)
  .ios-touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  // iOS Card Style
  .ios-card {
    background: var(--ios-card-bg);
    border-radius: var(--ios-radius-md);
    margin: var(--ios-spacing-md);
    overflow: hidden;

    // iOS doesn't use shadows much, uses subtle borders
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 0.5px solid var(--ios-separator);
      pointer-events: none;
    }
  }

  // iOS List Style
  .ios-list {
    background: var(--ios-card-bg);
    border-radius: var(--ios-radius-md);
    margin: var(--ios-spacing-md);
    overflow: hidden;
  }

  .ios-list-item {
    display: flex;
    align-items: center;
    padding: var(--ios-spacing-md);
    min-height: 44px;
    background: var(--ios-card-bg);
    position: relative;

    &:not(:last-child)::after {
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
  }

  // iOS Section Header
  .ios-section-header {
    font-size: 13px;
    font-weight: 400;
    color: var(--ios-gray);
    text-transform: uppercase;
    letter-spacing: -0.08px;
    padding: var(--ios-spacing-sm) var(--ios-spacing-md);
    padding-top: var(--ios-spacing-lg);
  }

  // iOS Navigation Bar style
  .ios-nav-blur {
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    background: rgba(249, 249, 249, 0.94);
  }

  // iOS spring animation
  .ios-spring {
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

// ============================================
// Material Design Styles (PC)
// ============================================

@media (min-width: 768px) {
  // Material Design Card
  .md-card {
    background: var(--md-surface);
    border-radius: var(--md-radius-md);
    box-shadow: var(--md-elevation-1);
    transition: box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: var(--md-elevation-hover);
    }
  }

  // Material Design Elevation classes
  .md-elevation-1 { box-shadow: var(--md-elevation-1); }
  .md-elevation-2 { box-shadow: var(--md-elevation-2); }
  .md-elevation-3 { box-shadow: var(--md-elevation-3); }
  .md-elevation-4 { box-shadow: var(--md-elevation-4); }

  // Material Design Ripple Effect Base
  .md-ripple {
    position: relative;
    overflow: hidden;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
      opacity: 0;
    }

    &:active::after {
      width: 200%;
      height: 200%;
      opacity: 1;
    }
  }

  // Material Design Button
  .md-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    height: 36px;
    padding: 0 16px;
    border: none;
    border-radius: var(--md-radius-sm);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.0892857em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &--contained {
      background: var(--md-primary);
      color: var(--md-on-primary);
      box-shadow: var(--md-elevation-2);

      &:hover {
        box-shadow: var(--md-elevation-3);
        background: var(--md-primary-dark);
      }
    }

    &--outlined {
      background: transparent;
      color: var(--md-primary);
      border: 1px solid var(--md-primary);

      &:hover {
        background: rgba(25, 118, 210, 0.08);
      }
    }

    &--text {
      background: transparent;
      color: var(--md-primary);

      &:hover {
        background: rgba(25, 118, 210, 0.08);
      }
    }
  }

  // Material Design Typography
  .md-headline-5 {
    font-size: var(--md-headline-5);
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.334;
  }

  .md-headline-6 {
    font-size: var(--md-headline-6);
    font-weight: 500;
    letter-spacing: 0.0125em;
    line-height: 1.6;
  }

  .md-subtitle-1 {
    font-size: var(--md-subtitle-1);
    font-weight: 400;
    letter-spacing: 0.00938em;
    line-height: 1.75;
  }

  .md-subtitle-2 {
    font-size: var(--md-subtitle-2);
    font-weight: 500;
    letter-spacing: 0.00714em;
    line-height: 1.57;
  }

  .md-body-1 {
    font-size: var(--md-body-1);
    font-weight: 400;
    letter-spacing: 0.03125em;
    line-height: 1.5;
  }

  .md-body-2 {
    font-size: var(--md-body-2);
    font-weight: 400;
    letter-spacing: 0.01786em;
    line-height: 1.43;
  }

  .md-caption {
    font-size: var(--md-caption);
    font-weight: 400;
    letter-spacing: 0.03333em;
    line-height: 1.66;
  }

  // Material Design transition
  .md-transition {
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

// ============================================
// Utility Classes
// ============================================

// Text overflow utilities
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ellipsis-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.ellipsis-3 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

// ============================================
// Responsive Visibility
// ============================================

// PC端隐藏移动端元素
@media (min-width: 768px) {
  .mobile-only {
    display: none !important;
  }
}

// 移动端隐藏PC端元素
@media (max-width: 767px) {
  .pc-only {
    display: none !important;
  }
}

// ============================================
// Vant Component Overrides
// ============================================

// iOS style overrides for mobile
@media (max-width: 767px) {
  // Vant NavBar iOS style
  .van-nav-bar {
    background: rgba(249, 249, 249, 0.94) !important;
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);

    &::after {
      background-color: var(--ios-separator) !important;
    }

    .van-nav-bar__title {
      font-size: 17px !important;
      font-weight: 600 !important;
    }
  }

  // Vant Tabbar iOS style
  .van-tabbar {
    background: rgba(249, 249, 249, 0.94) !important;
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);

    &::before {
      background-color: var(--ios-separator) !important;
    }

    .van-tabbar-item {
      font-size: 10px;

      &--active {
        color: var(--ios-blue) !important;
      }
    }
  }

  // Vant Button iOS style
  .van-button--primary {
    background: var(--ios-blue) !important;
    border-color: var(--ios-blue) !important;
    border-radius: var(--ios-radius-sm) !important;
  }

  // Vant Cell iOS style
  .van-cell {
    padding: 12px 16px !important;

    &::after {
      left: 16px !important;
    }
  }

  // Vant Search iOS style
  .van-search {
    background: transparent !important;

    .van-search__content {
      background: rgba(118, 118, 128, 0.12) !important;
      border-radius: 10px !important;
    }
  }
}

// Material Design overrides for PC
@media (min-width: 768px) {
  // Vant Button Material style
  .van-button {
    border-radius: var(--md-radius-sm) !important;
    font-weight: 500 !important;
    letter-spacing: 0.02857em !important;
    transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1) !important;

    &--primary {
      background: var(--md-primary) !important;
      border-color: var(--md-primary) !important;
      box-shadow: var(--md-elevation-2) !important;

      &:hover {
        background: var(--md-primary-dark) !important;
        box-shadow: var(--md-elevation-3) !important;
      }
    }
  }

  // Vant Dialog Material style
  .van-dialog {
    border-radius: var(--md-radius-lg) !important;
    box-shadow: var(--md-elevation-4) !important;
  }

  // Vant Popup Material style
  .van-popup {
    border-radius: var(--md-radius-lg) var(--md-radius-lg) 0 0 !important;

    &--center {
      border-radius: var(--md-radius-lg) !important;
    }
  }
}
</style>
