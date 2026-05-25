<template>
    <el-dialog v-model="windowVisible" width="95%" top="3vh">
        <template #title>
            <div>航班变更评估</div>
            <el-tag>选中{{ newData.length }}个航班</el-tag>
        </template>
        <div v-if="currentStep === 'edit'">


            <!-- 总览 -->
            <div class="summary">
                <el-card>
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <div class="summary-item">
                                <div class="label">航班数量</div>
                                <div class="value">{{ newData.length }}</div>
                            </div>
                        </el-col>

                        <el-col :span="6">
                            <div class="summary-item">
                                <div class="label">变更航班</div>
                                <div class="value">{{ changedCount }}</div>
                            </div>
                        </el-col>

                        <el-col :span="6">
                            <div class="summary-item">
                                <div class="label">需申请国家</div>
                                <div class="value red">{{ needApplyCount }}</div>
                            </div>
                        </el-col>

                        <el-col :span="6">
                            <div class="summary-item">
                                <div class="label">无需申请</div>
                                <div class="value green">{{ noNeedApplyCount }}</div>
                            </div>
                        </el-col>
                    </el-row>
                </el-card>
            </div>
            <div class="flight-summary-list">
                <el-scrollbar max-height="180px">
                    <div class="flight-summary-cards">
                        <el-card v-for="(item, index) in newData" :key="index" class="flight-summary-card"
                            :class="{ active: currentIndex === index }" @click="currentIndex = index">
                            <div class="card-header">
                                <div class="flight-number">{{ evalueData[index]?.flightNumber }}</div>
                                <div v-if="needApplyFlight(index)" class="country-apply-list">
                                    <!-- <div v-for="item in getFlightApplySummary(index)" :key="item.country"
                                        class="country-apply-item">
                                        {{ item.country }}：{{ item.changes.join('、') }}
                                    </div> -->
                                    <div v-for="item in getFlightApplySummary(index)" :key="item.country">
                                        <div>{{ item.country }}</div>

                                        <div v-for="change in item.changes" :key="change.key">
                                            {{ change.label }}：
                                            {{ change.oldValue }} → {{ change.newValue }}
                                        </div>
                                    </div>
                                </div>
                                <!-- <el-tag size="small" :type="needApplyFlight(index) ? 'danger' : 'success'">
                                {{ needApplyFlight(index) ? '需重新申请' : '无需申请' }}
                            </el-tag> -->
                            </div>

                            <div class="card-body">
                                <div v-for="field in baseFields" :key="field.prop">
                                    <div v-if="isChanged(index, field.prop)" class="field-change">
                                        <span class="field-label">{{ field.label }}：</span>
                                        <span class="old-value">{{ evalueData[index]?.[field.prop] }}</span>
                                        <span class="arrow">→</span>
                                        <span class="new-value">{{ item[field.prop] }}</span>
                                    </div>
                                </div>

                                <div class="route-change" v-if="isRouteChanged(index)">
                                    航路发生变化
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-scrollbar>
            </div>

            <div class="container">
                <!-- 左侧 -->
                <!-- <div class="left-panel">
                <el-scrollbar height="70vh">
                    <el-card v-for="(item, index) in newData" :key="index" class="record-card"
                        @click="currentIndex = index" :class="{ active: currentIndex === index }">
                        <div class="title">{{ item.flightNumber }}</div>

                    
                    </el-card>
                </el-scrollbar>
            </div> -->

                <!-- 右侧 -->
                <div class="center-panel" v-if="currentFlight">
                    <!-- 左右按键导航 -->
                    <!-- <div class="nav">
                    <el-button @click="prevFlight">←</el-button>
                    <span>{{ currentFlight.flightNumber }}</span>
                    <el-button @click="nextFlight">→</el-button>
                </div> -->

                    <el-card>
                        <!-- 变更前 -->
                        <div class="section">
                            <div class="section-title">变更前</div>
                            <el-descriptions :column="2" border>
                                <el-descriptions-item v-for="field in baseFields" :key="field.prop"
                                    :label="field.label">
                                    {{ evalueData[currentIndex][field.prop] }}
                                </el-descriptions-item>
                            </el-descriptions>
                        </div>

                        <!-- 变更后 -->
                        <div class="section">
                            <div class="section-title">变更后</div>

                            <el-form :model="currentFlight" label-width="100px">
                                <el-form-item v-for="field in baseFields" :key="field.prop" :label="field.label">
                                    <el-input v-if="field.type === 'input'" v-model="currentFlight[field.prop]" />
                                    <el-time-picker v-else v-model="currentFlight[field.prop]" format="HH:mm"
                                        value-format="HH:mm" />
                                </el-form-item>

                                <!-- 航路国家编辑 -->
                                <div v-for="route in currentFlight.matchingRoutes" :key="route.routeCode"
                                    class="route-box">
                                    <div class="section-title">航路 {{ route.routeCode }}</div>

                                    <el-input v-model="route.ATSroute" type="textarea" />
                                    <el-table :data="route.overflyCountry" border size="small">

                                        <!-- 国家 -->
                                        <el-table-column prop="country" label="国家" width="120" />

                                        <!-- 动态列 -->
                                        <el-table-column v-for="field in routeFieldMap[route.routeCode]" :key="field"
                                            :label="routeFieldLabelMap[field]" min-width="140">
                                            <template #default="{ row }">

                                                <el-input v-model="row[field]" />

                                            </template>
                                        </el-table-column>

                                    </el-table>

                                </div>
                            </el-form>
                        </div>
                    </el-card>


                </div>

                <div class="right-panel">

                    <!--  热力地图 -->
                    <el-card class="map-box">
                        <template #header>国家飞越图</template>
                        <div ref="mapRef" class="map"></div>
                    </el-card>
                    <div class="floatCountryBox">
                        <el-card class="country-panel" v-if="selectedCountry">
                            <template #header>
                                🌍 {{ selectedCountry.country }}
                            </template>

                            <el-descriptions :column="1" border>

                                <el-descriptions-item label="是否需要飞越许可">
                                    <el-tag :type="selectedCountry.needApply ? 'danger' : 'success'">
                                        {{ selectedCountry.needApply ? '需要' : '不需要' }}
                                    </el-tag>
                                </el-descriptions-item>

                                <el-descriptions-item label="航班号变更影响">
                                    <el-tag :type="selectedCountry.changeFlightApply ? 'danger' : 'success'">
                                        {{ selectedCountry.changeFlightApply ? '需要申请' : '无需申请' }}
                                    </el-tag>
                                    <el-tag :type="selectedCountry.changeFlight ? 'danger' : 'success'"
                                        v-if="selectedCountry.changeFlightApply">
                                        {{ selectedCountry.changeFlight ? '本次变更航路需申请' : '本次不涉及' }}
                                    </el-tag>
                                </el-descriptions-item>

                                <el-descriptions-item label="航路变更影响">
                                    <el-tag :type="selectedCountry.changeRouteApply ? 'danger' : 'success'">
                                        {{ selectedCountry.changeRouteApply ? '需要申请' : '无需申请' }}
                                    </el-tag>
                                    <el-tag :type="selectedCountry.changeRoute ? 'danger' : 'success'"
                                        v-if="selectedCountry.changeRouteApply">
                                        {{ selectedCountry.changeRoute ? '本次变更航路需申请' : '本次不涉及' }}
                                    </el-tag>
                                </el-descriptions-item>

                                <el-descriptions-item label="最终判断">
                                    <el-tag :type="selectedCountry.trigger ? 'danger' : 'success'">
                                        {{ selectedCountry.trigger ? '需要重新申请' : '无需申请' }}
                                    </el-tag>
                                </el-descriptions-item>

                            </el-descriptions>
                            <!--需要进一步深化，做成智能检测，防止改航漏选影响航班 -->
                            <!-- <el-card v-if="affectedFlights.length" shadow="never">
                            <template #header>影响航班</template>

                            <el-tag v-for="f in affectedFlights" :key="f.flightNumber" style="margin-right:6px">
                                {{ f.flightNumber }}
                            </el-tag>
                        </el-card> -->
                        </el-card>

                    </div>

                </div>
            </div>


        </div>
        <div v-else class="summary-page">
            <div class="summary-page-header">
                <div class="summary-title">评估汇总</div>

                <!-- <div class="summary-actions">
                    <el-button @click="currentStep = 'edit'">
                        返回修改
                    </el-button>

                    <el-button type="success" @click="handleCreateTask">
                        生成申请任务
                    </el-button>
                </div> -->

            </div>

            <el-scrollbar max-height="70vh">
                <el-card v-for="item in evaluationResultList" :key="item.flightNumber" class="result-card">
                    <template #header>
                        <div class="result-header">
                            <span>{{ item.flightNumber }}</span>

                            <el-tag :type="item.applySummary.length ? 'danger' : 'success'">
                                {{ item.applySummary.length ? '需申请' : '无需申请' }}
                            </el-tag>
                        </div>
                    </template>

                    <div class="result-section">
                        <div class="section-title">航班信息变更</div>

                        <div v-for="field in item.changedFields" :key="field.prop" class="result-row">
                            {{ field.label }}：{{ field.oldValue }} → {{ field.newValue }}
                        </div>
                    </div>

                    <div class="result-section" v-if="item.routeChanges.length">
                        <div class="section-title">航路信息变更</div>

                        <div v-for="route in item.routeChanges" :key="route.routeCode + route.field" class="result-row">
                            {{ route.routeCode }} - {{ route.field }}：{{ route.oldValue }} → {{ route.newValue }}
                        </div>
                    </div>

                    <div class="result-section" v-if="item.applySummary.length">
                        <div class="section-title">需重新申请国家</div>

                        <el-card v-for="country in item.applySummary" :key="country.country" shadow="never"
                            class="country-apply-card">
                            <div class="country-header">
                                <span class="country-name">{{ country.country }}</span>

                                <el-tag type="danger" size="small">
                                    需重新申请
                                </el-tag>
                            </div>

                            <div class="country-change-list">
                                <div v-for="change in country.changes" :key="change.key" class="country-change-item">
                                    <div class="change-title">
                                        {{ change.label }}
                                    </div>

                                    <div class="change-detail">
                                        {{ change.fieldLabel }}：
                                        <span class="old-value">{{ change.oldValue }}</span>
                                        <span class="arrow">→</span>
                                        <span class="new-value">{{ change.newValue }}</span>
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-card>
            </el-scrollbar>
        </div>
        <template #footer>
            <div v-if="currentStep === 'edit'">
                <el-button @click="windowVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">评估</el-button>
            </div>

            <div v-else>
                <el-button @click="currentStep = 'edit'">
                    返回重新调整
                </el-button>

                <el-button type="success" @click="handleCreateTask">
                    生成申请任务
                </el-button>
            </div>
        </template>
    </el-dialog>
    <CreateTaskTool v-model:visible="showCreateTaskTool" :taskList="taskList" @success="refreshFlights" />
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import worldJson from '../assets/world.json'
//   import 'echarts/map/js/world'
import { getCountryRules, routeFieldLabelMap } from '../api.js'
import CreateTaskTool from '../utils/createTaskTool.vue'

