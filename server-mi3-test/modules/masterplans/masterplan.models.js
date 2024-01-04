const connection = require('../../config/connection')
const getDataMachineModel = async (req) => {
    var wh_type_id = "";
    console.log('type_id :>> ', req.type_id);
    if (req.type_id == 'afterpress') {
        wh_type_id = `(m.type_id IN('12','22','26','16','18','25','23', '41','42','43','44','45','46','47','51','1','6','5','10','11','14','19','20','53','54','21','9','7') AND m.status_id != '0') OR (m.type_id IN('14') AND m.status_id = '1') OR (m.type_id IN('5') AND m.status_id != '0' AND (m.connectedTo is null OR m.connectedTo =1))`;
    }
    else if (req.type_id == 'afterpress1') {
        wh_type_id = `m.type_id IN('12','22','26','16','18','25','23', '41','42','43','44','45','46','47','51') AND m.status_id != '0'`;
    }
    else if (req.type_id === 'afterpress2') {
        wh_type_id = `(m.type_id IN('1','6','5','10','11','14','19','20','53','54') AND m.status_id != '0') OR (m.type_id IN('14') AND m.status_id = '1') OR (m.type_id IN('5') AND m.status_id != '0' AND (m.connectedTo is null OR m.connectedTo =1))`;

    } else if (req.type_id === "afterpress3") {
        wh_type_id = `m.type_id IN('7','9','21') AND m.machine_id != '' `;
    } else if (req.type_id === "cutting") {
        wh_type_id = `m.type_id IN('52') AND m.status_id != '0'`;
    } else {
        wh_type_id = `m.type_id IN('${req.type_id}') AND m.status_id != '0'`;
    }
    const sqlDataMachine = `SELECT
                                m.machine_id,
                                m.machine_name
                            FROM
                                mi.dbo.machine AS m
                            WHERE
                            ${wh_type_id}
                            ORDER BY
                                m.type_id ASC,
                                m.machine_id ASC,
                                isnull(m.graph_sequence, 0) ASC `;
    let machineList = (await connection.query(sqlDataMachine))[0];
    let holidayList = await getDataHoliday(req.search_date1, req.search_date2);
    return {
        machineList,
        holidayList,
    }
}

const getDataHoliday = async (search_date1, search_date2) => {
    const sqlDataHoliday = `SELECT
                                holiday_date AS holiday
                            FROM
                                HRM.dbo.hrm_holiday
                                WHERE holiday_date BETWEEN '${search_date1}' AND '${search_date2}' `;
    let holidayList = (await connection.query(sqlDataHoliday))[0];
    return holidayList;
}

