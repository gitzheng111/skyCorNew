<template>

    <el-card>

        <template #header>

            相似航线推荐

        </template>

        <el-empty
            v-if="!routes.length"
            description="暂无数据"
        />

        <el-table
            v-else
            :data="routes"
        >

            <el-table-column
                prop="route"
                label="航线"
            />

            <el-table-column
                label="相似度"
            >

                <template #default="{row}">

                    <el-progress
                        :percentage="row.similarity"
                    />

                </template>

            </el-table-column>

        </el-table>

    </el-card>

</template>

<script setup>

defineProps({

    routes:{
        type:Array,
        default:()=>[]
    }

})

</script>