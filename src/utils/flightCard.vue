<template>
    <el-card shadow="hover">
        <!-- 航班 header -->
        <template #header>
            <div class="flex items-center justify-between">
                <el-checkbox :model-value="props.selectedFlights.includes(flight.flightNumber)" @change="onFlightSelect">
                    航班号：<strong>{{ flight.flightNumber }}</strong>
                </el-checkbox>
                <el-tag type="info" size="small">{{ flight.route.length }} 条未申请航路</el-tag>
            </div>
        </template>

        <!-- 航路多选列表 -->
        <el-checkbox-group :model-value="props.selectedRoutes[flight.flightNumber] || []" @change="onRouteSelect"
            class="grid grid-cols-2 gap-4">
            <el-card v-for="(item, idx) in flight.route" :key="idx" class="p-2" shadow="never"
                :body-style="{ padding: '10px 16px' }">
                <el-checkbox :label="item.routeCode" class="w-full left-align-container" style="min-height: 100px;">
                    <div>
                        <div class="left-align-container-text">
                            <strong>航路代码：</strong>{{ item.routeCode }}
                        </div>
                        <div class="left-align-container-text">
                            <strong>航路走向：</strong>{{ item.ATSroute }}
                        </div>
                        <div v-if="props.getOverflyCountryNames(item.overflyCountry).length"
                            class="left-align-container-text">
                            <strong>途经国家：</strong>
                            <el-tag v-for="(country, i) in props.getOverflyCountryNames(item.overflyCountry)" :key="i"
                                type="success" class="mr-1" size="small">
                                {{ country }}
                            </el-tag>
                        </div>
                    </div>
                </el-checkbox>
            </el-card>
        </el-checkbox-group>
    </el-card>
</template>

<script setup>
import { ref,defineProps, defineEmits ,watch} from 'vue'

const props = defineProps({
    data: { type: Object, required: true },
    selectedFlights: { type: Array, required: true },
    selectedRoutes: { type: Object, required: true },
    getOverflyCountryNames: { type: Function, required: true }
})
const flight = ref()
const emits = defineEmits(['update:flight', 'update:routes'])

// 勾选航班
const onFlightSelect = (checked) => {
    emits('update:flight', { flight: props.data, checked })
}
// 勾选航路
const onRouteSelect = (routes) => {
    emits('update:routes', { flight: props.data, routes })
}

watch(() => props.data, (val) => {
    flight.value = val
    console.log('props',props.data)

    console.log('flight',flight.value)
}, { immediate: true })

</script>