<template>
    <div class="dashboard">

        <!-- 顶部 -->
        <div class="top-bar glass-panel">

            <div>

                <div class="main-title">
                    ✈ 国际航班地缘政治风险态势中心
                </div>

                <div class="sub-title">
                    AI实时分析全球空域风险
                </div>

            </div>

            <div class="top-right">

                <div class="update-time">
                    {{ lastUpdate }}
                </div>

                <el-button type="primary" :loading="loading" @click="refreshAllRisk">
                    更新全球风险
                </el-button>

            </div>

        </div>

        <!-- 地图区域 -->
        <div class="map-wrapper glass-panel">

            <div class="map-header">

                <div class="map-title">
                    全球地缘政治风险监控地图
                </div>

                <div class="legend-group">

                    <div class="legend critical">
                        禁止飞越
                    </div>

                    <div class="legend high">
                        高风险
                    </div>

                    <div class="legend medium">
                        中风险
                    </div>

                    <div class="legend normal">
                        正常
                    </div>

                </div>

            </div>

            <!-- 地图 -->
            <div ref="chartRef" class="world-map" />

            <!-- 高风险国家 -->
            <div class="risk-panel">

                <div class="risk-panel-title">
                    🔥 高风险国家
                </div>

                <div v-for="item in hotCountries" :key="item.country" class="risk-country" :class="item.riskLevel"
                    @click="openCountryDetail(item)">

                    <div>
                        {{ getStatusIcon(item.riskLevel) }}
                        {{ item.country }}
                    </div>

                    <div class="risk-score">
                        {{ item.riskScore || getRiskScore(item.riskLevel) }}
                    </div>

                </div>

            </div>

        </div>

        <!-- 国家详情 -->
        <transition name="fade">

            <div v-if="detailVisible && currentCountry" class="detail-mask" @click.self="detailVisible = false">

                <div class="detail-dialog glass-panel">

                    <!-- 头部 -->
                    <div class="detail-header">

                        <div>

                            <div class="detail-country">
                                {{ currentCountry.country }}
                            </div>

                            <div class="detail-status">
                                {{ getOperationStatus(currentCountry.riskLevel) }}
                            </div>

                        </div>

                        <div class="detail-level" :class="currentCountry.riskLevel">
                            {{ currentCountry.riskLevel }}
                        </div>

                    </div>

                    <!-- 概览 -->
                    <div class="overview-grid">

                        <div class="overview-card">

                            <div class="overview-label">
                                风险趋势
                            </div>

                            <div class="overview-value">

                                <span v-if="currentCountry.trend === 'up'">
                                    📈 升级
                                </span>

                                <span v-else-if="currentCountry.trend === 'down'">
                                    📉 缓解
                                </span>

                                <span v-else>
                                    ➖ 稳定
                                </span>

                            </div>

                        </div>

                        <div class="overview-card">

                            <div class="overview-label">
                                风险指数
                            </div>

                            <div class="overview-value risk-text">
                                {{ currentCountry.riskScore || getRiskScore(currentCountry.riskLevel) }}
                            </div>

                        </div>

                        <div class="overview-card">

                            <div class="overview-label">
                                影响机场
                            </div>

                            <div class="overview-value">
                                {{ currentCountry.affectedAirports?.length || 0 }}
                            </div>

                        </div>

                    </div>

                    <!-- AI分析 -->
                    <div class="section-card">

                        <div class="section-title">
                            🧠 AI风险分析
                        </div>

                        <div class="summary">
                            {{ currentCountry.riskSummary || '暂无分析' }}
                        </div>

                    </div>

                    <!-- AI建议 -->
                    <div class="section-card">

                        <div class="section-title">
                            ✈ AI运行建议
                        </div>

                        <div class="advice-list">

                            <div v-if="currentCountry.operationAdvice?.reroute" class="advice danger">
                                建议绕飞相关空域
                            </div>

                            <div v-if="currentCountry.operationAdvice?.extraFuel" class="advice warning">
                                建议增加备降油量
                            </div>

                            <div v-if="currentCountry.operationAdvice?.monitorNOTAM" class="advice info">
                                持续关注 NOTAM
                            </div>

                            <div v-if="currentCountry.operationAdvice?.avoidDeparture" class="advice danger">
                                建议暂停运行
                            </div>

                        </div>

                    </div>

                    <!-- 影响机场 -->
                    <div class="section-card">

                        <div class="section-title">
                            🛬 影响机场
                        </div>

                        <div class="airport-list">

                            <el-tag v-for="airport in currentCountry.affectedAirports || []" :key="airport"
                                type="danger">
                                {{ airport }}
                            </el-tag>

                        </div>

                    </div>

                    <!-- 受影响航班 -->
                    <div class="section-card">

                        <div class="section-title">
                            ✈ 受影响航班
                        </div>

                        <div v-if="selectedCountryFlights.length === 0" class="empty-text">
                            当前无受影响航班
                        </div>

                        <div v-for="flight in selectedCountryFlights" :key="flight.flightNumber" class="flight-card">

                            <div class="flight-top">

                                <div class="flight-number">
                                    {{ flight.flightNumber }}
                                </div>

                                <div class="flight-level" :class="flight.flightRisk.riskLevel">
                                    {{ flight.flightRisk.riskLevel }}
                                </div>

                            </div>

                            <div class="flight-route">
                                {{ flight.departure }}
                                →
                                {{ flight.arrival }}
                            </div>

                            <div class="flight-risk">

                                风险值：
                                {{ flight.flightRisk.riskScore }}

                            </div>

                        </div>

                    </div>

                    <!-- 新闻 -->
                    <div class="section-card">

                        <div class="section-title">
                            🕒 最新动态
                        </div>

                        <div v-for="item in currentCountry.news || []" :key="item.title" class="news-card">

                            <div class="news-time">
                                {{ item.time }}
                            </div>

                            <a :href="item.url" target="_blank" class="news-title">
                                {{ item.title }}
                            </a>

                            <div class="news-source">
                                来源：{{ item.source || 'Reuters' }}
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </transition>

    </div>
