<template>
    <el-dialog
        v-model="visible"
        title="任务预览"
        width="80%"
        destroy-on-close
    >
        <!-- 顶部概览 -->
        <el-card shadow="never" class="summary-card">

            <el-row :gutter="20">

                <el-col :span="10">
                    <div class="label">任务名称</div>

                    <el-input
                        v-model="curTaskNameInput"
                        placeholder="请输入任务名称"
                    />
                </el-col>

                <el-col :span="4">
                    <div class="label">申请类型</div>

                    <el-tag
                        :type="
                            curTaskAttrInput === 'Scheduled'
                                ? 'success'
                                : 'warning'
                        "
                    >
                        {{ curTaskAttrInput === 'Scheduled'
                            ? '定期申请'
                            : '非定期申请'
                        }}
                    </el-tag>
                </el-col>

                <el-col :span="4">
                    <div class="label">航季</div>

                    <el-tag>
                        {{ curTaskSeason }}
                    </el-tag>
                </el-col>

                <el-col :span="3">
                    <div class="label">国家数</div>

                    <el-statistic
                        :value="taskList.length"
                    />
                </el-col>

                <el-col :span="3">
                    <div class="label">航班数</div>

                    <el-statistic
                        :value="totalFlights"
                    />
                </el-col>

            </el-row>

        </el-card>

        <div style="height:20px" />

        <!-- 国家列表 -->
        <el-collapse>

            <el-collapse-item
                v-for="item in taskList"
                :key="item.overflyCountry"
                :name="item.overflyCountry"
            >

                <template #title>

                    <div class="country-header">

                        <div>
                            🌏 {{ item.overflyCountry }}
                        </div>

                        <div>

                            <el-tag
                                size="small"
                                class="mr-1"
                            >
                                {{ item.flightList?.length || 0 }}
                                个航班
                            </el-tag>

                            <el-tag
                                size="small"
                                type="success"
                            >
                                {{ item.overflyDetails?.length || 0 }}
                                条航路
                            </el-tag>

                        </div>

                    </div>

                </template>

                <!-- 国家详情 -->
                <el-tabs>

                    <!-- 航班 -->
                    <el-tab-pane label="航班信息">

                        <el-card
                            v-for="flight in item.flightList"
                            :key="
                                `${flight.flightNumber}-${flight.departure}-${flight.arrival}`
                            "
                            class="mb-3"
                            shadow="hover"
                        >

                            <el-descriptions
                                :column="4"
                                border
                            >

                                <el-descriptions-item label="航班号">
                                    {{ flight.flightNumber }}
                                </el-descriptions-item>

                                <el-descriptions-item label="性质">
                                    {{ flight.attribution }}
                                </el-descriptions-item>

                                <el-descriptions-item label="机型">
                                    {{ flight.aircraftType }}
                                </el-descriptions-item>

                                <el-descriptions-item label="周期">
                                    {{
                                        Array.isArray(flight.days)
                                            ? flight.days.join('')
                                            : flight.days
                                    }}
                                </el-descriptions-item>

                                <el-descriptions-item label="起飞机场">
                                    {{ flight.departure }}
                                </el-descriptions-item>

                                <el-descriptions-item label="起飞时间">
                                    {{ flight.departureTime }}
                                </el-descriptions-item>

                                <el-descriptions-item label="到达机场">
                                    {{ flight.arrival }}
                                </el-descriptions-item>

                                <el-descriptions-item label="到达时间">
                                    {{ flight.arrivalTime }}
                                </el-descriptions-item>

                                <el-descriptions-item label="开始日期">
                                    {{ flight.startDate }}
                                </el-descriptions-item>

                                <el-descriptions-item label="结束日期">
                                    {{ flight.endDate }}
                                </el-descriptions-item>

                            </el-descriptions>

                        </el-card>

                    </el-tab-pane>

                    <!-- 飞越详情 -->
                    <el-tab-pane label="飞越详情">

                        <overflyDataView
                            :overfly-data-from-father="
                                item.overflyDetails
                            "
                        />

                    </el-tab-pane>

                </el-tabs>

            </el-collapse-item>

        </el-collapse>

        <!-- 底部 -->
        <template #footer>

            <div class="footer-bar">

                <div>

                    <el-tag>
                        国家：
                        {{ taskList.length }}
                    </el-tag>

                    <el-tag
                        type="success"
                        class="ml-2"
                    >
                        航班：
                        {{ totalFlights }}
                    </el-tag>

                </div>

                <div>

                    <el-button
                        @click="visible = false"
                    >
                        取消
                    </el-button>

                    <el-button
                        type="primary"
                        @click="handleSubmit"
                    >
                        创建任务
                    </el-button>

                </div>

            </div>

        </template>

    </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import overflyDataView from '@/utils/overflyDataView.vue'

import {
    generateTaskAttribution,
    generateTaskSeason,
    generateDefaultTaskName
} from '../composables/buildTaskData'

const visible = defineModel('visible')

const props = defineProps({
    taskList: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits([
    'submit'
])

const curTaskAttrInput = ref('')
const curTaskSeason = ref('')
const curTaskNameInput = ref('')

const totalFlights = computed(() => {
    return props.taskList.reduce(
        (sum, item) =>
            sum + (item.flightList?.length || 0),
        0
    )
})

watch(
    visible,
    (val) => {

        if (!val) return

        curTaskAttrInput.value =
            generateTaskAttribution(props.taskList)

        curTaskSeason.value =
            generateTaskSeason(props.taskList)

        curTaskNameInput.value =
            generateDefaultTaskName(
                props.taskList,
                curTaskAttrInput.value
            )
    }
)

const handleSubmit = () => {

    emit('submit', {
        taskName: curTaskNameInput.value,
        taskList: props.taskList,
        attribution: curTaskAttrInput.value,
        season: curTaskSeason.value
    })
}
</script>

<style scoped>
.summary-card {
    margin-bottom: 12px;
}

.label {
    margin-bottom: 8px;
    color: #909399;
    font-size: 13px;
}

.country-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 20px;
}

.footer-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mb-3 {
    margin-bottom: 12px;
}

.ml-2 {
    margin-left: 8px;
}

.mr-1 {
    margin-right: 4px;
}
</style>