<template>
    <el-dialog v-model="windowVisible" :title="isEditing ? '编辑飞越批复' : '飞越批复匹配'" width="95%">
        <div v-if="!curTaskKey && !isEditing">
            <h3>任务列表</h3>
            <el-scrollbar height="300px" class="task-list">
                <el-card v-for="task in taskList" :key="task.taskKey" class="task-item" shadow="hover"
                    @click="selectTask(task.taskKey)">
                    {{ task.taskName }}
                </el-card>
            </el-scrollbar>
        </div>

        <div v-else>
            <div class="matchBox">
                <div class="flightBox mb-4">
                    <!-- <h3>航班列表 & 批复上传</h3> -->
                    <div class="mb-2 font-bold flex-between">
                        <el-tag size="large">{{ curCountryData?.overflyCountry }}</el-tag>

                    </div>
                    <div style="display: flex;align-items: center;">

                        <el-card class="mb-4 dataBox">
                            <h3>申请数据</h3>

                            <!-- 航班选择 -->
                            <div>{{ curCountryData?.flightList?.length }}条航班</div>
                            <el-table :data="curCountryData?.flightList || []" style="margin-bottom: 8px" height="200">
                                <el-table-column prop="flightNumber" label="航班号" />
                                <el-table-column prop="departure" label="起飞机场" />
                                <el-table-column prop="departureTime" label="起飞时间" />
                                <el-table-column prop="arrival" label="目的机场" />
                                <el-table-column prop="arrivalTime" label="落地时间" />
                            </el-table>
                            <div>{{ curCountryData?.overflyDetails?.length }}条航路数据</div>

                            <el-table :data="curCountryData?.overflyDetails || []" style="margin-bottom: 8px"
                                height="200">
                                <el-table-column prop="sector" label="航段" />

                                <el-table-column prop="ATSroute" label="航线" />
                                <el-table-column prop="entryPoint" label="入境点" />
                                <el-table-column prop="exitPoint" label="出境点" />
                            </el-table>

                            <!-- 一键同步 overflyDetails -->
                            <el-button type="primary" size="normal"
                                @click="syncOverflyDetails(curCountryData.overflyCountry, curCountryData.flightList, curCountryData.overflyDetails)">
                                同步航班数据到批复数据
                            </el-button>

                            <!-- 可编辑文件数据表格 -->


                        </el-card>
                        <el-card class="dataBox">
                            <h3><span class="season-tip">航季：{{ displaySeason }}</span>批复数据</h3>

                            <el-input v-model="permissionNumbers[curCountryData.overflyCountry]" placeholder="请输入批复号"
                                style="width: 200px"></el-input>

                            <div>{{ fileDataByCountry[curCountryData.overflyCountry]?.permitFlight.length }}条航班数据</div>


                            <el-table :data="fileDataByCountry[curCountryData.overflyCountry]?.permitFlight"
                                style="margin-top: 8px" height="200">
                                <el-table-column label="航班号" width="120">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitFlight">
                                            <el-input v-model="row.flightNumber" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.flightNumber }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 起飞机场 -->
                                <el-table-column label="起飞机场" width="120">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitFlight">
                                            <el-input v-model="row.departure" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.departure }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 起飞时间 -->
                                <el-table-column label="起飞时间" width="140">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitFlight">
                                            <el-input v-model="row.departureTime" size="small" placeholder="如 22:00" />
                                        </template>
                                        <template v-else>
                                            {{ row.departureTime }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 目的机场 -->
                                <el-table-column label="目的机场" width="120">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitFlight">
                                            <el-input v-model="row.arrival" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.arrival }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 落地时间 -->
                                <el-table-column label="落地时间" width="140">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitFlight">
                                            <el-input v-model="row.arrivalTime" size="small" placeholder="如 07:25" />
                                        </template>
                                        <template v-else>
                                            {{ row.arrivalTime }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 操作 -->
                                <el-table-column label="操作" width="120" align="center">
                                    <template #default="{ $index }">
                                        <el-button v-if="isEditingPermitFlight" type="danger" size="small"
                                            @click="removeFlight($index)">
                                            删除
                                        </el-button>
                                    </template>
                                </el-table-column>

                            </el-table>
                            <div>
                                <el-button v-if="!isEditingPermitFlight" type="primary" @click="startEdit">
                                    编辑批复航班
                                </el-button>

                                <template v-else>
                                    <el-button type="success" @click="saveChanges">保存</el-button>
                                    <el-button type="warning" @click="cancelEdit">取消</el-button>
                                    <el-button type="primary" @click="addFlight">新增航班</el-button>
                                </template>
                            </div>
                            <el-table :data="fileDataByCountry[curCountryData.overflyCountry]?.permitRoute"
                                style="margin-top: 8px" height="200">
                                <el-table-column label="航段" width="120">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitRoute">
                                            <el-input v-model="row.sector" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.sector }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 起飞机场 -->
                                <el-table-column label="航线" width="120">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitRoute">
                                            <el-input v-model="row.ATSroute" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.ATSroute }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 起飞时间 -->
                                <el-table-column label="入境点" width="140">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitRoute">
                                            <el-input v-model="row.entryPoint" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.entryPoint }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 目的机场 -->
                                <el-table-column label="出境点" width="120">
                                    <template #default="{ row }">
                                        <template v-if="isEditingPermitRoute">
                                            <el-input v-model="row.exitPoint" size="small" placeholder="请输入" />
                                        </template>
                                        <template v-else>
                                            {{ row.exitPoint }}
                                        </template>
                                    </template>
                                </el-table-column>

                                <!-- 操作 -->
                                <el-table-column label="操作" width="120" align="center">
                                    <template #default="{ $index }">
                                        <el-button v-if="isEditingPermitRoute" type="danger" size="small"
                                            @click="removeRoute($index)">
                                            删除
                                        </el-button>
                                    </template>
                                </el-table-column>

                            </el-table>
                            <div>
                                <el-button v-if="!isEditingPermitRoute" type="primary" @click="startEditPermitRoute">
                                    编辑批复航班
                                </el-button>

                                <template v-else>
                                    <el-button type="success" @click="saveChangesPermitRoute">保存</el-button>
                                    <el-button type="warning" @click="cancelEditPermitRoute">取消</el-button>
                                    <el-button type="primary" @click="addFlightPermitRoute">新增航班</el-button>
                                </template>
                            </div>

                            <!-- 批复文件上传（单文件） -->
                            <div v-if="!curPermitFile.url">
                                <el-upload :auto-upload="false"
                                    :file-list="fileListDisplay(curCountryData.overflyCountry)"
                                    :on-change="file => handleFileChange(curCountryData.overflyCountry, file)"
                                    :on-remove="(file) => handleFileRemove(curCountryData.overflyCountry, file)"
                                    accept=".pdf,.doc,.docx,.png,.pic,.jpeg,.jpg">
                                    <el-button type="success" icon="Upload">
                                        为「{{ curCountryData.overflyCountry }}」添加批复文件
                                    </el-button>
                                </el-upload>
                            </div>
                            <div v-else>
                                <fileView :file="curPermitFile" :loading="false" @click="previewFile(curPermitFile)" />
                                <filePreview :file="currentFile" v-model:visible="previewVisible" />

                            </div>


                            <div style="display: flex;align-items: center;justify-content: center;">
                                <el-button v-if="!isEditing"
                                    :disabled="!paragraphs.length && !tableRead.length && !docVisible"
                                    @click="showPermitFile" style="width: 30%;">
                                    预览文件
                                </el-button>
                                <el-button :disabled="!paragraphs.length && !tableRead.length" @click="readFileToData"
                                    style="width: 30%;">
                                    读取文件
                                </el-button>
                                <el-button type="primary" style="width: 30%;"
                                    :disabled="!paragraphs?.length && !tableRead?.length && !fileDataByCountry[curCountryData?.overflyCountry]?.length"
                                    @click="compareData">
                                    对比数据
                                </el-button>
                            </div>


                        </el-card>
                        <!-- 正文预览 -->
                        <el-card v-if="previewPDFVisible">
                            <filePreview :file="currentFile" v-model:visible="previewPDFVisible" />

                        </el-card>
                        <el-card v-if="paragraphs.length && tableRead.length && docVisible" class="dataBox">
                            <div v-if="paragraphs.length">
                                <el-card class="mb-4">
                                    <template #header>正文</template>
                                    <div v-for="(p, i) in paragraphs" :key="i" style="margin-bottom: 8px;">
                                        {{ p }}
                                    </div>
                                </el-card>
                            </div>
                            <div v-for="(table, idx) in tableRead" :key="idx" class="mb-6">
                                <el-card>
                                    <template #header>表格 {{ idx + 1 }}</template>
                                    <el-table :data="table.rows" border>
                                        <el-table-column v-for="(header, i) in table.headers" :key="i" :prop="header"
                                            :label="header" />
                                    </el-table>
                                </el-card>
                            </div>

                        </el-card>
                        <el-card v-if="showCompare" class="dataBox">
                            <div>
                                <el-tabs v-model="activeTab">
                                    <el-tab-pane label="新增 (Added)" name="added">
                                        <el-table :data="diffData.added" style="width: 100%">
                                            <el-table-column prop="flight.flightNumber" label="航班号" />
                                            <el-table-column prop="flight.departure" label="出发" />
                                            <el-table-column prop="flight.arrival" label="到达" />
                                            <el-table-column prop="flight.days" label="班期" />
                                            <el-table-column label="状态">
                                                <template #default>
                                                    <el-tag type="success">新增</el-tag>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </el-tab-pane>

                                    <el-tab-pane label="删除 (Removed)" name="removed">
                                        <el-table :data="diffData.removed" style="width: 100%">
                                            <el-table-column prop="flightNumber" label="航班号" />
                                            <el-table-column prop="departure" label="出发" />
                                            <el-table-column prop="arrival" label="到达" />
                                            <el-table-column prop="days" label="班期" />
                                            <el-table-column label="状态">
                                                <template #default>
                                                    <el-tag type="info">删除</el-tag>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </el-tab-pane>

                                    <el-tab-pane label="一致 (Same)" name="same">
                                        <el-table :data="diffData.same" style="width: 100%">
                                            <el-table-column prop="flight.flightNumber" label="航班号" />
                                            <el-table-column prop="flight.departure" label="出发" />
                                            <el-table-column prop="flight.arrival" label="到达" />
                                            <el-table-column prop="flight.days" label="班期" />
                                            <el-table-column label="状态">
                                                <template #default>
                                                    <el-tag type="primary">一致</el-tag>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </el-tab-pane>

                                    <el-tab-pane label="修改 (Modified)" name="modified">
                                        <el-table :data="diffData.modified" style="width: 100%">
                                            <el-table-column prop="flight.flightNumber" label="航班号" width="120" />
                                            <el-table-column label="不同字段对比">
                                                <template #default="{ row }">
                                                    <table class="inner-table">
                                                        <tr v-for="(val, key) in getDiffFields(row.flight, row.permitFlight)"
                                                            :key="key">
                                                            <td style="font-weight: bold;">{{ key }}</td>
                                                            <td style="color: #67C23A;">申请: {{ val.apply }}</td>
                                                            <td style="color: #F56C6C;">批复: {{ val.permit }}</td>
                                                        </tr>
                                                    </table>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </el-tab-pane>
                                </el-tabs>
                            </div>

                        </el-card>
                    </div>

                </div>
            </div>
        </div>

        <template #footer>
            <el-button @click="windowVisible = false">取消</el-button>
            <el-button type="primary" @click="savePermissionData">保存</el-button>
        </template>

        <el-dialog v-model="overwriteDialog" title="覆盖确认" width="400px" append-to-body>
            <p>当前记录已有文件，是否覆盖原文件？</p>
            <template #footer>
                <el-button @click="cancelOverwrite">保留原文件</el-button>
                <el-button type="danger" @click="confirmOverwrite">覆盖原文件</el-button>
            </template>
        </el-dialog>
    </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, computed, toRaw } from 'vue'
