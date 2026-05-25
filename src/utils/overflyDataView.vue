<template>
    <!-- <el-button v-if="props.editShow" type="success" class="mb-4" @click="toggleAdd">
        {{ '新增'}}
    </el-button> -->
    <el-button v-if="props.editShow" type="primary" class="mb-4" @click="toggleEdit">
        {{ isEditing ? '保存' : '编辑' }}
    </el-button>
    <el-button v-if="isEditing" type="warning" class="mb-4" @click="cancelEidt">取消编辑
    </el-button>
    <el-button v-if="isEditing" type="primary" :icon="Plus" @click="addRow">
        <el-icon class="el-icon--right">
            <Plus />
        </el-icon>
        添加一条
    </el-button>
    <!-- <el-button v-if="isEditing" type="warning" class="mb-4" @click="editKeys">编辑字段
    </el-button> -->
    <el-table :data="editableData" style="width: 100%;max-height: 600px;overflow-y: scroll;">
        <el-table-column v-for="col in validColumns" :key="col" :prop="col" :label="fieldLabelMap[col] || col">
            <template #default="{ row, $index }">
                <!-- 可编辑列 -->
                <el-input v-if="isEditing && isEditable(col)" v-model="row[col]"
                    @change="val => onFieldChange( $index, col, val)" size="small" />
                <!-- 只读列 -->
                <span v-else>{{ formatCell(row[col]) }}</span>
            </template>
        </el-table-column>
        <el-table-column v-if="props.editShow" label="操作" width="100">
            <template #default="{ $index }">
                <el-button type="danger" size="mini" :disabled="!isEditing" @click="deleteRow($index)">
                    <el-icon>
                        <Delete />
                    </el-icon>
                </el-button>
            </template>
        </el-table-column>
    </el-table>

</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { updateOverflyData, addInfoCenter } from '../api.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLoading } from '../plugins/loading'
// 
const loading = useLoading()
const props = defineProps({
    overflyDataFromFather: {
        type: [Array, Object],
        default: () => []
    },
    country: String,
    id: String,
    allData: [Array, Object],
    curSeason: String,
    mode: String,
    editShow: Boolean,
    countryData: [Array, Object],

})
const countryData = ref()
watch(() => props.countryData, (val) => {
    
    if (!val) return;
    loading.show('加载飞越航路数据...');
    countryData.value = val;
    setTimeout(() => loading.hide(), 300); // 模拟数据渲染完再隐藏
}, { immediate: true });
// watch(() => props.countryData, (val) => {
//     countryData.value = val
//     // console.log('countryData',countryData)
// }, { immediate: true })

// watch(() => props.data, (val) => {
//     flight.value = val
//     console.log('props',props.data)

//     console.log('flight',flight.value)
// }, { immediate: true })

const emit = defineEmits(['updateFinish'])

// const overflyDetails = computed(() => props.overflyDataFromFather)
// const overflyDetails = computed(() => {
//     // 如果传进来是数组，直接用；如果是对象，就包成数组；否则空数组
//     if (Array.isArray(props.overflyDataFromFather)) {
//         return props.overflyDataFromFather
//     } else if (props.overflyDataFromFather && typeof props.overflyDataFromFather === 'object') {
//         return [props.overflyDataFromFather]
//     }
//     return []
// })
const updateDate = ref([])
const deleteRow = (index) => {
    console.log('editableData', editableData)
    // console.log('allData',props.allData)
    const removed = editableData.value[index]
    console.log('removed', removed)
    editableData.value.splice(index, 1)
    changeLogs.value.push({
        action: 'delete',
        do: { old: removed }
    })
    // updateDate.value = { ...props.allData, data: editableData.value }
    // updateDate.value.data = editableData.value
    // console.log('编辑后allData',updateDate.value )

}
const emptyFormFromExisting = () => {
    const firstItem = editableData.value[0] || {}
    const newRow = {}
    Object.keys(firstItem).forEach(key => {
        // 这里可以根据类型初始化为空值
        if (Array.isArray(firstItem[key])) {
            newRow[key] = []
        } else if (typeof firstItem[key] === 'number') {
            newRow[key] = 0
        } else {
            newRow[key] = ''
        }
    })
    return newRow
}

