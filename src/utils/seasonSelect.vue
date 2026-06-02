<template>
  <el-select v-model="internalValue" placeholder="请选择航季" style="width: 120px" @change="handleChange" class="seasonSelect">
    <el-option v-for="(item, index) in seasonData" :key="index" :label="item.label" :value="item.en">
      <span style="float: left">{{ item.label }}</span>
      <span v-if="item.label === curSeason.label"
        style="float: right; color: var(--el-text-color-secondary); font-size: 13px;">
        当前航季
      </span>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits ,onMounted} from 'vue'
import { useSeasonData } from '../components/useSeasonUtils.js'
// import { seasonCalculate, currentSeasonData } from '../utils/season.js'
const { seasonData, curSeason } = useSeasonData()

// 组件 props & emits
const props = defineProps({
  modelValue: String
})
const emit = defineEmits(['update:modelValue'])

// 本地值同步
const internalValue = ref(props.modelValue )


watch(() => props.modelValue, (val) => {
  internalValue.value = val 
})
const handleChange = (val) => {
  emit('update:modelValue', val)
}
// onMounted(() => {
//   if (!props.modelValue) {
//     emit('update:modelValue', curSeason.value.en)
//   }
// })

// 获取航季数据

</script>

<style>
.seasonSelect {
  --el-select-dropdown-border-color: #f2f4f6;
  --el-select-dropdown-bg-color: #ffffff;
  --el-select-dropdown-item-hover-bg-color: #f5f7fa;
  --el-select-dropdown-item-active-bg-color: #e6e9ed;
  height: 100%;
}
</style>