const connection = require('../../config/connection')
const moment = require('moment')

// ***************************Start Timesheet Header******************************

const insertErrorLog = async (req) => {
    const { error_text, header_id, error_function, type_id } = req
    let datetime = await getDatetime()
    let error_str1 = error_text.replace("'", "''")
    const sql = `exec mi.dbo.timesheet_insert_error_log 
    @error_text = '${error_str1}',
    @header_id = ${header_id}, 
    @from_mi3 = 1, 
    @error_created_date = '${datetime}',
    @error_function = '${error_function}',
    @type_id = '${type_id}'`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                error_id: data[0][0].error_id
            }

        })
        .catch(async (err) => {
            let error_str2 = err.replace("'", "''")
            const sql_self = `exec mi.dbo.timesheet_insert_error_log 
                @error_text = '${error_str2}',
                @header_id = ${header_id}, 
                @from_mi3 = 1, 
                @error_created_date = '${datetime}',
                @error_function = 'insertErrorLog',
                @type_id = '${type_id}'`
            let self_error = await connection.query(sql_self)
            return {
                error_id: self_error[0][0].error_id
            }
        })
}

const getDatetime = async () => {
    const format1 = "yyyy-MM-DD HH:mm:ss.SSS"
    let my_date = moment(new Date()).format(format1)
    return my_date
}

const getCheckerModel = async (req, transaction) => {
    const sql = `SELECT
        a.emp_id AS leader_id,
        b.emp_firstname_th + ' ' + b.emp_lastname_th AS leader_name, 
        a.position AS leader_position
    FROM
        mi.dbo.checklist_inspector a
        LEFT JOIN HRM.dbo.hrm_employee b ON a.emp_id = b.emp_id collate Thai_CI_AI
    WHERE
        a.type_id = '${req}' AND a.status = 1`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data
            }

        })
        .catch((err) => {
            return {
                success: false,
                data: err
            }
        })
}

const getMachineTypeModel = async (req, transaction) => {
    let event = req.toString() === 'timesheet' ? 1 : 2
    let where = req.toString() === 'timesheet' ? `timesheetLocation = '${req}' ` : `type_id = '${req}' `
    const sql = `SELECT
                    type_id,
                    type_name,
                    timesheet_maxworker AS maxworker 
                FROM
                    mi.dbo.machine_type 
                WHERE
                    ${where}
                    AND type_id IN (SELECT a.type_id FROM mi.dbo.machine a WHERE a.has_timesheet = 1)`
    return await connection.query(sql)
        .then(([data]) => {
            let message = data[0].length === 0 ? 'Machine type is Empty!' : 'SUCCESS'
            return {
                success: true,
                message: message,
                event: event,
                data: data
            }

        })
        .catch((err) => {
            return {
                success: false,
                message: `QUERY ERROR: ${err}`
            }
        })
}

const getMachinesModel = async (req, transaction) => {
    const sql = `SELECT
                    a.machine_id AS machine_id,
                    a.machine_name AS machine_name,
                    a.type_id AS type_id,
                CASE
                        WHEN '${req}' = 34 THEN 1 
                        WHEN '${req}' = 74 THEN 1 
                        WHEN '${req}' = 35 THEN	ISNULL( b.perfecting, 0 ) ELSE 0 
                    END AS perfecting 
                FROM
                    mi.dbo.timesheet_machine a
                    LEFT OUTER JOIN mi.dbo.machine_printing_spec b ON a.machine_id = b.machine_id 
                WHERE
                    a.type_id = '${req}'`
    return await connection.query(sql)
        .then(([data]) => {
            let message = data[0].length === 0 ? 'Machines is Empty!' : 'SUCCESS'
            return {
                success: true,
                message: message,
                data: data
            }

        })
        .catch((err) => {
            return {
                success: false,
                message: `Machines is Empty! ERROR: ${err}`
            }
        })
}

const getWorkersModel = async (req, transaction) => {

    let wh_str = ``
    if (req.query.value_type === 'machine_id') {
        wh_str += ` AND b.machine_id = '${req.query.value}' `
    } else if (req.query.value_type === 'type_id') {
        wh_str += ` AND b.type_id = '${req.query.value}' `
    }

    const sql = `SELECT a.emp_id AS emp_id,
							a.firstname AS firstname,
							a.lastname AS lastname
						FROM mi.dbo.vw_employeeGeneralInfo a, mi.dbo.timesheet_worker_mapping b
						WHERE a.emp_id = b.emp_id
							${wh_str}
							AND a.isActive = 1
							AND not exists (
								select emp_id from mi.dbo.supervisor_press s
								where s.emp_id = a.emp_id and s.type_id = b.type_id
							)
                        GROUP BY
                            a.emp_id,
                            a.firstname,
                            a.lastname 
						ORDER BY a.firstname ASC`
    return await connection.query(sql)
        .then(([data]) => {
            let message = data[0].length === 0 ? 'Workers is Empty!' : 'SUCCESS'
            return {
                success: true,
                message: message,
                data: data
            }

        })
        .catch((err) => {
            return {
                success: false,
                message: `QUERY ERROR: ${err}`
            }
        })
}

const getPlansModel = async (req, transaction) => {
    const today = new Date()
    const yesterday = moment().subtract(1, 'day').format("YYYY-MM-DD");
    const sqlHoliday = `SELECT COUNT ( * ) AS count_holiday FROM mi.dbo.holiday WHERE holiday = '${yesterday}'`
    let resultHoliday = await connection.query(sqlHoliday)

    let daysInThePast = 1;
    let daysInTheFuture = 2;
    if (resultHoliday[0].count_holiday > 0 || today.getDay() === 1) {
        daysInThePast++
    }
    let fromDay = moment().subtract(daysInThePast, 'day').format("YYYY-MM-DD");
    let untilDay = moment().add(daysInTheFuture, 'day').format("YYYY-MM-DD");

    const sql = `SELECT a.id AS plan_id,
                    a.plan_date,
                    a.jobid,
                    b.job_name ,
                    b.doctype AS doctype,
                    a.itid,
                    a.partname AS partname,
                    a.remark,
                    a.detail
                    ,a.shift_id
                    ,ISNULL(a.capacity_labor, 0) AS capacity_labor
                FROM mi.dbo.machine_planning a
                LEFT OUTER JOIN mi.dbo.mi b ON a.jobid = b.jobid
                WHERE  a.machine_id = '${req}'
                    AND  a.plan_date >= '${fromDay}'
                    AND a.plan_date <= '${untilDay}'
                ORDER BY plan_date ASC,
                    ISNULL(shift_id,0) ASC,
                    ISNULL(priority,0) ASC,
                    id ASC`
    return await connection.query(sql)
        .then(([data]) => {
            let message = data[0].length === 0 ? 'Plans is Empty!' : 'SUCCESS'
            return {
                success: true,
                message: message,
                data: data
            }

        })
        .catch((err) => {
            return {
                success: false,
                message: `QUERY ERROR: ${err}`
            }
        })
}

const getPaperStatusModel = async (req, transaction) => {
    const sql = `SELECT is_paper_trim_ready FROM mi.dbo.machine_planning WHERE id='${req}'`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                message: `กระดาษพร้อมพิมพ์`,
                icon: `success`
            }

        })
        .catch((err) => {
            return {
                success: false,
                message: `กระดาษไม่พร้อมพิมพ์`,
                icon: `warning`
            }
        })
}

const clearWorkerModel = async (req, transaction) => {
    const { plan_id, machine_id } = req
    const sql = `UPDATE mi.dbo.timesheet_header SET endType = 0 FROM mi.dbo.timesheet_header WHERE plan_id = '${plan_id}' AND machine_id =  '${machine_id}'`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                message: `success clear workers`,
            }

        })
        .catch((err) => {
            return {
                success: false,
                message: `unsuccess clear workers`,
            }
        })
}

const insertHeaderModel = async (req, transaction) => {
    const { type_id, partname, plan_id, machine_id, doc_date, shift_id, use_lpg, sig, subsig, worker } = req
    const sql = `DECLARE @header_id INT 
                EXEC mi.dbo.new_timesheet_header 
                @partname = '${partname}',
                @plan_id = ${plan_id}, 
                @machine_id = '${machine_id}',
                @docDate = '${doc_date}', 
                @shift_id = ${shift_id}, 
                @useLPG = ${use_lpg}, 
                @header_id = @header_id 
                OUTPUT SELECT 'result' = @header_id`
    return await connection.query(sql)
        .then(async ([data]) => {
            const header_id = data[0].result
            const sql_update = `update mi.dbo.timesheet_header set end_timesheet = 1, from_mi3 = 1 WHERE header_id = ${header_id}`
            await connection.query(sql_update)
            worker.forEach(async w => {
                // get emp_wage by worker_id
                const sql_emp_ot = `EXEC mi.dbo.timesheet_get_ot_per_min @doc_date = '${doc_date}', @emp_id = '${w.emp_id}'`
                const sql_emp_wage = `SELECT ISNULL( CAST ( ( emp_wage / 8 ) / 60 AS DECIMAL ( 10, 2 ) ), 0 ) AS emp_wage_per_min FROM HRM.dbo.hrm_employee WHERE emp_id = '${w.emp_id}'`
                let emp_ot_per_min = (await connection.query(sql_emp_ot))[0][0].emp_ot_per_min
                let emp_wage_per_min = (await connection.query(sql_emp_wage))[0][0].emp_wage_per_min
                // เพิ่ม timesheet worker
                const sql_worker = `INSERT INTO mi.dbo.timesheet_worker ( header_id, emp_id, emp_wage_per_min, emp_ot_per_min ) VALUES(${header_id}, ${w.emp_id}, ${emp_wage_per_min}, ${emp_ot_per_min})`
                await connection.query(sql_worker)
            });

            if (subsig) {
                subsig.forEach(async sub => {
                    // เพิ่ม header planning เพื่อเอาไปใช้กับขั้นตอนหลังจบ timesheet
                    const sql_header_planning = `INSERT INTO mi.dbo.timesheet_header_planning ( header_id, sig, subsig ) VALUES (${header_id}, '${sig}', '${sub}')`
                    await connection.query(sql_header_planning)
                });
            }


            return {
                success: true,
                data: header_id,
                message: `success`,
            }

        })
        .catch(async (err) => {

            return {
                success: false,
                message: `TIMESHEET HEADER NOT CREATED: ${err}`,
            }
        })
}

const insertChecklistModel = async (req, transaction) => {
    const { head, detail } = req
    try {
        const sql_insert_head = `INSERT INTO mi.dbo.checklist_timesheet_head (machine_id,shift_id,worker_id,worker_name,leader_id,leader_name,leader_position,from_mi3,plan_id)
        VALUES ('${head.machine_id}','${head.shift_id}','${head.worker_id}','${head.worker_name}','${head.leader_id}','${head.leader_name}','${head.leader_position}', 1,${head.plan_id})`
        await connection.query(sql_insert_head).then(async () => {
            const sql_head_id = `SELECT max(checklist_id) AS maxid FROM mi.dbo.checklist_timesheet_head`
            await connection.query(sql_head_id).then(async (value) => {
                let checklist_daily_id = value[0][0].maxid
                for (const item of detail) {
                    const sql_insert_detail = `INSERT INTO mi.dbo.checklist_timesheet_detail 
                    (checklist_id, checklist_type_id, checklist_remark, checklist_val) 
                    VALUES ('${checklist_daily_id}',
                    '${item.checklist_type_id}',
                    '${item.checklist_remark === "" ? "-" : item.checklist_remark}',
                    ${item.checklist_val})`
                    await connection.query(sql_insert_detail)
                }

            })
        })

        return {
            success: true,
            data: 'บันทึกสำเร็จ'
        }
    } catch (err) {
        // let obj = {
        //     error_text: err,
        //     header_id: 0,
        //     error_function: 'insertChecklistModel',
        //     type_id: head.type_id
        // }
        // insertErrorLog(obj)
        return {
            success: false,
            data: err
        }
    }
}

const insertChecklistQCModel = async (req, transaction) => {
    const { head, detail, type } = req
    try {
        if (type === 'pre') {
            const sql_get_code = `EXEC mi.dbo.timesheet_get_checklist_qc_id`
            let qc_code = (await connection.query(sql_get_code))[0][0].qc_code
            const sql_insert_head = `INSERT INTO mi.dbo.checklist_qc_timesheet_head (checklist_id, jobid, plan_id, machine_id, type_id, qty_paper_receive, qc_code)
            VALUES (${head.checklist_id}, '${head.jobid}', ${head.plan_id}, '${head.machine_id}', ${head.type_id}, ${head.qty_paper}, '${qc_code}')`
            await connection.query(sql_insert_head)
                .then(async () => {
                    for (let item of detail) {
                        const sql_insert_detail = `INSERT INTO mi.dbo.checklist_qc_timesheet_detail 
                        (qc_code, detail_id, detail_value, detail_remark) 
                        VALUES ('${qc_code}',
                        '${item.checklist_type_id}',
                        ${item.checklist_val},
                        '${item.checklist_remark === "" ? "-" : item.checklist_remark}')`

                        await connection.query(sql_insert_detail)
                    }
                })
        } else if (type === 'post') {
            const sql_update_head = `UPDATE mi.dbo.checklist_qc_timesheet_head SET worker_id = '${head.qc_emp_id}'`
            await connection.query(sql_update_head)
                .then(async () => {
                    for (let item of detail) {
                        const sql_insert_detail = `INSERT INTO mi.dbo.checklist_qc_timesheet_detail 
                        (qc_code, detail_id, detail_value, detail_remark) 
                        VALUES ('${head.qc_code}',
                        '${item.checklist_type_id}',
                        ${item.checklist_val},
                        '${item.checklist_remark === "" ? "-" : item.checklist_remark}')`

                        await connection.query(sql_insert_detail)
                    }
                })
        }

        return {
            success: true,
            req: req
        }
    } catch (err) {
        return {
            success: false,
            req: err
        }
    }
}