import { getTaskList, updatePermission, baseFileURL, getPermission } from '../api.js'
import { ElMessage } from 'element-plus'
import mammoth from "mammoth"
import * as cheerio from 'cheerio'
import { beijingToUTC, formatTimeWithoutColon, formatDateToCountry } from '../utils/timeTransfer.js';
import fileView from '../utils/fileView.vue'
import filePreview from '../utils/filePreview.vue'
import crypto from 'crypto';
// import {getShowArrivalTime} from '../utils/applyDoc.vue';
// import VueOfficeDocx from 'vue-office-docx'
const props = defineProps({
    taskKey: String,
    visible: Boolean,
    data: Array,
    editData: Array,
    isEditing: Boolean,
})
const activeTab = ref('added')
const docVisible = ref(false)
const taskList = ref([])
const curTaskKey = ref('')
const curTaskData = ref(null)
const windowVisible = ref(props.visible)
const curCountryData = ref()
const showCompare = ref(false)
const previewVisible = ref(false)

const overwriteDialog = ref(false)
const fileList = ref([])
const newFile = ref(null)
const overwriteFile = ref(false)

//编辑飞越数据模块
const isEditingPermitFlight = ref(false);
let backupFlights = [];
const startEdit = () => {
    isEditingPermitFlight.value = true;
    const country = curCountryData.value.overflyCountry;
    backupFlights = JSON.parse(
        JSON.stringify(fileDataByCountry.value[country].permitFlight)
    );

};

