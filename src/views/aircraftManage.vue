<template>
    <div class="add-button-box">
        <el-button type="primary" @click="addAircraft" class="add-button">新增机型</el-button>
        <el-button type="warning" :disabled="selectedAircraft.length === 0"
            @click="editSelectedAircrafts">批量编辑</el-button>
        <el-button type="danger" :disabled="selectedAircraft.length === 0" @click="handleBatchDelete">
            删除
        </el-button>
    </div>
    <addDataTool v-model:visible="showAddDataVisible" :mode="'aircraft'" @parsed="handleSubmitData"
        :isEditing="editAircraftMode" :editData="editData" />
    <el-table :data="aircraftData" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="机型" prop="aircraftType"></el-table-column>
        <el-table-column label="重量类型" prop="weightType"></el-table-column>

        <el-table-column label="MTOW" prop="MTOW"></el-table-column>

        <el-table-column label="无线电设备能力" prop="radio"></el-table-column>
        <el-table-column label="国籍" prop="nationality"></el-table-column>
        <el-table-column label="座位数" prop="seats"></el-table-column>

        <el-table-column label="机号" prop="aircraftNumber">
            <template #default="{ row }">
                <el-tag v-for="i in row.aircraftNumber.name" :key="i" style="margin-right: 4px">
                    {{ i }}
                </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="其他别名" prop="anotherName">
            <template #default="{ row }">
                <el-tag v-if="row.anotherName.caacName">caacName:{{ row.anotherName.caacName }}</el-tag>
                <el-tag v-if="row.anotherName.icaoName">icaoName:{{ row.anotherName.icaoName }}</el-tag>
                <el-tag v-if="row.anotherName.shortName">shortName:{{ row.anotherName.shortName }}</el-tag>
            </template>

        </el-table-column>

        <el-table-column fixed="right" label="操作" min-width="120" width="80">
            <template #default="{ row }">
                <el-button link type="primary" @click="editAircraft(row)">
                    编辑
                </el-button>

            </template>
        </el-table-column>
    </el-table>


</template>
<script setup>
import { getAircraftType, addAircraftType, updateAircraftType, deleteAircraftByIds } from '../api.js';
import { ref, reactive, computed, onMounted, provide, watch, nextTick, onBeforeUnmount, onUnmounted, toRaw } from 'vue'
import addDataTool from '../utils/addDataTool.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const airportCodeList = ref([])
const selectedAircraft = ref([])
const showAddDataVisible = ref(false)
const addAircraft = () => {
    showAddDataVisible.value = true
    // console.log('showAddDataVisible',showAddDataVisible)
}
const addAircraftData = ref()
const handleSelectionChange = (selection) => {
    selectedAircraft.value = selection
    console.log('selectedAircraft', selectedAircraft)

}
const editSelectedAircrafts = () => {
    if (selectedAircraft.value.length === 0) {
        ElMessage.warning('请先选择至少一条航路进行编辑');
        return;
    }
    editAircraftMode.value = true;
    showAddDataVisible.value = true;
    editData.value = selectedAircraft.value
};
const handleBatchDelete = async () => {
    if (selectedAircraft.value.length === 0) return

    try {
        await ElMessageBox.confirm(
            `确定删除选中的 ${selectedAircraft.value.length} 条机型数据？`,
            '警告',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 假设每条航路有唯一的 id 字段
        const idsToDelete = selectedAircraft.value.map(item => item.id)
        console.log('idsToDelete', idsToDelete)
        // 调用后端接口进行删除
        await deleteAircraftByIds(idsToDelete)

        selectedRoutes.value = []
        const newAirportResponse = await getAircraftType();
        if (newAirportResponse?.data) {
            airportCodeList.value = newAirportResponse.data;
            ElMessage.success('删除成功')
        }

    } catch (err) {

        // 用户点击取消
        console.log('批量删除取消', err)
    }
}

const handleSubmitData = async (processedDataFromChild) => {
    console.log("父组件收到数据:", processedDataFromChild)
    addAircraftData.value = processedDataFromChild
    //     ? processedDataFromChild
    //     : [emptyFlight()]
    // console.log('addFlightForms', addFlightForms.value)
    await onSubmit()

}
const editAircraftMode = ref(false)
const editData = ref()
const editAircraft = (row) => {
    console.log('点击编辑', row)
    showAddDataVisible.value = true
    editAircraftMode.value = true
    editData.value = row
}

const onSubmit = async () => {
    console.log('addAircraftData', addAircraftData)
    const submitData = addAircraftData.value.map(item => ({
        ...item,
        aircraftNumber: JSON.stringify(item.aircraftNumber),
        anotherName: JSON.stringify(item.anotherName)
    }))

    if (editAircraftMode.value === true) {
        updateAircraftType(submitData)
            .then(async (aircraftResponse) => { // 直接接收参数
                console.log('aircraftResponse', aircraftResponse)
                ElMessage.success('更新成功')

                const newAirportResponse = await getAircraftType()
                airportCodeList.value = newAirportResponse.data
            })
            .catch(err => {
                ElMessage.error('失败')
                console.error('添加失败:', err)
            })
    } else {

        const aircraftResponse = await addAircraftType(submitData).then(() => {
            ElMessage.success('添加成功');
            airportCodeList.value = aircraftResponse.data

        }).catch(err => {
            console.error('添加失败:', err);
        });
        // console.log('aircraftResponse ====', aircraftResponse)

    }



}
const aircraftData = ref([])
onMounted(async () => {
    try {
        const aircraftResponse = await getAircraftType();

        aircraftData.value = aircraftResponse.data.map(item => {
            return {
                ...item,
                aircraftNumber: {
                    ...item.aircraftNumber,
                    name: Array.isArray(item.aircraftNumber?.name)
                        ? item.aircraftNumber.name
                        : item.aircraftNumber.name.split(",")
                }
            }
        });

        console.log('aircraftData:', aircraftData.value);


    } catch (error) {
        console.error('API error:', error);
    }
});


</script>