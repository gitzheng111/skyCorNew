<!-- src/components/ControlPanel.vue -->
<template>
    <div class="control-panel">
      <el-space direction="vertical" size="large">
        <el-progress 
          :percentage="progress"
          :status="progressStatus"
          :stroke-width="16"
          striped
          animated
        />
        
        <el-result
          :icon="resultIcon"
          :title="resultTitle"
          :sub-title="resultSubtitle"
        >
          <template #extra>
            <el-button
              type="primary"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              提交申请（{{ submitCount }}）
            </el-button>
          </template>
        </el-result>
      </el-space>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/app'
  
  const appStore = useAppStore()
  const emit = defineEmits(['submit'])
  
  const progress = computed(() => {
    if (appStore.mode === 'auto') {
      const total = appStore.countryTasks.length
      const completed = appStore.countryTasks.filter(t => t.status === 'completed').length
      return Math.round((completed / total) * 100)
    }
    return appStore.customData.selectedCountries.length * 10
  })
  
  const progressStatus = computed(() => 
    appStore.canSubmit ? 'success' : 'exception'
  )
  
  const resultIcon = computed(() => 
    appStore.canSubmit ? 'success' : 'warning'
  )
  
  const submitCount = computed(() => {
    return appStore.mode === 'auto'
      ? appStore.countryTasks.filter(t => t.status === 'completed').length
      : appStore.customData.selectedCountries.length
  })
  
  const handleSubmit = () => {
    emit('submit')
  }
  </script>
  