const saveChanges = () => {
    isEditingPermitFlight.value = false;
    const country = curCountryData.value.overflyCountry;
    console.log("保存后的航班数据：", fileDataByCountry.value[country].permitFlight);
    // TODO: 在这里调用接口保存，比如 axios.post('/update', fileDataByCountry.value[country].permitFlight)
};
const addFlight = () => {
    const country = curCountryData.value.overflyCountry;
    fileDataByCountry.value[country].permitFlight.push({
        flightNumber: "",
        departure: "",
        departureTime: "",
        arrival: "",
        arrivalTime: "",
        aircraftType:'',
        attribution:'',
        days:[],
        startDate:'',
        endDate:'',

    });
};
const cancelEdit = () => {
    const country = curCountryData.value.overflyCountry;
    fileDataByCountry.value[country].permitFlight = backupFlights;
    isEditingPermitFlight.value = false;
};
const removeFlight = (index) => {
  const country = curCountryData.value.overflyCountry;
  fileDataByCountry.value[country].permitFlight.splice(index, 1);
};

const isEditingPermitRoute = ref(false);
let backupRoutes = [];
const startEditPermitRoute = () => {
    isEditingPermitRoute.value = true;
    const country = curCountryData.value.overflyCountry;
    backupFlights = JSON.parse(
        JSON.stringify(fileDataByCountry.value[country].permitRoute)
    );

};

const saveChangesPermitRoute = () => {
    isEditingPermitRoute.value = false;
    const country = curCountryData.value.overflyCountry;
    console.log("保存后的航班数据：", fileDataByCountry.value[country].permitRoute);
    // TODO: 在这里调用接口保存，比如 axios.post('/update', fileDataByCountry.value[country].permitFlight)
};
const addFlightPermitRoute = () => {
    const country = curCountryData.value.overflyCountry;
    fileDataByCountry.value[country].permitRoute.push({
        sector: "",
        ATSroute: "",
        entryPoint: "",
        exitPoint: "",

    });
};
const cancelEditPermitRoute = () => {
    const country = curCountryData.value.overflyCountry;
    fileDataByCountry.value[country].permitRoute = backupRoutes;
    isEditingPermitRoute.value = false;
};
const removeRoute = (index) => {
  const country = curCountryData.value.overflyCountry;
  fileDataByCountry.value[country].permitRoute.splice(index, 1);
};

function transformFlightNumber(flightNumber) {
    if (!flightNumber) return "";
    // 提取数字部分
    const digits = flightNumber.match(/\d+$/);
    return digits ? `CXA${digits[0]}` : `CXA`;
}
//编辑模式
const isEditing = ref(false)

