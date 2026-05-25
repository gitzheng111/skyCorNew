<!-- RiskDashboard.vue -->
<template>
    <div class="dashboard">
        <div class="top-actions">

            <div class="ai-status">

                <div class="status-dot" :class="{ running: loading }" />

                <span v-if="loading">
                    AI正在分析全球运行风险...
                </span>

                <span v-else>
                    全球风险数据已更新
                </span>

            </div>

            <div class="action-buttons">

                <el-button type="primary" :loading="loading" @click="refreshAllRisk">
                    更新全球风险
                </el-button>

            </div>

        </div>
        <!-- 顶部 -->
        <div class="top-bar">

            <div class="title-area">
                <h1>✈ 国际航班运行风险监控中心</h1>
                <div class="update-time">
                    最后更新：
                    {{ lastUpdate }}
                </div>
            </div>

            <div class="top-stats">

                <el-card class="glass-card" shadow="never">
                    <div class="num">
                        {{ stats.critical }}
                    </div>

                    <div class="label">
                        禁止飞越
                    </div>
                </el-card>

                <el-card class="glass-card" shadow="never">
                    <div class="num">
                        {{ stats.high }}
                    </div>

                    <div class="label">
                        高风险
                    </div>
                </el-card>

                <el-card class="glass-card" shadow="never">
                    <div class="num">
                        {{ stats.medium }}
                    </div>

                    <div class="label">
                        中风险
                    </div>
                </el-card>

                <el-card class="glass-card" shadow="never">
                    <div class="num">
                        {{ stats.normal }}
                    </div>

                    <div class="label">
                        正常
                    </div>
                </el-card>

            </div>

        </div>

        <!-- 主体 -->
        <div class="main-layout">

            <!-- 左侧重点国家 -->
            <div class="left-panel">

                <div class="panel-title">
                    🔥 重点关注国家
                </div>

                <el-scrollbar height="100%">

                    <div v-for="item in sortedCountries" :key="item.country" class="country-card"
                        :class="item.riskLevel" @click="selectCountry(item)">

                        <div class="country-header">

                            <div class="country-name">
                                {{ getStatusIcon(item.riskLevel) }}
                                {{ item.country }}
                            </div>

                            <el-tag :type="getTagType(item.riskLevel)">
                                {{ item.riskLevel }}
                            </el-tag>

                        </div>

                        <div class="country-tags">

                            <el-tag v-for="tag in item.riskTags" :key="tag" size="small" type="danger">
                                {{ tag }}
                            </el-tag>

                        </div>

                        <div class="country-impact">

                            <span v-for="scope in item.impactScope" :key="scope">
                                {{ getImpactLabel(scope) }}
                            </span>

                        </div>

                    </div>

                </el-scrollbar>

            </div>

            <!-- 中间详情 -->
            <div class="center-panel">
                
                <template v-if="currentCountry">

                    <!-- 风险概览 -->
                    <el-row :gutter="16">

                        <el-col :span="8">

                            <el-card class="info-card">

                                <div class="info-title">
                                    风险等级
                                </div>

                                <div class="risk-badge" :class="currentCountry.riskLevel">
                                    {{ currentCountry.riskLevel }}
                                </div>

                            </el-card>

                        </el-col>

                        <el-col :span="8">

                            <el-card class="info-card">

                                <div class="info-title">
                                    风险趋势
                                </div>

                                <div class="trend">

                                    <span v-if="currentCountry.trend === 'up'">
                                        📈 风险升级
                                    </span>

                                    <span v-else-if="currentCountry.trend === 'down'">
                                        📉 风险缓解
                                    </span>

                                    <span v-else>
                                        ➖ 风险稳定
                                    </span>

                                </div>

                            </el-card>

                        </el-col>

                        <el-col :span="8">

                            <el-card class="info-card">

                                <div class="info-title">
                                    运行状态
                                </div>

                                <div class="operation-status">
                                    {{ getOperationStatus(currentCountry.riskLevel) }}
                                </div>

                            </el-card>

                        </el-col>

                    </el-row>

                    <!-- AI分析 -->
                    <el-card class="section-card">

                        <template #header>
                            🧠 AI风险分析
                        </template>

                        <div class="summary">
                            {{ currentCountry.riskSummary }}
                        </div>

                    </el-card>

                    <!-- 影响范围 -->
                    <el-card class="section-card">

                        <template #header>
                            🌍 影响范围
                        </template>

                        <div class="impact-box">

                            <el-tag v-for="scope in currentCountry.impactScope" :key="scope" type="warning"
                                size="large">
                                {{ getImpactLabel(scope) }}
                            </el-tag>

                        </div>

                    </el-card>

                    <!-- 影响机场 -->
                    <el-card class="section-card">

                        <template #header>
                            🛬 影响机场
                        </template>

                        <div class="airport-box">

                            <el-tag v-for="airport in currentCountry.affectedAirports" :key="airport" type="danger">
                                {{ airport }}
                            </el-tag>

                        </div>

                    </el-card>

                    <!-- AI运行结论 -->
                    <el-card class="section-card conclusion-card">

                        <template #header>
                            ✈ AI运行结论
                        </template>

                        <div class="dispatch-conclusion">
                            {{ currentCountry.dispatchConclusion }}
                        </div>

                    </el-card>

                </template>

            </div>

            <!-- 右侧建议 -->
            <div class="right-panel">

                <div class="panel-title">
                    ✈ AI运行建议
                </div>

                <template v-if="currentCountry">

                    <el-alert v-if="currentCountry.operationAdvice?.reroute" title="建议绕飞" type="error" show-icon
                        :closable="false" />

                    <el-alert v-if="currentCountry.operationAdvice?.extraFuel" title="建议增加备降油量" type="warning" show-icon
                        :closable="false" />

                    <el-alert v-if="currentCountry.operationAdvice?.monitorNOTAM" title="持续关注NOTAM" type="info"
                        show-icon :closable="false" />

                    <el-alert v-if="currentCountry.operationAdvice?.avoidDeparture" title="建议暂停起降" type="error"
                        show-icon :closable="false" />

                </template>

                <!-- 时间线 -->
                <div class="timeline-title">
                    🕒 最新动态
                </div>

                <el-timeline>

                    <el-timeline-item v-for="item in currentCountry?.news || []" :key="item.title"
                        :timestamp="item.time">

                        <a :href="item.url" target="_blank">
                            {{ item.title }}
                        </a>

                    </el-timeline-item>

                </el-timeline>

            </div>

        </div>

    </div>
