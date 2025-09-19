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
import { getFlights, getRoutes, getPermission, baseURL, getCountryRules, addRoutes, airportCodeList, deleteRoutesByIds, getTaskList, baseFileURL, deleteTaskByIds, updateTaskList,addAirportCode,getAirportCode } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import addDataTool  from  '../utils/addDataTool.vue'
const selectedAirport = ref([])
const showAddDataVisible =ref(false)
const airportData =ref([])
const addAirport  = ()=>{
    showAddDataVisible.value =true
    // console.log('showAddDataVisible',showAddDataVisible)
}
const addAirportData=ref()
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

            airportData.value = newAirportResponse.data
        }).catch(err => {
            ElMessage.error('失败');
            console.error('添加失败:', err);
        });
        console.log('airportResponse ====', airportResponse)
    } else {

        const airportResponse = await addAirportCode(submitData).then(() => {
            ElMessage.success('添加成功');
            airportData.value = newAirportResponse.data

        }).catch(err => {
            console.error('添加失败:', err);
        });
        console.log('airportResponse ====', airportResponse)

    }



}
</script>