const getDataPlanModel = async (req) => {
    var str_wh = "";
    if (req.type_id == 'afterpress') {
        str_wh = ` AND ( mac.type_id IN ('12','22','26','16','18','25','23','41','42','43','44','45','46','47','51','1','6','5','10','11','14','19','20','53','54','21','9','7') OR (mac.type_id='14' and mac.status_id='1'))  AND mp.machine_id != '' `;
    }
    else if (req.type_id === 'afterpress1') {
        str_wh = ` AND ( mac.type_id IN ('12','22','26','16','18','25','23','41','42','43','44','45','46','47','51')) AND mp.machine_id != '' `;
    }
    else if (req.type_id === 'afterpress2') {
        str_wh = ` AND (mac.type_id IN ('1','6','5','10','11','14','19','20','53','54') OR (mac.type_id='14' and mac.status_id='1')) AND mp.machine_id != '' `;

    } else if (req.type_id === "cutting") {
        str_wh = ` AND mac.type_id IN('52') AND mp.machine_id!='' `;

    } else if (req.type_id === "afterpress3") {
        str_wh = ` AND mac.type_id IN('7','9','21') AND mp.machine_id != '' `;

    } else {
        str_wh = ` AND mac.type_id IN('${req.type_id}') AND mp.machine_id != '' `;
    }
    var sqlDataPlan = `SELECT
                                mp.id,
                                f.firstname,
                                f.lastname,
                                mp.machine_id,
                                mp.plan_date,
                                mp.jobid,
                                mi.job_name,
                                mp.quantity,
                                mp.priority,
                                mp.job_status_id,
                                mp.shift_id,
                                mp.detail,
                                mp.hr1 AS hr,
                                mp.waste,
                                mp.waste AS quantity2,
                                ISNULL(mp.partName, '') AS partnameB,
                                d.partTypeID,
                                mp.paper_type,
                                mp.paper_gm,
                                mp.paper_roll,
                                mp.paper_sheet AS qty_paper,
                                mi.dbo.fun_has_timesheet(mp.id) AS has_timesheet,
                                et.qty
                                
                            FROM
                                mi.dbo.machine_planning AS mp
                            LEFT JOIN mi.dbo.machine AS mac ON mp.machine_id = mac.machine_id
                            LEFT JOIN mi.dbo.mi ON mp.jobid = mi.jobid
                            LEFT JOIN mi.dbo.mi_item AS d ON mp.jobid = d.jobid AND mp.itid = d.itid
                            LEFT JOIN mi.dbo.employee AS f ON mi.emp_id = f.emp_id
                            OUTER APPLY ( 
                                SELECT
                                    c.plan_id,
                                    SUM(e.qty) AS qty
                                FROM
                                    mi.dbo.timesheet_header AS c
                                INNER JOIN mi.dbo.timesheet_item AS e ON e.header_id = c.header_id
                                WHERE
                                    c.plan_id = mp.id
                                AND c.machine_id NOT LIKE 'P%'
                                GROUP BY c.plan_id
                            ) AS et
                            WHERE
                                1 = 1
                            AND mp.plan_date BETWEEN '${req.search_date1}' AND '${req.search_date2}'
                            ${str_wh}
                            AND mp.shift_id != 0
                            GROUP BY 
                                                mp.quantity,
                                                mp.priority,
                                                mp.itid,
                                                mp.id,
                                                mp.machine_id,
                                                mp.plan_date,
                                                mp.jobid,
                                                mp.job_status_id,
                                                mp.shift_id,
                                                mp.detail,
                                                mp.waste,
                                                mp.hr1,
                                                mp.waste,
                                                mp.partName,
                                                d.partTypeID,
                                                mi.job_name,
                                                mi.emp_id,
                                                mp.paper_type,
                                                mp.paper_gm,
                                                mp.paper_roll,
                                                mp.paper_sheet,
                                                f.firstname,
                                                f.lastname,
                                                et.qty
                            ORDER BY
                                            mp.machine_id,
                                            mp.plan_date ASC,
                                            mp.shift_id ASC,
                                            mp.priority ASC 
    
    /*;with mp as(
                                SELECT
                                m.quantity,
                                m.priority,
                                m.itid,
                                m.id,
                                m.machine_id,
                                m.plan_date,
                                m.jobid,
                                m.job_status_id,
                                m.shift_id,
                                m.detail,
                                m.waste,
                                m.hr1 AS hr,
                                m.waste AS quantity2,
                                ISNULL(m.partName,'') AS partName,
                                d.partTypeID,
                                isnull(g.job_name,null ) as job_name,
                                g.jobid as mi_jobid,
                                g.emp_id,
                                m.paper_type,
                                m.paper_gm,
                                m.paper_roll,
                                m.paper_sheet
                            FROM
                                mi.dbo.machine_planning m
                            LEFT JOIN mi.dbo.machine ma ON m.machine_id = ma.machine_id
                            LEFT JOIN mi.dbo.mi_item d ON m.jobid = d.jobid AND m.itid = d.itid
                            LEFT OUTER JOIN mi.dbo.mi g ON m.jobid = g.jobid
                            WHERE
                                1 = 1 AND m.shift_id != 0
                           ${str_wh}
                            AND m.plan_date BETWEEN '${req.search_date1}' AND '${req.search_date2}'
                            GROUP BY
                                m.quantity,
                                m.priority,
                                m.itid,
                                m.id,
                                m.machine_id,
                                m.plan_date,
                                m.jobid,
                                m.job_status_id,
                                m.shift_id,
                                m.detail,
                                m.waste,
                                m.hr1,
                                m.waste,
                                m.partName,
                                d.partTypeID,
                                g.job_name,
                                g.jobid,
                                g.emp_id,
                                m.paper_type,
                                m.paper_gm,
                                m.paper_roll,
                                m.paper_sheet

                            )
                            SELECT
                                a.id,
                                f.firstname,
                                f.lastname,
                                a.machine_id,
                                a.plan_date,
                                a.jobid,
                                a.job_status_id,
                                a.shift_id,
                                a.detail,
                                a.waste,
                                a.hr,
                                isnull(a.job_name, NULL) AS job_name,
                                a.partName AS partnameB,
                                isnull(a.partTypeID, 0) AS partTypeID,
                                a.quantity2,
                                SUM(e.qty) AS qty,
                                mi.dbo.fun_has_timesheet(a.id) AS has_timesheet,
                                a.paper_type,
                                a.paper_gm,
                                a.paper_roll,
                                a.paper_sheet AS qty_paper
                            FROM
                                mp a
                            LEFT OUTER JOIN mi.dbo.timesheet_header c ON a.id = c.plan_id AND c.machine_id NOT LIKE 'P%'
                            LEFT OUTER JOIN mi.dbo.timesheet_item e ON c.header_id = e.header_id
                            LEFT OUTER JOIN mi.dbo.employee f ON a.emp_id = f.emp_id

                            GROUP BY
                                a.id,
                                a.shift_id,
                                a.priority,
                                a.quantity,
                                a.waste,
                                f.firstname,
                                f.lastname,
                                a.machine_id,
                                a.plan_date,
                                a.jobid,
                                a.job_status_id,
                                a.detail,
                                a.waste,
                                a.hr,
                                a.job_name,
                                a.partName,
                                a.partTypeID,
                                a.quantity2,
                                a.paper_type,
                                a.paper_gm,
                                a.paper_roll,
                                a.paper_sheet
                            ORDER BY
                                a.machine_id,
                                a.plan_date ASC,
                                a.shift_id ASC,
                                a.priority ASC 
                                */`;
    if (req.type_id == 10 || req.type_id == 34 || req.type_id == 35 || req.type_id == 74) {
        sqlDataPlan = `EXEC mi.dbo.getMasterPlanDragAndDrop ${req.type_id},'${req.search_date1}','${req.search_date2}'`;
    }
    let plansList = (await connection.query(sqlDataPlan))[0];
    // let hrList = await getHr(str_wh, search_date1, search_date2);
    return {
        plansList
        // , hrList
    }
}

