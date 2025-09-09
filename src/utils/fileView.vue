<template>
  <div class="file-card group" :class="{ 'is-loading': loading }">
    <el-skeleton :loading="loading" animated style="width: 100%">
      <template #template>
        <div class="flex items-center gap-4 p-2">
          <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
          <div class="flex-1">
            <el-skeleton-item variant="text" style="width: 80%" />
            <el-skeleton-item variant="text" style="width: 60%" />
          </div>
        </div>
      </template>
      <template #default>
        <el-row class="file-card-content items-center">
          <el-col :span="4" class="fileIcon">
            <div style="">
              <el-icon size="40" color="white">
                <Document />
              </el-icon>
            </div>
          </el-col>
          <el-col :span="20">
            <div class="fileTitle">
              <el-text tag="b">文件名：{{ decodeURIComponent(props.file?.name) || '未命名文件' }}</el-text>
            </div>
            <!-- <div class="file-name text-base font-medium">
                
              </div> -->
            <div v-if="timeKey != 'null'" class="fileTime">
              {{ timePropMap[timeKey] }}：{{ formatTime(props.file?.[timeKey]) }}
            </div>

          </el-col>
        </el-row>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElSkeleton, ElSkeletonItem } from 'element-plus'
import { formatTime } from '../utils/tool.js'
import { fixEncoding } from '../utils/fileNameEncode.js'

const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 判断使用哪个时间字段
const timePropMap = {
  uploadTime: '上传时间',
  updateTime: '更新时间'
}

const timeKey = computed(() => {
  if (props.file?.uploadTime) return 'uploadTime'
  if (props.file?.updateTime) return 'updateTime'
  return 'null'
})
</script>

<style scoped>
.file-card {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: white;
  transition: box-shadow 0.3s ease;
  cursor: pointer;
}

.file-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.fileIcon {
  width: 60px;
  height: 60px;
  background-color: rgb(0, 136, 181);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fileTitle {
  width: 95%;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding-left: 10px;
  color: rgb(33, 33, 33);
}

.fileTime {
  padding-left: 10px;
  color: gray;
}
</style>