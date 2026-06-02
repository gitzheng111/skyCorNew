<template>

    <div class="flight-card" @click="$emit('select', flight)">

        <!-- 顶部 -->

        <div class="card-header">

            <div class="left">
                <div class="left-flight-content">
                    <el-checkbox :model-value="selected" @change="$emit('select', flight)" />

                    <span class="flight-number">
                        {{ flight.flightNumber }}
                    </span>
                <div>

   <el-tag round size="small">
                        {{ flight.aircraftType }}
                    </el-tag>

                    <el-tag round size="small" type="warning" effect="light">
                        {{ flight.season }}
                    </el-tag>
                    <el-tag round :type="flight.attribution?.toUpperCase() === 'SCHEDULED'
                        ? 'success'
                        : 'warning'
                        ">
                        {{ flight.attribution }}
                    </el-tag>
                </div>
                 
                </div>


                <!-- 班期 -->

                <div class="days">

                    <daysPicker v-if="mode === 'edit'" v-model="flight.days" />

                    <DaysShow v-else :days="flight.days" />

                </div>
            </div>
            <!-- 主体 航路数据 -->

            <div class="flight-main">

                <div class="airport">

                    <div class="code">
                        {{ flight.departure }}
                    </div>

                    <div class="time">
                        {{ flight.departureTime }}
                        <!-- {{ departureTime }} -->
                        <div>
                            <el-tag size="mini" class="ml-1">
                                UTC|{{ beijingToUTC(flight.departureTime ) }}</el-tag>
                            <el-tag size="mini" class="ml-1" type="danger">
                                <!-- {{flight.departure}} -->
                                LCT|{{ beijingToLocal(flight.departureTime , flight.departure) }}</el-tag>
                        </div>

                    </div>

                </div>

                <div class="route-center">
                    <div class="route-tags" v-if="flight.matchingRoutes?.length">
                        <el-tag v-for="route in flight.matchingRoutes" :key="route.routeCode" size="small" :type="route.isValid
                            ? 'success'
                            : route.taskKeys?.length
                                ? 'warning'
                                : 'danger'
                            ">
                            {{ route.routeCode }}
                        </el-tag>
                    </div>

                    <div class="line" />

                    <div class="route-count">

                        {{
                            validRouteCount
                        }}/{{ totalRouteCount }}

                        可用航路

                    </div>

                </div>

                <div class="airport">

                    <div class="code">
                        {{ flight.arrival }}
                    </div>

                    <div class="time">
                        {{ flight.arrivalTime }}
                         <div>
                            <el-tag size="mini" class="ml-1">
                                UTC|{{ beijingToUTC(flight.arrivalTime) }}</el-tag>
                            <el-tag size="mini" class="ml-1" type="danger">
                                <!-- {{flight.departure}} -->
                                LCT|{{ beijingToLocal(flight.arrivalTime, flight.arrival) }}</el-tag>
                        </div>
                    </div>

                </div>

            </div>

        </div>







        <!-- 底部 -->

        <div class="footer">

            <el-button text @click="$emit('detail', flight)">
                查看详情
            </el-button>

            <el-button text type="primary" @click="$emit('edit', flight)">
                编辑
            </el-button>

        </div>

    </div>

</template>

<script setup>
import { computed } from 'vue'
import daysPicker from '../utils/daysPicker.vue'
import DaysShow from '../utils/daysShow.vue'
import { beijingToUTC, beijingToLocal } from '../utils/timeTransfer.js'
// import { Plane, Warning, Location, Flag } from '@element-plus/icons-vue'
const props = defineProps({
    flight: Object,

    selected: Boolean,

    timeMode: String,

    formatTime: Function
})

defineEmits([
    'select',
    'detail',
    'edit'
])

const departureTime = computed(() =>
    props.formatTime(
        props.flight.departureTime,
        props.flight.departure
    )
)

const arrivalTime = computed(() =>
    props.formatTime(
        props.flight.arrivalTime,
        props.flight.arrival
    )
)

const validRouteCount = computed(() =>
    props.flight.matchingRoutes?.filter(
        r => r.isValid
    ).length || 0
)

const totalRouteCount = computed(() =>
    props.flight.matchingRoutes?.length || 0
)
</script>

<style scoped>
.flight-card {

    background: white;

    border-radius: 20px;

    padding: 20px 24px;

    border: 1px solid #ebeef5;

    transition: .25s;
}

.flight-card:hover {

    box-shadow:
        0 10px 30px rgba(0, 0, 0, .06);

    transform: translateY(-2px);
}

.card-header {
       display: flex;
    gap: 24px;
    align-items: flex-start;

    /* display: flex;

    justify-content: space-between;

    align-items: center; */
}

.left {

    /* display: flex;

    flex-direction: column;


    align-items: center; */
    width: 260px;
 flex-shrink: 0;
    /* gap: 14px; */
}

.left-flight-content {
     display:flex;
    flex-wrap:wrap;
    gap:8px;
/* 
    display: flex;

    align-items: center;

    gap: 14px; */
}

.flight-number {

    font-size: 22px;

    font-weight: 700;
}

.sub-info {

    color: #909399;

    margin-top: 4px;

    font-size: 13px;
}

.flight-main {

    min-width: 0;
  display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;

}

.airport {
        flex: 0 0 220px;
        /* flex: 1; */
    min-width: 80px;

    /* width: 140px; */
}

.code {

    font-size: 22px;

    font-weight: 700;
}

.time {

    margin-top: 4px;

    font-size: 15px;

    color: #606266;
}

.route-center {
      flex: 2;
    min-width: 0;
/* 
    flex: 1;

    text-align: center;

    padding: 0 30px; */
}

.line {

    height: 1px;
    width: 100%;
    background: #dcdfe6;
}

.route-count {

    margin-top: 8px;

    font-size: 13px;

    color: #909399;
}

.days {

    margin-top: 18px;

    display: flex;

    gap: 6px;

    flex-wrap: wrap;
}

.routes {

    margin-top: 20px;

    border-top: 1px solid #f2f4f6;

    padding-top: 12px;
}

.route-tags {

    display: flex;

    justify-content: center;

    flex-wrap: wrap;

    gap: 6px;

    margin-bottom: 8px;
}

.route-row {

    display: flex;

    align-items: center;

    gap: 12px;

    padding: 10px 0;
}

.status {

    width: 10px;

    height: 10px;

    border-radius: 50%;
}

.success {

    background: #67c23a;
}

.danger {

    background: #f56c6c;
}

.route-info {

    flex: 1;
}

.route-code {

    font-weight: 600;
}

.route-country {

    margin-top: 2px;

    color: #909399;

    font-size: 12px;
}

.footer {

    display: flex;

    justify-content: flex-end;

    gap: 12px;

    margin-top: 14px;
}
</style>