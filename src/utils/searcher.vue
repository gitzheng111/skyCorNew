<template>
  <div class="searcher">
    <el-form :inline="true" :model="searchForm" @keyup.enter="handleSearch">
      <template v-for="field in searchFields" :key="field.prop">
        <el-form-item :label="field.label">
          <template v-if="field.prop === 'season'">
            <SeasonSelect v-model="searchForm[field.prop]" />
          </template>
          <template v-else-if="field.prop === 'departure' || field.prop === 'arrival'">
            <el-input v-model="searchForm[field.prop]" :placeholder="`请输入${field.label}`" clearable
              @input="searchForm[field.prop] = searchForm[field.prop].toUpperCase().replace(/[^A-Z]/g, '')" />

          </template>
          <template v-else-if="field.prop === 'filterBefore'">
            <el-input v-model="searchForm[field.prop]" :placeholder="`请输入${field.label}`" clearable />

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
import { seasonCalculate, currentSeasonData } from '../utils/season.js'

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
    { label: '目的机场', prop: 'arrival' },
    { label: '几点之前', prop: 'filterBefore' },
    { label: '飞越国家', prop: 'overflyCountry' }

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
// function handleSearch() {
//   console.log('props', props)
//   console.log('searchForm', JSON.stringify(searchForm)) // 打印当前搜索条件
//   const filtered = props.list.filter(item => {
//     return searchFields.value.every(f => {
//       const val = searchForm[f.prop]?.trim()
//       if (!val) return true
//       const itemVal = Array.isArray(item[f.prop])
//         ? item[f.prop].map(c => c.country || c).join(',')
//         : (item[f.prop] ?? '').toString()
//       return itemVal.includes(val)
//     })
//   })
//   console.log('filtered result:', filtered) // 打印搜索结果
//   emit('update:result', filtered)
// }
function normalizeFlightNumber(val) {
  if (!val) return '';

  let str = val.toString().trim().toUpperCase();

  if (/^CXA\d+$/.test(str)) {
    // 已经是 CXA 开头的格式
    return str;
  } else if (/^MF\d+$/.test(str)) {
    // MF 开头 -> 去掉 MF，加上 CXA
    return 'CXA' + str.replace(/^MF/, '');
  } else if (/^\d+$/.test(str)) {
    // 纯数字 -> 加 CXA
    return 'CXA' + str;
  }

  // 其他情况原样返回（例如特殊前缀）
  return str;
}
function handleSearch() {
  // console.log('props', props.list)
  console.log('searchForm', JSON.stringify(searchForm)) // 打印当前搜索条件

  const filtered = props.list.filter(item => {
    console.log('props.list', props.list)
    return searchFields.value.every(f => {
      const val = searchForm[f.prop]?.trim()
      if (!val) return true

      // 特殊处理 filterBefore
      if (f.prop === 'filterBefore') {
        // 只支持 HH:mm 或 HH 格式
        let [h, m] = val.split(':')
        if (!m) m = '00'
        const limit = parseInt(h) * 60 + parseInt(m)

        // 假设航班对象有 departureTime / arrivalTime
        const timeStr = item.departureTime || item.arrivalTime
        if (!timeStr) return false
        const [ih, im] = timeStr.split(':')
        const flightMinutes = parseInt(ih) * 60 + parseInt(im)

        return flightMinutes <= limit
      }
      if (f.prop === 'overflyCountry') {
        const valUpper = val.trim().toUpperCase()

        // 匹配的关键词列表
        const keywords = valUpper
          .split(/[\/,，\s]+/)
          .map(v => v.trim())
          .filter(Boolean)

        if (keywords.length === 0) return true

        // 确保有 matchingRoutes
        if (!Array.isArray(item.matchingRoutes)) return false

        // 遍历所有 matchingRoutes
        return item.matchingRoutes.some(route => {
          if (!Array.isArray(route.overflyCountry)) return false

          // 检查 route 内每个国家
          return keywords.some(keyword =>
            route.overflyCountry.some(c => {
              const name = (c?.country || '').toUpperCase()
              return name.includes(keyword)
            })
          )
        })
      }
      if(props.mode == 'permission'&&f.prop === 'flightNumber'){
        return item.fileData.permitFlight.find(i=>i.flightNumber == normalizeFlightNumber(val))
      }
      //  普通字符串匹配逻辑
      // const itemVal = Array.isArray(item[f.prop])
      //   ? item[f.prop].map(c => c.country || c).join(',')
      //   : (item[f.prop] ?? '').toString()
      // console.log('itemVal',itemVal)
      // return itemVal.country.includes(val)
      const itemVal = Array.isArray(item[f.prop])
        ? item[f.prop].map(c => c.country || c).join(',')
        : (item[f.prop] ?? '').toString()

      console.log('itemVal', itemVal)
      return itemVal.toUpperCase().includes(val.toUpperCase())
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