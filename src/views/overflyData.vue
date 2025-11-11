<template>
    <!-- <Searcher mode="overflyData" :list="overflyData" @update:result="filteredData = $event" /> -->

    <SeasonSelect v-model="curSeason" />
    <!-- <el-button @click="addOverflyData">新增飞越数据</el-button> -->
    <el-tabs v-model="clickCountry" @tab-click="changeCountry">
        <el-tab-pane v-for="(ovfData, index) in overflyData" :key="index">
            <template #label>
                <span>
                    {{ ovfData.country }}

                </span>
            </template>
            <div v-if="clickCountry === String(index)">
                <div v-if="seasonDataMap[ovfData.country]">
                    <overflyDataView :mode="'forever'" :editShow="true"
                        :overflyDataFromFather="seasonDataMap[ovfData.country]" :allData="ovfData"
                        :curSeason="curSeason" :countryData="selectCountryData" @updateFinish="refreshOverflyData" />

                </div>
                <div v-else class="text-gray-500">
                    暂无{{ curSeason }}航季数据
                </div>
            </div>


        </el-tab-pane>
    </el-tabs>

</template>

<script setup>
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, getOverflyData, updateRoutes } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SeasonSelect from '../utils/seasonSelect.vue'
import Searcher from '../utils/searcher.vue'

import { currentSeasonData } from '../utils/season.js'
import overflyDataView from '../utils/overflyDataView.vue'
import { useRoute } from 'vue-router';
import { onBeforeRouteUpdate } from 'vue-router';
import AddRouteTool from '../utils/addRouteTool.vue'
import { mergeNewOverflyData } from '../utils/fileParser.js'
import { useRouter } from 'vue-router'
// import { defineStore } from 'pinia'
import { useOverflyStore } from '../store/overfly.js'
import { parseOverflyData, mergeRouteWithOverflyData } from '../utils/fileParser.js'; // 引入解析文件的工具函数
import { useLoading } from '../plugins/loading'
import { useSeasonData } from '../components/useSeasonUtils'

const { todaySeason } = useSeasonData()
// 
const loading = useLoading()
const clickCountry = ref()
const curCountry = ref()
const router = useRouter()
const route = useRoute();
const overflyData = ref(null)
const routesData = ref(null)
const countryData = ref(null)
const filteredOverfly = ref(null)
const curSeason = ref(null)
const findData = ref(null)
const selectCountryData = ref()
const getSeasonData = (countryData) => {
    if (!countryData || !curSeason.value) return null;

    // countryData.data 是 [{ season: '2025S1', data: [...] }, ...]
    const seasonData = countryData.data.find(item => item.season === curSeason.value);
    // console.log('seasonData', seasonData)
    return seasonData?.data || null;
}
const seasonDataMap = computed(() => {
    const map = {}
    if (!overflyData.value || !curSeason.value) return map
    overflyData.value.forEach(country => {
        const found = country.data.find(d => d.season === curSeason.value)
        map[country.country] = found ? found.data : null
    })
    return map
})
const changeCountry = (country) => {
    const index = clickCountry.value
    const selectedItem = overflyData.value[index]
    curCountry.value = selectedItem.country;
    selectCountryData.value = countryData.value.find(item => item.country == selectedItem.country)
    console.log('点击后的country', selectedItem)
    console.log('selectCountryData', selectCountryData.value)

    //当前国家申请数据
    // curCountry.value = selectedItem.overflyCountry


    console.log('切换后的国家', curCountry.value)
}
const initData = async () => {
    try {
        loading.show('加载飞越航路数据')
        const routeResponse = await getRoutes();
        routesData.value = routeResponse.data;

        const countryResponse = await getCountryRules();
        countryData.value = countryResponse.data;
        const overflyResponse = await getOverflyData();
        overflyData.value = overflyResponse.data;
        clickCountry.value = '0'
        const selectedItem = overflyData.value[clickCountry.value]
        curCountry.value = selectedItem.country;
        selectCountryData.value = countryData.value.find(item => item.country == selectedItem.country)
        const initOvfData = overflyData.value.find(item => item.country == selectedItem.country)
        curSeason.value = todaySeason.value.en
        console.log('initOvfData', initOvfData)
        console.log('curSeason', curSeason.value)
        getSeasonData(initOvfData)
        loading.hide()
        console.log('数据初始化完成', { routesData, countryData, overflyData, curCountry });
    } catch (error) {
        console.error('API error:', error);
    }
};
const overflyStore = useOverflyStore()
const mergedRoutes = ref()
const updatedRouteIds = new Set()