</template>

<script setup>

import {
    ref,
    computed,
    onMounted,
    nextTick,
    watch
} from 'vue'

import * as echarts from 'echarts'

import worldJson from '../assets/world.json'

import {
    getCountryRules,
    analyzeCountryRisk,
    getFlights,
    getCountryRiskCache,
    saveCountryRisk
} from '../api.js'

import { useSeasonData } from '../components/useSeasonUtils'

const { curSeason } = useSeasonData()

const chartRef = ref(null)

const chartInstance = ref(null)

const loading = ref(false)

const detailVisible = ref(false)

const lastUpdate = ref('')

const currentCountry = ref(null)

const selectedCountry = ref('')

const countryList = ref([])

const flightList = ref([])

const flightListSimple = ref([])

/**
 * 国家名称映射
 */
const countryNameMap = {

    美国: 'United States of America',

    中国: 'China',

    俄罗斯: 'Russia',

    伊朗: 'Iran',

    韩国: 'South Korea',

    朝鲜: 'North Korea',

    英国: 'United Kingdom',

    法国: 'France',

    德国: 'Germany',

    日本: 'Japan'
}
const getCountryColor = level => {

    if (level === 'critical') {

        return '#ff2d55'

    }

    if (level === 'high') {

        return '#ff8c00'

    }

    if (level === 'medium') {

        return '#ffd000'

    }

    return '#00ffb3'

}
/**
 * 风险分值
 */
const riskLevelScoreMap = {

    critical: 100,

    high: 80,

    medium: 55,

    normal: 0
}

/**
 * 高风险国家
 */
const hotCountries = computed(() => {

    return countryList.value
        .filter(item => {

            return item.riskLevel === 'critical'
                || item.riskLevel === 'high'

        })
        .slice(0, 8)

})

/**
 * 风险分数
 */
const getRiskScore = level => {

    return riskLevelScoreMap[level] || 0

}

/**
 * 图标
 */
