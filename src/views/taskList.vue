<template>
    <div>
        <!-- 搜索框 -->
        <Searcher mode="task" :list="taskListInServer" @update:result="filteredTasks = $event" />

        <div class="add-button-box">
            <!-- <el-button type="primary" @click="addTask" class="add-button">新增任务</el-button> -->
            <el-button type="danger" :disabled="selectedTask.length === 0" @click="handleBatchDelete">
                批量删除
            </el-button>
        </div>

        <!-- 搜索结果表格 -->
        <el-table :data="filteredTasks" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column label="申请任务ID" prop="id"></el-table-column>
            <el-table-column label="申请任务名" prop="taskName"></el-table-column>

            <el-table-column label="申请任务key" prop="taskKey"></el-table-column>
            <el-table-column label="任务内容">
                <template #default="{ row }">
                    <div v-if="Array.isArray(row.data)">
                        <div v-for="(item, idx) in row.data" :key="idx">
                            <div v-if="Array.isArray(item.flightList)">
                                <el-tag v-for="(flight, index) in item.flightList" :key="index" class="mr-1 mb-1"
                                    type="info">
                                    {{ flight.flightNumber }}/{{ item.overflyCountry }}
                                </el-tag>
                                <!-- <el-tag v-for="(route, index) in item.routeList" :key="index" class="mr-1 mb-1"
                                    type="info">
                                    {{ route.routeCode }}
                                </el-tag> -->
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
            <el-table-column fixed="right" label="操作" min-width="120">
                <template #default="{ row }">
                    <el-button type="primary" @click="viewTask(row.taskKey)">
                        进入任务
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
        <el-dialog v-model="showTask" width="1400">
            <template #title>
                <span>
                    {{ viewData?.taskName ? viewData?.taskName : viewData?.createTime + '创建的任务' }}
                    <el-tag type="success" size="small" class="ml-2">{{ viewData.data.length }}个国家</el-tag>
                </span>
            </template>
            <template v-if="loading">
                <div style="text-align:center; padding: 100px 0;">
                    <el-spinner type="circle" />
                    <p>加载中...</p>
                </div>
            </template>
            <!-- 制作任务详情的弹窗 -->
            <template v-else-if="viewData">

                <el-tabs v-model="clickCountry" @tab-click="changeCountry">

                    <el-tab-pane v-for="(item) in viewData?.data" :key="item.taskKey">
                        <template #label>
                            <span>
                                {{ item.overflyCountry || '未知国家' }}
                                <!-- tab的标签 -->
                                <el-tag v-if="!viewData.applyData?.[item.overflyCountry]" type="danger" size="small"
                                    effect="plain">未制作申请件</el-tag>
                                <el-tag
                                    v-if="viewData.applyData?.[item.overflyCountry]?.uploadTime && !viewData.applyData?.[item.overflyCountry]?.checkTime"
                                    type="warning" size="small" effect="plain">已制作申请件未校核</el-tag>
                                <el-tag
                                    v-if="viewData.applyData?.[item.overflyCountry]?.checkTime && !viewData.applyData?.[item.overflyCountry]?.sendTime"
                                    type="warning" size="small" effect="plain">已校核未申请</el-tag>
                                <el-tag
                                    v-if="viewData.applyData?.[item.overflyCountry]?.sendTime && !viewData?.permissionData?.[item.overflyCountry]"
                                    type="warning" size="small" effect="plain">已申请未批复</el-tag>
                                <el-tag
                                    v-if="viewData?.permissionData?.[item.overflyCountry] && viewData.applyData?.[item.overflyCountry]?.sendTime"
                                    type="success" size="small" effect="plain">已批复</el-tag>
                            </span>
                        </template>
                        <div>
                            <el-divider>航班列表<el-tag>{{ item.flightList.length }}条</el-tag></el-divider>
                            <!-- <el-segmented v-model="selectAttribution" :options="attributionOption"
                                        @change="changeAttribution" size="large"></el-segmented> -->
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
                                <div class="custom-style">

                                    <el-segmented v-model="useAircraftOption" :options="aircraftOptions"
                                        @change="useChooseAircraft" size="large" />
                                </div>




                            </div>

                            <el-table :data="item.flightList" size="small" border
                                style="max-height: 600px;overflow-y: scroll;">
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
                            <el-divider>航路列表<el-tag>{{ item.overflyDetails.length }}条</el-tag></el-divider>
                            <el-button v-if="curCountry == '越南'" type="success" @click="applyExtractRoutes">
                                <el-icon>
                                    <Pointer v-if="!extractStatus" />
                                    <RefreshLeft v-else />
                                </el-icon>
                                提取成该国申请格式航路</el-button>

                            <overflyDataView mode="temp" :overflyDataFromFather="item.overflyDetails"
                                @updateFinish="refreshOverflyData" />
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
                                                        v-bind="getTimelineNode(!!viewData?.applyData?.[curCountryData.overflyCountry]?.sendTime, currentStep === 'send')"
                                                        :class="getTimelineNode(!!viewData?.applyData?.[curCountryData.overflyCountry]?.sendTime, currentStep === 'send').class"
                                                        :timestamp="viewData?.applyData?.sendTime">
                                                        <div>
                                                            <div>申请件发送阶段</div>
                                                            <el-tag effect="dark"
                                                                :type="viewData?.applyData?.[curCountryData.overflyCountry]?.sendTime ? 'success' : 'danger'">
                                                                当前状态：{{
                                                                    viewData?.applyData?.[curCountryData.overflyCountry]?.sendTime
                                                                        ?
                                                                        '已发送' : '未发送' }}

                                                            </el-tag>
                                                            <el-text v-if="viewData?.applyData?.sendTime">
                                                                发送时间：{{
                                                                    formatTime(viewData?.applyData?.[curCountryData.overflyCountry]?.sendTime)
                                                                }}
                                                            </el-text>
                                                        </div>
                                                        <el-button
                                                            v-if="!viewData?.applyData?.[curCountryData.overflyCountry]?.sendTime"
                                                            type="primary" icon="Finished" plain class="mt-3"
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
                                        @close="handleApplyClose" />
                                </el-col>

                                <!-- 批复文件 -->
                                <el-col :span="12">
                                    <el-card shadow="hover" class="rounded-xl" style="min-height: 400px;">
                                        <template #header>
                                            <div class="card-header text-lg font-semibold">
                                                <el-icon class="mr-2">
                                                    <DocumentChecked />
                                                </el-icon>
                                                <span>{{curCountry}}批复文件</span>
                                            </div>
                                        </template>

                                        <div class="flex flex-col gap-4">
                                            <div v-if="!viewData?.permissionData?.[curCountry]">
                                                <el-empty description="暂未获得批复" image-size="50" />

                                                <el-button type="success" icon="Upload" @click="showPermissionMatch">
                                                    上传并匹配飞越批复文件
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
                                                        <div style="text-align: left;font-weight: bold;"
                                                            class="font-semibold">关联航班</div>
                                                        <el-table :data="data.relateData.applyFlight || []"
                                                            style="width: 100%; margin-top: 4px" height="150"
                                                            size="small">
                                                            <el-table-column prop="flightNumber" label="航班号" />
                                                            <el-table-column prop="departure" label="起飞机场" />
                                                            <el-table-column prop="departureTime" label="起飞时间" />

                                                            <el-table-column prop="arrival" label="目的机场" />
                                                            <el-table-column prop="arrivalTime" label="落地时间" />

                                                        </el-table>
                                                    </div>

                                                    <!-- 显示批复内容（航线） -->
                                                    <div class="mb-2">
                                                        <div style="text-align: left;font-weight: bold"
                                                            class="font-semibold">批复内容</div>
                                                            
                                                        <el-table :data="data.fileData.permitFlight || []"
                                                            style="width: 100%; margin-top: 4px" height="150"
                                                            size="small">
                                                            <el-table-column prop="flightNumber" label="航班号" />
                                                            <el-table-column prop="departure" label="起飞机场" />
                                                            <el-table-column prop="departureTime" label="起飞时间" />

                                                            <el-table-column prop="arrival" label="目的机场" />
                                                            <el-table-column prop="arrivalTime" label="落地时间" />

                                                        </el-table>
                                                        <el-table :data="data.fileData.permitRoute || []"
                                                            style="width: 100%; margin-top: 4px" height="150"
                                                            size="small">
                                                            <el-table-column prop="sector" label="航段" />

                                                            <el-table-column prop="ATSroute" label="航路走向" />
                                                            <el-table-column prop="entryPoint" label="入境点" />
                                                            <el-table-column prop="exitPoint" label="出境点" />
                                                        </el-table>
                                                    </div>

                                                    <!-- 查看文件按钮 -->
                                                    <el-button type="success" icon="Edit" @click="editPermission(data)">
                                                        编辑
                                                    </el-button>
                                                    <el-button :disabled="!data.url" type="info" icon="View" plain
                                                        @click="viewPermitFile(data.fileName, data.url)">
                                                        点击查看批复文件
                                                    </el-button>
                                                </div>
                                            </div>

                                            <permissionMatch :taskKey="viewData.taskKey" :data="curCountryData"
                                                v-model:visible="permissionMatchVisible" :editData="editData"
                                                :isEditing="isEditingPermission" @upload-success="refreshTaskList" />
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>
                        </div>
                        <el-loading v-if="loadingTask" text="正在刷新任务列表..." />

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
import { getFlights, getRoutes, getPermission, baseURL,attributionOptionFromAPI, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, getTaskList, baseFileURL, deleteTaskByIds, updateTaskList, getAircraftType } from '../api.js';
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
import { useLoading } from '../plugins/loading'
// 
const loadingStatus = useLoading()
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