const getHr = async (str_wh, search_date1, search_date2) => {
    const sql_hr = `SELECT sum(convert (int,hr1)) as hr1,
                    (sum(hr1 -convert (int,hr1)))*100 as hr2,
                    m.machine_id as machine,
                    plan_date as date,
                    machine_name as machine_n
                    FROM mi.dbo.machine_planning AS m
                    JOIN mi.dbo.machine AS mac ON m.machine_id=mac.machine_id
                    WHERE 1=1 AND shift_id != 0 ${str_wh}AND m.plan_date between '${search_date1}' and '${search_date2}'
                    GROUP BY m.machine_id,plan_date,machine_name`;
    let hrList = (await connection.query(sql_hr))[0];
    return hrList;
}

const getDataModel = async (req, transaction) => {
    let { targetDate, targetMachine } = req
    var wh = "";
    if (targetDate != "") {
        wh += ` AND a.plan_date between '${targetDate}' and '${targetDate}' `;
    }

    if (targetMachine != "") {
        wh += ` AND a.machine_id='${targetMachine}'`;
    }
    const sql_find_type_id = `SELECT type_id FROM mi.dbo.machine WHERE machine_id = '${targetMachine}'`;
    let plandDtaList = await connection.query(sql_find_type_id)
        .then(async ([data]) => {
            // console.log('219 :>> ', data[0].type_id);
            if (data) {
                var sql_data = `SELECT
                        a.id,
                        f.firstname,
                        f.lastname,
                        a.machine_id,
                        a.plan_date,
                        a.jobid,
                        a.job_status_id,
                        a.shift_id,
                        a.detail,
                        a.waste,
                        a.hr1 AS hr,
                        isnull(g.job_name, NULL) AS job_name,
                        ISNULL(a.partName, '') AS partnameB,
                        isnull(d.partTypeID, 0) AS partTypeID,
                        a.plan_date,
                        a.waste AS quantity2,
                        SUM(qty) AS qty,
                        MIN(g.jobid) mi_jobid,
                        mi.dbo.fun_has_timesheet(a.id) AS has_timesheet
                    FROM
                        mi.dbo.machine_planning AS a
                    JOIN mi.dbo.machine AS b ON a.machine_id = b.machine_id
                    LEFT OUTER JOIN mi.dbo.timesheet_header AS c ON a.id = c.plan_id
                    AND c.machine_id NOT LIKE 'P%'
                    LEFT OUTER JOIN mi.dbo.timesheet_item AS e ON c.header_id = e.header_id
                    LEFT OUTER JOIN mi.dbo.mi_item AS d ON a.jobid = d.jobid
                    AND a.itid = d.itid
                    LEFT OUTER JOIN mi.dbo.mi AS g ON a.jobid = g.jobid
                    LEFT OUTER JOIN mi.dbo.employee AS f ON g.emp_id = f.emp_id
                    WHERE 
                        1 = 1 AND a.shift_id != 0 ${wh}
                    GROUP BY
                        a.id,
                        a.shift_id,
                        a.priority,
                        a.quantity,
                        a.waste,
                        f.firstname,
                        f.lastname,
                        a.machine_id,
                        a.plan_date,
                        a.jobid,
                        a.job_status_id,
                        a.detail,
                        a.waste,
                        a.hr1,
                        g.job_name,
                        a.partName,
                        d.partTypeID,
                        a.plan_date
                    ORDER BY
                        a.machine_id,
                        a.plan_date,
                        a.shift_id,
                        a.priority ASC`;
                if (data[0].type_id == 10 || data[0].type_id == 34 || data[0].type_id == 35 || data[0].type_id == 74) {
                    sql_data = `EXEC mi.dbo.getMasterPlanDragAndDrop_Machine '${targetDate}','${targetDate}','${targetMachine}'`;
                }
                return (await connection.query(sql_data))[0];
            }

        })
        .catch((err) => {
            console.log('err :>> ', err);
        })
    return plandDtaList;
}