// 增加一行
const addRow = () => {
    const newRow = emptyFormFromExisting()

    editableData.value.push(emptyFormFromExisting())
    console.log('editableData', editableData)
    changeLogs.value.push({
        action: 'add',
        do: { new: newRow }
    })
}



const handleBatchDelete = async () => {
    if (selectedRoutes.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定删除选中的 ${selectedRoutes.value.length} 条航路数据？`,
            '警告',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 假设每条航路有唯一的 id 字段
        const idsToDelete = selectedRoutes.value.map(item => item.route_id)
        console.log('idsToDelete', idsToDelete)
        // 调用后端接口进行删除
        await deleteRoutesByIds(idsToDelete)

        // 或者：本地前端删除（模拟）
        // routesData.value = routesData.value.filter(
        //   item => !idsToDelete.includes(item.id)
        // )


        selectedRoutes.value = []
        const newRouteResponse = await getRoutes();
        if (newRouteResponse?.data) {
            routesData.value = newRouteResponse.data;
            ElMessage.success('删除成功')
        }

    } catch (err) {
        // 用户点击取消
        console.log('批量删除取消')
    }
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
    "altEntryPoint",
    "altExitPoint",
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
    altEntryPoint: '备用入境点',
    altExitPoint: '备用出境点',
    actualEntryTime: '实际入境时间',
    actualExitTime: '实际出境时间',
    departure: '起飞机场',
    arrival: '落地机场',
};
// 可以编辑的列
const isEditable = (col) => {
    return ["departure", "arrival", "sector", "ATSroute", "entryPoint", "entryTime", "exitPoint", "exitTime", "EET", "flightLevel", "speed", "altEntryPoint", "altExitPoint", "actualEntryTime", "actualExitTime", "routeCode"].includes(col)
}

// 格式化单元格显示
const formatCell = (val) => {
    if (Array.isArray(val)) return val.join(' / ')
    return val
}
const cancelEidt = () => {
    isEditing.value = false
}
const originalData = ref([])
const changeLogs = ref([])
// 编辑/保存切换
const messageBatch = ref([])
const toggleEdit = async () => {
    console.log('未更改的数据', props.allData)
    console.log('编辑的数据', editableData.value)

    if (isEditing.value && changeLogs.value) {
        console.log('changeLogs.value',changeLogs.value)
        // 点击保存，发送请求
        const newInfo = {
            title: '飞越更新',
            message: { text: `更新了飞越数据`, detail: changeLogs.value },
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            processed: 'no',//no,in progress,yes
            type: 'overfly',//flight,route,overfly

            urgentLevel: 'normal'//normal,warning,danger
        }
        console.log('newInfo',newInfo)
        // return
        messageBatch.value.push(newInfo)
        console.log('messageBatch',messageBatch.value)

        // console.log('props.allData', props.allData)
        if (props.mode == 'forever') {
            const targetDataIndex = props.allData.data.findIndex(item => item.season == props.curSeason)
            if (targetDataIndex !== -1) {
                // 深拷贝 allData 避免直接修改 props
                // console.log('(props.allData',typeof(props.allData))
                // const submitData = Array.isArray(props.allData)?props.allData:JSON.parse(JSON.stringify(props.allData))
                //深度拷贝所有飞越数据并在此基础做修改
                const submitData = props.allData
                console.log('submitData', submitData)

                // 替换当前航季的数据
                submitData.data[targetDataIndex].data = editableData.value
                // console.log(' submitData', submitData)
                try {
                    await updateOverflyData(submitData)
                    await addInfoCenter(messageBatch.value)
                    ElMessage.success('更新成功')
                    changeLogs.value = []
                    isEditing.value = false
                    emit('updateFinish',submitData)
                } catch (err) {
                    console.error(err)
                    ElMessage.error('更新失败')
                }
                // 发送给后端
            } else {
                ElMessage.warning('未找到对应航季的数据')

            }
        }
        if (props.mode == 'temp') {
            console.log('编辑的editableData.value', editableData.value)

            isEditing.value = false
            emit('updateFinish', editableData.value)

        }

        // return

    } else {
        // 点击编辑
        isEditing.value = true
        originalData.value = JSON.parse(JSON.stringify(editableData.value))
        // originalData.value = editableData.value
        console.log('初始的数据', originalData.value)
        return
    }
}

const curEditRowId = ref()
// const onFieldChange = (idx, field, newValue) => {
//     console.log('输入的值',idx, field, newValue)
//     const oldValue = originalData.value[idx][field]||null

//     // 没变化？不记录
//     if (oldValue === newValue) return

//     // 更新原始值
//     originalData.value[idx][field] = newValue

//     // 按 sector + routeCode 聚合
//     const key = `${editableData.value[idx].sector}-${editableData.value[idx].routeCode}`
//     if (!changeLogs.value[key]) {
//         changeLogs.value[key] = {
//             sector: editableData.value[idx].sector,
//             routeCode: editableData.value[idx].routeCode,
//             action: 'update',
//             changes: []
//         }
//     }

//     changeLogs.value[key].changes.push({
//         index: idx,
//         field,
//         oldValue,
//         newValue
//     })
//     console.log('changeLogs.value', changeLogs.value)
//     console.log('变化后的originalData.value', originalData.value)

// }
const onFieldChange = (idx, field, newValue) => {
    console.log('输入的值', idx, field, newValue)
    const oldValue = originalData.value[idx][field] ?? null

    // 没变化，不记录
    if (oldValue === newValue) return

    // 更新原始值
    originalData.value[idx][field] = newValue

    // 拼分组 key
    const sector = editableData.value[idx].sector
    const routeCode = editableData.value[idx].routeCode
    const key = `${sector}-${routeCode}`

    // 查找是否已有对应的分组
    let group = changeLogs.value.find(item => item.key === key)

    // 如果还没有，就创建一个
    if (!group) {
        group = {
            key,
            sector,
            routeCode,
            action: 'update',
            changes: []
        }
        changeLogs.value.push(group)
    }

    // 加入 change 记录
    group.changes.push({
        index: idx,
        field,
        oldValue,
        newValue
    })

    console.log('changeLogs.value', changeLogs.value)
    console.log('变化后的originalData.value', originalData.value)
}
// 取出有效字段（只保留有值的列）
const fetchKeys = ref()
const editKeys = () => {
    const nowKeys = fetchKeys.value
    const allKeys = ['sector', 'ATSroute', 'routeCode', 'entryPoint']

}
const validColumns = computed(() => {
        console.log('父组件countryData.value,',countryData.value)
    if (!countryData.value || !countryData.value.applyRequire) {
        return [];
    }

    try {
        const applyRequire = JSON.parse(countryData.value.applyRequire);
        const routeFields = applyRequire?.['定期']?.route || [];

        fetchKeys.value = routeFields;

        return routeFields.sort((a, b) => {
            const ai = fieldOrder.indexOf(a);
            const bi = fieldOrder.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
    } catch (e) {
        console.error('解析 applyRequire 出错', e);
        return [];
    }
});
const getValidColumns = (details, countryData) => {
    // console.log('details',details,'countryData',countryData)
    if (!countryData || !countryData.applyRequire) return [
        ElMessage.error('无数据')
    ];

    let routeFields = [];
    loading.show('加载飞越数据...')

    try {
        // 解析 applyRequire JSON
        const applyRequire = JSON.parse(countryData.applyRequire);

        // 取定期.route
        routeFields = applyRequire?.['定期']?.route || [];
        console.log('routeFields', routeFields)
    } catch (e) {
        console.error('解析 applyRequire 出错', e);
    }

    // 如果 routeFields 为空，fallback 到数据 keys
    // if (!routeFields.length && details && details.length > 0) {
    //     routeFields = [...new Set(details.flatMap(item => Object.keys(item)))];
    // }

    // 存入 fetchKeys（方便编辑字段弹窗使用）
    fetchKeys.value = routeFields;
    loading.hide()
    // 如果有 fieldOrder，按顺序排序
    return routeFields.sort((a, b) => {
        const ai = fieldOrder.indexOf(a);
        const bi = fieldOrder.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

};

// deep copy 生成可编辑副本
watch(() => props.overflyDataFromFather, (val) => {
    // loading.show('加载飞越航路数据')

    // console.log('props.allData', props.allData)
    if (Array.isArray(val)) {
        editableData.value = JSON.parse(JSON.stringify(val))
    } else if (val && typeof val === 'object') {
        editableData.value = [JSON.parse(JSON.stringify(val))]
    } else {
        editableData.value = []
    }
    console.log('飞越航路数据',editableData)
    // loading.hide()
}, { immediate: true })

</script>