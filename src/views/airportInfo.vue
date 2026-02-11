<template>
    <div class="add-button-box">
        <el-button type="primary" @click="addAirport" class="add-button">新增机场</el-button>
        <el-button type="danger" :disabled="selectedAirport.length === 0" @click="handleBatchDelete">
            删除
        </el-button>
    </div>
    <addDataTool v-model:visible="showAddDataVisible" :mode="'airport'" @parsed="handleSubmitData"/>
    <el-table :data="airportCodeList" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="机场/中文" prop="chineseName"></el-table-column>
        <el-table-column label="机场/英文" prop="englishName" ></el-table-column>
        <el-table-column label="三字码" prop="IATACode" ></el-table-column>
        <el-table-column label="四字码" prop="ICAOCode" ></el-table-column>
        <el-table-column fixed="right" label="操作" min-width="120" width="80">
            <template #default="{ row }">
                <el-button link type="primary" @click="editAirport(row.id)">
                    编辑
                </el-button>
              
            </template>
        </el-table-column>
    </el-table>


</template>
<script setup>
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, deleteRoutesByIds, getTaskList, baseFileURL, deleteTaskByIds, updateTaskList,addAirportCode,getAirportCode,deleteAirportByIds } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import addDataTool  from  '../utils/addDataTool.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const airportCodeList = ref([])
const selectedAirport = ref([])
const showAddDataVisible =ref(false)
const airportData =ref([])
const addAirport  = ()=>{
    showAddDataVisible.value =true
    // console.log('showAddDataVisible',showAddDataVisible)
}
const addAirportData=ref()
const handleSelectionChange = (selection) => {
    selectedAirport.value = selection
    console.log('selectedAirport', selectedAirport)
}
const handleBatchDelete = async () => {
    if (selectedAirport.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定删除选中的 ${selectedAirport.value.length} 条机场数据？`,
            '警告',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 假设每条航路有唯一的 id 字段
        const idsToDelete = selectedAirport.value.map(item => item.id)
        console.log('idsToDelete', idsToDelete)
        // 调用后端接口进行删除
        await deleteAirportByIds(idsToDelete)

        selectedAirport.value = []
        const newAirportResponse = await getAirportCode();
        if (newAirportResponse?.data) {
            airportCodeList.value = newAirportResponse.data;
            ElMessage.success('删除成功')
        }

    } catch (err) {

        // 用户点击取消
        console.log('批量删除取消',err)
    }
}

const handleSubmitData = async (processedDataFromChild) => {
    console.log("父组件收到数据:", processedDataFromChild)
    addAirportData.value = processedDataFromChild
    //     ? processedDataFromChild
    //     : [emptyFlight()]
    // console.log('addFlightForms', addFlightForms.value)
    await onSubmit()

}
const editAirportMode = ref(false)

const onSubmit = async () => {
    console.log('addAirportData', addAirportData)
    const submitData = addAirportData.value.map(row => ({ ...toRaw(row) }))
  
    if (editAirportMode.value == true) {
        const airportResponse = await addAirportCode(submitData).then(async () => {
            ElMessage.success('更新成功 ');
            const newAirportResponse = await getAirportCode();
            // console.log('flightResponse ====', flightResponse)

            airportCodeList.value = newAirportResponse.data
        }).catch(err => {
            ElMessage.error('失败');
            console.error('添加失败:', err);
        });
        console.log('airportResponse ====', airportResponse)
    } else {

        const airportResponse = await addAirportCode(submitData).then(() => {
            ElMessage.success('添加成功');
            

        }).catch(err => {
            console.error('添加失败:', err);
        });
        airportCodeList.value = airportResponse.data
        //有问题》？？
        console.log('airportResponse ====', airportResponse)

    }



}
onMounted(async () => {
    try {
        const airportResponse = await getAirportCode();

        airportCodeList.value = airportResponse.data;
     
        console.log('airportCodeList:', airportCodeList.value);


    } catch (error) {
        console.error('API error:', error);
    }
});


</script>