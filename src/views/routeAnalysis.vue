<template>

    <div class="page" v-loading="loading" element-loading-text="正在分析航路..."
        element-loading-background="rgba(5,8,20,0.75)">
        <div class="hero">

            <div class="hero-title">
                全球航路智能分析平台
            </div>

            <div class="hero-subtitle">
                Flight Route Intelligence Center
            </div>

        </div>
        <!-- 查询区 -->
        <el-card class="search-card">

            <div class="search-row">

                <el-input v-model="departureAirport" placeholder="出发机场" style="width:150px" />

                <el-input v-model="arrivalAirport" placeholder="到达机场" style="width:150px" />

                <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" />

                <el-button type="primary" @click="fetchFlights">
                    开始分析
                </el-button>

            </div>

        </el-card>

        <!-- KPI -->

        <div class="main-grid">
            <div class="left-panel">
                <div>
                    <el-row :gutter="20">

                        <el-col :span="6">

                            <el-card class="metric-card blue">

                                <div class="metric-value">
                                    {{ summary.totalFlights }}
                                </div>

                                <div class="metric-label">
                                    历史航班
                                </div>

                            </el-card>

                        </el-col>

                        <el-col :span="6">

                            <el-card class="metric-card green">

                                <div class="metric-value">
                                    {{ countryStats.length || '?' }}
                                </div>

                                <div class="metric-label">
                                    涉及国家
                                </div>

                            </el-card>

                        </el-col>

                        <el-col :span="6">

                            <el-card class="metric-card orange">

                                <div class="metric-value">
                                    ?
                                </div>

                                <div class="metric-label">
                                    主流路径
                                </div>

                            </el-card>

                        </el-col>

                        <el-col :span="6">

                            <el-card class="metric-card red">

                                <div class="metric-value">
                                    ?
                                </div>

                                <div class="metric-label">
                                    风险国家
                                </div>

                            </el-card>

                        </el-col>

                    </el-row>




                    <el-card>

                        <template #header>
                            飞越国家排行
                        </template>

                        <div v-for="item in countryStats" :key="item.country" class="country-item">

                            <div class="country-name">
                                {{ item.country }}
                            </div>

                            <el-progress :percentage="item.percent" :stroke-width="8" :show-text="false" />

                        </div>

                    </el-card>


                </div>
                <el-card class="ai-card">

                    <template #header>
                        AI航路情报中心
                    </template>

                    <div class="ai-block">

                        <div class="ai-line">
                            🧭 主流路径：
                            <span>Netherlands → Germany → Poland</span>
                        </div>

                        <div class="ai-line warning">
                            ⚠ 风险区域：
                            <span>Russia / Belarus</span>
                        </div>

                        <div class="ai-line success">
                            ✈ 推荐航线：
                            <span>FRA → PEK / CDG → ZBAA</span>
                        </div>

                    </div>

                </el-card>
            </div>
            <div class="right-panel">
                <el-card class="map-card">

                    <template #header>
                        全球航路可视化
                    </template>

                    <RouteMap :routeData="analysisResults" />

                </el-card>
            </div>

        </div>

        <div class="secondary-grid">
            <el-card>

                <template #header>
                    主流路径排行
                </template>

                <el-table :data="routePatterns" height="350">

                    <el-table-column prop="sequence" label="国家序列" />

                    <el-table-column prop="count" label="次数" width="100" />

                    <el-table-column prop="percent" label="占比" width="120" />

                </el-table>

            </el-card>
            <el-card>

                <template #header>
                    相似航线推荐
                </template>

                <el-table :data="similarRoutes" height="350">

                    <el-table-column prop="route" label="航线" />

                    <el-table-column label="相似度">

                        <template #default="{ row }">

                            <el-progress :percentage="row.similarity" />

                        </template>

                    </el-table-column>

                </el-table>

            </el-card>

        </div>

        <!-- 航班列表 -->
        <el-card class="mt20">

            <template #header>
                航班明细
            </template>
            <div>
                <el-checkbox v-model="isFiltered" style="margin-bottom: 12px">
                    仅主流路径
                </el-checkbox>

            </div>

            <el-table :data="isFiltered ? flights : flightsFromDeparture" height="500">

                <el-table-column prop="callsign" label="航班号" width="120" />

                <el-table-column prop="departure" label="出发机场" />

                <el-table-column prop="arrival" label="到达机场" />

                <el-table-column label="飞越国家序列">

                    <template #default="{ row }">

                        <el-tag v-for="country in row.countrySequence" :key="country" style="margin-right:5px">
                            {{ country }}
                        </el-tag>

                    </template>

                </el-table-column>

            </el-table>

        </el-card>


        <!-- <el-row :gutter="20">

            <el-col :span="6">

                <el-card class="metric-card blue">

                    <div class="metric-value">
                        {{ summary.totalFlights }}
                    </div>

                    <div class="metric-label">
                        历史航班
                    </div>

                </el-card>

            </el-col>

            <el-col :span="6">

                <el-card class="metric-card green">

                    <div class="metric-value">
                        {{ countryStats.length || '?' }}
                    </div>

                    <div class="metric-label">
                        涉及国家
                    </div>

                </el-card>

            </el-col>

            <el-col :span="6">

                <el-card class="metric-card orange">

                    <div class="metric-value">
                        ?
                    </div>

                    <div class="metric-label">
                        主流路径
                    </div>

                </el-card>

            </el-col>

            <el-col :span="6">

                <el-card class="metric-card red">

                    <div class="metric-value">
                        ?
                    </div>

                    <div class="metric-label">
                        风险国家
                    </div>

                </el-card>

            </el-col>

        </el-row> -->
        <!-- 中间区域 -->
        <!-- <el-row :gutter="20" class="mt20">


            <el-col :span="12">

                <el-card>

                    <template #header>
                        飞越国家排行
                    </template>

                    <div v-for="item in countryStats" :key="item.country" class="country-item">

                        <div class="country-name">
                            {{ item.country }}
                        </div>

                        <el-progress :percentage="item.percent" :stroke-width="8" :show-text="false" />

                    </div>

                </el-card>

            </el-col>

          
            <el-col :span="12">




            </el-col>

        </el-row> -->

        <!-- 路径分析 -->




    </div>