const addWorkerModel = async (req, transaction) => {
    const { emp_id, type_id, machine_id } = req

    const sql = `insert into mi.dbo.timesheet_worker_mapping ( emp_id, type_id, machine_id ) values ( ${emp_id}, ${type_id}, '${machine_id}' )`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                data: emp_id
            }
        })
        .catch(async (err) => {
            // let obj = {
            //     error_text: err,
            //     header_id: 0,
            //     error_function: 'addWorkerModel',
            //     type_id: type_id
            // }
            // await insertErrorLog(obj)
            return {
                success: false,
                data: err
            }
        })
}

const getEmployeeModel = async (req, transaction) => {
    const sql = `SELECT TOP 100
        emp_id,
        emp_firstname_th + ' ' + emp_lastname_th AS emp_name
    FROM
        HRM.dbo.hrm_employee 
    WHERE
        ( emp_id LIKE '%${req}%' 
        OR emp_firstname_th LIKE '${req}%' 
        OR emp_lastname_th LIKE '${req}%' ) 
        AND emp_status = 1`

    return await connection.query(sql)
        .then(([data]) => {
            return data
        })
}

const removeWorkerModel = async (req, transaction) => {
    const { emp_id, machine_id } = req
    const sql = `delete from mi.dbo.timesheet_worker_mapping  where emp_id = '${emp_id}' and machine_id = ${machine_id}`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
            }
        })
        .catch((err) => {
            return {
                success: false,
            }
        })
}
// ***************************Start timesheet item******************************

const checkHeaderIdModel = async (req, transaction) => {
    const check_header = `SELECT MAX(header_id) AS header_id FROM mi.dbo.timesheet_header WHERE header_id = '${req}'`
    let has_header = (await connection.query(check_header))[0][0]
    console.log(has_header);
    if (has_header.header_id === null) {
        return {
            success: false,
            data: 'ไม่มี header_id'
        }
    } else {
        return {
            success: true,
            data: 'เจอ header_id'
        }
    }
    // return req
}

const getHeaderModel = async (req, transaction) => {
    // ค้นหาข้อมูลของ header id
    const sql_timesheet_header = `SELECT
    a.header_id,
    a.docDate AS doc_date,
    a.machine_id,  
    b.machine_name,
    b.type_id,
    b.dep_id,
	e.dep_name,
    a.plan_id,
    c.plan_date,
    c.itid,
    c.jobid,
    d.job_name,
    c.remark,
    c.paper_type,
    a.partName AS partname,
    a.shift_id,
    a.useLPG AS use_lpg,
    a.end_timesheet
    FROM mi.dbo.timesheet_header a
    JOIN mi.dbo.timesheet_machine b ON a.machine_id = b.machine_id
    JOIN mi.dbo.machine_planning c ON a.plan_id = c.id
    LEFT JOIN mi.dbo.mi d ON c.jobid = d.jobid
	JOIN mi.dbo.timesheet_department e ON b.dep_id = e.dep_id
    WHERE a.header_id = '${req}'`
    //---------------------------------------------------------------------
    // ค้นหาข้อมูล item ของ header id
    const sql_timesheet_item = `SELECT
        a.id,
        b.group_id,
        CONCAT ( 'group-id-', b.group_id ) AS group_name,
        a.process_id AS process_code_id,
        CONCAT ( a.process_id, ' ', b.process_code_name ) AS process_code_name,
        a.startTime,
        a.endTime,
        a.qty,
        a.waste,
        CAST ( a.startTime AS DATE ) AS 'start_date',
                CONVERT ( VARCHAR(5), a.startTime, 108) AS 'show_time',
        CONVERT ( VARCHAR(8), a.startTime, 108) AS 'start_time',
        CONVERT ( VARCHAR, a.startTime, 127) AS 'full_start_time',
        CAST ( getdate() AS DATE ) AS 'current_date',
        CONVERT ( VARCHAR, getdate(), 127) AS 'full_current_time',
                ISNULL(b.force_remark,0) AS force_remark,
                ISNULL(b.is_breakdown,0) AS is_breakdown,
                ISNULL(b.insert_qty,0) AS insert_qty
    FROM
        mi.dbo.timesheet_item a 
        JOIN mi.dbo.timesheet_process b ON a.process_id = b.process_code_id 
    WHERE
        a.header_id = '${req}'
    ORDER BY
        a.id`
    //---------------------------------------------------------------------
    // ค้นหาข้อมูลของ worker ของ header id 
    const sql_timesheet_worker = `SELECT 
    a.id,
    a.emp_id,
    b.firstname,
    b.lastname
    FROM mi.dbo.timesheet_worker a 
    JOIN mi.dbo.vw_employeeGeneralInfo b ON a.emp_id = b.emp_id
    WHERE a.header_id = '${req}'`
    //---------------------------------------------------------------------
    // ค้นหาข้อมูลของ วางแผนผลิต ยก/รอบ ของ header id
    const sql_timesheet_header_planning = `SELECT
    header_planning_id AS id, 
    sig,
    subSig AS subsig,
    CONCAT(sig, '/', subSig) AS sum_sig
    FROM mi.dbo.timesheet_header_planning
    WHERE header_id = '${req}'`
    //---------------------------------------------------------------------
    const timesheet_header = (await connection.query(sql_timesheet_header))[0][0]
    const timesheet_item = (await connection.query(sql_timesheet_item))[0]
    const timesheet_worker = (await connection.query(sql_timesheet_worker))[0]
    const timesheet_header_planning = (await connection.query(sql_timesheet_header_planning))[0]

    // ค้นหาข้อมูลของ จำนวน qty ใน timesheet ทั้งหมดของแผน
    const sql_sumtotal_qty_timesheet = `SELECT
    ISNULL(SUM(ISNULL(timesheet_item.qty,0)), 0) AS sumtotal_qty_timesheet
    FROM mi.dbo.timesheet_item
    INNER JOIN mi.dbo.timesheet_header ON timesheet_item.header_id=timesheet_header.header_id
    WHERE timesheet_item.header_id IN (SELECT header_id FROM mi.dbo.timesheet_header WHERE plan_id = '${timesheet_header.plan_id}' AND header_id != '${req}')`
    //---------------------------------------------------------------------
    // ค้นหาข้อมูลของ จำนวน qty ทั้งหมดของแผน
    const sql_sumtotal_qty_plans = `SELECT
    ISNULL((waste * sig) / sig_num, 0) AS sumtotal_qty_plans
    FROM mi.dbo.machine_planning
    WHERE id='${timesheet_header.plan_id}'`
    //---------------------------------------------------------------------
    const sumtotal_qty_timesheet = (await connection.query(sql_sumtotal_qty_timesheet))[0][0].sumtotal_qty_timesheet
    const sumtotal_qty_plans = (await connection.query(sql_sumtotal_qty_plans))[0][0].sumtotal_qty_plans
    const obj_sumtotal = {
        sumtotal_qty_timesheet: sumtotal_qty_timesheet,
        sumtotal_qty_plans: sumtotal_qty_plans
    }
    // ค้นหาข้อมูลพนักงานขอ ot ของวันนี้ กะนี้
    const sql_request_ot = `SELECT 
    emp_id,
    emp_name,
    machine_id,
    shift_id,
    MAX(request_type1) AS request_type1,
    MAX(request_type2) AS request_type2
    FROM (
            SELECT
            timesheet_ot_request_detail.id,
            timesheet_ot_request_detail.emp_id,
            hrm_employee.emp_firstname_th+' '+hrm_employee.emp_lastname_th AS emp_name,
            timesheet_ot_request.machine_id,
            timesheet_ot_request.shift_id,
            (SELECT tor.request_type FROM mi.dbo.timesheet_ot_request AS tor WHERE tor.request_id=timesheet_ot_request.request_id AND tor.request_type='1') AS request_type1,
            (SELECT tor.request_type FROM mi.dbo.timesheet_ot_request AS tor WHERE tor.request_id=timesheet_ot_request.request_id AND tor.request_type='2') AS request_type2
            FROM mi.dbo.timesheet_ot_request
            JOIN mi.dbo.timesheet_ot_request_detail ON timesheet_ot_request.request_id = timesheet_ot_request_detail.request_id
            LEFT JOIN HRM.dbo.hrm_employee AS hrm_employee ON CONVERT(NVARCHAR(7), timesheet_ot_request_detail.emp_id)=hrm_employee.emp_id
            WHERE timesheet_ot_request.request_date ='${timesheet_header.doc_date}'
                and timesheet_ot_request.shift_id ='${timesheet_header.shift_id}'
                AND timesheet_ot_request.machine_id ='${timesheet_header.machine_id}'
            ) AS tbl1
    GROUP BY emp_id, emp_name, machine_id,shift_id
    ORDER BY 1 DESC`
    //---------------------------------------------------------------------
    const table_request_ot = (await connection.query(sql_request_ot))[0]

    const sql_process_right_side = `SELECT
        a.process_code_id 
        ,b.process_code_name
        ,b.piority
        ,b.[function]
    FROM
        mi.dbo.timesheet_process_right_side a
        JOIN mi.dbo.timesheet_process b ON a.process_code_id = b.process_code_id
    WHERE
        a.type_id = '${timesheet_header.type_id}'
    ORDER BY
        b.piority,
        b.id`

    const sql_process_left_side = `SELECT
        a.process_code_id 
        ,b.process_code_name
        ,b.group_id
        ,ISNULL(a.step,0) AS step 
        ,ISNULL(b.force_remark, 0) AS force_remark 
        ,ISNULL(is_breakdown,0) AS is_breakdown 
        ,ISNULL(insert_qty,0) AS insert_qty 
        ,c.group_abbreviation
    FROM
        mi.dbo.timesheet_process_left_side a
        JOIN mi.dbo.timesheet_process b ON a.process_code_id = b.process_code_id
        JOIN mi.dbo.timesheet_process_group c ON b.group_id = c.group_id
    WHERE
	    a.type_id = '${timesheet_header.type_id}'`
    const process_right_side = (await connection.query(sql_process_right_side))[0]
    const process_left_side = (await connection.query(sql_process_left_side))[0]
    //---------------------------------------------------------------------
    const sql_problem = `SELECT
        0 AS problem_id,
        'ไม่ระบุ' AS problem_name,
        NULL AS machine_id,
        NULL AS costcenter_code UNION ALL
    SELECT
        * 
    FROM
        MAINTENANCE_MACHINE.dbo.problem_type 
    WHERE
        machine_id = '${timesheet_header.machine_id}'`
    const problem = (await connection.query(sql_problem))[0]
    const sql_option = `SELECT* FROM mi.dbo.checklist_type_process WHERE type_process_id = 'head' AND machine_type_id = '${timesheet_header.type_id}'`
    const option = (await connection.query(sql_option))[0]
    //---------------------------------------------------------------------
    const data = {
        header: timesheet_header,
        item: timesheet_item,
        worker: timesheet_worker,
        header_planning: timesheet_header_planning,
        sumtotal_qty: obj_sumtotal,
        table_request_ot: table_request_ot,
        process_right_side: process_right_side,
        process_left_side: process_left_side,
        problem: problem,
        checklist: option
    }

    return {
        success: true,
        data: data
    }
}

const getTotalRunningModel = async (req, transaction) => {
    const sql = `SELECT SUM(qty) AS total_running FROM mi.dbo.timesheet_item WHERE header_id = '${req}'`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data
            }
        })
        .catch((err) => {
            return {
                success: false,
                data: err
            }
        })
}

