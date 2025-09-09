<template>
    <div>
        <!-- 搜索框 -->
        <Searcher mode="task" :list="taskListInServer" @update:result="filteredTasks = $event" />

        <div class="add-button-box">
            <el-button type="primary" @click="addTask" class="add-button">新增任务</el-button>
            <el-button type="danger" :disabled="selectedTask.length === 0" @click="handleBatchDelete">
                批量删除
            </el-button>
        </div>

        <!-- 搜索结果表格 -->
        <el-table :data="filteredTasks" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="任务id" prop="id"></el-table-column>
            <el-table-column label="任务key" prop="taskName"></el-table-column>

            <el-table-column label="任务key" prop="taskKey"></el-table-column>
            <el-table-column label="任务内容">
                <template #default="{ row }">
                    <div v-if="Array.isArray(row.data)">
                        <div v-for="(item, idx) in row.data" :key="idx">
                            <div v-if="Array.isArray(item.flightList) && Array.isArray(item.routeList)">
                                <el-tag v-for="(flight, index) in item.flightList" :key="index" class="mr-1 mb-1"
                                    type="info">
                                    {{ flight.flightNumber }}
                                </el-tag>
                                <el-tag v-for="(route, index) in item.routeList" :key="index" class="mr-1 mb-1"
                                    type="info">
                                    {{ route.routeCode }}
                                </el-tag>
                            </div>
                        </div>
                    </div>
                    <div v-else>
                        <el-tag type="warning">暂无数据</el-tag>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="创建日期" prop="createTime">

            </el-table-column>
            <el-table-column label="最新修改日期" prop="updateTime"></el-table-column>
            <el-table-column fixed="right" label="Operations" min-width="120">
                <template #default="{ row }">
                    <el-button link type="primary" @click="viewTask(row.taskKey)">
                        查看
                    </el-button>
                </template>
            </el-table-column>

        </el-table>

        <el-dialog v-model="showAddRoute">
            <div v-for="(form, index) in addRouteForms" :key="index"
                style="border-bottom: 1px solid #eee; padding: 10px 0">
                <el-form ref="formRef" :model="form" label-width="100px">
                    <el-form-item label="航季">
                        <SeasonSelect v-model="form.season" />
                    </el-form-item>
                    <el-form-item label="起飞机场">
                        <AirportAutocomplete v-model="form.departure" @select="handleDepartureSelect" />
                    </el-form-item>
                    <el-form-item label="目的机场">
                        <AirportAutocomplete v-model="form.arrival" @select="handleDepartureSelect" />

                    </el-form-item>

                    <el-form-item label="航路">
                        <el-input v-model="form.ATSroute" placeholder="航路" />
                    </el-form-item>
                    <el-form-item label="航线代码">
                        <el-input v-model="form.routeCode" placeholder="航线代码" />
                    </el-form-item>
                    <el-form-item label="飞越国家">
                        <el-select v-model="form.overflyCountry" multiple filterable remote :reserve-keyword="false"
                            placeholder="飞越国家" :remote-method="countrySearch" :loading="loadingCountries"
                            class="inline-input w-50">
                            <el-option v-for="item in countryOptions" :key="item.country" :label="item.country"
                                :value="item.country" />
                        </el-select>
                    </el-form-item>
                </el-form>

            </div>
            <div style="margin: 10px 0">
                <el-button type="primary" :icon="Plus" @click="addRow">
                    <el-icon class="el-icon--right">
                        <Plus />
                    </el-icon>
                    添加一行航路</el-button>
            </div>

            <div style="text-align: right">
                <el-button type="primary" @click="onSubmit">创建</el-button>
            </div>

        </el-dialog>
        <el-dialog v-model="showTask" width="1400"
            :title="viewData?.taskName ? viewData?.taskName : viewData?.createTime + '创建的任务'">
            <template v-if="loading">
                <div style="text-align:center; padding: 100px 0;">
                    <el-spinner type="circle" />
                    <p>加载中...</p>
                </div>
            </template>
            <template v-else-if="viewData">

                <el-tabs v-model="clickCountry" @tab-click="changeCountry">

                    <el-tab-pane v-for="(item) in viewData?.data" :key="item.taskKey">
                        <template #label>
                            <span>
                                {{ item.overflyCountry || '未知国家' }}

                                <el-tag v-if="!viewData.applyData?.[item.overflyCountry]" type="danger" size="small"
                                    effect="plain">未制作申请件</el-tag>
                                <el-tag
                                    v-if="viewData.applyData?.[item.overflyCountry] && !viewData.applyData?.[item.overflyCountry]?.checkTime"
                                    type="warning" size="small" effect="plain">已制作申请件未校核</el-tag>
                                <el-tag
                                    v-if="viewData.applyData?.[item.overflyCountry]?.checkTime && !viewData.applyData?.[item.overflyCountry].applyTime"
                                    type="warning" size="small" effect="plain">已校核未申请</el-tag>
                                <el-tag
                                    v-if="viewData.applyData?.[item.overflyCountry]?.applyTime && !viewData.permitData?.[item.overflyCountry]"
                                    type="warning" size="small" effect="plain">已申请未批复</el-tag>
                                <el-tag v-if="viewData?.permitData" type="success" size="small"
                                    effect="plain">已批复</el-tag>
                            </span>
                        </template>
                        <div>
                            <el-divider>航班列表</el-divider>
                            <div>
                                <el-button type="primary" @click="applyFullCycle" round :plain="!useFullCycleStatus">
                                    <el-icon>
                                        <Pointer v-if="!useFullCycleStatus" />
                                        <RefreshLeft v-else />
                                    </el-icon>
                                    {{
                                        useFullCycleStatus ? '还原原周期申请' :
                                            '使用全周期申请' }}</el-button>
                                <el-button type="success" @click="applyAllAircraft" round
                                    :plain="!useAllAircraftTypesStatus">
                                    <el-icon>
                                        <Pointer v-if="!useAllAircraftTypesStatus" />
                                        <RefreshLeft v-else />
                                    </el-icon>
                                    {{ useAllAircraftTypesStatus ? '还原原机型申请' :
                                        '使用全机型申请' }}</el-button>


                            </div>

                            <el-table :data="item.flightList" size="small" border>
                                <el-table-column label="性质">
                                    <template #default="{ row }">
                                        {{ row.attribution }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="航班号">
                                    <template #default="{ row }">
                                        {{ row.flightNumber }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="开始时间">
                                    <template #default="{ row }">
                                        {{ row.startDate }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="结束时间">
                                    <template #default="{ row }">
                                        {{ row.endDate }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="周期">
                                    <template #default="{ row }">
                                        <div v-if="Array.isArray(row.days)">
                                            {{ row.days.join('') }}
                                        </div>
                                        <div v-else>
                                            {{ row.days }}
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="起飞机场">
                                    <template #default="{ row }">
                                        {{ row.departure }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="起飞时间">
                                    <template #default="{ row }">
                                        {{ row.departureTime }}
                                        <div>

                                            <el-tag type="info">UTC {{
                                                formatTimeWithoutColon(beijingToUTC(row.departureTime)) }}</el-tag>

                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="落地机场">
                                    <template #default="{ row }">
                                        {{ row.arrival }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="落地时间">
                                    <template #default="{ row }">
                                        {{ row.arrivalTime }}
                                        <div>
                                            <el-tag type="info">UTC {{ formatTimeWithoutColon(
                                                beijingToUTC(row.arrivalTime)) }}</el-tag>
                                        </div>
                                    </template>
                                </el-table-column>
                                <el-table-column label="机型">
                                    <template #default="{ row }">
                                        {{ row.aircraftType }}
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                        <div>
                            <el-divider>航路列表</el-divider>
                            <el-button v-if="curCountry == '越南'" type="success"
                                @click="applyExtractRoutes">提取成该国申请格式航路</el-button>

                            <overflyDataView :overflyDataFromFather="item.overflyDetails" />
                        </div>
                        <el-divider>飞越申请</el-divider>
                        <div>
                            <el-row :gutter="20">
                                <!-- 申请文件 -->
                                <el-col :span="12">
                                    <el-card shadow="hover" class="rounded-xl p-4" style="min-height: 400px;">
                                        <template #header>
                                            <div class="flex items-center text-lg font-semibold">
                                                <el-icon class="mr-2">
                                                    <Document />
                                                </el-icon>
                                                <span>申请工作</span>
                                            </div>
                                        </template>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="display: flex;">
                                            <!-- 已制作文件 -->
                                            <div>
                                                <el-timeline>

                                                    <el-timeline-item
                                                        v-bind="getTimelineNode(!!(viewData?.applyData?.[curCountryData?.overflyCountry]?.uploadTime), currentStep === 'upload')"
                                                        :class="getTimelineNode(!!(viewData?.applyData?.[curCountryData?.overflyCountry]?.uploadTime), currentStep === 'upload').class"
                                                        :timestamp="viewData?.applyData?.[curCountryData?.overflyCountry]?.uploadTime">
                                                        
                                                        申请件制作阶段
                                                        <el-tag effect="dark"
                                                            :type="viewData?.applyData?.[curCountryData.overflyCountry]?.uploadTime ? 'success' : 'danger'">
                                                            当前状态：{{
                                                                viewData.applyData?.[curCountryData.overflyCountry]?.uploadTime
                                                                    ? '已制作' :
                                                                    '暂未制作'
                                                            }}
                                                        </el-tag>
                                                        <div
                                                            v-if="viewData?.applyData?.[curCountryData.overflyCountry]">
                                                            <!-- <el-tag effect="dark" type="primary" size="large"
                                                                class="text-base font-semibold mb-2">已制作的文件</el-tag> -->

                                                            <fileView
                                                                :file="viewData?.applyData?.[curCountryData.overflyCountry]"
                                                                :loading="false"
                                                                @click="previewFile(viewData?.applyData?.[curCountryData.overflyCountry])" />

                                                        </div>

                                                        <el-button @click="reMakeApply">{{ needMakeApplyDoc ? '关闭制作区' :
                                                            '展开制作区'
                                                            }}</el-button>

                                                        <div v-if="needMakeApplyDoc" class="applyDocWindow"
                                                            style="display: flex;flex-direction: row;">
                                                            <div>
                                                                <el-upload action="#" :show-file-list="false"
                                                                    class="w-full">
                                                                    <el-button type="success" icon="Upload"
                                                                        class="mt-3">
                                                                        上传飞越申请件
                                                                    </el-button>
                                                                </el-upload>
                                                            </div>
                                                            <el-divider direction="vertical" style="height: 200px;" />
                                                            <div>
                                                                <div>
                                                                    <el-button type="primary" icon="EditPen"
                                                                        @click="createApplyDoc('schedule', 'add')"
                                                                        plain>
                                                                        点击制作申请件
                                                                    </el-button>
                                                                </div>
                                                                <div>
                                                                    <el-tag type="info" size="large"
                                                                        class="text-base font-semibold mb-2">匹配的模板文件</el-tag>

                                                                    <fileView :file="curCountryInfo?.scheduleTemplate"
                                                                        :loading="false"
                                                                        @click="previewFile(curCountryInfo?.scheduleTemplate)" />
                                                                </div>


                                                            </div>


                                                        </div>
                                                    </el-timeline-item>
                                                    <el-timeline-item
                                                        v-bind="getTimelineNode(!!(viewData?.applyData?.[curCountryData?.overflyCountry]?.checkTime), currentStep === 'check')"
                                                        :class="getTimelineNode(!!(viewData?.applyData?.[curCountryData?.overflyCountry]?.checkTime), currentStep === 'check').class"
                                                        :timestamp="viewData?.applyData?.[curCountryData?.overflyCountry]?.checkTime">
                                                        
                                                        申请件核对阶段
                                                        <div>
                                                            <el-tag effect="dark"
                                                                :type="viewData?.applyData?.[curCountryData.overflyCountry]?.checkTime ? 'success' : 'danger'">
                                                                当前状态：{{
                                                                    viewData?.applyData?.[curCountryData.overflyCountry]?.checkTime
                                                                        ?
                                                                        '校核通过' : '未校核'
                                                                }}
                                                            </el-tag>

                                                            <el-text
                                                                v-if="viewData?.applyData?.[curCountryData.overflyCountry]?.checkTime">
                                                                核对时间：{{
                                                                    formatTime(viewData?.applyData?.[curCountryData.overflyCountry].checkTime)
                                                                }}
                                                            </el-text>
                                                        </div>
                                                        <el-button
                                                            v-if="!viewData?.applyData?.[curCountryData.overflyCountry]?.checkTime"
                                                            type="warning" @click="checkApplyData(viewData)">
                                                            核对
                                                        </el-button>
                                                    </el-timeline-item>
                                                    <el-timeline-item
                                                        v-bind="getTimelineNode(!!viewData?.applyData?.sendTime, currentStep === 'send')"
                                                        :class="getTimelineNode(!!viewData?.applyData?.sendTime, currentStep === 'send').class"
                                                        :timestamp="viewData?.applyData?.sendTime">
                                                        <div>
                                                            <div>申请件发送阶段</div>
                                                            <el-tag effect="dark"
                                                                :type="viewData?.applyData?.sendTime ? 'success' : 'danger'">
                                                                当前状态：{{ viewData?.applyData?.sendTime ? '已发送' : '未发送' }}
                                                                <el-text v-if="viewData?.applyData?.sendTime">
                                                                    发送时间：{{ formatTime(viewData?.applyData?.sendTime) }}
                                                                </el-text>
                                                            </el-tag>

                                                        </div>
                                                        <el-button v-if="!viewData?.applyData?.sendTime" type="primary"
                                                            icon="Finished" plain class="mt-3"
                                                            @click="sendApply(viewData)">
                                                            点击发送申请
                                                        </el-button>
                                                    </el-timeline-item>

                                                </el-timeline>

                                            </div>

                                            <!-- 模板文件 + 操作 -->

                                        </div>

                                    </el-card>

                                    <applyDoc v-model:show="showCreateApplyDoc" :curCountryInfo="curCountryInfo"
                                        :curCountryData="curCountryData" :curTaskData="viewData" attribution="schedule"
                                        @closed="refreshTaskList" />
                                </el-col>

                                <!-- 批复文件 -->
                                <el-col :span="12">
                                    <el-card shadow="hover" class="rounded-xl" style="min-height: 400px;">
                                        <template #header>
                                            <div class="card-header text-lg font-semibold">
                                                <el-icon class="mr-2">
                                                    <DocumentChecked />
                                                </el-icon>
                                                <span>批复文件</span>
                                            </div>
                                        </template>

                                        <div class="flex flex-col gap-4">
                                            <div v-if="!viewData.permissionData">
                                                <el-empty description="暂未获得批复" image-size="50" />

                                                <el-button type="success" icon="Upload" @click="showPermissionMatch">
                                                    上传飞越批复文件
                                                </el-button>
                                            </div>
                                            <div v-else>
                                                <div v-for="data in viewData.permissionData" :key="data.country"
                                                    class="mb-6 p-4 border rounded-lg shadow-sm">
                                                    <div class="mb-2 font-bold text-lg">
                                                        飞越国家：{{ data.country }} &nbsp;|&nbsp; 批复号：{{
                                                            data.permissionNumber }}
                                                    </div>

                                                    <!-- 显示关联航班 -->
                                                    <div class="mb-2">
                                                        <div class="font-semibold">关联航班：</div>
                                                        <el-table :data="data.relateData.applyFlight || []"
                                                            style="width: 100%; margin-top: 4px" height="150"
                                                            size="small">
                                                            <el-table-column prop="flightNumber" label="航班号" />
                                                        </el-table>
                                                    </div>

                                                    <!-- 显示批复内容（航线） -->
                                                    <div class="mb-2">
                                                        <div class="font-semibold">批复内容：</div>
                                                        <el-table :data="data.fileData.permitFlight || []"
                                                            style="width: 100%; margin-top: 4px" height="150"
                                                            size="small">
                                                            <el-table-column prop="flightNumber" label="航班号" />
                                                            <el-table-column prop="departure" label="起飞机场" />
                                                            <el-table-column prop="arrival" label="目的机场" />
                                                        </el-table>
                                                        <el-table :data="data.fileData.permitRoute || []"
                                                            style="width: 100%; margin-top: 4px" height="150"
                                                            size="small">
                                                            <el-table-column prop="ATSroute" label="航线" />
                                                            <el-table-column prop="entryPoint" label="入境点" />
                                                            <el-table-column prop="exitPoint" label="出境点" />
                                                        </el-table>
                                                    </div>

                                                    <!-- 查看文件按钮 -->
                                                    <el-button type="info" icon="View" plain
                                                        @click="viewPermitFile(data.fileName, data.url)">
                                                        点击查看批复文件
                                                    </el-button>
                                                </div>
                                            </div>

                                            <permissionMatch :taskKey="viewData.taskKey"
                                                v-model:visible="permissionMatchVisible"
                                                @upload-success="refreshTaskList" />
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>
                        </div>
                        <filePreview :file="currentFile" v-model:visible="previewVisible"
                            @extract-fields="onFieldsExtracted" />

                    </el-tab-pane>

                </el-tabs>
            </template>


        </el-dialog>

    </div>


</template>
<script setup>
// import { taskListInServer } from '../api';
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, getTaskList, baseFileURL, deleteTaskByIds, updateTaskList } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw, watchEffect } from 'vue'
import { getLastSunday, calculateSeasons } from '../utils/seasonCalculator'
import { ElMessage, ElMessageBox } from 'element-plus'
import SeasonSelect from '../utils/seasonSelect.vue'
import AirportAutocomplete from '../utils/airportAutocomplete.vue'
import { useAirportSearch } from '../components/useAirportUtils'
import filePreview from '../utils/filePreview.vue';
import applyDoc from '../utils/applyDoc.vue'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver'
import { fixEncoding } from '../utils/fileNameEncode.js'
import { formatTime } from '../utils/tool.js'
import fileView from '../utils/fileView.vue'
import { CircleCheckFilled, MoreFilled } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import Searcher from '../utils/searcher.vue'
import permissionMatch from '../utils/permissionMatch.vue'
import { beijingToUTC, formatTimeWithoutColon } from '../utils/timeTransfer.js';
import overflyDataView from '../utils/overflyDataView.vue'

const countryList = ref()
const selectedTask = ref([])
const taskListInServer = ref()
const curCountry = ref()
const viewData = ref()
const showTask = ref(false)
const curCountryInfo = ref()
const previewVisible = ref(false)
const permissionMatchVisible = ref(false)
const currentFile = ref(null)
const templateFields = ref([])
const showCreateApplyDoc = ref(false)
const needMakeApplyDoc = ref(true)
const taskLoading = ref(false)
const filteredTasks = ref([])

const route = useRoute()
const steps = [
    { key: 'uploadTime', label: '申请件制作' },
    { key: 'checkTime', label: '双校核' },
    { key: 'sendTime', label: '发送申请' }
]
const stepStatus = computed(() =>
    steps.map((step, index) => {
        const done = !!viewData.value.applyData?.[step.key]
        const isCurrent =
            !done &&
            (index === 0 || !!viewData.value.applyData?.[steps[index - 1].key])

        return {
            ...step,
            done,
            isCurrent,
            icon: done ? CircleCheckFilled : MoreFilled,
            color: done
                ? 'var(--el-color-success)'
                : isCurrent
                    ? 'var(--el-color-danger)'
                    : '#dcdfe6'
        }
    })
)

const currentStep = computed(() => {
    if (!viewData?.value?.applyData) return 'upload'

    if (!viewData?.value?.applyData[curCountry.value]?.uploadTime) return 'upload'
    if (!viewData?.value?.applyData[curCountry.value]?.checkTime) return 'check'
    if (!viewData?.value?.applyData[curCountry.value]?.sendTime) return 'send'
    return 'done'
})

const getTimelineNode = (done, isCurrent) => {
    console.log('done', done, 'isCurrent', isCurrent)
    if (done) {
        return {
            icon: CircleCheckFilled,
            type: 'primary',
            size: 'large',
            color: '#67C23A', // 绿色
            class: ''
        }
    } else if (isCurrent) {
        return {
            // icon: MoreFilled,
            size: 'large',

            color: '#409EFF', // 红色
            // class: 'icon-flash', // 闪烁动画
            hollow: true,
        }
    } else {
        return {
            size: 'large',

            icon: MoreFilled,
            color: '#C0C4CC', // 灰色
            class: ''
        }
    }
}

const addTask = () => {
    showAddTask.value = true
}
const handleSelectionChange = (selection) => {
    selectedTask.value = selection
}

const handleBatchDelete = async () => {
    if (selectedTask.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定删除选中的 ${selectedTask.value.length} 条任务数据？`,
            '警告',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 假设每条航路有唯一的 id 字段
        const idsToDelete = selectedTask.value.map(item => item.id)
        console.log('idsToDelete', idsToDelete)
        // 调用后端接口进行删除
        await deleteTaskByIds(idsToDelete)
        selectedTask.value = []
        const newTaskResponse = await getTaskList();
        if (newTaskResponse?.data) {
            taskListInServer.value = newTaskResponse.data;
            ElMessage.success('删除成功')
        }

    } catch (err) {
        console.log('批量删除错误')
    }
}
const curCountryData = ref()
const viewTask = async (key) => {
    taskLoading.value = true
    showTask.value = true
    console.log('taskListInServer', taskListInServer)

    console.log('key', key)
    const foundTask = taskListInServer.value?.find(item => item.taskKey === key)
    console.log('找到对应的任务', foundTask)
    if (!foundTask) {
        console.warn('找不到对应任务', key)
        viewData.value = null
        curCountryData.value = null
        curCountry.value = null
        curCountryInfo.value = null
        needMakeApplyDoc.value = true
        showTask.value = false
        taskLoading.value = false
        return
    }

    viewData.value = dedupeViewData(foundTask)
    console.log('viewData', viewData.value)
    // console.log('dedupeViewData',dedupeViewData(viewData.value))

    if (!foundTask.data || !Array.isArray(foundTask.data) || foundTask.data.length === 0) {
        console.warn('任务数据无效或为空', foundTask.data)
        curCountryData.value = null
        curCountry.value = null
        curCountryInfo.value = null
        needMakeApplyDoc.value = foundTask.applyData ? false : true
        taskLoading.value = false
        return
    }
    //设置默认第一个数据
    curCountryData.value = dedupeViewData(foundTask).data[0]
    console.log('当前国家申请数据curCountryData', curCountryData.value)

    curCountry.value = curCountryData.value.overflyCountry || null
    console.log('curCountry.value',curCountry.value)
    if (curCountry.value && countryList.value) {
        curCountryInfo.value = countryList.value.find(item => item.country == curCountry.value)
        console.log('当前国家信息curCountry', curCountryInfo.value)
    } else {
        curCountryInfo.value = null
    }

    needMakeApplyDoc.value = foundTask.applyData ? false : true

    taskLoading.value = false
}

function dedupeOverflyDetails(overflyDetails) {
    const seen = new Set();
    return overflyDetails.filter(detail => {
        // 也可以换成 detail.sector 或者 detail.entryPoint+exitPoint
        const key = `${detail.sector}-${detail.ATSroute}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

/**
 * 对 viewData 中的每一条数据做去重
 * @param {Object} viewData 
 * @returns {Object} 新的 viewData
 */
function dedupeViewData(viewData) {
    if (!viewData || !Array.isArray(viewData.data)) return viewData;

    const newData = viewData.data.map(item => {
        if (Array.isArray(item.overflyDetails)) {
            return {
                ...item,
                overflyDetails: dedupeOverflyDetails(item.overflyDetails)
            };
        }
        return item;
    });

    return { ...viewData, data: newData };
}
function applyExtractRoutes() {
    viewData.value = extractRoutes(viewData.value);
    //重新赋值申请数据
    console.log('点击提取航路的viewData', viewData)

    // curCountryData.value = viewData.value.data[0]

}
function extractRoutes(viewData) {
    if (!viewData || !Array.isArray(viewData.data)) return viewData;

    // 正则表达式：匹配字母和2-3位数字
    const routePattern = /\b[A-Z]{1,3}\d{2,3}\b/g;
    console.log('需要提取的viewData', viewData)
    console.log('curCountryInfo.country', curCountryInfo.value.country)

    const newData = viewData.data.map(item => {
        if (item.overflyCountry === curCountryInfo.value.country && Array.isArray(item.overflyDetails)) {
            return {
                ...item,
                overflyDetails: item.overflyDetails.map(route => {
                    // 提取符合格式的航路信息，并以逗号分隔
                    const matchedRoutes = route.ATSroute.match(routePattern);
                    return {
                        ...route,
                        ATSroute: matchedRoutes ? matchedRoutes.join(',') : ''
                    };
                })
            };
        }
        return item;
    });

    return { ...viewData, data: newData };
}

// 使用全周期申请：修改 days
function useFullCycle(viewData) {
    if (!viewData || !Array.isArray(viewData.data)) return viewData;
    // console.log('使用全周期viewData',viewData)
    const newData = viewData.data.map(item => {
        if (Array.isArray(item.flightList)) {
            return {
                ...item,
                flightList: item.flightList.map(flight => ({
                    ...flight,
                    days: "1234567"
                }))
            };
        }
        return item;
    });

    return { ...viewData, data: newData };
}

// 使用全机型申请：修改 aircraftTypes
function useAllAircraftTypes(viewData) {
    if (!viewData || !Array.isArray(viewData.data)) return viewData;

    const newData = viewData.data.map(item => {
        if (Array.isArray(item.flightList)) {
            return {
                ...item,
                flightList: item.flightList.map(flight => ({
                    ...flight,
                    aircraftType: "B737/B738/B7M8/A21N/B788/B789"
                })),
                aircraftTypeAll: "B737/B738/B7M8/A21N/B788/B789"
            };
        }
        return item;
    });

    return { ...viewData, data: newData };
}
const useFullCycleStatus = ref(false)
const useFullCycleRecord = ref(null)
function applyFullCycle() {
    if (useFullCycleStatus.value === false) {
        console.log('使用全周期')
        useFullCycleRecord.value = viewData.value
        viewData.value = useFullCycle(viewData.value);

        useFullCycleStatus.value = true
    } else {
        console.log('回到原周期')

        viewData.value = useFullCycleRecord.value
        useFullCycleRecord.value = null
        useFullCycleStatus.value = false

    }
    //重新赋值申请数据
    console.log('点击全周期的viewData', viewData)

    curCountryData.value = viewData.value.data[0]

}
const useAllAircraftTypesStatus = ref(false)
const useAllAircraftTypesRecord = ref(null)
function applyAllAircraft() {
    if (useAllAircraftTypesStatus.value === false) {
        console.log('使用全周期')
        useAllAircraftTypesRecord.value = viewData.value
        viewData.value = useAllAircraftTypes(viewData.value);

        useAllAircraftTypesStatus.value = true
    } else {
        console.log('回到原周期')

        viewData.value = useAllAircraftTypesRecord.value
        useAllAircraftTypesRecord.value = null
        useAllAircraftTypesStatus.value = false

    }
    console.log('点击全机型的viewData', viewData)
    curCountryData.value = viewData.value.data[0]

}


const handleClick = (tab, event) => {
    console.log(tab, event)
}
const clickCountry = ref()
const changeCountry = (country) => {
    const index = clickCountry.value
    const selectedItem = viewData.value.data[index];
    console.log('点击后的country', selectedItem)
    //当前国家申请数据
    curCountry.value = selectedItem.overflyCountry
    curCountryData.value = selectedItem
    curCountryInfo.value = countryList.value.find(item => item.country == curCountry.value)
    console.log('切换后的国家申请数据', curCountryData.value)
}
const createApplyDoc = (attribution, type) => {
    showCreateApplyDoc.value = true
    console.log('showCreateApplyDoc', showCreateApplyDoc)

}
function isFullUrl(url) {
    return /^http?:\/\//.test(url)
}

const previewFile = (file) => {
    console.log('file', file)
    let fullUrl = file.url
    if (!isFullUrl(file.url)) {
        fullUrl = baseFileURL + file.url
    }
    currentFile.value = {
        ...toRaw(file),
        url: fullUrl,
        source: 'net',
    }
    console.log('currentFile', currentFile)
    previewVisible.value = true
}

const viewPermitFile = (name, url) => {
    currentFile.value = null
    let fullUrl = url
    if (!isFullUrl(url)) {
        fullUrl = baseFileURL + url
    }
    currentFile.value = {
        // ...toRaw(file),
        name,
        url: fullUrl,
        source: 'net',
    }
    console.log('currentFile', currentFile)
    previewVisible.value = true
}
const showPermissionMatch = () => {
    permissionMatchVisible.value = true
}
const onFieldsExtracted = (fields) => {
    console.log('提取出的模板字段:', fields)
    templateFields.value = fields
}
const handleUploadSuccess = (res, key) => {
    editCountryData.value[key] = {
        name: res.name,
        url: res.url
    }
}
const refreshTaskList = async () => {
    const res = await getTaskList();
    if (res?.data) {
        taskListInServer.value = res.data;
        if (viewData.value?.taskKey) {
            const updatedTask = taskListInServer.value.find(
                item => item.taskKey === viewData.value.taskKey
            );
            if (updatedTask) {
                viewData.value = dedupeViewData(updatedTask);
                // 同时更新 curCountryData 等依赖
                curCountryData.value = updatedTask.data.find(
                    d => d.overflyCountry === curCountry.value
                );
            }
        }
        console.log('taskListInServer', taskListInServer)
    }
}
const checkApplyData = async (task) => {
    console.log('task', task)
    const temCountry = curCountryData.value.overflyCountry
    console.log('task.applyData[curCountryData.overflyCountry]', task.applyData[temCountry])

    if (!task || !task.id || !task.taskKey || !task.applyData[temCountry]) return;

    // const applyData = { ...task.applyData[temCountry] };
    // console.log('applyData',applyData)
    task.applyData[temCountry].checkTime = new Date().toISOString(); // 添加检查时间
    console.log('task.applyData', JSON.stringify(task.applyData))

    const formData = new FormData();
    formData.append('id', task.id);
    formData.append('taskKey', task.taskKey);
    formData.append('country', temCountry);

    formData.append('applyData', JSON.stringify(task.applyData)); // 包含 checkTime 的 applyData
    formData.append('action', 'updateApplyData');
    try {
        const res = await updateTaskList(formData);
        if (res.data.success) {
            ElMessage.success('已校对');
            refreshTaskList()
        }
    } catch (err) {
        console.error('检查失败:', err);
        ElMessage.error('检查失败，请稍后重试');
    }
};

const sendApply = async (task) => {
    if (!task || !task.id || !task.taskKey || !task.applyData) return;
    const applyData = { ...task.applyData };
    applyData.sendTime = new Date().toISOString(); // 添加检查时间

    const formData = new FormData();
    formData.append('id', task.id);
    formData.append('taskKey', task.taskKey);
    formData.append('applyData', JSON.stringify(applyData)); // 包含 checkTime 的 applyData

    try {
        const res = await updateTaskList(formData);
        if (res.data.success) {
            ElMessage.success('已发送申请件');
            refreshTaskList()
        }
    } catch (err) {
        console.error('检查失败:', err);
        ElMessage.error('检查失败，请稍后重试');
    }

}
const reMakeApply = () => {
    needMakeApplyDoc.value = !needMakeApplyDoc.value
}
const taskListLoaded = ref(false)

onMounted(async () => {
    try {
        // const flightResponse = await getFlights();
        // await loadFlightData()
        const taskResponse = await getTaskList();
        taskListInServer.value = taskResponse.data
        console.log('获取的taskListInServer', taskListInServer)
        filteredTasks.value = taskListInServer.value
        const countryResponse = await getCountryRules()
        countryList.value = countryResponse.data
        taskListLoaded.value = true
        console.log('taskListLoaded', taskListLoaded)


    } catch (error) {
        console.error('API error:', error);
    }
});
watchEffect(() => {
    if (taskListLoaded.value && route.query.taskKey) {
        viewTask(route.query.taskKey)
    }
})
</script>

<style scoped>
.icon-flash {
    animation: flash 1s infinite;
}

@keyframes flash {

    0%,
    50%,
    100% {
        opacity: 1;
    }

    25%,
    75% {
        opacity: 0;
    }
}


.full-cycle-btn {
    border-radius: 20px;
    font-weight: bold;
    min-width: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.full-cycle-btn:hover {
    transform: scale(1.05);
}

.btn-icon {
    margin-right: 6px;
    transition: transform 0.3s ease, color 0.3s ease;
}

.btn-text {
    transition: transform 0.2s ease;
}

/* 图标淡入淡出动画 */
.icon-fade-enter-active,
.icon-fade-leave-active {
    transition: opacity 0.3s, transform 0.3s;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
    opacity: 0;
    transform: scale(0.8);
}

.current-node {
    color: #409EFF !important;
    /* Element Plus 主蓝色 */
    /* transform: scale(1.3); */
}

.applyDocWindow {
    border: 1px solid #e5e7eb;
    /* 更柔和的灰色边框 */
    border-radius: 12px;
    background-color: #fdfdfd;
    padding: 20px;
    transition: box-shadow 0.2s;
    width: 100%;
    min-height: 200px;
    margin: 2%;
}

.text {
    min-height: 100px;
}

.applyDocWindow:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.card-header {
    display: flex;
    align-items: center;
}

.day-tag {
    margin-right: 5px;
    margin-bottom: 5px;
}

.el-row {
    margin-bottom: 20px;
}

.el-button {
    margin-top: 10px;
}

.search-container {
    background-color: #f7f8fa;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
}

.search-input {
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    margin-top: 10px;
}

.search-input:focus {
    border-color: #409eff;
    box-shadow: 0 1px 8px rgba(0, 123, 255, 0.2);
}

.search-button {
    background-color: #409eff;
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 14px;
    margin-top: 20px;
    transition: background-color 0.3s ease;
}

.search-button:hover {
    background-color: #66b1ff;
}

.add-button-box {
    width: 100%;
    /* height: 100px; */
    /* position: absolute; */
    /* bottom: 5%; */
    display: flex;
    /* justify-content: center; */
    margin-left: 20px;
    align-items: center;
    z-index: 999;
}

.add-button {
    /* margin: auto; */
}

.el-tag {
    margin: 2px 4px;
}
</style>