</template>

<script setup>

import {
    ref,
    computed,
    onMounted
} from 'vue'

import {
    getCountryRules,
    analyzeCountryRisk,
    getCountryRiskCache
} from '../api.js'

const countryList = ref([])

const currentCountry =
    ref(null)

const lastUpdate =
    ref('')

const loading =
    ref(false)

const selectCountry = (item) => {
    currentCountry.value = item
}

const stats = computed(() => {

    const result = {
        critical: 0,
        high: 0,
        medium: 0,
        normal: 0
    }

    countryList.value.forEach(item => {

        if (item.riskLevel === 'critical')
            result.critical++

        else if (item.riskLevel === 'high')
            result.high++

        else if (item.riskLevel === 'medium')
            result.medium++

        else
            result.normal++

    })

    return result
})

const sortedCountries = computed(() => {

    const levelMap = {
        critical: 5,
        high: 4,
        medium: 3,
        low: 2,
        normal: 1
    }

    return [...countryList.value]
        .sort((a, b) => {
            return levelMap[b.riskLevel]
                - levelMap[a.riskLevel]
        })

})

const getTagType = (level) => {

    if (level === 'critical')
        return 'danger'

    if (level === 'high')
        return 'danger'

    if (level === 'medium')
        return 'warning'

    return 'success'
}

const getStatusIcon = (level) => {

    if (level === 'critical')
        return '🔴'

    if (level === 'high')
        return '🟠'

    if (level === 'medium')
        return '🟡'

    return '🟢'
}

