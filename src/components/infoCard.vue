<template>
    <div style="margin-bottom: 12px;">
        <el-button v-if="unprocessedCount > 0" type="success" @click="batchProcessInfo"
            :disabled="unprocessedCount === 0">
            批量处理未处理消息 ({{ unprocessedCount }})
        </el-button>
    </div>

    <el-card v-for="i in infoData" :key="i.id" class="infoCard" shadow="hover">

        <!-- Header -->
        <template #header>
            <div class="header-box">
                <span class="title">{{ i.title || '消息' }}</span>
                <el-tag :type="i.processed == 'yes' ? 'success' : 'danger'">
                    {{ i.processed == 'yes' ? '已处理' : '未处理' }}
                </el-tag>
                <el-tag type="info" class="grey-tag">{{ i.type }}</el-tag>
                <span class="time">{{ formatTime(i.createTime) }}</span>
            </div>
        </template>

        <!-- Summary block -->
        <div class="summary">
            {{ i.message.text }}
        </div>

        <!-- Detail block -->
        <div class="detail">
            <el-timeline reverse>
                <el-timeline-item v-for="d in i.message.detail" :key="d.index"
                    :color="d.action === 'update' ? '#409EFF' : '#E6A23C'">
                    <el-tag size="small" type="primary">{{ d.action }}</el-tag>
                    <el-tag v-if="d?.routeCode" size="small" type="primary">{{ d.sector }}</el-tag>
                    <div v-if="d?.routeCode">
                        <el-tag size="small" type="info" v-for="k in d.routeCode" :key="k.index">{{ k }}</el-tag>

                    </div>
                    <div class="row-change" v-for="k in d.changes" :key="k.index">

                        <span>{{ d.action == 'update' ? '更新了' : '增加了' }}<b>{{ k.field }}</b></span>


                        <span class="new" v-if="d.action == 'update'">{{ k.oldValue ? k.oldValue : '空' }}</span>

                        <span class="arrow" v-if="d.action == 'update'">→</span>
                        <div v-if="d.action == 'update'">
                            <span class="new">{{ k.newValue }}</span>
                        </div>
                        <div v-if="d.action == 'add'">
                            <div v-for="s in k.newValue" :key="s.index">
                                <span class="new">{{ s.flightNumber }}</span>
                                <el-tag>开始日期:{{ s.startDate }}</el-tag>
                                <div>
                                    {{ calculateProgress(s.startDate, i.createTime) }}
                                </div>
                            </div>

                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
        </div>

        <!-- Footer -->
        <template #footer>
            <el-button type="danger" @click="deleteInfo(i.id)" :disabled="i.processed == 'yes'">
                删除
            </el-button>

            <el-button :type="i.processed == 'yes' ? 'info' : 'primary'" @click="processInfo(i.id)"
                :disabled="i.processed == 'yes'">
                {{ i.processed == 'yes' ? '已处理完成' : '处理' }}
            </el-button>
        </template>

    </el-card>
</template>