watch(() => props.visible, val => (windowVisible.value = val))
// watch(
//   () => props.data,
//   (val) => {
//     console.log('val', val)

//     // 首先判断 val 是否存在，并且 flightList 是否为数组
//     if (val && Array.isArray(val.flightList)) {
//       curCountryData.value = val
//       console.log('curCountryData updated', curCountryData.value)
//     } else {
//       console.warn('Invalid or empty flightList:', val?.flightList)
//       // 当 data 为空时，可以清空当前数据，避免保留旧值
//       curCountryData.value = { flightList: [] }
//     }
//   },
//   { immediate: true }
// )
const curPermitFile = ref({
    name: '',
    url: '',
    uploadTime: '',
    file: null,
})
const currentFile = ref()
function isFullUrl(url) {
    return /^http?:\/\//.test(url)
}
function isLocalFile(file) {
  if (file instanceof File) return true
  if (typeof file.url === 'string' && file.url.startsWith('blob:')) return true
  if (file.uid && file.name && !isFullUrl(file.url || '')) return true
  return false
}
const previewFile = (file) => {
    // console.log('file', file)
    let fullUrl = file.url
    if (!isFullUrl(file.url)) {
        fullUrl = baseFileURL + file.url
    }
    currentFile.value = {
        ...toRaw(file),
        url:  isLocalFile(file) ? file.url : fullUrl,
        source: isLocalFile(file) ? 'local' : 'net'
    }
    // console.log('currentFile', currentFile)
    previewVisible.value = true
}
const isFileProcessing = ref(false)
const curPermitId = ref()
watch(
    () => [props.isEditing, props.editData, props.data],
    async ([newIsEditing, newEditData, newData]) => {
        // 统一转换编辑状态为布尔值
        const isEditMode = newIsEditing
        isEditing.value = isEditMode
        // console.log('isEditing', isEditing.value)
        // console.log('isEditMode', isEditMode, 'newEditData', newEditData, 'newData', newData)
        if (isEditMode) {
            // 编辑模式
            console.log('编辑模式newEditData', newEditData)

            if (newEditData) {
                console.log('编辑模式curCountryData', newData)
                // console.log('编辑模式curCountryData',curCountryData)

                curCountryData.value = newData || {}
                const country = curCountryData.value?.overflyCountry || ''

                fileDataByCountry.value[country] = newEditData.fileData || {}
                curPermitFile.value.name = newEditData.fileName || ''
                curPermitFile.value.url = newEditData.url || ''
                curPermitFile.value.uploadTime = newEditData.uploadTime || ''
                curTaskKey.value = newEditData.taskKey || ''
                permissionNumbers.value[country] = newEditData.permissionNumber || ''
                if (!selectedFlights.value[country]) {
                    selectedFlights.value[country] = {}
                }
                curTaskData.value = taskList.value.find(t => t.taskKey === curTaskKey.value)
                selectedFlights.value[country].applyFlight = newEditData.relateData.applyFlight
                selectedFlights.value[country].applyRoute = newEditData.relateData.applyRoute
                curPermitId.value = newEditData.permissionId || ''
                if (!isFileProcessing.value) {
                    isFileProcessing.value = true
                    await handleFileChange(
                        curCountryData.value.overflyCountry,
                        curPermitFile.value
                    )
                    isFileProcessing.value = false
                }
                // handleFileChange(newEditData.curCountryData.overflyCountry, curPermitFile.value)
                // console.log('[Editing Mode] curCountryData updated:', curCountryData.value)
            } else {
                // console.warn('[Editing Mode] Invalid or empty flightList:', newEditData?.flightList)
                curCountryData.value = { flightList: [] }
                fileDataByCountry.value = {}
            }
        } else {
            // 查看模式
            if (newData && Array.isArray(newData.flightList)) {
                curCountryData.value = newData
                // console.log('[View Mode] curCountryData updated:', curCountryData.value, curPermitFile.value)
            } else {
                console.warn('[View Mode] Invalid or empty flightList:', newData?.flightList)
                curCountryData.value = { flightList: [] }
            }
        }

        // 调试输出
        // console.log('isEditing:', isEditMode)
        // console.log('editData:', newEditData)
        // console.log('data:', newData)
    },
    { immediate: true, deep: true }
)

watch(() => props.taskKey, val => curTaskKey.value = val || '')
const emit = defineEmits(['update:visible', 'upload-success'])
watch(windowVisible, val => emit('update:visible', val))
const permissionNumbers = ref({})
const selectedFlights = ref({}) // { country: [航班] }
const selectedFilesByCountry = ref({}) // { country: File }
const fileDataByCountry = ref({}) // { country: [{ATSroute, entryPoint, exitPoint}] }