const getImpactLabel = (scope) => {

    const map = {
        overfly: '影响飞越',
        departure: '影响起飞',
        arrival: '影响降落',
        airport: '影响机场',
        airspace: '影响空域'
    }

    return map[scope] || scope
}

const getOperationStatus = (level) => {

    const map = {
        critical: '禁止运行',
        high: '建议绕飞',
        medium: '加强监控',
        low: '正常运行',
        normal: '正常运行'
    }

    return map[level]
}

// const analyzeAllRisk = async (countries) => {
//     // return
//     const result =
//         await analyzeCountryRisk({
//             countries
//         })

//     return result.data
// }

const refreshAllRisk = async () => {

    loading.value = true

    try {
        const countries =
            countryList.value.map(
                item => item.country
            )
        console.log('countries', countries)

        const result =
            await analyzeCountryRisk({
                countries
            })
        // for (const item of countryList.value) {

        //     const result =
        //         await refreshCountryRisk(
        //             item.country
        //         )

        //     Object.assign(item, result)

        // }
        countryList.value =
            result.data
        console.log('countryListAft', countryList)

        lastUpdate.value =
            new Date().toLocaleString()

    } finally {

        loading.value = false

    }
}

const loadCountryData = async () => {
    const cache = await getCountryRiskCache()
    console.log('cache',cache)
    const res =
        await getCountryRules()

    countryList.value =
        res.data
    // return
    await refreshAllRisk()

    if (countryList.value.length) {

        currentCountry.value =
            countryList.value[0]

    }
}

onMounted(async () => {

    await loadCountryData()

    // 每30分钟自动刷新
    setInterval(() => {

        refreshAllRisk()

    }, 1000 * 60 * 30)

})

</script>

<style scoped>
body {
    margin: 0;
    background:
        radial-gradient(circle at top left,
            #162033,
            #0a0f18 55%);

    color: white;

    overflow: hidden;

    font-family:
        Inter,
        "PingFang SC",
        sans-serif;
}

.top-actions {

    display: flex;
    justify-content: space-between;
    align-items: center;

    margin-bottom: 18px;

    padding: 14px 20px;

    border-radius: 16px;

    background:
        rgba(16, 24, 38, 0.72);

    border:
        1px solid rgba(255, 255, 255, 0.08);

    backdrop-filter:
        blur(12px);

    box-shadow:
        0 0 30px rgba(0, 0, 0, 0.35);
}

.ai-status {

    display: flex;
    align-items: center;

    gap: 12px;

    font-size: 15px;

    color: #dbeafe;
}

.status-dot {

    width: 12px;
    height: 12px;

    border-radius: 50%;

    background: #00ffae;

    box-shadow:
        0 0 12px #00ffae;
}

.status-dot.running {

    animation:
        pulse 1.2s infinite;
}

@keyframes pulse {

    0% {
        opacity: .3;
        transform: scale(.9);
    }

    50% {
        opacity: 1;
        transform: scale(1.25);
    }

    100% {
        opacity: .3;
        transform: scale(.9);
    }
}

.glass-card {

    background:
        rgba(18, 25, 38, 0.72);

    backdrop-filter:
        blur(14px);

    border:
        1px solid rgba(255, 255, 255, 0.08);

    border-radius: 18px;

    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.45),
        inset 0 0 20px rgba(255, 255, 255, 0.03);

    transition: .25s;
}

.glass-card:hover {

    transform: translateY(-2px);

    border-color:
        rgba(0, 255, 255, 0.25);

    box-shadow:
        0 0 24px rgba(0, 255, 255, 0.12),
        0 12px 40px rgba(0, 0, 0, 0.5);
}