echarts.registerMap('world', worldJson)
const baseFields = [
    { label: '航班号', prop: 'flightNumber', type: 'input' },
    { label: '性质', prop: 'attribution', type: 'input' },
    { label: '起飞机场', prop: 'departure', type: 'input' },
    { label: '目的机场', prop: 'arrival', type: 'input' },
    { label: '起飞时间', prop: 'departureTime', type: 'time' },
    { label: '到达时间', prop: 'arrivalTime', type: 'time' },
    { label: '起飞日期', prop: 'startDate', type: 'time' },

    { label: '到达日期', prop: 'endDate', type: 'time' },

]
const fieldChangeMap = {
    flightNumber: 'changeFlightNumber',
    attribution: 'changeAttribution',
    departure: 'changeDeparture',
    arrival: 'changeArrival',
    departureTime: 'changeDepartureTime',
    arrivalTime: 'changeArrivalTime',
    startDate: 'changeStartDate',
    endDate: 'changeEndDate',

    routeCode: 'changeRouteCode',
    ATSroute: 'changeATSroute',
    sector: 'changeSector',
    entryPoint: 'changeEntryPoint',
    exitPoint: 'changeExitPoint',
    entryTime: 'changeEntryTime',
    exitTime: 'changeExitTime'
}
const changeLabelMap = {
    changeFlightNumber: '航班号变更',
    changeAttribution: '性质变更',
    changeDeparture: '起飞机场变更',
    changeArrival: '目的机场变更',
    changeDepartureTime: '起飞时间变更',
    changeArrivalTime: '到达时间变更',
    changeStartDate: '起飞日期变更',
    changeEndDate: '到达日期变更',

    changeRouteCode: '航路编码变更',
    changeATSroute: 'ATS航路变更',
    changeSector: '航段变更',
    changeEntryPoint: '进入点变更',
    changeExitPoint: '离开点变更',
    changeEntryTime: '进入时间变更',
    changeExitTime: '离开时间变更'
}
const props = defineProps({
    visible: Boolean,
    evalueData: Array
})
const emit = defineEmits(['update:visible'])
const windowVisible = ref(false)
const evalueData = ref([])
const newData = ref([])
const currentIndex = ref(0)
const countryRules = ref([])
const currentStep = ref('edit')
const evaluationResultList = ref([])
const showCreateTaskTool = ref(false)
const refreshFlights = () => {
    emit('refreshFlights')
}
const currentFlight = computed(() => newData.value[currentIndex.value])
const selectedCountry = ref(null)
onMounted(async () => {
    countryRules.value = await getCountryRules()
})