const insertTimesheetItemModel = async (req, transaction) => {
    const { header_id, process_id, datetime } = req
    const sql = `exec mi.dbo.timesheet_insert_item @header_id = ${header_id}, @process_id = '${process_id}', @current_datetime = '${datetime}'`
    return await connection.query(sql)
        .then(([data]) => {
            return data
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const updateQuantityModel = async (req, transaction) => {
    const { id, qty, waste } = req

    const sql = `UPDATE mi.dbo.timesheet_item SET qty = ${qty}, waste = ${waste} WHERE id = ${id}`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                message: `update ${id} qty to ${qty} and waste to ${waste}`
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const getRepairItemModel = async (req, transaction) => {
    const sql = `SELECT ma_request.*,
                v_hrm_employee.fullname,
                convert(varchar, ma_request.need_datetime, 120) AS show_datetime
                FROM MAINTENANCE_MACHINE.dbo.ma_request
                INNER JOIN MAINTENANCE_MACHINE.dbo.v_hrm_employee ON ma_request.emp_id=v_hrm_employee.emp_id
                WHERE 1=1
                AND machine_id='${req}'
                AND ma_status !='2'
                AND acknowledge !='1'
                ORDER BY need_datetime DESC`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data
            }
        })
        .catch((err) => {
            return {
                success: false,
                data: err
            }
        })
}

const insertRepairRequestModel = async (req, transaction) => {
    let { branch_id, emp_id, call_number, need_date, machine_id, machine_status_id, process_status_id, problem_id, ma_type_id, ma_remark, ma_location } = req
    const sql_dep_id = `SELECT department_id FROM HRM.dbo.hrm_employee WHERE emp_id='${emp_id}' `
    // const sql_ma_id = `SELECT ISNULL( MAX ( SUBSTRING ( ma_id, 7, 4 ) ), 0 ) AS ma_id FROM	MAINTENANCE_MACHINE.dbo.ma_request WHERE SUBSTRING ( ma_id, 3, 4 ) = CONVERT ( VARCHAR(4), getdate( ), 12 )`
    const sql_last_ma = ` SELECT
                            ISNULL( MAX ( SUBSTRING ( ma_id, 7, 3 ) ), 0 ) AS ma_id, 
                            CONVERT(INT, (ISNULL( MAX ( SUBSTRING ( ma_id, 7, 4 ) ), 0 ))) + 1 AS ma_new
                        FROM
                            MAINTENANCE_MACHINE.dbo.ma_request 
                        WHERE
                            SUBSTRING ( ma_id, 3, 4 ) = CONVERT ( VARCHAR ( 4 ), getdate( ), 12 )`
    const sql_costcode = `SELECT department_id,costCenter As costcenter FROM mi.dbo.machine WHERE machine_id = '${machine_id}'`
    const sql_date_convert = `SELECT CONVERT ( VARCHAR(4), getdate( ), 12 ) AS ym`

    const dep_id = await connection.query(sql_dep_id)
    console.log(dep_id);
    const last_ma = await connection.query(sql_last_ma)
    const new_ma = last_ma[0][0].ma_new.toString().padStart(4, '0')
    const costcode = await connection.query(sql_costcode)
    const res_ym = await connection.query(sql_date_convert)
    let ma_id = `MR${res_ym[0][0].ym}${new_ma}`

    const approve_status = 0
    const pm_status = 0
    const ma_status = 0

    const sql = `   INSERT INTO MAINTENANCE_MACHINE.dbo.ma_request ( ma_id, branch_id, dep_id, emp_id, call_number, notify_datetime, 
                    need_datetime, machine_id, machine_status_id, ma_remark, ma_location, ma_type_id, ma_status, approve_status, 
                    pm_status, problem_id, process_machine_status, costcenter_code) 
                    VALUES('${ma_id}', ${branch_id}, '${dep_id[0][0].department_id}', '${emp_id}', '${call_number}', getdate(), '${need_date}', '${machine_id}'
                    ,${machine_status_id} ,'${ma_remark}', '${ma_location}', ${ma_type_id}, ${ma_status}, ${approve_status}, ${pm_status},
                     ${problem_id}, ${process_status_id}, '${costcode[0][0].costcenter}')`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                message: 'insert ma_request success'
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const updateRepairRequestAgainModel = async (req, transaction) => {
    const sql = `SELECT (MAX(ISNULL(ma_time_number,0))+1) AS ma_time_number FROM MAINTENANCE_MACHINE.dbo.ma_request WHERE ma_id='${req}'`
    const ma_time_number = (await connection.query(sql))[0][0].ma_time_number
    const sql_update = `UPDATE MAINTENANCE_MACHINE.dbo.ma_request 
    SET print_status = 0,confirm_status = 0,ma_time_number = ${ma_time_number},ma_request_date = getdate()
    WHERE ma_id = '${req}'`
    return await connection.query(sql_update)
        .then(() => {
            return {
                success: true,
            }
        })
        .catch((err) => {
            return {
                success: false,
            }
        })

}

const insertChecklistWarningModel = async (req, transaction) => {
    const { checklist_type_id, machine_id, cause_problem, solution, emp_id, jobid, shift_id, plan_id, header_id } = req
    const sql = `INSERT INTO mi.dbo.checklist_warning (checklist_type_id,machine_id,cause_problem,solution,emp_id,job_id,shift_id,plan_id,header_id)
    VALUES  ('${checklist_type_id}','${machine_id}','${cause_problem}','${solution}','${emp_id}','${jobid}','${shift_id}','${plan_id}','${header_id}')`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                message: 'insert checklist_warning success'
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const insertChecklistWarningWithMaRequestModel = async (req, transaction) => {
    const { checklist_type_id, machine_id, cause_problem, emp_id, jobid, shift_id, plan_id, header_id } = req
    const sql_ma = "SELECT max(ma_id) AS maID FROM MAINTENANCE_MACHINE.dbo.ma_request";
    const ma_id = (await connection.query(sql_ma))[0][0].maID
    const sql = `INSERT INTO mi.dbo.checklist_warning (checklist_type_id,machine_id,cause_problem, emp_id, job_id, shift_id, ma_id, plan_id, header_id)
    VALUES  ('${checklist_type_id}','${machine_id}','${cause_problem}','${emp_id}','${jobid}','${shift_id}','${ma_id}','${plan_id}','${header_id}')`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                message: 'insert checklist_warning success'
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const updateTimesheetItemModel = async (ip, req, transaction) => {
    const { type, id, problem, printed, waiting, machine, department, remark, solution, emp_id } = req
    if (ip.substr(0, 7) == '::ffff:') { // fix for if you have both ipv4 and ipv6
        ip = ip.substr(7);
    }
    let sql = ``
    switch (type) {
        case '1':
            sql = ` UPDATE mi.dbo.timesheet_item 
                    SET remark = '${remark}',
                        solution = '${solution}', 
                        lastEditTime = getdate(),
                        lastEditEmp_id = ${emp_id},
                        lastEditIP = '${ip}'
                    WHERE id = '${id}'`
            break
        case '2':
            sql = ` UPDATE mi.dbo.timesheet_item 
                    SET problem = '${problem}',
                        remark = '${remark}',
                        solution = '${solution}', 
                        lastEditTime = getdate(),
                        lastEditEmp_id = ${emp_id},
                        lastEditIP = '${ip}'
                    WHERE id = '${id}'`
            break
        case '3':
            sql = ` UPDATE mi.dbo.timesheet_item 
                    SET remark = '${remark}', 
                        lastEditTime = getdate(),
                        lastEditEmp_id = ${emp_id},
                        lastEditIP = '${ip}'
                    WHERE id = '${id}'`
            break
        case '4':
            sql = ` UPDATE mi.dbo.timesheet_item 
                    SET printed = '${printed}', 
                        lastEditTime = getdate(),
                        lastEditEmp_id = ${emp_id},
                        lastEditIP = '${ip}'
                    WHERE id = '${id}'`
            break
        case '5':
            sql = ` UPDATE mi.dbo.timesheet_item 
                    SET waiting = '${waiting}', 
                        remark = '${remark}',
                        lastEditTime = getdate(),
                        lastEditEmp_id = ${emp_id},
                        lastEditIP = '${ip}'
                    WHERE id = '${id}'`
            break
        case '6':
            sql = ` UPDATE mi.dbo.timesheet_item 
                    SET helped_machine_id = '${machine}', 
                        helped_department_id = '${department}',
                        lastEditTime = getdate(),
                        lastEditEmp_id = ${emp_id},
                        lastEditIP = '${ip}'
                    WHERE id = '${id}'`
            break
    }

    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                message: 'บันทึกสำเร็จ'
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: 'บันทึกไม่สำเร็จ' + err
            }
        })
}

const getDepartmentModel = async (req, transaction) => {
    const sql = `SELECT	type_id,	type_name FROM	mi.dbo.machine_type WHERE	type_name LIKE '${req}%'`
    return await connection.query(sql)
        .then(([data]) => {
            return data

        })
}

const getMachineByDepartmentModel = async (req, transaction) => {
    const sql = `SELECT
        a.machine_id,
        a.machine_name,
        b.type_id,
        b.type_name 
    FROM
        mi.dbo.timesheet_machine a
        JOIN mi.dbo.machine_type b ON a.type_id = b.type_id 
    WHERE
        ( machine_name LIKE '%${req.text_mac}%' OR machine_id LIKE '%${req.text_mac}%' ) 
        AND b.type_name LIKE '${req.text_dep}%'`
    return await connection.query(sql)
        .then(([data]) => {
            return data
        })
}
// ***************************Start OK limit color******************************

const getOkLimitColorDetailModel = async (req, transaction) => {
    const sql_detail = `SELECT
            A.header_id,
            A.plan_id,
            A.machine_id,
            B.machine_name,
            C.jobid,
            D.job_name,
            D.emp_id,
            E.emp_firstname_th+' '+E.emp_lastname_th AS emp_name

        FROM
            mi.dbo.timesheet_header A
            LEFT JOIN mi.dbo.machine B ON A.machine_id = B.machine_id
            LEFT JOIN mi.dbo.machine_planning C ON A.plan_id = C.id
            LEFT JOIN mi.dbo.mi D ON C.jobid = D.jobid
            LEFT JOIN HRM.dbo.hrm_employee E ON CONVERT(VARCHAR, D.emp_id) = E.emp_id
        WHERE
            A.header_id = '${req}'`
    const detail = (await connection.query(sql_detail))[0][0]
    const sql_part = `SELECT
            itid,
            partName 
        FROM
            mi.dbo.mi_item 
        WHERE
            jobid = '${detail.jobid}'`
    const part = (await connection.query(sql_part))[0]

    return {
        header_id: req,
        detail: detail,
        part: part
    }
}

const insertOkLimitColorModel = async (ip, req, transaction) => {
    if (ip.substr(0, 7) == '::ffff:') { // fix for if you have both ipv4 and ipv6
        ip = ip.substr(7);
    }
    const {
        type_id,
        header_id,
        machine_id,
        machine_name,
        plan_id,
        jobid,
        job_name,
        part_id,
        part_name,
        leader_id,
        leader_name,
        emp_id,
        emp_name,
        remark,
        k_light,
        c_light,
        m_light,
        y_light,
        sp1_light,
        sp2_light,
        sp3_light,
        sp4_light,
        k_standard,
        c_standard,
        m_standard,
        y_standard,
        sp1_standard,
        sp2_standard,
        sp3_standard,
        sp4_standard,
        k_dark,
        c_dark,
        m_dark,
        y_dark,
        sp1_dark,
        sp2_dark,
        sp3_dark,
        sp4_dark,

    } = req

    // job_name = job_name.replace(/'/g, "'")

    const sql_chk = `SELECT count(header_id) as header_count from mi.dbo.timesheet_ok_limit_color where header_id = '${header_id}'`
    const result = (await connection.query(sql_chk))[0][0]
    // console.log(result);
    if (result.header_count > 0) {
        const sql_del = `DELETE FROM mi.dbo.timesheet_ok_limit_color WHERE header_id = '${header_id}'`
        await connection.query(sql_del)
    }
    const sql_ok_id = `SELECT 
                CONVERT(INT, (ISNULL( MAX ( SUBSTRING (ok_limit_color_no, 7, 4 ) ), 0 )) + 1 ) AS ok_no
            FROM
                mi.dbo.timesheet_ok_limit_color 
            WHERE
                SUBSTRING ( ok_limit_color_no, 3, 4 ) = CONVERT ( VARCHAR ( 4 ), getdate( ), 12 )`
    // let ok_id = (await connection.query(sql_ok_id))[0].ok_no
    // const new_ok_id = ok_id.toString().padStart(4, '0')
    const last_ok_id = await connection.query(sql_ok_id)
    const new_ok_id = last_ok_id[0][0].ok_no.toString().padStart(4, '0')
    const sql_date_convert = `SELECT CONVERT ( VARCHAR(4), getdate( ), 12 ) AS ym`
    const res_ym = await connection.query(sql_date_convert)
    const ok_limit_color_no = `OK${res_ym[0][0].ym}${new_ok_id}`
    const sql = `INSERT INTO mi.dbo.timesheet_ok_limit_color(
				ok_limit_color_no,machine_id,machine_name,job_id,job_name,part_name,operator_emp_id,operator_name,manager_emp_id,manager_name,
				other,k_light,k_standard,k_dark,c_light,c_standard,c_dark,m_light,m_standard,m_dark,y_light,y_standard,y_dark,sp_color1_light,sp_color1_standard,sp_color1_dark,
				sp_color2_light,sp_color2_standard,sp_color2_dark,sp_color3_light,sp_color3_standard,sp_color3_dark,sp_color4_light,sp_color4_standard,sp_color4_dark,status,
				ipaddress,plan_id,header_id
			)VALUES(
			    '${ok_limit_color_no}','${machine_id}','${machine_name}','${jobid}','${job_name}','${part_name}',
                '${emp_id}','${emp_name}','${leader_id}','${leader_name}','${remark}','${k_light}','${k_standard}','${k_dark}',
                '${c_light}','${c_standard}','${c_dark}',
                '${m_light}','${m_standard}','${m_dark}',
                '${y_light}','${y_standard}','${y_dark}',
				'${sp1_light}','${sp1_standard}','${sp1_dark}',
                '${sp2_light}','${sp2_standard}','${sp2_dark}',
                '${sp3_light}','${sp3_standard}','${sp3_dark}',
				'${sp4_light}','${sp4_standard}','${sp4_dark}',1,'${ip}','${plan_id}',${header_id}
			)`
    return await connection.query(sql)
        .then(() => {
            return {
                success: true,
                message: 'บันทึกสำเร็จ'
            }
        })
        .catch(async (err) => {
            // let error_obj = {
            //     error_text: err,
            //     header_id: header_id,
            //     error_function: 'insertOkLimitColorModel',
            //     type_id: type_id
            // }
            // await insertErrorLog(error_obj)
            return {
                success: false,
                message: 'บันทึกไม่สำเร็จ' + err
            }
        })
}

// ***************************Start Checklist******************************

const checkFirstShiftModel = async (req, transaction) => {
    const { doc_date, shift_id, machine_id } = req
    var result = {
        total: 0
    }
    try {
        const sql = `EXEC mi.dbo.checkCheckListDaily @date='${doc_date}',@shift_id ='${shift_id}',@machine_id ='${machine_id}'`
        const result_shift = (await connection.query(sql))[0][0].total
        if (result_shift > 0) {
            result.total = result_shift
        }
        result.success = true;

        return result
    } catch (err) {
        result.success = false;
        return result
    }
}

const getChecklistModel = async (machine_id, transaction) => {
    let result = {}
    let data_array = []
    let group_id_array = []
    const sql_doc_name = `SELECT
                                b.checklist_id,
                                b.doc_name,
                                a.machine_id 
                            FROM
                                mi.dbo.checklist_machine_detail a
                                LEFT JOIN mi.dbo.checklist_doc b ON a.checklist_id = b.checklist_id
                            WHERE
                                machine_id = '${machine_id}'`
    await connection.query(sql_doc_name)
        .then(([data]) => {
            result.doc = data[0]
        })

    const sql_group = `SELECT
            c.checklist_group_id,
            d.checklist_group_name, 
            b.doc_name
        FROM
            mi.dbo.checklist_machine_detail a
            JOIN mi.dbo.checklist_doc b ON a.checklist_id = b.checklist_id
            LEFT JOIN mi.dbo.checklist_group_detail c ON a.checklist_id = c.checklist_id
            JOIN mi.dbo.checklist_group d ON c.checklist_group_id = d.checklist_group_id 
        WHERE
            a.machine_id = '${machine_id}' 
        GROUP BY
            a.checklist_id,
            c.checklist_group_id,
            d.checklist_group_name,
            b.doc_name`

    const result_group = (await connection.query(sql_group))[0]
    for (const item of result_group) {
        group_id_array.push(item.checklist_group_id)
        data_array.push(await getChecklistTypeProcess(machine_id, item.doc_name, item.checklist_group_id, item.checklist_group_name))
    }

    result.group_id_array = group_id_array
    result.data = data_array
    return result
}

const getChecklistTypeProcess = async (machine_id, doc_name, group_id, group_name) => {
    const sql = `SELECT
            a.checklist_id,
            c.checklist_detail_id,
            d.detail_name,
            d.checklist_group_id
        FROM
            mi.dbo.checklist_machine_detail  a
            JOIN mi.dbo.checklist_doc b ON a.checklist_id = b.checklist_id
            LEFT JOIN mi.dbo.checklist_group_detail c ON a.checklist_id = c.checklist_id
            LEFT JOIN mi.dbo.checklist_detail d ON c.checklist_detail_id = d.detail_id
        WHERE
            a.machine_id = '${machine_id}' AND d.checklist_group_id = '${group_id}' 
        ORDER BY
            c.checklist_group_id,
            checklist_id,
            c.checklist_detail_id`
    const result = (await connection.query(sql))[0]

    let obj = {
        machine_id: machine_id,
        doc_name: doc_name,
        group_id: group_id,
        group_name: group_name,
        type_unit: result,
    }

    return obj
}

const getProblemModel = async (req, transaction) => {
    const sql_problem = `SELECT
        0 AS problem_id,
        'ไม่ระบุ' AS problem_name,
        NULL AS machine_id,
        NULL AS costcenter_code UNION ALL
    SELECT
        * 
    FROM
        MAINTENANCE_MACHINE.dbo.problem_type 
    WHERE
        machine_id = '${req}'`
    const problem = (await connection.query(sql_problem))[0]
    return {
        success: true,
        data: problem
    }
}

const getChecklistLongModel = async (req, transaction) => {
    const sql = `SELECT
        a.checklist_id,
        c.checklist_detail_id,
        d.detail_name,
        d.checklist_group_id
    FROM
        mi.dbo.checklist_machine_detail  a
        JOIN mi.dbo.checklist_doc b ON a.checklist_id = b.checklist_id
        LEFT JOIN mi.dbo.checklist_group_detail c ON a.checklist_id = c.checklist_id
        LEFT JOIN mi.dbo.checklist_detail d ON c.checklist_detail_id = d.detail_id
    WHERE
        a.machine_id = '${req}'
    ORDER BY
        c.checklist_group_id,
        checklist_id,
        c.checklist_detail_id`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data,
            }

        })
        .catch((err) => {
            return {
                success: false,
                data: err,
            }
        })
}

