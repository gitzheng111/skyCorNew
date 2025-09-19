<!-- utils/AirportAutocomplete.vue -->
<template>
    <el-autocomplete
      v-model="modelValue"
      :fetch-suggestions="airportSearch"
      :trigger-on-focus="false"
      clearable
      class="inline-input w-50"
      placeholder="请输入机场名/IATA码/ICAO码"
      @select="handleSelect"
      :value-key="'ICAOCode'"
    >
      <template #default="{ item }">
        <div>
          {{ item.chineseName }}（{{ item.IATACode }} / {{ item.ICAOCode }}）
        </div>
      </template>
    </el-autocomplete>
  </template>

<script setup>

import { computed } from 'vue'
import { airportCodeList } from '../api'
// const airportSelect = ref()
// const props = defineProps({
//     airportSelect: String
// })
// const emit = defineEmits(['update:airportSelect'])
// console.log('airportCodeData',airportCodeList)
const props = defineProps({
  modelValue: String // 用于 v-model
})
const emit = defineEmits(['update:modelValue', 'select'])
const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
const handleSelect = (item) => {
  emit('update:modelValue', item.ICAOCode) // 示例：用 ICAOCode 作为绑定值
  emit('select', item)
}
const createFilter = (queryString) => {
  const query = queryString.toLowerCase()
  return (airport) =>
    airport.IATACode?.toLowerCase().includes(query) ||
    airport.ICAOCode?.toLowerCase().includes(query) ||
    airport.chineseName?.includes(queryString) ||
    airport.englishName?.toLowerCase().includes(query)
}

const airportSearch = (queryString, cb) => {

    const results = queryString
        ? airportCodeList.value.filter(createFilter(queryString))
        : airportCodeList.value;
    cb(results);
};

// watch(
//   () => props.airportSelect,
//   (val) => {
//     emit('update:airportSelect', val)
//   }
// )
</script>

<style scoped>
.inline-input {
    width: 240px;
}
</style>