</template>

<script setup>
import { ref } from 'vue'
import RouteMap from '@/components/RouteMap.vue'
import { getRouteAnalysis } from '../api.js'
const departureAirport = ref('EHAM')
const arrivalAirport = ref('RJAA')
const dateRange = ref([])
const analysisResults = ref([])
const summary = ref({
    totalFlights: '?',
    airlineCount: '?',
    avgDuration: '?',
    mainRoutePercent: '?'
})
const isFiltered = ref(true)
const countryStats = ref([])

const routePatterns = ref([])

const similarRoutes = ref([])

const flights = ref([])
const flightsFromDeparture = ref([])
const loading = ref(false)
const aiSummary = ref({
    riskLevel: '?',
    suggestion: '?'
})

const buildCountryStats = (data) => {
    console.log('原始国家数据', data)
    const counter = {}

    data.forEach(item => {

        item.countrySequence?.forEach(country => {

            if (!country || country === 'UNKNOWN') return

            counter[country] =
                (counter[country] || 0) + 1
        })
    })
    console.log('国家计数', counter)

    const total =
        Object.values(counter).reduce(
            (a, b) => a + b,
            0
        )

    return Object.entries(counter)
        .map(([country, count]) => ({
            country,
            count,
            percent: Math.round(count / total * 100)
        }))
        .sort((a, b) => b.count - a.count)
}
const buildRoutePatterns = (flights) => {

    const map = {}

    flights.forEach(flight => {

        const sequence =
            flight.countrySequence
                ?.filter(Boolean)
                .join(' → ')

        if (!sequence) return

        map[sequence] =
            (map[sequence] || 0) + 1
    })

    const total = flights.length

    return Object.entries(map)
        .map(([sequence, count]) => ({
            sequence,
            count,
            percent:
                ((count / total) * 100).toFixed(1) + '%'
        }))
        .sort((a, b) => b.count - a.count)
}
const fetchFlights = async () => {

    if (!dateRange.value?.length) return

    const [start, end] = dateRange.value

    loading.value = true
    console.log('查询参数', {
        departure: departureAirport.value,
        arrival: arrivalAirport.value,
        startDate: start,
        endDate: end
    })

    try {

        const analysisRes =
            await getRouteAnalysis({

                departure:
                    departureAirport.value,

                arrival:
                    arrivalAirport.value,

                startDate: start,

                endDate: end
            })

        console.log(
            '分析结果',
            analysisRes.data
        )

        const result =
            analysisRes.data.data

        analysisResults.value =
            result.analysisResults || []
        flights.value =
            result.flights || []

        flightsFromDeparture.value =
            result.flightsFromDeparture || []
        console.log('航班列表', flights.value)
        summary.value = {

            totalFlights:
                result.totalFlights || 0,

            countryCount:
                countryStats.value.length,

            mainRoute:
                routePatterns.value[0]?.count || 0,

            riskCount:
                aiSummary.value?.risks ? 0
                    : aiSummary.value?.risks?.split(',').length
        }
        countryStats.value =
            buildCountryStats(result.analysisResults)

        console.log('国家统计', countryStats.value)
        routePatterns.value =
            buildRoutePatterns(result.analysisResults)

    }
    finally {

        loading.value = false

    }
}
</script>