const getDataHrModel = async (req, transaction) => {
    console.log('248 :>> ', req);
    // const {target_Date,target_Machine} = req
    // var target_DateLast = req.targetDateLast
    const target_Date = req.targetDate
    const target_Machine = req.targetMachine
    var str_hr_wh = "";
    if (target_Date != "") {
        str_hr_wh += ` AND a.plan_date between '${target_Date}' and '${target_Date}' `;
    }  // else {
    //     str_hr_wh += `AND a.plan_date between '${target_Date}' and '${target_DateLast}'`;
    // }

    if (target_Machine != "") {
        str_hr_wh += ` AND a.machine_id='${target_Machine}'`;
    }
    const sql_data_hr = `SELECT
                            SUM(CONVERT(INT, hr1)) AS hr1,
                            (SUM(hr1 - CONVERT(INT, hr1))) * 100 AS hr2,
                            a.machine_id AS machine,
                            plan_date AS date,
                            machine_name AS machine_n
                        FROM
                            mi.dbo.machine_planning AS a
                        JOIN mi.dbo.machine AS b ON a.machine_id = b.machine_id
                        WHERE
                            1 = 1 AND shift_id != 0 ${str_hr_wh}
                        GROUP BY
                            a.machine_id,
                            plan_date,
                            machine_name`;
    let dataHrList = await (connection.query(sql_data_hr));
    // console.log('dataHrList :>> ', dataHrList);
    return dataHrList[0];
}

