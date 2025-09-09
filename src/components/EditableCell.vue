<template>
    <div class="editable-cell" 
         :class="{ 
           'editable-style': cellConfig.isEditable,
           'merged-cell': cellConfig.rowspan > 1 || cellConfig.colspan > 1
         }"
         :rowspan="cellConfig.rowspan"
         :colspan="cellConfig.colspan"
         @click="handleCellClick">
      <template v-if="!cellConfig.isEditing">
        <span class="cell-content">{{ displayValue }}</span>
      </template>
      <el-input
        v-else
        ref="inputRef"
        v-model="editValue"
        size="small"
        @blur="handleBlur"
        @keyup.enter="handleBlur"/>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, nextTick } from 'vue'
  
  const props = defineProps({
    row: Object,
    header: Object,
    index: Number
  })
  
  const emit = defineEmits(['edit-complete'])
  
  const inputRef = ref(null)
  const editValue = ref('')
  const isEditing = ref(false)
  
  const cellConfig = computed(() => {
    return props.row[props.header.key] || {}
  })
  
  const displayValue = computed(() => {
    return cellConfig.value.value || '—'
  })
  
  const handleCellClick = () => {
    if (!cellConfig.value.isEditable) return
    isEditing.value = true
    editValue.value = cellConfig.value.value
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
  
  const handleBlur = () => {
    isEditing.value = false
    emit('edit-complete', {
      rowId: props.row.id,
      key: props.header.key,
      value: editValue.value
    })
  }
  </script>
  
  <style scoped>
  .editable-cell {
    height: 100%;
    padding: 4px 8px;
    cursor: default;
  }
  
  .editable-style {
    background-color: #f0f9ff;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .merged-cell {
    background-color: #f8f8f8;
    text-align: center;
    font-weight: 500;
  }
  
  .cell-content {
    display: block;
    min-height: 24px;
    line-height: 24px;
  }
  </style>
  