const connection = require('../../config/connection')
const moment = require('moment')

const getMultiProcessModel = async (req, transaction) => {
    const sql = `SELECT
                    planning_send.planning_send_id,
                    planning_send.plan_id,
                    planning_send.next_process_id,
                    planning_process.process_name AS next_process_name,
                    planning_send.next_machine_id,
                    z.zone_id AS next_zone_id,
                    z.zone_name AS next_zone_name,
                    planning_send.part_name
                FROM mi.dbo.machine_planning_send planning_send
                LEFT JOIN PL.dbo.tb_planning_process planning_process ON planning_send.next_process_id = planning_process.process_id
                LEFT JOIN PL.dbo.view_machine_list_zone z ON planning_send.next_machine_id = z.machine_id COLLATE Thai_CI_AI
                WHERE planning_send.plan_id = '${req}'
                ORDER BY planning_send.planning_send_id`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data,
                message: 'success',
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const preparePrePalletModel = async (req, transaction) => {
    const sql = `SELECT TOP
                    1 header.header_id,
                    planning.id AS plan_id,
                    planning.jobid AS job_id,
                    mi.job_name AS job_name,
                    planning.machine_id,
                    machine.machine_name,
                    planning.plan_date,
                    planning.partName AS part_name,
                    planning.sig,
                    machine.machine_process_id,
                    planning_process_1.process_name AS machine_process,
                    machine.zone_id,
                    planning.machine_id_send AS next_machine_id,
                    planning.send_dep AS next_process_id,
                    planning_process.process_name AS next_process,
                    z.zone_name AS next_zone,
                    z.zone_id AS next_zone_id,
                    timesheet_worker.emp_id,
                    employee.emp_firstname_th + ' ' + employee.emp_lastname_th AS emp_name,
                    planning.machine_send_remark AS send_out_remark,
                    CONVERT ( VARCHAR(5), getdate(), 108) AS 'current_time',
                CASE
                        
                        WHEN planning.send_dep = 38 THEN
                        1 ELSE 0 
                    END AS is_send_out,
                    planning.plan_id_group,
                    planning.paper_type 
                FROM
                    mi.dbo.machine_planning planning
                    LEFT JOIN mi.dbo.mi ON mi.jobid = planning.jobid
                    LEFT JOIN mi.dbo.timesheet_header header ON header.plan_id = planning.id
                    LEFT JOIN PL.dbo.tb_planning_process planning_process ON planning.send_dep = planning_process.process_id
                    LEFT JOIN PL.dbo.tb_machine_list machine ON planning.machine_id = machine.machine_id COLLATE Thai_CI_AI
                    LEFT JOIN PL.dbo.tb_planning_process planning_process_1 ON machine.machine_process_id = planning_process_1.process_id
                    LEFT JOIN PL.dbo.view_machine_list_zone z ON planning.machine_id_send = z.machine_id COLLATE Thai_CI_AI
                    LEFT JOIN mi.dbo.timesheet_worker timesheet_worker ON header.header_id = timesheet_worker.header_id
                    LEFT JOIN PL.dbo.view_hrm_employee employee ON CONVERT ( VARCHAR ( 20 ), timesheet_worker.emp_id ) = employee.emp_id 
                WHERE
                    header.header_id IN ( '${req}' ) 
                    AND timesheet_worker.emp_id<> '' 
                    AND employee.emp_firstname_th<> '' 
                    AND ( planning.id = planning.plan_id_group OR planning.plan_id_group = '' OR planning.plan_id_group IS NULL ) 
                ORDER BY
                    header.header_id DESC,
                    timesheet_worker.emp_id`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data,
                message: 'success',
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const getTimesheetPalletTypeModel = async (req, transaction) => {
    const sql = `SELECT
                        lr.remark_id,
                        lr.remark_name
                FROM
                    PL.dbo.tb_list_remark lr 
                WHERE lr.is_actived != 0`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                message: 'success',
                data: data
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const updatetPalletTypePalletTimsheetModel = async (req) => {
    const { pallet_id, remark_id } = req
    var data = {}
    try {
        const sql_update_type_pallet = `UPDATE PL.dbo.tb_pallet SET remark_id = ${remark_id} WHERE pallet_id = '${pallet_id}'`
        await connection.query(sql_update_type_pallet)

        const sql_inset_pallet_log = `INSERT INTO PL.dbo.tb_pallet_log(pallet_code,log_detail,log_by)
                                        SELECT 
                                            pallet.pallet_code,
                                            'update',
                                            pallet.technician_id
                                        FROM PL.dbo.tb_pallet AS pallet
                                        WHERE pallet_id = '${pallet_id}'`
        await connection.query(sql_inset_pallet_log)
        data = {
            success: true,
            message: "update_pallet_remark_id_timesheet",
        }
    } catch (exception) {
        data = {
            success: false,
            message: exception,
        }
    }
    return data
}

const updatetPalletQtyTimsheetModel = async (req) => {
    console.log("35")
    console.log(req)
    const { pallet_id, qty } = req
    var data = {}
    try {
        console.log("42")
        // console.log(remark_id)
        const sql_update_qty = `UPDATE PL.dbo.tb_pallet SET qty = '${qty}' WHERE pallet_id = '${pallet_id}'`
        await connection.query(sql_update_qty)

        const sql_inset_pallet_log = `INSERT INTO PL.dbo.tb_pallet_log(pallet_code,log_detail,log_by)
                                        SELECT 
                                            pallet.pallet_code,
                                            'update',
                                            pallet.technician_id
                                        FROM PL.dbo.tb_pallet AS pallet
                                        WHERE pallet_id = '${pallet_id}'`
        await connection.query(sql_inset_pallet_log)
        data = {
            success: true,
            message: "update_pallet_qty_timesheet",
        }
    } catch (exception) {
        data = {
            success: false,
            message: exception,
        }
    }
    return data
}

const deletePalletModel = async (req) => {
    const { pallet_code, emp } = req
    let data = {}
    try {
        const sql = `SELECT pallet_id FROM PL.dbo.tb_pallet WHERE pallet_code = '${pallet_code}'`
        let rs_pallet_id = await connection.query(sql).then(([data]) => {
            return data[0];
        })
        console.log("12")
        console.log(rs_pallet_id)
        if (rs_pallet_id == 0 || rs_pallet_id == '') {
            data = {
                success: false,
                message: "pallet Not Found"
            }
        } else {
            const sql_delete = `EXEC PL.dbo.delete_pallet @pallet_code='${pallet_code}', @delete_by = '${emp}';`
            await connection.query(sql_delete)

            const sql_fg_pallet = `SELECT pallet_barcode FROM mi.dbo.FG_Product_Pallet WHERE pl_code = '${pallet_code}'`
            let rs_fg_pallet = await connection.query(sql_fg_pallet).then(([data]) => {
                return data[0]
            })
            console.log("28")
            console.log(rs_fg_pallet)

            if (rs_fg_pallet != undefined) {
                let fg_pallet_code = rs_fg_pallet.pallet_barcode
                const sql_delete_fg_pallet = `DELETE FROM mi.dbo.FG_Product_Pallet WHERE pl_code = '${fg_pallet_code}';`
                await connection.query(sql_delete_fg_pallet)
            }
            data = {
                success: true,
                message: "delete_pallet",
                data: pallet_code
            }
        }

    } catch (exception) {
        data = {
            success: false,
            message: exception,
        }
    }
    return data
}

const getListPrepalletModel = async (req, transaction) => {
    console.log("6")
    console.log(req)
    const { machine, plan_id } = req
    var wh = "";
    if (checkValueNull(machine) != null) {
        if (machine != '') {
            wh += `AND pallet.machine_id = '${machine}'`;
        }
    }
    if (checkValueNull(plan_id) != null) {
        if (plan_id != '') {
            wh += `AND pallet.plan_id = '${plan_id}'`;
        }
    }

    const sql = `SELECT
                        pallet.pallet_id,
                        pallet.pallet_code,
                        pallet.pre_pallet_code,
                        pallet.machine_id,
                        pallet.plan_id,
                        pallet.job_id,
                        mi.job_name,
                        pallet.part_name,
                        pallet.qty,
                        pallet.accumulated_amount,
                        pallet.sig,
                        pallet.pallet_number,
                        FORMAT (pallet.created,'dd/MM/yyyy HH:mm') AS created,
                        pallet.technician_id,
                        employee.emp_firstname_th+ ' ' +employee.emp_lastname_th AS technician_name,
                        pallet.planning_type,
                        pallet.is_wait_dry,
                        pallet.wait_dry_hr,
                        pallet.sig_folding,
                        pallet.timesheet_remark,
                        pallet.remark_id
                    FROM PL.dbo.tb_pallet pallet
                    LEFT JOIN mi.dbo.mi mi ON pallet.job_id = mi.jobid COLLATE Thai_CI_AI
                    LEFT JOIN PL.dbo.view_hrm_employee employee ON pallet.technician_id = employee.emp_id
                    WHERE 1 = 1
                    ${wh}
                    ORDER BY pallet.pallet_id DESC;
                    `
    return await connection.query(sql)
        .then(async ([data]) => {
            // console.log("50")
            // console.log(data)
            const sql_sum_qty = `SELECT
                                            SUM (pallet.qty) AS accumulated_amount
                                        FROM
                                            PL.dbo.tb_pallet pallet
                                        LEFT JOIN mi.dbo.mi mi ON pallet.job_id = mi.jobid COLLATE Thai_CI_AI
                                        LEFT JOIN PL.dbo.view_hrm_employee employee ON pallet.technician_id = employee.emp_id
                                        WHERE
                                            1 = 1
                                            ${wh}`
            let accumulated_amount = await connection.query(sql_sum_qty)
            // console.log(accumulated_amount)
            // console.log(data)
            return {
                success: true,
                data: data,
                accumulated_amount: accumulated_amount[0][0].accumulated_amount,
                message: 'success',
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const insertPrepalletModel = async (req, transaction) => {
    console.log(req)
    var { planning_type, main_machine, timesheet_header_id, pl_trimming_detail } = req
    let tem_planning_type = 1;
    var sql = ""
    var data = {}
    var pallet = {}
    let result_pre_pallet = {}

    if (checkValueNull(planning_type) != null) {
        if (planning_type != '' || planning_type != '0') {
            tem_planning_type = planning_type;
        }
    }
    const wh = "AND machine.is_actived = 1";
    if (checkValueNull(main_machine) != null) {
        if (main_machine != '') {
            // $wh .= " AND planning.machine_id = '$this->main_machine' ";
        }
    }
    // if(checkValueNull(sig_folding) != null) {
    //     sig_folding = sig_folding;
    // } else {
    //     sig_folding = "";
    // }
    // console.log("temp1 "+tem_planning_type)
    try {
        if (tem_planning_type == 1) { //machine
            sql = `SELECT TOP 1
                            header.header_id,
                            planning.id AS plan_id,
                            planning.jobid AS job_id,
                            mi.job_name AS job_name,
                            header.machine_id,
                            z_out.sub_name AS zone_name,
                            z_out.zone_detail AS zone_detail,
                            machine.machine_name,
                            planning.plan_date,
                            planning.partName AS part_name,
                            planning.sig,
                            out_process.process_name AS machine_process,
                            machine.machine_process_id,
                            machine.zone_id,
                            planning.machine_id_send AS next_machine_id,
                            planning.send_dep AS next_process_id,
                            planning_process.process_name AS next_process,
                            z_in.sub_name as next_zone,
                            z_in.zone_id as next_zone_id,
                            z_in.zone_detail AS next_zone_detail,
                            planning.machine_send_remark AS send_out_remark,
                            CASE WHEN planning.send_dep = 38 THEN 1 ELSE 0 END AS is_send_out,
                            planning.plan_id_group
                        FROM mi.dbo.machine_planning planning
                        LEFT JOIN mi.dbo.mi ON mi.jobid = planning.jobid
                        LEFT JOIN mi.dbo.timesheet_header header ON header.plan_id = planning.id
                        LEFT JOIN PL.dbo.tb_planning_process planning_process ON planning.send_dep = planning_process.process_id
                        LEFT JOIN PL.dbo.tb_machine_list machine ON header.machine_id = machine.machine_id COLLATE Thai_CI_AI
                        LEFT JOIN PL.dbo.tb_planning_process out_process ON machine.machine_process_id = out_process.process_id
                        LEFT JOIN PL.dbo.view_machine_list_zone z_in ON planning.machine_id_send = z_in.machine_id COLLATE Thai_CI_AI
                        LEFT JOIN PL.dbo.view_machine_list_zone z_out ON header.machine_id = z_out.machine_id COLLATE Thai_CI_AI                        
                        LEFT JOIN mi.dbo.timesheet_worker timesheet_worker ON header.header_id = timesheet_worker.header_id
                        WHERE header.header_id in ('${timesheet_header_id}')
                            AND (planning.id = planning.plan_id_group OR planning.plan_id_group = '' OR planning.plan_id_group IS NULL)
                        ${wh}
                        ORDER BY header.header_id,timesheet_worker.emp_id`
        } else if (tem_planning_type == 2) { //handwork
            sql = `SELECT TOP 1
                        header.header_id,
                        planning.id AS plan_id,
                        planning.jobid AS job_id,
                        mi.job_name AS job_name,
                        planning.team_id AS machine_id,
                        machine.machine_name,
                        planning.datemake AS plan_date,
                        planning.detail AS part_name,
                        (SELECT 0)AS sig,
                        out_process.process_name AS machine_process,
                        machine.machine_process_id,
                        machine.zone_id,
                        z_out.sub_name AS zone_name,
                        z_out.zone_detail AS zone_detail,
                        planning.machine_id_send AS next_machine_id,
                        planning.send_dep AS next_process_id,
                        planning_process.process_name AS next_process,
                        z_in.sub_name as next_zone,
                        z_in.zone_id as next_zone_id,
                        z_in.zone_detail AS next_zone_detail,
                        planning.machine_send_remark AS send_out_remark,
                        CASE WHEN planning.send_dep = 38 THEN 1 ELSE 0 END AS is_send_out 
                    FROM mi.dbo.Si_jobopen_man planning
                    LEFT JOIN mi.dbo.mi ON mi.jobid = planning.jobid
                    LEFT JOIN mi.dbo.timesheet_header header ON header.handwork_plan_id = planning.id
                    LEFT JOIN PL.dbo.tb_planning_process planning_process ON planning.send_dep = planning_process.process_id
                    LEFT JOIN PL.dbo.tb_machine_list machine ON planning.team_id = machine.machine_id COLLATE Thai_CI_AI
                    LEFT JOIN PL.dbo.tb_planning_process out_process ON machine.machine_process_id = out_process.process_id
                    LEFT JOIN PL.dbo.view_machine_list_zone z_in ON planning.machine_id_send = z_in.machine_id COLLATE Thai_CI_AI
                    LEFT JOIN PL.dbo.view_machine_list_zone z_out ON planning.team_id = z_out.machine_id COLLATE Thai_CI_AI
                    WHERE header.header_id in ('${timesheet_header_id}')
                        ${wh}
                    ORDER BY header.header_id`
        } else if (tem_planning_type == 3) { //packing
            sql = `SELECT TOP 1
                        header.header_id,
                        planning.id AS plan_id,
                        planning.jobid AS job_id,
                        mi.job_name AS job_name,
                        planning.team_id AS machine_id,
                        z_out.sub_name AS zone_name,
                        z_out.zone_detail AS zone_detail,
                        machine.machine_name,
                        planning.datemake AS plan_date,
                        planning.detail AS part_name,
                        (SELECT 0)AS sig,
                        out_process.process_name AS machine_process,
                        machine.machine_process_id,
                        machine.zone_id,
                        planning.machine_id_send AS next_machine_id,
                        planning.send_dep AS next_process_id,
                        planning_process.process_name AS next_process,
                        z_in.sub_name as next_zone,
                        z_in.zone_id as next_zone_id,
                        z_in.zone_detail AS next_zone_detail,
                        planning.machine_send_remark AS send_out_remark,
                        CASE WHEN planning.send_dep = 38 THEN 1 ELSE 0 END AS is_send_out 
                    FROM mi.dbo.Si_jobopen_packing planning
                    LEFT JOIN mi.dbo.mi ON mi.jobid = planning.jobid
                    LEFT JOIN mi.dbo.timesheet_header header ON header.packing_plan_id = planning.id
                    LEFT JOIN PL.dbo.tb_planning_process planning_process ON planning.send_dep = planning_process.process_id
                    LEFT JOIN PL.dbo.tb_machine_list machine ON planning.team_id = machine.machine_id COLLATE Thai_CI_AI
                    LEFT JOIN PL.dbo.tb_planning_process out_process ON machine.machine_process_id = out_process.process_id
                    LEFT JOIN PL.dbo.view_machine_list_zone z_in ON planning.machine_id_send = z_in.machine_id COLLATE Thai_CI_AI
                    LEFT JOIN PL.dbo.view_machine_list_zone z_out ON planning.team_id = z_out.machine_id COLLATE Thai_CI_AI
                    WHERE header.header_id in ('${timesheet_header_id}')
                        ${wh}
                    ORDER BY header.header_id`
        } else {
            data = {
                success: false,
                message: 'planning_type not in (1,2,3)',
                data: null,
            }
        }
        // console.log(await connection.query(sql))
        let get_pre_pallet = await connection.query(sql)
            .then(([row]) => {
                // console.log("179")
                // console.log(row)
                return row;
            });

        /* insert prepallet */
        let prepallet_id = await insertPrePallet(get_pre_pallet, req, tem_planning_type);
        /* get prepallet_code new */
        let rs_pre_pallet = await getPrepalletNew(prepallet_id);
        let rs_pallet_number = await getPalletNumber(rs_pre_pallet);
        let rs_insert_pallet = await insertPallet(rs_pre_pallet, rs_pallet_number);
        let rs_pallet_new = await getPalletNew(rs_insert_pallet);

        rs_pre_pallet = {
            pre_pallet_id: rs_pre_pallet.pre_pallet_id,
            pre_pallet_code: rs_pre_pallet.pre_pallet_code,
            pallet_id: rs_pallet_new.pallet_id,
            pallet_code: rs_pallet_new.pallet_code,
        }

        if (pl_trimming_detail) {
            rs_pre_pallet.pallet_trimming_detail = await insertPalletTrimmingDetail(pl_trimming_detail, rs_pallet_new.pallet_id)
        }

        data = {
            success: true,
            message: 'save pre pallet',
            pallet: rs_pre_pallet
        }
    } catch (exception) {
        data = {
            success: false,
            message: exception,
            data: null,
        }
    }
    return data
}

const insertPalletTrimmingDetail = async (data, pallet_id) => {
    for (const item of data) {
        const sql = `INSERT INTO PL.dbo.tb_pallet_trimming_detail(pallet_id, qty_paper, paper_per_qty, sequence)
        VALUES(${pallet_id}, '${item.qty_paper}', '${item.paper_per_qty}', ${item.sequence})`
        await connection.query(sql)
    }
    return 1
}

const insertPrePallet = async (row, req, tem_planning_type) => {
    var {
        sig_folding,
        part_name,
        next_machine_id,
        next_process_name,
        next_process_id,
        next_zone_id,
        technician_remark,
        timesheet_remark,
        sig,
        is_wait_dry,
        wait_dry_hr,
        tem_part_name,
        planning_send_id,
        send_out_remark,
        qty,
        is_last_pallet,
        print_finished,
        remark_id,
        emp_created,
        emp,
        type_id,
        trim_size,
        trim_height,
        trim_detail } = req

    let id_prepallets = [];
    const today = moment().format("YYYY-MM-DD");
    if (row[0].is_send_out != 1) {
        send_out_remark = null;
    } else {
        send_out_remark = `${send_out_remark}`;
    }

    if (planning_send_id > 0) {
        row[0].part_name = part_name;
        row[0].next_machine_id = next_machine_id;
        row[0].next_process = next_process_name;
        row[0].next_process_id = next_process_id;
        row[0].next_zone_id = next_zone_id;
    }

    if (timesheet_remark == '') {
        timesheet_remark = ''
    } else {
        timesheet_remark = timesheet_remark.replace("'", '"');
    }

    //ใส่ข้อมูลช่างที่กรอก
    if (tem_planning_type == 2) {
    }
    // console.log(sig)
    if (sig > 32767) {
        sig = 32767; //ค่า max smallint
    }
    //จัดการรอแห้ง
    if (is_wait_dry > 0) {
        is_wait_dry = 1;
        wait_dry_hr = wait_dry_hr.replace("'", '"');
    } else {
        is_wait_dry = 0;
        wait_dry_hr = '';
    }
    tem_part_name = row[0].part_name.replace("'", '"');
    var sql_pre = `DECLARE @OutputTbl TABLE (ID INT)
            INSERT INTO PL.dbo.tb_pre_pallet
                (
                    machine_id, 
                    plan_id,
                    job_id,
                    part_name,
                    qty,
                    sig,
                    next_machine_id,
                    next_process,
                    next_zone_id,
                    is_last_pallet,
                    print_finished,
                    remark_id,
                    is_send_out,
                    send_out_remark,
                    technician_id,
                    created_by,
                    machine_process,
                    zone_id,
                    planning_type,
                    technician_remark,
                    timesheet_remark,
                    is_wait_dry,
                    wait_dry_hr,
                    /*sig_folding,*/
                    process_id,
                    next_process_id,
                    trim_size
                )
            OUTPUT INSERTED.id INTO @OutputTbl(ID)
            VALUES(
                ${row[0].machine_id},
                ${row[0].plan_id},
                '${row[0].job_id}',
                '${row[0].part_name}',
                ${qty},
                ${sig},
                '${row[0].next_machine_id}',
                '${row[0].next_process}',
                ${row[0].next_zone_id},
                ${is_last_pallet},
                getdate(),
                ${remark_id},
                ${row[0].is_send_out},
                '${row[0].send_out_remark}',
                '${emp_created}',
                '${emp}',
                '${row[0].machine_process}',
                ${row[0].zone_id},
                ${tem_planning_type},
                '${technician_remark}',
                '${timesheet_remark}',
                '${is_wait_dry}',
                '${wait_dry_hr}',
                /*'${sig_folding}',*/
                ${row[0].machine_process_id},
                ${row[0].next_process_id},
                '${trim_size}'
            )
            SELECT ID FROM @OutputTbl;`
    // console.log(sql_pre)
    let row_in = await connection.query(sql_pre);
    if (type_id === '52' || type_id === '36') {
        const sql_update = `UPDATE PL.dbo.tb_pre_pallet
        SET trim_detail = '${trim_detail}',
        trim_height = ${trim_height}
        WHERE id = ${row_in[0][0].ID}`
        await connection.query(sql_update);
    }
    return row_in[0][0].ID;
}

const getPrepalletNew = async (row_in) => {
    var sql_get_pre_pallet = `   SELECT TOP 1
                                    pre_pallet.id AS pre_pallet_id,
                                    pre_pallet.pre_pallet_code,
                                    pre_pallet.plan_id,
                                    pre_pallet.machine_id,
                                    pre_pallet.job_id,
                                    pre_pallet.part_name,
                                    pre_pallet.qty,
                                    pre_pallet.sig,
                                    pre_pallet.next_machine_id,
                                    pre_pallet.next_process,
                                    pre_pallet.zone_id,
                                    pre_pallet.next_zone_id,
                                    pre_pallet.technician_id,
                                    pre_pallet.machine_process,
                                    zone_out.sub_name AS zone_name,
                                    zone_in.sub_name AS next_zone_name,
                                    zone_out.zone_detail AS zone_detail,
                                    zone_in.zone_detail AS next_zone_detail,
                                    machine.machine_name,
                                    employee.emp_firstname_th + ' ' + employee.emp_lastname_th As technician_name,
                                    pre_pallet.planning_type,
                                    pre_pallet.is_last_pallet,
                                    CONVERT(varchar, pre_pallet.print_finished, 120) AS print_finished,
                                    pre_pallet.remark_id,
                                    pre_pallet.is_send_out,
                                    pre_pallet.send_out_remark,
                                    pre_pallet.created_by,
                                    pre_pallet.technician_remark,
                                    pre_pallet.timesheet_remark,
                                    pre_pallet.is_wait_dry,
                                    pre_pallet.wait_dry_hr,
                                    pre_pallet.sig_folding,
                                    pre_pallet.sig_sod,
                                    pre_pallet.page_number,
                                    pre_pallet.process_id,
                                    pre_pallet.next_process_id,
                                    pre_pallet.trim_detail,
                                    pre_pallet.trim_size,
                                    pre_pallet.trim_height,
                                    pre_pallet.calculate_qty
                                FROM PL.dbo.tb_pre_pallet pre_pallet
                                LEFT JOIN PL.dbo.tb_zone zone_out ON pre_pallet.zone_id = zone_out.zone_id
                                LEFT JOIN PL.dbo.tb_zone zone_in ON pre_pallet.next_zone_id = zone_in.zone_id
                                LEFT JOIN mi.dbo.machine machine ON pre_pallet.machine_id = machine.machine_id COLLATE Thai_CI_AI
                                LEFT JOIN PL.dbo.view_hrm_employee employee ON pre_pallet.technician_id = employee.emp_id COLLATE Thai_CI_AI
                                WHERE pre_pallet.id = ${row_in} `
    return await connection.query(sql_get_pre_pallet)
        .then(([data]) => {
            console.log(data[0]);
            return data[0]
        })
}

const getPalletNumber = async (rs_pre_pallet) => {
    // console.log("467");
    // console.log(rs_pre_pallet);
    let pre_pallet_code = rs_pre_pallet.pre_pallet_code
    var pallet_number = 0;
    let tem_part_name = rs_pre_pallet.part_name.replace("'", '"');
    if (tem_part_name == "") {
        rs_pre_pallet.part_name = "";
    }
    // if (rs_pre_pallet.sig_folding == "") {
    //     rs_pre_pallet.sig_folding = null;
    // }
    var sql_pallet_number = `
                            SELECT 
                                COUNT(pallet.pallet_id) + 1 AS next_pallet_number
                            FROM PL.dbo.tb_pallet pallet
                            WHERE pallet.job_id = '${rs_pre_pallet.job_id}'
                            AND pallet.machine_process = '${rs_pre_pallet.machine_process}'
                            AND pallet.part_name = '${rs_pre_pallet.part_name}'
                            AND pallet.sig = '${rs_pre_pallet.sig}'
                            AND pallet.sig_folding = '${rs_pre_pallet.sig_folding}'`
    let result_pallet_number = await connection.query(sql_pallet_number).then(([data]) => { return data[0] })
    pallet_number = result_pallet_number.next_pallet_number
    return pallet_number;
}

const insertPallet = async (rs_pre_pallet, pallet_number) => {
    console.log(rs_pre_pallet);
    const sql_insert_pallet = `DECLARE @OutputTbl TABLE (ID INT)
                                INSERT INTO PL.dbo.tb_pallet
                                    (
                                        machine_id, 
                                        plan_id,
                                        job_id,
                                        part_name,
                                        qty,
                                        sig,
                                        next_machine_id,
                                        next_process,
                                        next_zone_id,
                                        is_last_pallet,
                                        print_finished,
                                        remark_id,
                                        is_send_out,
                                        send_out_remark,
                                        technician_id,
                                        created_by,
                                        machine_process,
                                        zone_id,
                                        status_id,
                                        is_actived,
                                        pallet_number,
                                        planning_type,
                                        pre_pallet_code,
                                        technician_remark,
                                        timesheet_remark,
                                        is_wait_dry,
                                        wait_dry_hr,
                                        sig_folding,
                                        sig_sod,
                                        page_number,
                                        process_id,
                                        next_process_id,
                                        trim_detail,
                                        trim_size,
                                        trim_height,
                                        calculate_qty
                                )
                                OUTPUT INSERTED.pallet_id INTO @OutputTbl(ID)
                                VALUES(
                                    '${rs_pre_pallet.machine_id}',
                                    '${rs_pre_pallet.plan_id}',
                                    '${rs_pre_pallet.job_id}',
                                    '${rs_pre_pallet.part_name}',
                                    ${rs_pre_pallet.qty},
                                    ${rs_pre_pallet.sig},
                                    '${rs_pre_pallet.next_machine_id}',
                                    '${rs_pre_pallet.next_process}',
                                    '${rs_pre_pallet.next_zone_id}',
                                    '${rs_pre_pallet.is_last_pallet}',
                                    '${rs_pre_pallet.print_finished}',
                                    '${rs_pre_pallet.remark_id}',
                                    '${rs_pre_pallet.is_send_out}',
                                    '${rs_pre_pallet.send_out_remark}',
                                    '${rs_pre_pallet.technician_id}',
                                    '${rs_pre_pallet.created_by}',
                                    '${rs_pre_pallet.machine_process}',
                                    '${rs_pre_pallet.zone_id}',
                                    ${1},
                                    ${1},
                                    '${pallet_number}',
                                    '${rs_pre_pallet.planning_type}',
                                    '${rs_pre_pallet.pre_pallet_code}',
                                    '${rs_pre_pallet.technician_remark}',
                                    '${rs_pre_pallet.timesheet_remark}',
                                    ${rs_pre_pallet.is_wait_dry},
                                    ${rs_pre_pallet.wait_dry_hr},
                                    ${rs_pre_pallet.sig_folding},
                                    ${rs_pre_pallet.sig_sod},
                                    ${rs_pre_pallet.page_number},
                                    ${rs_pre_pallet.process_id},
                                    ${rs_pre_pallet.next_process_id},
                                    '${rs_pre_pallet.trim_detail}',
                                    '${rs_pre_pallet.trim_size}',
                                    ${rs_pre_pallet.trim_height},
                                    ${0}
                                )
                                SELECT ID FROM @OutputTbl;`
    var pallet_id_INSERT_array = [];
    let result_insert_pallet = await connection.query(sql_insert_pallet).then(([data]) => {
        return data[0]
    })
    pallet_id_INSERT_array.push(result_insert_pallet.ID)
    updateTbPrePallet(rs_pre_pallet)
    return pallet_id_INSERT_array

    // return pallet_id_INSERT_array                                
}

const updateTbPrePallet = (rs_pre_pallet) => {
    const sql_update_prepallet = `UPDATE PL.dbo.tb_pre_pallet 
                                SET is_pallet = '1'
                                WHERE tb_pre_pallet.id = ${rs_pre_pallet.pre_pallet_id} `
    connection.query(sql_update_prepallet)
}

const getPalletNew = async (pallet_id_INSERT_array) => {
    console.log("658")
    console.log(pallet_id_INSERT_array)
    const pallet_code = '';
    const pallet_id = '';
    console.log(pallet_id_INSERT_array.length)
    if (pallet_id_INSERT_array.length > 0) {
        // var pallet_id_INSERT = join(",", pallet_id_INSERT_array);
        // console.log("665")
        // console.log(pallet_id_INSERT_array)
        var sql = `SELECT
                        pallet.pallet_id,
                        pallet.pallet_code,
                        pallet.zone_id,
                        zone_out.sub_name AS zone_name,
                        pallet.next_zone_id,
                        zone_in.sub_name AS next_zone_name
                FROM PL.dbo.tb_pallet pallet
                LEFT JOIN PL.dbo.tb_zone zone_out ON pallet.zone_id= zone_out.zone_id
                LEFT JOIN PL.dbo.tb_zone zone_in ON pallet.next_zone_id= zone_in.zone_id
                WHERE pallet.pallet_id IN ('${pallet_id_INSERT_array}')
                ORDER BY pallet.pallet_code`;
        let result = await connection.query(sql).then(([data]) => {
            return data[0];
        })
        // console.log("680")
        // console.log(result)
        return result
    }
}

const checkValueNull = async (value) => {
    // const result1 = typeof value === 'string' ? value.trim() : '';
    if (value != '' && value != null) {
        return value;
    } else {
        return null;
    }
}

const send_line = async (txt) => {
    console.log(txt)
}

const uploadImageModel = async (req) => {
    console.log(req.files, req.body)
    console.log(req.files.length)
    let data = {}
    try {
        if (req.files.length === 1) {
            req.files.forEach(async (item, index) => {
                const sql = `INSERT INTO mi.dbo.timesheet_attach_files(header_id, attach_file, attach_file_name, remark)VALUES(${req.body.header_id},'${item.filename}','${item.originalname}','${req.body.img_remark}')`
                await connection.query(sql);
            });
        } else {
            req.files.forEach(async (item, index) => {
                const sql = `INSERT INTO mi.dbo.timesheet_attach_files(header_id, attach_file, attach_file_name, remark)VALUES(${req.body.header_id},'${item.filename}','${item.originalname}','${req.body.img_remark[index]}')`
                await connection.query(sql);
            });
        }

        data = {
            success: true,
            message: "บันทึกข้อมูลสำเร็จ"
        }
    } catch (error) {
        console.log(error)
        data = {
            success: false,
            message: "บันทึกข้อมูลไม่สำเร็จ"
        }
    }
    return data
}

module.exports = {
    preparePrePalletModel,
    getTimesheetPalletTypeModel,
    getMultiProcessModel,
    insertPrepalletModel,
    getListPrepalletModel,
    deletePalletModel,
    updatetPalletQtyTimsheetModel,
    updatetPalletTypePalletTimsheetModel,
    uploadImageModel

}