onMounted(async () => {
    const res = await getTaskList()
    taskList.value = res.data
    if (props.taskKey) selectTask(props.taskKey)
})
function getShowArrivalTime(departureTime, arrivalTime) {
    if (!departureTime || !arrivalTime) return "";
    const depUTC = beijingToUTC(departureTime)
    const arrUTC = beijingToUTC(arrivalTime)

    // 去掉冒号
    const dep = depUTC.replace(":", "");
    const arr = arrUTC.replace(":", "");
    // const arrUTC = formatTimeWithoutColon(beijingToUTC(arrivalTime))
    const depH = parseInt(dep.slice(0, 2), 10);
    const depM = parseInt(dep.slice(2), 10);
    const arrH = parseInt(arr.slice(0, 2), 10);
    const arrM = parseInt(arr.slice(2), 10);

    const depMinutes = depH * 60 + depM;
    const arrMinutes = arrH * 60 + arrM;

    if (arrMinutes < depMinutes) {
        return `${arr}+1`; // 跨天
    }
    return arr;
}
function selectTask(key) {
    curTaskKey.value = key
    curTaskData.value = taskList.value.find(t => t.taskKey === key)
    // 初始化每个国家的数据
    curTaskData.value.data.forEach(countryData => {
        if (!selectedFlights.value[countryData.overflyCountry]) {
            selectedFlights.value[countryData.overflyCountry] = {}
        }
        selectedFlights.value[countryData.overflyCountry].applyFlight = [...countryData.flightList]
        selectedFlights.value[countryData.overflyCountry].applyRoute = [...countryData.overflyDetails]

        fileDataByCountry.value[countryData.overflyCountry] = { permitFlight: [], permitRoute: [] }
    })
}

const displaySeason = computed(() => curTaskData.value?.season || curTaskData.value?.data?.[0]?.season || '')
const fileUrl = ref()
const paragraphs = ref([])
const tableRead = ref([])

// 正则规则定义
const keyMap = {
    "flightNumber": /Number/i,
    "arrival": /arr/i,  // 如果键名包含 arr，表示到达机场
    "departure": /dep/i, // 如果键名包含 dep，表示出发机场
    "arrivalTime": /ETA|arr/i, // 如果键名包含 ETA 或 arr，表示到达时间
    "departureTime": /ETD|dep/i, // 如果键名包含 ETD 或 dep，表示出发时间
    "days": /\bday\b/i, // 包含7位数字表示服务天数
    "startDate": /(from|start)/i, // 如果键名包含 from 或 start，表示开始日期
    "endDate": /(to|end)/i,// 如果键名包含 to 或 end，表示结束日期
    "sector": /SECTOR/i,
    "ATSroute": /ATSROUTE/i,
    "entryPoint": /ENTRY\s*POINT/i,
    "exitPoint": /EXIT\s*POINT/i

};
// const formData = ref({
//   country: '',
//   permissionNumber: '',
//   url: '',
//   fileName: '',
//   fileData: [],
//   startDate: '',
//   endDate: '',
//   relateData: {},
// })

// const handleFileChange = (file) => {
//   newFile.value = file.raw
//   console.log('新文件选择：', newFile.value)

//   // 如果已有文件，提示确认是否覆盖
//   if (formData.value.url) {
//     overwriteDialog.value = true
//   }
// }
// 判断内容是否是四个大写字母（机场代码）或四个数字（时间）
function isValidFlightNumber(value) {
    return /^[A-Z]{2,3}\d{3,4}$/.test(value);
}
function isValidAirportCode(value) {
    return /^[A-Z]{4}$/.test(value);
}

function isValidTime(value) {
    return /^\d{4}$/.test(value);
}

function isValidDays(value) {
    return /^\d{7}$/.test(value);
}

function isValidDate(value) {
    return /^(?:\d{1,2}[A-Za-z]{3}\d{2})$/.test(value);  // 例如 26Oct25
}

function isValidSector(value) {
    return /^[A-Z]{4}-[A-Z]{4}$/.test(value)

}

function isValidATSroute(value) {
    return /\b([A-Z]{3,5}|[A-Z][0-9]{2,3}|DCT|\d{2,3}[NS]\d{3}[EW])\b/g.test(value)

}

function isValidEntryPoint(value) {
    return /^(?:[A-Z]{3,6}|\d{2}[NS]\d{2,3}[EW])$/.test(value)
}

function isValidExitPoint(value) {
    return /^(?:[A-Z]{3,6}|\d{2}[NS]\d{2,3}[EW])$/.test(value)
}
// 文件选择

const cancelOverwrite = () => {
    overwriteDialog.value = false
    newFile.value = null
    fileList.value = [] // 清空上传区
}

const confirmOverwrite = () => {
    overwriteDialog.value = false
    overwriteFile.value = true
}