// ***************************Delete Timesheet******************************

const deleteTimesheetModel = async (req, transaction) => {
    const sql = `EXEC mi.dbo.timesheet_delete_whole @header_id = '${req}'`
    return await connection.query(sql)
        .then(async () => {
            return {
                success: true,
                message: 'ลบ Timesheet แล้ว',
            }

        })
        .catch(async (err) => {
            // let error_obj = {
            //     error_text: err,
            //     header_id: req,
            //     error_function: 'insertOkLimitColorModel',
            //     type_id: 0
            // }
            // await insertErrorLog(error_obj)
            return {
                success: false,
                data: `ไม่สามารถลบ Timesheet ได้ ERROR:${err}`,
            }
        })
}

const getDetailSupCheckColorModel = async (req, transaction) => {
    // console.log(req)
    const { plan_id, machine_id, header_id } = req

    var detail_sup_color = {};
    let partName = [];
    var topicType = "";
    var topicItem = []
    let topic_item = ""
    const sql_topic_type = "SELECT type_id,type_name FROM mi.dbo.checklist_type_process WHERE machine_type_id=35 AND type_process_id='S6' AND active=1 GROUP BY type_id,type_name"
    topicType = await connection.query(sql_topic_type)
    for (var item of topicType[0]) {
        const sql_topic = `SELECT checklist_type_id,topic,topic_name FROM mi.dbo.checklist_type_process WHERE machine_type_id=35 AND type_process_id='S6' AND type_id= '${item.type_id}' AND active=1`;
        topic_item = await connection.query(sql_topic)
            .then((data) => {
                return data[0];
            })
        // console.log(topic_item)
        item.unit = topic_item
    }
    topicItem.push(topicType[0])
    // console.log(topicItem)
    const sqlLot = "SELECT * FROM mi.dbo.lot_color"
    let lotColor = await connection.query(sqlLot)
        .then((data) => {
            return data[0];
        })
    const sql = `SELECT
                                A.header_id,
                                A.plan_id,
                                A.partName,
                                A.machine_id,
                                A.shift_id,
                                B.jobid,
                                C.qty1,
                                C.job_name,
                                D.machine_name,
                                CONVERT(VARCHAR(MAX),CURRENT_TIMESTAMP,103) AS present_date
                            FROM mi.dbo.timesheet_header A
                            LEFT JOIN mi.dbo.machine_planning B ON B.id = A.plan_id
                            LEFT JOIN mi.dbo.mi C ON B.jobid = C.jobid
                            LEFT JOIN mi.dbo.machine D ON D.machine_id = A.machine_id
                            WHERE A.header_id = '${header_id}'`
    let rs_sql = await connection.query(sql).then((data) => { return data[0] })
    // console.log(rs_sql[0].jobid)
    // console.log(item_timesheet)
    const sql_p = `SELECT itid, partName FROM mi.dbo.mi_item WHERE jobid = '${rs_sql[0].jobid}'`
    let rs_sql_p = await connection.query(sql_p).then((data) => { return data[0] })
    // console.log(rs_sql_p)
    var array_typepaper = []
    for (var item_parts of rs_sql_p) {
        // console.log(item_parts)
        const sql_typepaper = `SELECT
                                        jobid,
                                        itid,
                                        partName,
                                        paperCategoryID,
                                        paperTypeName
                                    FROM mi.dbo.mi_item LEFT JOIN mi.dbo.vw_paperCategory ON mi_item.paperTypeID = vw_paperCategory.paperTypeID collate Thai_CI_AS
                                    WHERE
                                        jobid = '${rs_sql[0].jobid}'
                                            AND itid = ${item_parts.itid}
                                    GROUP BY
                                        jobid,
                                        itid,
                                        partName,
                                        paperCategoryID,
                                        paperTypeName`
        var rs_sql_typepaper = await connection.query(sql_typepaper).then((data) => { return data[0] })
        // console.log(rs_sql_typepaper)
        const sql_papername = `SELECT TOP 1
                                    paperTypeID,
                                    paperTypeName
                                FROM mi.dbo.vw_paperCategory 
                                WHERE vw_paperCategory.paperTypeID = '${rs_sql_typepaper[0].paperCategoryID}'`
        let rs_sql_papername = await connection.query(sql_papername).then((data) => { return data[0] })
        // console.log(rs_sql_papername)
        rs_sql_typepaper[0].paperTypeName = rs_sql_papername[0].paperTypeName
        array_typepaper.push(rs_sql_typepaper[0])
    }
    // console.log(array_typepaper) /* partname */
    /*set  */
    rs_sql[0].partName = array_typepaper
    rs_sql[0].lotColor = lotColor

    // console.log(rs_sql)
    // const sqlChk = `SELECT TOP 1 B.* 
    //                     FROM mi.dbo.timesheet_header A
    //                     RIGHT JOIN mi.dbo.checklist_timesheet_sub B ON B.header_id = A.header_id
    //                     WHERE CONVERT(VARCHAR(MAX),B.created,103)='${moment(new Date()).format('DD/MM/YYYY')}'
    //                     AND A.header_id = '${rs_sql[0].header_id}'
    //                     AND B.machine_id = '${rs_sql[0].machine_id}'
    //                     ORDER BY B.checklist_id DESC`
    const sqlChk = `SELECT TOP 1 B.* 
                        FROM mi.dbo.timesheet_header A
                        RIGHT JOIN mi.dbo.checklist_timesheet_sub B ON B.header_id = A.header_id
                        WHERE CONVERT(VARCHAR(MAX),B.created,103)='${moment(new Date()).format('DD/MM/YYYY')}'
                        AND B.job_id = '${rs_sql[0].jobid}'
                        AND B.machine_id = '${rs_sql[0].machine_id}'
                        ORDER BY B.checklist_id DESC`
    // console.log(sqlChk);
    let result_chk = await connection.query(sqlChk)
        .then((data) => {
            return data[0];
        })
    if (result_chk.length) {
        for (var item_t of result_chk) {
            // console.log(item_t);
            var sql_sub_detail = `SELECT * FROM mi.dbo.checklist_sub_detail 
                            WHERE checklist_id = '${item_t.checklist_id}'
                            AND (
                                paper_type IS NOT NULL 
                            OR thick_paper IS NOT NULL 
                            OR pantone IS NOT NULL 
                            OR packing IS NOT NULL 
                            OR mole IS NOT NULL
                            OR checklist_type_id >= 25
                            ) --AND checklist_type_id NOT IN(48,49)
                            ORDER BY checklist_detail_id ASC`
            let result__sup_detail = await connection.query(sql_sub_detail).then((data) => { return data[0] })
            // console.log(data)
            var pantone = []
            var packing = []
            var mole = []
            var topic_check = []
            var papertype_sup_detail = ""
            var thick_paper = ""
            // console.log(result__sup_detail);
            for (var item_detail of result__sup_detail) {
                // console.log(item_detail);
                if (item_detail.pantone !== null && item_detail.packing !== null && item_detail.mole !== null) {
                    pantone.push(item_detail.pantone)
                    packing.push(item_detail.packing)
                    mole.push(item_detail.mole)

                }
                if (item_detail.paper_type) {
                    // console.log(item_detail.paper_type)
                    papertype_sup_detail = item_detail.paper_type
                }

                if (item_detail.thick_paper) {
                    // console.log(item_detail.thick_paper)
                    thick_paper = item_detail.thick_paper
                }
                if (item_detail.checklist_type_id >= 25) {
                    topic_check.push(item_detail.checklist_type_id)
                }

            }
            // console.log(papertype_sup_detail)
            item_t.papertype = papertype_sup_detail
            item_t.thickpaper = thick_paper
            item_t.pantone = pantone
            item_t.packing = packing
            item_t.mole = mole
            item_t.topic_check = topic_check
        }
        //  console.log(result_chk)
    }

    detail_sup_color = {
        detail: rs_sql[0],
        sub_detail: result_chk,
        topic: topicItem

    }
    return detail_sup_color
}