watch(() => props.visible, v => windowVisible.value = v)

watch(() => props.evalueData, v => {
    evalueData.value = v || []
    newData.value = JSON.parse(JSON.stringify(v || []))
}, { immediate: true })
watch(windowVisible, (val) => {
    emit('update:visible', val)
})
// 是否变更
const isChanged = (i, prop) => {
    // console.log('旧和新的航班数据', evalueData.value, newData.value)
    return evalueData.value[i]?.[prop] !== newData.value[i]?.[prop]

}

const isRouteChanged = (i) => {
    evalueData.value[i]?.matchingRoutes?.[0]?.routeCode !==
        newData.value[i]?.matchingRoutes?.[0]?.routeCode
}


const buildCountryInfo = (countryName) => {
    const rule = countryRules.value.data.find(r => r.country === countryName)
    if (!rule) {
        return {
            country: countryName,
            needApply: false,
            changeFlightApply: false,
            changeRouteApply: false,
            changeFlight: false,
            changeRoute: false,
            trigger: false
        }
    }
    const changeApply = rule.changeApply
        ? JSON.parse(rule.changeApply)
        : {}
    // console.log('找到的规则', rule, 'changeApply', changeApply)
    //如何动态判断航班号和航路的变更是否触发申请条件？需要结合当前航班的数据和规则中的条件来判断
    const changeFlight = computed(() => baseFields.some(f =>
        evalueData.value[currentIndex.value]?.[f.prop] !==
        newData.value[currentIndex.value]?.[f.prop]
    ))

    const changeRoute = computed(() =>
        evalueData.value[currentIndex.value]?.matchingRoutes?.[0]?.routeCode !==
        newData.value[currentIndex.value]?.matchingRoutes?.[0]?.routeCode
    )

    const trigger = computed(() =>
        (changeFlight.value && changeApply?.changeFlightNumber) ||
        (changeRoute.value && changeApply?.changeRoute)
    )

    return {
        country: countryName,
        needApply: rule.needApply === 1,
        changeFlightApply: changeApply?.changeFlightNumber,
        changeRouteApply: changeApply?.changeRoute,
        changeFlight,
        changeRoute,
        trigger
    }
}
//判断国家的字段

