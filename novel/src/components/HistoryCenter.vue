<template>
  <el-dialog
    v-model="dialogVisible"
    title="历史记录中心"
    width="1200px"
    top="5vh"
    destroy-on-close
    class="history-center-dialog"
    modal-class="history-center-dialog-modal"
  >
    <div class="history-center-content">
      <div class="history-tabs">
        <el-tabs v-model="activeTab" class="history-tabs-component">
          <el-tab-pane label="全部" name="all">
            <span class="tab-badge">{{ totalRecords }}</span>
          </el-tab-pane>
          <el-tab-pane label="创意工坊" name="creative">
            <span class="tab-badge">{{ creativeRecords.length }}</span>
          </el-tab-pane>
          <el-tab-pane label="拆书库" name="bookAnalysis">
            <span class="tab-badge">{{ bookAnalysisRecords.length }}</span>
          </el-tab-pane>
          <el-tab-pane label="正文 AI" name="textEditor">
            <span class="tab-badge">{{ textEditorRecords.length }}</span>
          </el-tab-pane>
          <el-tab-pane label="工作流" name="workflow">
            <span class="tab-badge">{{ workflowRecords.length }}</span>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="history-header">
        <div class="header-left">
          <el-icon class="header-icon"><Clock /></el-icon>
          <span class="history-count">
            共 {{ filteredRecords.length }} 条记录
          </span>
        </div>
        <div class="history-actions">
          <el-button 
            type="danger" 
            size="small" 
            @click="handleClearHistory"
            :disabled="filteredRecords.length === 0"
            class="clear-all-btn"
          >
            <el-icon><Delete /></el-icon>
            清空当前分类
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="handleClearAllHistory"
            :disabled="totalRecords === 0"
            class="clear-all-btn"
          >
            <el-icon><Delete /></el-icon>
            清空全部
          </el-button>
        </div>
      </div>

      <div class="history-list">
        <div
          v-for="(record, index) in filteredRecords"
          :key="record.id"
          class="history-item"
          @click="viewHistoryDetail(record)"
        >
          <div class="history-item-card">
            <div class="history-item-header">
              <div class="history-source-badge" :class="record.sourceType">
                <el-icon><component :is="record.sourceIcon" /></el-icon>
                <span>{{ record.sourceName }}</span>
              </div>
              <span class="history-time">{{ formatTimestamp(record.timestamp) }}</span>
            </div>
            
            <div class="history-item-body">
              <div class="history-item-title">
                <el-icon class="item-icon"><component :is="record.itemIcon || 'Document'" /></el-icon>
                <span class="title-text">{{ record.title }}</span>
              </div>
              
              <div class="history-item-meta" v-if="record.metadata">
                <span v-if="record.metadata.generatorName" class="meta-tag">
                  <el-icon><Star /></el-icon>
                  {{ record.metadata.generatorName }}
                </span>
                <span v-if="record.metadata.promptName" class="meta-tag">
                  <el-icon><ChatDotSquare /></el-icon>
                  {{ record.metadata.promptName }}
                </span>
                <span v-if="record.metadata.splitMode" class="meta-tag">
                  <el-icon><Folder /></el-icon>
                  {{ record.metadata.splitMode === 'chapter' ? '分章拆' : '合并拆' }}
                </span>
                <span v-if="record.metadata.selectedChapters" class="meta-tag">
                  <el-icon><Document /></el-icon>
                  {{ record.metadata.selectedChapters.length }} 个章节
                </span>
                <span v-if="record.metadata.promptCount" class="meta-tag">
                  <el-icon><Document /></el-icon>
                  {{ record.metadata.promptCount }} 个提示词
                </span>
                <span v-if="record.metadata.sourceLabel" class="meta-tag">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ record.metadata.sourceLabel }}
                </span>
                <span v-if="record.metadata.status" class="meta-tag">
                  <el-icon><Setting /></el-icon>
                  {{ record.metadata.status === 'completed' ? '已完成' : record.metadata.status === 'cancelled' ? '已取消' : '失败' }}
                </span>
                <span v-if="record.metadata.nodeTitle" class="meta-tag">
                  <el-icon><Connection /></el-icon>
                  {{ record.metadata.nodeTitle }}
                </span>
                <span v-if="record.metadata.modelName" class="meta-tag">
                  <el-icon><Setting /></el-icon>
                  {{ record.metadata.modelName }}
                </span>
                <span v-if="record.metadata.inputTokens || record.metadata.outputTokens" class="meta-tag">
                  <el-icon><Document /></el-icon>
                  输入：{{ record.metadata.inputTokens || 0 }} / 输出：{{ record.metadata.outputTokens || 0 }} tokens
                </span>
                <span v-if="record.metadata.level" class="meta-tag" :class="record.metadata.level">
                  <el-icon><Setting /></el-icon>
                  {{ record.metadata.level === 'success' ? '成功' : record.metadata.level === 'error' ? '失败' : record.metadata.level === 'warning' ? '警告' : '信息' }}
                </span>
              </div>
              
              <div class="history-item-preview">
                {{ record.preview }}
              </div>
            </div>

            <div class="history-item-actions">
              <el-button 
                size="small" 
                type="primary" 
                @click.stop="viewHistoryDetail(record)"
                class="view-detail-btn"
              >
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click.stop="deleteHistoryRecord(index, record)"
                class="delete-btn"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="empty-history">
          <div class="empty-state-icon">
            <el-icon :size="64"><Document /></el-icon>
          </div>
          <p class="empty-title">暂无历史记录</p>
          <p class="empty-hint">
            {{ activeTab === 'all' 
              ? '开始使用后，历史记录会显示在这里' 
              : `当前分类下暂无历史记录，请切换到其他分类或点击"全部"查看所有记录` 
            }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" class="cancel-btn">关闭</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 历史记录详情对话框 -->
  <el-dialog
    v-model="detailDialogVisible"
    :title="selectedRecord?.title || '历史记录详情'"
    width="900px"
    class="history-detail-dialog"
    modal-class="history-detail-dialog-modal"
    destroy-on-close
  >
    <div class="history-detail-content" v-if="selectedRecord">
      <div class="detail-header">
        <div class="detail-source-badge" :class="selectedRecord.sourceType">
          <el-icon :size="24"><component :is="selectedRecord.sourceIcon" /></el-icon>
          <span>{{ selectedRecord.sourceName }}</span>
        </div>
        <span class="detail-time">{{ formatTimestamp(selectedRecord.timestamp) }}</span>
      </div>

      <div class="conversation-messages" v-if="selectedRecord.messages && selectedRecord.messages.length > 0">
        <template v-for="(msg, msgIndex) in selectedRecord.messages" :key="msgIndex">
          <div
            v-if="msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system'"
            :class="['message-bubble', msg.role]"
          >
            <div class="message-sender">
              <el-icon class="sender-icon">
                <User v-if="msg.role === 'user'" />
                <ChatDotRound v-if="msg.role === 'assistant'" />
                <Setting v-if="msg.role === 'system'" />
              </el-icon>
              <span class="sender-name">
                {{ msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI' : '提示词' }}
              </span>
              <span class="message-time">{{ formatTimestamp(msg.timestamp) }}</span>
            </div>
            <div class="message-content">
              <MarkdownRenderer :content="msg.content" />
            </div>
          </div>
        </template>
      </div>

      <div v-else class="detail-body">
        <div class="detail-section">
          <label class="detail-label">预览内容</label>
          <div class="detail-preview">
            <MarkdownRenderer :content="selectedRecord.preview" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="detailDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock,
  Delete,
  View,
  Document,
  Star,
  ChatDotSquare,
  Folder,
  User,
  ChatDotRound,
  Setting,
  Connection
} from '@element-plus/icons-vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

interface HistoryMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface UnifiedHistoryRecord {
  id: number | string
  sourceType: 'creative' | 'bookAnalysis' | 'textEditor' | 'workflow'
  sourceName: string
  sourceIcon: any
  itemIcon?: any
  title: string
  preview: string
  timestamp: number | string
  messages?: HistoryMessage[]
  metadata?: {
    generatorName?: string
    promptName?: string
    splitMode?: 'chapter' | 'merge'
    selectedChapters?: number[]
    promptCount?: number
    bookTitle?: string
    source?: 'chat' | 'continue' | 'creative2'
    sourceLabel?: string
    status?: string
    workflowName?: string
    nodeId?: string
    nodeTitle?: string
    level?: 'info' | 'success' | 'error' | 'warning'
    modelName?: string
    inputTokens?: number
    outputTokens?: number
  }
  originalRecord?: any
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref<'all' | 'creative' | 'bookAnalysis' | 'textEditor' | 'workflow'>('all')
const detailDialogVisible = ref(false)
const selectedRecord = ref<UnifiedHistoryRecord | null>(null)

const creativeRecords = ref<UnifiedHistoryRecord[]>([])
const bookAnalysisRecords = ref<UnifiedHistoryRecord[]>([])
const textEditorRecords = ref<UnifiedHistoryRecord[]>([])
const workflowRecords = ref<UnifiedHistoryRecord[]>([])

const filteredRecords = computed(() => {
  switch (activeTab.value) {
    case 'creative':
      return creativeRecords.value
    case 'bookAnalysis':
      return bookAnalysisRecords.value
    case 'textEditor':
      return textEditorRecords.value
    case 'workflow':
      return workflowRecords.value
    default:
      return [...creativeRecords.value, ...bookAnalysisRecords.value, ...textEditorRecords.value, ...workflowRecords.value]
        .sort((a, b) => {
          const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp
          const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp
          return timeB - timeA
        })
  }
})

const totalRecords = computed(() => {
  return creativeRecords.value.length + bookAnalysisRecords.value.length + textEditorRecords.value.length + workflowRecords.value.length
})

const loadCreativeHistory = () => {
  const stored = localStorage.getItem('creative-history')
  if (stored) {
    try {
      const records = JSON.parse(stored)
      creativeRecords.value = records.map((record: any) => ({
        id: record.id,
        sourceType: 'creative' as const,
        sourceName: '创意工坊',
        sourceIcon: Star,
        itemIcon: record.generatorIcon || 'Lightning',
        title: record.generatorName || '未知生成器',
        preview: record.previewContent?.substring(0, 150) || '无预览内容',
        timestamp: record.timestamp,
        messages: record.messages,
        metadata: {
          generatorName: record.generatorName,
          promptCount: record.selectedPrompts?.length || 0,
          bookTitle: record.bookTitle
        },
        originalRecord: record
      }))
    } catch (e) {
      console.error('Failed to load creative history:', e)
      creativeRecords.value = []
    }
  }
}

const loadBookAnalysisHistory = () => {
  const stored = localStorage.getItem('book-analysis-history')
  if (stored) {
    try {
      const records = JSON.parse(stored)
      bookAnalysisRecords.value = records.map((record: any) => ({
        id: record.id,
        sourceType: 'bookAnalysis' as const,
        sourceName: '拆书库',
        sourceIcon: Folder,
        itemIcon: 'Document',
        title: record.promptName || '未知提示词',
        preview: record.previewContent?.substring(0, 150) || '无预览内容',
        timestamp: record.timestamp,
        messages: record.messages,
        metadata: {
          promptName: record.promptName,
          splitMode: record.splitMode,
          selectedChapters: record.selectedChapters,
          bookTitle: record.bookTitle
        },
        originalRecord: record
      }))
    } catch (e) {
      console.error('Failed to load book analysis history:', e)
      bookAnalysisRecords.value = []
    }
  }
}

const loadTextEditorHistory = () => {
  const stored = localStorage.getItem('write-ai-api-history')
  if (stored) {
    try {
      const records = JSON.parse(stored)
      textEditorRecords.value = records.map((record: any) => ({
        id: record.id,
        sourceType: 'textEditor' as const,
        sourceName: '正文 AI',
        sourceIcon: ChatDotSquare,
        itemIcon: 'Document',
        title: record.promptName || 'AI 写作',
        preview: record.previewContent?.substring(0, 150) || '无预览内容',
        timestamp: record.timestamp,
        messages: record.messages,
        metadata: {
          promptName: record.promptName,
          promptCount: record.promptCount,
          source: record.source,
          sourceLabel: record.sourceLabel,
          status: record.status,
          bookTitle: record.bookTitle
        },
        originalRecord: record
      }))
    } catch (e) {
      console.error('Failed to load text editor history:', e)
      textEditorRecords.value = []
    }
  }
}

const loadWorkflowHistory = () => {
  const stored = localStorage.getItem('workflow-logs')
  if (stored) {
    try {
      const records = JSON.parse(stored)
      workflowRecords.value = records.map((record: any) => ({
        id: record.id,
        sourceType: 'workflow' as const,
        sourceName: '工作流',
        sourceIcon: User,
        itemIcon: 'Connection',
        title: record.nodeTitle || '工作流节点',
        preview: record.outputContent?.substring(0, 150) || record.message || '无预览内容',
        timestamp: record.timestamp,
        messages: record.messages,
        metadata: {
          workflowName: record.workflowName,
          nodeId: record.nodeId,
          nodeTitle: record.nodeTitle,
          level: record.level,
          modelName: record.modelName,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          bookTitle: record.bookTitle
        },
        originalRecord: record
      }))
    } catch (e) {
      console.error('Failed to load workflow history:', e)
      workflowRecords.value = []
    }
  }
}

const loadAllHistory = () => {
  loadCreativeHistory()
  loadBookAnalysisHistory()
  loadTextEditorHistory()
  loadWorkflowHistory()
}

watch(dialogVisible, (newValue) => {
  if (newValue) {
    loadAllHistory()
  }
})

const formatTimestamp = (timestamp: number | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const viewHistoryDetail = (record: UnifiedHistoryRecord) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

const deleteHistoryRecord = (index: number, record: UnifiedHistoryRecord) => {
  ElMessageBox.confirm(
    `确定要删除这条历史记录吗？`,
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (record.sourceType === 'creative') {
      const stored = localStorage.getItem('creative-history')
      if (stored) {
        const allRecords = JSON.parse(stored)
        const filteredRecords = allRecords.filter((r: any) => r.id !== record.id)
        localStorage.setItem('creative-history', JSON.stringify(filteredRecords))
        loadCreativeHistory()
      }
    } else if (record.sourceType === 'bookAnalysis') {
      const stored = localStorage.getItem('book-analysis-history')
      if (stored) {
        const allRecords = JSON.parse(stored)
        const filteredRecords = allRecords.filter((r: any) => r.id !== record.id)
        localStorage.setItem('book-analysis-history', JSON.stringify(filteredRecords))
        loadBookAnalysisHistory()
      }
    } else if (record.sourceType === 'textEditor') {
      const stored = localStorage.getItem('write-ai-api-history')
      if (stored) {
        const allRecords = JSON.parse(stored)
        const filteredRecords = allRecords.filter((r: any) => r.id !== record.id)
        localStorage.setItem('write-ai-api-history', JSON.stringify(filteredRecords))
        loadTextEditorHistory()
      }
    } else if (record.sourceType === 'workflow') {
      const stored = localStorage.getItem('workflow-logs')
      if (stored) {
        const allRecords = JSON.parse(stored)
        const filteredRecords = allRecords.filter((r: any) => r.id !== record.id)
        localStorage.setItem('workflow-logs', JSON.stringify(filteredRecords))
        loadWorkflowHistory()
      }
    }
    ElMessage.success('历史记录已删除')
  }).catch(() => {})
}

const handleClearHistory = () => {
  ElMessageBox.confirm(
    `确定要清空当前分类的所有历史记录吗？`,
    '清空确认',
    {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    if (activeTab.value === 'creative') {
      localStorage.removeItem('creative-history')
      creativeRecords.value = []
    } else if (activeTab.value === 'bookAnalysis') {
      localStorage.removeItem('book-analysis-history')
      bookAnalysisRecords.value = []
    } else if (activeTab.value === 'textEditor') {
      localStorage.removeItem('write-ai-api-history')
      textEditorRecords.value = []
    } else if (activeTab.value === 'workflow') {
      localStorage.removeItem('workflow-logs')
      workflowRecords.value = []
    }
    ElMessage.success('历史记录已清空')
  }).catch(() => {})
}

const handleClearAllHistory = () => {
  ElMessageBox.confirm(
    `确定要清空所有历史记录吗？此操作不可恢复！`,
    '清空全部确认',
    {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    localStorage.removeItem('creative-history')
    localStorage.removeItem('book-analysis-history')
    localStorage.removeItem('write-ai-api-history')
    localStorage.removeItem('workflow-logs')
    creativeRecords.value = []
    bookAnalysisRecords.value = []
    textEditorRecords.value = []
    workflowRecords.value = []
    ElMessage.success('所有历史记录已清空')
  }).catch(() => {})
}
</script>

<style scoped>
.history-center-dialog :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  margin: 0 auto !important;
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
}

.history-center-dialog :deep(.el-overlay-dialog) {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  margin-top: 5vh;
}

.history-center-dialog :deep(.el-dialog__header) {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
}

.history-center-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.history-center-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #ffffff;
}

.history-center-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 0 0 12px 12px;
}