const attributionOption = ref(attributionOptionFromAPI)
const selectAttribution = ref('schedule')
const changeAttribution = (val)=>{
    selectAttribution.value = val
    console.log('变化后的selectAttribution',selectAttribution)
}
// watch(() => attributionOptionFromAPI, (val) => {
    
//     attributionOption.value= val.value || ''
//     console.log('attributionOption',attributionOption)
// })
const route = useRoute()
const steps = [
    { key: 'uploadTime', label: '申请件制作' },
    { key: 'checkTime', label: '双校核' },
    { key: 'sendTime', label: '发送申请' }
]
// const stepStatus = computed(() =>
//     steps.map((step, index) => {
//         const done = !!viewData.value.applyData?.[step.key]
//         const isCurrent =
//             !done &&
//             (index === 0 || !!viewData.value.applyData?.[steps[index - 1].key])

//         return {
//             ...step,
//             done,
//             isCurrent,
//             icon: done ? CircleCheckFilled : MoreFilled,
//             color: done
//                 ? 'var(--el-color-success)'
//                 : isCurrent
//                     ? 'var(--el-color-danger)'
//                     : '#dcdfe6'
//         }
//     })
// )

const currentStep = computed(() => {
    if (!viewData?.value?.applyData) return 'upload'

    if (!viewData?.value?.applyData[curCountry.value]?.uploadTime) return 'upload'
    if (!viewData?.value?.applyData[curCountry.value]?.checkTime) return 'check'
    if (!viewData?.value?.applyData[curCountry.value]?.sendTime) return 'send'
    return 'done'
})