const getRouteFields = (route) => {
    const fields = new Set()

    const scheduleType =
        currentFlight.value?.attribution === '非定期'
            ? '非定期'
            : '定期'

    route.overflyCountry?.forEach(row => {
        const rule = countryRules.value?.data?.find(
            r => r.country === row.country
        )

        const list =
            rule?.applyRequire?.[scheduleType]?.route || []

        list.forEach(f => fields.add(f))
    })

    return Array.from(fields)
}

const routeFieldMap = computed(() => {
    const map = {}

    currentFlight.value?.matchingRoutes?.forEach(route => {
        map[route.routeCode] = getRouteFields(route)
    })

    return map
})

// 核心：判断航班是否需申请 满足任一国家需申请，或航路/航班号变更又触发申请条件
//我还需要返回是哪个国家需要申请什么变更
const needApplyCountry = (country, index) => {
    const rule = countryRules.value.data.find(r => r.country === country)
    if (!rule) return null

    const changeApply = rule.changeApply
        ? JSON.parse(rule.changeApply)
        : {}

    const changes = []

    // 航班字段变化
    baseFields.forEach(field => {
        const oldValue = evalueData.value[index]?.[field.prop]
        const newValue = newData.value[index]?.[field.prop]

        if (oldValue !== newValue) {
            const changeKey = fieldChangeMap[field.prop]

            changes.push({
                key: changeKey,
                label: changeLabelMap[changeKey],
                field: field.prop,
                fieldLabel: field.label,
                oldValue,
                newValue,
                needApply: changeApply?.[changeKey] ?? false
            })
        }
    })

    // 航路字段变化
    const oldRoute = evalueData.value[index]?.matchingRoutes?.[0] || {}
    const newRoute = newData.value[index]?.matchingRoutes?.[0] || {}

    const routeFields = [
        { prop: 'routeCode', label: '航路编码' },
        { prop: 'ATSroute', label: 'ATS航路' },
        { prop: 'sector', label: '航段' },
        { prop: 'entryPoint', label: '进入点' },
        { prop: 'exitPoint', label: '离开点' },
        { prop: 'entryTime', label: '进入时间' },
        { prop: 'exitTime', label: '离开时间' }
    ]

    routeFields.forEach(field => {
        const oldValue = oldRoute[field.prop]
        const newValue = newRoute[field.prop]

        if (oldValue !== newValue) {
            const changeKey = fieldChangeMap[field.prop]

            changes.push({
                key: changeKey,
                label: changeLabelMap[changeKey],
                field: field.prop,
                fieldLabel: field.label,
                oldValue,
                newValue,
                needApply: changeApply?.[changeKey] ?? false
            })
        }
    })

    const applyChanges = changes.filter(item => item.needApply)

    return applyChanges.length
        ? {
            country,
            changes: applyChanges
        }
        : null
}
// const needApplyCountry = (country, index) => {
//     // console.log('countryRules', countryRules)
//     const rule = countryRules.value.data.find(r => r.country === country)
//     if (!rule) return null
//     const changeApply = rule.changeApply
//         ? JSON.parse(rule.changeApply)
//         : {}
//     const changeFlight = baseFields.some(f =>
//         evalueData.value[index]?.[f.prop] !== newData.value[index]?.[f.prop]
//     )

