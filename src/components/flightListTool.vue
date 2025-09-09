<template>
    <Searcher mode="flight" :list="parentFlights" @update:result="filteredFlights = $event" />
    <el-Segmented v-model="timeMode" :options="timeModeOptions">

    </el-Segmented>
    <div style="display: flex; justify-content: left; align-items: center;height: 50px;margin-left: 50px;">
        <el-button type="warning" @click="showApplyRequired">
            {{ hideRight ? '隐藏需申请航班' : '显示需申请航班' }}
        </el-button>
        <el-button :icon="Plus" @click="addFlightData">新增航班</el-button>
        <el-button type="danger" @click="confirmBatchDelete" :disabled="multipleSelection.length === 0">
            批量删除
        </el-button>
        <el-button :icon="Plus" type="success" @click="transferToTaskdata(multipleSelection)"
            :disabled="multipleSelection.length === 0">申请选择的航班</el-button>

    </div>
    <div style="display: flex; height: 100vh;">
        <div style="flex: 3; padding: 10px; border-right: 1px solid #ccc; overflow: auto;">
            <!-- <template #first> -->
            <h3>所有航班({{ filteredFlights.length }}个航班)</h3>
            <el-table :data="filteredFlights" @selection-change="handleSelectionChange">
                <el-table-column type="expand">
                    <template #default="{ row }">
                        <div class="expand-content">

                            <h4>航路详情</h4>
                            <el-tabs>
                                <el-tab-pane v-for="(route, index) in row.matchingRoutes" :key="index">
                                    <template #label>
                                        <span>
                                            {{ route.routeCode }}
                                            <el-tag v-if="route.isValid == true" type="success" size="small"
                                                effect="plain">可使用</el-tag>
                                            <el-tag v-if="route.isValid == false & route.taskKeys?.length"
                                                type="warning" size="small" effect="plain"
                                                @click="openTaskDialog(route.taskKeys)">正在申请</el-tag>
                                            <el-tag v-if="route.isValid == false & route.taskKeys?.length == 0"
                                                type="danger" size="small" effect="plain">未申请</el-tag>
                                        </span>
                                    </template>
                                    <div>{{ route.ATSroute }}</div>
                                    <div>
                                        <el-segmented v-model="curCountryUnderRoute"
                                            :options="generateSegmentedOptions(route, row)"
                                            @change="val => showOverflyDetail(route, val)"
                                            @click="checkClickCountry()" />

                                    </div>
                                    <div v-if="curClickCountryDetails">
                                        <h4>飞越航路详情</h4>

                                        <overflyDataView
                                            :overflyDataFromFather="curClickCountryDetails.overflyDetails" />
                                    </div>


                                </el-tab-pane>
                            </el-tabs>
                            <!-- <div>{{ filterRoute(row.departure, row.arrival) }}</div> -->


                            <h4>燃油信息</h4>
                            <el-descriptions v-if="row.fuel_detail" :column="2" border>
                                <el-descriptions-item label="合同名称">{{ row.fuel_detail.name }}</el-descriptions-item>
                                <el-descriptions-item label="开始日期">{{ row.fuel_detail.startDate
                                }}</el-descriptions-item>
                                <el-descriptions-item label="结束日期">{{ row.fuel_detail.endDate
                                }}</el-descriptions-item>
                                <el-descriptions-item label="关联机场">{{ row.fuel_detail.relateAirport
                                }}</el-descriptions-item>
                            </el-descriptions>
                            <el-empty v-else description="未查到相关合同" :image-size="50">
                                <!-- <el-button type="primary">查看关联度最大合同</el-button> -->
                            </el-empty>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column type="selection" width="55" />

                <el-table-column label="航季">
                    <template #default="{ row }">
                        <div>{{ row.season }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="attribution" label="性质">
                    <template #default="{ row }">
                        <div>{{ row.attribution }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="flightNumber" label="航班号">
                    <template #default="{ row }">
                        <div>{{ row.flightNumber }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="departure" label="起飞机场">
                    <template #default="{ row }">
                        <div>{{ row.departure }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="departureTime" label="起飞时间">
                    <template #default="{ row }">
                        <div>{{ formatTimeFree(row.departureTime, row.departure) }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="arrival" label="起飞机场">
                    <template #default="{ row }">
                        <div>{{ row.arrival }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="arrivalTime" label="落地时间">
                    <template #default="{ row }">
                        <div>{{ formatTimeFree(row.arrivalTime, row.arrival) }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="arrivalTime" label="开始时间">
                    <template #default="{ row }">
                        <div>{{ row.startDate }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="arrivalTime" label="结束时间">
                    <template #default="{ row }">
                        <div>{{ row.endDate }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="days" label="班期">
                    <template #default="{ row }">

                        <div class="days-container">
                            <el-tag v-for="(day, index) in daysOfWeek" :key="index" :class="{
                                'day-tag': true,
                                'normal-tag': isDayInSchedule(row.days, index + 1),
                                'disabled-tag': !isDayInSchedule(row.days, index + 1),
                                'today-tag': isToday(index + 1)
                            }" :style="isToday(index + 1) ? { border: '1px solid orange' } : {}">
                                {{ day }}
                            </el-tag>

                        </div>

                    </template>

                </el-table-column>
                <el-table-column label="机型">
                    <template #default="{ row }">
                        <el-tooltip effect="light" placement="top">
                            <template #content>
                                <div v-if="aircraftTypes[row.aircraftType]">
                                    <p>制造商: {{ aircraftTypes[row.aircraftType].manufacturer }}</p>
                                    <p>座位数: {{ aircraftTypes[row.aircraftType].seats }}</p>
                                    <p>航程: {{ aircraftTypes[row.aircraftType].range }} km</p>
                                </div>
                                <div v-else>未知机型</div>
                            </template>
                            <span>{{ row.aircraftType }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.createTime) }}
                        <!-- <daysPicker v-model="" /> -->
                    </template>
                </el-table-column>
                <!-- <el-table-column label="准备进度">
                    <template #default="{ row }">
                        <el-progress :percentage="calculateProgress(row)" :status="getProgressStatus(row)"
                            :text-inside="true" :stroke-width="20" />
                    </template>
                </el-table-column> -->
                <el-table-column fixed="right" label="Operations" min-width="120">
                    <!-- <template #default="{ row }">
                        <el-button link type="primary" size="small" @click="deleteFlight(row.flight_id)">
                            删除
                        </el-button>
                    </template> -->
                    <template #default="{ row }">
                        <el-button link type="primary" size="small" @click="editFlight(row)">
                            编辑/修改
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <addFlightTool v-model:visible="addFlightVisible" :isEditing="editFlightMode" @parsed="handleProcessData"
                :editData="editDataFromFather" :originData="parentFlights" />
            <el-dialog v-model="showDeleteFlight" title="删除航班" width="500" :before-close="handleClose">
                <span>是否删除该航班？</span>
                <template #footer>
                    <div class="dialog-footer">
                        <el-button @click="showDeleteFlight = false">取消</el-button>
                        <el-button type="primary" @click="confirmDeleteFlight">
                            确认
                        </el-button>
                    </div>
                </template>
            </el-dialog>
            <el-dialog v-model="taskDialogVisible" title="任务详情" width="600px" align-center
                :close-on-click-modal="false">
                <template #default>
                    <div v-if="taskInDialog.length">
                        <el-card shadow="hover" v-for="task in taskInDialog" :key="task.taskKey"
                            @click="navToTask(task.taskKey)">
                            <template #header>
                                <div class="flex justify-between items-center">
                                    <span><strong>任务号：</strong>{{ task.taskName }}</span>
                                    <el-tag type="success" size="small">已提交</el-tag>
                                </div>
                            </template>

                            <div>
                                <p><strong>更新日期：</strong>{{ task.updateTime }}</p>
                                <p><strong>航班数量：</strong>{{task.data.filter(d => d.flightList).length}}</p>
                                <p><strong>航路数量：</strong>{{task.data.filter(d => d.routeList).length}}</p>
                            </div>
                        </el-card>
                    </div>
                    <div v-else>
                        <el-empty description="暂无相关任务数据" />
                    </div>
                </template>
            </el-dialog>
            <!-- </template> -->

        </div>

        <div v-if="hideRight" style="flex: 2; padding: 10px; overflow: auto;">
            <!-- <template #second> -->
            <h3>需申请航班航路</h3>
            <!-- 提交按钮 -->
            <el-button type="primary" @click="createTask(applyRequired)" class="mt-4">
                创建任务
            </el-button>
            <div>
                <el-checkbox v-model="selectAll" @change="handleSelectAll" label="全选所有航班" class="mb-4" />
                <el-row :gutter="16" class="mb-4" v-for="flight in applyRequired" :key="flight.flightNumber">
                    <el-col :span="24">
                        <el-card shadow="hover">
                            <!-- 航班 header -->
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <el-checkbox v-model="selectedFlights" :label="flight.flightNumber"
                                        @change="handleFlightSelect(flight)">
                                        航班号：<strong>{{ flight.flightNumber }}</strong>
                                    </el-checkbox>
                                    <el-tag type="info" size="small">{{ flight.route.length }} 条未申请航路</el-tag>
                                </div>
                            </template>

                            <!-- 航路多选列表 -->
                            <el-checkbox-group v-model="selectedRoutes[flight.flightNumber]"
                                @change="() => handleRouteSelect(flight)" class="grid grid-cols-2 gap-4">
                                <el-card v-for="(item, idx) in flight.route" :key="idx" class="p-2" shadow="never"
                                    :body-style="{ padding: '10px 16px' }">
                                    <el-checkbox :label="item.routeCode" class="w-full left-align-container"
                                        style="min-height: 100px;">
                                        <div>
                                            <div class="left-align-container-text"><strong>航路代码：</strong>{{
                                                item.routeCode }}
                                            </div>
                                            <div class="left-align-container-text"><strong>航路走向：</strong>{{
                                                item.ATSroute }}
                                            </div>
                                            <div v-if="getOverflyCountryNames(item.overflyCountry).length"
                                                class="left-align-container-text">
                                                <strong>途经国家：</strong>
                                                <el-tag
                                                    v-for="(country, i) in getOverflyCountryNames(item.overflyCountry)"
                                                    :key="i" type="success" class="mr-1" size="small">
                                                    {{ country }}
                                                </el-tag>
                                            </div>
                                        </div>
                                    </el-checkbox>
                                </el-card>
                            </el-checkbox-group>
                        </el-card>
                    </el-col>
                </el-row>


                <el-dialog v-model="showCreateTask" title="任务详情" width="70%">
                    <el-scrollbar height="500px">
                        <div v-if="taskList.length > 0">
                            <el-card v-for="item in taskList" :key="item.overflyCountry" class="mb-4" shadow="hover"
                                body-style="{ padding: '20px' }">
                                <h4 class="text-lg font-bold">任务名字</h4>
                                <el-input v-model="curTaskNameInput" placeholder="请输入任务名字"></el-input>
                                <div class="flex items-center justify-between mb-2">
                                    <h4 class="text-lg font-bold">航季：</h4>
                                    <el-tag>{{ item.season }}</el-tag>
                                </div>
                                <div class="flex items-center justify-between mb-2">
                                    <h4 class="text-lg font-bold">国家/地区：{{ item.overflyCountry }}</h4>
                                    <el-tag type="info">{{ item.flightList.length }} 个航班 / {{ item.routeList.length }}
                                        条航路</el-tag>
                                </div>

                                <el-divider>航班列表</el-divider>
                                <el-table :data="item.flightList" size="small" border>
                                    <el-table-column prop="attribution" label="性质" />

                                    <el-table-column prop="flightNumber" label="航班号" />

                                    <el-table-column prop="flightNumber" label="航班号" />
                                    <el-table-column prop="departure" label="出发机场" />
                                    <el-table-column prop="arrival" label="到达机场" />
                                    <!-- <el-table-column prop="season" label="航季" /> -->
                                </el-table>

                                <el-divider>航路列表</el-divider>
                                <el-table :data="item.overflyDetails" size="small" border>
                                    <!-- <el-table-column prop="routeCode" label="航路代码" width="180" /> -->
                                    <el-table-column label="入境点">

                                        <template #default="{ row }">
                                            {{ row.entryPoint }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column prop="ATSroute" label="航路走向" />
                                    <el-table-column prop="exitPoint" label="出境点" />
                                </el-table>
                            </el-card>
                        </div>
                        <div v-else class="text-gray-500 text-center">暂无任务数据</div>
                    </el-scrollbar>
                    <el-button type="primary" @click="submitTaskToServer">确定</el-button>
                </el-dialog>

            </div>
            <!-- </template> -->

        </div>

    </div>
    <!-- 选择选中航班航路 ///////////////////////////////////////////////////////////////////////////////-->
    <el-dialog v-model="showChooseTaskVisible" width="80%">

        <h2>选择的航班</h2>
        <div>
            <el-checkbox v-model="selectAll" @change="handleSelectAll" label="全选所有航班" class="mb-4" />

            <el-row :gutter="16" class="mb-4" v-for="flight in taskNeedData" :key="flight">
                <el-col :span="24">
                    <flightCard :data="flight" :selected-flights="selectedFlights" :selected-routes="selectedRoutes"
                        :getOverflyCountryNames="getOverflyCountryNames" @update:flight="handleFlightSelect"
                        @update:routes="handleRouteSelect" />
                </el-col>
            </el-row>
            <el-button type="primary" @click="createTask(taskNeedData)" class="mt-4">
                创建任务
            </el-button>

            <el-dialog v-model="showCreateTask" title="任务详情" width="70%">
                <el-scrollbar height="500px">
                    <div v-if="taskList.length > 0">
                        <el-card v-for="item in taskList" :key="item.overflyCountry" class="mb-4" shadow="hover"
                            body-style="{ padding: '20px' }">
                            <h4 class="text-lg font-bold">任务名字</h4>
                            <el-input v-model="curTaskNameInput" placeholder="请输入任务名字"></el-input>
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-lg font-bold">航季：</h4>
                                <el-tag>{{ item.season }}</el-tag>
                            </div>
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-lg font-bold">国家/地区：{{ item.overflyCountry }}</h4>
                                <el-tag type="info">{{ item.flightList.length }} 个航班</el-tag>
                            </div>

                            <el-divider>航班列表</el-divider>
                            <el-table :data="item.flightList" size="small" border>
                                <el-table-column prop="attribution" label="性质" />

                                <el-table-column prop="flightNumber" label="航班号" />
                                <el-table-column prop="startDate" label="开始时间" />
                                <el-table-column prop="endDate" label="结束时间" />

                                <el-table-column prop="days" label="周期" />
                                <el-table-column prop="departure" label="起飞机场" />
                                <el-table-column prop="departureTime" label="起飞时间" />

                                <el-table-column prop="arrival" label="目的机场" />
                                <el-table-column prop="arrivalTime" label="到达时间" />

                                <!-- <el-table-column prop="season" label="航季" /> -->
                            </el-table>

                            <el-divider>航路列表</el-divider>
                            <overflyDataView :overflyDataFromFather="item.overflyDetails" />

                        </el-card>
                    </div>
                    <div v-else class="text-gray-500 text-center">暂无任务数据</div>
                </el-scrollbar>
                <el-button type="primary" @click="submitTaskToServer">确定</el-button>
            </el-dialog>

        </div>
    </el-dialog>


</template>
<script setup>
// import { Row } from 'element-plus/es/components/table-v2/src/components/index.mjs'
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw, defineEmits } from 'vue'
import { beijingToUTC, utcToBeijing, formatTimeWithoutColon, formatTimeWithColon, beijingToLocal } from '../utils/timeTransfer';
import { permissionCheck } from '../utils/permissionCheckTool';
import axios, { all } from 'axios';
import { flightsData, addFlights, getFlights, deleteFlights, addFlightsBatchs, aircraftData, airportCodeList, attributeData, addTask, getTaskList, deleteFlightsByIds, updateRoutes, updateFlightsBatchs } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus'
import { seasonCalculate, currentSeasonData } from '../utils/season.js'
import daysPicker from '../utils/daysPicker.vue'
import AirportAutocomplete from '../utils/airportAutocomplete.vue'
import { Splitpanes, Pane } from 'splitpanes'
import dayjs from 'dayjs'
import sha256 from 'crypto-js/sha256'
import 'splitpanes/dist/splitpanes.css'
import { useRouter } from 'vue-router'
import Searcher from '../utils/searcher.vue'
import SeasonSelect from '../utils/seasonSelect.vue'
import addFlightTool from '../utils/addFlightTool.vue'
import overflyDataView from '../utils/overflyDataView.vue'
import { formatDate } from '../utils/tool.js'
import flightCard from '../utils/flightCard.vue'
const router = useRouter()
const parentFlights = ref([])
const parentRoutes = ref([])
const filterRouteResult = ref([])
const curCountryUnderRoute = ref()
const segmentedOptions = ref([])
const hideRight = ref(false)
const split = ref(50)
const selectAll = ref(false)
const selectedFlights = ref([])
const selectedRoutes = ref({})
const taskList = ref([]);
const showCreateTask = ref(false)
const taskDialogVisible = ref(false)
const taskInDialog = ref([])
const filteredFlights = ref([])
const addFlightVisible = ref(false)
const multipleSelection = ref([]);
const props = defineProps({
    initialFlightData: {
        type: Array,
        required: true,
        // validator: value => value.every(item => 'type' in item && 'content' in item)
    },
    initialRouteData: {
        type: Array,
        required: true,
        // validator: value => value.every(item => 'type' in item && 'content' in item)
    }
})
const aircraftTypes = {
    'B737-700': {
        manufacturer: 'Boeing',
        seats: 162,
        range: 5765
    },
    'B737-800': {
        manufacturer: 'Boeing',
        seats: 162,
        range: 5765
    },
    'B737-8': {
        manufacturer: 'Boeing',
        seats: 162,
        range: 5765
    },
}
const timeMode = ref('PKT')

const timeModeOptions = ['PKT', 'UTC', 'LOC']
// const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const daysOfWeek = ['1', '2', '3', '4', '5', '6', '7']

const parseDays = (daysStr) => {
    if (!daysStr) return []

    const weekMap = {
        '1': '周一',
        '2': '周二',
        '3': '周三',
        '4': '周四',
        '5': '周五',
        '6': '周六',
        '7': '周日'
    }
    // console.log('输入的days', daysStr, daysStr.split('').map(num => weekMap[num] || num)
    // )

    return daysStr.split('').map(num => weekMap[num] || num)

}
const today = new Date();
const seasonData = ref([]);
const curSeason = ref({})

const isDayInSchedule = (days, dayNumber) => {
    // console.log(days,dayNumber)
    return days.includes(dayNumber.toString());
}
const isToday = (dayNumber) => {
    const today = new Date();
    const todayDay = today.getDay(); // 0 - 6 (Sun - Sat)
    // 星期天是0，所以需要进行转换：让星期一为1，星期天为7
    const dayIndex = todayDay === 0 ? 7 : todayDay;
    return dayNumber === dayIndex;
}
const isTodayWithSchedule = (days) => {
    const today = new Date();
    const todayDay = today.getDay(); // 0 - 6 (Sun - Sat)
    const dayIndex = todayDay === 0 ? 7 : todayDay;
    return days.includes(dayIndex.toString());
}
const navToTask = (taskKey) => {
    console.log('跳转', taskKey)
    router.push({ name: 'taskList', query: { taskKey } })
}
// const showAddFlight = ref(false)
const addFlightData = async () => {
    addFlightVisible.value = true
    console.log('addFlightVisible', addFlightVisible)

    // console.log('routeResponse.data', routeResponse.data)
}
const getOverflyCountryNames = (overflyCountry) => {
    if (!overflyCountry || !Array.isArray(overflyCountry)) return []
    // console.log('overflyCountry.map(item => item.country)', overflyCountry.map(item => item.country))
    return overflyCountry.map(item => item.country)
}
//增加航班信息
const emptyFlight = () => ({
    season: '',
    attribution: '',
    flightNumber: '',
    departure: '',
    departureTime: '',
    arrival: '',
    arrivalTime: '',
    aircraftType: '',
    // aircraftNumber: '',
    startDate: '',
    endDate: '',
    days: [],
})

const addFlightForms = ref([emptyFlight()])

const addRow = () => {
    addFlightForms.value.push(emptyFlight())
}

const removeRow = (index) => {
    addFlightForms.value.splice(index, 1)
}
const flightNumberError = ref(false);


const validateFlightNumber = (flightNumber) => {
    const val = flightNumber || '';
    const upperVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!upperVal.startsWith('MF')) {
        flightNumberError.value = true;
        ElMessage.error('航班号格式错误：必须以 MF 开头');
        return;
    }

    const numPart = upperVal.slice(2);

    if (numPart.length < 3 || numPart.length > 4 || !/^\d+$/.test(numPart)) {
        flightNumberError.value = true;
        ElMessage.error('航班号格式错误：MF 后需为 3~4 位数字');
    } else {
        flightNumberError.value = false;
        flightNumber = `MF${numPart}`; // 纠正格式，保证统一
    }
};



const airportSearch = (queryString, cb) => {
    console.log('airportCodeData', airportCodeList)
    console.log('queryString', queryString)
    console.log('createFilter(queryString)', createFilter(queryString))


    const results = queryString
        ? airportCodeList.value.filter(createFilter(queryString))
        : airportCodeList.value;
    cb(results);
};
const handleSelect = (item) => {
    // form.arrival = item.IATACode; // 手动设置为三字码
    //   form.arrivalId = item.id;     // 也可以填充其他字段
    // 可以做更多业务逻辑
};
const handleSelectDeparture = (item) => {
    // form.departure = item.IATACode; // 手动设置为三字码
    //   form.arrivalId = item.id;     // 也可以填充其他字段
    // 可以做更多业务逻辑
};
const aircraftNumberData = ref([])
const handleSelect_ACType = (selectedTypes) => {
    aircraftNumberData.value = [];

    selectedTypes.forEach(type => {
        const matchedAircrafts = aircraftData.value.filter(
            item => item.aircraftType === type
        );
        console.log('matchedAircrafts', matchedAircrafts)
        matchedAircrafts.forEach(item => {
            const numbers = item.aircraftNumber.name.split(',').map(num => num.trim());
            numbers.forEach(number => {
                aircraftNumberData.value.push({
                    number,             // 注册号
                    type: item.aircraftType // 对应机型
                });
            });
        });
    });

    console.log('aircraftNumberData:', aircraftNumberData.value);
};

const aircraftNumberSearch = (queryString, cb) => {
    const results = queryString
        ? aircraftNumberData.value.filter(createFilterAC(queryString))
        : aircraftNumberData.value;

    cb(results);
};

const createFilterAC = (queryString) => {
    return (item) => {
        return item.number.toLowerCase().includes(queryString.toLowerCase());
    };
};

const handleSelectACNum = (val) => {
    console.log("选中的飞机注册号：", val);
};
const createFilter = (queryString) => {
    return (airport) => {
        const query = queryString.toLowerCase();
        return (
            airport.IATACode?.toLowerCase().includes(query) ||
            airport.ICAOCode?.toLowerCase().includes(query) ||
            airport.chineseName?.includes(queryString) ||  // 中文不用转小写
            airport.englishName?.toLowerCase().includes(query)
        );
    };
};
const editFlightMode = ref(false)
const editDataFromFather = ref()
const editFlight = (data) => {
    addFlightVisible.value = true
    editFlightMode.value = true
    editDataFromFather.value = data
}
//处理子组件增加航班的数据
const handleProcessData = async (processedDataFromChild) => {
    console.log("父组件收到数据:", processedDataFromChild)
    addFlightForms.value = processedDataFromChild.length
        ? processedDataFromChild
        : [emptyFlight()]
    console.log('addFlightForms', addFlightForms.value)
    await onSubmit()

}
const onSubmit = async () => {
    console.log('addFlightForms', addFlightForms)
    const submitData = addFlightForms.value.map(row => ({ ...toRaw(row) }))
    const finalData = submitData.map(item => ({
        ...item,
        days: JSON.stringify(item.days),
        aircraftType: JSON.stringify(item.aircraftType),
        // startDate: formatDate(item.startDate), // 可选：格式化时间
        // endDate: formatDate(item.endDate)
    }));
    console.log('finalData', finalData)
    if (editFlightMode.value == true) {
        const flightResponse = await updateFlightsBatchs(finalData).then(async () => {
            ElMessage.success('更新成功 ');
            const newFlightResponse = await getFlights();
            // console.log('flightResponse ====', flightResponse)

            flightsData.value = newFlightResponse.data
        }).catch(err => {
            ElMessage.error('失败');
            console.error('添加失败:', err);
        });
        console.log('flightResponse ====', flightResponse)
    } else {

        const flightResponse = await addFlightsBatchs(finalData).then(() => {
            ElMessage.success('添加成功');
        }).catch(err => {
            console.error('添加失败:', err);
        });
        console.log('flightResponse ====', flightResponse)

    }



}
const targetDeleteId = ref()
const showDeleteFlight = ref(false)
const deleteFlight = async (flight_id) => {
    targetDeleteId.value = flight_id
    showDeleteFlight.value = true
    console.log('准备删除 flight_id:', flight_id) // 

}
//选择applyRequired
const handleSelectionChange = (val) => {
    console.log('val', val)
    multipleSelection.value = val;
    console.log('multipleSelection', multipleSelection.value)
};

// 弹窗确认批量删除
const confirmBatchDelete = () => {
    if (!multipleSelection.value.length) {
        ElMessage.warning('请先选择航班');
        return;
    }
    ElMessageBox.confirm(
        `确定删除选中的 ${multipleSelection.value.length} 条航班吗？`,
        '批量删除',
        { type: 'warning' }
    ).then(() => {
        batchDeleteFlights();
    }).catch(() => { });
};

// 批量删除逻辑
const batchDeleteFlights = async () => {
    try {
        const ids = multipleSelection.value.map(f => f.flight_id);
        console.log('ids', ids)
        await deleteFlightsByIds(ids)
        ElMessage.success('删除成功');
        // 删除后刷新表 refresh
        const newFlightResponse = await getFlights();
        flightsData.value = newFlightResponse.data
        multipleSelection.value = [];
    } catch (err) {
        console.error('批量删除失败:', err);
        ElMessage.error('删除失败');
    }
};
const confirmDeleteFlight = async () => {
    try {
        const flightResponse = await deleteFlights(targetDeleteId.value);
        console.log('删除 ====', flightResponse)
        const newFlightResponse = await getFlights();
        flightsData.value = newFlightResponse.data
        showDeleteFlight.value = false
    } catch (error) {
        console.error('删除出错:', error.response ? error.response.data : error.message || error)
    }
}
const formatTimeFree = (timeStr, airport) => {
    if (!timeStr) return '';

    // 时间转换：根据选择的时间模式进行转换
    const date = new Date(timeStr);

    if (timeMode.value === 'PKT') {
        // 北京时间（UTC +8）
        // console.log('显示北京时')
        return formatTimeWithColon(timeStr);
    } else if (timeMode.value === 'UTC') {
        // UTC时间
        // console.log('UTC')

        return beijingToUTC(timeStr);
    } else if (timeMode.value === 'LOC') {
        // 当地时间
        console.log('显示local')

        const localTime = beijingToLocal(timeStr, airport)

        console.log('localTime', localTime)
        // console.log('await beijingToLocal(timeStr, airport)',await beijingToLocal(timeStr, airport))
        // console.log(typeof localTime)
        return localTime;
    }
}
function generateSegmentedOptions(route, row) {
    let countryList = [];

    if (typeof route.overflyCountry === 'string') {
        try {
            countryList = JSON.parse(route.overflyCountry);
        } catch (e) {
            console.error('overflyCountry解析失败:', route.overflyCountry);
            countryList = [];
        }
    } else if (Array.isArray(route.overflyCountry)) {
        countryList = route.overflyCountry; // 保留完整对象，不要只取 country
    }

    return countryList.map(countryObj => {
        const { country, needPermit, isPermit } = countryObj;

        let label = country;
        if (needPermit == false) {
            label = `${country}（无需申请）`;
        } else if (needPermit == true && isPermit == false) {
            label = `${country}（未申请）`;
        } else if (needPermit == true && isPermit == true) {
            label = `${country}（已批复）`;
        }

        return {
            label,
            value: country
        };
    });
}

onMounted(async () => {
    // const parentData = props.initialFlightData
    // console.log('onMounted执行数据初始化,parentData',parentData)
    // loadInitialDataNew(parentData)
    const today = new Date();
    const result = seasonCalculate(today);
    seasonData.value = [result.current, result.next];
    curSeason.value = result.current
    const taskResponse = await getTaskList()
    taskListInServer.value = taskResponse.data
    console.log('seasonData', seasonData)
    console.log('curSeason', curSeason)

})

// 计算准备进度
const calculateProgress = (row) => {
    let progress = 0
    if (row.permission_status === 'Valid') progress += 50
    if (row.fuel_status === 'Valid') progress += 50
    //   if (row.aircraft_number) progress += 20
    return progress
}
// 获取进度条状态
const getProgressStatus = (row) => {
    const progress = calculateProgress(row)
    if (progress < 50) return 'exception'
    if (progress < 80) return 'warning'
    return 'success'
}
// 格式化时间
const formatTime = (timeStr) => {
    console.log('timeStr', new Date())
    if (!timeStr) return ''

    return new Date(timeStr).toLocaleString()
}

const loadInitialDataNew = (parentData) => {
    // parent从watch传newval过来
    try {
        console.log('执行数据初始化', parentData)
        parentFlights.value = parentData || [];
        console.log('parentFlights', parentFlights.value)
        const result = [];

        parentFlights.value.forEach(flight => {
            if (!Array.isArray(flight.matchingRoutes)) return;

            const unappliedRoutes = flight.matchingRoutes.filter(route =>
                route.isValid === false &&
                (!Array.isArray(route.taskKeys) || route.taskKeys.length === 0)
            );

            if (unappliedRoutes.length > 0) {
                result.push({
                    attribution: flight.attribution,
                    flightNumber: flight.flightNumber,
                    departure: flight.departure,
                    departureTime: flight.departureTime,
                    arrival: flight.arrival,
                    arrivalTime: flight.arrivalTime,
                    aircraftType: flight.aircraftType,
                    aircraftNumber: flight.aircraftNumber,
                    season: flight.season,
                    route: unappliedRoutes, // 👈 这里包成数组
                });
            }
        });


        applyRequired.value = result;
        filteredFlights.value = parentFlights.value
        console.log('applyRequired（未申请的航班+route）:', applyRequired.value);

    } catch (e) {
        console.error('数据初始化失败:', e)
    }
}
const loadInitialRouteData = (parentData) => {
    // parent从watch传newval过来
    try {
        ParentdataToRoutes(parentData)
    } catch (e) {
        console.error('数据初始化失败:', e)
    }
}
const applyRequired = ref([])
const ParentdataToFlights = (data) => {
    //   console.log('正常执行数据处理')
    console.log('******ParentdataToFlights', data)


}
const ParentdataToRoutes = (data) => {
    //   console.log('正常执行数据处理')
    parentRoutes.value = data || [];
    console.log('parentRoutes', parentRoutes.value)

}
const filterPermissionData = ref()
const permissionCheckResult = ref()

const filterPermission = (relateFlights, schedule) => {
    console.log('传入的relateFlights', relateFlights)
    console.log('schedule', schedule)

    const scheduleFlightNumber = schedule.flightNumber.startsWith('MF') ? 'CXA' + schedule.flightNumber.slice(2) : schedule.flightNumber
    console.log('scheduleFlightNumber', scheduleFlightNumber)

    filterPermissionData.value = relateFlights.filter(item => item.flightNum == scheduleFlightNumber)
    console.log('filterPermissionData', filterPermissionData)

    permissionCheckResult.value = permissionCheck(filterPermissionData.value, schedule, curCountryUnderRoute.value)
    // console.log(filterPermissionData.value, 'permissionCheckResult', permissionCheckResult.value)
    if (filterPermissionData.value) {
        return filterPermissionData.value
    }
    return '未找到批复信息';
}
const findPermission = ref()//当前航班当前routeCode找到的许可
const lastCountrtSelect = ref()
const checkClickCountry = () => {
    //检查是否重复点击
    if (lastCountrtSelect.value === curCountryUnderRoute.value) {
        curCountryUnderRoute.value = ''
        lastCountrtSelect.value = ''
        findPermission.value = ''
        curClickCountryDetails.value = null
        return
    }
    lastCountrtSelect.value = curCountryUnderRoute.value
}
const curClickCountryDetails = ref(null)
const showOverflyDetail = (route, country) => {
    curClickCountryDetails.value = route.overflyCountry.find(item => item.country == country)
    console.log('curClickCountryDetails', curClickCountryDetails)
}
const routeInFilter = (filterData) => {
    console.log('filterData', filterData)

    // console.log('routeInFilter', filterData[0].route)
    return filterData[0].route
}

const filterRoute = (departure, arrival) => {
    // console.log('filterdeparture', departure)
    // console.log('departure&"-"&arrival', departure + "-" + arrival)
    const data = parentRoutes.value
    filterRouteResult.value = data.filter(item => item.departure + "-" + item.arrival == departure + "-" + arrival)


    console.log('filterRouteResult', filterRouteResult)

}
const showApplyRequired = () => {
    hideRight.value = !hideRight.value;
};
const handleSelectAll = (checked) => {
    if (checked) {
        selectedFlights.value = applyRequired.value.map(f => f.flightNumber);
        for (const flight of applyRequired.value) {
            selectedRoutes.value[flight.flightNumber] = flight.route
                .filter(r => !r.isValid)
                .map(r => r.routeCode);
        }
    } else {
        selectedFlights.value = [];
        for (const flight of applyRequired.value) {
            selectedRoutes.value[flight.flightNumber] = [];
        }
    }
};
const handleFlightSelect = ({ flight, checked }) => {
    if (checked) {
        if (!selectedFlights.value.includes(flight.flightNumber)) selectedFlights.value.push(flight.flightNumber)
        selectedRoutes.value[flight.flightNumber] = flight.route.filter(r => !r.isValid).map(r => r.routeCode)
    } else {
        selectedFlights.value = selectedFlights.value.filter(f => f !== flight.flightNumber)
        selectedRoutes.value[flight.flightNumber] = []
    }
    console.log('selectedRoutes',selectedRoutes)

    updateSelectAllStatus()
}

const handleRouteSelect = ({ flight, routes }) => {
  selectedRoutes.value[flight.flightNumber] = routes
  const totalInvalid = flight.route.filter(r => !r.isValid).length
  if (routes.length === totalInvalid) {
    if (!selectedFlights.value.includes(flight.flightNumber)) selectedFlights.value.push(flight.flightNumber)
  } else {
    selectedFlights.value = selectedFlights.value.filter(f => f !== flight.flightNumber)
  }
  updateSelectAllStatus()
}
const updateSelectAllStatus = () => {
  selectAll.value = taskNeedData.value.length > 0 && taskNeedData.value.every(f => selectedFlights.value.includes(f.flightNumber))
}

// const handleFlightSelect = (flight) => {
//     console.log('flight',flight)
//     console.log('selectedFlights', selectedFlights)
//     console.log('selectedRoutes', selectedRoutes)

//     const selected = selectedFlights.value.includes(flight.flightNumber);
//     console.log('selected',selected)

//     if (!selected) {
//         selectedRoutes.value[flight.flightNumber] = flight.route
//             .filter(r => !r.isValid)
//             .map(r => r.routeCode);
//     } else {
//         selectedRoutes.value[flight.flightNumber] = [];
//     }

//     // 更新全选状态
//     updateSelectAllStatus();
// };
const updateFlightRoutes = (flight, routes) => {
    selectedRoutes.value[flight.flightNumber] = routes
}

// const handleRouteSelect = (flight) => {
//     const routes = selectedRoutes.value[flight.flightNumber] || [];
//     const totalInvalid = flight.route.filter(r => !r.isValid).length;

//     if (routes.length === totalInvalid) {
//         // 所有未申请航路都勾选，视为选中该航班
//         if (!selectedFlights.value.includes(flight.flightNumber)) {
//             selectedFlights.value.push(flight.flightNumber);
//         }
//     } else {
//         selectedFlights.value = selectedFlights.value.filter(fn => fn !== flight.flightNumber);
//     }

//     updateSelectAllStatus();
// };

// const updateSelectAllStatus = () => {
//     const allFlightNumbers = applyRequired.value.map(f => f.flightNumber);
//     selectAll.value = allFlightNumbers.every(flight => selectedFlights.value.includes(flight));
// };

const taskNeedData = ref([])

const transferToTaskdata = (data) => {
    try {
        parentFlights.value = data || [];
        console.log('parentFlights', parentFlights.value)
        const result = [];
        parentFlights.value.forEach(flight => {
            if (!Array.isArray(flight.matchingRoutes)) return;
            const allRoutesValid = flight.matchingRoutes.every(route => route.isValid === true);
            if (allRoutesValid) {
                // 如果所有航路都可以用，弹出提示
                ElMessage.info(`航班 ${flight.flightNumber} 的所有航路均已有效，无需申请.`);
                return;
            }
            const unappliedRoutes = flight.matchingRoutes.filter(route =>
                route.isValid === false &&
                (!Array.isArray(route.taskKeys) || route.taskKeys.length === 0)
            );
            if (unappliedRoutes.length > 0) {
                result.push({
                    attribution: flight.attribution,
                    flightNumber: flight.flightNumber,
                    days: flight.days,
                    startDate: flight.startDate,
                    endDate: flight.endDate,

                    departure: flight.departure,
                    departureTime: flight.departureTime,
                    arrival: flight.arrival,
                    arrivalTime: flight.arrivalTime,
                    aircraftType: flight.aircraftType,
                    aircraftNumber: flight.aircraftNumber,
                    season: flight.season,
                    route: unappliedRoutes, // 👈 这里包成数组
                });
            }
        });

        taskNeedData.value = result;
        showChooseTask(taskNeedData.value)
        // filteredFlights.value = parentFlights.value
        console.log('taskNeedData', taskNeedData.value);

    } catch (e) {
        console.error('数据初始化失败:', e)
    }
}
const showChooseTaskVisible = ref(false)
const showChooseTask = (data) => {
    showChooseTaskVisible.value = true
}
const selectedRouteIds = ref([])
const createTask = (data) => {
    showCreateTask.value = true;
    console.log('showCreateTask', showCreateTask.value);
    selectedRouteIds.value = []
    const applyDataConfirm = data;
    console.log('applyDataConfirm', applyDataConfirm);

    const countryMap = new Map(); // key: countryName -> { flightList: [], routeList: [], overflyDetails: [] }

    try {
        for (const flight of applyDataConfirm) {
            const flightNumber = flight.flightNumber;
            const routeCodes = selectedRoutes.value[flightNumber] || [];
            if (routeCodes.length === 0) continue;

            // 根据 routeCode 过滤选中的航路
            const selectedRoutesData = flight.route.filter(r => routeCodes.includes(r.routeCode));
            console.log('selectedRoutesData', selectedRoutesData);

            // 遍历每个选中的航路
            for (const route of selectedRoutesData) {
                // 获取当前航路的过境国家
                selectedRouteIds.value.push(route.route_id)
                const countries = route.overflyCountry.filter(item => item.needPermit == true) || [];
                console.log('countries', countries);

                // 遍历该航路的所有过境国家
                for (const countryObj of countries) {
                    const country = countryObj.country;

                    // 如果国家不存在于 countryMap 中，则初始化数据
                    if (!countryMap.has(country)) {
                        countryMap.set(country, {
                            overflyCountry: country,
                            season: flight.season,
                            flightList: [],
                            overflyDetails: []  // 初始化为空数组
                        });
                    }

                    // 获取当前国家的数据
                    const countryData = countryMap.get(country);

                    // 直接将当前航路的所有 overflyDetails 数据添加到国家下
                    const routeOverflyDetails = countryObj.overflyDetails || [];

                    // 直接合并到 countryData 的 overflyDetails 数组中
                    countryData.overflyDetails.push(...routeOverflyDetails);

                    // 避免重复添加航班
                    const flightExists = countryData.flightList.some(f => f.flightNumber === flight.flightNumber);
                    if (!flightExists) {
                        countryData.flightList.push({
                            startDate: flight.startDate,
                            endDate: flight.endDate,
                            days: flight.days,

                            attribution: flight.attribution,
                            flightNumber: flight.flightNumber,
                            departure: flight.departure,
                            departureTime: flight.departureTime,
                            arrival: flight.arrival,
                            arrivalTime: flight.arrivalTime,
                            aircraftType: flight.aircraftType,
                            // aircraftNumber: flight.aircraftNumber,
                            season: flight.season,
                        });
                    }
                }
            }
        }
    } catch (error) {
        ElMessage.error('提交失败，请重试');
        console.error(error);
    }

    // 将 countryMap 中的数据转为数组，保存到 taskList 中
    taskList.value = Array.from(countryMap.values());
    console.log('任务内容（按国家）taskList:', taskList.value);
};

const generateDefaultTaskName = () => {
    const timestamp = dayjs().format('YYYYMMDDHHmm')
    const firstFlightNumber = taskList.value[0]?.flightList?.[0]?.flightNumber || '未知航班'
    const totalFlights = taskList.value.reduce((sum, item) => sum + item.flightList.length, 0)
    return `${timestamp}_${firstFlightNumber}_等${totalFlights}个航班`
}
const curTaskNameInput = ref()
const submitTaskToServer = async () => {
    if (!taskList.value.length) return
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const taskKey = sha256(JSON.stringify(taskList.value) + now).toString()
    const taskName = curTaskNameInput.value?.trim() || generateDefaultTaskName()
    const payload = {
        taskName,
        taskKey,
        createTime: now,
        updateTime: now,
        data: JSON.stringify(taskList.value),
    }

    try {
        console.log('提交任务的payload', payload)
        const res = await addTask(payload)
        //将taskKey同步到航班，方法已遗弃，不能同步
        const routesToUpdate = []
       
        ElMessage.success('任务已提交')
        console.log('提交成功:', res.data)
        showCreateTask.value = false
        emit('refreshFlights');
        // const newFlightResponse = await getFlights();
        // loadInitialDataNew(newFlightResponse.data)
        // console.log('提交成功applyRequired:',applyRequired.value)
    } catch (error) {
        ElMessage.error('提交失败，请重试')
        console.error(error)
    }

}
const emit = defineEmits(['refreshFlights']);
const taskListInServer = ref()
const openTaskDialog = async (taskKeys) => {
    // const taskKeysOpen = JSON.parse(taskKeys)
    // console.log('taskKeysOpen',taskKeysOpen)
    const taskResponse = await getTaskList()
    taskListInServer.value = taskResponse.data
    taskInDialog.value = taskListInServer.value.filter(task =>
        taskKeys.includes(task.taskKey)
    )
    taskDialogVisible.value = true
}
watch(
    () => props.initialFlightData,
    (newVal) => {
        console.log('props.initialFlightData 变化了:', newVal)
        loadInitialDataNew(newVal)
    },
    { immediate: true } // 初始化时也执行
)

watch(
    () => props.initialRouteData,
    (newVal) => {
        console.log('initialRouteData 变化了:', newVal);
        loadInitialRouteData(newVal);  // 处理路线数据
    },
    { immediate: true } // 初始化时也执行
);

watch(applyRequired, () => {
    for (const flight of applyRequired.value) {
        if (!(flight.flightNumber in selectedRoutes.value)) {
            selectedRoutes.value[flight.flightNumber] = [];
        }
    }
}, { immediate: true });
watch(showCreateTask, (val) => {
    if (val) {
        // 弹窗打开时，预设默认任务名
        curTaskNameInput.value = generateDefaultTaskName()
    }
})


</script>
<style scoped>
.days-container {
    display: flex;
    /* 横向排列 */
    flex-wrap: wrap;
    /* 超出换行，可选 */
    gap: 4px;
    /* 标签间距，可调 */
}

.left-align-container {
    text-align: left;
    max-width: 100%;
    /* 或固定宽度，比如 400px */
    white-space: normal;
    word-break: break-word;
    /* 允许长词换行 */
    overflow-wrap: break-word;
    /* 兼容其他浏览器 */

}

.left-align-container-text {
    height: 40px;
    display: flex;
    align-items: center;
}

.expand-content {
    padding: 20px;
}

.expand-content h4 {
    margin: 15px 0 10px;
    color: #409EFF;
}

.day-tag {
    margin-right: 5px;
    margin-bottom: 5px;
}

.flightTable {
    display: flex;
    justify-content: center;
    align-items: center;

}

.day-tag {
    margin: 3px;
    font-size: 14px;
}

.normal-tag {
    background-color: #409eff;
    color: white;
}

.disabled-tag {
    background-color: #dcdfe6;
    color: #909399;
}

.today-tag {
    /* background-color: green;
    color: white; */
    /* border: 4px solid green; */
    /* background-color: rgb(255, 183, 49); */
}

.today-pointer {
    position: relative;
    top: 10px;
    left: 10px;
    font-size: 18px;
    color: green;
}

.pointer {
    font-weight: bold;
    font-size: 20px;
}

.segmented-green .el-segmented__item {
    background-color: #e1f3d8 !important;
    color: #67c23a !important;
    border-color: #b3e19d !important;
}

.segmented-red .el-segmented__item {
    background-color: #fde2e2 !important;
    color: #f56c6c !important;
    border-color: #fab6b6 !important;
}
</style>