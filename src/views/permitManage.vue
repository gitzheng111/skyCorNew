<template>
    <div>
        <!-- 搜索框 -->
        <Searcher mode="permission" :list="permission" @update:result="filteredData = $event" />



        <!-- 搜索结果表格 -->
        <el-table :data="filteredData" style="width: 100%">
            <el-table-column label="航季" prop="Season"></el-table-column>
            <el-table-column label="国家" prop="country"></el-table-column>
            <el-table-column label="批复号" prop="permissionNumber"></el-table-column>
            <el-table-column label="批复航班" prop="relateFlights">
                <template #default="{ row }">
                    <div v-for="flight in row.relateFlights" :key="flight.flightNum">{{ flight.flightNum }}</div>
                </template>
            </el-table-column>
            <el-table-column label="起始时间" prop="startDate"></el-table-column>
            <el-table-column label="结束时间" prop="endDate"></el-table-column>
        </el-table>

        <el-dialog v-model="showAddPermission">
            <el-form ref="formRef" :model="form" label-width="100px">
                <el-form-item label="国家">
                    <el-input v-model="form.country" placeholder="国家" />
                </el-form-item>

                <el-form-item label="上传文件">
                    <el-upload :action="uploadURL" :data="toRaw(form)" name="file" :show-file-list="true"
                        :on-success="handleSuccess" :before-upload="beforeUpload" accept=".pdf,.doc,.docx">
                        <el-button type="primary">上传批复文件</el-button>
                    </el-upload>
                </el-form-item>
            </el-form>
        </el-dialog>

        <div class="add-button-box">
            <el-button type="primary" @click="addPermission" class="add-button">新增批复</el-button>

        </div>
    </div>


</template>

<script setup>
import { getFlights, getRoutes, getPermission, baseURL } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted,toRaw } from 'vue'
import { getLastSunday, calculateSeasons } from '../utils/seasonCalculator'
import { ElMessage, ElMessageBox } from 'element-plus'
import Searcher from '../utils/searcher.vue'

const permission = ref()
const flights = ref()
const searchQuery = reactive({});
const searchFields = ref([]);
const ignoredFields = ['id', 'days'];
const filteredData = ref([])
const showAddPermission = ref(false)
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
}
const uploadURL = baseURL + '/permission/add'
const beforeUpload = (file) => {
  const rawForm = toRaw(form) // 转为普通 JS 对象
    console.log('rawForm',rawForm)
  if (!rawForm.country) {
    ElMessage.warning('请先填写国家名')
    return false
  }

  return true
}
console.log('form',form)
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