//     const changeRoute = isRouteChanged(index)

//     const changes = []
//     if (changeFlight && changeApply?.changeFlightNumber) {
//         changes.push('changeFlightNumber')
//     }
//     if (changeRoute && changeApply?.changeRoute) {
//         changes.push('changeRoute')
//     }
//     // console.log('判断国家申请', [{ country, changes }])

//     return changes.length > 0 ? { country, changes } : null
// }
const needApplyFlight = (index) => {
    const flight = newData.value[index]

    return flight.matchingRoutes.some(route =>
        route.overflyCountry.some(country =>
            needApplyCountry(country.country, index)
        )
    )
}
const getFlightApplySummary = (index) => {
    const flight = newData.value[index]

    if (!flight) return []

    // const changeLabelMap = {
    //     changeFlightNumber: '航班号变更',
    //     changeRoute: '航路变更'
    // }

    const result = []

    flight.matchingRoutes.forEach(route => {
        route.overflyCountry.forEach(countryItem => {
            const applyInfo = needApplyCountry(countryItem.country, index)

            if (applyInfo) {
                result.push({
                    country: countryItem.country,
                    changes: applyInfo.changes,

                    changesLabel: applyInfo.changes.map(item => changeLabelMap[item])
                })
            }
        })
    })

    return result
}
// const changeLabelMap = {
//     changeFlightNumber: '航班信息变更申请',
//     changeRoute: '航路变更申请'
// }
// 统计
const changedCount = computed(() =>
    newData.value.filter((f, i) =>
        baseFields.some(field =>
            evalueData.value[i]?.[field.prop] !== f[field.prop]
        )
    ).length
)