const updateEndtimeItemModel = async (req, transaction) => {
    let { item_id, header_id, end_type, remark, endtime } = req
    if (end_type === null || end_type === '') {
        end_type = 0
    }

    if (item_id !== undefined && item_id !== 0) {
        const sql = `exec mi.dbo.timesheet_update_item_endtime @currentRecordId = ${item_id}, @header_id = ${header_id}, @endtype = ${end_type}, @remark = '${remark}', @currenttime = '${endtime}'`
        await connection.query(sql)
    }

    const sql_update = `update mi.dbo.timesheet_header set end_timesheet = 0 WHERE header_id = ${header_id}`
    return await connection.query(sql_update)
        .then(async () => {
            // const sql_update_wage = `exec mi.dbo.timesheet_update_cal_wage @header_id = ${header_id}`
            // await connection.query(sql_update_wage)
            return {
                success: true,
                message: 'update endtime success'
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const insertInkUsageModel = async (req, transaction) => {
    const { sig1, sig2, coating } = req
    let status_insert_sig1 = false
    let status_insert_sig2 = false
    let status_insert_coating = true
    let data = {}

    sig1.ink_usage.forEach(async function (item, index) {
        status_insert_sig1 = true
        let sql_sig1 = `  INSERT INTO mi.dbo.timesheet_header_material ( header_id, material_id, header_planning_id, remark )
                        VALUES ( ${sig1.header}, '${item}', '${sig1.header_planning_id}', 'printing' )`
        await connection.query(sql_sig1)
    })

    if (sig2 != '' && sig2 != null && sig2 != undefined) {
        status_insert_sig2 = true
        sig2.ink_usage.forEach(async function (item2, index2) {
            let sql_sig2 = `  INSERT INTO mi.dbo.timesheet_header_material ( header_id, material_id, header_planning_id, remark )
                            VALUES ( ${sig2.header}, '${item2}', '${sig2.header_planning_id}', 'printing' )`
            await connection.query(sql_sig2)
        })
    } else {
        status_insert_sig2 = true
    }

    if (coating.ink_usage_coating !== "") {
        const sql_coating = `  INSERT INTO mi.dbo.timesheet_header_material ( header_id, material_id, remark )
                            VALUES ( ${coating.header}, '${coating.ink_usage_coating}', 'printing' )`
        await connection.query(sql_coating)
    }


    // console.log(status_insert_sig1, status_insert_sig2, status_insert_coating);
    if (status_insert_sig1 === true && status_insert_sig2 === true && status_insert_coating === true) { //ถ้า true ทั้งหมด
        data = {
            success: true,
            message: 'insert ink usage สำเร็จ'
        }
    } else {
        data = {
            success: false,
            message: `${status_insert_sig1}, ${sig1.ink_usage}`
        }
    }

    return data
}

const getTableOtTypeModel = async (req, transaction) => {
    const { header_id, request_type } = req
    const sql = `   SELECT
                        a.emp_id,
                        c.emp_firstname_th+ ' ' + c.emp_lastname_th AS emp_name 
                    FROM
                        mi.dbo.timesheet_ot_request_detail a
                        LEFT JOIN mi.dbo.timesheet_ot_request b ON a.request_id = b.request_id
                        LEFT JOIN HRM.dbo.hrm_employee c ON CONVERT ( VARCHAR, a.emp_id ) = c.emp_id 
                    WHERE
                        b.header_id = '${header_id}'
                        AND b.request_type = ${request_type}`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                message: 'สำเร็จ',
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

const insertRequestOtModel = async (ip, req, transaction) => {
    const { machine_id, shift_id, request_date, request_type, last_edit_ip, header_id, employee } = req
    if (ip.substr(0, 7) == '::ffff:') { // fix for if you have both ipv4 and ipv6
        ip = ip.substr(7);
    }
    const sql = `declare @id int
                exec mi.dbo.rumm_newHeaderRequestOT
                @machine_id = '${machine_id}'
                ,@shift_id = '${shift_id}'
                ,@request_date = '${request_date}'
                ,@request_type ='${request_type}'
                ,@last_edit_ip ='${ip}'
                ,@header_id = '${header_id}'
                ,@id = @id output select 'id' = @id`
    let id = await connection.query(sql)
    let sql_del_detail = `delete mi.dbo.timesheet_ot_request_detail where request_id = '${id[0][0].id}'`
    await connection.query(sql_del_detail)
    employee.forEach(async emp => {
        let update_frommi3 = `update mi.dbo.timesheet_ot_request set from_mi3 = 1 WHERE request_id = ${id[0][0].id}`
        let sql_detail = `insert into mi.dbo.timesheet_ot_request_detail (request_id, emp_id) values (${id[0][0].id},'${emp}') `
        let sql_log = `insert into mi.dbo.timesheet_ot_request_detail_log (request_id,emp_id) values ('${id[0][0].id}','${emp}') `
        await connection.query(update_frommi3)
        await connection.query(sql_detail)
        await connection.query(sql_log)
    });

    return {
        success: true,
        message: 'บันทึก OT สำเร็จ'
    }
}

const getWorkingStatusWorkerModel = async (req, transaction) => {
    const { workers, working_date } = req
    const str_workers = workers.join(', ')
    const sql = `SELECT
                    emp_id,
                    working_status
                FROM
                    HRM.dbo.finger_time_attendance 
                WHERE
                    emp_id IN (${str_workers}) 
                    AND working_date = '${working_date}' `
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data,
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err,
            }
        })
}

const summaryWorkingStatus = async (req) => {
    let workers = req
    let count_1 = 0
    let count_0 = 0
    const filter_1 = workers.filter(obj => obj.working_status === 1)
    count_1 = filter_1.length

    const filter_0 = workers.filter(obj => obj.working_status === 0)
    count_0 = filter_0.length

    return {
        workers_on: count_1,
        workers_off: count_0
    }
}

const checkWorkerRequestOtModel = async (req, transaction) => {
    const { worker_id, shift_id, request_date, request_type } = req
    const sql = `SELECT COUNT
                    ( * ) AS c 
                FROM
                    mi.dbo.timesheet_ot_request r
                    LEFT JOIN mi.dbo.timesheet_ot_request_detail d ON d.request_id = r.request_id 
                WHERE
                    r.request_date = '${request_date}' 
                    AND r.request_type = '${request_type}' 
                    AND r.shift_id = '${shift_id}' 
                    AND d.emp_id = '${worker_id}'`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data,
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const deleteRequestOtModel = async (req, transaction) => {
    const { header_id, request_type } = req
    let sql_id = `select MAX(request_id) as request_id from mi.dbo.timesheet_ot_request where header_id = '${header_id}' and request_type = '${request_type}'`
    let request_id = (await connection.query(sql_id))[0][0].request_id
    if (request_id === null) {
        return {
            success: false,
            message: 'กรุณาเพิ่มพนักงานก่อนบันทึก'
        }
    }
    let sql = `delete mi.dbo.timesheet_ot_request where header_id = '${header_id}' and request_type = '${request_type}'`
    return await connection.query(sql)
        .then(async () => {
            if (request_id !== undefined) {
                let sql_del = `delete mi.dbo.timesheet_ot_request_detail where request_id = '${request_id}'`
                await connection.query(sql_del)
            }

            return {
                success: true,
                message: 'ลบ OT สำเร็จ',
            }
        })
        .catch((err) => {
            return {
                success: false,
                message: err
            }
        })
}

const getChecklistSupModel = async (req, transaction) => {
    const sql = `SELECT
                    checklist_type_id,
                    CASE 
                    WHEN type_id = 6 OR type_id = 8 OR type_id = 9 OR type_id = 10 THEN CAST(type_id AS VARCHAR)
                    ELSE topic
                END AS topic,
                    CASE 
                    WHEN type_id = 6 OR type_id = 8 OR type_id = 9 OR type_id = 10 THEN type_name
                    ELSE topic_name
                END AS topic_name

                FROM
                    mi.dbo.checklist_type_process 
                WHERE
                    machine_type_id = 35 
                    AND type_process_id = 'S6' 
                    AND type_id IN ( 3, 4, 5, 6, 7, 8, 9, 10, 11 ) 
                    AND active = 1`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data,
            }
        })
        .catch((err) => {
            return {
                success: false,
                data: err
            }
        })
}

const getOkSheetDetailModel = async (req, transaction) => {
    const { jobid, header_id, type_id } = req
    let item = []
    let part = []
    const sql_part = `SELECT itid, partName FROM mi.dbo.mi_item WHERE jobid = '${jobid}'`
    part = (await connection.query(sql_part))[0]
    if (type_id === '35') {
        const sql_checklist_sup = `SELECT
                                A.checklist_id,
                                A.header_id,
                                A.machine_id,
                                B.machine_name,
                                A.job_id,
                                C.job_name,
                                C.emp_id,
                                D.emp_firstname_th+' '+D.emp_lastname_th AS emp_name,
                                A.partname_id,
                                A.partname,
                                A.typeWB,
                                A.brandWB,
                                A.textname,
                                A.ink,
                                A.shadow,
                                A.analog,
                                A.numPowder,
                                A.percentPowder,
                                E.thick_paper
                            FROM
                                mi.dbo.checklist_timesheet_sub A
                                LEFT JOIN mi.dbo.machine B ON A.machine_id = B.machine_id
                                LEFT JOIN mi.dbo.mi C ON A.job_id = C.jobid
                                LEFT JOIN HRM.dbo.hrm_employee D ON CONVERT(VARCHAR, C.emp_id) = D.emp_id
                                LEFT JOIN mi.dbo.checklist_sub_detail E ON A.checklist_id = E.checklist_id
                            WHERE
                                A.header_id = '${header_id}'
                            AND
                                E.thick_paper IS NOT NULL`
        const checklist_sup = (await connection.query(sql_checklist_sup))[0]
        if (checklist_sup.length === 0) {
            return {
                success: false,
                data: 'กรุณาทำรายงานการเตรียมเครื่องจักร <br/>(Sup ตรวจสอบสี)'
            }
        }

        let pantone = []
        let packing = []
        let mole = []
        for (const c of checklist_sup) {
            const sql_sub_detail = `SELECT pantone, packing, mole FROM mi.dbo.checklist_sub_detail WHERE checklist_id = '${c.checklist_id}' AND pantone IS NOT NULL`
            const sub_detail = (await connection.query(sql_sub_detail))[0]

            for (const detail of sub_detail) {
                pantone.push(detail.pantone)
                packing.push(detail.packing)
                mole.push(detail.mole)
            }

            let temp = {
                machine_type: type_id,
                header_id: header_id,
                machine_id: c.machine_id,
                machine_name: c.machine_name,
                jobid: jobid,
                job_name: c.job_name,
                ae_id: c.emp_id,
                ae_name: c.emp_name,
                partname_id: c.partname_id,
                partname: c.partname,
                type_wb: c.typeWB,
                brand_wb: c.brandWB,
                ink: c.ink,
                shadow: c.shadow,
                analog: c.analog,
                num_powder: c.numPowder,
                percent_powder: c.percentPowder,
                thick_paper: c.thick_paper,
                textname: c.textname,
                pantone: pantone,
                packing: packing,
                mole: mole
            }
            item.push(temp)
        }
    } else { // web

    }
    return {
        success: true,
        data: {
            item: item,
            part: part
        }
    }
}

const getOldHeaderTimesheetModel = async (req, transaction) => {
    const { machine_id, plan_id } = req
    const sql = `SELECT 
                    MAX( a.header_id ) AS header_id
                FROM
                    mi.dbo.timesheet_item a
                    JOIN mi.dbo.timesheet_header b ON a.header_id = b.header_id
                WHERE
                    a.endTime IS NULL 
                    AND b.machine_id = '${machine_id}'
                    AND plan_id = '${plan_id}'`
    return await connection.query(sql)
        .then(([data]) => {
            return {
                success: true,
                data: data[0].header_id,
            }
        })
        .catch((err) => {
            return {
                success: false,
                data: err
            }
        })

}

const getPartnameSubModel = async (req, transaction) => {
    const { jobid, partname_id } = req
    const sql = `SELECT
            jobid,
            itid,
            partName,
            paperCategoryID,
            paperTypeName
        FROM mi.dbo.mi_item LEFT 
        JOIN mi.dbo.vw_paperCategory ON mi_item.paperCategoryID = vw_paperCategory.paperTypeID collate Thai_CI_AS
        WHERE
            jobid = '${jobid}'
        AND itid = '${partname_id}'
        GROUP BY
            jobid,
            itid,
            partName,
            paperCategoryID,
            paperTypeName`
    let result1 = (await connection.query(sql))[0][0]
    return result1
}

const insertSupCheckColorDetailModal = async (req, transaction) => {
    const { header_id, machine_id, shift_id, jobid, type_id, partname_id,
        partname, qty, type_wb, brand_wb, textname, ink, analog,
        shadow, num_powder, percent_powder, lot_wb, stickiness, lot_k,
        lot_c, lot_m, lot_y, leader, worker, topic1, topic2, topic3, topic4,
        uv1, uv2, uv3, uv4, uv5 } = req
    try {
        const checklist_id_sql = `SELECT checklist_id FROM mi.dbo.checklist_timesheet_sub WHERE header_id = '${header_id}'`;
        let checklist_id_del = (await connection.query(checklist_id_sql))[0]

        if (checklist_id_del.length > 0) {
            const sql_del_timesheet_sub = `DELETE FROM mi.dbo.checklist_timesheet_sub WHERE header_id = '${header_id}'`;
            const sql_del_timesheet_sub_detail = `DELETE FROM mi.dbo.checklist_sub_detail WHERE checklist_id = '${checklist_id_del[0].checklist_id}'`;

            await connection.query(sql_del_timesheet_sub)
            await connection.query(sql_del_timesheet_sub_detail)
        }

        if (machine_id === '3605' || machine_id === 3605) {
            let sql = `INSERT INTO mi.dbo.checklist_timesheet_sub(
            header_id,machine_id,shift_id,job_id,partname_id,partname,quantity,
            typeWB,brandWB,textname,ink,analog,shadow,numPowder,percentPowder,
            worker_id,leader_id,uv1,uv2,uv3,uv4,uv5,
            lotWB,stickiness,lotK,lotC,lotM,lotY
            )VALUES(
            '${header_id}','${machine_id}','${shift_id}','${jobid}',
            '${partname_id}','${partname}','${qty.replace(/,./g, '')}',
            '${type_wb}','${brand_wb}','${textname}','${ink}',
            '${analog}','${shadow}','${num_powder}','${percent_powder}',
            '${worker}','${leader}','${uv1}','${uv2}','${uv3}','${uv4}','${uv5}',
            '${lot_wb}','${stickiness}','${lot_k}','${lot_c}','${lot_m}','${lot_y}'
            )`

            await connection.query(sql)
        } else {
            let sql = `INSERT INTO mi.dbo.checklist_timesheet_sub(
            header_id,machine_id,shift_id,job_id,partname_id,partname,quantity,
            typeWB,brandWB,textname,ink,analog,shadow,numPowder,percentPowder,
            worker_id,leader_id,
            lotWB,stickiness,lotK,lotC,lotM,lotY
            )VALUES(
            '${header_id}','${machine_id}','${shift_id}','${jobid}',
            '${partname_id}','${partname}','${qty.replace(/,./g, '')}',
            '${type_wb}','${brand_wb}','${textname}','${ink}',
            '${analog}','${shadow}','${num_powder}','${percent_powder}',
            '${worker}','${leader}',
            '${lot_wb}','${stickiness}','${lot_k}','${lot_c}','${lot_m}','${lot_y}'
            )`
            await connection.query(sql)
        }

        let sql_id = `SELECT max(checklist_id) AS maxid FROM mi.dbo.checklist_timesheet_sub`;
        let checklist_id = (await connection.query(sql_id))[0][0].maxid

        for (const item of topic1) {
            let sql_topic1 = `INSERT INTO mi.dbo.checklist_sub_detail (checklist_id,checklist_type_id,pantone,packing,mole)
						VALUES ('${checklist_id}','${item.topic_id}','${item.pantone}','${item.packing}','${item.mole}')`
            await connection.query(sql_topic1)
        }

        sql_papertype = `INSERT INTO mi.dbo.checklist_sub_detail (checklist_id,checklist_type_id,paper_type)
        VALUES ('${checklist_id}','${topic2.topic_id}','${topic2.papertype}')`
        await connection.query(sql_papertype)

        sql_thickpaper = `INSERT INTO mi.dbo.checklist_sub_detail (checklist_id,checklist_type_id,thick_paper)
        VALUES ('${checklist_id}','${topic3.topic_id}','${topic3.thickpaper}')`
        await connection.query(sql_thickpaper)

        for (let index = 0; index < topic4.length; index++) {
            // console.log(`${checklist_id}`, `${topic4[index]}`);
            let sql_topic4 = `INSERT INTO mi.dbo.checklist_sub_detail (checklist_id,checklist_type_id)
            VALUES ('${checklist_id}','${topic4[index]}')`
            await connection.query(sql_topic4)
        }

        return {
            success: true,
            data: 'บันทึกสำเร็จ'
        }
    } catch (err) {
        console.log(err);
        return {
            success: false,
            data: err
        }
    }

}