<script setup>
import { ref, watch, onMounted, computed, toRaw } from 'vue'
import { getInfoCenter, addInfoCenter, deleteInfoByIds, updateInfo, updateInfoBatch } from '../api.js'
import dayjs from 'dayjs'
const progressLength = ref('')
const emit = defineEmits(['updateInfo'])
const unprocessedCount = computed(() => {
    if (!infoData.value) return 0;
    return infoData.value.filter(i => i.processed !== 'yes').length;
});
function parseDate(d) {
    if (!d) return null;

    // ISO 字符串直接返回
    if (!isNaN(Date.parse(d))) {
        return new Date(d);
    }

    // 手动解析，如 "2026/2/5 0:0"
    const parts = d.replace(/\//g, '-').split(' ');
    const [year, month, day] = parts[0].split('-').map(Number);
    const [hour = 0, minute = 0] = parts[1]?.split(':').map(Number) ?? [];

    return new Date(year, month - 1, day, hour, minute);
}
const calculateProgress = (s, e) => {
    const start = parseDate(s);
    const end = parseDate(e);
    progressLength.value = e - s
    const diff = end - start; // 毫秒差
    const diffDays = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));

    console.log('时长(ms):', diffDays);
    return diffDays
}
const batchProcessInfo = async () => {
    if (!infoData.value) return;

    const unprocessed = infoData.value.filter(i => i.processed !== 'yes');

    if (unprocessed.length === 0) return;

    // 准备批量请求数据
    const payload = unprocessed.map(i => ({ id: i.id, processed: 'yes', updateTime: new Date().toISOString() }));

    try {
        await updateInfoBatch(payload); // 调用批量更新接口


        ElMessage.success(`成功处理 ${unprocessed.length} 条消息`);
        emit('updateInfo');
    } catch (err) {
        console.error(err);
        ElMessage.error('批量处理失败');
    }
};
const colMaps = {
    flight: [
        'departure',
        'arrival',
        'flightNumber',
        'departureTime',
        'arrivalTime',
        'days',
        'startDate',
        'endDate',
        'attribution',
    ],

}
const columns = {
    flight: [
        { prop: 'season', label: '航季' },
        { prop: 'attribution', label: '性质' },
        { prop: 'flightNumber', label: '航班号' },
        { prop: 'aircraftType', label: '机型' },
        { prop: 'days', label: '班期' },
        { prop: 'departure', label: '起飞机场' },
        { prop: 'departureTime', label: '起飞时间' },
        { prop: 'arrival', label: '落地机场' },
        { prop: 'arrivalTime', label: '落地时间' },
        { prop: 'action', label: '' },

    ],
    overfly: [
        { prop: 'action', label: '' },
        { prop: 'routeCode', label: '航路代码' },
        { prop: 'sector', label: '航段' },
        { prop: 'change', label: '具体内容' },

    ],

}

const fieldLabelMap = {
    routeCode: "航路代码",
    ATSroute: "境内航路",
    entryPoint: "入境点",
    exitPoint: "出境点",
    EET: "EET",
    entryTime: "入境时间",
    exitTime: "出境时间",
    flightLevel: "高度",
    speed: "速度",
    season: "航季",
    sector: "航段",
    altEntryPoint: '备用入境点',
    altExitPoint: '备用出境点',
    actualEntryTime: '实际入境时间',
    actualExitTime: '实际出境时间',
    departure: '起飞机场',
    arrival: '落地机场',
    flightNumber: '航班号',
    departureTime: '起飞时间',
    arrivalTime: '落地时间',
    days: '周期',
    startDate: '开始时间',
    endDate: '结束时间',
    attribution: '航班性质',
};
const props = defineProps({
    data: Array,

})
const deleteInfo = async (id) => {
    // const deleteIds = []
    // deleteIds.push(id)

    // console.log('deleteIds',deleteIds)
    // await deleteInfoByIds(deleteIds)
    await deleteInfoByIds([id])
    emit('updateInfo')
}
const processInfo = async (id) => {
    const curInfo = infoData.value.find(i => i.id == id)
    console.log('curInfo', curInfo)
    curInfo.processed = 'yes'
    curInfo.updateTime = new Date().toISOString()
    // return
    await updateInfo(curInfo)
    emit('updateInfo')
}
const infoData = ref()
watch(() => props.data, (val) => {
    infoData.value = val
    console.log('infoData', infoData.value)
},
    { immediate: true })
const formatTime = (t) => dayjs(t).format("YYYY-MM-DD HH:mm");
</script>
<style lang="scss">
// .infoCard {
//     width: 95%;
//     max-height: 250px;
//     border-radius: 20px;
//     margin: auto;
//     margin-top: 20px;

// }
.infoCard {
    width: 95%;
    margin: auto;
    margin-bottom: 16px;
}

.header-box {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title {
    font-size: 18px;
    font-weight: bold;
}

.grey-tag {
    opacity: 0.7;
}

.time {
    margin-left: auto;
    font-size: 12px;
    color: #888;
}

.summary {
    font-size: 14px;
    margin-bottom: 8px;
    padding: 6px 0;
}

.detail {
    max-height: 160px;
    overflow-y: auto;
    padding: 4px 0;
    border-left: 3px solid #f0f2f5;
}

.row-change {
    font-size: 14px;
    display: flex;
    gap: 6px;
    align-items: center;
}

.arrow {
    color: #999;
}

.new {
    color: #409EFF;
    font-weight: 600;
}
</style>