<template>
    <div>
        <!-- 搜索框 -->
        <Searcher mode="permission" :list="permission" @update:result="filteredData = $event" />



        <!-- 搜索结果表格 -->
        <el-table :data="filteredData" style="width: 100%" @row-click="showClickRowDetail">
            <el-table-column label="航季" prop="season"></el-table-column>
            <el-table-column label="国家" prop="country"></el-table-column>
            <el-table-column label="批复号" prop="permissionNumber">
                <template #default="{ row }">
                    {{ row.permissionNumber ? row.permissionNumber : '无批复号' }}
                </template>

            </el-table-column>
            <el-table-column label="批复航班" prop="relateFlights" style="overflow: hidden;">
                <template #default="{ row }">
                    <div class="tag-cell">
                        <el-tag v-for="flight in row.fileData?.permitFlight || []" :key="flight.flightNumber"
                            size="small">
                            {{ flight.flightNumber }}
                        </el-tag>
                    </div>
                </template>
            </el-table-column>

        </el-table>

        <el-dialog v-model="showAddPermission">
            <div>
                <h3>任务列表</h3>
                <el-scrollbar height="300px" class="task-list">
                    <el-card v-for="task in taskList" :key="task.taskKey" class="task-item" shadow="hover"
                        @click="selectTask(task.taskKey)">
                        {{ task.taskName }}
                    </el-card>
                </el-scrollbar>
                <h3>选择国家</h3>
                <div v-if="showChooseCountry">
                    <el-scrollbar height="300px" class="task-list">
                        <el-card v-for="country in chooseCountry" :key="country" class="task-item" shadow="hover"
                            @click="selectCountry(country)">
                            {{ country }}
                        </el-card>
                    </el-scrollbar>
                </div>
            </div>
        </el-dialog>
        <el-drawer v-model="drawerVisible" title="批复详情" direction="rtl" size="40%" :destroy-on-close="true">
            <div v-if="clickPermit">
                <h3>批复详情</h3>

                <div>
                    <h4>国家: {{ clickPermit.country }}</h4>
                    <p>批复号: {{ clickPermit.permissionNumber? clickPermit.permissionNumber:'无批复号' }}</p>

                    <!-- <p>文件名: {{ clickPermit.fileName }}</p>
                    <p>上传时间: {{ clickPermit.uploadTime }}</p> -->
                    <fileView :file="currentFile" :loading="false" @click="previewFile(currentFile)"  />
                </div>

                <div v-if="clickPermit.fileData">
                    <!-- 显示 permitFlight -->
                    <h4>批准航班 (permitFlight)</h4>
                    <el-table :data="clickPermit.fileData.permitFlight"
                        style="width: 100%;max-height: 400px;overflow-y: scroll;">
                        <el-table-column label="航班号" prop="flightNumber"></el-table-column>
                        <el-table-column label="出发地" prop="departure"></el-table-column>
                        <el-table-column label="目的地" prop="arrival"></el-table-column>
                        <el-table-column label="开始日期" prop="startDate"></el-table-column>
                        <el-table-column label="结束日期" prop="endDate"></el-table-column>
                    </el-table>
                </div>

                <div v-if="clickPermit.fileData?.permitRoute">
                    <!-- 显示 permitRoute -->
                    <h4>批准航路 (permitRoute)</h4>
                    <el-table :data="clickPermit.fileData.permitRoute"
                        style="width: 100%;max-height: 400px;overflow-y: scroll">
                        <el-table-column label="航路" prop="sector"></el-table-column>
                        <el-table-column label="ATS 路由" prop="ATSroute"></el-table-column>
                        <el-table-column label="季节" prop="season"></el-table-column>
                        <el-table-column label="EET" prop="EET"></el-table-column>
                    </el-table>
                </div>

                <div v-if="clickPermit.relateData">
                    <!-- 显示 applyFlight -->
                    <h4>申请航班 (applyFlight)</h4>
                    <el-table :data="clickPermit.relateData.applyFlight"
                        style="width: 100%;max-height: 400px;overflow-y: scroll">
                        <el-table-column label="航班号" prop="flightNumber"></el-table-column>
                        <el-table-column label="出发地" prop="departure"></el-table-column>
                        <el-table-column label="目的地" prop="arrival"></el-table-column>
                        <el-table-column label="开始日期" prop="startDate"></el-table-column>
                        <el-table-column label="结束日期" prop="endDate"></el-table-column>
                    </el-table>
                </div>

                <div v-if="clickPermit.relateData?.applyRoute">
                    <!-- 显示 applyRoute -->
                    <h4>申请航路 (applyRoute)</h4>
                    <el-table :data="clickPermit.relateData.applyRoute"
                        style="width: 100%;max-height: 400px;overflow-y: scroll">
                        <el-table-column label="航路" prop="sector"></el-table-column>
                        <el-table-column label="ATS 路由" prop="ATSroute"></el-table-column>
                        <el-table-column label="季节" prop="season"></el-table-column>
                    </el-table>
                </div>
            </div>
        </el-drawer>
        <permissionMatch v-model:visible="showAddPermitChoose" :taskKey="selectTaskData?.taskKey" :data="curCountryData"
            @upload-success="refreshTaskList" />
        <filePreview :file="currentFile" v-model:visible="previewVisible"  />
        <div class="add-button-box">
            <el-button type="primary" @click="addPermission" class="add-button">新增批复</el-button>

        </div>
    </div>