const refreshOverflyData = async () => {
    loading.show('加载飞越航路数据')

    const overflyResponse = await getOverflyData()
    overflyData.value = overflyResponse.data
    const routeResponse = await getRoutes()
    // console.log('overflyData.value ', overflyData.value)
    console.log('routeResponse', routeResponse.data)
    const { routes: updatedRoutes, updatedRouteIds } = updateRoutesWithOverflyData(routeResponse.data, overflyData.value, curCountry.value, curSeason.value)

    mergedRoutes.value = updatedRoutes
    console.log('mergedRoutes', mergedRoutes.value)
    console.log('updatedRouteIds', updatedRouteIds)
    const payload = mergedRoutes.value
        .filter(r => updatedRouteIds.includes(r.route_id))
        .map(r => ({
            route_id: r.route_id,
            departure: r.departure,
            arrival: r.arrival,
            ATSroute: r.ATSroute || null,
            sector: r.sector || null,
            routeCode: JSON.stringify(r.routeCode || []), // 如果是数组，转 JSON
            overflyCountry: JSON.stringify(r.overflyCountry || []), // ✅ 必须转 JSON
            season: r.season
        }))
    console.log('payload', payload)
    const updateResponse = await updateRoutes(payload)
    console.log('updateResponse', updateResponse)

    // 正确写法
    overflyStore.setNeedRefresh(true)
    console.log('overflyStore', overflyStore.needRefresh) // true
    loading.hide()
}

const updateRoutesWithOverflyData = (routes, overflyData, targetCountry, curSeason) => {
    // 找到目标国家的数据
    // console.log('overflyData', overflyData)

    console.log('overflyData', overflyData)
    console.log('targetCountry', targetCountry)

    const countryObj = overflyData.find(item => item.country === targetCountry)
    console.log('countryObj', countryObj)

    if (!countryObj) return { routes, updatedRouteIds: [] }

    // 找到目标赛季的数据
    const seasonObj = countryObj.data.find(d => d.season === curSeason)
    console.log('seasonObj', seasonObj)

    if (!seasonObj) return { routes, updatedRouteIds: [] }

    // 提取更新内容
    const targetUpdateData = seasonObj.data || []
    console.log('targetUpdateData', targetUpdateData)
    // 遍历所有航线，更新 overflyCountry
    routes.forEach(route => {
        if (!Array.isArray(route.overflyCountry)) return

        const matchedCountry = route.overflyCountry.find(c => c.country === targetCountry)
        if (matchedCountry) {
            matchedCountry.overflyDetails = targetUpdateData
            matchedCountry.season = curSeason
            if (route.route_id) {
                updatedRouteIds.add(route.route_id) // ✅ 记录被修改的 route_id
            }
        }
    })

    return { routes, updatedRouteIds: Array.from(updatedRouteIds) }
}
// const updateRoutesForCountry = (routes, countryItem) => {
//   const { country, data } = countryItem

//   routes.forEach(route => {
//     if (!Array.isArray(route.overflyCountry)) return

//     const matchedCountry = route.overflyCountry.find(c => c.country === country)
//     if (matchedCountry) {
//       matchedCountry.overflyDetails = data[0]?.data || []
//       matchedCountry.season = data[0]?.season || matchedCountry.season
//     }
//   })

//   return routes
// }

// const updateRoutesWithOverflyData = (routes, overflyData) => {
//     // 遍历所有国家的数据
//     const targetUpdateCountry = curCountry.value
//     const targetUpdateData = overflyData.find(item => item.country == targetUpdateCountry).data.find(i => i.season == curSeason.value)


//     // 遍历所有航线
//     routes.forEach(route => {
//         if (!Array.isArray(route.overflyCountry)) return

//         // 找出这个 route 里包含的 overflyCountry
//         const matchedCountry = route.overflyCountry.find(c => c.country === targetUpdateCountry)
//         if (matchedCountry) {
//             // 更新这个国家的 overflyDetails
//             matchedCountry.overflyDetails = targetUpdateData
//             matchedCountry.season = data[0]?.season || matchedCountry.season
//         }
//     })


//     return routes
// }
// 首次挂载
onMounted(() => {
    initData();
});

// 路由切换时重新加载
onBeforeRouteUpdate((to, from) => {
    console.log('路由复用更新:', from.fullPath, '->', to.fullPath);

    initData(); // 路由切换时重新加载数据
});

</script>
<style lang="scss">
.el-tabs__nav {
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
    /* 隐藏滚动条 (Firefox) */
}

.el-tabs__nav::-webkit-scrollbar {
    display: none;
    /* 隐藏滚动条 (Chrome/Safari) */
}
</style>