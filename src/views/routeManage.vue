<template>
    <div>
        <!-- 搜索框 -->
        <Searcher mode="route" :list="routesData" @update:result="filteredRoutes = $event" />
        <div class="add-button-box">
            <el-button type="primary" @click="addRoute" class="add-button">新增航路</el-button>
            <el-button type="warning" :disabled="selectedRoutes.length === 0"
                @click="editSelectedRoutes">批量编辑</el-button>

            <el-button type="danger" :disabled="selectedRoutes.length === 0" @click="handleBatchDelete">
                批量删除
            </el-button>
        </div>
        <!-- 搜索结果表格 -->
        <el-table :data="filteredRoutes" style="width: 100%" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column type="expand">
                <template #default="{ row }">
                    <el-tabs>
                        <el-tab-pane v-for="(route, index) in row.overflyCountry" :key="index">
                            <template #label>
                                <span>
                                    {{ route.country }}
                                </span>
                            </template>
                            <div>
                                <!-- <el-button size="small" @click="keepAllColumns = !keepAllColumns">
                                    {{ keepAllColumns ? '只显示有值列' : '显示全部列' }}
                                </el-button> -->
                                <el-table :data="route.overflyDetails">
                                    <el-table-column v-for="col in getValidColumns(route.overflyDetails)" :key="col"
                                        :prop="col" :label="fieldLabelMap[col] || col">
                                        <template #default="{ row }">
                                            <span v-if="Array.isArray(row[col])">{{ row[col].join(' / ') }}</span>
                                            <span v-else>{{ row[col] }}</span>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </div>
                        </el-tab-pane>

                    </el-tabs>
                </template>
            </el-table-column>
            <el-table-column label="航季" prop="season"></el-table-column>

            <el-table-column label="起飞机场" prop="departure"></el-table-column>
            <el-table-column label="目的机场" prop="arrival"></el-table-column>
            <el-table-column label="航段" prop="sector"></el-table-column>
            <el-table-column label="航路" prop="ATSroute">
            </el-table-column>
            <el-table-column label="航线代码" prop="routeCode"></el-table-column>
            <el-table-column label="飞越国家" prop="overflyCountry">
                <template #default="{ row }">
                    {{ getOverflyCountryNames(row.overflyCountry) }}
                </template>
            </el-table-column>

        </el-table>
        <add-route-tool v-model:showAddRoute="showAddRoute" :isEditing="isEditing" :selectedRoutes="selectedRoutes"
            :countryData="countryData" @submit="handleSubmitRoutes" :uploading="uploading" />
       


    </div>


</template>

<script setup>
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, updateRoutes } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import { getLastSunday, calculateSeasons } from '../utils/seasonCalculator'
import { ElMessage, ElMessageBox } from 'element-plus'
import SeasonSelect from '../utils/seasonSelect.vue'
import AirportAutocomplete from '../utils/airportAutocomplete.vue'
import { useAirportSearch } from '../components/useAirportUtils'
// const { airportSearch } = useAirportSearch(airportCodeData)
import Searcher from '../utils/searcher.vue'
import AddRouteTool from '../utils/addRouteTool.vue'

const uploadURL = baseURL + '/permission/add'

const permission = ref()
const flights = ref()
const searchQuery = reactive({});
const searchFields = ref([]);
const ignoredFields = ['id', 'days'];
const filteredData = ref([])
const showAddRoute = ref(false)
const routesData = ref()
const countryData = ref()
const overflyCountryDetails = ref([])
const allFields = ref([])
const isEditing = ref(false);
const editRouteIds = ref([]); // 存放被编辑的 route_id
const filteredRoutes = ref([])
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
// 字段映射：后端字段名 -> 中文表头
const keepAllColumns = false;

const fieldOrder = [
    "season",
    "sector",
    "routeCode",
    "ATSroute",
    "entryPoint",
    "entryTime",
    "exitPoint",
    "exitTime",
    "EET",
    "flightLevel",
    "speed",
    "altEntryPonit",
    "altExitPonit"

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
    altEntryPonit:"备用入境点",
    altExitPonit:"备用出境点"
};

