<!-- flightListTool.vue -->
<template>
    <div class="flight-list-tool">

        <div>
            <h2>航班列表</h2>
            <el-tag type="success" size="large">{{ filteredFlights.length }}个航班</el-tag>
            <el-tag type="success" size="large">{{ scheduleList.length }}个定期航班</el-tag>
            <el-tag type="success" size="large">{{ nonScheduleList.length }}个非定期航班</el-tag>

        </div>
        <Searcher mode="flight" :list="parentFlights" @update:result="filteredFlights = $event" />

        <div style="display: flex; justify-content: left; align-items: center;height: 50px;margin-left: 50px;">

            <el-button :icon="Plus" @click="addFlightData">新增航班</el-button>

        </div>
        <transition name="slide-up">
            <div v-if="multipleSelection.length" class="floating-toolbar">
                <div class="toolbar-left">
                    已选择
                    <el-tag type="primary">
                        {{ multipleSelection.length }}
                    </el-tag>
                    个航班

                    <div> <el-tag v-for="flight in multipleSelection" :key="flight.flightNumber" class="mr-1"
                            :closable="true" @close="removeSelect(flight)"> {{ flight.flightNumber }} </el-tag> </div>
                </div>

                <div class="toolbar-right">

                    <el-button :icon="CirclePlus" type="success" @click="handleApplyFlights">
                        申请
                    </el-button>

                    <el-button type="warning" @click="changeFlight(multipleSelection)">
                        变更评估
                    </el-button>

                    <el-button @click="editBatch">
                        编辑
                    </el-button>

                    <el-button type="danger" @click="confirmBatchDelete">
                        删除
                    </el-button>

                </div>
            </div>
        </transition>

        <div style="display: flex; height: 100vh;">
            <div style="flex: 3; padding: 10px; border-right: 1px solid #ccc; overflow: auto;">
                <!-- <template #first> -->

                <FlightTable :data="filteredFlights" :selectedIds="selectedIds" :time-mode="timeMode" :format-time="formatTimeFree"
                    @selection-change="handleSelectionChange" @row-click="showClickRowDetail" @edit="editFlight" @toggle-select="toggleSelect" />
                <changeEvalue v-model:visible="showChangeEvalue" :evalueData="evalueData" />
                <el-drawer v-model="drawerVisible" title="航班详情" direction="rtl" size="40%" :destroy-on-close="true">
                    <template v-if="clickFlight">
                        <el-descriptions title="基本信息" :column="2" border>
                            <el-descriptions-item label="航班号">{{ clickFlight.flightNumber }}</el-descriptions-item>
                            <el-descriptions-item label="航季">{{ clickFlight.season }}</el-descriptions-item>
                            <el-descriptions-item label="性质">{{ clickFlight.attribution }}</el-descriptions-item>
                            <el-descriptions-item label="机型">{{ clickFlight.aircraftType }}</el-descriptions-item>
                        </el-descriptions>

                        <el-descriptions title="时间信息" :column="2" border class="mt-3">
                            <el-descriptions-item label="起飞机场">{{ clickFlight.departure }}</el-descriptions-item>
                            <el-descriptions-item label="到达机场">{{ clickFlight.arrival }}</el-descriptions-item>
                            <el-descriptions-item label="起飞时间">{{ formatTimeFree(clickFlight.departureTime)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="到达时间">{{ formatTimeFree(clickFlight.arrivalTime)
                            }}</el-descriptions-item>
                        </el-descriptions>

                        <el-divider>航路详情</el-divider>
                        <div v-if="clickFlight.matchingRoutes?.length">
                            <el-collapse>
                                <el-collapse-item v-for="(route, index) in clickFlight.matchingRoutes" :key="index">
                                    <template #header>
                                        <div class="flex items-center justify-between w-full">
                                            <span>{{ route.routeCode }}</span>
                                            <el-tag v-if="route.isValid" type="success" size="small" effect="plain">
                                                可使用
                                            </el-tag>
                                            <el-tag v-else-if="route.taskKeys?.length" type="warning" size="small"
                                                effect="plain">
                                                正在申请
                                            </el-tag>
                                            <el-tag v-else type="danger" size="small" effect="plain">
                                                未申请
                                            </el-tag>
                                        </div>
                                    </template>
                                    <div>航路：{{ route.ATSroute }}</div>

                                    <div>
                                        <el-segmented v-model="curCountryUnderRoute"
                                            :options="generateSegmentedOptions(route, clickFlight)"
                                            @change="val => showOverflyDetail(route, val)"
                                            @click="checkClickCountry()" />

                                    </div>
                                    <div v-if="curClickCountryDetails">
                                        <h4>飞越航路详情</h4>

                                        <overflyDataView :editShow="false" :countryData="curClickCountryData"
                                            :overflyDataFromFather="curClickCountryDetails.overflyDetails" />
                                    </div>
                                </el-collapse-item>
                            </el-collapse>

                        </div>
                        <el-empty v-else description="无匹配航路"></el-empty>

                        <el-divider>燃油信息</el-divider>
                        <el-descriptions v-if="clickFlight.fuel_detail" :column="2" border>
                            <el-descriptions-item label="合同名称">{{ clickFlight.fuel_detail.name }}</el-descriptions-item>
                            <el-descriptions-item label="开始日期">{{ clickFlight.fuel_detail.startDate
                            }}</el-descriptions-item>
                            <el-descriptions-item label="结束日期">{{ clickFlight.fuel_detail.endDate
                            }}</el-descriptions-item>
                            <el-descriptions-item label="关联机场">{{ clickFlight.fuel_detail.relateAirport
                            }}</el-descriptions-item>
                        </el-descriptions>
                        <el-empty v-else description="未查到相关合同" />
                    </template>
                </el-drawer>
                <!-- <addDataTool :mode="'flight'" v-model:visible="addFlightVisible" :isEditing="editFlightMode" @parsed="handleProcessData" :editData="editDataFromFather" :originData="parentFlights"/> -->
                <addFlightTool v-model:visible="addFlightVisible" :isEditing="editFlightMode"
                    @parsed="handleProcessData" :editData="editDataFromFather" :originData="parentFlights" />
                <el-dialog v-model="showDeleteFlight" title="删除航班" width="500">
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


        </div>

        <TaskSelector v-model:visible="showChooseTaskVisible" :flights="taskNeedData" :selectedFlights="selectedFlights" :selectedIds="selectedIds"
            :selectedRoutes="selectedRoutes" :selectAll="selectAll" @flight-select="handleFlightSelect" 
            @route-select="handleRouteSelect" @select-all="handleSelectAll" @create-task="createTaskInput()" />

        <TaskPreview v-model:visible="showCreateTask" :taskList="taskList" />



    </div>
</template>
<script setup>
// import { Row } from 'element-plus/es/components/table-v2/src/components/index.mjs'
import { Plus, CirclePlus } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw, defineEmits } from 'vue'
import { beijingToUTC, utcToBeijing, formatTimeWithoutColon, formatTimeWithColon, beijingToLocal } from '@/utils/timeTransfer';
import { permissionCheck } from '@/utils/permissionCheckTool';
import axios, { all } from 'axios';
import { addInfoCenter, flightsData, getCountryRules, addFlights, getFlights, deleteFlights, addFlightsBatchs, aircraftData, airportCodeList, attributeData, addTask, getTaskList, deleteFlightsByIds, updateRoutes, updateFlightsBatchs } from '@/api';
import { ElMessage, ElMessageBox } from 'element-plus'
import { seasonCalculate, currentSeasonData } from '@/utils/season.js'
import daysPicker from '@/utils/daysPicker.vue'
import AirportAutocomplete from '@/utils/airportAutocomplete.vue'
import dayjs from 'dayjs'
import sha256 from 'crypto-js/sha256'
import 'splitpanes/dist/splitpanes.css'
import { useRouter } from 'vue-router'
import Searcher from '@/utils/smartSearcher/SearcherBar.vue'
// import Searcher from '@/utils/smartSearcher/searcher.vue'
import SeasonSelect from '@/utils/seasonSelect.vue'
import addFlightTool from '@/utils/addFlightTool.vue'
import overflyDataView from '@/utils/overflyDataView.vue'
import { formatDate, sortBy } from '@/utils/tool.js'
import flightCard from '@/utils/flightCard.vue'
import addDataTool from '@/utils/addDataTool.vue'
import DaysShow from '@/utils/daysShow.vue'
import { useLoading } from '@/plugins/loading'
import changeEvalue from '@/utils/changeEvalue.vue'
import { useSeasonData } from '@/components/useSeasonUtils'
import FlightTable from '@/components/flightTable.vue'
import { transferToTaskdata, createTask } from '@/utils/taskTool/composables/buildTaskData.js'
import TaskDialog from '@/utils/taskTool/components/TaskDialog.vue'
import TaskSelector from '@/utils/taskTool/components/TaskSelector.vue'
import TaskPreview from '@/utils/taskTool/components/TaskPreview.vue';
import { getFlightKey } from '@/utils/taskTool/utils/getFlightKey.js'
// import { RecycleScroller } from 'vue-virtual-scroller'
const { todaySeason } = useSeasonData()

const showChangeEvalue = ref(false)
const loading = useLoading()
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
// const scheduleList = ref([])
// const nonScheduleList = ref([])
const addFlightVisible = ref(false)
const selectedIds = ref([])
const multipleSelection = ref([]);
const props = defineProps({
    initialFlightData: {
        type: Array,
        default: () => [],
        required: true,
        // validator: value => value.every(item => 'type' in item && 'content' in item)
    },
    initialRouteData: {
        type: Array,
        default: () => [],
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

const today = new Date();
const seasonData = ref([]);
const curSeason = ref({})
const sortByUpdateTime = (a, b) => {
    const ta = new Date(a.updateTime || a.createTime).getTime()
    const tb = new Date(b.updateTime || b.createTime).getTime()
    return ta - tb
}
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
    label: '',
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

    editDataFromFather.value = []
    addFlightVisible.value = true
    editFlightMode.value = true
    editDataFromFather.value = data
    console.log('editDataFromFather', editDataFromFather.value)
}
const evalueData = ref()

const changeFlight = (data) => {
    console.log('输入的更改内容', data)
    evalueData.value = []
    showChangeEvalue.value = true
    evalueData.value = data

}
//处理子组件增加航班的数据
const handleProcessData = async (processedDataFromChild) => {
    console.log("父组件收到数据:", processedDataFromChild)
    addFlightForms.value = processedDataFromChild.length
        ? processedDataFromChild
        : [emptyFlight()]
    console.log('父组件处理addFlightForms', addFlightForms.value)

    const newValue = addFlightForms.value

    const group = {

        action: 'add',
        changes: []
    }
    changeLogs.value.push(group)
    // 加入 change 记录
    group.changes.push({
        newValue
    })



    await onSubmit()

}
const messageBatch = ref([])
const changeLogs = ref([])

const onSubmit = async () => {
    const newInfo = {
        title: '航班更新',
        message: { text: `增加了新航班`, detail: changeLogs.value },
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        processed: 'no',//no,in progress,finish
        type: 'flight',//flight,route,overfly
        urgentLevel: 'normal'//normal,warning,danger
    }
    console.log('newInfo', newInfo)
    messageBatch.value.push(newInfo)

    // return
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
            editDataFromFather.value = null
            // console.log('flightResponse ====', flightResponse)

            flightsData.value = newFlightResponse.data
            if (curSeason.value) {
                filteredFlights.value = flightsData.value.filter(f => f.season == curSeason.value.en)

            }
            console.log('新的航班数据 ====', newFlightResponse)
        }).catch(err => {
            ElMessage.error('失败');
            console.error('添加失败:', err);
        });
        console.log('修改返回信息 ====', flightResponse)
    } else {
        await addInfoCenter(messageBatch.value)
        const flightResponse = await addFlightsBatchs(finalData).then(async () => {
            ElMessage.success('航班数据添加成功');
            const newFlightResponse = await getFlights();
            flightsData.value = newFlightResponse.data
            if (curSeason.value) {
                filteredFlights.value = flightsData.value.filter(f => f.season == curSeason.value.en)

            }
        }).catch(err => {
            console.error('添加失败:', err);
        });
        console.log('添加返回信息 ====', flightResponse)

    }



}
const targetDeleteId = ref()
const showDeleteFlight = ref(false)
const deleteFlight = async (flight_id) => {
    targetDeleteId.value = flight_id
    showDeleteFlight.value = true
    console.log('准备删除 flight_id:', flight_id) // 

}
const clickFlight = ref()
const drawerVisible = ref(false)
const toggleSelect = (id) => {
  console.log('toggleSelect payload:', id)

  const set = new Set(selectedIds.value)

  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }

  selectedIds.value = [...set]

  multipleSelection.value = filteredFlights.value.filter(f =>
    set.has(f.flight_id)
  )
}
// const toggleSelect = (id) => {
//     console.log('toggleSelect payload:', id)
//     const index = selectedIds.value.indexOf(id)

