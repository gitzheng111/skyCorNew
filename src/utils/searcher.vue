<template>
  <div class="searcher">
    <el-form :inline="true" :model="searchForm">
      <template v-for="field in searchFields" :key="field.prop">
        <el-form-item :label="field.label">
          <template v-if="field.prop === 'season'">
            <SeasonSelect v-model="searchForm[field.prop]" />
          </template>
          <template v-else>
            <el-input v-model="searchForm[field.prop]" :placeholder="`请输入${field.label}`" clearable />

          </template>
        </el-form-item>
      </template>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import SeasonSelect from '../utils/seasonSelect.vue'
import { seasonCalculate,currentSeasonData } from '../utils/season.js'

const props = defineProps({
  mode: { type: String, required: true }, // flight / route / permission / task
  list: { type: Array, required: true }
})
const emit = defineEmits(['update:result'])

// 各模式对应的搜索字段
const fieldMap = {
  flight: [
    { label: '航季', prop: 'season' },
    { label: '航班号', prop: 'flightNumber' },
    { label: '起飞机场', prop: 'departure' },
    { label: '目的机场', prop: 'arrival' }
  ],
  route: [
    { label: '航季', prop: 'season' },
    { label: '起飞机场', prop: 'departure' },
    { label: '目的机场', prop: 'arrival' },
    { label: '起飞-到达', prop: 'sector' },
    { label: '航路代码', prop: 'routeCode' },
    { label: '飞越国家', prop: 'overflyCountry' }
  ],
  permission: [
    { label: '航季', prop: 'season' },
    { label: '国家', prop: 'country' },
    { label: '批复号', prop: 'permission' },
    { label: '航班号', prop: 'flightNumber' }
  ],
  task: [
    { label: '航季', prop: 'season' },
    { label: '任务名称', prop: 'taskName' },
    { label: '航班号', prop: 'flightNumber' },
    { label: '国家', prop: 'overflyCountry' }
  ],
  country: [
    { label: '国家', prop: 'country' },
  ]
}

const searchFields = computed(() => fieldMap[props.mode] || [])

// 初始化搜索表单
const searchForm = reactive({})
watch(
  searchFields,
  () => {
    searchFields.value.forEach(f => (searchForm[f.prop] = ''))
  },
  { immediate: true }
)

// 搜索逻辑
function handleSearch() {
  console.log('props', props)
  console.log('searchForm', JSON.stringify(searchForm)) // 打印当前搜索条件
  const filtered = props.list.filter(item => {
    return searchFields.value.every(f => {
      const val = searchForm[f.prop]?.trim()
      if (!val) return true
      const itemVal = Array.isArray(item[f.prop])
        ? item[f.prop].map(c => c.country || c).join(',')
        : (item[f.prop] ?? '').toString()
      return itemVal.includes(val)
    })
  })
  console.log('filtered result:', filtered) // 打印搜索结果
  emit('update:result', filtered)
}

function handleReset() {
  searchFields.value.forEach(f => (searchForm[f.prop] = ''))
  emit('update:result', props.list)
}
</script>

<style scoped>
.searcher {
  padding: 10px 0;
}
</style>