const getStatusIcon = level => {

    if (level === 'critical') return '🔴'

    if (level === 'high') return '🟠'

    if (level === 'medium') return '🟡'

    return '🟢'

}

/**
 * 运行状态
 */
const getOperationStatus = level => {

    const map = {

        critical: '禁止运行或飞越',

        high: '建议绕飞',

        medium: '加强监控',

        normal: '正常运行'

    }

    return map[level] || '正常运行'

}

/**
 * 国家详情
 */
const openCountryDetail = country => {

    currentCountry.value = country

    selectedCountry.value = country.country

    detailVisible.value = true

}

/**
 * 国家风险Map
 */
const buildCountryRiskMap = countryList => {

    const map = new Map()

    countryList.forEach(item => {

        map.set(item.country, {

            ...item,

            score:
                riskLevelScoreMap[
                item.riskLevel
                ] || 0

        })

    })

    return map

}

/**
 * 计算单条航路风险
 */
const calculateRouteRisk = (
    route,
    countryRiskMap
) => {

    const countries =
        route.overflyCountry || []

    let maxRiskScore = 0

    const hitCountries = []

    countries.forEach(item => {

        const risk =
            countryRiskMap.get(
                item.country
            )

        if (!risk) return

        if (risk.score > maxRiskScore) {

            maxRiskScore = risk.score

        }

        if (risk.score >= 55) {

            hitCountries.push({

                country: item.country,

                riskLevel:
                    risk.riskLevel,

                score:
                    risk.score,

                summary:
                    risk.riskSummary
            })

        }

    })

    return {

        routeCode:
            route.routeCode,

        riskScore:
            maxRiskScore,

        hitCountries

    }

}

/**
 * 航班风险评估
 */
const evaluateFlightRisk = (
    flight,
    countryRiskMap
) => {

    const routes =
        flight.matchingRoutes || []

    if (!routes.length) {

        return {

            riskScore: 0,

            riskLevel: 'normal',

            riskCountries: [],

            routeRisks: []

        }

    }

    const routeRisks =
        routes.map(route => {

            return calculateRouteRisk(
                route,
                countryRiskMap
            )

        })

    const riskyRoutes =
        routeRisks.filter(route => {

            return route.riskScore >= 80

        })

    const riskScore =
        Math.round(

            riskyRoutes.length
            / routes.length
            * 100

        )

    let riskLevel = 'normal'

    if (riskScore >= 80) {

        riskLevel = 'critical'

    }
    else if (riskScore >= 50) {

        riskLevel = 'high'

    }
    else if (riskScore >= 20) {

        riskLevel = 'medium'

    }

    const riskCountries =
        [...new Set(

            routeRisks.flatMap(route => {

                return route.hitCountries.map(
                    c => c.country
                )

            })

        )]

    const affectedCountries =
        riskCountries.map(country => {

            return countryRiskMap.get(
                country
            )

        })

    return {

        flightNumber:
            flight.flightNumber,

        departure:
            flight.departure,

        arrival:
            flight.arrival,

        riskScore,

        riskLevel,

        riskCountries,

        affectedCountries,

        routeRisks

    }

}

/**
 * 航班风险列表
 */
const flightRiskList = computed(() => {

    const countryRiskMap =
        buildCountryRiskMap(
            countryList.value
        )

    return flightListSimple.value.map(
        flight => {

            return {

                ...flight,

                flightRisk:
                    evaluateFlightRisk(
                        flight,
                        countryRiskMap
                    )

            }

        })

})

/**
 * 当前国家受影响航班
 */
const selectedCountryFlights =
    computed(() => {

        if (!selectedCountry.value) {

            return []

        }

        return flightRiskList.value.filter(
            flight => {

                return flight.flightRisk
                    ?.riskCountries
                    ?.includes(
                        selectedCountry.value
                    )

            })

    })

/**
 * 构建地图
 */