const sendDataPlanMoveModel = async (req, transaction) => {
    // console.log('280 :>> ', req);
    var { original_id, machine_id, machine_id, shift_id, plan_date, id, saleman_id } = req
    var result = {
        success: 0,
        message: ""
    };
    // 1. original should be existing
    /* let type_id_denied = [5, 5]
    const sql_check_plan = `SELECT
                                COUNT(*) AS countID
                            FROM
                                mi.dbo.machine_planning
                            WHERE
                                id = '${original_id}'
                            AND plan_date = '${original_plan_date}'
                            AND machine_id = '${original_machine_id}'
                            AND shift_id = ${original_shift_id}
                            `;
    await connection.query(sql_check_plan).then(([data]) => {
        // console.log('298 :>> ', data[0].countID);
        if (data[0].countID == 0) {
            result.success = 2;
            result.message = "Original plan does not exist anymore!"
        }
        if (result.success == 2) {
            return result;
        }
    })
        .catch(() => {
            result.success = 0;
        }) */
    // 2. original should not be recorded as a timesheet source
    const sql_check_timesheet = `SELECT mi.dbo.fun_has_timesheet(${original_id}) AS has_timesheet`;
    await connection.query(sql_check_timesheet).then(([data]) => {
        // console.log('323 :>> ', data[0].has_timesheet);
        if (data[0].has_timesheet == 1) {
            result.success = 2;
            result.message = "This plan has been attached to a timesheet!"
            return result;
        }
    })
    .catch(() => {
        result.success = 0;
    })
    // 3. hard cover is not allowed in drag and drop
    /*const sql_check_allowed = `SELECT
                                    m.type_id,
                                    mt.type_name
                                FROM
                                    mi.dbo.machine_planning AS mp
                                LEFT JOIN machine AS m ON m.machine_id = mp.machine_id
                                LEFT JOIN machine_type AS mt ON mt.type_id = m.type_id
                                WHERE
                                    mp.id = ${original_id}
                            `;
    await connection.query(sql_check_allowed).then(([data]) => {
        // console.log('319 :>> ', data[0].type_id);
        // console.log('320 :>> ', data[0].type_name);
        if (type_id_denied.includes(data[0].type_id)) {
            result.success = 2;
            result.message = `${data[0].type_name} is not allowed to use drag and drop!`
        }
    })
        .catch(() => {
            result.success = 0;
        })*/
    console.log('result.success :>> ', result.success);
    if (result.success == 2) {
        return result;
    } else {
        var modifiedUserUpdateStatement = "";
        var i = 0;
        if (id != undefined) {
            if (id.length > 0) {
                for (let i = 0; i < id.length; i++) {
                    const element = id[i];
                    // console.log('355 :>> ', element);
                    if (element == original_id) {
                        modifiedUserUpdateStatement = ` , saleman_id = '${saleman_id}', key_date = CONVERT(VARCHAR(20), GETDATE(), 20) `;
                    } else {
                        modifiedUserUpdateStatement = "";
                    }
                    const sql_update = `UPDATE mi.dbo.machine_planning SET 
                                        machine_id = '${machine_id}',
                                        shift_id = '${shift_id}',
                                        plan_date = '${plan_date}',
                                        priority = ${i},
                                        default_machine_id = ''
                                        ${modifiedUserUpdateStatement}
                                    WHERE id = '${element}'`;
                    // console.log('369 :>> ', sql_update);
                    await connection.query(sql_update)
                        .then(() => {
                            result.success = 1;
                            result.message = "สำเร็จ"
                        })
                        .catch(() => {
                            result.message = "อัปเดตไม่สำเร็จ"
                            result.success = 0;
                        })

                }
            }
        }
        return result;
    }
}

