const connection = require('../../config/connection')


const getDataJobModel = async (req, transaction) => {

    const sqlDataJob = `SELECT
                            mi.job_name,
                            (
                                employee.firstname + ' ' + employee.lastname
                            ) AS fullname,
                            mi.due1,
                            mi.qty1
                        FROM
                            mi.dbo.mi
                        LEFT JOIN mi.dbo.employee ON mi.emp_id = employee.emp_id
                        WHERE
                            mi.jobid = '${req}' `
    let jobList = (await connection.query(sqlDataJob))[0];
    return jobList;
}

const getMenuModel = async (req, transaction) => {
    var menuList = []
    var menuIdArray = []
    const sqlGroupUser = `EXEC mi.dbo.get_user_group_data @emp_id = '${req}'`
    let userGroupId = (await connection.query(sqlGroupUser))[0][0].group_user_id
    const sqlMenuScheduler = `EXEC mi.dbo.get_menu_scheduler @user_group_id = ${userGroupId}`
    await connection.query(sqlMenuScheduler)
        .then(async ([data]) => {
            for (let i = 0; i < data.length; i++) {
                const sqlMenuScheduler = `EXEC mi.dbo.get_menu_scheduler_sub @menu_id = ${data[i].menu_id}, @user_group_id = ${userGroupId}`
                let menuMachineTypeList = (await connection.query(sqlMenuScheduler))[0]
                const menuObj = {
                    menuID: data[i].menu_id,
                    menuName: data[i].menu_name,
                    menuMachineTypeList
                }

                for (const element of menuMachineTypeList) {
                    menuIdArray.push(element.menu_id);
                }
                menuList.push(menuObj)
            }
        })
    return {
        userGroupId,
        menuList,
        menuIdArray
    }
}

const getMachineType = async (menuID) => {
    const sql = `EXEC mi.dbo.get_machine_type_list @menu_id = ${menuID}`
    return (await connection.query(sql))[0][0].data
}

const getGroupData = async (menuID) => {
    const sql = `SELECT GROUP_DATA FROM mi.dbo.USER_MENU_SCHEDULER WHERE MENU_ID = '${menuID}'`
    return (await connection.query(sql))[0][0].GROUP_DATA
}

const getDataModel = async (req, transaction) => {
    let strMachineTypeList = await getMachineType(req)

    const sqlMachineType = `SELECT type_id,	type_name FROM mi.dbo.machine_type WHERE type_id IN ${strMachineTypeList}`;
    const sqlSaddle = `SELECT
                            saddle_detail_id,
                            saddle_detail_name 
                        FROM
                            mi.dbo.machine_saddle_detail 
                        ORDER BY
                            CAST(saddle_detail_id AS INT)`;
    

    let machineTypeList = (await connection.query(sqlMachineType))[0]
    let saddleList = (await connection.query(sqlSaddle))[0]

    return {
        machineTypeList,
        saddleList
    }
}

const getMachineModel = async (req, transaction) => {
    let where = ""
    if (req !== "0") {
        where += ` AND a.type_id = ${req} `
    } else {
        where += ` AND a.type_id IN ${await getMachineType(22)} `
    }
    const sqlMachine = `SELECT
                            a.type_id,
                            b.type_name,
                            a.machine_id,
                            a.machine_name,
                            a.machine_detail,
                            a.costCenter AS cost_center,
                            a.department_id,
                            a.make_ready 
                        FROM
                            mi.dbo.machine a
                            LEFT JOIN mi.dbo.machine_type b ON a.type_id = b.type_id
                        WHERE
                            a.status_id != 0 
                            ${where}
                        ORDER BY
                            a.type_id`
    let machineList = (await connection.query(sqlMachine))[0]
    return {
        machineList,
    }
}

