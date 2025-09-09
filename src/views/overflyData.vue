<template>
    <SeasonSelect v-model="curSeason" />
    <el-button @click="addOverflyData">新增飞越数据</el-button>
    <el-tabs>
        <el-tab-pane v-for="(ovfData, index) in overflyData" :key="index">
            <template #label>
                <span>
                    {{ ovfData.country }}

                </span>
            </template>
            <div v-if="getSeasonData(ovfData)">
                <overflyDataView :overflyDataFromFather="getSeasonData(ovfData)" :allData="ovfData"
                    :curSeason="curSeason" @updateFinish="refreshOverflyData" />

            </div>
            <div v-else class="text-gray-500">
                暂无{{ curSeason }}航季数据
            </div>

        </el-tab-pane>
    </el-tabs>

</template>

<script setup>
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, getOverflyData } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SeasonSelect from '../utils/seasonSelect.vue'
import { currentSeasonData } from '../utils/season.js'
import overflyDataView from '../utils/overflyDataView.vue'
import { useRoute } from 'vue-router';
import { onBeforeRouteUpdate } from 'vue-router';
import AddRouteTool from '../utils/addRouteTool.vue'
import {mergeNewOverflyData} from '../utils/fileParser.js'
const route = useRoute();
const overflyData = ref(null)
const routesData = ref(null)
const countryData = ref(null)
const filteredOverfly = ref(null)
const curSeason = ref(null)
const findData = ref(null)
const getSeasonData = (countryData) => {
    if (!countryData || !curSeason.value) return null;

    // countryData.data 是 [{ season: '2025S1', data: [...] }, ...]
    const seasonData = countryData.data.find(item => item.season === curSeason.value);
    // console.log('seasonData', seasonData)
    return seasonData?.data || null;
}

const initData = async () => {
    try {
        const routeResponse = await getRoutes();
        routesData.value = routeResponse.data;

        const countryResponse = await getCountryRules();
        countryData.value = countryResponse.data;

        const overflyResponse = await getOverflyData();
        overflyData.value = overflyResponse.data;

        console.log('数据初始化完成', { routesData, countryData, overflyData });
    } catch (error) {
        console.error('API error:', error);
    }
};
const refreshOverflyData = async () => {
    const mergeNewResponse = mergeNewOverflyData()
    console.log('mergeNewResponse',mergeNewResponse)
    const overflyResponse = await getOverflyData();
    console.log('执行更新',overflyResponse)

    overflyData.value = overflyResponse.data;
}
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