const sendDataPlanMoveThoseBehindModel = async (req, transaction) => {
    var { original_id, original_plan_date, original_machine_id, original_shift_id, machine_id, machine_id, shift_id, plan_date, id, moveNow } = req
    var result = {
        success: 0,
        message: ""
    };
    // 1. original should be existing
    let type_id_denied = [5, 5]
    const sql_check_plan = `SELECT
                                COUNT(*) AS countID
                            FROM
                                mi.dbo.machine_planning
                            WHERE
                                id = '${original_id}'
                            AND plan_date = '${original_plan_date}'
                            AND machine_id = '${original_machine_id}'
                            AND shift_id = ${original_shift_id}
                            `;
    await (connection.query(sql_check_plan)[0]).then(([data]) => {
        // console.log('298 :>> ', data.countID);
        if (data.countID == 0) {
            result.success = 2;
            result.message = "Original plan does not exist anymore!"
        }
    })
        .catch(() => {
            result.success = 0;
        })
    // 2. original should not be recorded as a timesheet source
    const sql_check_timesheet = `SELECT
                                    COUNT(*) AS countID
                                FROM
                                    mi.dbo.timesheet_header
                                WHERE
                                    plan_id = ${original_id}
                            `;
    await (connection.query(sql_check_timesheet)[0]).then(([data]) => {
        console.log('307 :>> ', data.countID);
        if (data.countID > 0) {
            result.success = 2;
            result.message = "This plan has been attached to a timesheet!"
        }
    })
        .catch(() => {
            result.success = 0;
        })
    // 3. hard cover is not allowed in drag and drop
    const sql_check_allowed = `SELECT
                                    m.type_id,
                                    mt.type_name
                                FROM
                                    mi.dbo.machine_planning AS mp
                                LEFT JOIN machine AS m ON m.machine_id = mp.machine_id
                                LEFT JOIN machine_type AS mt ON mt.type_id = m.type_id
                                WHERE
                                    mp.id = ${original_id}
                            `;
    await (connection.query(sql_check_allowed)[0]).then(([data]) => {
        console.log('319 :>> ', data.type_id);
        console.log('320 :>> ', data.type_name);
        if (type_id_denied.includes(data.type_id)) {
            result.success = 2;
            result.message = `${data.type_name} is not allowed to use drag and drop!`
        }
    })
        .catch(() => {
            result.success = 0;
        })
    if (result.success == 2) {
        return result;
    } else {
        const sql = `EXEC ChangeDateMachinePlanning @id = ${original_id}, @newPlandate = '${plan_date}', @moveNow = ${moveNow}`;
        await (connection.query(sql)[0]).then(([rs_changdate]) => {
            console.log('454 :>> ', rs_changdate);
            if (!moveNow) {
                // print out the result and ask for confirmation
                let moveList = rs_changdate
            } else {

            }
            result.success = 1;
            result.message = "สำเร็จ"
        })
            .catch(() => {
                result.message = "อัปเดตไม่สำเร็จ"
                result.success = 0;
            })
        var modifiedUserUpdateStatement = "";
        id.forEach(element => {
            if (element == original_id) {
                modifiedUserUpdateStatement = ` , saleman_id = ${saleman_id}, key_date = convert(varchar(20),getdate(),20) `;
            } else {
                modifiedUserUpdateStatement = "";
            }

            const sql_update = `UPDATE mi.dbo.machine_planning SET 
                                    machine_id = '${machine_id}',
                                    shift_id = '${shift_id}',
                                    plan_date = '${plan_date}',
                                    priority = ${i + 1},
                                    default_machine_id = ''
                                    ${modifiedUserUpdateStatement}
                                WHERE id = '${element}'`;
            await(connection.query(sql_update)[0]).then(([data]) => {
                result.success = 1;
                result.message = "สำเร็จ"
            })
                .catch(() => {
                    result.message = "อัปเดตไม่สำเร็จ"
                    result.success = 0;
                })

        });

        return result;
    }
}

const checkTimeSheetModel = async (req, transaction) => {
    const sql_check_timesheet = `SELECT mi.dbo.fun_has_timesheet(${req.plan_id}) AS has_timesheet`;
    let has_timesheet = await (connection.query(sql_check_timesheet));
    return has_timesheet[0];
}