const tablesFromFile = ref()
const previewPDFVisible = ref(false)
async function handleFileChange(country, fileEvt) {

    if (!fileEvt || !fileEvt.raw) {
        console.log('⚠️ 非用户触发的 file change，忽略。')
        return
    }

    let arrayBuffer
    let fileName = ''
    let fileUrlPath = ''

    if (props.editData?.url) {
        console.log('显示覆盖对话框')
        overwriteDialog.value = true
    }

    // 判断文件来源
    if (fileEvt.raw instanceof File) {
        selectedFilesByCountry.value[country] = fileEvt.raw
        arrayBuffer = await fileEvt.raw.arrayBuffer()
        fileName = fileEvt.raw.name
    } else if (fileEvt.url) {
        let fullUrl = fileEvt.url
        if (!isFullUrl(fileEvt.url)) {
            fullUrl = baseFileURL + fileEvt.url
        }

        const response = await fetch(fullUrl)
        if (!response.ok) throw new Error('无法获取服务器文件: ' + response.statusText)
        arrayBuffer = await response.arrayBuffer()
        fileName = fileEvt.name || fullUrl.split('/').pop()
        fileUrlPath = fullUrl
    } else {
        console.error('❌ 未检测到有效文件来源')
        return
    }

    // ---- 获取文件扩展名 ----
    const ext = fileName.split('.').pop().toLowerCase()
    const now = new Date()

    // ---- PDF 处理 ----
    if (ext === 'pdf') {
        console.log('📄 检测到 PDF 文件，跳过文字解析')

        // 更新 curPermitFile
        curPermitFile.value = {
            name: fileName,
            url: fileUrlPath || URL.createObjectURL(fileEvt.raw),
            uploadTime: now.toISOString(),
            file: fileEvt.raw
        }

        // 直接弹出 PDF 预览（例如 el-dialog + vue-office-pdf）
        // previewPDFVisible.value = true
        fileUrl.value = curPermitFile.value.url
        paragraphs.value = []
        tableRead.value = []
        tablesFromFile.value = []

        return
    }

    // ---- Word 文件处理 ----
    if (ext === 'docx' || ext === 'doc') {
        try {
            const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, 'text/html')

            // 提取段落
            const pList = Array.from(doc.querySelectorAll('p'))
                .filter(p => !p.closest('table'))
                .map(p => p.textContent.trim())
                .filter(Boolean)
            paragraphs.value = pList

            // 提取表格
            const tableList = Array.from(doc.querySelectorAll('table')).map(table => {
                const headers = Array.from(table.querySelectorAll('tr:first-child td, tr:first-child th'))
                    .map(cell => cell.textContent.trim())

                const rows = Array.from(table.querySelectorAll('tr:not(:first-child)')).map(row => {
                    const cells = Array.from(row.querySelectorAll('td, th'))
                    const rowData = {}
                    cells.forEach((cell, i) => {
                        rowData[headers[i] || `col${i + 1}`] = cell.textContent.trim()
                    })
                    return rowData
                })
                return { headers, rows }
            })
            tableRead.value = tableList

            // cheerio 重新提取 + 字段识别
            const $ = cheerio.load(html)
            const tables = []
            $('table').each((i, table) => {
                const headers = []
                const rows = []

                $(table).find('tr').first().find('td, th').each((_, cell) => {
                    headers.push($(cell).text().trim())
                })

                $(table).find('tr').slice(1).each((_, row) => {
                    const cells = $(row).find('td, th')
                    const rowData = {}
                    cells.each((index, cell) => {
                        rowData[headers[index] || `col${index + 1}`] = $(cell).text().trim()
                    })
                    rows.push(rowData)
                })

                tables.push(rows)
            })

            const updatedTables = tables.map(table =>
                table.map(row => {
                    const updatedRow = {}
                    Object.keys(row).forEach(oldKey => {
                        let newKey = oldKey
                        const value = row[oldKey]

                        if (keyMap["flightNumber"].test(oldKey) && isValidFlightNumber(value)) newKey = "flightNumber"
                        else if (keyMap["arrival"].test(oldKey) && isValidAirportCode(value)) newKey = "arrival"
                        else if (keyMap["departure"].test(oldKey) && isValidAirportCode(value)) newKey = "departure"
                        else if (keyMap["arrivalTime"].test(oldKey) && isValidTime(value)) newKey = "arrivalTime"
                        else if (keyMap["departureTime"].test(oldKey) && isValidTime(value)) newKey = "departureTime"
                        else if (keyMap["days"].test(oldKey) && isValidDays(value)) newKey = "days"
                        else if (keyMap["startDate"].test(oldKey) && isValidDate(value)) newKey = "startDate"
                        else if (keyMap["endDate"].test(oldKey) && isValidDate(value)) newKey = "endDate"
                        else if (keyMap["sector"].test(oldKey.toUpperCase()) && isValidSector(value)) newKey = "sector"
                        else if (keyMap["ATSroute"].test(oldKey.toUpperCase().replace(/\s+/g, '')) && isValidATSroute(value)) newKey = "ATSroute"
                        else if (keyMap["entryPoint"].test(oldKey.toUpperCase().replace(/\s+/g, '')) && isValidEntryPoint(value)) newKey = "entryPoint"
                        else if (keyMap["exitPoint"].test(oldKey.toUpperCase().replace(/\s+/g, '')) && isValidExitPoint(value)) newKey = "exitPoint"

                        updatedRow[newKey] = value
                    })
                    return updatedRow
                })
            )

            tablesFromFile.value = updatedTables

            // 更新 curPermitFile
            curPermitFile.value = {
                name: fileName,
                url: fileUrlPath || URL.createObjectURL(fileEvt.raw),
                uploadTime: now.toISOString(),
                file: fileEvt.raw
            }

            fileUrl.value = html
            docVisible.value = true
            readFileToData()
        } catch (err) {
            console.error('❌ Word 解析失败:', err)
        }
    } else {
        console.warn('⚠️ 暂不支持的文件类型:', ext)
    }
}