<style scoped>
/* =========================
   全局背景（统一宇宙航路风）
========================= */
.page {
    padding: 20px;
    min-height: 100vh;

    background:
        radial-gradient(circle at 15% 20%, rgba(0, 200, 255, 0.12), transparent 45%),
        radial-gradient(circle at 85% 10%, rgba(120, 255, 200, 0.08), transparent 40%),
        radial-gradient(circle at 50% 90%, rgba(255, 80, 200, 0.06), transparent 50%),
        linear-gradient(180deg, #050814, #070b18);

    color: #e6f1ff;
    font-family: "Inter", "PingFang SC", sans-serif;
}

:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-table__header-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__fixed),
:deep(.el-table__fixed-right),
:deep(.el-table__fixed-header-wrapper),
:deep(.el-table__fixed-body-wrapper) {
    background: transparent !important;
}

:deep(.el-table__cell),
:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
    background-color: transparent !important;
}

:deep(.el-table tr) {
    background: transparent !important;
}

:deep(.el-table__row) {
    background: transparent !important;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
    background: rgba(0, 180, 255, 0.10) !important;
    backdrop-filter: blur(6px);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
    background: rgba(255, 255, 255, 0.02) !important;
}

:deep(.el-table__fixed),
:deep(.el-table__fixed-right) {
    box-shadow: none !important;
}

:deep(.el-table th.el-table__cell) {
    background: rgba(255, 255, 255, 0.03) !important;
    color: #93c5fd !important;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.el-table),
:deep(.el-table__cell) {
    color: #dbeafe !important;
    font-size: 13px;
}

/* =========================
   🧊 统一玻璃卡片系统
========================= */
.main-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 16px;
    margin-top: 16px;
    align-items: start;
}

.right-panel .map-card {
    width: 100%;
    height: 500px;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid yellow
}

.left-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 16px;
}

.el-card {
    margin: 5px;
    color: white;
    background: rgba(255, 255, 255, 0.04) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);

    border: 1px solid rgba(120, 180, 255, 0.12) !important;
    border-radius: 14px !important;

    box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.35),
        inset 0 0 18px rgba(255, 255, 255, 0.02);

    transition: all 0.25s ease;
}

/* hover只做“轻微抬升”，不要乱发光 */
.el-card:hover {
    transform: translateY(-2px);

    transition: all 0.3s;

    box-shadow: 0 0 35px rgba(0, 180, 255, 0.25);
}

/* =========================
   🧠 卡片标题统一
========================= */
.el-card__header {
    color: #dbeafe;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* =========================
   🌟 HERO（保留但降噪）
========================= */
.hero {
    margin-bottom: 18px;
    padding: 28px;
    border-radius: 18px;

    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(22px);

    border: 1px solid rgba(120, 180, 255, 0.18);

    position: relative;
    overflow: hidden;
}

.hero-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 2px;
}

.hero-subtitle {
    margin-top: 6px;
    opacity: 0.6;
}

/* =========================
   📊 KPI 专属卡片（重点发光）
========================= */
.metric-card {
    position: relative;
    border-radius: 16px !important;
    overflow: hidden;
    color: white !important;
}

/* 只保留 KPI 呼吸光 */
.metric-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center,
            rgba(0, 200, 255, 0.25),
            transparent 60%);
    animation: pulse 3.5s infinite;
}

@keyframes pulse {
    0% {
        opacity: 0.35;
    }

    50% {
        opacity: 0.85;
    }

    100% {
        opacity: 0.35;
    }
}

.metric-value {
    font-size: 34px;
    font-weight: 800;
    text-shadow: 0 0 12px rgba(0, 200, 255, 0.5);
}

.metric-label {
    margin-top: 6px;
    opacity: 0.85;
    font-size: 13px;
}

/* KPI颜色统一“科技渐变” */
.blue {
    background: linear-gradient(135deg, #1677ff, #4096ff);
}

.green {
    background: linear-gradient(135deg, #00c389, #3ddc97);
}

.orange {
    background: linear-gradient(135deg, #ff8a00, #ffb347);
}

.red {
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
}

/* =========================
   🌍 国家列表（更像数据仪表）
========================= */
.country-item {
    margin-bottom: 14px;
}

.country-name {
    font-size: 13px;
    opacity: 0.75;
    margin-bottom: 6px;
}

/* =========================
   🧠 AI面板（重点升级）
========================= */
.ai-card {
    background: rgba(10, 18, 35, 0.55) !important;
    border: 1px solid rgba(0, 200, 255, 0.18) !important;
}

.ai-block {
    padding: 8px;
}

.ai-line {
    padding: 10px 0;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
    font-size: 13px;
}

.ai-line span {
    color: #4dd0ff;
}

.ai-line.warning span {
    color: #ffcc00;
}

.ai-line.success span {
    color: #4dffb8;
}

/* =========================
   🗺️ 地图区（强化视觉）
========================= */
.map-card {
    margin-top: 18px;
}

.map-card :deep(.echarts) {
    height: 720px !important;
}

/* =========================
   🧊 轻微统一按钮风格
========================= */
.el-button--primary {
    background: linear-gradient(135deg, #1677ff, #00c6ff);
    border: none;
    box-shadow: 0 0 12px rgba(0, 180, 255, 0.3);
}
</style>