// 取出有效字段（只保留有值的列）
const getValidColumns = (details) => {
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

const emptyRoute = () => ({
    season: '',
    departure: '',
    arrival: '',
    sector: '',
    ATSroute: '',
    routeCode: '',
    overflyCountry: [],
    autoRoutePrefix: ''
})

const addRoute = () => {
    isEditing.value = false;
    addRouteForms.value = [emptyRoute()];
    allFieldsList.value = [[]];
    showAddRoute.value = true;
}
const countryOptions = ref([]);
const loadingCountries = ref(false);
//新增航路的数据源头
const addRouteForms = ref([emptyRoute()])

const countrySearch = (query) => {
    if (!query) {
        countryOptions.value = [];
        return;
    }

    loadingCountries.value = true;

    // 模拟本地搜索（也可以调用接口）
    setTimeout(() => {
        countryOptions.value = countryData.value.filter(item =>
            item.country.toLowerCase().includes(query.toLowerCase())
        );
        loadingCountries.value = false;
    }, 200);
};

const createFilterCountry = (queryString) => {
    return (item) => {
        return item.number.toLowerCase().includes(queryString.toLowerCase());
    };
};


const removeRow = (index) => {
    addRouteForms.value.splice(index, 1)
}
const getOverflyCountryNames = (overflyCountry) => {
    if (!overflyCountry) return ''
    return overflyCountry.map(item => item.country).join(', ')
}
const watchRouteCodeAutoGeneration = (form) => {
    watch(
        () => [form.departure, form.arrival],
        ([departure, arrival]) => {
            if (departure && arrival) {
                const prefix = `${departure}-${arrival}`
                console.log('prefix', prefix)
                // 如果 routeCode 是空的，或仍是旧的自动前缀，则更新
                if (!form.routeCode || form.routeCode.startsWith(form.autoRoutePrefix)) {
                    form.routeCode = `${prefix}-`
                    form.sector = prefix

                }

                form.autoRoutePrefix = prefix
                form.sector = prefix
            }
        },
        { immediate: true }
    )
}
addRouteForms.value.forEach(form => watchRouteCodeAutoGeneration(form))

const addRow = () => {
    const newForm = emptyRoute()
    addRouteForms.value.push(newForm)
    nextTick(() => watchRouteCodeAutoGeneration(newForm))
}
const allFieldsList = ref([[]])
const handleDepartureSelect = (airport) => {
    console.log('选中的机场:', airport)
    addRouteForms.value.forEach(form => watchRouteCodeAutoGeneration(form))

}
const onCountryChange = (selectedCountries, formIndex) => {
    const curForm = addRouteForms.value[formIndex]
    if (!curForm.overflyCountry) curForm.overflyCountry = []
    if (!allFieldsList.value[formIndex]) allFieldsList.value[formIndex] = []

    const existCountries = curForm.overflyCountry.map(item => item.country)
    const newCountries = selectedCountries.filter(c => !existCountries.includes(c))

    newCountries.forEach(cntry => {
        const curCountryData = countryData.value.find(item => item.country === cntry)
        const fieldsSet = new Set()

        if (curCountryData && curCountryData.applyRequire) {
            const requireObj = curCountryData.applyRequire

            for (const keyType of ['定期', '非定期', '定期更改航路']) {
                if (requireObj[keyType] && Array.isArray(requireObj[keyType].route)) {
                    requireObj[keyType].route.forEach(field => fieldsSet.add(field))
                }
            }
        }

        const fields = Array.from(fieldsSet)
        const dataObj = {}
        fields.forEach(f => dataObj[f] = '')

        curForm.overflyCountry.push({
            country: cntry,
            data: dataObj
        })
    })

    // 过滤未选中国家
    curForm.overflyCountry = curForm.overflyCountry.filter(item => selectedCountries.includes(item.country))

    // 重新计算字段并集，赋值到allFieldsList对应索引
    const allFieldSet = new Set()
    curForm.overflyCountry.forEach(item => {
        Object.keys(item.data).forEach(f => allFieldSet.add(f))
    })
    allFieldsList.value[formIndex] = Array.from(allFieldSet)
}
const editSelectedRoutes = () => {
    if (selectedRoutes.value.length === 0) {
        ElMessage.warning('请先选择至少一条航路进行编辑');
        return;
    }
    isEditing.value = true;
    showAddRoute.value = true;
};
const uploadProgress = ref(0)
const showUploadDialog = ref(false)
const uploading = ref(false)

const handleSubmitRoutes = async (submitData) => {
    uploading.value = true
    try {
        if (isEditing.value) {
            await updateRoutes(submitData);
            ElMessage.success('更新成功');
        } else {
            const batchSize = 50;
            for (let i = 0; i < submitData.length; i += batchSize) {
                const batch = submitData.slice(i, i + batchSize);
                // await addRoutes(batch); // axios POST
                await addRoutes(batch, (percentCompleted) => {
                    // 更新当前批次进度

                    const currentBatch = Math.floor(i / batchSize) + 1
                    uploadProgress.value = Math.floor(
                        ((currentBatch - 1 + percentCompleted / 100) / totalBatches) * 100
                    )
                })
            }
            showAddRoute.value = false;
            // await addRoutes(submitData);
            ElMessage.success('添加成功');
            await refreshRouteList()

            setTimeout(() => {
                // showUploadDialog.value = false;
                uploading.value = false
                uploadProgress.value = 0; // 重置，方便下次用
            }, 500);
        }

        // const newRouteResponse = await getRoutes();
        // if (newRouteResponse?.data) {
        //   routesData.value = newRouteResponse.data;
        //   showAddRoute.value = false;
        // }
    } catch (err) {
        console.error('提交失败:', err);
        ElMessage.error('操作失败，请重试');
        uploading.value = false;
        uploadProgress.value = 0;
    }
};
const refreshRouteList = async () => {
    const res = await getRoutes();
    if (res?.data) {
        routesData.value = res.data;

        console.log('routesData', routesData)
    }
}
// const editSelectedRoutes = () => {
//     if (selectedRoutes.value.length === 0) {
//         ElMessage.warning('请先选择至少一条航路进行编辑');
//         return;
//     }

//     isEditing.value = true;
//     showAddRoute.value = true;
//     console.log('selectedRoutes', selectedRoutes)
//     // 复制选中的数据（深拷贝），赋值给 addRouteForms 用于编辑
//     addRouteForms.value = selectedRoutes.value.map(route => ({
//         ...route,
//         overflyCountry: route.overflyCountry.map(item => {
//             // 如果item本身就是平铺字段，包成data对象
//             const { country, ...rest } = item;
//             return {
//                 country,
//                 data: rest
//             };
//         }),
//         autoRoutePrefix: ''
//     }));
//     addRouteForms.value.forEach(form => {
//         form.overflyCountryNames = form.overflyCountry.map(item => item.country);
//     });
//     console.log('addRouteForms', addRouteForms)


//     allFieldsList.value = addRouteForms.value.map(form => {
//         const allFieldSet = new Set();
//         form.overflyCountry.forEach(item => {
//             Object.keys(item.data || {}).forEach(f => allFieldSet.add(f)); // 一定是遍历 data 里的字段
//         });
//         return Array.from(allFieldSet);
//     });
//     console.log('更新的allFieldsList', allFieldsList)
// };

const onSubmit = async () => {
    try {
        console.log('addRouteForms', addRouteForms)
        console.log('isEditing', isEditing)

        const submitData = addRouteForms.value.map(row => {
            // row.overflyCountry 是数组[{country, data}]
            const formattedOverflyCountry = (row.overflyCountry || []).map(item => ({
                country: item.country,
                ...item.data
            }))
            return {
                ...toRaw(row),
                overflyCountry: JSON.stringify(formattedOverflyCountry),
            }
        })

        console.log('submitData', submitData)
        if (isEditing.value) {
            // 编辑逻辑，调用编辑接口，比如 updateRoutes(submitData)
            // 你需要自己实现对应接口
            console.log('更新的数据:', submitData);
            await updateRoutes(submitData);
            ElMessage.success('更新成功');
        } else {
            // 新增逻辑，调用已有接口
            const addRouteResponse = await addRoutes(submitData);
            ElMessage.success('添加成功');
            console.log('addRouteResponse ====', addRouteResponse);
        }
        const newRouteResponse = await getRoutes();
        console.log('newRouteResponse ====', newRouteResponse)

        if (newRouteResponse?.data) {
            routesData.value = newRouteResponse.data;
            showAddRoute.value = false;

        }
    } catch (err) {
        console.error('提交失败:', err);
        ElMessage.error('添加失败，请重试', err);
    }
}
const selectedRoutes = ref([])

const handleSelectionChange = (selection) => {
    selectedRoutes.value = selection
    console.log('selectedRoutes', selectedRoutes)
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
// const beforeUpload = (file) => {
//   const rawForm = toRaw(form) // 转为普通 JS 对象
//     console.log('rawForm',rawForm)
//   if (!rawForm.country) {
//     ElMessage.warning('请先填写国家名')
//     return false
//   }

//   return true
// }
const handleSuccess = (res) => {
    ElMessage.success('上传成功')
    showAddPermission.value = false
}


// console.log('测试', getSeasonDates('2025S'))
// const filteredData = reactive(permission)
// const handleSearch = () => {
//     console.log('搜索条件:', searchQuery);

//     filteredData.value = permission.value.filter(item => {
//         // 基于每个搜索字段进行过滤
//         return Object.keys(searchQuery).every(key => {
//             if (!searchQuery[key]) return true; // 如果搜索框为空，则不过滤该字段
//             const value = item[key];
//             if (key === 'startDate' || key === 'endDate') {
//                 const searchDate = new Date(searchQuery[key]);

//                 if (isNaN(searchDate)) return true; // 如果输入的日期无效，不过滤

//                 const itemDate = new Date(item[key]);

//                 if (key === 'startDate') {
//                     return itemDate <= searchDate; // startDate 小于等于输入日期
//                 }

//                 if (key === 'endDate') {
//                     return itemDate >= searchDate; // endDate 大于等于输入日期
//                 }
//             }
//             if (typeof value === 'string') {
//                 return value.toLowerCase().includes(searchQuery[key].toLowerCase());
//             } else if (Array.isArray(value)) {
//                 // 如果是数组（relateFlights等），你可以使用 some 来判断是否有匹配的项
//                 return value.some(flight => flight.flightNum.toLowerCase().includes(searchQuery[key].toLowerCase()));
//             }
//             return '未搜索到数据';

//         });

//     });

//     console.log('搜索后的数据:', filteredData.value);
// };


onMounted(async () => {
    try {
        const routeResponse = await getRoutes();

        routesData.value = routeResponse.data;
        const countryResponse = await getCountryRules();

        countryData.value = countryResponse.data
        filteredRoutes.value = routesData.value

        console.log('countryData:', countryData.value);
        console.log('filteredRoutes:', filteredRoutes.value);


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
    /* position: absolute;
    bottom: 5%; */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.add-button {
    /* margin: auto; */
}
</style>