const buildMap = () => {

    if (!chartRef.value) return

    if (chartInstance.value) {

        chartInstance.value.dispose()

    }

    echarts.registerMap(
        'world',
        worldJson
    )

    chartInstance.value =
        echarts.init(chartRef.value)

    const data =
        countryList.value.map(item => {

            let value = 10

            if (item.riskLevel === 'critical') {

                value = 100

            }
            else if (item.riskLevel === 'high') {

                value = 80

            }
            else if (item.riskLevel === 'medium') {

                value = 55

            }

            return {

                name:
                    countryNameMap[
                    item.country
                    ] || item.countryEn,
                // name: item.country,
                value,
                itemStyle: {

                    areaColor:
                        getCountryColor(
                            item.riskLevel
                        )

                },

                riskLevel:
                    item.riskLevel

            }

        })
    console.log('mapData', data)
    chartInstance.value.setOption({

        backgroundColor:
            'transparent',

        tooltip: {

            trigger: 'item'

        },

        visualMap: {

            show: false,

            min: 0,

            max: 100,

            inRange: {

                color: [

                    '#00ffb3',

                    '#ffd000',

                    '#ff8c00',

                    '#ff2d55'

                ]

            }

        },

        series: [
            {

                type: 'map',

                map: 'world',

                roam: true,

                emphasis: {

                    label: {

                        color: '#ffffff'

                    },

                    itemStyle: {

                        areaColor:
                            '#58d3ff'

                    }

                },

                itemStyle: {

                    borderColor:
                        '#243b55',

                    borderWidth: 0.6

                },

                data

            }
        ]

    })

    chartInstance.value.on(
        'click',
        params => {

            const target =
                countryList.value.find(
                    item => {

                        return (
                            countryNameMap[
                            item.country
                            ] === params.name
                            || item.countryEn === params.name
                        )

                    })

            if (target) {

                openCountryDetail(target)

            }

        })

}

/**
 * 更新风险
 */
const refreshAllRisk = async () => {

    loading.value = true

    try {

        const countries =
            countryList.value.map(
                item => item.country
            )
        const countryCache = await getCountryRiskCache()

        //   if(countryCache.data && countryCache.data.length > 0) {
        //     console.log('使用缓存数据',countryCache.data)
        //     countryList.value = countryCache.data
        //     await nextTick()
        //     buildMap()
        //     return
        // }else {
        //     console.log('无缓存数据，进行风险分析')
        // }
        const result =
            await analyzeCountryRisk({
                countries
            })

        countryList.value =
            result.data || []
        console.log('analyze result', result.data)
        await nextTick()
        saveCountryRiskToCache()
        buildMap()

        lastUpdate.value =
            new Date().toLocaleString()

    }

    finally {

        loading.value = false

    }

}

/**
 * 加载国家
 */
const loadCountryData = async () => {
    const cache = await getCountryRiskCache()
    console.log('cache', cache)
    const res =
        await getCountryRules()

    countryList.value =
        res.data || []
    // return
    await refreshAllRisk()

}

/**
 * 加载航班
 */
const loadFlightData = async () => {

    const res = await getFlights()

    flightList.value =
        res.data || []

    const curSeasonFlights =
        flightList.value.filter(
            flight => {

                return (
                    flight.season
                    === curSeason.value.en
                )

            })

    flightListSimple.value =
        curSeasonFlights.map(
            flight => {

                return {

                    flightNumber:
                        flight.flightNumber,

                    departure:
                        flight.departure,

                    arrival:
                        flight.arrival,

                    season:
                        flight.season,

                    matchingRoutes:
                        flight.matchingRoutes?.map(
                            route => ({

                                routeCode:
                                    route.routeCode,

                                overflyCountry:
                                    route.overflyCountry || []

                            })
                        ) || []

                }

            })

}

const saveCountryRiskToCache = async () => {
    try {
        const payload = countryList.value.map((item, index) => ({
            // id: index + 1, // 
            country: item.country,
            countryEn: item.countryEn || '', // 如果没有可以先空
            riskSummary: {
                riskLevel: item.riskLevel,
                riskTags: item.riskTags,
                trend: item.trend,
                impactScope: item.impactScope,
                affectedAirports: item.affectedAirports,
                dispatchConclusion: item.dispatchConclusion,
                operationAdvice: item.operationAdvice,
                news: item.news,
                summary: item.riskSummary
            }
        }))
        console.log('准备保存缓存数据:', payload)
        const res = await saveCountryRisk(payload)

        console.log('缓存保存成功:', res.data)

    } catch (err) {
        console.error('缓存保存失败:', err)
    }
}

