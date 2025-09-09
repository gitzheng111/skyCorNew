<template>
    <el-button type="primary" class="mb-4" @click="toggleEdit">
        {{ isEditing ? '保存' : '编辑' }}
    </el-button>
    <el-button v-if="isEditing" type="warning" class="mb-4" @click="cancelEidt">取消编辑
    </el-button>
    <el-table :data="editableData" style="width: 100%">
        <el-table-column v-for="col in getValidColumns(editableData)" :key="col" :prop="col"
            :label="fieldLabelMap[col] || col">
            <template #default="{ row }">
                <!-- 可编辑列 -->
                <el-input v-if="isEditing && isEditable(col)" v-model="row[col]" size="small" />
                <!-- 只读列 -->
                <span v-else>{{ formatCell(row[col]) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
            <template #default="{ $index }">
                <el-button type="danger" icon="el-icon-delete" size="mini" v-if="isEditing"
                    @click="deleteRow($index)" />
            </template>
        </el-table-column>
    </el-table>

</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { updateOverflyData } from '../api.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
    overflyDataFromFather: {
        type: [Array, Object],
        default: () => []
    },
    country: String,
    id: String,
    allData: [Array, Object],
    curSeason: String,

})
const emit = defineEmits(['updateFinish'])

// const overflyDetails = computed(() => props.overflyDataFromFather)
const overflyDetails = computed(() => {
    // 如果传进来是数组，直接用；如果是对象，就包成数组；否则空数组
    if (Array.isArray(props.overflyDataFromFather)) {
        return props.overflyDataFromFather
    } else if (props.overflyDataFromFather && typeof props.overflyDataFromFather === 'object') {
        return [props.overflyDataFromFather]
    }
    return []
})
const deleteRow = (index) => {
    editableData.value.splice(index, 1)
}

// console.log('overflyDetails',overflyDetails)
// const overflyDetails = ref(props.overflyDataFromFather)
const editableData = ref([])
const isEditing = ref(false)
const keepAllColumns = false;

const fieldOrder = [
    "season",
    "sector",
    "departure",
    "arrival",

    "routeCode",
    "ATSroute",
    "entryPoint",
    "entryTime",
    "actualEntryTime",

    "exitPoint",
    "exitPoint",
    
    "exitTime",
    "actualExitTime",

    "EET",
    "flightLevel",
    "speed",
    "altEntryPointer",
    "altExitPointer",
];
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
    altEntryPointer: '备用入境点',
    altExitPointer: '备用出境点',
    actualEntryTime:'实际入境时间',
    actualExitTime:'实际出境时间'


};
// 可以编辑的列
const isEditable = (col) => {
    return ["ATSroute", "entryPoint", "entryTime", "exitPoint", "exitTime", "EET", "flightLevel", "speed", "altEntryPointer", "altExitPointer","actualEntryTime","actualExitTime"].includes(col)
}

// 格式化单元格显示
const formatCell = (val) => {
    if (Array.isArray(val)) return val.join(' / ')
    return val
}
const cancelEidt = () => {
    isEditing.value = false
}
// 编辑/保存切换
const toggleEdit = async () => {
    if (isEditing.value) {
        // 点击保存，发送请求
        const targetDataIndex = props.allData.data.findIndex(item => item.season == props.curSeason)
        if (targetDataIndex !== -1) {
            // 深拷贝 allData 避免直接修改 props
            const submitData = JSON.parse(JSON.stringify(props.allData))
            // 替换当前航季的数据
            submitData.data[targetDataIndex].data = editableData.value
            console.log(' submitData', submitData)
            try {
                await updateOverflyData(submitData)
                ElMessage.success('更新成功')
                isEditing.value = false
                emit('updateFinish')
            } catch (err) {
                console.error(err)
                ElMessage.error('更新失败')
            }
            // 发送给后端
        } else {
            ElMessage.warning('未找到对应航季的数据')

        }
        // return

    } else {
        // 点击编辑
        isEditing.value = true

    }
}
// 取出有效字段（只保留有值的列）
const getValidColumns = (details) => {
    // console.log('details',details)
    if (!details || details.length === 0) return [];

    // 收集所有字段
    const allKeys = [...new Set(details.flatMap(item => Object.keys(item)))];

    // 过滤逻辑：是否保留空列
    const validKeys = keepAllColumns
        ? allKeys
        : allKeys.filter((key) =>
            details.some((item) => {
                const val = item[key];
                return val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
            })
        );

    // 按固定顺序排序
    return validKeys.sort((a, b) => {
        const ai = fieldOrder.indexOf(a);
        const bi = fieldOrder.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b); // 都不在顺序表 → 字母排序
        if (ai === -1) return 1; // a 不在 → 排后
        if (bi === -1) return -1; // b 不在 → 排后
        return ai - bi; // 按顺序表
    });
};
// deep copy 生成可编辑副本
watch(() => props.overflyDataFromFather, (val) => {
    // console.log('props.allData', props.allData)
    if (Array.isArray(val)) {
        editableData.value = JSON.parse(JSON.stringify(val))
    } else if (val && typeof val === 'object') {
        editableData.value = [JSON.parse(JSON.stringify(val))]
    } else {
        editableData.value = []
    }
}, { immediate: true })

</script>