.dashboard {

    position: relative;

    height: 100vh;

    overflow: hidden;

    padding: 18px;

    color: white;

    background:
        radial-gradient(circle at top left,
            rgba(0, 180, 255, .18),
            transparent 25%),

        radial-gradient(circle at bottom right,
            rgba(0, 255, 170, .12),
            transparent 25%),

        linear-gradient(135deg,
            #08111f,
            #0b1220 40%,
            #09131f);
}

.dashboard::before {

    content: '';

    position: absolute;

    inset: 0;

    background-image:

        linear-gradient(rgba(255, 255, 255, 0.03) 1px,
            transparent 1px),

        linear-gradient(90deg,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px);

    background-size: 40px 40px;

    opacity: .18;

    pointer-events: none;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.title-area h1 {
    margin: 0;
    font-size: 28px;
}

.update-time {
    margin-top: 6px;
    color: #aaa;
}

.top-stats {
    display: flex;
    gap: 18px;
}

/* 卡片基础 */
.stat {
    position: relative;
    overflow: hidden;

    width: 160px;
    height: 110px;

    border-radius: 18px;

    background:
        linear-gradient(145deg,
            rgba(20, 30, 48, 0.95),
            rgba(12, 18, 30, 0.98));

    border: 1px solid rgba(255, 255, 255, 0.08);

    backdrop-filter: blur(10px);

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    transition: all .25s ease;

    box-shadow:
        0 0 0 rgba(0, 0, 0, 0),
        inset 0 0 25px rgba(255, 255, 255, 0.02),
        0 8px 30px rgba(0, 0, 0, 0.35);
}

/* 悬停动画 */
.stat:hover {
    transform: translateY(-4px) scale(1.02);

    box-shadow:
        0 0 18px rgba(0, 255, 255, 0.15),
        0 12px 40px rgba(0, 0, 0, 0.5);
}

/* 顶部发光线 */
.stat::before {
    content: '';

    position: absolute;
    top: 0;
    left: -50%;

    width: 200%;
    height: 2px;

    background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.9),
            transparent);

    animation: scanLine 4s linear infinite;
}

/* 科技网格背景 */
.stat::after {
    content: '';

    position: absolute;
    inset: 0;

    background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px,
            transparent 1px),
        linear-gradient(90deg,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px);

    background-size: 18px 18px;

    opacity: 0.25;

    pointer-events: none;
}

/* 数字 */
.stat .num {
    font-size: 40px;
    font-weight: 700;

    letter-spacing: 2px;

    z-index: 2;

    text-shadow:
        0 0 8px currentColor,
        0 0 20px currentColor;
}

/* 文字 */
.stat div:last-child {
    margin-top: 8px;

    font-size: 14px;

    letter-spacing: 1px;

    color: rgba(255, 255, 255, 0.75);

    z-index: 2;
}

/* 不同等级颜色 */

/* 禁止飞越 */
.stat.critical {
    border-color: rgba(255, 0, 60, 0.35);
}

.stat.critical .num {
    color: #ff2d55;
}

/* 高风险 */
.stat.high {
    border-color: rgba(255, 120, 0, 0.35);
}

.stat.high .num {
    color: #ff8c00;
}

/* 中风险 */
.stat.medium {
    border-color: rgba(255, 200, 0, 0.35);
}

.stat.medium .num {
    color: #ffd000;
}

/* 正常 */
.stat.normal {
    border-color: rgba(0, 255, 170, 0.35);
}

.stat.normal .num {
    color: #00ffb3;
}

/* 扫描动画 */
@keyframes scanLine {

    0% {
        transform: translateX(-30%);
    }

    100% {
        transform: translateX(30%);
    }
}

.main-layout {
    display: flex;
    height: calc(100vh - 120px);
    gap: 16px;
}

.left-panel {
    width: 320px;
    background: #111827;
    border-radius: 12px;
    padding: 12px;
    overflow: hidden;
}

.center-panel {
    flex: 1;
    overflow-y: auto;
}

.right-panel {
    width: 320px;
    background: #111827;
    border-radius: 12px;
    padding: 12px;
    overflow-y: auto;
}

.left-panel::before,
.center-panel::before,
.right-panel::before {

    content: '';

    position: absolute;

    top: 0;
    left: -100%;

    width: 200%;
    height: 2px;

    background:
        linear-gradient(90deg,
            transparent,
            rgba(0, 255, 255, .7),
            transparent);

    animation:
        scan 6s linear infinite;
}

@keyframes scan {

    0% {
        transform: translateX(-50%);
    }

    100% {
        transform: translateX(50%);
    }
}

