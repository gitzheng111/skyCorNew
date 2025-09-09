<template>
    <el-dialog v-model="windowVisible" title="飞越批复匹配" width="80%">
        <div v-if="!curTaskKey">
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
                    <h3>航班列表 & 批复上传</h3>

                    <div v-for="countryData in curTaskData.data" :key="countryData.overflyCountry">
                        <el-card class="mb-4">
                            <div class="mb-2 font-bold flex-between">
                                <span>{{ countryData.overflyCountry }}</span>
                                <el-input v-model="permissionNumbers[countryData.overflyCountry]" placeholder="请输入批复号"
                                    style="width: 200px"></el-input>
                                <span class="season-tip">航季：{{ displaySeason }}</span>
                            </div>

                            <!-- 航班选择 -->
                            <el-table :data="selectedFlights[countryData.overflyCountry]?.applyFlight || []"
                                style="margin-bottom: 8px" height="200">
                                <el-table-column prop="flightNumber" label="航班号" />
                                <el-table-column prop="departure" label="起飞机场" />
                                <el-table-column prop="arrival" label="目的机场" />
                            </el-table>
                            <el-table :data="selectedFlights[countryData.overflyCountry]?.applyRoute|| []"
                                style="margin-bottom: 8px" height="200">
                                <el-table-column prop="ATSroute" label="航线" />
                                <el-table-column prop="entryPoint" label="入境点" />
                                <el-table-column prop="exitPoint" label="出境点" />
                            </el-table>

                            <!-- 一键同步 overflyDetails -->
                            <el-button type="primary" size="small"
                                @click="syncOverflyDetails(countryData.overflyCountry, countryData.flightList, countryData.overflyDetails)">
                                同步航班数据到批复数据
                            </el-button>

                            <!-- 可编辑文件数据表格 -->
                            <el-table :data="fileDataByCountry[countryData.overflyCountry]?.permitFlight"
                                style="margin-top: 8px">
                                <el-table-column prop="flightNumber" label="航班号" />
                                <el-table-column prop="departure" label="起飞机场" />
                                <el-table-column prop="arrival" label="目的机场" />
                            </el-table>
                            <el-table :data="fileDataByCountry[countryData.overflyCountry]?.permitRoute"
                                style="margin-top: 8px">
                                <el-table-column prop="ATSroute" label="航线" />
                                <el-table-column prop="entryPoint" label="入点" />
                                <el-table-column prop="exitPoint" label="出点" />
                            </el-table>

                            <!-- 批复文件上传（单文件） -->
                            <el-upload :auto-upload="false" :file-list="fileListDisplay(countryData.overflyCountry)"
                                :on-change="file => handleFileChange(countryData.overflyCountry, file)"
                                :on-remove="(file) => handleFileRemove(countryData.overflyCountry, file)"
                                accept=".pdf,.doc,.docx">
                                <el-button type="success" icon="Upload">
                                    为「{{ countryData.overflyCountry }}」添加批复文件
                                </el-button>
                            </el-upload>

                        </el-card>
                    </div>

                </div>
            </div>
        </div>

        <template #footer>
            <el-button @click="windowVisible = false">取消</el-button>
            <el-button type="primary" @click="savePermissionData">保存</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { getTaskList, updatePermission } from '../api.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
    taskKey: String,
    visible: Boolean
})

const taskList = ref([])
const curTaskKey = ref('')
const curTaskData = ref(null)
const windowVisible = ref(props.visible)

watch(() => props.visible, val => (windowVisible.value = val))
watch(() => props.taskKey, val => curTaskKey.value = val || '')

const permissionNumbers = ref({})
const selectedFlights = ref({}) // { country: [航班] }
const selectedFilesByCountry = ref({}) // { country: File }
const fileDataByCountry = ref({}) // { country: [{ATSroute, entryPoint, exitPoint}] }

onMounted(async () => {
    const res = await getTaskList()
    taskList.value = res.data
    if (props.taskKey) selectTask(props.taskKey)
})

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

// 文件选择
function handleFileChange(country, fileEvt) {
    const raw = fileEvt.raw
    selectedFilesByCountry.value[country] = raw
}

function handleFileRemove(country, file) {
    selectedFilesByCountry.value[country] = null
}

function fileListDisplay(country) {
    const f = selectedFilesByCountry.value[country]
    return f ? [{ name: f.name, url: '', status: 'ready' }] : []
}

// 一键同步 overflyDetails 到 fileData
function syncOverflyDetails(country, flightList, overflyDetails) {
    fileDataByCountry.value[country].permitFlight = JSON.parse(JSON.stringify(flightList))
fileDataByCountry.value[country].permitRoute = JSON.parse(JSON.stringify(overflyDetails))
    console.log('fileDataByCountry', fileDataByCountry)
    ElMessage.success(`已同步 ${country} 航班数据`)
}

// 保存
async function savePermissionData() {
    if (!curTaskKey.value) return ElMessage.error('任务未选择')
    const season = displaySeason.value
    if (!season) return ElMessage.error('缺少航季')

    const permissionArr = []

    for (const country of Object.keys(selectedFilesByCountry.value)) {
        const file = selectedFilesByCountry.value[country]
        if (!file) continue

        permissionArr.push({
            country,
            permissionNumber: permissionNumbers.value[country] || '',
            relateData: selectedFlights.value[country] || [],
            fileData: fileDataByCountry.value[country] || [],
            fileName: file.name
        })
    }

    if (permissionArr.length === 0) return ElMessage.error('请上传至少一个批复文件')

    const formData = new FormData()

    formData.append('taskKey', curTaskKey.value)
    formData.append('id', curTaskData.value.id)
    formData.append('season', season)
    formData.append('permissionData', JSON.stringify(permissionArr))

    // 附加文件
    permissionArr.forEach(item => {
    formData.append('files', selectedFilesByCountry.value[item.country]) 
})

    try {
        const res = await updatePermission(formData)
        if (res.data?.success) {

            ElMessage.success('保存成功')
            windowVisible.value = false
        } else {
            ElMessage.error(res.data?.message || '保存失败')
        }
    } catch (err) {
        console.error(err)
        ElMessage.error('请求出错')
    }
}
</script>