const getPlanSearchModel = async (req, transaction) => {
    const { typeSearch, machineType, machineID, jobID, startDate, endDate, shiftID, checkedPlanDate } = req

    let strWhere = "";
    let strInner = "";
    let strShiftWhere = "";

    // กรองตาม type ที่ค้นหา
    if (typeSearch === '1') {
        strInner += ` ISNULL(m_p.machine_id, m_p.default_machine_id) = machine.machine_id `
        strWhere += ` AND (m_p.machine_id = '${machineID}') 
                     AND (m_p.plan_date BETWEEN '${startDate}' AND '${endDate}' )`
    } else if (typeSearch === '2') {
        strInner += ` CASE WHEN m_p.machine_id = '' THEN m_p.default_machine_id ELSE isnull( m_p.machine_id, m_p.default_machine_id )  END = machine.machine_id `
        strWhere += ` AND m_p.jobid LIKE '%${jobID}%' `
        if (checkedPlanDate === '1') {
            strWhere += `AND (m_p.plan_date BETWEEN '${startDate}' AND '${endDate}' )`
        }
    } else if (typeSearch === '3') {
        strInner += ` m_p.default_machine_id = machine.machine_id `
        strWhere += ` AND m_p.jobid LIKE '%${jobID}%'
                      AND (m_p.machine_id IS NULL OR m_p.machine_id = '0' OR m_p.machine_id = '') `
    } else if (typeSearch === '4') {
        strInner += ` m_p.default_machine_id = machine.machine_id `
        strWhere += ` AND (m_p.machine_id IS NULL OR m_p.machine_id = '0' OR m_p.machine_id = '') 
                     AND (m_p.plan_date BETWEEN '${startDate}' AND '${endDate}' ) `
    } else {
        strInner += ` m_p.machine_id = machine.machine_id `
        strWhere += ` AND 1=2 `
    }

    // กรองตาม machine type ที่ส่งมา
    if (machineType === "0") {
        let strMachineTypeList = await getMachineType(22);
        strWhere += ` AND machine.type_id IN ${strMachineTypeList} `
    } else {
        strWhere += ` AND machine.type_id = ${machineType} `
    }

    // กรองตาม กะ(shift) ที่ส่งมา
    if (shiftID !== "0") {
        strShiftWhere += ` AND m_p.shift_id = ${shiftID} `
    }

    const sqlMain = `;WITH cte AS (
        SELECT TOP 100 
            m_p.priority,
            m_p.jobid,
            mi.job_name,
            m_p.hr1,
            m_p.plan_date,
            CASE
                WHEN m_p.machine_id IS NULL THEN 'N/A' 
                ELSE ISNULL(machine.machine_detail, '') 
            END AS machine_detail,
            m_p.machine_id,
            CASE
                WHEN m_p.machine_id IS NULL THEN '' 
                ELSE machine.machine_name
            END AS machine_name,
            job_status.job_status_name,
            shift.shift_name,
            isnull(m_p.partName,'') AS partName,
            m_p.detail,
            mi.due1,
            m_p.sig,
            m_p.quantity,
            m_p.waste,
            m_p.make_ready ,
            m_p.process_time1,
            m_p.speed,
            m_p.date_paper_in,
            m_p.paper_size,
            m_p.paper_type,
            m_p.date_plate_in,
            m_p.date_ink_in,
            m_p.waterbase,
            m_p.varnish,
            m_p.recive_dep,
            m_p.send_dep,
            m_p.remark,
            m_p.key_date,
            m_p.saleman_id,
            m_p.id,
            m_p.shift_id ,
            ( employee.firstname+ ' ' + employee.lastname ) AS fullname,
            m_p.job_status_id,
            m_p.sig_num,
            m_p.wait_dry,
            m_p.hr,
            m_p.process_time,
            machine.type_id AS machine_type_id,
            m_p.ok_date,
            m_p.itid,
            CASE
                WHEN cppr.receivedOfITIDInvolved > 0 THEN
                1 ELSE 0 
            END AS paperReady,
            m_p.capacity_labor,
            m_p.master_capacity_labor,
            m_p.machine_id_send
        FROM
            mi.dbo.machine_planning AS m_p
            LEFT JOIN mi.dbo.mi ON mi.jobid = m_p.jobid
            LEFT JOIN mi.dbo.mi_item ON m_p.jobid = mi_item.jobid AND m_p.itid = mi_item.itid
            LEFT JOIN mi.dbo.job_status ON m_p.job_status_id = job_status.job_status_id
            LEFT JOIN mi.dbo.machine ON ${strInner}
            LEFT JOIN mi.dbo.shift ON m_p.shift_id = shift.shift_id ${strShiftWhere}
            LEFT JOIN mi.dbo.employee ON mi.emp_id = employee.emp_id
            LEFT JOIN mi.dbo.vw_checkPartPaperReceived cppr ON cppr.jobid = m_p.jobid AND cppr.itid = m_p.itid 
        WHERE
            1 = 1 
            ${strWhere}
            ${strShiftWhere}
        ) SELECT
            cte.*,
            p.process_id,
            cte.send_dep AS send_dep_id,
            p.process_name AS send_dep_name
        FROM
            cte
            LEFT JOIN PL.dbo.tb_planning_process p ON CAST ( p.process_id AS VARCHAR ( 20 ) ) = send_dep 
        GROUP BY
            priority,
            jobid,
            job_name,
            hr1,
            plan_date,
            machine_detail,
            machine_id,
            machine_name,
            job_status_name,
            shift_name,
            partName,
            detail,
            due1,
            sig,
            quantity,
            waste,
            make_ready,
            process_time1,
            speed,
            date_paper_in,
            paper_size,
            paper_type,
            date_plate_in,
            date_ink_in,
            waterbase,
            varnish,
            recive_dep,
            send_dep,
            remark,
            key_date,
            saleman_id,
            id,
            shift_id,
            fullname,
            job_status_id,
            sig_num,
            wait_dry,
            hr,
            process_time,
            machine_type_id,
            ok_date,
            itid,
            paperReady,
            capacity_labor,
            master_capacity_labor,
            machine_id_send,
            p.process_id,
            p.process_name 
        ORDER BY
            plan_date ASC,
            shift_id ASC,
            ROUND( ISNULL( priority, '' ), 2 ) ASC,
            id ASC`
    console.log(sqlMain);
    let planList = (await connection.query(sqlMain))[0]
    return {
        typeSearch,
        planList
    }
}

const insertPlanModel = async (req, transaction) => {
    let data = {
        success: 0
    }
    const { e_jobid, e_plan_date, e_priority, e_job_status_id, e_partName, e_detail,
        e_shift_id, e_sig, e_waste, e_quantity, e_machine_id,
        e_sig_num, e_wait_dry, e_make_ready, e_speed, e_process_time,
        e_process_time1, e_hr, e_hr1, e_paper_type, e_paper_size,
        e_recive_dep, e_send_dep, e_remark, datePlateIn, datePaperIn,
        dateInkIn, waterbase, varnish, saleman_id, keyDate,
        e_capacity_labor, e_machine_id_send,
        e_master_capacity_labor, e_itid, e_okdate, plan_id_copy } = req
    const sql = `INSERT INTO mi.dbo.machine_planning ( jobid,
            plan_date, priority, job_status_id, partName, detail,
            shift_id, sig, waste, quantity, machine_id,
            sig_num, wait_dry, make_ready, speed, process_time,
            process_time1, hr, hr1, paper_type, paper_size,
            recive_dep, send_dep, remark, date_plate_in, date_paper_in,
            date_ink_in, waterbase, varnish, saleman_id, key_date,
            capacity_labor, master_capacity_labor, machine_id_send,
            itid, ok_date)
        VALUES ('${e_jobid}','${e_plan_date}', ${e_priority}, ${e_job_status_id === '' ? 0 : e_job_status_id}, '${e_partName}', '${e_detail}',
        ${e_shift_id}, ${e_sig}, ${e_waste}, ${e_quantity}, '${e_machine_id}',
        ${e_sig_num}, '${e_wait_dry}', ${e_make_ready}, ${e_speed}, ${e_process_time}, 
        ${e_process_time1}, ${e_hr}, ${e_hr1}, '${e_paper_type}', '${e_paper_size}',
        '${e_recive_dep}', '${e_send_dep}', '${e_remark}', '${datePlateIn}', '${datePaperIn}',
        '${dateInkIn}', '${waterbase}', '${varnish}', '${saleman_id}', '${keyDate}',
        '${e_capacity_labor}', '${e_master_capacity_labor}', '${e_machine_id_send}',
        '${e_itid}', '${e_okdate}') `

    data.sql_str = sql
    data.action_type = "insert";
    data.emp_id = saleman_id;
    await connection.query(sql)
        .then(async () => {
            data.success = 1;
            const sqlGetPlanId = `SELECT TOP 1 id FROM mi.dbo.machine_planning ORDER BY id DESC`
            let plan_id = (await connection.query(sqlGetPlanId))[0][0].id;
            data.plan_id = plan_id;

            if (plan_id_copy > 0) {
                data.action_type = "copy"
                const sqlStroe = `EXEC mi.dbo.fn_copy_machine_plan_process_send @machine_planning_copy = ${plan_id_copy}, @machine_planning_paste = ${plan_id}`;
                await connection.query(sqlStroe);
            }
        })
        .catch(() => {
            data.success = 0;
            data.plan_id = null;
        })
    return data;
}