const insertOkSheetModel = async (req, transaction) => {

    const {
        type_id, header_id, ae_emp_id, ae_emp_name, analog_no, customer, density, ink, job_id, job_name, machine_id, machine_name, manager_emp_id,
        manager_emp_name, mole, num_powder, operator_id, operator_name, other, packing, partname, percent_powder, qa_emp_id, qa_name,
        shadow, status, std, supervisor_emp_id, supervisor_name, text_name, thick_paper, unit_color, wb_brand, wb_type, type_density, ae_array
    } = req

    try {

        const sql_old_ok_sheet_id = `SELECT MAX(ok_sheet_id) AS ok_sheet_id FROM Production_Logistics.dbo.ok_sheet WHERE timesheet_header_id = '${header_id}'`;
        let old_ok_sheet_id = (await connection.query(sql_old_ok_sheet_id))[0]

        if (old_ok_sheet_id[0].ok_sheet_id !== null) {
            const sql_del_ok_sheet_e_lab = `DELETE FROM Production_Logistics.dbo.ok_sheet_e_lab WHERE ok_sheet_id = '${old_ok_sheet_id[0].ok_sheet_id}'`;
            const sql_del_ok_sheet = `DELETE FROM Production_Logistics.dbo.ok_sheet WHERE timesheet_header_id = '${header_id}'`;

            await connection.query(sql_del_ok_sheet_e_lab)
            await connection.query(sql_del_ok_sheet)
        }

        const sql = `SELECT ISNULL( MAX ( SUBSTRING ( ok_sheet_number, 7, 4 ) ), 0 ) AS ok_id, 
        CONVERT(nvarchar(4), GETDATE(), 12) AS ym 
        FROM Production_Logistics.dbo.ok_sheet 
        WHERE SUBSTRING(ok_sheet_number,3,4) = CONVERT(nvarchar(4), GETDATE(), 12)`
        let rs = (await connection.query(sql))[0]
        let ym = rs[0].ym
        let new_id = (parseInt(rs[0].ok_id) + 1).toString().padStart(4, '0')
        let ok_id = `OK${ym}${new_id}`

        const sql_insert = `INSERT INTO Production_Logistics.dbo.ok_sheet(
            ae_emp_id, ae_emp_name, machine_id, machine_name, job_id, job_name, part_name, text_name,
            ink, wb_type, wb_brand, shadow, analog_no, mole, packing, thick_paper,
            std, density, unit_color, operator_emp_id, operator_name, 
            supervisor_emp_id, supervisor_name, manager_emp_id, manager_name,
            customer, other, num_powder, percent_powder,
            ok_sheet_number, status, type_density, qa_emp_id, qa_name, timesheet_header_id
        )VALUES(
            '${ae_emp_id}','${ae_emp_name}','${machine_id}','${machine_name}','${job_id}','${job_name}',
            '${partname}','${text_name}','${ink}','${wb_type}','${wb_brand}','${shadow}','${analog_no}',
            '${mole}','${packing}','${thick_paper}','${std}','${density}','${unit_color}','${operator_id}',
            '${operator_name}','${supervisor_emp_id}','${supervisor_name}','${manager_emp_id}',
            '${manager_emp_name}','${customer}','${other}','${num_powder}','${percent_powder}',
            '${ok_id}',${status},'${type_density}','${qa_emp_id}','${qa_name}',${header_id}
        )`
        await connection.query(sql_insert)

        const sql_lastInsert_ok_sheet = "SELECT MAX(ok_sheet_id) AS ok_sheet_id FROM Production_Logistics.dbo.ok_sheet"
        let rs_ok_sheet_id = await connection.query(sql_lastInsert_ok_sheet).then((data) => { return data[0][0].ok_sheet_id })
        // console.log(rs_ok_sheet_id)
        for (let item of ae_array) {
            var sql_insert_ok_sheet_e_lab = `INSERT INTO Production_Logistics.dbo.ok_sheet_e_lab(ok_sheet_id,topic,color,a_e,e_l,e_a,e_b)
                                                VALUES('${rs_ok_sheet_id}','${item.ae_topic}','${item.ae_color}','${item.ae_e}','${item.ae_l}','${item.ae_a}','${item.ae_b}')`
            await connection.query(sql_insert_ok_sheet_e_lab)
        }
        return {
            success: true,
            data: rs_ok_sheet_id,
        }

    } catch (err) {
        return {
            success: false,
            data: err
        }
    }
}

const checkEmployeeDataModel = async (req, transaction) => {
    const sql = `SELECT
                    emp_id,
                    emp_firstname_th,
                    emp_lastname_th 
                FROM
                    HRM.dbo.hrm_employee 
                WHERE
                    emp_id = '${req.emp_id}'`
    let length = (await connection.query(sql))[1]
    let emp_data = (await connection.query(sql))[0][0]
    let success
    if (length > 0) {
        success = true
    } else if (length === 0) {
        success = false
    }

    return {
        success,
        emp_data
    }
}

// update 21/06/2023 ปุ่มซ่อมเครื่องจักร
const getDocumentMaintenanceMachineModel = async (req, transaction) => {
    let data = {}
    const sql1 = `SELECT
                    CASE WHEN CONVERT(VARCHAR(16), GETDATE(), 120) BETWEEN CONVERT(VARCHAR(11), GETDATE(), 120)+'20:00' AND (CONVERT(VARCHAR(11), GETDATE(), 120)+'23:59') THEN '01'
                         WHEN CONVERT(VARCHAR(16), GETDATE(), 120) BETWEEN CONVERT(VARCHAR(11), GETDATE(), 120)+'00:00' AND (CONVERT(VARCHAR(11), GETDATE(), 120)+'08:00') THEN '11'
                         ELSE '22'
                    END AS assign_status`
    let assignStatus = (await connection.query(sql1))[0][0].assign_status

    let select = ", 0 AS count_worker"
    let where = ""
    if (assignStatus === '22') {
        select = ` ,(SELECT COUNT(*)
					    FROM (  SELECT emp_id
							    FROM MAINTENANCE_MACHINE.dbo.ma_worker
							    WHERE ma_id=a.ma_id
								GROUP BY emp_id) AS tbl1
							) AS count_worker `
        where = ` AND a.assign_status='1' `
    }
    const sql2 = `SELECT
                    null AS id
                    ,ma_id AS ma_id
                    ,ma_status
                    ,ma_id AS plan_id
                    ,CONVERT(VARCHAR(10), notify_datetime,120) AS plan_date
                    ,CASE WHEN pm_status='1' THEN 'PM'
                            ELSE 'แจ้งซ่อม'
                    END AS jobid
                    ,'(For Graph)' AS job_name
                    ,'PM_MAINTENANCE' AS doctype
                    ,'Maintenance' AS partname
                    ,null AS remark
                    ,CONVERT(NVARCHAR(200), a.ma_remark) AS detail
                    ,null AS shift_id
                    ,null AS priority
                    ${select}
                FROM MAINTENANCE_MACHINE.dbo.ma_request AS a
                WHERE 1=1
                            AND a.ma_status != '2'
                            AND a.acknowledge != '1'
                            AND a.machine_id = '${req}'
                            ${where}
                ORDER BY
                plan_date ASC,
                id ASC`
    const sql3 = `  SELECT 
                        machine_id,
                        machine_name,
                        type_id,
                        type_name
                    FROM mi.dbo.timesheet_machine WHERE machine_id = '${req}' `
    const sql4 = `EXEC mi.dbo.get_maintenance_machine_workers`

    data['plans'] = (await connection.query(sql2))[0]
    data['machine'] = (await connection.query(sql3))[0]
    data['workers'] = (await connection.query(sql4))[0]

    return data
}

const insertTimesheetMaintenanceMachineModel = async (req, transaction) => {
    const { obj } = req
    let data = {}
    const sql1 = `EXEC mi.dbo.new_timesheet_maintenance_machine_header @machine_id = '${obj.machine_id}', @ma_id = '${obj.ma_id}' `
    data['header_id'] = (await connection.query(sql1))[0][0].header_id

    let sql_time = `SELECT TOP 1 ma_id, time_number, confirm_status, ma_start_date   FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' ORDER BY time_number DESC`
    let time = (await connection.query(sql_time))[0][0]

    for (let worker of obj.workers) {
        let sql2 = `EXEC mi.dbo.new_timesheet_maintenance_machine_worker @header_id = ${data.header_id}, @emp_id = '${worker}'`
        await connection.query(sql2)

        let sql3 = `SELECT COUNT(emp_id) AS count_emp FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE emp_id = '${worker}' AND ma_id = '${obj.ma_id}'`
        let query_sql3 = (await connection.query(sql3))[0][0].count_emp

        if (query_sql3 <= 0) {
            let sql_insert_ma_worker = ` INSERT INTO MAINTENANCE_MACHINE.dbo.ma_worker(time_number, ma_id, emp_id) 
                                VALUES(1, '${obj.ma_id}', '${worker}') `
            await connection.query(sql_insert_ma_worker)
        } else {
            if (time.ma_start_date !== null && time.ma_start_date !== '') {
                let sql_insert_ma_worker = ` INSERT INTO MAINTENANCE_MACHINE.dbo.ma_worker(time_number, ma_id, emp_id) 
                                VALUES(${time.time_number + 1}, '${obj.ma_id}', '${worker}') `
                await connection.query(sql_insert_ma_worker)
            }
        }
    }

    return data
}

const getMaintenanceMachineRequestWorkerModel = async (req, transaction) => {
    let data = {}
    const sql = `EXEC mi.dbo.get_maintenance_machine_ma_worker @ma_id = '${req}'`
    data['workers'] = (await connection.query(sql))[0]

    return data
}

const getTimesheetMaintenanceMachineModel = async (req, transaction) => {
    let data = {}
    const sql1 = `EXEC mi.dbo.get_timesheet_maintenance_machine_header @header_id = ${req}`
    data['header'] = (await connection.query(sql1))[0][0]

    const sql2 = `EXEC mi.dbo.update_confirm_status_ma_request @ma_id = '${data.header.ma_id}'`
    await connection.query(sql2)

    const sql3 = `EXEC mi.dbo.get_timesheet_maintenance_machine_item @header_id = ${req}`
    data['item'] = (await connection.query(sql3))[0]

    const sql4 = `EXEC mi.dbo.get_timesheet_maintenance_machine_worker @header_id = ${req}`
    data['worker'] = (await connection.query(sql4))[0]
    return data
}

