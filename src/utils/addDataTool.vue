<template>
    <el-dialog v-model="visible" :title="新增内容" width="90%">
        <el-table :data="addAirportDataForm" border style="width: 100%; margin-bottom: 10px;">


            <el-table-column label="机场名" >
                <template #default="{ row }">
                    <el-input v-model="row.chineseName" placeholder="机场名" maxlength="6"/>
                </template>
            </el-table-column>
            <el-table-column label="英文全称">
                <template #default="{ row }">
                    <el-input v-model="row.englishName" placeholder="英文全称" maxlength="6" />
                </template>
            </el-table-column>
            <el-table-column label="IATACode">
                <template #default="{ row }">
                    <el-input v-model="row.IATACode" placeholder="IATACode" maxlength="6"  @input="row.IATACode = row.IATACode.toUpperCase().replace(/[^A-Z]/g, '')"
                        @blur="validateIATA(row)" />
                </template>
            </el-table-column>
            <el-table-column label="ICAOCode" >
                <template #default="{ row }">
                    <el-input v-model="row.ICAOCode" placeholder="ICAOCode" maxlength="6"  @input="row.ICAOCode = row.ICAOCode.toUpperCase().replace(/[^A-Z]/g, '')"
                        @blur="validateICAO(row)" />
                </template>
            </el-table-column>


            <el-table-column label="操作" fixed="right">
                <template #default="{ $index }">
                    <el-button type="danger" :icon="Minus" @click="removeRow($index)">
                        删除
                    </el-button>
                </template>

            </el-table-column>
        </el-table>
        <div style="margin: 10px 0">
            <el-button type="primary" :icon="Plus" @click="addRow">
                添加一行数据
            </el-button>
        </div>

        <div style="text-align: right">
            <el-button type="primary" @click="syncDataToFather(mode)">创建</el-button>
        </div>
    </el-dialog>

</template>
<script setup>
import { ref, watch } from 'vue'
import { validateFlightNumber, normalizeDays, formatDate,validateIATA,validateICAO } from '../utils/tool.js'
import { ElMessage } from 'element-plus'

const props = defineProps({ visible: Boolean })
const visible = ref(props.visible)
const emit = defineEmits(['update:visible'])
watch(visible, val => emit('update:visible', val))
watch(() => props.visible, val => (visible.value = val))

const emptyAirportForm = () => ({
    chineseName: '',
    englishName: '',
    ICAOcode: '',
    IATAcode: ''
})

const addAirportDataForm = ref([])



const addRow = () => {
    addAirportDataForm.value.push(emptyAirportForm())
}

const removeRow = (index) => {
    addAirportDataForm.value.splice(index, 1)
}

const syncDataToFather = (source) => {
    console.log('addAirportDataForm.value', addAirportDataForm.value)

    // if (source == 'manAdd') {
    //     needToMapData.value = addFlightForms.value

    // } if (source == 'byExcel') {
    //     needToMapData.value = processedData.value
    // }
    // if (!curSeason) {
    //     ElMessage.error('请选择航季');
    //     return;
    // }
    // if (!selectAttribution) {
    //     ElMessage.error('请选择航班性质');
    //     return;
    // }
    if (!addAirportDataForm.value.length) {
        ElMessage.error('航班数据不可为空');
        return;
    }
    // console.log('needToMapData', needToMapData)
    const submitData = addAirportDataForm.value
    console.log('submitData', submitData)
    // return
    emit("parsed", submitData)
    // 关闭弹窗
    // emit('update:visible', false)

}


</script>

