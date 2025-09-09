<!-- src/components/AutoApplicationEditor.vue -->
<template>
    <div class="auto-editor">
      <el-alert 
        v-if="task.errors.length"
        type="error"
        :title="`有 ${task.errors.length} 个字段验证失败`"
        show-icon
        class="alert"
      />
      
      <el-form label-position="top">
        <template v-for="req in task.requirements" :key="req.field">
          <el-form-item 
            :label="req.label"
            :prop="req.field"
            :rules="req.rules"
            :class="{ 'urgent-field': req.urgent }"
          >
            <component
              :is="getComponent(req.type)"
              v-model="formData[req.field]"
              :placeholder="req.placeholder"
              :options="req.options"
              @change="val => handleChange(req.field, val)"
            />
          </el-form-item>
        </template>
      </el-form>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    task: {
      type: Object,
      required: true
    }
  })
  
  const formData = ref({})
  
  const getComponent = (type) => {
    const components = {
      input: 'el-input',
      select: 'el-select',
      date: 'el-date-picker',
      file: 'el-upload'
    }
    return components[type] || 'el-input'
  }
  
  const handleChange = (field, value) => {
    emit('field-change', {
      country: props.task.country,
      field,
      value
    })
  }
  </script>
  
  <style lang="scss">
  .urgent-field {
    .el-form-item__label:after {
      content: "*";
      color: #f56c6c;
      margin-left: 4px;
    }
  }
  
  .alert {
    margin-bottom: 20px;
  }
  </style>
  