<template>
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
        <el-table-column v-for="col in validColumns" :key="col" :prop="col"
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
import { updateOverflyData } from '../api.js'
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

    editableData.value.splice(index, 1)
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
    editableData.value.push(emptyFormFromExisting())
    console.log('editableData', editableData)

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
    actualEntryTime: '实际入境时间',
    actualExitTime: '实际出境时间',
    departure: '起飞机场',
    arrival: '落地机场',
};
// 可以编辑的列
const isEditable = (col) => {
    return ["departure", "arrival", "sector", "ATSroute", "entryPoint", "entryTime", "exitPoint", "exitTime", "EET", "flightLevel", "speed", "altEntryPointer", "altExitPointer", "actualEntryTime", "actualExitTime", "routeCode"].includes(col)
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
        console.log('props.allData', props.allData)
        if (props.mode == 'forever') {
            const targetDataIndex = props.allData.data.findIndex(item => item.season == props.curSeason)
            if (targetDataIndex !== -1) {
                // 深拷贝 allData 避免直接修改 props
                // console.log('(props.allData',typeof(props.allData))
                // const submitData = Array.isArray(props.allData)?props.allData:JSON.parse(JSON.stringify(props.allData))
                const submitData =props.allData
                console.log('submitData',submitData)

                // 替换当前航季的数据
                submitData.data[targetDataIndex].data = editableData.value
                // console.log(' submitData', submitData)
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

    }
}
// 取出有效字段（只保留有值的列）
const fetchKeys = ref()
const editKeys = () => {
    const nowKeys = fetchKeys.value
    const allKeys = ['sector', 'ATSroute', 'routeCode', 'entryPoint']

}
const validColumns = computed(() => {
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
        console.log('routeFields',routeFields)
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
// const getValidColumns = (details) => {
//     // console.log('details',details)
//     if (!details || details.length === 0) return [];

//     // 收集所有字段
//     const allKeys = [...new Set(details.flatMap(item => Object.keys(item)))];

//     // 过滤逻辑：是否保留空列
//     const validKeys = keepAllColumns
//         ? allKeys
//         : allKeys.filter((key) =>
//             details.some((item) => {
//                 const val = item[key];
//                 return val !== null && val !== "" && !(Array.isArray(val) && val.length === 0);
//             })
//         );
//    fetchKeys.value = validKeys

//     // 按固定顺序排序
//     return validKeys.sort((a, b) => {
//         const ai = fieldOrder.indexOf(a);
//         const bi = fieldOrder.indexOf(b);
//         if (ai === -1 && bi === -1) return a.localeCompare(b); // 都不在顺序表 → 字母排序
//         if (ai === -1) return 1; // a 不在 → 排后
//         if (bi === -1) return -1; // b 不在 → 排后
//         return ai - bi; // 按顺序表
//     });

// };
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
    // loading.hide()
}, { immediate: true })

</script>