</template>

<script setup>
import { getFlights, getRoutes, getPermission, baseURL, getTaskList, baseFileURL } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import { getLastSunday, calculateSeasons } from '../utils/seasonCalculator'
import { ElMessage, ElMessageBox } from 'element-plus'
import Searcher from '../utils/searcher.vue'
import permissionMatch from '../utils/permissionMatch.vue'
import fileView from '../utils/fileView.vue'
import filePreview from '../utils/filePreview.vue'
const permission = ref()
const flights = ref()
const searchQuery = reactive({});
const searchFields = ref([]);
const ignoredFields = ['id', 'days'];
const filteredData = ref([])
const taskList = ref([])
const currentFile = ref({})
const showAddPermission = ref(false)
const selectTaskData = ref()
const showAddPermitChoose = ref(false)
const showChooseCountry = ref(false)
const chooseCountry = ref()
const selectTask = (key) => {
    selectTaskData.value = taskList.value.find(item => item.taskKey == key)
    if (selectTaskData.value && Array.isArray(selectTaskData.value.data)) {
        chooseCountry.value = selectTaskData.value.data.map(item => item.overflyCountry)
        showChooseCountry.value = true
    } else {
        chooseCountry.value = []
    }

    // showAddPermission.value = false
    // showAddPermitChoose.value = true
    console.log('selectTaskData', selectTaskData)
    console.log('chooseCountry', chooseCountry)

}
const curCountryData = ref()
const selectCountry = (country) => {
    curCountryData.value = selectTaskData.value.data.find(item => item.overflyCountry == country)
    console.log('curCountryData', curCountryData)
    showAddPermission.value = false
    showAddPermitChoose.value = true
    // curCountryData.value=[]
    // selectTaskData.value = []
}
const clickPermit = ref()
const drawerVisible = ref()

const showClickRowDetail = (row) => {
    clickPermit.value = row
    drawerVisible.value = true
    console.log('clickPermit', clickPermit)
    currentFile.value = {
        uploadTime: row.uploadTime,
        name: row.fileName,
        url: row.url
    }
}
function isFullUrl(url) {
    return /^http?:\/\//.test(url)
}
const previewVisible = ref(false)
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

const seasonOptions = [
    {
        value: '2025summer',
        label: '2025夏秋航季',
    },
    {
        value: '2025winter',
        label: '2025冬春航季',
    },
    {
        value: '2024winter',
        label: '2024冬春航季',
    },
    {
        value: '2024winter',
        label: '2024夏秋航季',
    }
]
const searchFieldsMap = {
    'Season': '航季',
    'country': '国家',
    'days': '周期',
    'permissionNumber': '批复号',
    'relateFlights': '航班号',
    'startDate': '开始日期',
    'endDate': '结束日期',
}
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

    return daysStr.split('').map(num => weekMap[num] || num)
}
const getSeasonDates = (seasonCode) => {
    // 提取年份和航季类型
    const year = parseInt(seasonCode.substring(0, 4)); // 获取年份，例如 '2025'
    const seasonType = seasonCode.substring(4).toUpperCase(); // 获取航季类型，例如 'SUMMER' 或 'S'

    // 获取夏秋航季和冬春航季的日期
    const seasons = calculateSeasons(year);

    // 根据航季类型选择相应的开始和结束日期
    if (seasonType === 'SUMMER' || seasonType === 'S') {
        const summerSeason = seasons.find(season => season.key === `S${year}`);
        return {
            season: summerSeason.label,
            start: summerSeason.start,
            end: summerSeason.end
        };
    } else if (seasonType === 'WINTER' || seasonType === 'W') {
        const winterSeason = seasons.find(season => season.key === `W${year}`);
        return {
            season: winterSeason.label,
            start: winterSeason.start,
            end: winterSeason.end
        };
    } else {
        throw new Error('Invalid season code. Use "SUMMER" or "WINTER".');
    }
};