const needApplyCount = computed(() => {
    let count = 0
    newData.value.forEach((f, i) => {
        f.matchingRoutes.forEach(r => {
            r.overflyCountry.forEach(c => {
                if (needApplyCountry(c.country, i)) count++
            })
        })
    })
    return count
})

const noNeedApplyCount = computed(() => {
    let count = 0
    newData.value.forEach((f, i) => {
        f.matchingRoutes.forEach(r => {
            r.overflyCountry.forEach(c => {
                if (!needApplyCountry(c.country, i)) count++
            })
        })
    })
    return count
})

// 地图
const mapRef = ref()
let chart

const countryMap = {
    菲律宾: 'Philippines',
    印度尼西亚: 'Indonesia',
    越南: 'Vietnam',
    马来西亚: 'Malaysia',
    中国: 'China',
    澳大利亚: 'Australia'
}
const buildMapData = () => {
    if (!currentFlight.value) return []

    const result = []

    currentFlight.value.matchingRoutes.forEach(route => {
        route.overflyCountry.forEach(countryItem => {
            const needApply = needApplyCountry(
                countryItem.country,
                currentIndex.value
            )

            result.push({
                name: countryMap[countryItem.country] || countryItem.country,

                // 0 = 普通飞越
                // 1 = 飞越但无需申请
                // 2 = 飞越且需申请
                value: needApply ? 2 : 1,

                countryName: countryItem.country
            })
        })
    })

    return result
}
// const buildMapData = () => {
//     if (!currentFlight.value) return []

//     const data = []

//     currentFlight.value.matchingRoutes.forEach(route => {
//         route.overflyCountry.forEach(c => {
//             data.push({
//                 name: countryMap[c.country] || c.country,
//                 value: needApplyCountry(c.country, currentIndex.value) ? 100 : 10
//             })
//         })
//     })

//     return data
// }
//   const buildMapData = () => {
//     if (!currentFlight.value) return []

//     const data = []
//     currentFlight.value.matchingRoutes.forEach(r => {
//       r.overflyCountry.forEach(c => {
//         data.push({
//           name: countryMap[c.country] || c.country,
//           value: needApplyCountry(c.country, currentIndex.value) ? 100 : 10
//         })
//       })
//     })
//     return data
//   }
const affectedFlights = computed(() => {
    if (!selectedCountry.value) return []

    return newData.value.filter(f =>
        f.matchingRoutes.some(r =>
            r.overflyCountry.some(c =>
                c.country === selectedCountry.value.country
            )
        )
    )
})
const initMap = () => {
    if (!mapRef.value) return

    // ✅ 防止重复初始化
    if (chart) {
        chart.dispose()
        chart = null
    }

    chart = echarts.init(mapRef.value)
    chart.setOption({
        tooltip: {
            trigger: 'item',
            formatter: ({ data, name }) => {
                if (!data) return name

                return `
                <div>
                    <div><strong>${data.countryName || name}</strong></div>
                    <div>
                        ${data.value === 2
                        ? '需重新申请'
                        : data.value === 1
                            ? '无需申请'
                            : '未飞越'
                    }
                    </div>
                </div>
            `
            }
        },

        visualMap: {
            show: false,
            min: 0,
            max: 2,
            inRange: {
                color: [
                    '#e5e7eb', // 灰色：未飞越
                    '#67c23a', // 绿色：飞越无需申请
                    '#f56c6c'  // 红色：飞越需申请
                ]
            }
        },

        series: [
            {
                name: '飞越国家',
                type: 'map',
                map: 'world',
                roam: true,

                itemStyle: {
                    areaColor: '#f5f7fa',
                    borderColor: '#dcdfe6',
                    borderWidth: 1
                },

                emphasis: {
                    label: {
                        show: true,
                        color: '#303133'
                    },
                    itemStyle: {
                        borderColor: '#409eff',
                        borderWidth: 3,
                        shadowBlur: 12,
                        shadowColor: 'rgba(64,158,255,0.5)'
                    }
                },

                select: {
                    itemStyle: {
                        borderColor: '#409eff',
                        borderWidth: 4,
                        shadowBlur: 16,
                        shadowColor: 'rgba(64,158,255,0.6)'
                    }
                },

                data: buildMapData()
            }
        ]
    })
    // chart.setOption({
    //     tooltip: {
    //         trigger: 'item',
    //         formatter: ({ name, value }) => {
    //             return `${name}`

    //             return `${name}：${value === 100 ? '需申请 ❌' : '可通行 ✅'}`
    //         }
    //     },

    //     visualMap: {
    //         min: 0,
    //         max: 100,
    //         text: ['申请难度高', '申请难度低'],
    //         inRange: {
    //             color: ['#67c23a', '#e6a23c', '#f56c6c']
    //         }
    //     },

    //     series: [
    //         {
    //             name: '国家风险',
    //             type: 'map',
    //             map: 'world',
    //             roam: true,
    //             emphasis: {
    //                 label: { show: true }
    //             },
    //             data: buildMapData()
    //         }
    //     ]
    // })
    //重复点击同个国家怎么清空
    let lastClickedCountry = null
    chart.on('click', (params) => {
        const englishName = params.name

        const reverseMap = {
            Philippines: '菲律宾',
            Indonesia: '印度尼西亚',
            Vietnam: '越南',
            Malaysia: '马来西亚'
        }

        const cnName = reverseMap[englishName] || englishName

        // 重复点击同个国家时清空
        if (lastClickedCountry === cnName) {
            selectedCountry.value = null
            lastClickedCountry = null
        } else {
            selectedCountry.value = buildCountryInfo(cnName)
            lastClickedCountry = cnName
        }
        console.log('点击了国家', cnName, selectedCountry.value)
    })
}


