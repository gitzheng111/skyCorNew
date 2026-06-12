<!-- flightCard.vue -->
<template>
  <div>
    <el-card shadow="hover" class="flight-card">
      <!-- 航班 Header -->
      <div class="flight-header">
        <el-checkbox :model-value="props.selectedFlights.includes(flightKey)" @change="onFlightSelect">
          <div class="flight-title">
            <el-icon class="mr-2">
              <Plane />
            </el-icon>
            <span class="flight-no">{{ flight.flightNumber }}</span>
            <el-tag size="small" type="info" class="ml-2">
              {{ flight.departure }} → {{ flight.arrival }}
            </el-tag>
          </div>
        </el-checkbox>

        <el-tag type="warning" effect="light" size="small">
          <el-icon class="mr-1">
            <Warning />
          </el-icon>
          {{ flight.route.length }} 条未申请航路
        </el-tag>
      </div>

      <!-- 航路多选列表 -->
      <el-checkbox-group :model-value="props.selectedRoutes[flightKey] || []" @change="onRouteSelect"
        class="route-grid">
        <el-card v-for="(item, idx) in flight.route" :key="idx" class="route-card" shadow="never">
          <el-checkbox :label="item.routeCode" class="route-checkbox">
            <div class="route-content">
              <div class="route-code">
                <el-icon class="mr-1">
                  <Location />
                </el-icon>
                <strong>{{ item.routeCode }}</strong>
              </div>

              <div v-if="getOverflyCountryNames(item.overflyCountry).length" class="route-countries">
                <el-icon class="mr-1">
                  <Flag />
                </el-icon>
                <el-tag v-for="(country, i) in getOverflyCountryNames(item.overflyCountry)" :key="i" class="mr-1"
                  size="small" :type="country.needPermit ? 'success' : 'info'">
                  {{ country.country }}
                </el-tag>
              </div>
            </div>
          </el-checkbox>
        </el-card>
      </el-checkbox-group>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue'
import { Warning, Location, Flag } from '@element-plus/icons-vue'
import {getFlightKey} from '@/utils/taskTool/utils/getFlightKey'
const props = defineProps({
  data: { type: Object, required: true },
  selectedFlights: { type: Array, required: true },
  selectedRoutes: { type: Object, required: true },
})

const getOverflyCountryNames = (overflyCountry) => {
    if (!overflyCountry || !Array.isArray(overflyCountry)) return []
    return overflyCountry.map(item => ({
        country: item.country,
        needPermit: item.needPermit
    }))
}
// const flight = ref()
const flight = computed(() => props.data)
// const emits = defineEmits(['update:flight', 'update:routes'])
const emit = defineEmits([
  'flight-change',
  'route-change'
])
// const flightKey = `${props.data.flightNumber}-${props.data.departure}-${props.data.arrival}`

const flightKey = computed(() =>
  getFlightKey(props.data)
)
// 勾选航班
const onFlightSelect = (checked) => {
  emit('flight-change', {
    key: flightKey.value,
    checked
  })
}

const onRouteSelect = (routes) => {
  emit('route-change', {
    key: flightKey.value,
    routes
  })
}

// watch(
//   () => props.data,
//   (val) => {
//     flight.value = val
//   },
//   { immediate: true }
// )
</script>

<style scoped lang="scss">
.flight-card {
  margin-top: 20px;
}

.flight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.flight-title {
  display: flex;
  align-items: center;
}

.flight-no {
  font-size: 32px;
  font-weight: 600;
}

.route-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.route-card {
  border-radius: 12px;
  transition: all 0.2s ease;
}

.route-card:hover {
  background-color: var(--el-fill-color-light);
}

.route-checkbox {
  width: 100%;
}

.route-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-code {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.route-countries {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>