/**
 * 自动重绘
 */
watch(

    countryList,

    async () => {

        await nextTick()

        buildMap()

    },

    {
        deep: true
    }

)

/**
 * 初始化
 */
onMounted(async () => {

    await loadFlightData()

    await loadCountryData()

    window.addEventListener(
        'resize',
        () => {

            chartInstance.value?.resize()

        })

})

</script>

<style scoped>
* {
    box-sizing: border-box;
}

.dashboard {

    height: 100vh;

    overflow: hidden;

    padding: 18px;

    color: white;

    background:
        radial-gradient(circle at top left,
            rgba(0, 180, 255, .14),
            transparent 25%),

        radial-gradient(circle at bottom right,
            rgba(0, 255, 170, .08),
            transparent 25%),

        linear-gradient(135deg,
            #040b15,
            #08111f 45%,
            #050b14);
}

.glass-panel {

    background: rgba(15, 23, 42, .72);

    border: 1px solid rgba(255, 255, 255, .08);

    backdrop-filter: blur(18px);

    border-radius: 24px;

    box-shadow:
        0 12px 40px rgba(0, 0, 0, .35);
}

.top-bar {

    height: 90px;

    display: flex;

    justify-content: space-between;

    align-items: center;

    padding: 0 26px;

    margin-bottom: 18px;
}

.main-title {

    font-size: 30px;

    font-weight: 800;
}

.sub-title {

    margin-top: 8px;

    color: #8ea5bd;
}

.top-right {

    display: flex;

    align-items: center;

    gap: 18px;
}

.update-time {

    color: #58d3ff;
}

.map-wrapper {

    position: relative;

    height: calc(100vh - 126px);

    overflow: hidden;
}

.map-header {

    position: absolute;

    top: 20px;

    left: 24px;

    right: 24px;

    z-index: 20;

    display: flex;

    justify-content: space-between;

    align-items: center;
}

.map-title {

    font-size: 22px;

    font-weight: 700;
}

.legend-group {

    display: flex;

    gap: 10px;
}

.legend {

    padding: 8px 14px;

    border-radius: 999px;

    font-size: 12px;

    font-weight: 600;
}

.legend.critical {
    background: rgba(255, 45, 85, .18);
}

.legend.high {
    background: rgba(255, 140, 0, .18);
}

.legend.medium {
    background: rgba(255, 208, 0, .18);
}

.legend.normal {
    background: rgba(0, 255, 179, .18);
}

.world-map {

    width: 100%;

    height: 100%;
}

.risk-panel {

    position: absolute;

    right: 24px;

    top: 90px;

    width: 260px;

    z-index: 30;

    padding: 18px;

    border-radius: 20px;

    background: rgba(8, 16, 28, .75);

    border: 1px solid rgba(255, 255, 255, .08);

    backdrop-filter: blur(20px);
}

.risk-panel-title {

    font-size: 16px;

    font-weight: 700;

    margin-bottom: 14px;
}

.risk-country {

    display: flex;

    justify-content: space-between;

    align-items: center;

    padding: 12px;

    margin-bottom: 10px;

    border-radius: 14px;

    background: rgba(255, 255, 255, .03);

    cursor: pointer;

    transition: .2s;
}

.risk-country:hover {

    transform: translateY(-2px);

    background: rgba(255, 255, 255, .06);
}

.risk-country.critical {
    border-left: 4px solid #ff2d55;
}

.risk-country.high {
    border-left: 4px solid #ff8c00;
}

.risk-score {

    color: #58d3ff;

    font-weight: 700;
}

.detail-mask {

    position: fixed;

    inset: 0;

    background: rgba(0, 0, 0, .45);

    backdrop-filter: blur(10px);

    z-index: 999;

    display: flex;

    justify-content: center;

    align-items: center;
}

.detail-dialog {

    width: 920px;

    max-height: 88vh;

    overflow-y: auto;

    padding: 28px;
}

.detail-header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 24px;
}

