<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark">星</div>
        <div class="brand-copy">
          <h1>星芒 AI 写作</h1>
          <p></p>
        </div>
      </div>

      <nav class="topbar-actions" aria-label="全局导航">
        <a
          href="https://www.123912.com/s/cc0dTd-GDNGh"
          target="_blank"
          class="topbar-action"
          rel="noopener noreferrer"
        >
          <el-icon><Download /></el-icon>
          <span>最新下载</span>
        </a>
        <button
          v-for="item in globalNavItems"
          :key="item.label"
          class="topbar-action"
          type="button"
          @click="handleGlobalNavClick(item.label)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
        <div class="user-badge">我</div>
      </nav>
    </header>

    <!-- 外观主题选择弹窗 -->
    <el-dialog
      v-model="themeDialogVisible"
      title="选择主题"
      width="400px"
      :close-on-click-modal="true"
      class="theme-select-dialog"
    >
      <div class="theme-options">
        <div
          class="theme-option"
          :class="{ active: currentThemeType === 'light' }"
          @click="selectTheme('light')"
        >
          <div class="theme-preview theme-preview-light">
            <div class="preview-sidebar"></div>
            <div class="preview-content"></div>
          </div>
          <div class="theme-label">
            <span class="theme-name">白色主界面</span>
            <el-icon v-if="currentThemeType === 'light'" class="check-icon"><Check /></el-icon>
          </div>
        </div>
        <div
          class="theme-option"
          :class="{ active: currentThemeType === 'dark' }"
          @click="selectTheme('dark')"
        >
          <div class="theme-preview theme-preview-dark">
            <div class="preview-sidebar"></div>
            <div class="preview-content"></div>
          </div>
          <div class="theme-label">
            <span class="theme-name">暗色主界面</span>
            <el-icon v-if="currentThemeType === 'dark'" class="check-icon"><Check /></el-icon>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="themeDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 历史记录中心 -->
    <HistoryCenter v-model="historyDialogVisible" />

    <div class="workspace-shell">
      <aside class="sidebar" :class="currentTheme">
        <div class="sidebar-panel">
          <el-menu
            :default-active="activeMenu"
            router
            class="sidebar-menu"
            :background-color="'transparent'"
            :text-color="menuTextColor"
            :active-text-color="menuActiveColor"
          >
            <el-menu-item
              v-for="item in menuItems"
              :key="item.index"
              :index="item.index"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.label }}</span>
            </el-menu-item>
          </el-menu>
        </div>
      </aside>

      <main class="content-shell">
        <section class="content-frame">
          <router-view />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Reading,
  ChatDotSquare,
  View,
  Star,
  Connection,
  Collection,
  Setting,
  User,
  Brush,
  ChatLineRound,
  School,
  Clock,
  Wallet,
  Message,
  Check,
  Download
} from '@element-plus/icons-vue'
import HistoryCenter from '../components/HistoryCenter.vue'

const route = useRoute()

type ThemeType = 'light' | 'dark'

const themeDialogVisible = ref(false)
const currentThemeType = ref<ThemeType>('light')
const historyDialogVisible = ref(false)

const menuItems = [
  { index: '/books', label: '我的小说', icon: Reading },
  { index: '/prompts', label: '提示词库', icon: ChatDotSquare },
  { index: '/prompt-preview', label: '提示预览', icon: View },
  { index: '/creative', label: '创意工坊', icon: Star },
  { index: '/workflow', label: '工作流', icon: Connection },
  { index: '/experience-shares', label: '经验分享', icon: Collection },
  { index: '/config', label: 'API 配置', icon: Setting },
  { index: '/profile', label: '个人中心', icon: User }
]

const globalNavItems = [
  { label: '外观', icon: Brush },
  { label: '对话', icon: ChatLineRound },
  { label: '教程', icon: School },
  { label: '历史', icon: Clock },
  { label: '消息', icon: Message }
]