const getPaperInfoModel = async (req, transaction) => {
    const sql_po = `   SELECT
                            pd.po_number,
                            pd.item_code,
                            pd.item_name,
                            pd.qty,
                            u.unit_name,
                            CASE
                        WHEN ph.po_status = 0 THEN
                            'Created'
                        WHEN ph.po_status = 1 THEN
                            'Canceled'
                        WHEN ph.po_status = 2 THEN
                            'Final'
                        WHEN ph.po_status = 3 THEN
                            'Received'
                        WHEN ph.po_status = 4 THEN
                            'Rejected'
                        END AS po_status
                        FROM
                            PURCH.dbo.po_detail pd
                        LEFT JOIN PURCH.dbo.po_head ph ON ph.po_number = pd.po_number
                        LEFT JOIN PURCH.dbo.unit u ON u.unit_id = pd.unit_id
                        WHERE
                            pd.po_number LIKE '[e,l]p%'
                        AND pd.jobid = '${req.jobID}'`;

    const sql_receive = `SELECT
                            rh.receive_date,
                            rd.item_code,
                            rd.item_name,
                            rd.qty,
                            u.unit_name
                        FROM
                            PURCH.dbo.receive_head AS rh
                        LEFT JOIN PURCH.dbo.receive_detail AS rd ON rd.receive_number = rh.receive_number
                        LEFT JOIN PURCH.dbo.unit AS u ON u.unit_id = rd.unit_id
                        WHERE
                            rh.po_number LIKE '[e,l]p%'
                        AND rh.receive_status = 1
                        AND EXISTS (
                            SELECT
                                po_number
                            FROM
                                PURCH.dbo.po_detail AS pd
                            WHERE
                                pd.po_number = rh.po_number
                            AND pd.jobid = '${req.jobID}')`;

    const sql_booking = `SELECT
                            h.book_number,
                            parts.partNames,
                            d.qty
                        FROM
                            PURCH.dbo.book_head AS h
                        INNER JOIN PURCH.dbo.book_detail AS d ON d.book_number = h.book_number
                        INNER JOIN PURCH.dbo.book_detail_item AS i ON i.book_detail_id = d.book_detail_id
                        INNER JOIN (
                            SELECT
                                main.book_number,
                                LEFT (
                                    main.parts,
                                    Len(main.parts) - 1
                                ) AS partNames
                            FROM
                                (
                                    SELECT DISTINCT
                                        i2.book_number,
                                        (
                                            SELECT
                                                mii.partname + ', ' AS [text()]
                                            FROM
                                                PURCH.dbo.book_detail_item AS i
                                            INNER JOIN PURCH.dbo.book_head AS h ON h.book_number = i.book_number
                                            INNER JOIN mi.dbo.mi_item AS mii ON mii.jobid = h.jobid COLLATE thai_ci_as
                                            AND mii.itid = i.itid
                                            WHERE
                                                i.book_number = i2.book_number
                                            ORDER BY
                                                i.book_number FOR XML PATH ('')
                                        ) AS parts
                                    FROM
                                        PURCH.dbo.book_detail_item i2
                                ) main
                        ) parts ON parts.book_number = h.book_number
                        WHERE
                            h.jobid = '${req.jobID}'
                        AND i.itid = ${req.itid}
                        AND h.book_type IN (0, 8) -- to FW
                        AND h.book_status != 2`;

    const sql_fwReceive = `  SELECT
                                h.book_number,
                                CONVERT (VARCHAR(16), t. TIMESTAMP, 20) AS docDate,
                                t.qty
                            FROM
                                PURCH.dbo.fw_receive_transfer AS t
                            INNER JOIN PURCH.dbo.book_detail_item AS i ON i.book_detail_id = t.book_detail_id
                            INNER JOIN PURCH.dbo.book_head AS h ON h.book_number = i.book_number
                            WHERE
                                t.receive_transfer_status = 1
                            AND t.receive_type IN (1, 3)
                            AND h.jobid = '${req.jobID}'
                            AND i.itid = ${req.itid}`;

    const sql_fw_distribution = `SELECT
                                    mr.due_id,
                                    mr.receive_qty AS qty,
                                    CONVERT(VARCHAR (16),mr.receive_date,20) AS receive_date
                                FROM
                                    PURCH.dbo.fw_machine_receive AS mr
                                WHERE
                                    mr.due_id = ${req.id}`;

    const sql_part_wi = `   SELECT
                                i.totSPaper1
                            FROM
                                mi.dbo.mi_item AS i
                            WHERE
                                i.jobid = '${req.jobID}'
                            AND i.itid = ${req.itid}`;

    const sql_involved_part_wi = `  SELECT
                                        i.totalPaperOfITIDInvolved AS wi,
                                        i.receivedOfITIDInvolved AS receive
                                    FROM
                                        mi.dbo.vw_checkPartPaperReceived AS i
                                    WHERE
                                        i.jobid = '${req.jobID}'
                                    AND i.itid = ${req.itid}`;

    const sql_rs_plan = `SELECT
                        i.is_ink_ready,
                        i.ink_remark,
                        i.is_paper_trim_ready,
                        i.paper_trim_qty,
                        i.paper_trim_remark,
                        CONVERT (VARCHAR (10),i.updatedAt,103) + ' ' +  CONVERT (VARCHAR (5),i.updatedAt,108) AS updatedAt,
                        i.update_by,
                        vw_employee.emp_name,
                        i.is_diecut_ready,
                        i.diecut_remark,
                        i.diecut_number,
                        m.type_id,
                        i.plan_date,
                        i.machine_id
                    FROM
                        mi.dbo.machine_planning AS i
                    LEFT JOIN mi.dbo.machine AS m ON m.machine_id = i.machine_id
                    LEFT JOIN mi.dbo.vw_employee ON vw_employee.emp_id = i.update_by COLLATE Thai_CI_AI
                    WHERE
                        i.id = ${req.id}`;

    let po_list = await (connection.query(sql_po)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    let receive_list = await (connection.query(sql_receive)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    let booking_list = await (connection.query(sql_booking)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    let fwReceive_list = await (connection.query(sql_fwReceive)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    let fw_distribution_list = await (connection.query(sql_fw_distribution)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    let part_wi_list = await (connection.query(sql_part_wi)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    let involved_part_wi_list = await (connection.query(sql_involved_part_wi)).then(([data]) => {
        if (data.length > 0) {
            return data
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })

    let rs_plan_list = await (connection.query(sql_rs_plan)).then(([data]) => {
        if (data.length > 0) {
            return data[0]
        } else {
            return []
        }

    })
        .catch((err) => {
            return []
        })
    return {
        po_list,
        receive_list,
        booking_list,
        fwReceive_list,
        fw_distribution_list,
        part_wi_list,
        involved_part_wi_list,
        rs_plan_list
    }
}

const setPaperAndInkReadyModel = async (req, transaction) => {
    console.log('799 :>> ', req);
    var result = {};
    const { is_ink_ready, ink_remark, is_paper_trim_ready, paper_trim_remark, paper_trim_qty, is_diecut_ready, diecut_remark, diecut_number, id, login_emp_id } = req
    var update_con = "";

    if (is_ink_ready != "") {
        update_con += `is_ink_ready = ${is_ink_ready} , ink_remark = '${ink_remark}'`;
    }
    if (is_paper_trim_ready != "") {
        if (update_con !== "") {
            update_con += ","
        }
        update_con += `is_paper_trim_ready = ${is_paper_trim_ready}, paper_trim_qty = '${paper_trim_qty}', paper_trim_remark = '${paper_trim_remark}' `;
    }
    if (is_diecut_ready != "") {
        if (update_con !== "") {
            update_con += ","
        }
        update_con += `is_diecut_ready = ${is_diecut_ready}, diecut_remark='${diecut_remark}', diecut_number = '${diecut_number}' `;
    }

    if (update_con !== "") {
        update_con += `,update_by = '${login_emp_id}', updatedAt = GETDATE()`;
    }

    const sql_updated = `UPDATE mi.dbo.machine_planning SET ${update_con} WHERE id = ${id}`;
    await (connection.query(sql_updated)).then(([data]) => {
        result.success = 1;
        result.message = "สำเร็จ"
    })
        .catch(() => {
            result.message = "อัปเดตไม่สำเร็จ"
            result.success = 0;
        })
    return result;
    // const sql_set_diecut_status = `EXEC mi.dbo.set_diecut_status @id = '${plan_id}'`;
    // await (connection.query(sql_set_diecut_status));

}

module.exports = {
    getDataMachineModel,
    getDataPlanModel,
    getDataHoliday,
    getHr,
    getDataModel,
    getDataHrModel,
    sendDataPlanMoveModel,
    sendDataPlanMoveThoseBehindModel,
    checkTimeSheetModel,
    getPaperInfoModel,
    setPaperAndInkReadyModel
}