//评估功能
const buildEvaluationSummary = () => {
    const result = []

    newData.value.forEach((flight, index) => {
        const changedFields = []

        baseFields.forEach(field => {
            const oldValue = evalueData.value[index]?.[field.prop]
            const newValue = flight[field.prop]

            if (oldValue !== newValue) {
                changedFields.push({
                    label: field.label,
                    prop: field.prop,
                    oldValue,
                    newValue
                })
            }
        })

        const routeChanges = []

        flight.matchingRoutes?.forEach((route, routeIndex) => {
            const oldRoute = evalueData.value[index]?.matchingRoutes?.[routeIndex]

            if (!oldRoute) return

            const routeFields = ['routeCode', 'ATSroute', 'entryPoint', 'exitPoint', 'entryTime', 'exitTime']

            routeFields.forEach(field => {
                const oldValue = oldRoute[field]
                const newValue = route[field]

                if (oldValue !== newValue) {
                    routeChanges.push({
                        routeCode: route.routeCode,
                        field,
                        oldValue,
                        newValue
                    })
                }
            })
        })
        console.log('newValue', newData.value, 'evalueData.value', evalueData.value)
        result.push({
            flightNumber: flight.flightNumber,
            changedFields,
            routeChanges,
            applySummary: getFlightApplySummary(index),
            flightList: [evalueData.value[index]],
            newFlightList: [newData.value[index]],

            type: 'changeFlight',
        })
    })

    evaluationResultList.value = result
}

const handleSubmit = () => {
    buildEvaluationSummary()
    currentStep.value = 'summary'
}
const taskList = ref()
const handleCreateTask = () => {
    // 这里可以调用接口把评估结果提交到后端，生成申请任务
    console.log('旧数据', evalueData.value, '新数据', newData.value)
    console.log('生成申请任务', evaluationResultList.value)
    showCreateTaskTool.value = true
    // taskList.value  = evaluationResultList.value.filter(item => item.applySummary.length > 0).map(item => ({
    //     flightNumber: item.flightNumber,
    //     applySummary: item.applySummary
    // }))
    taskList.value = evaluationResultList.value
    // 例如：

}