const routeLabelMap: Record<string, string> = {
  '/books': '我的小说',
  '/prompts': '提示词库',
  '/prompt-preview': '提示预览',
  '/creative': '创意工坊',
  '/workflow': '工作流',
  '/experience-shares': '经验分享',
  '/config': 'API 配置',
  '/profile': '个人中心'
}

const activeMenu = computed(() => {
  const matched = menuItems.find(item => route.path === item.index || route.path.startsWith(`${item.index}/`))
  return matched?.index || '/books'
})

const currentPageLabel = computed(() => routeLabelMap[activeMenu.value] || '创作空间')

const getInitialTheme = (): ThemeType => {
  const saved = localStorage.getItem('main-theme')
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  return 'light'
}

const currentTheme = ref<ThemeType>(getInitialTheme())

const themeColors = {
  light: {
    appBackground: '#f5f7fa',
    appColor: '#2c3e50',
    topbarBackground: '#ffffff',
    topbarBorder: '#e0e6ed',
    sidebarBackground: '#ffffff',
    sidebarBorder: '#e0e6ed',
    contentBackground: '#ffffff',
    contentBorder: '#e0e6ed',
    menuText: '#5a6c7d',
    menuActive: '#ffffff',
    menuHover: 'rgba(45, 212, 191, 0.08)',
    menuHoverColor: '#2dd4bf'
  },
  dark: {
    appBackground: '#0d1424',
    appColor: '#f4f7ff',
    topbarBackground: 'rgba(10, 17, 31, 0.92)',
    topbarBorder: 'rgba(255, 255, 255, 0.08)',
    sidebarBackground: 'rgba(9, 14, 26, 0.94)',
    sidebarBorder: 'rgba(255, 255, 255, 0.08)',
    contentBackground: 'rgba(17, 26, 46, 0.96)',
    contentBorder: 'rgba(255, 255, 255, 0.08)',
    menuText: '#8d99af',
    menuActive: '#ffffff',
    menuHover: 'rgba(255, 255, 255, 0.06)',
    menuHoverColor: '#eff4ff'
  }
}

const currentThemeColors = computed(() => themeColors[currentThemeType.value])

const menuTextColor = computed(() => themeColors[currentTheme.value].menuText)
const menuActiveColor = computed(() => themeColors[currentTheme.value].menuActive)

const todayLabel = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const handleGlobalNavClick = (label: string) => {
  if (label === '外观') {
    themeDialogVisible.value = true
  } else if (label === '历史') {
    historyDialogVisible.value = true
  } else {
    ElMessage.info(`"${label}"功能开发中`)
  }
}

const selectTheme = (theme: ThemeType) => {
  currentThemeType.value = theme
  localStorage.setItem('main-theme', theme)
  applyTheme(theme)
}

const applyTheme = (theme: ThemeType) => {
  const colors = themeColors[theme]
  const root = document.documentElement
  
  // 设置 data-theme 属性用于 CSS 变量覆盖
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
  
  // 设置内联 CSS 变量
  root.style.setProperty('--app-background', colors.appBackground)
  root.style.setProperty('--app-color', colors.appColor)
  root.style.setProperty('--topbar-background', colors.topbarBackground)
  root.style.setProperty('--topbar-border', colors.topbarBorder)
  root.style.setProperty('--sidebar-background', colors.sidebarBackground)
  root.style.setProperty('--sidebar-border', colors.sidebarBorder)
  root.style.setProperty('--content-background', colors.contentBackground)
  root.style.setProperty('--content-border', colors.contentBorder)
  root.style.setProperty('--menu-text', colors.menuText)
  root.style.setProperty('--menu-hover', colors.menuHover)
  root.style.setProperty('--menu-hover-color', colors.menuHoverColor)
}

watch(
  currentThemeType,
  newTheme => {
    applyTheme(newTheme)
  },
  { immediate: true }
)
</script>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-background, #f5f7fa);
  color: var(--app-color, #2c3e50);
}

.topbar {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid var(--topbar-border, #e0e6ed);
  background: var(--topbar-background, #ffffff);
  backdrop-filter: blur(16px);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(45, 212, 191, 0.35);
}

.brand-copy h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
}

.brand-copy p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6c7a89;
}

