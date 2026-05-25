<template>
  <el-dialog v-model="dialogVisible" title="生成申请任务" width="600px" destroy-on-close>

    <el-form label-width="110px">
      <el-form-item label="任务名称">
        <el-input v-model="taskName" placeholder="请输入任务名称" />
      </el-form-item>

      <el-form-item label="任务性质">
        <el-input v-model="taskAttribution" disabled />
      </el-form-item>

      <el-form-item label="任务季节">
        <el-input v-model="taskSeason" disabled />
      </el-form-item>

      <el-form-item label="涉及国家">
        <div class="country-list">
          <!-- <el-tag v-for="country in countryList" :key="country" type="warning">
            {{ country }}
          </el-tag> -->
          <el-tag v-for="item in normalizedTaskList" :key="item.overflyCountry"
            :type="item.type === 'changeFlight' ? 'danger' : 'success'">
            {{ item.overflyCountry }}
            ({{ item.type === 'changeFlight' ? '航班信息变更' : '新增航班' }})
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item label="涉及航班">
        <div class="flight-list">
          <el-tag v-for="flight in flightNumbers" :key="flight" type="success">
            {{ flight }}
          </el-tag>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        提交任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import sha256 from 'crypto-js/sha256'
import { ElMessage } from 'element-plus'
import { addTask } from '../api.js'

const props = defineProps({
  visible: Boolean,
  taskList: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:visible',
  'success'
])


const normalizeAndGroupTaskList = (list) => {
  const map = new Map()

  list.forEach(item => {
    const type = item.type || 'add'

    // 👉 拆国家
    const countries = item.applySummary?.map(s => ({
      name: s.country,
      changes: s.changes || []
    })) || []

    countries.forEach(country => {
      const key = country.name

      // ✅ 初始化
      if (!map.has(key)) {
        map.set(key, {
          overflyCountry: key,
          type,
          flightList: [],
          newFlightList: [],
          overflyDetails: []
        })
      }

      const target = map.get(key)

      // ❗变更优先级更高
      if (type === 'changeFlight') {
        target.type = 'changeFlight'
      }

      // ✅ 合并 flightList（去重）
      item.flightList?.forEach(f => {
        if (
          f?.flightNumber &&
          !target.flightList.some(
            t => t.flightNumber === f.flightNumber
          )
        ) {
          target.flightList.push(f)
        }
      })

      // ✅ 合并 newFlightList（仅变更）
      if (type === 'changeFlight') {
        item.newFlightList?.forEach(f => {
          if (
            f?.flightNumber &&
            !target.newFlightList.some(
              t => t.flightNumber === f.flightNumber
            )
          ) {
            target.newFlightList.push(f)
          }
        })
      }

      // ✅ 合并 changes
      if (country.changes?.length) {
        target.overflyDetails.push(...country.changes)
      }
    })
  })

  return Array.from(map.values())
}

const buildTaskListByCountry = (list) => {
  const map = new Map()

  list.forEach(item => {
    const isChangeFlight = item.changedFields?.some(
      f => f.prop === 'flightNumber'
    )

    const type = isChangeFlight ? 'changeFlight' : 'add'

    item.flightList?.forEach(flight => {
      flight.matchingRoutes?.forEach(route => {
        route.overflyCountry?.forEach(countryItem => {
          const countryName = countryItem.country

          // ✅ 初始化
          if (!map.has(countryName)) {
            map.set(countryName, {
              overflyCountry: countryName,
              type,
              flightList: [],
              newFlightList: [],
              overflyDetails: [],
              changes: []
            })
          }

          const target = map.get(countryName)

          // ✅ 类型升级（只要有变更就是变更）
          if (type === 'changeFlight') {
            target.type = 'changeFlight'
          }

          // ✅ flightList 去重
          if (
            flight.flightNumber &&
            !target.flightList.some(
              f => f.flightNumber === flight.flightNumber
            )
          ) {
            target.flightList.push(flight)
          }

          // ✅ newFlightList（仅变更）
          if (isChangeFlight && item.newFlightList?.length) {
            item.newFlightList.forEach(newF => {
              if (
                newF.flightNumber &&
                !target.newFlightList.some(
                  f => f.flightNumber === newF.flightNumber
                )
              ) {
                target.newFlightList.push(newF)
              }
            })
          }

          // ✅ ⭐ 提取 overflyDetails（核心）
          if (countryItem.overflyDetails?.length) {
            target.overflyDetails.push(
              ...countryItem.overflyDetails
            )
          }

          // ✅ ⭐ 提取 changes（挂到国家）
          const summary = item.applySummary?.find(
            s => s.country === countryName
          )

          if (summary?.changes?.length) {
            target.changes.push(...summary.changes)
          }
        })
      })
    })
  })

  return Array.from(map.values())
}