const form = reactive({
    country: '',
    permissionNumber: '',
    season: '',
    relateFlights: '',
    startDate: '',
    endDate: '',
    days: ''
})
const addPermission = () => {
    showAddPermission.value = true
    chooseCountry.value = []
    selectTaskData.value = []
}
const uploadURL = baseURL + '/permission/add'
const beforeUpload = (file) => {
    const rawForm = toRaw(form) // 转为普通 JS 对象
    console.log('rawForm', rawForm)
    if (!rawForm.country) {
        ElMessage.warning('请先填写国家名')
        return false
    }

    return true
}
console.log('form', form)
const handleSuccess = (res) => {
    ElMessage.success('上传成功')
    showAddPermission.value = false
}

console.log('测试', getSeasonDates('2025S'))
// const filteredData = reactive(permission)
const handleSearch = () => {
    console.log('搜索条件:', searchQuery);

    filteredData.value = permission.value.filter(item => {
        // 基于每个搜索字段进行过滤
        return Object.keys(searchQuery).every(key => {
            if (!searchQuery[key]) return true; // 如果搜索框为空，则不过滤该字段
            const value = item[key];
            if (key === 'startDate' || key === 'endDate') {
                const searchDate = new Date(searchQuery[key]);

                if (isNaN(searchDate)) return true; // 如果输入的日期无效，不过滤

                const itemDate = new Date(item[key]);

                if (key === 'startDate') {
                    return itemDate <= searchDate; // startDate 小于等于输入日期
                }

                if (key === 'endDate') {
                    return itemDate >= searchDate; // endDate 大于等于输入日期
                }
            }
            if (typeof value === 'string') {
                return value.toLowerCase().includes(searchQuery[key].toLowerCase());
            } else if (Array.isArray(value)) {
                // 如果是数组（relateFlights等），你可以使用 some 来判断是否有匹配的项
                return value.some(flight => flight.flightNum.toLowerCase().includes(searchQuery[key].toLowerCase()));
            }
            return '未搜索到数据';

        });

    });

    console.log('搜索后的数据:', filteredData.value);
};


onMounted(async () => {
    try {
        const flightResponse = await getFlights();
        // const routeResponse = await getRoutes();
        const permissionResponse = await getPermission();
        const res = await getTaskList()
        taskList.value = res.data
        flights.value = flightResponse.data;
        // routes.value = routeResponse.data;
        permission.value = permissionResponse.data;
        filteredData.value = [...permission.value];
        if (permission.value.length > 0) {
            const firstItem = permission.value[0]; // 获取第一个对象
            const fields = Object.keys(firstItem); // 获取所有字段名
            // 过滤掉不需要的字段
            searchFields.value = fields.filter(field => !ignoredFields.includes(field));
        }
        console.log('permissionResponse:', permission.value);
        console.log('searchFields:', searchFields.value);


    } catch (error) {
        console.error('API error:', error);
    }
});


</script>

<style scoped>
.tag-cell {
    display: flex;
    flex-wrap: nowrap;
    /* 不换行 */
    overflow-x: scroll;
    /* 超出隐藏 */
    text-overflow: ellipsis;
    /* 显示省略号 */
    white-space: nowrap;
    max-width: 100%;
    /* 限制宽度 */
}

.tag-cell .el-tag {
    margin-right: 4px;
    flex-shrink: 0;
    /* 防止 tag 被压扁 */
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
    height: 100px;
    position: absolute;
    bottom: 5%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.add-button {
    margin: auto;
}
</style>