const getTimelineNode = (done, isCurrent) => {
    // console.log('done', done, 'isCurrent', isCurrent)
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
    loadingStatus.show('正在加载任务信息，请稍候...')

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
    console.log('curCountry.value', curCountry.value)
    if (curCountry.value && countryList.value) {
        curCountryInfo.value = countryList.value.find(item => item.country == curCountry.value)
        console.log('当前国家信息curCountry', curCountryInfo.value)
    } else {
        curCountryInfo.value = null
    }

    needMakeApplyDoc.value = foundTask.applyData ? false : true

    taskLoading.value = false
    loadingStatus.hide()
}
const refreshOverflyData = async (newData) => {
    // console.log('curCountryData', curCountryData.value)

    console.log('临时更新的data', newData)

    // console.log('当前的viewData',viewData)
    curCountryData.value.overflyDetails = newData
    const idx = viewData.value.data.find(item => item.overflyCountry == curCountryInfo.value.country)
    viewData.value.data[idx] = curCountryData.value
    console.log('变化后的curCountryData', curCountryData.value)
    console.log('变化后的viewData', viewData.value.data)

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
    if (Array.isArray(viewData.permissionData)) {
        const obj = {}
        viewData.permissionData.forEach(item => {
            if (item.country) {
                obj[item.country] = item
            }
        })
        viewData.permissionData = obj
    }
    return { ...viewData, data: newData };
}
const extractStatus = ref(false)
const extractRecord = ref(null)
function applyExtractRoutes() {
    // extractRecord.value = viewData.value
    // viewData.value = extractRoutes(viewData.value);
    //重新赋值申请数据
    if (extractStatus.value === false) {
        console.log('提取航路')
        extractRecord.value = viewData.value
        viewData.value = extractRoutes(viewData.value);

        extractStatus.value = true
    } else {
        console.log('还原航路')

        viewData.value = extractRecord.value
        extractRecord.value = null
        extractStatus.value = false

    }
    //重新赋值申请数据
    // console.log('点击全周期的viewData', viewData)

    curCountryData.value = viewData.value.data.find(item => item.overflyCountry == curCountryInfo.value.country)
    console.log('点击全周期的curCountryData', curCountryData)
    // console.log('点击提取航路的viewData', viewData)

    // curCountryData.value = viewData.value.data[0]

}
function extractRoutes(viewData) {
    if (!viewData || !Array.isArray(viewData.data)) return viewData;

    // 正则表达式：匹配字母和2-3位数字
    const routePattern = /\b[A-Z]{1}\d{1,3}\b/g;
    // console.log('需要提取的viewData', viewData)
    // console.log('curCountryInfo.country', curCountryInfo.value.country)

    const newData = viewData.data.map(item => {
        if (item.overflyCountry === curCountryInfo.value.country && Array.isArray(item.overflyDetails)) {
            return {
                ...item,
                overflyDetails: item.overflyDetails.map(route => {
                    // 提取符合格式的航路信息，并以逗号分隔
                    const matchedRoutes = route.ATSroute ? route.ATSroute.match(routePattern) : null;
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
        if (item.overflyCountry === curCountryInfo.value.country && Array.isArray(item.flightList)) {
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


const allFullCycle = ref(false)
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
    // console.log('点击全周期的viewData', viewData)

    curCountryData.value = viewData.value.data.find(item => item.overflyCountry == curCountryInfo.value.country)
    console.log('点击全周期的curCountryData', curCountryData)


}
const useAircraftOption = ref('origin')
const aircraftOptions = [{ label: '原始', value: 'origin' }, { label: '全部', value: 'all' }, { label: '787系列', value: '787' }, { label: '737系列', value: '737' }, { label: '空客系列', value: 'A' }, { label: '自定义', value: 'others' }]

const useAllAircraftTypesStatus = ref(false)
const useAllAircraftTypesRecord = ref(null)
const useChooseAircraft = () => {
    console.log('useAircraftOption', useAircraftOption)
    if (useAllAircraftTypesStatus.value === false) {

        useAllAircraftTypesRecord.value = viewData.value
        viewData.value = useAllAircraftTypes(viewData.value);
        console.log('useAllAircraftTypes(viewData.value)', useAllAircraftTypes(viewData.value))
        useAllAircraftTypesStatus.value = true
    } else {
        console.log('回到原周期')

        viewData.value = useAllAircraftTypesRecord.value
        useAllAircraftTypesRecord.value = null
        useAllAircraftTypesStatus.value = false

    }
    console.log('点击全机型的viewData', viewData)
    // curCountryData.value = viewData.value.data[0]
    curCountryData.value = viewData.value.data.find(item => item.overflyCountry == curCountryInfo.value.country)
}
function useAllAircraftTypes(viewData) {
    if (!viewData || !Array.isArray(viewData.data)) return viewData;

    const newData = viewData.data.map(item => {
        if (item.overflyCountry === curCountryInfo.value.country && Array.isArray(item.flightList)) {
            return {
                ...item,
                flightList: item.flightList.map(flight => ({
                    ...flight,
                    // aircraftType: "B737/B738/B7M8/A21N/B788/B789"
                    aircraftType: aircraftTransferToOutput(useAircraftOption.value, 'icaoName')
                })),
                aircraftTypeAll: aircraftTransferToOutput('all', 'icaoName')
            };
        }
        return item;
    });

    return { ...viewData, data: newData };
}
function applyAllAircraft() {
    // console.log('useAllAircraftTypesStatus', useAllAircraftTypesStatus)

    if (useAllAircraftTypesStatus.value === false) {

        // const chooseType = aircraftTransferToOutput('all', 'icaoName')
        console.log('使用全周期', allType)

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
    // curCountryData.value = viewData.value.data[0]
    curCountryData.value = viewData.value.data.find(item => item.overflyCountry == curCountryInfo.value.country)

}


const handleClick = (tab, event) => {
    console.log(tab, event)
}
const clickCountry = ref('0')
const changeCountry = (country) => {
    const index = clickCountry.value
    const selectedItem = viewData.value.data[index];
    console.log('点击后的country', selectedItem)
    //当前国家申请数据
    curCountry.value = selectedItem.overflyCountry
    curCountryData.value = selectedItem
    curCountryInfo.value = countryList.value.find(item => item.country == curCountry.value)
    // allFullCycle.value = curCountryData.value.flightList.some()
    useFullCycleStatus.value = false
    useAllAircraftTypesStatus.value = false

    console.log('切换后的国家申请数据', curCountryData.value)
}
const createApplyDoc = async (attribution, type) => {

    if (allFullCycle.value == false && useFullCycleStatus.value == false) {
        try {
            await ElMessageBox.confirm(
                `检测到未用全周期申请，是否使用全周期申请`,
                '提示',
                {
                    confirmButtonText: '确定使用全周期申请',
                    cancelButtonText: '保持计划周期',
                    type: 'warning'
                }
            )
            // 用户点了确定
            applyFullCycle()
            useFullCycleStatus.value = true
        } catch (e) {
            // 用户点了取消或关闭
            console.log('保持原计划周期')
        }
    }
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
const isEditingPermission = ref(false)
const editData = ref()
const editPermission = (data) => {
    isEditingPermission.value = true
    permissionMatchVisible.value = true
    console.log('curCountryData', curCountryData)
    console.log('输入编辑的数据', data)
    console.log('输入编辑的数据', viewData.value.taskKey)

    // showAddPermitChoose.value = true
    // const country = multipleSelection.value[0].country
    // console.log('country',country)/
    editData.value = {
        ...data,
        taskKey: viewData.value.taskKey
    }
    // editData.value.fileName = multipleSelection.value[0].fileName
    // editData.value.url = multipleSelection.value[0].url
    // editData.value.permissionNumber = multipleSelection.value[0].permissionNumber
    // editData.value.permissionId = multipleSelection.value[0].id

    // editData.value.taskKey = multipleSelection.value[0].taskKey
    // editData.value.curCountryData.flightList = multipleSelection.value[0].relateData.applyFlight
    // editData.value.curCountryData.overflyDetails = multipleSelection.value[0].relateData.applyRoute
    // if (!editData.value.fileDataByCountry[country]) {
    //     editData.value.fileDataByCountry[country] = {}
    // }
    // editData.value.fileDataByCountry[country].permitFlight = multipleSelection.value[0].fileData.permitFlight
    // editData.value.fileDataByCountry[country].permitRoute = multipleSelection.value[0].fileData.permitRoute

    // console.log('editData', editData)

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
const loadingTask = ref(false)
const handleApplyClose = async () => {
    loadingTask.value = true;
    loadingStatus.show('更新任务数据')
    await refreshTaskList();
    loadingStatus.hide()
    // loadingTask.value = false;


    // ElMessage.success('任务已更新');
};

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
            loadingStatus.show('更新任务数据')
            await refreshTaskList();
            loadingStatus.hide()
        }
    } catch (err) {
        console.error('检查失败:', err);
        ElMessage.error('检查失败，请稍后重试');
    }
};

const sendApply = async (task) => {
    if (!task || !task.id || !task.taskKey || !task.applyData) return;
    const applyData = { ...task.applyData };
    // applyData.sendTime = new Date().toISOString(); // 添加检查时间
    const temCountry = curCountryData.value.overflyCountry
    applyData[temCountry].sendTime = new Date().toISOString();
    const formData = new FormData();
    formData.append('id', task.id);
    formData.append('taskKey', task.taskKey);
    formData.append('country', temCountry);
    formData.append('applyData', JSON.stringify(applyData)); // 包含 checkTime 的 applyData
    formData.append('action', 'updateApplyData');
    try {
        const res = await updateTaskList(formData);
        if (res.data.success) {
            ElMessage.success('已发送申请件');
            loadingStatus.show('更新任务数据')
            await refreshTaskList();
            loadingStatus.hide()
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

const matchAircraft = (input) => {
    const aircraftTypeData = aircraftType.value
    const normalized = input.trim().toUpperCase().replace(/-/g, '') // 去掉 -，方便匹配

    return (
        aircraftTypeData.find(aircraft =>
            aircraft.aircraftType?.replace(/-/g, '').toUpperCase().includes(normalized) ||
            aircraft.anotherName?.caacName?.toUpperCase() === normalized ||
            aircraft.anotherName?.icaoName?.toUpperCase() === normalized ||
            aircraft.anotherName?.shortName?.toUpperCase() === normalized
        ) || null
    )
}
const aircraftTransferToOutput = (input, outputField) => {
    console.log('input', input, 'outputField', outputField)
    const data = aircraftType.value
    if (!input || !Array.isArray(data)) return null
    const normalized = input.trim().toUpperCase()

    // 特殊情况：all
    if (normalized === 'ALL') {
        return data
            .map(ac => ac.anotherName?.[outputField] || ac[outputField] || ac.aircraftType)
            .join('/')
    }
    if (/^\d+$/.test(normalized) || /^[A-Z0-9]+$/.test(normalized)) {
        const matched = data.filter(ac =>
            ac.aircraftType?.toUpperCase().includes(normalized)
        )
        if (matched.length > 1) {
            return matched
                .map(ac => ac.anotherName?.[outputField] || ac[outputField] || ac.aircraftType)
                .join('/')
        }
    }

    // 支持组合输入，用 / 分隔
    const parts = normalized.split('/').map(p => p.trim()).filter(Boolean)

    const results = parts.map(part => {
        const match = matchAircraft(part)
        if (match) {
            // 返回指定字段，如果没有就降级到 icaoName 或 aircraftType
            return match.anotherName?.[outputField] || match[outputField] || match.aircraftType
        }
        return part // 没匹配到原样返回
    })

    return results.join('/')
}
watch(
    () => curCountryData.value,
    (newVal) => {
        if (!newVal || !Array.isArray(newVal.flightList)) {
            allFullCycle.value = false
            return
        }
        console.log('newVal', newVal)

        // 遍历 flightList 检查 days
        allFullCycle.value = newVal.flightList.every(flight => {
            const daysStr = Array.isArray(flight.days) ? flight.days.join("") : flight.days
            return daysStr === "1234567"
        })
        console.log('allFullCycle', allFullCycle.value)
    },
    { deep: true, immediate: true }
)
const aircraftType = ref()
onMounted(async () => {
    try {
        // const flightResponse = await getFlights();
        // await loadFlightData()
        loadingStatus.show('正在加载任务列表，请稍候...')
        const taskResponse = await getTaskList();
        taskListInServer.value = taskResponse.data
        console.log('获取原始的taskListInServer', taskListInServer)
        filteredTasks.value = taskListInServer.value
        const countryResponse = await getCountryRules()
        countryList.value = countryResponse.data
        taskListLoaded.value = true
        // console.log('taskListLoaded', taskListLoaded)
        const aircraftTypeResponse = await getAircraftType()
        aircraftType.value = aircraftTypeResponse.data
        // console.log('taskListLoaded', aircraftType)
        loadingStatus.hide()

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

.custom-style .el-segmented {
    --el-segmented-item-selected-color: var(--el-text-color-primary);
    --el-segmented-item-selected-bg-color: #ffd100;
    --el-border-radius-base: 16px;
}
</style>