// watch(currentFlight, () => setTimeout(initMap, 100), { immediate: true })
watch(
    () => [
        currentIndex.value,
        currentFlight.value,
        JSON.stringify(newData.value[currentIndex.value])
    ],
    async () => {
        await nextTick()

        if (!chart) return

        chart.setOption({
            series: [
                {
                    data: buildMapData()
                }
            ]
        })
    },
    {
        deep: true
    }
)
watch(currentFlight, async () => {
    await nextTick()
    initMap()
    //   selectedCountry.value = buildCountryInfo(cnName)
}, { immediate: true })
watch(currentStep, async (val) => {
    if (val === 'edit') {
        await nextTick()

        // 等 DOM 重新渲染出来
        setTimeout(() => {
            initMap()
        }, 100)
    }
})
// watch(
//     [countryRules],
//     () => {
//         if (!countryRules.value?.data?.length) return

//         enrichRouteFields()
//     },
//     {
//         deep: true,
//         // immediate: true
//     }
// )
const nextFlight = () => currentIndex.value++
const prevFlight = () => currentIndex.value--

// const handleSubmit = () => {
//     console.log(newData.value)
// }
</script>

<style scoped>
.summary-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.summary-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-title {
    font-size: 18px;
    font-weight: 600;
}

.summary-actions {
    display: flex;
    gap: 8px;
}

.result-card {
    margin-bottom: 12px;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.result-section {
    margin-bottom: 12px;
}

.country-apply-card {
    margin-bottom: 12px;
    border-radius: 10px;
    background: #fafafa;
}

.country-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.country-name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.country-change-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.country-change-item {
    padding: 8px 10px;
    border-radius: 6px;
    background: #fff;
    border: 1px solid #ebeef5;
}

.change-title {
    font-size: 13px;
    font-weight: 600;
    color: #e6a23c;
    margin-bottom: 4px;
}

.change-detail {
    font-size: 13px;
    color: #606266;
}

.old-value {
    color: #909399;
    text-decoration: line-through;
}

.new-value {
    color: #67c23a;
    font-weight: 600;
}

.arrow {
    margin: 0 6px;
    color: #c0c4cc;
}

.result-row {
    line-height: 1.8;
    color: #606266;
}

.country-panel {
    margin-top: 15px;
}

.container {
    display: flex;
    gap: 12px;
    height: 80vh;
    /* ⭐关键：固定高度 */
}

/* 左侧 */
.left-panel {
    width: 12%;
    overflow-y: auto;
}

/* 中间（主编辑区） */
.center-panel {
    width: 40%;
    overflow-y: auto;
    padding-right: 10px;
}

/* 右侧（分析区固定） */
.right-panel {
    width: 60%;
    display: flex;
    flex-direction: column;
    gap: 10px;

    /* ⭐关键：不滚动 */
    overflow: hidden;
}

/* 地图必须固定高度 */
.map-box {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.floatCountryBox {
    margin-top: 10px;
    margin-left: 10px;
    z-index: 99;
    position: absolute;
}

.map {
    width: 100%;
    height: 420px;
    /* ⭐避免撑爆 */
}

/* 卡片紧凑一点 */
.country-panel {
    max-height: 260px;
    overflow: auto;
}


.record-card {
    margin-bottom: 10px;
    cursor: pointer;
}

.record-card.active {
    border: 1px solid #409eff;
}

.old {
    text-decoration: line-through;
    color: #999
}

.new {
    color: #67c23a
}

.summary-item {
    text-align: center
}

.value {
    font-size: 20px;
    font-weight: bold
}

.red {
    color: #f56c6c
}

.green {
    color: #67c23a
}

.flight-summary-list {
    margin: 12px 0;
}

.flight-summary-cards {
    display: flex;
    gap: 12px;
    padding-bottom: 8px;
}

.flight-summary-card {
    min-width: 300px;
    max-width: 320px;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.2s;
}

.flight-summary-card.active {
    border: 2px solid #409eff;
}

.flight-summary-card:hover {
    transform: translateY(-2px);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.flight-number {
    font-size: 16px;
    font-weight: 600;
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
}

.field-change {
    line-height: 1.5;
}

.field-label {
    color: #606266;
}

.old-value {
    color: #999;
    text-decoration: line-through;
}

.new-value {
    color: #67c23a;
    font-weight: 500;
}

.arrow {
    margin: 0 4px;
    color: #909399;
}

.route-change {
    color: #e6a23c;
    font-weight: 500;
    margin-top: 4px;
}
</style>