.detail-country {

    font-size: 38px;

    font-weight: 800;
}

.detail-status {

    margin-top: 10px;

    color: #8ea5bd;
}

.detail-level {

    font-size: 42px;

    font-weight: 800;

    text-transform: uppercase;
}

.detail-level.critical {
    color: #ff2d55;
}

.detail-level.high {
    color: #ff8c00;
}

.detail-level.medium {
    color: #ffd000;
}

.detail-level.normal {
    color: #00ffb3;
}

.overview-grid {

    display: grid;

    grid-template-columns: repeat(3, 1fr);

    gap: 16px;

    margin-bottom: 18px;
}

.overview-card {

    padding: 20px;

    border-radius: 18px;

    background: rgba(255, 255, 255, .03);

    border: 1px solid rgba(255, 255, 255, .05);
}

.overview-label {

    color: #8ea5bd;

    margin-bottom: 10px;
}

.overview-value {

    font-size: 24px;

    font-weight: 700;
}

.risk-text {
    color: #ff5c7a;
}

.section-card {

    padding: 22px;

    border-radius: 20px;

    background: rgba(255, 255, 255, .03);

    border: 1px solid rgba(255, 255, 255, .05);

    margin-bottom: 18px;
}

.section-title {

    font-size: 18px;

    font-weight: 700;

    margin-bottom: 18px;
}

.summary {

    line-height: 1.9;

    color: rgba(255, 255, 255, .88);
}

.advice-list {

    display: flex;

    flex-direction: column;

    gap: 12px;
}

.advice {

    padding: 14px 16px;

    border-radius: 14px;

    font-weight: 600;
}

.advice.danger {

    background: rgba(255, 45, 85, .12);

    border: 1px solid rgba(255, 45, 85, .28);
}

.advice.warning {

    background: rgba(255, 208, 0, .12);

    border: 1px solid rgba(255, 208, 0, .28);
}

.advice.info {

    background: rgba(0, 180, 255, .12);

    border: 1px solid rgba(0, 180, 255, .28);
}

.airport-list {

    display: flex;

    flex-wrap: wrap;

    gap: 10px;
}

.news-card {

    padding: 14px;

    border-radius: 14px;

    background: rgba(255, 255, 255, .03);

    margin-bottom: 12px;
}

.news-time {

    color: #58d3ff;

    font-size: 12px;

    margin-bottom: 8px;
}

.news-title {

    color: white;

    text-decoration: none;

    line-height: 1.7;
}

.news-title:hover {
    color: #58d3ff;
}

.news-source {

    margin-top: 8px;

    color: #8ea5bd;

    font-size: 12px;
}

.flight-card {

    padding: 18px;

    border-radius: 16px;

    background: rgba(255, 255, 255, .04);

    border: 1px solid rgba(255, 255, 255, .05);

    margin-bottom: 14px;
}

.flight-top {

    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 12px;
}

.flight-number {

    font-size: 20px;

    font-weight: 700;
}

.flight-level {

    padding: 6px 12px;

    border-radius: 999px;

    font-size: 12px;

    font-weight: 700;

    text-transform: uppercase;
}

.flight-level.critical {

    background: rgba(255, 45, 85, .18);

    color: #ff5c7a;
}

.flight-level.high {

    background: rgba(255, 140, 0, .18);

    color: #ffb04d;
}

.flight-level.medium {

    background: rgba(255, 208, 0, .18);

    color: #ffd84d;
}

.flight-level.normal {

    background: rgba(0, 255, 179, .18);

    color: #00ffb3;
}

.flight-route {

    color: #d4e3f3;

    margin-bottom: 10px;
}

.flight-risk {

    color: #58d3ff;

    font-weight: 700;
}

.empty-text {

    color: #8ea5bd;
}

.fade-enter-active,
.fade-leave-active {
    transition: .25s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>