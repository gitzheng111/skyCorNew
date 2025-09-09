
<template>
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑批复' : '新增批复'" 
      width="80%"
      @close="resetForm">
      
      <div class="dialog-container">
        <!-- 文件上传区域 -->
        <el-card class="upload-section">
          <el-upload
            v-if="!isEdit || permitFile"
            class="upload-card"
            :on-change="handleFileChange"
            :auto-upload="false"
            :show-file-list="false"
            accept=".pdf,.doc,.docx,.xlsx,.xls">
            
            <template #trigger>
              <div v-if="permitFile" class="file-display">
                <el-icon class="document-icon"><Document /></el-icon>
                <span class="file-name">{{ permitFile.name }}</span>
                <el-button type="success" size="large">
                  <el-icon><Upload /></el-icon>
                  重新上传
                </el-button>
              </div>
              <el-button v-else type="success" size="large">
                <el-icon><Upload /></el-icon>
                上传批复文件
              </el-button>
            </template>
            <div class="upload-tip">支持格式：pdf, doc, docx, xlsx, xls</div>
          </el-upload>
  
          <div v-if="permitFile" class="file-actions">
            <el-button @click="handlePreview" type="info">
              <el-icon><View /></el-icon>
              预览文件
            </el-button>
          </div>
        </el-card>
  
        <!-- 表单输入区域 -->
        <el-form :model="formData" :rules="rules" ref="formRef">
          <el-form-item label="批复编号" prop="permitNumber">
            <el-input v-model="formData.permitNumber" />
          </el-form-item>
          
          <el-form-item label="关联航班" prop="flights">
            <el-select
              v-model="formData.flights"
              multiple
              filterable
              placeholder="请选择关联航班">
              <el-option
                v-for="flight in availableFlights"
                :key="flight.id"
                :label="`${flight.number} (${flight.departure}-${flight.arrival})`"
                :value="flight.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
  
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </template>
  
  <script setup>
  import { ref, reactive } from 'vue'
  
  const props = defineProps({
    isEdit: Boolean,
    currentData: Object
  })
  
  const emit = defineEmits(['submit'])
  
  // 弹窗状态
  const dialogVisible = ref(false)
  const formRef = ref(null)
  const permitFile = ref(null)
  
  // 表单数据
  const formData = reactive({
    permitNumber: '',
    flights: []
  })
  
  // 验证规则
  const rules = {
    permitNumber: [{ required: true, message: '请输入批复编号', trigger: 'blur' }],
    flights: [{ required: true, message: '请至少选择一个航班', trigger: 'change' }]
  }
  
  // 打开弹窗方法
  const openDialog = (data) => {
    if (data) {
      Object.assign(formData, {
        permitNumber: data.permitNumber,
        flights: data.flights.map(f => f.id)
      })
      permitFile.value = data.permitFile
    }
    dialogVisible.value = true
  }
  
  // 文件处理
  const handleFileChange = (file) => {
    permitFile.value = file
  }
  
  // 提交处理
  const handleSubmit = async () => {
    try {
      await formRef.value.validate()
      emit('submit', {
        ...formData,
        permitFile: permitFile.value
      })
      dialogVisible.value = false
    } catch (e) {
      console.error('表单验证失败', e)
    }
  }
  
  // 重置表单
  const resetForm = () => {
    formRef.value?.resetFields()
    permitFile.value = null
  }
  
  defineExpose({ openDialog })
  </script>
  
  <style scoped>
  /* 样式代码省略 */
  </style>
  