const normalizedTaskList = computed(() =>
  buildTaskListByCountry(props.taskList)
)
const dialogVisible = ref(false)
const taskName = ref('')
const taskAttribution = ref('')
const taskSeason = ref('')
const taskListFromFather = ref()

const flightNumbers = computed(() => {
  const list = []

  props.taskList.forEach(item => {
    item.flightList?.forEach(flight => {
      if (flight.flightNumber && !list.includes(flight.flightNumber)) {
        list.push(flight.flightNumber)
      }
    })
  })

  return list
})

const countryList = computed(() => {
  return props.taskList.map(item => item.overflyCountry)
})

const generateDefaultTaskName = () => {
  const timestamp = dayjs().format('YYYYMMDDHHmm')

  const firstFlightNumber =
    props.taskList[0]?.flightList?.[0]?.flightNumber || '未知航班'

  const totalCountry = props.taskList.length

  const attribution =
    taskAttribution.value === 'SCHEDULED' ? '定期' : '非定期'

  return `${timestamp}创建_${firstFlightNumber}等航班_${totalCountry}个国家的${attribution}飞越申请`
}

const generateTaskAttribution = () => {
  return props.taskList[0]?.flightList?.[0]?.attribution?.toUpperCase() || ''
}

const generateTaskSeason = () => {
  return props.taskList[0]?.flightList?.[0]?.season?.toUpperCase() || ''
}

const handleSubmit = async () => {
  if (!props.taskList.length) {
    ElMessage.warning('暂无可提交的任务')
    return
  }

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const finalTaskName =
    taskName.value?.trim() || generateDefaultTaskName()

  const finalTaskAttribution =
    taskAttribution.value || generateTaskAttribution()

  const finalTaskSeason =
    taskSeason.value || generateTaskSeason()

  const taskKey = sha256(
    JSON.stringify(props.taskList) + now
  ).toString()

  const payload = {
    taskName: finalTaskName,
    taskKey,
    taskAttribution: finalTaskAttribution,
    taskSeason: finalTaskSeason,
    createTime: now,
    updateTime: now,
    data: JSON.stringify(props.taskList)
  }

  try {
    const res = await addTask(payload)

    ElMessage.success('任务已提交')

    console.log('任务提交成功', res)

    dialogVisible.value = false
    emit('success', res)
  } catch (error) {
    console.error('任务提交失败', error)
    ElMessage.error('任务提交失败，请重试')
  }
}
// 控制弹窗
watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val
  },
  { immediate: true }
)

// 仅用于更新数据（不会影响弹窗）
watch(
  () => props.taskList,
  () => {
    // console.log('props.visible', props.visible)

    // if (!props.visible) return
    console.log('**taskList in createTaskTool', props.taskList)
    taskName.value = generateDefaultTaskName()
    taskAttribution.value = generateTaskAttribution()
    taskSeason.value = generateTaskSeason()
  },
  { immediate: true }
)
// watch(
//   () => [props.taskCreateVisible,props.taskList],
//   (val) => {
//     dialogVisible.value = val
//     console.log('taskList in createTaskTool', props.taskList)
//     if (val) {
//       taskName.value = generateDefaultTaskName()
//       taskAttribution.value = generateTaskAttribution()
//       taskSeason.value = generateTaskSeason()
//     }
//   },
//   { immediate: true }
// )
watch(
  normalizedTaskList,
  (val) => {
    console.log('normalizedTaskList ', val)
  },
  { immediate: true, deep: true }
)
watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

</script>

<style scoped>
.country-list,
.flight-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