//     if (index > -1) {
//         selectedIds.value.splice(index, 1)
//     } else {
//         selectedIds.value.push(id)
//     }

//     multipleSelection.value = filteredFlights.value.filter(f =>
//         selectedIds.value.includes(f.flight_id)
//     )
// }
const handleSelectionChange = (val) => {
    console.log('val', val)
    multipleSelection.value = val;
    console.log('multipleSelection', multipleSelection.value)
};
const showClickRowDetail = (row) => {
    clickFlight.value = row
    drawerVisible.value = true
    console.log('clickFlight', clickFlight)
}
// 弹窗确认批量删除
const removeSelect = (flight) => {
    multipleSelection.value =
        multipleSelection.value.filter(
            item => item.flightNumber !== flight.flightNumber
        )
    selectedIds.value = selectedIds.value.filter(
        id => id !== flight.flight_id
    )
}
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
const editBatch = () => {
    console.log('multipleSelection', multipleSelection)
    editDataFromFather.value = []
    addFlightVisible.value = true
    editFlightMode.value = true
    editDataFromFather.value = multipleSelection.value
    console.log('editDataFromFather', editDataFromFather.value)
}
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
    console.log('生成标签的', route)
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
    console.log('countryList', countryList)
    return countryList.map(countryObj => {
        const { country, needPermit, isPermit, applyStatus } = countryObj;

        let label = country;
        if (needPermit == false) {
            label = `${country}（无需申请）`;
        } else if (needPermit == true && applyStatus?.status == 'none') {
            label = `${country}（未申请）`;
        } else if (needPermit == true && applyStatus?.status == 'matched' && isPermit == false) {
            label = `${country}（正在申请）`;
        } else if (needPermit == true && applyStatus?.status == 'matched' && isPermit == true) {
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
    console.log('航季数据seasonData', seasonData)
    console.log('当前航季curSeason', curSeason)

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
const taskNeedData = ref([])
//输出选择列表
const showChooseTaskVisible = ref(false)
const handleApplyFlights = () => {

    const result = transferToTaskdata(
        multipleSelection.value
    )
    console.log('转换成任务数据格式', result)
    if (!result?.length) return

    taskNeedData.value = result

    showChooseTaskVisible.value = true
}

const loadInitialDataNew = (parentData) => {
    // parent从watch传newval过来
    try {
        // console.log('执行数据初始化', parentData)
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
        // console.log('筛选后航班列表数据',filteredFlights.value)
        if (curSeason.value) {
            filteredFlights.value = parentFlights.value.filter(f => f.season == curSeason.value.en)

        }
        console.log('筛选后航班列表数据', filteredFlights.value)

        // console.log('applyRequired（未申请的航班+route）:', applyRequired.value);

    } catch (e) {
        console.error('数据初始化失败:', e)
    }
}
const scheduleList = computed(() => {
    return filteredFlights.value.filter(
        flight => flight.attribution.toUpperCase() === 'SCHEDULED'
    );
});
const nonScheduleList = computed(() => {
    return filteredFlights.value.filter(
        flight => flight.attribution.toUpperCase() === 'NONSCHEDULE'
    );
});

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
const curClickCountryData = ref()
const countryDataFromServer = ref()
const showOverflyDetail = async (route, country) => {
    const countryRes = await getCountryRules()
    countryDataFromServer.value = countryRes.data
    console.log('route', route, 'country', country, 'countryRes', countryRes)

    curClickCountryDetails.value = route.overflyCountry.find(item => item.country == country)
    curClickCountryData.value = countryDataFromServer.value.find(item => item.country == country)
    console.log('curClickCountryData', curClickCountryData)
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
    console.log('全选状态', checked)
    if (checked) {

        selectedFlights.value =
            taskNeedData.value.map(f => getFlightKey(f))

        for (const flight of taskNeedData.value) {

            const key = getFlightKey(flight)

            selectedRoutes.value[key] =
                flight.route
                    .filter(r => !r.isValid)
                    .map(r => r.routeCode)
        }

    } else {

        selectedFlights.value = []

        for (const flight of taskNeedData.value) {

            const key = getFlightKey(flight)

            selectedRoutes.value[key] = []
        }
    }
    updateSelectAllStatus()
    console.log('selectedFlights', selectedFlights.value)
    console.log('selectedRoutes', selectedRoutes.value)
}
// const getFlightKey = (flight) =>
//     `${flight.flightNumber}-${flight.departure}-${flight.arrival}`
//单选确认
const handleFlightSelect = ({
    key,
    checked
}) => {

    const flight =
        taskNeedData.value.find(
            f => getFlightKey(f) === key
        )

    if (!flight) return

    if (checked) {

        if (!selectedFlights.value.includes(key)) {
            selectedFlights.value.push(key)
        }

        selectedRoutes.value[key] =
            flight.route.map(r => r.routeCode)

    } else {

        selectedFlights.value =
            selectedFlights.value.filter(
                k => k !== key
            )

        selectedRoutes.value[key] = []
    }

    updateSelectAllStatus()
}
const handleRouteSelect = ({
    key,
    routes
}) => {

    selectedRoutes.value[key] = routes

    const flight =
        taskNeedData.value.find(
            f => getFlightKey(f) === key
        )

    if (!flight) return

    if (
        routes.length ===
        flight.route.length
    ) {

        if (!selectedFlights.value.includes(key)) {
            selectedFlights.value.push(key)
        }

    } else {

        selectedFlights.value =
            selectedFlights.value.filter(
                k => k !== key
            )
    }

    updateSelectAllStatus()
}

const updateSelectAllStatus = () => {
    console.log('更新全选状态', selectAll.value, taskNeedData.value)
    selectAll.value =
        taskNeedData.value.length > 0 &&
        taskNeedData.value.every(f =>
            selectedFlights.value.includes(
                getFlightKey(f)
            )
        )
}
// const updateSelectAllStatus = () => {
//     selectAll.value = taskNeedData.value.length > 0 && taskNeedData.value.every(f => selectedFlights.value.includes(f.flightNumber))
// }

const updateFlightRoutes = (flight, routes) => {
    selectedRoutes.value[flight.flightNumber] = routes
}

const formatAircraftType = (val) => {
    if (Array.isArray(val)) {
        return val.join(', ')
    }
    return val || ''
}
const sameAttribution = (flights) => {
    if (!Array.isArray(flights) || flights.length === 0) return true;

    const firstAttr = flights[0].attribution;

    return flights.every(flight => flight.attribution === firstAttr);
};




const selectedRouteIds = ref([])

const createTaskInput = () => {
    const taskMade = createTask(taskNeedData.value, selectedRoutes.value, selectedRouteIds.value)
    showCreateTask.value = taskMade.showCreateTask
    taskList.value = taskMade.taskList
    console.log('生成的taskList', taskList.value)

}
const submitTaskToServer = async () => {
    if (!taskList.value.length) return
    console.log('生成任务...')

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const taskKey = sha256(JSON.stringify(taskList.value) + now).toString()
    const taskName = curTaskNameInput.value?.trim() || generateDefaultTaskName()
    const taskAttribution = curTaskAttrInput.value || generateTaskAttribution()
    const taskSeason = curTaskSeason.value || generateTaskSeason()

    const payload = {
        taskName,
        taskKey,
        taskAttribution,
        // taskType,
        taskSeason,
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
        showChooseTaskVisible.value = false
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
const curAttrSelect = ref('schedule')
// const changeAttribution = (tab) => {
//     curAttrSelect.value = tab.paneName;
//     console.log('curAttrSelect', curAttrSelect)
//     filteredFlights.value = parentFlights.value.filter(
//         i => i.attribution === curAttrSelect.value
//     );
// };
// const changeAttribution = (tab)=>{
//     curAttrSelect.value = tab.label
//     filteredFlights.value = filteredFlights.value.filter(i=>{i.attribution = curAttrSelect.value })

// }
watch(
    () => props.initialFlightData,
    (newVal) => {
        // console.log('props.initialFlightData 变化了:', newVal)
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
// watch(showCreateTask, (val) => {
//     if (val) {
//         // 弹窗打开时，预设默认任务名
//         curTaskAttrInput.value = generateTaskAttribution()
//         curTaskSeason.value = generateTaskSeason()

//         curTaskNameInput.value = generateDefaultTaskName()
//     }
// })


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

.floating-toolbar {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);

    z-index: 3000;

    min-width: 700px;

    padding: 14px 24px;

    background: rgba(255, 255, 255, .95);

    backdrop-filter: blur(12px);

    border-radius: 16px;

    box-shadow:
        0 8px 30px rgba(0, 0, 0, .12);

    display: flex;
    justify-content: space-between;
    align-items: center;
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