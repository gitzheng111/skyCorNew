<el-drawer v-model="drawerVisible" title="航班详情" direction="rtl" size="40%" :destroy-on-close="true">
                <template v-if="clickFlight">
                    <el-descriptions title="基本信息" :column="2" border>
                        <el-descriptions-item label="航班号">{{ clickFlight.flightNumber }}</el-descriptions-item>
                        <el-descriptions-item label="航季">{{ clickFlight.season }}</el-descriptions-item>
                        <el-descriptions-item label="性质">{{ clickFlight.attribution }}</el-descriptions-item>
                        <el-descriptions-item label="机型">{{ clickFlight.aircraftType }}</el-descriptions-item>
                    </el-descriptions>

                    <el-descriptions title="时间信息" :column="2" border class="mt-3">
                        <el-descriptions-item label="起飞机场">{{ clickFlight.departure }}</el-descriptions-item>
                        <el-descriptions-item label="到达机场">{{ clickFlight.arrival }}</el-descriptions-item>
                        <el-descriptions-item label="起飞时间">{{ formatTimeFree(clickFlight.departureTime)
                        }}</el-descriptions-item>
                        <el-descriptions-item label="到达时间">{{ formatTimeFree(clickFlight.arrivalTime)
                        }}</el-descriptions-item>
                    </el-descriptions>

                    <el-divider>航路详情</el-divider>
                    <div v-if="clickFlight.matchingRoutes?.length">
                        <el-collapse>
                            <el-collapse-item v-for="(route, index) in clickFlight.matchingRoutes" :key="index">
                                <template #header>
                                    <div class="flex items-center justify-between w-full">
                                        <span>{{ route.routeCode }}</span>
                                        <el-tag v-if="route.isValid" type="success" size="small" effect="plain">
                                            可使用
                                        </el-tag>
                                        <el-tag v-else-if="route.taskKeys?.length" type="warning" size="small"
                                            effect="plain">
                                            正在申请
                                        </el-tag>
                                        <el-tag v-else type="danger" size="small" effect="plain">
                                            未申请
                                        </el-tag>
                                    </div>
                                </template>
                                <div>航路：{{ route.ATSroute }}</div>

                                <div>
                                    <el-segmented v-model="curCountryUnderRoute"
                                        :options="generateSegmentedOptions(route, clickFlight)"
                                        @change="val => showOverflyDetail(route, val)" @click="checkClickCountry()" />

                                </div>
                                <div v-if="curClickCountryDetails">
                                    <h4>飞越航路详情</h4>

                                    <overflyDataView :editShow="false" :countryData="curClickCountryData"
                                        :overflyDataFromFather="curClickCountryDetails.overflyDetails" />
                                </div>
                            </el-collapse-item>
                        </el-collapse>

                    </div>
                    <el-empty v-else description="无匹配航路"></el-empty>

                    <el-divider>燃油信息</el-divider>
                    <el-descriptions v-if="clickFlight.fuel_detail" :column="2" border>
                        <el-descriptions-item label="合同名称">{{ clickFlight.fuel_detail.name }}</el-descriptions-item>
                        <el-descriptions-item label="开始日期">{{ clickFlight.fuel_detail.startDate
                        }}</el-descriptions-item>
                        <el-descriptions-item label="结束日期">{{ clickFlight.fuel_detail.endDate
                        }}</el-descriptions-item>
                        <el-descriptions-item label="关联机场">{{ clickFlight.fuel_detail.relateAirport
                        }}</el-descriptions-item>
                    </el-descriptions>
                    <el-empty v-else description="未查到相关合同" />
                </template>
            </el-drawer>