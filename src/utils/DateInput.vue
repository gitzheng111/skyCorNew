<template>
    <el-date-picker
      v-if="mode === 'picker'"
      v-model="innerValue"
      type="date"
      format="YYYY/MM/DD"
      value-format="YYYY/MM/DD"
      placeholder="日期"
    />
  
    <div v-else class="date-input-group">
      <el-input
        ref="yearRef"
        v-model="year"
        placeholder="YYYY"
        maxlength="4"
        style="width: 220px"
        @input="onYearInput"
      />
      <span class="sep">/</span>
      <el-input
        ref="monthRef"
        v-model="month"
        placeholder="MM"
        maxlength="2"
        style="width: 150px"
        @input="onMonthInput"
        @blur="formatMonth"
      />
      <span class="sep">/</span>
      <el-input
        v-model="day"
        placeholder="DD"
        maxlength="2"
        style="width: 150px"
        @input="onDayInput"
        @blur="formatDay"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, watch, nextTick } from 'vue'
  
  const props = defineProps({
    modelValue: String,
    mode: { type: String, default: 'split' }
  })
  const emit = defineEmits(['update:modelValue'])
  
  const innerValue = ref(props.modelValue)
  
  const year = ref('')
  const month = ref('')
  const day = ref('')
  const yearRef = ref()
  const monthRef = ref()
  
  watch(
    () => props.modelValue,
    (val) => {
      innerValue.value = val
      if (val && props.mode === 'split') {
        const [y, m, d] = val.split('/')
        year.value = y
        month.value = m
        day.value = d
      }
    },
    { immediate: true }
  )
  
  const merge = () => {
    if (year.value.length === 4 && month.value.length === 2 && day.value.length === 2) {
      emit('update:modelValue', `${year.value}/${month.value}/${day.value}`)
    } else {
      emit('update:modelValue', '')
    }
  }
  
  const onYearInput = () => {
    year.value = year.value.replace(/\D/g, '').slice(0, 4)
    if (year.value.length === 4) {
      nextTick(() => monthRef.value?.focus())
    }
    merge()
  }
  
  const onMonthInput = () => {
    month.value = month.value.replace(/\D/g, '').slice(0, 2)
    if (month.value.length === 2) nextTick(() => monthRef.value?.blur())
    merge()
  }
  
  const onDayInput = () => {
    day.value = day.value.replace(/\D/g, '').slice(0, 2)
    merge()
  }
  
  const formatMonth = () => {
    if (month.value !== '') {
      month.value = String(Math.min(+month.value, 12)).padStart(2, '0')
    }
  }
  
  const formatDay = () => {
    if (day.value !== '') {
      day.value = String(Math.min(+day.value, 31)).padStart(2, '0')
    }
  }
  
  watch(innerValue, val => emit('update:modelValue', val))
  </script>
  
  <style scoped>
  .date-input-group {
    display: flex;
    align-items: center;
  }
  .sep {
    margin: 0 4px;
  }
  </style>
  