.topbar-center {
  display: flex;
  justify-content: center;
}

.notice-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  color: #b8ffd7;
  background: rgba(71, 214, 152, 0.1);
  border: 1px solid rgba(71, 214, 152, 0.22);
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #47d698;
  box-shadow: 0 0 12px rgba(71, 214, 152, 0.8);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: #5a6c7d;
  cursor: pointer;
  transition: all 0.25s ease;
}

.topbar-action:hover {
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.08);
  border-color: rgba(45, 212, 191, 0.2);
}

.user-badge {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(45, 212, 191, 0.32);
}

.workspace-shell {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 165px minmax(0, 1fr);
}

.sidebar {
  padding: 0;
  border-right: 1px solid var(--sidebar-border, #e0e6ed);
  background: var(--sidebar-background, #ffffff);
}

.sidebar-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sidebar-hero {
  padding: 18px 16px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.6), transparent 24%),
    linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
  box-shadow: 0 18px 38px rgba(20, 184, 166, 0.25);
}

.sidebar-hero-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-hero-title {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  color: #ffffff;
}

.sidebar-hero-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.content-shell {
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.content-frame {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  border-radius: 0;
  padding: 20px;
  background: var(--content-background, #ffffff);
  border: 1px solid var(--content-border, #e0e6ed);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 48px;
  margin: 6px 8px;
  border-radius: 14px;
  color: var(--menu-text, #5a6c7d);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
}

:deep(.el-menu-item:hover) {
  background: var(--menu-hover, rgba(45, 212, 191, 0.06)) !important;
  color: var(--menu-hover-color, #2dd4bf) !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.15) 0%, rgba(20, 184, 166, 0.12) 100%) !important;
  color: #2dd4bf !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15);
}

.sidebar.classic {
  background: var(--sidebar-background, #ffffff);
}

.sidebar.tech {
  background: var(--sidebar-background, #ffffff);
}

/* 主题选择弹窗样式 */
.theme-select-dialog .el-dialog {
  border-radius: 16px;
}

.theme-select-dialog .el-dialog__header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e6ed;
}

.theme-select-dialog .el-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.theme-select-dialog .el-dialog__body {
  padding: 24px;
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e6ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-option:hover {
  border-color: #2dd4bf;
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.15);
}

.theme-option.active {
  border-color: #2dd4bf;
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.25);
}

.theme-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  border: 1px solid #e0e6ed;
}

.theme-preview-light {
  background: #f5f7fa;
}

.theme-preview-light .preview-sidebar {
  width: 30%;
  background: #ffffff;
  border-right: 1px solid #e0e6ed;
}

.theme-preview-light .preview-content {
  width: 70%;
  background: #ffffff;
}

.theme-preview-dark {
  background: #0d1424;
}

.theme-preview-dark .preview-sidebar {
  width: 30%;
  background: rgba(9, 14, 26, 0.94);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.theme-preview-dark .preview-content {
  width: 70%;
  background: rgba(17, 26, 46, 0.96);
}

.theme-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.check-icon {
  color: #2dd4bf;
  font-size: 20px;
}

.theme-select-dialog .el-dialog__footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e6ed;
}

@media (max-width: 1200px) {
  .topbar-center {
    display: none;
  }

  .topbar-actions span {
    display: none;
  }

  .topbar-action {
    width: 40px;
    padding: 0;
    justify-content: center;
  }
}

@media (max-width: 900px) {
  .workspace-shell {
    grid-template-columns: 150px minmax(0, 1fr);
  }

  .content-shell {
    padding-left: 14px;
  }

  .content-frame {
    padding: 18px;
  }
}

@media (max-width: 768px) {
  .topbar {
    padding: 0 14px 0 16px;
  }

  .workspace-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .content-shell {
    padding: 12px;
  }

  .content-frame {
    border-radius: 18px;
    padding: 16px;
  }
}
</style>
