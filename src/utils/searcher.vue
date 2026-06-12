<template>
  <div class="search-card">
    <div class="main-searchBar">
      <SeasonSelect v-model="season" class="season-select" />
      <!-- 搜索框 -->
      <el-input v-model="keyword" clearable size="large" class="search-input" placeholder="搜索航班号、机场、国家、航路、机型...">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <div class="search-toolbar">



        <el-tag round type="success" size="large">
          {{ resultCount }} 条数据
        </el-tag>

      </div>

    </div>

    <!-- 第二行 -->


    <!-- 搜索提示 -->
    <div class="quick-tags">
      快速检索
      <el-tag v-for="item in quickKeywords" :key="item" round effect="plain" class="quick-tag" @click="keyword = item">
        {{ item }}
      </el-tag>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import SeasonSelect from '../utils/seasonSelect.vue'
import { useSeasonData } from '../components/useSeasonUtils'
import { useDebounceFn } from '@vueuse/core'
const props = defineProps({
  mode: {
    type: String,
    default: 'flight'
  },
  list: {
    type: Array,
    default: () => []
  }
})

const quickKeywords = [
  '菲律宾',
  '日本',
  '韩国',
  '泰国',
  'MF',
  'A321',
  'G471'
]

const emit = defineEmits([
  'update:result'
])

const { todaySeason } = useSeasonData()

const keyword = ref('')
const season = ref(todaySeason?.value?.en || '')

const showSeason = computed(() =>
  ['flight', 'route', 'permission', 'task'].includes(props.mode)
)

const resultCount = ref(0)

/**
 * 构建索引文本
 */
function buildSearchText(item) {
  const values = []

  const walk = obj => {
    if (!obj) return

    if (Array.isArray(obj)) {
      obj.forEach(walk)
      return
    }

    if (typeof obj === 'object') {
      Object.values(obj).forEach(walk)
      return
    }

    values.push(String(obj))
  }

  walk(item)

  return values
    .join('|')
    .toUpperCase()
}
// const indexedList = computed(() =>
//   props.list.map(item => ({
//     raw: item,

//     flightNumber:
//       item.flightNumber?.toUpperCase() || '',

//     airports:
//       `${item.departure || ''}|${item.arrival || ''}`
//         .toUpperCase(),

//     aircraft:
//       item.aircraftType?.toUpperCase() || '',

//     season:
//       item.season?.toUpperCase() || '',

//     routes:
//       item.matchingRoutes
//         ?.map(r => r.routeCode)
//         .join('|')
//         .toUpperCase() || '',

//     countries:
//       item.matchingRoutes
//         ?.flatMap(
//           r => r.overflyCountry || []
//         )
//         .map(
//           c => c.country || ''
//         )
//         .join('|')
//         .toUpperCase() || '',

//     allText: ''
//   }))
// )

// indexedList.value.forEach(i => {
//   i.allText =
//     [
//       i.flightNumber,
//       i.airports,
//       i.aircraft,
//       i.routes,
//       i.countries,
//       i.season
//     ].join('|')
// })
/**
 * 字段映射
 */
const fieldAlias = {
  country: ['country'],
  route: ['routeCode'],
  dep: ['departure'],
  arr: ['arrival'],
  flight: ['flightNumber'],
  aircraft: ['aircraftType'],
  season: ['season']
}

function getFieldValue(item, fields) {
  const values = []

  const walk = obj => {
    if (!obj) return

    if (Array.isArray(obj)) {
      obj.forEach(walk)
      return
    }

    if (typeof obj === 'object') {
      Object.entries(obj).forEach(([k, v]) => {
        if (fields.includes(k)) {
          values.push(String(v))
        }
        walk(v)
      })
    }
  }

  walk(item)

  return values.join('|').toUpperCase()
}

/**
 * 智能搜索
 */
function searchData() {
  let result = [...props.list]

  if (season.value) {
    result = result.filter(
      item =>
        !item.season ||
        item.season === season.value
    )
  }

  if (keyword.value.trim()) {
    result = result.filter(matchKeyword)
  }

  resultCount.value = result.length

  emit('update:result', result)
}

function matchKeyword(item) {
  const text = buildSearchText(item)

  const raw = keyword.value.trim()

  /**
   * OR
   * MF812,MF814
   */
  if (raw.includes(',')) {
    const keywords = raw
      .split(',')
      .map(i => i.trim().toUpperCase())
      .filter(Boolean)

    return keywords.some(k =>
      text.includes(k)
    )
  }

  /**
   * AND
   * 菲律宾 泰国
   */
  const parts = raw
    .split(/\s+/)
    .map(i => i.trim())
    .filter(Boolean)

  return parts.every(part => {
    /**
     * country:菲律宾
     */
    if (part.includes(':')) {
      const [field, value] = part.split(':')

      const fields = fieldAlias[field]

      if (!fields) {
        return text.includes(
          value.toUpperCase()
        )
      }

      return getFieldValue(
        item,
        fields
      ).includes(
        value.toUpperCase()
      )
    }

    return text.includes(
      part.toUpperCase()
    )
  })
}

function resetSearch() {
  keyword.value = ''
  season.value =
    todaySeason?.value?.en || ''

  searchData()
}
const debouncedSearch = useDebounceFn(
  searchData,
  200
)

watch(
  [keyword, season],
  debouncedSearch
)
// watch(
//   [
//     () => props.list,
//     keyword,
//     season
//   ],
//   searchData,
//   {
//     immediate: true,
//     deep: true
//   }
// )
</script>

<style scoped>
.search-card {

  background: white;

  border-radius: 20px;

  width: 95%;

  margin: auto;

  padding: 18px 22px;

  /* margin: 18px 0px; */

  /* border: 1px solid #ebeef5; */

  transition: .25s;
}

.search-card:hover {

  box-shadow:
    0 10px 30px rgba(0, 0, 0, .04);
}

.main-searchBar {
  display: flex;

  align-items: center;

  gap: 18px;
}

.search-input {
  width: 80%;
  /* height: 40px; */
  /* margin-bottom: 14px; */
}

.search-toolbar {

  display: flex;

  align-items: center;

  justify-content: space-between;
}

.season-select {

  width: 10%;
}

.quick-tags {

  margin-top: 14px;

  display: flex;

  flex-wrap: wrap;

  gap: 8px;
}

.quick-tag {

  cursor: pointer;

  transition: .2s;
}

.quick-tag:hover {

  transform: translateY(-1px);
}
</style>