const updatePlanModel = async (req, transaction) => {
    let data = {
        success: 0
    }
    const { e_jobid, plan_id, e_plan_date, e_priority, e_job_status_id, e_partName, e_detail,
        e_shift_id, e_sig, e_waste, e_quantity, e_machine_id,
        e_sig_num, e_wait_dry, e_make_ready, e_speed, e_process_time,
        e_process_time1, e_hr, e_hr1, e_paper_type, e_paper_size,
        e_recive_dep, e_send_dep, e_remark, datePlateIn, datePaperIn,
        dateInkIn, waterbase, varnish, keyDate,
        e_capacity_labor, e_machine_id_send,
        e_master_capacity_labor, e_itid, e_okdate,saleman_id } = req
    const sql = `UPDATE mi.dbo.machine_planning SET 
                jobid = '${e_jobid}',
                plan_date = '${e_plan_date}', 
                priority = ${e_priority}, 
                job_status_id = ${e_job_status_id === '' ? 0 : e_job_status_id}, 
                partName = '${e_partName}', 
                detail = '${e_detail}',
                shift_id = ${e_shift_id}, 
                sig = ${e_sig}, 
                waste = ${e_waste}, 
                quantity = ${e_quantity}, 
                machine_id = '${e_machine_id}',
                sig_num = ${e_sig_num}, 
                wait_dry = '${e_wait_dry}', 
                make_ready = ${e_make_ready}, 
                speed = ${e_speed}, 
                process_time = ${e_process_time},
                process_time1 = ${e_process_time1}, 
                hr = ${e_hr}, 
                hr1 = ${e_hr1}, 
                paper_type = '${e_paper_type}', 
                paper_size = '${e_paper_size}',
                recive_dep = '${e_recive_dep}', 
                send_dep = '${e_send_dep}', 
                remark = '${e_remark}', 
                date_plate_in = '${datePlateIn}', 
                date_paper_in = '${datePaperIn}',
                date_ink_in = '${dateInkIn}', 
                waterbase = '${waterbase}', 
                varnish = '${varnish}', 
                key_date = '${keyDate}',
                ok_date = '${e_okdate}',
                itid = '${e_itid}',
                capacity_labor = '${e_capacity_labor}',
                master_capacity_labor = '${e_master_capacity_labor}',
                machine_id_send = '${e_machine_id_send}',
                saleman_id = '${saleman_id}'
                WHERE id = ${plan_id} `
    data.plan_id = plan_id;
    data.sql_str = sql.replace(/'/g, "''");
    data.action_type = "update";
    data.emp_id = saleman_id;
    await connection.query(sql)
        .then(() => {
            data.success = 1;
        })
        .catch(() => {
            data.success = 0;
        })
    return data
}

const deletePlanModel = async (req, transaction) => {
    const {empID,plan_id} = req
    let data = {
        success: 0,
        emp_id: empID
    }
    const sql = `DELETE FROM mi.dbo.machine_planning WHERE id = '${plan_id}' `
    data.plan_id = plan_id;
    data.sql_str = sql.replace(/'/g, "''");
    data.action_type = "delete";
    await connection.query(sql)
        .then(() => {
            data.success = 1;
        })
    return data
}

const cancelPlanModel = async (req, transaction) => {
    const { plan_id, machineId, empId } = req;
    let data = {
        success: 0,
        emp_id: empId
    }
    const sql = `UPDATE mi.dbo.machine_planning 
                SET machine_id = NULL, default_machine_id = '${machineId}'
                WHERE id = ${plan_id}`;
    console.log(sql);
    data.plan_id = plan_id;
    data.sql_str = sql.replace(/'/g, "''");
    data.action_type = "cancel";
    await connection.query(sql)
        .then(() => {
            data.success = 1;
        }).catch(() => {
            data.success = 0;
        })
    return data
}

const getCapacityLaborModel = async (req, transaction) => {
    const { machineId, planDate } = req
    const sql = `SELECT TOP
                    1 ISNULL( master_capacity_labor, 0 ) AS master_capacity_labor 
                FROM
                    mi.dbo.machine_planning_worker 
                WHERE
                    1 = 1 
                    AND machine_id = '${machineId}' 
                    AND ( CONVERT ( DATE, start_date ) <= '${planDate}' AND CONVERT ( DATE, end_date ) >= '${planDate}' ) 
                ORDER BY
                    create_date DESC`
    let capacityLabor = (await connection.query(sql))[0]
    return {
        capacityLabor
    }
}

const getItemModel = async (req, transaction) => {
    const { machine_id, term, a_job } = req
    var wh = "";
    var sql_item = "";
    if (term != "") {
        wh = ` AND mi_item.partName LIKE '%${term}%' `;
    };
    if (machine_id == '7001') {
        var text = 'ลูกฟูก';
        sql_item = `	
                    SELECT 
                        0 AS itid,
                        '${text}' AS partName,
                        '${text}' AS detail
                    UNION
                        SELECT 
                        mi_item.itid,
                        MIN(mi_item.partName) AS partName,
                        MIN(mi_production.detail) AS detail
                    FROM mi.dbo.mi_item
                    LEFT JOIN mi.dbo.mi_production ON mi_item.jobid = mi_production.jobid  AND mi_item.itid=mi_production.itid
                    WHERE mi_production.procID >= 200 AND  mi_production.procID < 300
                    AND mi_item.jobid = '${a_job}' ${wh}
                    GROUP BY mi_item.itid,mi_item.partName,mi_production.detail
                    ORDER BY partName
                `;
    } else if (machine_id == '7002' || machine_id == '7003') {
        const text = 'ว่าง';
        sql_item = `SELECT 
                        101 AS itid,
                        '${text}' AS partName,
                        '${text}' AS detail`;
    } else {
        sql_item = `SELECT 
                        mi_item.itid,
                        MIN(mi_item.partName) AS partName,
                        MIN(mi_production.detail) AS  detail
                    FROM mi.dbo.mi_item
                    LEFT JOIN mi.dbo.mi_production ON mi_item.jobid = mi_production.jobid  AND mi_item.itid=mi_production.itid
                    WHERE mi_production.procID >= 200 AND  mi_production.procID < 300
                    AND mi_item.jobid = '${a_job}' ${wh}
                    GROUP BY mi_item.itid,mi_item.partName,mi_production.detail
                    ORDER BY mi_item.partName
                    `;
    }
    let itemlist = (await connection.query(sql_item))[0];
    return {
        itemlist
    }
}

const getNextMachineListModel = async (req, transaction) => {
    var result = [];
    const sql = `SELECT
                    planning_process.process_id,
                    planning_process.process_name AS machine_process,
                    machine.machine_id 
                FROM
                    PL.dbo.tb_planning_process planning_process
                    LEFT JOIN PL.dbo.tb_machine_list machine ON planning_process.machine_list_id = machine.machine_list_id 
                WHERE
                    planning_process.is_actived = 1 
                ORDER BY
                    planning_process.process_name,
                    machine.machine_id`;
    await connection.query(sql)
        .then(async (data) => {
            // console.log(data[0]);
            for (const element of data[0]) {
                // data[0].forEach(async element => {
                // console.log(element);
                let sqlSub = `SELECT 
                                machine.machine_id,
                                machine.machine_name,
                                machine.machine_process_id
                            FROM PL.dbo.tb_machine_list machine
                            WHERE machine.is_actived = 1
                                AND machine.machine_process_id = '${element.process_id}'
                            ORDER BY  machine.machine_name`
                let subData = await connection.query(sqlSub);
                if (subData[1] > 0) {
                    // console.log("array ", subData[0]);
                    let obj = {
                        typeId: element.process_id,
                        typeName: element.machine_process,
                        machineId: element.machine_id,
                        machineList: subData[0]
                    };
                    // console.log("obj =>", obj);
                    result.push(obj);
                }
                // });
            }

        })

    return {
        success: 1,
        result
    }
}

const insertLogMachinePlanningModel = async (req, transaction) => {
    const { plan_id, action_type, emp_id } = req;
    // const sql = `INSERT INTO mi.dbo.machine_planning_log_mi3(plan_id, action_type, sql_string, success_status) VALUES(${plan_id}, '${action_type}', '${sql_str}', ${success})`;
    var sql = ``
    if (action_type === 'delete') {
        sql = `INSERT INTO mi.dbo.machine_planning_log_mi3(plan_id, action_type) 
               VALUES(${plan_id}, '${action_type}')`
    } else {
        sql = `INSERT INTO mi.dbo.machine_planning_log_mi3 
        (plan_id ,action_type ,update_by ,jobid ,hr ,start_date ,end_date
        ,job_status_id ,machine_id ,detail ,quantity ,waste ,make_ready
        ,process_time ,speed ,sig ,shift_id ,priority ,date_paper_in
        ,date_plate_in ,date_ink_in ,default_machine_id ,paper_type ,paper_size ,waterbase
        ,varnish ,saleman_id ,num ,records ,key_date ,remark
        ,recive_dep ,send_dep ,report_date ,sendjob_date ,num_sig ,num_color
        ,paper_brand ,paper_price ,num_date ,start_time ,end_time ,sum_hr
        ,sum_ot ,num_sig_per ,num_sig_total ,paper_gm ,paper_roll ,paper_cut
        ,paper_sheet ,paper_kgs ,paper_kgsroll ,cut_s ,cut_b ,cut_c
        ,cut_d1 ,cut_d2 ,cut_clear ,cut_mr ,itid ,sum_date ,sum_emp
        ,type_id ,partName ,lan_id ,poptype_id ,si_jobopen_id ,type_mac
        ,others ,rows ,temp_id ,change ,ma_step_id ,side_wide ,side_long
        ,side_sum ,said_wide ,said_long ,said_sum ,no ,team_id ,empsum
        ,datep ,team_total ,job_fore ,id_plan ,id_plan_after ,sig_num
        ,ma_type_id ,unit_id ,round_id ,round_detail_id ,pu_id ,fold_id
        ,fold_detail_id ,saddle_num ,spid_id ,ink_type_id ,block_id
        ,saddle_detail_id ,saddle_type_id ,spot_detail_id ,round_totals
        ,page_units ,cancle_plan ,wait_dry ,hr1 ,process_time1 ,board_type_id
        ,board_cut_id ,making_type_id ,in_type_id ,in_detail_id ,in_son_id
        ,in_brow_id ,semi_type_id ,semi_detail_id ,long ,collate_type_id
        ,sig_collate ,sig_match ,sewing_type_id ,sewing_tid_id ,sewing_tid_sum
        ,folding_id ,ups ,make_ready1 ,time_sheet ,num_set ,num_make
        ,mockup ,bookedFromRFQ ,RFQQTY ,sig_machine ,ok_date ,WHTrimming_JOURNALID
        ,act_code ,plan_id_group ,master_capacity_labor ,capacity_labor ,machine_id_send
        ,machine_send_remark ,amount_of_side ,is_ink_ready
        ,ink_remark ,is_paper_trim_ready ,paper_trim_qty ,paper_trim_remark
        ,proc_id ,is_diecut_ready ,diecut_remark ,diecut_number)

        SELECT id ,'${action_type}' ,${emp_id} ,jobid ,hr
        ,start_date ,end_date ,job_status_id ,machine_id
        ,detail ,quantity ,waste ,make_ready ,process_time ,speed ,sig ,shift_id
        ,priority ,date_paper_in ,date_plate_in ,date_ink_in
        ,default_machine_id ,paper_type ,paper_size ,waterbase
        ,varnish ,saleman_id ,num ,records ,key_date ,remark ,recive_dep ,send_dep ,report_date
        ,sendjob_date ,num_sig ,num_color ,paper_brand ,paper_price
        ,num_date ,start_time ,end_time ,sum_hr ,sum_ot ,num_sig_per ,num_sig_total ,paper_gm
        ,paper_roll ,paper_cut ,paper_sheet ,paper_kgs ,paper_kgsroll ,cut_s ,cut_b ,cut_c
        ,cut_d1 ,cut_d2 ,cut_clear ,cut_mr ,itid ,sum_date ,sum_emp
        ,type_id ,partName ,lan_id ,poptype_id ,si_jobopen_id ,type_mac ,others ,rows
        ,temp_id ,change ,ma_step_id ,side_wide ,side_long
        ,side_sum ,said_wide ,said_long ,said_sum ,no ,team_id ,empsum ,datep ,team_total ,job_fore ,id_plan ,id_plan_after
        ,sig_num ,ma_type_id ,unit_id ,round_id ,round_detail_id ,pu_id ,fold_id ,fold_detail_id
        ,saddle_num ,spid_id ,ink_type_id ,block_id ,saddle_detail_id ,saddle_type_id ,spot_detail_id ,round_totals
        ,page_units ,cancle_plan ,wait_dry ,hr1 ,process_time1 ,board_type_id ,board_cut_id ,making_type_id ,in_type_id
        ,in_detail_id ,in_son_id ,in_brow_id ,semi_type_id ,semi_detail_id ,long ,collate_type_id ,sig_collate
        ,sig_match ,sewing_type_id ,sewing_tid_id ,sewing_tid_sum
        ,folding_id ,ups ,make_ready1 ,time_sheet ,num_set ,num_make ,mockup ,bookedFromRFQ ,RFQQTY
        ,sig_machine ,ok_date ,WHTrimming_JOURNALID ,act_code
        ,plan_id_group ,master_capacity_labor ,capacity_labor ,machine_id_send
        ,machine_send_remark ,amount_of_side ,is_ink_ready ,ink_remark ,is_paper_trim_ready ,paper_trim_qty ,paper_trim_remark
        ,proc_id ,is_diecut_ready ,diecut_remark ,diecut_number
        FROM mi.dbo.machine_planning
        WHERE id = ${plan_id} `
    }
    await connection.query(sql)
        .then(() => {
            return {
                success: 1
            }
        })
        .catch(() => {
            return {
                success: 0
            }
        })
}

const getDataToExcelModel = async (req, transaction) => {
    const { planStartDate, planEndDate, machineTypeId, machineId, menuId } = req;
    var result = {
        success: 0,
    };
    let where = "";

    if (machineId !== null && machineId !== "") {
        where += ` AND mcplan.machine_id = '${machineId}'`;
    }

    if (machineTypeId != 0) {
        where += ` AND machine_type.type_id = '${machineTypeId}'`;
    } else {
        let strMachineTypeList = await getMachineType(menuId);
        where += ` AND machine_type.type_id IN ${strMachineTypeList}`
    }

    const sql = `SELECT 
            mcplan.id AS plan_id,
            mcplan.priority,
            mcplan.jobid,
            mi.job_name,
            mcplan.plan_date,
            mcplan.machine_id,
            machine.machine_name,
            job_status.job_status_name,
            shift.shift_name,
            mcplan.partName, 
            mi_item.totPaper1 AS wi_quantity,
            mcplan.waste,
            mcplan.is_paper_trim_ready
        FROM mi.dbo.machine_planning mcplan
            LEFT JOIN mi.dbo.mi ON mi.jobid = mcplan.jobid
            LEFT JOIN mi.dbo.mi_item ON mi_item.jobid = mcplan.jobid
            LEFT JOIN mi.dbo.machine ON machine.machine_id = mcplan.machine_id
            LEFT JOIN mi.dbo.machine_type ON machine_type.type_id = machine.type_id
            LEFT JOIN mi.dbo.job_status ON job_status.job_status_id = mcplan.job_status_id
            LEFT JOIN mi.dbo.shift ON shift.shift_id = mcplan.shift_id
        WHERE 
            mcplan.plan_date BETWEEN '${planStartDate}' AND '${planEndDate}'
            AND mi_item.itid = mcplan.itid ${where}
        ORDER BY 
            mcplan.plan_date ASC, mcplan.jobid ASC, mcplan.priority ASC, mcplan.id ASC`

    await connection.query(sql)
        .then(([data]) => {
            result.dataExcel = data;
            result.success = 1;
        })
        .catch(() => {
            result.dataExcel = [];
        })
    return result;

}

const getDefaultMachineListModel = async (menuIdArray) => {
    var machineList = [];
    var machineTypeList = [];
    var saddleList = [];
    let workType = "";
    for (var i = 0; i < menuIdArray.length; i++) {
        let strMachineTypeList = await getMachineType(menuIdArray[i])
        if (strMachineTypeList !== null) {
            const sqlMachine = `SELECT
                            a.type_id,
                            b.type_name,
                            a.machine_id,
                            a.machine_name,
                            a.machine_detail,
                            a.costCenter AS cost_center,
                            a.department_id,
                            a.speed,
                            a.make_ready 
                        FROM
                            mi.dbo.machine a
                            LEFT JOIN mi.dbo.machine_type b ON a.type_id = b.type_id
                        WHERE
                            a.type_id IN ${strMachineTypeList}
                            AND a.status_id != 0 
                        ORDER BY
                            a.machine_id`
            let defaultMachineList = (await connection.query(sqlMachine))[0]
            let obj = {
                menuID: menuIdArray[i],
                defaultMachineList
            }
            machineList.push(obj)

            const sqlMachineType = `SELECT type_id,	type_name FROM mi.dbo.machine_type WHERE type_id IN ${strMachineTypeList}`;
            let machineType = (await connection.query(sqlMachineType))[0]
            let obj2 = {
                menuID: menuIdArray[i],
                machineType
            }
            machineTypeList.push(obj2)
        }


    }

    const sqlSaddle = `SELECT
                            saddle_detail_id,
                            saddle_detail_name 
                        FROM
                            mi.dbo.machine_saddle_detail 
                        ORDER BY
                            CAST(saddle_detail_id AS INT)`
    saddleList = (await connection.query(sqlSaddle))[0]
    return {
        machineList,
        machineTypeList,
        saddleList
    }
}

const updateMultiPlanModel = async (req, transaction) => {
    let result = {}
    let chkProc = true
    const { proc, status_save, plan_id_array, detail, job_status_id, machine_id, ok_date, plan_date, remark, shift_id, saleman_id } = req
    const listPlanId = plan_id_array.join(',')
    var settingAttr = ""

    if (plan_date.is_check == 1) {
        var sqlCheck = `select header_id
        from mi.dbo.timesheet_header h
        where h.plan_id  in (${listPlanId})`
        await connection.query(sqlCheck)
            .then(([data]) => {
                if (data.length > 0) {
                    switch (status_save) {
                        case 1:
                            result.msg = 'ไม่สามารถแก้ไขวันที่ได้';
                            break;
                        case 3:
                            result.msg = 'ไม่สามารถลบได้';
                            break;
                        case 5:
                            result.msg = 'ไม่สามารถยกเลิกได้';
                            break;
                    }
                    result.msg += ' เนื่องจากแผนนี้มีการทำ timesheet ไปแล้ว';
                    chkProc = false
                }
            })
    }
    if (chkProc) {
        if (proc === 'edit' || proc === 'copy') {
            settingAttr += ` DECLARE @key_date varchar(50) = null
                            DECLARE @plan_date varchar(10) = null
                            DECLARE @job_status_id char(1) = null
                            DECLARE @machine_id varchar(10) = null
                            DECLARE @shift_id char(1) = null
                            DECLARE @remark	varchar(255) = null
                            DECLARE @ok_date varchar(255) = null
                            DECLARE @detail varchar(255) = null 
                            `
            if (plan_date.is_check == 1) {
                settingAttr += ` SET @plan_date = '${plan_date.value}' `
            }
            if (job_status_id.is_check == 1) {
                settingAttr += ` SET  @job_status_id = '${job_status_id.value}' `
            }
            if (machine_id.is_check == 1) {
                settingAttr += ` SET @machine_id = '${machine_id.value}' `
            }
            if (shift_id.is_check == 1) {
                settingAttr += ` SET  @shift_id = '${shift_id.value}' `
            }
            if (remark.is_check == 1) {
                settingAttr += ` SET @remark = '${remark.value}' `
            }
            if (detail.is_check == 1) {
                settingAttr += ` SET @detail = '${detail.value}' `
            }
            if (ok_date.is_check == 1) {
                settingAttr += ` SET @ok_date = '${ok_date.value}' `
            }
        }
        var sql = "";
        if (proc === 'edit') {
            sql = ` ${settingAttr}
                    SELECT @key_date = convert(NVARCHAR, getdate(),103)+' '+convert(NVARCHAR, getdate(),108);
                    UPDATE mi.dbo.machine_planning
                    SET
                        plan_date = ISNULL(@plan_date,plan_date)
                        ,job_status_id = ISNULL(@job_status_id,job_status_id)
                        ,machine_id = ISNULL(@machine_id,machine_id)
                        ,shift_id = ISNULL(@shift_id,shift_id)
                        ,remark = ISNULL(@remark,remark)
                        ,ok_date = ISNULL(@ok_date,ok_date)
                        /* ,saddle_detail_id = ISNULL(@saddle_detail_id,saddle_detail_id)*/
                        ,detail = ISNULL(@detail,detail)
                        ,saleman_id = ISNULL('${saleman_id}',saleman_id)
                        ,key_date = ISNULL(@key_date,key_date)
                    WHERE id IN(${listPlanId})`
        }
        if(proc === 'copy'){
            sql = ` ${settingAttr}
                    SELECT @key_date = convert(NVARCHAR, getdate(),103)+' '+convert(NVARCHAR, getdate(),108);
                    SELECT * INTO #tmp FROM mi.dbo.machine_planning AS mp WHERE id IN(${listPlanId})
                    ALTER TABLE #tmp DROP COLUMN id ;
            
                    UPDATE #tmp
                    SET
                        plan_date = ISNULL(@plan_date,plan_date)
                        ,job_status_id = ISNULL(@job_status_id,job_status_id)
                        ,machine_id = ISNULL(@machine_id,machine_id)
                        ,shift_id = ISNULL(@shift_id,shift_id)
                        ,remark = ISNULL(@remark,remark)
                        ,ok_date = ISNULL(@ok_date,ok_date)
                        /* ,saddle_detail_id = ISNULL(@saddle_detail_id,saddle_detail_id)*/
                        ,detail = ISNULL(@detail,detail)
                        ,saleman_id = ISNULL('${saleman_id}',saleman_id)
                        ,key_date = ISNULL(@key_date,key_date)
                    INSERT INTO mi.dbo.machine_planning SELECT * FROM #tmp;
                    DROP TABLE #tmp`
        }
        await connection.query(sql)
            .then(() => {
                result.success = 1
                result.msg = 'success'
            })
            .catch((err) => {
                result.success = 0
                result.msg = err
            })
    }
    return result;
}

const cancelMultiPlanModel = async (req, transaction) => {
    let result = {}
    let chkProc = true
    const { plan_id_array,saleman_id } = req
    const listPlanId = plan_id_array.join(',')
    var sqlCheck = `SELECT
                        h.header_id
                    FROM
                        mi.dbo.timesheet_header AS h
                    WHERE
                        h.plan_id IN(${listPlanId})`
    await connection.query(sqlCheck)
        .then(([data]) => {
            if (data.length > 0) {
                result.msg = 'ไม่สามารถยกเลิกได้ เนื่องจากแผนนี้มีการทำ timesheet ไปแล้ว';
                chkProc = false
            }
        })
    if (chkProc) {
        const sql = `   DECLARE @key_date	varchar(50) = null
                        SELECT @key_date = convert(NVARCHAR, getdate(),103)+' '+convert(NVARCHAR, getdate(),108);
                        UPDATE mi.dbo.machine_planning
                        SET machine_id = ''
                            ,cancle_plan = '1' 
                            ,default_machine_id = machine_id
                            ,saleman_id = ISNULL('${saleman_id}',saleman_id)
                            ,key_date = ISNULL(@key_date,key_date)
                        WHERE id IN (
                            SELECT mp.id
                            FROM mi.dbo.machine_planning AS mp
                            LEFT JOIN mi.dbo.vw_machinePlanningPaperReady AS mppr ON mppr.due_id = mp.id
                            WHERE
                                mppr.due_id IS NULL
                            AND mp.id IN(${listPlanId})
                        )
                        AND machine_id > 0`;
        await connection.query(sql)
            .then(() => {
                result.success = 1
                result.msg = 'success'
            })
            .catch((err) => {
                result.success = 0
                result.msg = err
            })
    }
    return result;
}

const deleteMultiPlanModel = async (req, transaction) => {
    let result = {}
    let chkProc = true
    const { plan_id_array } = req
    const listPlanId = plan_id_array.join(',')
    var sqlCheck = `SELECT
                        h.header_id
                    FROM
                        mi.dbo.timesheet_header AS h
                    WHERE
                        h.plan_id IN(${listPlanId})`
    await connection.query(sqlCheck)
        .then(([data]) => {
            if (data.length > 0) {
                result.msg = 'ไม่สามารถลบได้ เนื่องจากแผนนี้มีการทำ timesheet ไปแล้ว';
                chkProc = false
            }
        })
    if (chkProc) {
        const sql = `DELETE mp
                    FROM
                        mi.dbo.machine_planning AS mp
                    LEFT JOIN mi.dbo.vw_machinePlanningPaperReady AS mppr ON mppr.due_id = mp.id
                    WHERE
                        mppr.due_id IS NULL
                    AND mp.id IN(${listPlanId})`
        await connection.query(sql)
            .then(() => {
                result.success = 1
                result.msg = 'success'
            })
            .catch((err) => {
                result.success = 0
                result.msg = err
            })
    }
    return result;
}

const getWorkTypeModel = async (req, transaction) => {
    var WorkTypeList = [];
    let strMachineTypeList = await getMachineType(req)
    const sqlWorkType = `SELECT
                            act_code,
                            act_name
                        FROM
                            mi.dbo.machine_planning_activity
                        WHERE
                            type_id IN ${strMachineTypeList}
                        ORDER BY
                            type_id,
                            act_name,
                            act_code`;
    WorkTypeList = (await connection.query(sqlWorkType))[0]

    return WorkTypeList;
}

const getPlanSearchCaseInModel = async (req, transaction) => {
    const { type_search, act_code, machine_type, shift_id, job_id, start_date, end_date, checked_plan_date } = req

    let strWhere = "";
    let strInner = "";
    let strShiftWhere = "";
    let strAct = "";
    let strWhere1 = "";

    // กรองตาม type ที่ค้นหา
    if (type_search === '1') {
        strInner += ` ISNULL(m_p.machine_id, m_p.default_machine_id) = machine.machine_id `
        if(act_code != 0){
             strAct += ` AND m_p.machine_id = '${act_code}' `
        }
        strWhere +=  `AND m_p.plan_date BETWEEN '${start_date}' AND '${end_date}' `
    } else if (type_search === '2') {
        strInner += ` CASE WHEN m_p.machine_id = '' THEN m_p.default_machine_id ELSE isnull( m_p.machine_id, m_p.default_machine_id )  END = machine.machine_id `
        strWhere += ` AND m_p.jobid LIKE '%${job_id}%' `
        if (checked_plan_date === '1') {
            strWhere += `AND (m_p.plan_date BETWEEN '${start_date}' AND '${end_date}' )`
        }
    } else if (type_search === '3') {
        strInner += ` m_p.default_machine_id = machine.machine_id `
        strWhere += ` AND m_p.jobid LIKE '%${job_id}%'
                      AND (m_p.machine_id IS NULL OR m_p.machine_id = '0' OR m_p.machine_id = '') `
    } else if (type_search === '4') {
        strInner += ` m_p.default_machine_id = machine.machine_id `
        strWhere += ` AND (m_p.machine_id IS NULL OR m_p.machine_id = '0' OR m_p.machine_id = '') 
                     AND (m_p.plan_date BETWEEN '${start_date}' AND '${end_date}' ) `
    } else {
        strInner += ` m_p.machine_id = machine.machine_id `
        strWhere += ` AND 1=2 `
    }

    // กรองตาม machine type ที่ส่งมา
    if (machine_type === "0") {
        let strMachineTypeList = await getMachineType(47);
        strWhere1 += ` AND machine.type_id IN ${strMachineTypeList} `
    } else {
        strWhere1 += ` AND machine.type_id = ${machine_type} `
    }

    // กรองตาม กะ(shift) ที่ส่งมา
    if (shift_id !== "0") {
        strShiftWhere += ` AND m_p.shift_id = ${shift_id} `
    }

    const sqlCasein = `SELECT
                        TOP 100 m_p.priority,
                        m_p.jobid,
                        mi.job_name,
                        m_p.hr1,
                        m_p.plan_date,
                        machine.machine_detail,
                        m_p.machine_id,
                        machine.machine_name,
                        job_status.job_status_name,
                        shift.shift_name,
                        mi_item.partName,
                        m_p.detail,
                        mi.due1,
                        m_p.sig,
                        m_p.quantity,
                        m_p.waste,
                        m_p.make_ready,
                        m_p.process_time1,
                        m_p.speed,
                        m_p.date_paper_in,
                        m_p.paper_size,
                        m_p.paper_type,
                        m_p.date_plate_in,
                        m_p.date_ink_in,
                        m_p.waterbase,
                        m_p.varnish,
                        m_p.recive_dep,
                        m_p.remark,
                        m_p.key_date,
                        m_p.saleman_id,
                        m_p.id,
                        m_p.shift_id,
                        (
                            employee.firstname + '  ' + employee.lastname
                        ) AS fullname,
                        m_p.job_status_id,
                        m_p.sig_num,
                        m_p.wait_dry,
                        m_p.hr,
                        m_p.process_time,
                        machine.type_id AS machine_type_id,
                        m_p.ok_date,
                        m_p.itid,
                        m_p.act_code,
                        act.act_name,
                        MAX(th.header_id) AS header_id,
                        m_p.capacity_labor,
                        m_p.master_capacity_labor,
                        m_p.machine_id_send,
                        pl.process_id,
                        pl.process_name AS send_dep
                    FROM
                        mi.dbo.machine_planning AS m_p
                    LEFT JOIN mi.dbo.mi ON mi.jobid = m_p.jobid
                    LEFT JOIN mi.dbo.mi_item ON m_p.jobid = mi_item.jobid
                    AND m_p.itid = mi_item.itid
                    LEFT JOIN mi.dbo.job_status ON m_p.job_status_id = job_status.job_status_id
                    LEFT JOIN mi.dbo.machine ON ${strInner}
                    LEFT JOIN mi.dbo.shift ON m_p.shift_id = shift.shift_id ${strShiftWhere}
                    LEFT JOIN mi.dbo.employee ON mi.emp_id = employee.emp_id
                    LEFT JOIN mi.dbo.machine_planning_activity AS act ON m_p.act_code = act.act_code
                    LEFT JOIN mi.dbo.timesheet_header AS th ON m_p.id = th.plan_id
                    LEFT JOIN PL.dbo.tb_planning_process pl ON CAST (pl.process_id AS VARCHAR(20)) = m_p.send_dep
                    WHERE
                        1 = 1
                    AND m_p.id = m_p.plan_id_group
                    AND m_p.act_code IN (
                        SELECT DISTINCT
                            mpas2.act_code
                        FROM
                            mi.dbo.machine_planning_activity mpa
                        INNER JOIN mi.dbo.machine_planning_activity_sub mpas ON mpa.act_code = mpas.act_code
                        INNER JOIN mi.dbo.machine_planning_activity_sub mpas2 ON mpas2.machine_id = mpas.machine_id
                        WHERE
                            1 = 1 ${strAct}
                    ) ${strWhere} ${strShiftWhere} ${strWhere1}
                    GROUP BY
                        m_p.priority,
                        m_p.jobid,
                        mi.job_name,
                        m_p.hr1,
                        m_p.plan_date,
                        machine.machine_detail,
                        m_p.machine_id,
                        machine.machine_name,
                        job_status.job_status_name,
                        shift.shift_name,
                        mi_item.partName,
                        m_p.detail,
                        mi.due1,
                        m_p.sig,
                        m_p.quantity,
                        m_p.waste,
                        m_p.make_ready,
                        m_p.process_time1,
                        m_p.speed,
                        m_p.date_paper_in,
                        m_p.paper_size,
                        m_p.paper_type,
                        m_p.date_plate_in,
                        m_p.date_ink_in,
                        m_p.waterbase,
                        m_p.varnish,
                        m_p.recive_dep,
                        m_p.remark,
                        m_p.key_date,
                        m_p.saleman_id,
                        m_p.id,
                        m_p.shift_id,
                        employee.firstname,
                        employee.lastname,
                        m_p.job_status_id,
                        m_p.sig_num,
                        m_p.wait_dry,
                        m_p.hr,
                        m_p.process_time,
                        machine.type_id,
                        m_p.ok_date,
                        m_p.itid,
                        m_p.act_code,
                        act.act_name,
                        m_p.capacity_labor,
                        m_p.master_capacity_labor,
                        m_p.machine_id_send,
                        pl.process_id,
                        pl.process_name
                    ORDER BY
                        ISNULL(m_p.plan_date, '') ASC,
                        ISNULL(m_p.shift_id, '') ASC,
                        ROUND(ISNULL(m_p.priority, ''), 2) ASC,
                        m_p.id ASC`
    // console.log(sqlCasein);
    let planList = (await connection.query(sqlCasein))[0]
    return {
        typeSearch:type_search,
        planList
    }
}

module.exports = {
    getMenuModel,
    getDataModel,
    getPlanSearchModel,
    insertPlanModel,
    updatePlanModel,
    deletePlanModel,
    getMachineModel,
    getDataJobModel,
    getCapacityLaborModel,
    getItemModel,
    cancelPlanModel,
    insertLogMachinePlanningModel,
    getNextMachineListModel,
    getDefaultMachineListModel,
    getMachineType,
    getGroupData,
    getDataToExcelModel,
    updateMultiPlanModel,
    cancelMultiPlanModel,
    deleteMultiPlanModel,
    getWorkTypeModel,
    getPlanSearchCaseInModel
}