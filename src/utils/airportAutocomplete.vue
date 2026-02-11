<!-- utils/AirportAutocomplete.vue -->
<template>
  <el-autocomplete v-model="modelValue" :fetch-suggestions="airportSearch" :trigger-on-focus="false" clearable
    class="inline-input w-50" placeholder="请输入机场名/IATA码/ICAO码" @select="handleSelect" :value-key="'ICAOCode'">
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
// const upperValue = computed({
//   get() {
//     return modelValue.value
//   },
//   set(val) {
//     modelValue.value = val?.toUpperCase() || ''
//   }
// })
const emit = defineEmits(['update:modelValue', 'select'])
const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val ? val.toUpperCase() : '')
    
  }
})
const handleSelect = (item) => {
  emit('update:modelValue', item.ICAOCode) // 示例：用 ICAOCode 作为绑定值
  emit('select', item)
}
const createFilter = (queryString) => {
  const query = queryString.toUpperCase()
  return (airport) =>
    airport.IATACode?.toUpperCase().includes(query) ||
    airport.ICAOCode?.toUpperCase().includes(query) ||
    airport.chineseName?.includes(queryString) ||
    airport.englishName?.toUpperCase().includes(query)
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