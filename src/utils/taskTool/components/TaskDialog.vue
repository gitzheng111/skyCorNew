<template>

    <el-dialog
        v-model="visible"
        title="任务详情"
        width="70%"
    >

        <el-scrollbar height="500px">

            <h4>任务名称</h4>

            <el-input
                v-model="taskName"
            />

            <el-tag>
                {{ attribution }}
            </el-tag>

            <el-tag>
                {{ season }}
            </el-tag>

            <TaskPreview
                :task-list="taskList"
            />

        </el-scrollbar>

        <el-button
            type="primary"
            @click="submit"
        >
            提交任务
        </el-button>

    </el-dialog>

</template>

<script setup>

import { ref, watch } from 'vue'

import TaskPreview
from './TaskPreview.vue'

const visible = defineModel()

const props = defineProps({

    taskList:Array,

    defaultTaskName:String,

    season:String,

    attribution:String,

    visible:Boolean
})

const emit =
    defineEmits(['submit'])

const taskName =
    ref('')

watch(
    () => props.defaultTaskName,
    val => {
        taskName.value = val
    },
    {
        immediate:true
    }
)

const submit = () => {

    emit(
        'submit',
        taskName.value
    )
}

</script>