<template>
    <el-tabs v-model="selectProcessed" @click="handleClick" type="border-card">
        <el-tab-pane label="未处理" name="no"></el-tab-pane>
        <el-tab-pane label="已处理" name="yes"></el-tab-pane>

    </el-tabs>
    <el-segmented v-model="selectType" :options="typeOptions" @change="changeType">

    </el-segmented>
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">

        <el-button @click="changeView">
            {{ viewType === 'card' ? '切换到表格视图' : '切换到卡片视图' }}
        </el-button>
    </div>
    <template v-if="viewType === 'card'">
        <infoCard :data="filterData" @updateInfo="updateInfoCenter" />

    </template>
    <template v-else>
        <el-table :data="filterData" border>
            <el-table-column label="标志">

                <template #default="{ row }">
                    <el-tag>{{ row.title }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="事件">
                <template #default="{ row }">
                    {{ row.message.text }}
                </template>
            </el-table-column>

            <el-table-column label="类型" width="100">
                <template #default="{ row }">
                    <el-tag>{{ row.type }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="内容">
                <template #default="{ row }">
                    <div v-for="detail in row.message.detail" :key="detail.index">
                        <div v-for="c in detail.changes" :key="c.index">
                            <div v-for="item in c.newValue" :key="item.index">
                                <div v-for="key in flightShowFields" :key="key.index">
                                    <b>{{ key }}:</b> {{ item[key] }}
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="状态" width="120">
                <template #default="{ row }">
                    <el-tag :type="row.processed === 'yes' ? 'success' : 'danger'">
                        {{ row.processed === 'yes' ? '已处理' : '未处理' }}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                    {{ formatTime(row.createTime) }}
                </template>
            </el-table-column>
        </el-table>
    </template>
    <!-- <el-table :data="filterData">
        <el-table-column label="创建时间">
            <template #default="{ row }">
                {{ row.createTime }}
            </template>
        </el-table-column>

    </el-table> -->
    <el-empty v-if="!filterData" description="暂无相关信息">

    </el-empty>
</template>
<script setup>
import { ref, watch, onMounted, computed, toRaw } from 'vue'
import { getInfoCenter, addInfoCenter } from '../api.js'
import infoCard from '../components/infoCard.vue'
import dayjs from 'dayjs'
const formatTime = t => dayjs(t).format("YYYY-MM-DD HH:mm")

const selectProcessed = ref('no')
const infoCenter = ref()
const filterData = ref()
const selectType = ref('all')
const viewType = ref('card')
const typeOptions = [{ label: '全部', value: 'all' }, { label: '筛选航班', value: 'flight' },
{ label: '筛选飞越', value: 'overfly' },]
const flightShowFields = [
    'flightNumber',
    'departure',
    'arrival',
    'startDate',
    'endDate'
]
const changeType = () => {
    filterDataFromSelect()
}

const changeView = () => {
    viewType.value = viewType.value === 'card' ? 'table' : 'card'
}
const handleClick = (tab, event) => {
    console.log(tab, event)
    console.log(selectProcessed)
    filterDataFromSelect()
}
const filterDataFromSelect = () => {
    filterData.value = infoCenter.value.filter(i => i.processed == selectProcessed.value)
    if (selectType.value !== 'all') {
        filterData.value = filterData.value.filter(i => i.type == selectType.value)
    }
    console.log('filterData', filterData.value)

}
const initData = async () => {
    const infoCenterResponse = await getInfoCenter()
    infoCenter.value = infoCenterResponse.data
    filterDataFromSelect()
    console.log('infoCenter', infoCenter.value)

}
const updateInfoCenter = () => {
    initData()
}

onMounted(() => {
    initData();
});
</script>