const showPermitFile = () => {
    docVisible.value = true
}
const readFileToData = () => {
    const country = curCountryData.value.overflyCountry
    console.log('tablesFromFile', tablesFromFile)
    console.log('country', country)

    if (!fileDataByCountry.value[country]) {
        fileDataByCountry.value[country] = {
            permitFlight: [],
            permitRoute: [],
            permitAircraft: []
        };
    }
    console.log('fileDataByCountry', fileDataByCountry)

    tablesFromFile.value.forEach(table => {
        const firstRow = table[0]; // 获取第一行数据来判断类型

        if (firstRow["flightNumber"] && firstRow["departure"]) {
            // 如果包含 FlightNumber 和 Departure Airport，认为这是航班信息表

            fileDataByCountry.value[country].permitFlight = [...table]
            // console.log('fileDataByCountry.value[country].permitFlight', fileDataByCountry.value[country].permitFlight)

        } else if (firstRow["sector"] && firstRow["ATSroute"]) {
            // 如果包含 Sectors 和 ATS Routes，认为这是航路信息表
            fileDataByCountry.value[country].permitRoute = [...table];
        }
        else if (firstRow["aircraftType"] || firstRow["Aircraft Type"]) {
            // 如果包含 aircraftType 字段，认为是机型表
            fileDataByCountry.value[country].permitAircraft = [...table];
        }

    });

}
const keyRule = (fltnum, dep, depTime, arr, arrTime, days) => {
    return `${fltnum}-${dep}-${depTime}-${arr}-${arrTime}-${days}`
}
const diffData = {
    added: [],
    removed: [],
    modified: [],
    same: []
};
function getDiffFields(flight, permitFlight) {
    const diff = {}
    for (const key in flight) {
        if (flight[key] !== permitFlight[key]) {
            diff[key] = {
                apply: flight[key],
                permit: permitFlight[key]
            }
        }
    }
    return diff
}
const compareData = () => {
    console.log('curCountryData', curCountryData.value)
    const transformedFlightList = (curCountryData.value.flightList || []).map(flight => {
        // console.log('111',formatDateToCountry(flight.startDate,props.curCountryData.overflyCountry,'blank'))
        // const daysArray = normalizeDays(flight.days);
        return {
            ...flight,
            flightNumber: transformFlightNumber(flight.flightNumber),
            // startDate: formatDateToCountry(flight.startDate, curCountryData.value.overflyCountry, 'blank'),
            // endDate: formatDateToCountry(flight.endDate, curCountryData.value.overflyCountry, 'blank'),
            days: Array.isArray(flight.days) ? flight.days.join('') : flight.days,
            // daysObject: arrayToDaysObject(daysArray),
            departureTime: formatTimeWithoutColon(beijingToUTC(flight.departureTime)),
            // arrivalTime: formatTimeWithoutColon(beijingToUTC(flight.arrivalTime)),
            arrivalTime: getShowArrivalTime(flight.departureTime, flight.arrivalTime),//实际显示的到达时间，会显示+1
            // flyTime: formatTimeWithoutColon(calcFlightDuration(flight.departureTime, flight.arrivalTime))
        };
    });
    console.log('transformedFlightList', transformedFlightList)

    const applyData = transformedFlightList
    // applyData.flightList = transformedFlightList
    console.log('申请数据', applyData)

    // console.log('fileDataByCountry.value', fileDataByCountry.value)
    // console.log('curCountryData.value', curCountryData.value)

    const permitData = fileDataByCountry.value[curCountryData.value.overflyCountry]
    console.log('批复数据permitData', permitData)


    const applyFlights = applyData || [];
    const permitFlights = permitData.permitFlight || [];
    const applyFlightMap = {};
    applyFlights.forEach(flight => {
        const { flightNumber, departure, departureTime, arrival, arrivalTime, days } = flight;
        const key = keyRule(flightNumber, departure, departureTime, arrival, arrivalTime, days);
        applyFlightMap[key] = flight;
    });
    const permitFlightMap = {};
    permitFlights.forEach(flight => {
        const { flightNumber, departure, departureTime, arrival, arrivalTime, days } = flight;
        const key = keyRule(flightNumber, departure, departureTime, arrival, arrivalTime, days);
        permitFlightMap[key] = flight;
    });
    console.log('applyFlightMap', applyFlightMap)

    console.log('permitFlightMap', permitFlightMap)
    applyFlights.forEach(flight => {
        const { flightNumber, departure, departureTime, arrival, arrivalTime, days } = flight;
        const key = keyRule(flightNumber, departure, departureTime, arrival, arrivalTime, days);

        if (!permitFlightMap[key]) {
            // 如果 permitData 中没有这个航班数据，说明是缺少批复的
            diffData.added.push(flight);
        } else {
            // 如果 permitData 中有该航班，但内容不一致，说明是批复不同的

            const permitFlight = permitFlightMap[key];
            diffData.same.push({
                flight,
                permitFlight
            })
            if (JSON.stringify(flight) !== JSON.stringify(permitFlight)) {
                diffData.modified.push({
                    flight,
                    permitFlight
                });
            }
        }
    });

    // 检查 permitData 中是否有多余的航班
    permitFlights.forEach(flight => {
        const { flightNumber, departure, departureTime, arrival, arrivalTime, days } = flight;
        const key = keyRule(flightNumber, departure, departureTime, arrival, arrivalTime, days);

        if (!applyFlightMap[key]) {
            // 如果 applyData 中没有该航班，说明是移除
            diffData.removed.push(flight);
        }
    });

    showCompare.value = true
    docVisible.value = false
    console.log('diffData', diffData)

    // renderDiffVisualization(diffData);
}
const renderDiffVisualization = (diffData) => {
    // 你可以根据差异数据来更新你的 UI，例如显示不同颜色的表格
    // 示例：使用 Vue 渲染差异数据（可以根据需求修改）
    // 1. 显示新增数据
    diffData.added.forEach(flight => {
        // 在页面上渲染添加的航班信息
        console.log(`新增航班: ${JSON.stringify(flight)}`);
    });

    // 2. 显示修改数据
    diffData.modified.forEach(({ flight, permitFlight }) => {
        console.log(`修改航班:`);
        console.log(`原数据: ${JSON.stringify(permitFlight)}`);
        console.log(`新数据: ${JSON.stringify(flight)}`);
    });

    // 3. 显示移除数据
    diffData.removed.forEach(flight => {
        console.log(`移除航班: ${JSON.stringify(flight)}`);
    });
};
function handleFileRemove(country, file) {
    selectedFilesByCountry.value[country] = null
}