const insertTimesheetMaintenanceMachineItemModel = async (req, transaction) => {
    const { obj } = req
    let data = {}
    // await updateEndtimeItemMaintenanceModel(obj.header_id)

    const sql0 = `EXEC mi.dbo.update_endtime_timesheet_maintenance_machine_item @header_id = ${obj.header_id}, @end_time = '${obj.end_time}'`
    await connection.query(sql0)

    const sql1 = `exec mi.dbo.new_timesheet_maintenance_machine_item @header_id = ${obj.header_id}, @process_id = 'maintenance', @start_time = '${obj.end_time}'`
    await connection.query(sql1)

    const sql2 = `EXEC mi.dbo.get_timesheet_maintenance_machine_item @header_id = ${obj.header_id}`
    data['item'] = (await connection.query(sql2))[0]

    const sql_get_ma_worker = `SELECT emp_id FROM mi.dbo.timesheet_maintenance_machine_worker WHERE	header_id = ${obj.header_id}`
    let workers = (await connection.query(sql_get_ma_worker))[0]
    let sql_time = `SELECT TOP 1 ma_id, time_number, confirm_status  FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' ORDER BY time_number DESC`
    let time = (await connection.query(sql_time))[0][0]
    // console.log(workers);
    for (let worker of workers) {
        if (time.confirm_status === 1) {
            // console.log(111);
            // ถ้า SDC confirm แล้ว
            // เพิ่มรอบใหม่
            let sql_insert = `INSERT INTO MAINTENANCE_MACHINE.dbo.ma_worker (ma_id, emp_id, ma_start_date, ma_start_time, time_number)
                            SELECT
                        '${obj.ma_id}' AS ma_id
                        ,'${worker.emp_id}' AS emp_id
                        ,CONVERT(VARCHAR(10), GETDATE(),120) AS ma_start_date
                        ,CONVERT(VARCHAR(5), GETDATE(),108) AS ma_start_time
                        ,'${Number(time.time_number) + 1}' AS time_number`
            await connection.query(sql_insert)
        } else { // ยังไม่ confirm
            // console.log(222);
            let sql_check = `SELECT TOP 1 * FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' AND emp_id='${worker.emp_id}' AND time_number='${time.time_number}' `
            let check_obj = (await connection.query(sql_check))[0][0]
            // console.log(check_obj);
            if (check_obj.ma_start_date !== '' && check_obj.ma_start_date !== null) {
                let sql_insert_sub = `INSERT INTO MAINTENANCE_MACHINE.dbo.ma_worker (ma_id, emp_id, ma_start_date, ma_start_time, time_number)
                SELECT
                            '${obj.ma_id}' AS ma_id
                            ,'${worker.emp_id}' AS emp_id
                            ,CONVERT(VARCHAR(10), GETDATE(),120) AS ma_start_date
                            ,CONVERT(VARCHAR(5), GETDATE(),108) AS ma_start_time
                            ,'${Number(time.time_number)}' AS time_number`
                await connection.query(sql_insert_sub)
            } else {
                let sql_update = `UPDATE MAINTENANCE_MACHINE.dbo.ma_worker SET 
                                ma_id=tbl1.ma_id,
                                emp_id=tbl1.emp_id,
                                ma_start_date=tbl1.ma_start_date,
                                ma_start_time=tbl1.ma_start_time
                                FROM(
                                            SELECT
                                                        '${obj.ma_id}' AS ma_id
                                                        ,'${worker.emp_id}' AS emp_id
                                                        ,CONVERT(VARCHAR(10), GETDATE(),120) AS ma_start_date
                                                        ,CONVERT(VARCHAR(5), GETDATE(),108) AS ma_start_time
                                ) AS tbl1
                                WHERE 1=1
                                            AND ma_worker.ma_id = tbl1.ma_id 
                                            AND ma_worker.emp_id=tbl1.emp_id
                                            AND ma_worker.ma_end_date IS NULL
                                            AND ma_worker.ma_start_date IS NULL`
                await connection.query(sql_update)
            }
        }
    }


    return data
}

const updateEndtimeItemMaintenanceModel = async (req, transaction) => {
    const { obj } = req
    let data = {
        success: 0
    }
    const sql = `EXEC mi.dbo.update_endtime_timesheet_maintenance_machine_item @header_id = ${obj.header_id}, @end_time = '${obj.end_time}'`
    await connection.query(sql).then(() => {
        data['success'] = 1
    })

    const sql_get_ma_worker = `EXEC mi.dbo.get_timesheet_maintenance_ma_worker @ma_id = '${obj.ma_id}'`
    let workers = (await connection.query(sql_get_ma_worker))[0]

    const sql_get_ma_request = `SELECT *  FROM MAINTENANCE_MACHINE.dbo.ma_request WHERE ma_id='${obj.ma_id}'`
    let ma_request = (await connection.query(sql_get_ma_request))[0][0]

    const sql2 = `SELECT TOP 1 * FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' ORDER BY time_number DESC`
    let ma_worker = (await connection.query(sql2))

    if (Number(ma_worker[1]) > 0) {
        let service_charge_hour_rate = ""
        let total_service_charge = ""

        for (let worker of workers) {
            if (ma_worker[0][0].time_number == 1) {
                if (ma_request.ma_time_number >= 1 && (ma_request.confirm_by === "" || ma_request.confirm_by === null)) {
                    service_charge_hour_rate = '0.00'
                    total_service_charge = '0.00'
                } else {
                    service_charge_hour_rate = 'tbl1.service_charge_hour_rate'
                    total_service_charge = 'tbl1.total_service_charge'
                }
            } else {
                service_charge_hour_rate = '0.00'
                total_service_charge = '0.00'
            }

            let sql = `UPDATE MAINTENANCE_MACHINE.dbo.ma_worker 
                        SET 
                            ma_id=tbl1.ma_id,
                            emp_id=tbl1.emp_id,
                            ma_end_date=tbl1.ma_end_date,
                            ma_end_time=tbl1.ma_end_time,
                            total_hour=tbl1.total_hour,
                            service_charge_hour_rate=${service_charge_hour_rate},
                            total_service_charge=${total_service_charge}
                        FROM(
                                SELECT
                                        ma_id
                                        ,emp_id
                                        ,ma_start_date
                                        ,ma_start_time
                                        ,CONVERT(VARCHAR(10), GETDATE(),120) AS ma_end_date
                                        ,CONVERT(VARCHAR(5), GETDATE(),108) AS ma_end_time
                                        ,MAINTENANCE_MACHINE.dbo.get_hout(CONVERT(VARCHAR(10), ma_start_date)+' '+ma_start_time, GETDATE()) AS total_hour
                                        ,(SELECT wage_money FROM MAINTENANCE_MACHINE.dbo.wage) AS service_charge_hour_rate
                                        ,MAINTENANCE_MACHINE.dbo.get_wage( MAINTENANCE_MACHINE.dbo.get_hout(CONVERT(VARCHAR(10), ma_start_date)+' '+ma_start_time, GETDATE()) , (SELECT wage_money FROM MAINTENANCE_MACHINE.dbo.wage)) AS total_service_charge

                                FROM MAINTENANCE_MACHINE.dbo.ma_worker
                                WHERE ma_id='${obj.ma_id}'
                                            AND emp_id='${worker.emp_id}'
                                            AND ma_end_date IS NULL
                                            AND ma_start_date IS NOT NULL

                        ) AS tbl1
                        WHERE 1=1
                                    AND ma_worker.ma_id = tbl1.ma_id 
                                    AND ma_worker.emp_id=tbl1.emp_id
                                    AND ma_worker.ma_end_date IS NULL`

            await connection.query(sql)
        }

    }
    return data
}

const endMaintenanceMachineModel = async (req, transaction) => {
    const { obj } = req
    let data = {}
    const sql_worker = `EXEC mi.dbo.get_timesheet_maintenance_machine_worker @header_id = ${obj.header_id}`
    let workers_arr = (await connection.query(sql_worker))[0]

    const update_end_type = `   UPDATE mi.dbo.timesheet_maintenance_machine_header
                                SET endType = 0
                                WHERE header_id = ${obj.header_id}`
    await connection.query(update_end_type)

    const sql1 = `SELECT *  FROM MAINTENANCE_MACHINE.dbo.ma_request WHERE ma_id='${obj.ma_id}'`
    let ma_request = (await connection.query(sql1))[0][0]
    const sql2 = `SELECT TOP 1 * FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' ORDER BY time_number DESC`
    let ma_worker = (await connection.query(sql2))
    if (Number(ma_worker[1]) > 0) {
        let service_charge_hour_rate = ""
        let total_service_charge = ""

        for (let worker of workers_arr) {
            if (ma_worker[0][0].time_number == 1) {
                if (ma_request.ma_time_number >= 1 && (ma_request.confirm_by === "" || ma_request.confirm_by === null)) {
                    service_charge_hour_rate = '0.00'
                    total_service_charge = '0.00'
                } else {
                    service_charge_hour_rate = 'tbl1.service_charge_hour_rate'
                    total_service_charge = 'tbl1.total_service_charge'
                }
            } else {
                service_charge_hour_rate = '0.00'
                total_service_charge = '0.00'
            }

            let sql = `UPDATE MAINTENANCE_MACHINE.dbo.ma_worker 
                SET 
                    ma_id=tbl1.ma_id,
                    emp_id=tbl1.emp_id,
                    ma_end_date=tbl1.ma_end_date,
                    ma_end_time=tbl1.ma_end_time,
                    total_hour=tbl1.total_hour,
                    service_charge_hour_rate=${service_charge_hour_rate},
                    total_service_charge=${total_service_charge}
                FROM(
                        SELECT
                                ma_id
                                ,emp_id
                                ,ma_start_date
                                ,ma_start_time
                                ,CONVERT(VARCHAR(10), GETDATE(),120) AS ma_end_date
                                ,CONVERT(VARCHAR(5), GETDATE(),108) AS ma_end_time
                                ,MAINTENANCE_MACHINE.dbo.get_hout(CONVERT(VARCHAR(10), ma_start_date)+' '+ma_start_time, GETDATE()) AS total_hour
                                ,(SELECT wage_money FROM MAINTENANCE_MACHINE.dbo.wage) AS service_charge_hour_rate
                                ,MAINTENANCE_MACHINE.dbo.get_wage( MAINTENANCE_MACHINE.dbo.get_hout(CONVERT(VARCHAR(10), ma_start_date)+' '+ma_start_time, GETDATE()) , (SELECT wage_money FROM MAINTENANCE_MACHINE.dbo.wage)) AS total_service_charge

                        FROM MAINTENANCE_MACHINE.dbo.ma_worker
                        WHERE ma_id='${obj.ma_id}'
                                    AND emp_id='${worker.emp_id}'
                                    AND ma_end_date IS NULL

                ) AS tbl1
                WHERE 1=1
                            AND ma_worker.ma_id = tbl1.ma_id 
                            AND ma_worker.emp_id=tbl1.emp_id
                            AND ma_worker.ma_end_date IS NULL`

            await connection.query(sql)
        }
    }

    data['success'] = true
    return data
}

const updateMaStatusModel = async (req, transaction) => {
    let data = {}
    let sql = ` UPDATE MAINTENANCE_MACHINE.dbo.ma_request
                SET ma_status='1',
                    ma_complete_date = GETDATE()
                WHERE ma_id='${req}' `
    await connection.query(sql).then(() => {
        data['success'] = 1
    })

    return data
}

const checkMaEndTypeModel = async (req, transaction) => {
    let data = {}
    let sql = `SELECT TOP
                    1
                    header_id 
                FROM
                    mi.dbo.timesheet_maintenance_machine_header 
                WHERE
                    ma_id = '${req}' 
                    AND endType = 2
                ORDER BY
	                header_id DESC`
    let query = await connection.query(sql)
    if (query[1] > 0) {
        data['header_id'] = query[0][0].header_id
    } else {
        data['header_id'] = ""
    }

    return data
}

const deleteMaWorkerModel = async (req, transaction) => {
    let { obj } = req
    let data = {}
    let sql_time = `SELECT TOP 1 ma_id, time_number, confirm_status  FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' ORDER BY time_number DESC`
    let time = (await connection.query(sql_time))[0][0]

    let sql1 = `DELETE FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE emp_id = '${obj.emp_id}' AND ma_id = '${obj.ma_id}' AND time_number = '${time.time_number}' 
    AND worker_id IN ( SELECT TOP 1 worker_id FROM MAINTENANCE_MACHINE.dbo.ma_worker ORDER BY worker_id DESC )`
    let sql2 = `DELETE FROM mi.dbo.timesheet_maintenance_machine_worker WHERE header_id = ${obj.header_id} AND emp_id = '${obj.emp_id}'`
    await connection.query(sql1).then(() => {
        data['success'] = 1
    })

    await connection.query(sql2).then(() => {
        data['success'] = 1
    })

    return data
}

const checkMaWorkerModel = async (req, transaction) => {
    const { emp_id } = req
    let data = {}
    const sql = `EXEC mi.dbo.get_maintenance_machine_worker_by_empid @emp_id = '${emp_id}'`
    let emp_length = (await connection.query(sql))
    if (emp_length[1] > 0) {
        data['success'] = 0
    } else {
        data['success'] = 1
        data['emp_data'] = {
            emp_id: emp_id,
            emp_firstname_th: emp_length[0][0].firstname,
            emp_lastname_th: emp_length[0][0].lastname
        }
    }
    return data
}

const addMaWorkerModel = async (req, transaction) => {
    let { obj } = req
    let data = {}

    let sql_time = `SELECT TOP 1 * FROM MAINTENANCE_MACHINE.dbo.ma_worker WHERE ma_id='${obj.ma_id}' ORDER BY time_number DESC`
    let time = (await connection.query(sql_time))[0][0]

    let sql1 = `SELECT COUNT
                    ( emp_id ) AS count_emp
                FROM
                    MAINTENANCE_MACHINE.dbo.ma_worker 
                WHERE
                    emp_id = '${obj.emp_id}'
                    AND ma_id = '${obj.ma_id}'
                    ANd time_number = '${time.time_number}'`
    let count_rec = (await connection.query(sql1))[0][0].count_emp

    let sql2 = `SELECT COUNT ( emp_id ) AS count_emp FROM	mi.dbo.timesheet_maintenance_machine_worker WHERE	emp_id = '${obj.emp_id}' AND header_id = '${obj.header_id}'`
    let count_rec2 = (await connection.query(sql2))[0][0].count_emp

    if (count_rec <= 0) {
        let sql_add1 = `INSERT INTO MAINTENANCE_MACHINE.dbo.ma_worker(time_number, ma_id, emp_id)
                        VALUES('${time.time_number}', '${obj.ma_id}', '${obj.emp_id}')`
        await connection.query(sql_add1)
        data['success'] = 1
    } else {
        data['success'] = 0
    }

    if (count_rec2 <= 0) {
        let sql_add2 = `EXEC mi.dbo.new_timesheet_maintenance_machine_worker @header_id = ${obj.header_id}, @emp_id = '${obj.emp_id}'`
        await connection.query(sql_add2)
        data['success2'] = 1
    } else {
        data['success2'] = 0
    }

    data['obj'] = obj

    return data
}

