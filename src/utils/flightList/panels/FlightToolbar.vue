<template>
    <div style="display: flex; justify-content: left; align-items: center;height: 50px;margin-left: 50px;">
     
        <el-button :icon="Plus" @click="addFlightData">新增航班</el-button>
        <el-button @click="editBatch" :disabled="multipleSelection.length === 0">批量编辑</el-button>
        <el-button type="danger" @click="confirmBatchDelete" :disabled="multipleSelection.length === 0">
            批量删除
        </el-button>
        <el-button :icon="Plus" type="success" @click="transferToTaskdata(multipleSelection)"
            :disabled="multipleSelection.length === 0">申请选择的航班</el-button>
        <el-button type="warning" @click="changeFlight(multipleSelection)">
            变更
        </el-button>

    </div>
</template>