function fileListDisplay(country) {
    const f = selectedFilesByCountry.value[country]
    return f ? [{ name: f.name, url: '', status: 'ready' }] : []
}

// 一键同步 overflyDetails 到 fileData，同步飞越数据
function syncOverflyDetails(country, flightList, overflyDetails) {
    console.log('country', country)
    console.log('flightList', flightList)
    console.log('overflyDetails', overflyDetails)
    if (!fileDataByCountry.value[country]) {
        fileDataByCountry.value[country] = {
            permitFlight: [],
            permitRoute: []
        }
    }
    fileDataByCountry.value[country].permitFlight = JSON.parse(JSON.stringify(flightList))
    fileDataByCountry.value[country].permitRoute = JSON.parse(JSON.stringify(overflyDetails))

    console.log('fileDataByCountry', fileDataByCountry)
    ElMessage.success(`已同步 ${country} 航班数据`)
}

// 保存飞越批复
async function savePermissionData() {
    console.log('curTaskKey', curTaskKey)
    if (!curTaskKey.value) return ElMessage.error('任务未选择')
    const season = displaySeason.value
    if (!season) return ElMessage.error('缺少航季')

    const permissionArr = []
    //编辑模式
    if (isEditing) {
        console.log('编辑状态isEditing', isEditing)
        // console.log('curTaskKey.value', curTaskKey.value)
        // console.log('curTaskData.value', curTaskData.value)
        // console.log('season', season)
        // console.log('permissionNumbers', permissionNumbers)
        // console.log('selectedFlights', selectedFlights)
        const country = curCountryData.value.overflyCountry
        permissionArr.push({
            country,
            permissionNumber: permissionNumbers.value[country] || '',
            relateData: selectedFlights.value[country] || [],
            fileData: fileDataByCountry.value[country] || [],

            // fileName: file.name
        })
        // console.log('curTaskKey.value',curTaskKey.value)

    }
    //新增模式
    else {
        for (const country of Object.keys(selectedFilesByCountry.value)) {
            const file = selectedFilesByCountry.value[country]
            if (!file) continue

            permissionArr.push({
                country,
                permissionNumber: permissionNumbers.value[country] || '',
                relateData: selectedFlights.value[country] || [],
                fileData: fileDataByCountry.value[country] || [],//文件批复数据

                // fileName: file.name
            })


        }
    }
    // return


    if (permissionArr.length === 0 && !isEditing) return ElMessage.error('请上传至少一个批复文件')

    const formData = new FormData()
    console.log('待上传的批复文件', curPermitFile.value)
    // return
    const originalFile = curPermitFile.value
    //组装数据
    // const permissionKey = generatePermissionKey(season, curTaskKey.value, curCountryData.value.overflyCountry);
    formData.append('country', curCountryData.value.overflyCountry)
    formData.append('taskKey', curTaskKey.value)
    formData.append('id', curTaskData.value.id)
    formData.append('permissionId', curPermitId.value)
    formData.append('season', season)
    formData.append('permissionData', JSON.stringify(permissionArr))
    formData.append('isEditing', isEditing.value)
    // formData.append('files',originalFile.file)//批复的原始文件
    formData.append('files', originalFile.file)
    // 附加文件
    // if (!isEditing) {
    //     permissionArr.forEach(item => {
    //         formData.append('files', selectedFilesByCountry.value[item.country])
    //     })
    // }


    try {
        for (const [key, value] of formData.entries()) {
            console.log(key, value)
        }
        // return
        const res = await updatePermission(formData)
        if (res.data?.success) {

            ElMessage.success('保存成功')
            windowVisible.value = false
            emit('upload-success', res.data?.data)
            const permissionUpdated = await getPermission()
            const taskUpdated = await getTaskList()
            console.log('更新后的permission', permissionUpdated)
            console.log('taskUpdated', taskUpdated)

        } else {
            ElMessage.error(res.data?.message || '保存失败')
        }
    } catch (err) {
        console.error(err)
        ElMessage.error('请求出错')
    }

}
// function generatePermissionKey(season, taskKey, country) {
//         const raw = `${season}-${taskKey}-${country}`; // 拼接基础信息
//         const hash = crypto.createHash('md5').update(raw).digest('hex'); // 生成 MD5 哈希
//         return `perm_${hash.slice(0, 12)}`; // 截取前 12 位，前缀可自定义
//     }

</script>
<style lang="scss">
.dataBox {
    height: 600px;
    width: 50%;
    overflow-y: scroll;
    margin: 5px;
}

.inner-table {
    border-collapse: collapse;
    width: 100%;
    font-size: 13px;
}

.inner-table td {
    border-bottom: 1px solid #ddd;
    padding: 4px 8px;
}
</style>