const getChecklistOutsourceIdModel = async () => {
    let res = {}
    const cqp_code = (await connection.query(`EXEC mi.dbo.timesheet_get_checklist_outsouce_id`))[0][0].cqp_code
    res.cqp_code = cqp_code
    return res
}

const getChecklistOutsourceDetail = async (plan_id) => {
    let res = {}
    const sql = `SELECT
                    a.*,
                    ISNULL(b.quantity, 0) AS qty_plan,
                    c.emp_id AS worker_id,
                    c.emp_name AS worker_name,
                    'Checklist ตรวจสอบคุณภาพก่อนส่งผลิตจัดจ้างนอกบริษัท' AS doc_name
                FROM
                    mi.dbo.checklist_qc_outsource_timesheet_head a
                    LEFT JOIN mi.dbo.machine_planning b ON b.id = a.plan_id 
                    LEFT JOIN HRM.dbo.vw_employee c ON a.cqp_emp_id = c.emp_id COLLATE Thai_CI_AI
                WHERE
                    a.plan_id = ${plan_id}`
    await connection.query(sql)
        .then(async ([data]) => {
            res.head = data.length > 0 ? data[0] : {}
            if (data.length === 0) {
                const sql_head = `EXEC mi.dbo.timesheet_get_pallet_data @plan_id = ${plan_id}`
                await connection.query(sql_head)
                    .then(([data_head]) => {
                        res.head = data_head.length > 0 ? data_head[0] : {}
                    })
                res.head.cqp_code = ""
            } else {
                const sql_head = `EXEC mi.dbo.timesheet_get_pallet_data @plan_id = ${plan_id}`
                await connection.query(sql_head)
                    .then(([data_head]) => {
                        if (data_head.length > 0) {
                            res.head.total_qty_pallet = data_head[0].total_qty_pallet
                            res.head.trim_height = data_head[0].trim_height
                            res.head.count_pallet = data_head[0].count_pallet
                        }
                    })
            }
            res.detail = []
            if (data.length > 0) {
                const sql_detail = `SELECT
                                        a.*,
                                        b.detail_name,
                                        b.checklist_group_id,
                                        c.checklist_group_name 
                                    FROM
                                        mi.dbo.checklist_qc_outsource_timesheet_detail a
                                        LEFT JOIN mi.dbo.checklist_detail b ON a.detail_id = b.detail_id
                                    LEFT JOIN mi.dbo.checklist_group c ON b.checklist_group_id = c.checklist_group_id 
                                    WHERE
                                        a.cqp_code = '${data[0].cqp_code}'`
                await connection.query(sql_detail)
                    .then(([data_detail]) => {
                        res.detail = data_detail
                    })
                const sql_outsource = `SELECT 
                                        NULL AS cqp_detail_id,
                                        '${data[0].cqp_code}' AS cqp_code,
                                        b.detail_id,
                                        NULL AS detail_value,
                                        '' AS detail_remark,
                                        b.detail_name,
                                        c.checklist_group_id,
                                        c.checklist_group_name
                                    FROM mi.dbo.checklist_detail b
                                        LEFT JOIN mi.dbo.checklist_group c ON b.checklist_group_id = c.checklist_group_id 
                                    WHERE
                                        b.checklist_group_id = 7`
                await connection.query(sql_outsource)
                    .then(([data_outsource]) => {
                        for (const i of data_outsource) {
                            res.detail.push(i)
                        }
                    })
                res.head.cqp_code = data[0].cqp_code
            }
        })
    return res
}

const getChecklistMachineDetail = async (machine_id) => {
    let res = {}
    const sql = `SELECT TOP
                1
                a.checklist_id AS checklist_code,
                d.checklist_id,
                'แบบตรวจสอบการเตรียมความพร้อม' + e.doc_name AS doc_name,
                a.shift_id,
                CASE a.shift_id
                    WHEN 1 THEN 'กลางวัน'
                    WHEN 2 THEN 'กลางคืน'
                    ELSE '-'
                END shift_name,
                a.worker_id,
                a.worker_name,
                a.leader_id,
                a.leader_name,
                a.leader_position,
                CONVERT(NVARCHAR(20), a.created, 103) + ' ' + FORMAT(a.created, 'HH:mm') AS created,
                b.jobid,
                c.job_name,
                b.partName,
                a.machine_id,
                m.machine_name
            FROM
                mi.dbo.checklist_timesheet_head a
                LEFT JOIN mi.dbo.machine_planning b ON a.plan_id = b.id
                LEFT JOIN mi.dbo.mi c ON b.jobid = c.jobid
                LEFT JOIN mi.dbo.machine m ON m.machine_id = a.machine_id
                LEFT JOIN mi.dbo.checklist_machine_detail d ON a.machine_id = d.machine_id
                LEFT JOIN mi.dbo.checklist_doc e ON d.checklist_id = e.checklist_id
            WHERE
                a.machine_id = ${machine_id}
            ORDER BY
                a.checklist_id DESC `
    await connection.query(sql)
        .then(async ([data]) => {
            res.head = data.length > 0 ? data[0] : {}
            res.detail = []
            if (data.length > 0) {
                const sql_detail = `SELECT
                                        a.checklist_remark AS detail_remark,
                                        a.checklist_val AS detail_value,
                                        b.detail_name,
                                        b.checklist_group_id,
                                        c.checklist_group_name 
                                    FROM
                                        mi.dbo.checklist_timesheet_detail a
                                        LEFT JOIN mi.dbo.checklist_detail b ON a.checklist_type_id = b.detail_id
                                        LEFT JOIN mi.dbo.checklist_group c ON b.checklist_group_id = c.checklist_group_id 
                                    WHERE
                                        a.checklist_id = '${data[0].checklist_code}'`
                await connection.query(sql_detail)
                    .then(([data_detail]) => {
                        res.detail = data_detail
                    })
            }
        })
    return res
}

const getChecklistQCDetail = async (plan_id) => {
    let res = {}
    const sql = `SELECT TOP
                    1 a.*,
                    b.machine_name,
                    c.partName,
                    c.shift_id,
                    CASE c.shift_id
                        WHEN 1 THEN 'กลางวัน'
                        WHEN 2 THEN 'กลางคืน'
                        ELSE ''
                    END	shift_name,
                    'รายงานตรวจสอบคุณภาพหน่วยงาน' + REPLACE(d.doc_name, 'เครื่อง', '') AS doc_name,
                    e.job_name,
                    f.emp_name AS worker_name,
                    c.quantity AS qty_paper_plan,
                    CAST(g.paperwid AS VARCHAR(20)) paperwid,
	                CAST(g.paperlen AS VARCHAR(20)) paperlen,
                    c.paper_cut,
                    c.paper_sheet,
                    ISNULL(i.qty, 0) book_detail_qty,
                    c.waste
                FROM
                        mi.dbo.checklist_qc_timesheet_head a
                        LEFT JOIN mi.dbo.machine b ON a.machine_id = b.machine_id
                        LEFT JOIN mi.dbo.machine_planning c ON a.plan_id = c.id
                        LEFT JOIN mi.dbo.checklist_doc d ON a.checklist_id = d.checklist_id
                        LEFT JOIN mi.dbo.mi e ON a.jobid = e.jobid
                        LEFT JOIN mi.dbo.vw_employee f ON f.emp_id = a.worker_id COLLATE Thai_CI_AS
                        LEFT JOIN mi.dbo.mi_item g ON g.itid = c.itid AND g.jobid = c.jobid 
                        LEFT JOIN mi.dbo.mi_item_paperUsage h ON h.jobid = c.jobid AND h.itid = c.itid
	                    LEFT JOIN PURCH.dbo.book_detail i ON i.book_number = c.cut_mr COLLATE Thai_CI_AS AND h.item_code = h.item_code  
                WHERE
                    a.plan_id = ${plan_id} 
                ORDER BY
                    a.qc_id DESC `
    await connection.query(sql)
        .then(async ([data]) => {
            res.head = data.length > 0 ? data[0] : {}
            res.detail = []
            if (data.length > 0) {
                const sql_detail = `SELECT
                                        a.*,
                                        b.detail_name,
                                        b.checklist_group_id,
                                        c.checklist_group_name 
                                    FROM
                                        mi.dbo.checklist_qc_timesheet_detail a
                                        LEFT JOIN mi.dbo.checklist_detail b ON a.detail_id = b.detail_id 
                                        LEFT JOIN mi.dbo.checklist_group c ON b.checklist_group_id = c.checklist_group_id
                                    WHERE
                                        qc_code = '${data[0].qc_code}'`
                await connection.query(sql_detail)
                    .then(([data_detail]) => {
                        res.detail = data_detail
                    })
            }
        })
    return res
}

const manageChecklistOutsourceModel = async (req, transaction) => {
    const { head, detail, proc } = req
    var res = {
        success: 0,
    }

    head.cqp_code = proc === "add" ? (await getChecklistOutsourceIdModel()).cqp_code : head.cqp_code

    if (proc === "add") {
        var sql = `INSERT INTO mi.dbo.checklist_qc_outsource_timesheet_head (
            cqp_code,
            jobid,
            job_name,
            item_code,
            item_name,
            unit_id,
            unit_name,
            cqp_date,
            total_qty_pallet,
            trim_height,
            count_pallet,
            cqp_outsource_name,
            coat_choice,
            coat_detail,
            cqp_remark,
            cqp_emp_id,
            plan_id
            )
            VALUES (
                '${head.cqp_code}',
                '${head.jobid}',
                '${head.job_name}',
                '${head.item_code}',
                '${head.item_name}',
                ${head.unit_id},
                '${head.unit_name}',
                '${head.cqp_date}',
                '${head.total_qty_pallet}',
                ${head.trim_height},
                ${head.count_pallet},
                '${head.outsource_name}',
                ${head.coat_choice},
                '${head.coat_detail}',
                '${head.cqp_remark}',
                '${head.cqp_emp_id}',
                ${head.plan_id})`
        await connection.query(sql)
            .then(async () => {
                for (const item of detail) {
                    const sql_detail_insert = `INSERT INTO mi.dbo.checklist_qc_outsource_timesheet_detail (cqp_code, detail_id, detail_value, detail_remark) 
                    VALUES ('${head.cqp_code}', ${item.detail_id}, ${item.detail_value}, '${item.detail_remark}')`
                    await connection.query(sql_detail_insert)
                }
                res.success = 1
            })
            .catch(async (err) => {
                res.data = err
            })
    } else if (proc === 'edit') {
        var sql = `UPDATE mi.dbo.checklist_qc_outsource_timesheet_head 
                   SET cqp_outsource_name = '${head.outsource_name}',
                   coat_choice = ${head.coat_choice},
                   coat_detail = '${head.coat_detail}',
                   cqp_remark = '${head.cqp_remark}',
                   cqp_emp_id = '${head.cqp_emp_id}',
                   total_qty_pallet = '${head.total_qty_pallet}',
                   trim_height = '${head.trim_height}',
                   count_pallet = '${head.count_pallet}'
                   WHERE cqp_code = '${head.cqp_code}'`
        await connection.query(sql).then(async () => {
            for (const item of detail) {
                const sql_detail_update = `UPDATE mi.dbo.checklist_qc_outsource_timesheet_detail 
                SET detail_value = ${item.detail_value}, detail_remark = '${item.detail_remark}'
                WHERE cqp_code = '${head.cqp_code}' AND detail_id = '${item.detail_id}'`
                await connection.query(sql_detail_update)
            }
            res.success = 1
        }).catch((err) => {
            res.data = err
        })
        // res.data = req
    }

    return res
}

module.exports = {
    getMachineTypeModel,
    getMachinesModel,
    getWorkersModel,
    getPlansModel,
    getPaperStatusModel,
    clearWorkerModel,
    insertHeaderModel,
    getHeaderModel,
    insertTimesheetItemModel,
    updateQuantityModel,
    getRepairItemModel,
    insertRepairRequestModel,
    insertChecklistWarningModel,
    checkFirstShiftModel,
    updateRepairRequestAgainModel,
    getTotalRunningModel,
    updateTimesheetItemModel,
    getDepartmentModel,
    getMachineByDepartmentModel,
    getOkLimitColorDetailModel,
    insertOkLimitColorModel,
    getProblemModel,
    getChecklistLongModel,
    insertChecklistWarningWithMaRequestModel,
    insertChecklistModel,
    deleteTimesheetModel,
    updateEndtimeItemModel,
    insertInkUsageModel,
    getTableOtTypeModel,
    deleteRequestOtModel,
    insertRequestOtModel,
    getChecklistSupModel,
    getOkSheetDetailModel,
    getOldHeaderTimesheetModel,
    getDetailSupCheckColorModel,
    getPartnameSubModel,
    insertSupCheckColorDetailModal,
    insertOkSheetModel,
    addWorkerModel,
    getEmployeeModel,
    removeWorkerModel,
    getCheckerModel,
    checkWorkerRequestOtModel,
    checkEmployeeDataModel,
    checkHeaderIdModel,
    getDocumentMaintenanceMachineModel,
    insertTimesheetMaintenanceMachineModel,
    getMaintenanceMachineRequestWorkerModel,
    getTimesheetMaintenanceMachineModel,
    insertTimesheetMaintenanceMachineItemModel,
    updateEndtimeItemMaintenanceModel,
    endMaintenanceMachineModel,
    updateMaStatusModel,
    deleteMaWorkerModel,
    addMaWorkerModel,
    checkMaWorkerModel,
    checkMaEndTypeModel,
    getWorkingStatusWorkerModel,
    summaryWorkingStatus,
    insertChecklistQCModel,
    getChecklistModel,
    getChecklistOutsourceDetail,
    getChecklistMachineDetail,
    getChecklistQCDetail,
    getChecklistOutsourceIdModel,
    manageChecklistOutsourceModel
}