.history-center-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.history-tabs {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
}

.history-tabs-component {
  margin-bottom: 0;
}

.history-tabs-component :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.tab-badge {
  margin-left: 8px;
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 12px;
  font-size: 12px;
  color: #6b7280;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: #667eea;
  font-size: 24px;
}

.history-count {
  color: #1f2937;
  font-size: 16px;
  font-weight: 500;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.clear-all-btn {
  background: rgba(244, 63, 94, 0.1);
  border-color: #f43f5e;
  color: #f43f5e;
  transition: all 0.3s ease;
}

.clear-all-btn:hover:not(:disabled) {
  background: #f43f5e;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.2);
}

.clear-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 55vh;
  overflow-y: auto;
  padding: 0 4px;
}

.history-list::-webkit-scrollbar {
  width: 8px;
}

.history-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.history-item {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.history-item-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.history-item-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.history-source-badge.creative {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.history-source-badge.bookAnalysis {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #ffffff;
}

.history-time {
  font-size: 13px;
  color: #909399;
}

.history-item-body {
  margin-bottom: 6px;
}

.history-item-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.item-icon {
  color: #667eea;
  font-size: 16px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.history-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 11px;
  color: #6b7280;
}

.history-item-preview {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 2px solid #409eff;
}

.history-item-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.view-detail-btn {
  background: rgba(64, 158, 255, 0.1);
  border-color: #409eff;
  color: #409eff;
}

.view-detail-btn:hover:not(:disabled) {
  background: #409eff;
  color: #ffffff;
}

.delete-btn {
  background: rgba(244, 63, 94, 0.1);
  border-color: #f43f5e;
  color: #f43f5e;
}

.delete-btn:hover:not(:disabled) {
  background: #f43f5e;
  color: #ffffff;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #909399;
}

.empty-state-icon {
  opacity: 0.3;
}

.empty-title {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
}

.empty-hint {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.history-detail-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.history-detail-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.history-detail-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.history-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.history-detail-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.history-detail-content {
  background: #ffffff;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.detail-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.detail-source-badge.creative {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.detail-source-badge.bookAnalysis {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #ffffff;
}

.detail-time {
  font-size: 14px;
  color: #6b7280;
}

.detail-body {
  padding: 24px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.detail-preview {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.conversation-messages {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f0f2f5;
  min-height: 400px;
  max-height: 65vh;
  overflow-y: auto;
}

.message-bubble {
  border-radius: 16px;
  padding: 16px 20px;
  max-width: 85%;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble.user {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  margin-left: auto;
}

.message-bubble.assistant {
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.message-bubble.system {
  background: #f3e5f5;
  border: 1px solid #e1bee7;
  width: 100%;
  max-width: 100%;
}

.message-sender {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
}

.sender-icon {
  color: #667eea;
}

.sender-name {
  font-weight: 600;
  color: #1f2937;
}

.message-time {
  color: #9ca3af;
  font-size: 12px;
}

.message-content {
  color: #374151;
  line-height: 1.7;
}

.message-content :deep(p) {
  margin: 8px 0;
}

.message-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-content :deep(code) {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.message-content :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 12px;
  margin: 12px 0;
  color: #6b7280;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 4px;
}
</style>