.panel-title {
    font-size: 18px;
    margin-bottom: 16px;
    font-weight: bold;
}

.country-card {

    position: relative;

    overflow: hidden;

    background:
        rgba(20, 30, 48, 0.7);

    border:
        1px solid rgba(255, 255, 255, .05);

    border-radius: 16px;

    padding: 14px;

    margin-bottom: 14px;

    cursor: pointer;

    transition: .25s;

    backdrop-filter:
        blur(10px);
}

.country-card:hover {

    transform:
        translateY(-3px);

    border-color:
        rgba(0, 255, 255, .25);

    box-shadow:
        0 0 24px rgba(0, 255, 255, .12);
}

.country-card.critical {

    border-left:
        4px solid #ff2d55;

    box-shadow:
        0 0 18px rgba(255, 45, 85, .18);
}

.country-card.high {

    border-left:
        4px solid #ff8c00;

    box-shadow:
        0 0 18px rgba(255, 140, 0, .15);
}

.country-card.medium {

    border-left:
        4px solid #ffd000;

    box-shadow:
        0 0 18px rgba(255, 208, 0, .12);
}

.country-card.normal {

    border-left:
        4px solid #00ffb3;

    box-shadow:
        0 0 18px rgba(0, 255, 179, .12);
}

.country-header {
    display: flex;
    justify-content: space-between;
}

.country-name {
    font-weight: bold;
    font-size: 16px;
}

.country-tags {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.country-impact {
    margin-top: 10px;
    font-size: 13px;
    color: #aaa;
    display: flex;
    gap: 10px;
}

.info-card,
.section-card {

    background:
        rgba(18, 25, 38, 0.72) !important;

    border:
        1px solid rgba(255, 255, 255, .06);

    border-radius: 18px;

    backdrop-filter:
        blur(16px);

    color: white;

    box-shadow:
        0 8px 30px rgba(0, 0, 0, .35);

    overflow: hidden;
}

.info-title {
    color: #aaa;
    margin-bottom: 10px;
}

.risk-badge {
    font-size: 26px;
    font-weight: bold;
}

/* .section-card {
    margin-top: 16px;
    background: #111827;
    color: white;
} */

.summary {
    line-height: 1.8;
}

.airport-box,
.impact-box {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.dispatch-conclusion {
    font-size: 18px;
    line-height: 1.8;
    color: #ffd04b;
}

.timeline-title {
    margin-top: 24px;
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: bold;
}

.risk-badge {

    font-size: 38px;

    font-weight: 700;

    letter-spacing: 2px;

    text-transform: uppercase;

    text-shadow:
        0 0 10px currentColor,
        0 0 25px currentColor;
}

.risk-badge.critical {
    color: #ff2d55;
}

.risk-badge.high {
    color: #ff8c00;
}

.risk-badge.medium {
    color: #ffd000;
}

.risk-badge.normal {
    color: #00ffb3;
}

.summary {

    line-height: 1.9;

    font-size: 15px;

    color: rgba(255, 255, 255, .88);

    padding: 4px 2px;
}

.conclusion-card {

    border:
        1px solid rgba(255, 208, 0, .18);

    box-shadow:
        0 0 24px rgba(255, 208, 0, .08);
}

.dispatch-conclusion {

    font-size: 18px;

    line-height: 1.9;

    color: #ffd04b;

    font-weight: 600;

    text-shadow:
        0 0 12px rgba(255, 208, 0, .3);
}

.advice-card {

    margin-bottom: 12px;

    padding: 14px;

    border-radius: 14px;

    backdrop-filter:
        blur(10px);

    font-weight: 600;

    border:
        1px solid rgba(255, 255, 255, .08);

    background:
        rgba(255, 255, 255, .04);
}

.advice-card.warning {

    color: #ffb84d;

    box-shadow:
        0 0 18px rgba(255, 184, 77, .15);
}

.advice-card.danger {

    color: #ff5c7a;

    box-shadow:
        0 0 18px rgba(255, 92, 122, .15);
}
</style>