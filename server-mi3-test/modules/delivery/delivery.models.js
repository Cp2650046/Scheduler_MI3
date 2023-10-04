const connection = require('../../config/connection')
const moment = require('moment')
const numeral = require('numeral')

/* ---------- Delivery - Master ----------*/
const masterVehicleModel = async (req, transaction)=>{
    const sql = `
        SELECT
            vehicle_licens.id AS id,
            vehicle_licens.vhid AS vh_id,
            vehicle_licens.vhregno AS vh_number,
            vehicle_licens.owner AS vh_owner_id,
            vehicle_owner.comp_name AS vh_owner_name
        FROM mi.dbo.vehicle AS vehicle_licens
        LEFT JOIN mi.dbo.employeed_car_company AS vehicle_owner ON vehicle_owner.comp_id = vehicle_licens.owner
        WHERE status_id = 1
        ORDER BY vehicle_licens.vhid ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const masterVehicleEmployeeModel = async (req, transaction)=>{
    let wh_clause = ""
    if(typeof req.term === 'object'){
        if(req.term[0] != ""){
            wh_clause = `
                AND (vehicle_employee.vehicle_emp_id LIKE '%${req.term[0]}%' 
                OR hrm_employee.emp_firstname_th LIKE '%${req.term[0]}%'
                OR hrm_employee.emp_lastname_th LIKE '%${req.term[0]}%')
            `
        }
    }
    const sql = `
        SELECT
            vehicle_employee.id,
            vehicle_employee.vehicle_emp_id,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS vehicle_emp_name,
            vehicle_employee.vehicle_position_id
        FROM DR_DO.dbo.tb_master_vehicle_employee AS vehicle_employee
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = vehicle_employee.vehicle_emp_id COLLATE Thai_CI_AS
        WHERE vehicle_employee.actived = 1
        ${wh_clause}
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getRequestWorkTypeModel = async (req, transaction)=>{
    const sql = ` 
        SELECT * FROM DR_DO.dbo.tb_master_request_type_work
        INNER JOIN DR_DO.dbo.tb_master_request_type ON tb_master_request_type.request_type_id = tb_master_request_type_work.request_type_id
        WHERE tb_master_request_type.actived = 1 AND tb_master_request_type_work.actived = 1
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const insertRequestWorkTypeModel = async (req, transaction)=>{
    const { request_type, request_work_type } = req
    return await connection.query(`
        INSERT INTO DR_DO.dbo.tb_master_request_type_work (request_type_id, request_work_type) VALUES (${request_type}, '${request_work_type}')
    ` , {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

/* ---------- Delivery - JOB ----------*/
const getListJobModel = async (req, transaction)=>{
    const sql = ` 
        SELECT
            mi.jobid AS job_id,
            mi.job_name,
            mi.qty1 AS job_quantity,
            ISNULL(mi.ok1, '') AS ok_date,
            mi.createDate AS created,
            mi.goToLaos AS job_laos,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS emp_name,
            ISNULL(customer.custName, '') AS customer_name
        FROM mi.dbo.mi
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10)) 
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        --WHERE mi.jobid NOT IN (SELECT JobId FROM mi.dbo.mi_delivery)
        WHERE mi.jobid IN (
            'J12200195',
            'J12200086',
            'J52201223',
            'J82201590',
            'J52201050',
            'J82201799',
            'J82201284',
            'J52200636',
            'J12200055',
            'J12100205'
        )
        AND mi.docType = 'job'
        ORDER BY mi.createDate DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getDetailJobModel = async (req, transaction)=>{
    const { job_id } = req
    const sql = `
        SELECT
            mi.jobid AS job_id,
            mi.job_name,
            mi.emp_id AS ae_emp_id,
            hrm_employee.emp_firstname_th+' '+hrm_employee.emp_lastname_th AS ae_emp_name,
            mi.custid AS customer_id,
            mi.qty1 AS quantity,
            mi.qty1 - ISNULL(dr.dr_quantity, 0) AS balance,
            mi.custid AS customer_id,
            customer.custName AS customer_name,
            mi.due1 AS due_date,
            mi.goToLaos AS is_laos,
            mi.is_wrap
        FROM mi.dbo.mi
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        LEFT JOIN mi.dbo.customer ON customer.custid = mi.custid
        OUTER APPLY (
            SELECT 
                SUM(tb_dr_head.dr_quantity) AS dr_quantity, job_id
            FROM DR_DO.dbo.tb_dr_head
            WHERE tb_dr_head.job_id = '${job_id}'
            AND tb_dr_head.request_work_type_id <> 3
            GROUP BY tb_dr_head.job_id
        ) dr 
        WHERE mi.JobId = '${job_id}'
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data[0]
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const saveWrapJOBModel = async (req, transaction) => {
    const { job_id, is_wrap } = req
    const sql = `UPDATE mi.dbo.mi SET mi.is_wrap = ${is_wrap} WHERE mi.jobid = '${job_id}'`
    return await connection.query(sql)
    .then(() => {
        return true
    })
    .catch(err => {
        return false
    })
}

const countMajorItemModel = async (req, transaction) => {
    const { job_id } = req
    const sql = `SELECT COUNT(*) AS count_item FROM DR_DO.dbo.tb_dr_item_major WHERE job_id = '${job_id}'`
    return await connection.query(sql)
    .then(([data]) => {
        return data[0].count_item
    })
    .catch(err => {
        return false
    })
}

const insertMajorItemModel = async (req, transaction) => {
    const { job_id, is_wrap } = req
    const sql = `
        INSERT INTO DR_DO.dbo.tb_dr_item_major
            (itid, item_name, part_type_id, unit_id, sig, job_id)
        SELECT
            mi_item.itid,
            mi_item.partName,
            mi_item.partTypeID,
            part_type.unit_id,
            mi_item.sig,
            mi_item.jobid
        FROM mi.dbo.mi_item
        INNER JOIN mi.dbo.mi_item_part_type AS part_type ON mi_item.partTypeID = part_type.partTypeID
        LEFT JOIN DR_DO.dbo.tb_master_unit AS unit ON unit.unit_id = part_type.unit_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = mi_item.jobid
        WHERE mi_item.jobid = '${job_id}'
        AND mi_item.deleted = 0
        ORDER BY mi_item.rank ASC
    `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const updateMajorItemModel = async (req, transaction) => {
    const { job_id } = req
    const sql = `
        UPDATE DR_DO.dbo.tb_dr_item_major
            SET
                itid = mi_item.itid, 
                item_name = mi_item.partName,
                part_type_id = mi_item.partTypeID,
                unit_id = part_type.unit_id,
                sig = mi_item.sig
        FROM mi.dbo.mi_item
        INNER JOIN mi.dbo.mi_item_part_type AS part_type ON mi_item.partTypeID = part_type.partTypeID
        LEFT JOIN DR_DO.dbo.tb_master_unit AS unit ON unit.unit_id = part_type.unit_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = mi_item.jobid
        WHERE mi_item.jobid = '${job_id}' AND tb_dr_item_major.job_id = '${job_id}'
        AND mi_item.deleted = 0
        AND tb_dr_item_major.itid = mi_item.itid
    `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const insertMinorItemModel = async (req, transaction) => {
    let sql = ""
    for(let i = 0; i < req.item_minor.length; i++){
        if(req.item_minor[i] == 1){
            sql += ` INSERT INTO DR_DO.dbo.tb_dr_item_minor (item_name, part_type_id, unit_id, sig, major_id, job_id) 
            VALUES ('${req.item_name[i]}', ${req.item_part_type[i]}, ${req.item_unit_id[i]}, ${req.item_sig[i]}, ${req.item_major_id[i]}, '${req.job_id}')`
        }
    }
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const saveItemJOBModel = async (req)=>{
    let count_major = await countMajorItemModel(req)
    let transaction = await connection.transaction()
    return Promise.all([
        saveWrapJOBModel(req, transaction),
        count_major === 0 ? insertMajorItemModel(req, transaction) : Promise.resolve(true),
        count_major > 0 ? updateMajorItemModel(req, transaction) : Promise.resolve(true),
    ])
    .then((data)=>{
        const notCompleted = data.some((item)=>{
            return item === false
        })
        if(notCompleted){
            throw 'Some table is not complete'
        }else{
            transaction.commit()
            return {
                success: true,
                message: 'Insert all table is successfull'
            }
        }
    }).catch((err)=>{
        transaction.rollback()
        return {
            success: false,
            message: err
        }
    })
}

/* ---------- Delivery - Datalist ----------*/
const datalistAddressModel = async (req, transaction)=>{
    const { job_id, is_laos, term } = req
    let wh_clause = ""
    if(typeof term === 'object'){
        if(term[0] != ""){
            wh_clause = `
                AND (addressName LIKE '%${term[0]}%' 
                OR fulladdr LIKE '%${term[0]}%')
            `
        }
    }
    let sql = `
        SELECT
            ISNULL(addressName + ' ' + REPLACE(fulladdr,CHAR(10),'\n'), REPLACE(fulladdr,CHAR(10),'\n')) AS field_key
        FROM mi.dbo.customer_address
        INNER JOIN mi.dbo.vw_jobGeneralInfo AS job ON 
            CASE 
                WHEN job.custID = 'C2010020' THEN 'C2010048' 
                ELSE job.custID 
            END = customer_address.custID
        WHERE job.jobid = '${job_id}'
        AND isshipping = 1 AND customer_address.deleted != 1
        ${wh_clause}
    `
    if(is_laos == 1){
        if(typeof term === 'object'){
            if(term[0] != ""){
                wh_clause = `AND source_place_address LIKE '%${term[0]}%'`
            }
        }
        sql += `
        UNION
            SELECT
                source_place_address AS field_key
            FROM DR_DO.dbo.tb_master_source_place
            WHERE source_place_id = 3
            ${wh_clause}
        `
    }
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const datalistContactModel = async (req, transaction)=>{
    const { job_id, term } = req
    let wh_clause = ""
    if(typeof term === 'object'){
        if(term[0] != ""){
            wh_clause = `
                AND (contactname LIKE '%${term[0]}%' 
                OR telephone LIKE '%${term[0]}%')
            `
        }
    }
    const sql = `
        SELECT
            contactname AS field_key, telephone AS field_show, mobilephone AS field_show2
        FROM mi.dbo.customer_contactperson ct
        INNER JOIN mi.dbo.vw_jobGeneralInfo j ON 
            CASE 
                WHEN j.custID = 'C2010020' THEN 'C2010048' 
                ELSE j.custID 
            END = ct.custID
        WHERE  j.jobid = '${job_id}'
        AND contactname IS NOT NULL
        ${wh_clause}
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

/* ---------- Delivery - DR ----------*/
const getDRModel = async (req, transaction) => {
    const { job_id } = req
    const sql = `
        SELECT
            dr.*, total.total_delivery, total.total_reject,
            request_type_work.request_work_type_name,
            source_place.source_place_name, postpone.postpone_name
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work AS request_type_work ON request_type_work.request_work_type_id = dr.request_work_type_id
        LEFT JOIN DR_DO.dbo.tb_master_source_place AS source_place ON source_place.source_place_id = dr.source_place
        LEFT JOIN DR_DO.dbo.tb_master_postpone_remark AS postpone ON postpone.postpone_id = dr.postpone_remark
        OUTER APPLY (
            SELECT 
                SUM(ISNULL(vehicle_quantity, 0)) AS total_delivery,
                SUM(ISNULL(vehicle_reject, 0)) AS total_reject
            FROM DR_DO.dbo.tb_do_vehicle
            LEFT JOIN DR_DO.dbo.tb_do_head ON tb_do_head.do_number = tb_do_vehicle.do_number
            LEFT JOIN DR_DO.dbo.tb_dr_head ON tb_dr_head.dr_number = tb_do_head.dr_number
            WHERE tb_do_head.dr_number = dr.dr_number
            AND tb_do_head.do_status > 3
            GROUP BY tb_dr_head.dr_number
        ) total
        WHERE dr.job_id = '${job_id}'
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getDetailDRModel = async (req, transaction) => {
    const { dr_number } = req
    const sql = `
        SELECT
            tb_dr_head.*, mi_fg.*,
            customer.custName AS customer_name,
            created_employee.emp_firstname_th +' '+ created_employee.emp_lastname_th AS created_emp_name,
            updated_employee.emp_firstname_th +' '+ updated_employee.emp_lastname_th AS updated_emp_name,
            mi.job_name,
            mi.qty1_runOn AS run_on
        FROM DR_DO.dbo.tb_dr_head
        LEFT JOIN mi.dbo.mi ON tb_dr_head.job_id = mi.jobid
        LEFT JOIN mi.dbo.customer ON customer.custid = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee AS created_employee ON created_employee.emp_id = tb_dr_head.created_emp_id COLLATE Thai_CI_AS
        LEFT JOIN HRM.dbo.hrm_employee AS updated_employee ON updated_employee.emp_id = tb_dr_head.updated_emp_id COLLATE Thai_CI_AS
        OUTER APPLY (SELECT mi_fg.fg_id, mi_fg.fg_name, mi_fg.fg_quantity FROM mi.dbo.mi_fg WHERE jobID = tb_dr_head.job_id) mi_fg
        WHERE tb_dr_head.dr_number = '${dr_number}'
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data[0]
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getDetailDRItemModel = async (req, transaction) => {
    let query_number = req.dr_number
    let query_table = 'tb_dr_item'
    let query_field = 'dr_number'
    let minor_field = 'tb_dr_item_minor.minor_id,'
    let minor_join = 'LEFT JOIN DR_DO.dbo.tb_dr_item_minor ON tb_dr_item_minor.item_name = item.item_name'
    let do_condition = ""
    if(typeof req.action === 'undefined'){
        if(typeof req.do_number === 'string' && req.do_number !== ""){
            query_number = req.do_number
            query_table = 'tb_do_item'
            query_field = 'do_number'
            minor_field = ""
        }
    }else{
        if(req.action === 'create' && typeof req.do_number !== 'undefined' && req.do_number !== 'null'){
            do_condition = `AND item.item_name NOT IN (SELECT item_name FROM DR_DO.dbo.tb_do_item)`
        }
        if(typeof req.do_number !== 'undefined' && req.do_number !== 'null'){
            query_number = req.do_number
            query_table = 'tb_do_item'
            query_field = 'do_number'
            minor_field = ""
        }
    }
    const sql = `
        SELECT
            item.item_name,
            item.item_quantity,
            item.item_unit_id AS unit_id,
            item.item_sig AS sig,
            item.item_part_type AS part_type_id,
            ${minor_field}
            item.item_edition,
            tb_master_unit.unit_name
        FROM DR_DO.dbo.${query_table} AS item
        LEFT JOIN DR_DO.dbo.tb_master_unit ON tb_master_unit.unit_id = item.item_unit_id
        ${minor_join}
        WHERE item.${query_field} = '${query_number}'
        ${do_condition}
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getFinishGoodsModel = async (req, transaction)=>{
    const sql = `
        SELECT
            1 AS unit_id,
            mi_fg.fg_id AS item_id,
            mi_fg.fg_name AS item_name,
            fg_sum.item_quantity
        FROM mi.dbo.mi_fg 
        OUTER APPLY (
            SELECT SUM(mi_fg.fg_quantity) AS item_quantity FROM mi.dbo.mi_fg
            WHERE mi_fg.jobid = '${req.job_id}' GROUP BY mi_fg.jobid
        ) fg_sum
        WHERE mi_fg.jobid = '${req.job_id}' ORDER BY mi_fg.rank ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getMaterialsModel = async (req, transaction)=>{
    const sql = `
            SELECT
                item_major.major_id,
                0 AS minor_id,
                item_major.item_name,
                item_major.part_type_id,
                part_type.partTypeName AS part_type_name,
                item_major.unit_id,
                unit.unit_name,
                item_major.sig
            FROM DR_DO.dbo.tb_dr_item_major AS item_major
            INNER JOIN mi.dbo.mi_item_part_type AS part_type ON item_major.part_type_id = part_type.partTypeID
            LEFT JOIN DR_DO.dbo.tb_master_unit AS unit ON unit.unit_id = item_major.unit_id
            WHERE NOT EXISTS (
                SELECT * FROM DR_DO.dbo.tb_dr_item_minor AS item_minor
                INNER JOIN mi.dbo.mi_item_part_type AS part_type ON item_minor.part_type_id = part_type.partTypeID
                LEFT JOIN DR_DO.dbo.tb_master_unit AS unit ON unit.unit_id = item_minor.unit_id
                WHERE item_minor.job_id = '${req.job_id}' AND item_minor.major_id = item_major.major_id
            ) AND item_major.job_id = '${req.job_id}'
        UNION
            SELECT
                item_minor.major_id,
                item_minor.minor_id,
                item_minor.item_name,
                item_minor.part_type_id,
                part_type.partTypeName AS part_type_name,
                item_minor.unit_id,
                unit.unit_name,
                item_minor.sig
            FROM DR_DO.dbo.tb_dr_item_minor AS item_minor
            INNER JOIN mi.dbo.mi_item_part_type AS part_type ON item_minor.part_type_id = part_type.partTypeID
            LEFT JOIN DR_DO.dbo.tb_master_unit AS unit ON unit.unit_id = item_minor.unit_id
            WHERE item_minor.job_id = '${req.job_id}'
        ORDER BY item_major.major_id ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}


const insertDRModel = async (req, transaction) => {
    const sql = `
        INSERT INTO DR_DO.dbo.tb_dr_head (
            unique_id, created_emp_id, dr_number, delivery_type_id, commercial_type, request_work_type_id,
            job_id, contact_person, contact_number, source_place, delivery_place, remark, po_number,
            delivery_date, dr_quantity, is_coa, with_invoice
        ) VALUES (
            '${req.unique_id}', '${req.created_emp_id}', '${req.dr_number}',  ${req.delivery_type_id}, ${req.commercial_type}, ${req.request_work_type_id},
            '${req.job_id}', '${req.contact_person}', '${req.contact_number}', ${req.source_place}, '${req.delivery_place}', '${req.remark}', '${req.po_number}',
            '${moment(req.delivery_date,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}',
             ${numeral(req.dr_quantity).format('0')},
             ${typeof req.is_coa === 'undefined' ? 'NULL' : req.is_coa},
             ${typeof req.with_invoice === 'undefined' ? 'NULL' : req.with_invoice}
        )
    `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const updateDRModel = async (req, transaction) => {
    const sql = `
        UPDATE DR_DO.dbo.tb_dr_head 
        SET
            request_work_type_id = ${req.request_work_type_id},
            contact_person = '${req.contact_person}',
            contact_number = '${req.contact_number}',
            source_place = ${req.source_place},
            delivery_place = '${req.delivery_place}',
            remark = '${req.remark}',
            postpone_remark = ${typeof req.postpone_remark === 'undefined' ? 'NULL' : req.postpone_remark},
            po_number = '${req.po_number}',
            is_coa = ${typeof req.is_coa === 'undefined' ? 'NULL' : req.is_coa},
            updated = GETDATE(),
            updated_emp_id = '${req.updated_emp_id}',
            dr_quantity = ${numeral(req.dr_quantity).format('0')},
            with_invoice = ${typeof req.with_invoice === 'undefined' ? 'NULL' : req.with_invoice},
            delivery_date = '${moment(req.delivery_date,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}'
        WHERE tb_dr_head.dr_number = '${req.dr_number}'
    `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const insertDRDetailModel = async (req, transaction) => {
    let sql = ""
    let x = 0
    for(let i = 0; i < req.item_name.length; i++){
        let edition = ""
        if(req.request_work_type_id == 3 && req.commercial_type == 1){
            if(req.item_unit_id[i] == 1){
                typeof req.item_edition !== 'undefined' && (
                    typeof req.item_edition[x] !== 'undefined' && (
                        req.item_edition[x].length > 0 && (
                            edition = JSON.stringify(req.item_edition[x])
                        )
                    )
                )
                x++
            }
        }
        sql += ` INSERT INTO DR_DO.dbo.tb_dr_item (
            unique_id, dr_number, item_name, item_quantity, item_unit_id, item_edition, item_part_type, item_sig 
        ) VALUES (
            '${req.unique_id}', '${req.dr_number}', '${req.item_name[i]}', ${req.item_quantity[i]}, ${req.item_unit_id[i]}, '${edition}',
            ${req.item_part_type[i] !== "" ? req.item_part_type[i] : 'NULL'}, 
            ${req.item_sig[i] !== "" ? req.item_sig[i] : 'NULL'}
        )`
    }
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deleteDRDetailModel = async (req, transaction) => {
    const { dr_number } = req
    const sql = `DELETE DR_DO.dbo.tb_dr_item WHERE dr_number = '${dr_number}'`
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deleteDRHeadModel = async (req, transaction) => {
    const { dr_number } = req
    const sql = `DELETE DR_DO.dbo.tb_dr_head WHERE dr_number = '${dr_number}'`
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const saveDRModel = async (req)=>{
    let minor_item = req.request_work_type_id == 3 && req.commercial_type == 1 ? true : false
    let transaction = await connection.transaction()
    return Promise.all([
        req.action === 'create' ? insertDRModel(req, transaction) : Promise.resolve(true),
        req.action === 'edit' ? updateDRModel(req, transaction) : Promise.resolve(true),
        req.action === 'edit' ? deleteDRDetailModel(req, transaction) : Promise.resolve(true),
        minor_item ? insertMinorItemModel(req, transaction) : Promise.resolve(true),
        insertDRDetailModel(req, transaction),
    ])
    .then((data)=>{
        console.log(data)
        const notCompleted = data.some((item)=>{
            return item === false
        })
        if(notCompleted){
            throw 'Some table is not complete'
        }else{
            transaction.commit()
            return {
                success: true,
                message: 'Insert all table is successfull'
            }
        }
    }).catch((err)=>{
        transaction.rollback()
        return {
            success: false,
            message: err
        }
    })
}

const deleteDRModel = async (req)=>{
    let count_do = await countDOModel(req)
    let transaction = await connection.transaction()
    return Promise.all([
        count_do === 0 ? deleteDRHeadModel(req, transaction) : Promise.resolve(true),
        count_do === 0 ? deleteDRDetailModel(req, transaction) : Promise.resolve(true),
    ])
    .then((data)=>{
        const notCompleted = data.some((item)=>{
            return item === false
        })
        if(notCompleted){
            throw 'Some table is not complete'
        }else{
            transaction.commit()
            return {
                success: true,
                count_do: count_do,
                message: 'Insert all table is successfull'
            }
        }
    }).catch((err)=>{
        transaction.rollback()
        return {
            success: false,
            message: err
        }
    })
}

/* ---------- Delivery - DO ----------*/
const getDRRequestDOModel = async (req, transaction)=>{
    let where_request_type = `AND dr.request_work_type_id <> 3`
    let field_item = ""
    let group_item = ""
    let outer_apply = ""
    if(req.request_type === 'materials'){
        where_request_type = `AND dr.request_work_type_id = 3`
        field_item = `item.item_name, item.item_quantity,ISNULL(item.do_number, '') AS do_number, ISNULL(item.do_quantity, '') AS do_quantity,`
        group_item = `item.do_number, item.do_quantity, do_sum.summary_do, item.item_name, item.item_quantity,`
        outer_apply = `
            OUTER APPLY (
                SELECT
                    tb_dr_item.item_name, tb_dr_item.item_quantity, tb_dr_item.dr_number,
                    tb_do_head.do_number, tb_do_head.do_quantity
                FROM DR_DO.dbo.tb_dr_item
                LEFT JOIN DR_DO.dbo.tb_do_item ON tb_do_item.item_name = tb_dr_item.item_name
                LEFT JOIN DR_DO.dbo.tb_do_head ON tb_do_head.do_number = tb_do_item.do_number
                WHERE tb_dr_item.dr_number = dr.dr_number
            ) item
        `
    }
    const sql = ` 
        SELECT
            dr.dr_number, dr.unique_id, dr.job_id,dr.delivery_date, dr.dr_quantity, dr.delivery_place,
            dr.with_invoice, dr.remark AS dr_remark, dr.postpone_remark AS postpone_id,
            dr.delivery_type_id, dr.commercial_type, dr.request_work_type_id,
            ISNULL(do_sum.summary_do, '') AS summary_do,
            ${field_item}
            tb_master_delivery_type.delivery_type_name,
            tb_master_commercial_type.commercial_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name,
            customer.custName AS customer_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name,
            mi.job_name
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN DR_DO.dbo.tb_master_commercial_type ON tb_master_commercial_type.commercial_type_id = dr.commercial_type
        LEFT JOIN DR_DO.dbo.tb_master_postpone_remark ON tb_master_postpone_remark.postpone_id = dr.postpone_remark
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id= dr.request_work_type_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        OUTER APPLY (
            SELECT 
                SUM(do_quantity) AS summary_do
            FROM DR_DO.dbo.tb_do_head
            WHERE dr_number = dr.dr_number GROUP BY dr_number
        ) do_sum
        ${outer_apply}
        WHERE ISNULL(do_sum.summary_do, 0) < dr.dr_quantity
        ${where_request_type}
        GROUP BY
            dr.dr_number, dr.unique_id, dr.job_id,dr.delivery_date, dr.dr_quantity, dr.delivery_place,
            dr.with_invoice, dr.remark, dr.postpone_remark, dr.created,
            dr.delivery_type_id, dr.commercial_type, dr.request_work_type_id,
            do_sum.summary_do,
            ${group_item}
            tb_master_delivery_type.delivery_type_name,
            tb_master_commercial_type.commercial_type_name,
            tb_master_postpone_remark.postpone_name,
            tb_master_request_type_work.request_work_type_name,
            customer.custName,
            hrm_employee.emp_firstname_th, hrm_employee.emp_lastname_th,
            mi.job_name
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getOrderDOModel = async (req, transaction)=>{
    let where_request_type = `AND dr.request_work_type_id <> 3`
    let field_item = ""
    let group_item = ""
    let outer_apply = ""
    if(req.request_type === 'materials'){
        where_request_type = `AND dr.request_work_type_id = 3`
        field_item = `
            item.id,
            item.item_name,
            item.item_quantity_do,
			item.item_quantity_dr,
            item.item_sig,
            item.item_part_type,
            item.minor_id,
            item.major_id,
            item.itid,
        `
        //group_item = `item.do_number, item.do_quantity, do_sum.summary_do, item.item_name, item.item_quantity,`
        outer_apply = `
            OUTER APPLY (
                SELECT
                    tb_do_item.id,
                    tb_do_item.item_name,
                    tb_do_item.item_quantity AS item_quantity_do,
                    tb_dr_item.item_quantity AS item_quantity_dr,
                    tb_do_item.item_sig,
                    tb_do_item.item_part_type,
                    tb_dr_item_minor.minor_id,
                    tb_dr_item_major.major_id,
                    tb_dr_item_major.itid
                FROM DR_DO.dbo.tb_do_item
                LEFT JOIN DR_DO.dbo.tb_dr_item ON tb_dr_item.item_name = tb_do_item.item_name
                LEFT JOIN DR_DO.dbo.tb_dr_item_minor ON tb_dr_item_minor.item_name = tb_dr_item.item_name
                LEFT JOIN DR_DO.dbo.tb_dr_item_major ON tb_dr_item_major.major_id = tb_dr_item_minor.major_id
                WHERE do_number = do.do_number
            ) item
        `
    }
    const sql = `
        SELECT
            dr.dr_number, dr.delivery_date, dr.dr_quantity, dr.delivery_place, dr.created,
            dr.contact_person, dr.contact_number, dr.with_invoice, dr.remark, dr.job_id,
            dr.delivery_type_id, dr.request_work_type_id, dr.commercial_type,
            do.departed, do.arrived, do.do_status,
            ISNULL(do.do_number, '') AS do_number,
            ISNULL(do.do_quantity, '') AS do_quantity,
            ISNULL(do.do_status, '') AS do_status_id,
            ISNULL(do_total.do_total_quantity, 0) AS do_total_quantity,
            /*ISNULL(do_approve.do_complete_quantity, 0) AS do_complete_quantity,*/
            ISNULL(tb_master_do_status.do_status_name, '') AS do_status_name,
            ISNULL(tb_master_do_status.do_status_class, '') AS do_status_class,
            ${field_item}
            ISNULL(vehicle.vehicle_confirm_quantity, 0) AS vehicle_confirm_quantity,
            vehicle.vehicle_owner_id,
            vehicle.vehicle_owner,
            vehicle.vehicle_licens_id,
            vehicle.vehicle_licens,
            vehicle.vehicle_driver_id,
            vehicle.vehicle_driver_name,
            vehicle.vehicle_follower,
            ISNULL(vehicle.vehicle_quantity, '') AS vehicle_quantity,
            ISNULL(vehicle.vehicle_reject, '') AS vehicle_reject,
            vehicle.vehicle_reject_remark,
            tb_master_request_type_work.request_work_type_name,
            tb_master_delivery_type.delivery_type_name,
            tb_master_commercial_type.commercial_type_name,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS ae_emp_name,
            mi.job_name, customer.custName AS customer_name
        FROM DR_DO.dbo.tb_dr_head AS dr
        LEFT JOIN DR_DO.dbo.tb_do_head AS do ON do.dr_number = dr.dr_number
        LEFT JOIN DR_DO.dbo.tb_master_do_status ON tb_master_do_status.do_status_id = do.do_status
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id = dr.request_work_type_id
        LEFT JOIN DR_DO.dbo.tb_master_delivery_type ON tb_master_delivery_type.delivery_type_id = dr.delivery_type_id
        LEFT JOIN DR_DO.dbo.tb_master_commercial_type ON tb_master_commercial_type.commercial_type_id = dr.commercial_type
        LEFT JOIN mi.dbo.mi ON mi.jobid = dr.job_id
        LEFT JOIN mi.dbo.customer ON customer.custID = mi.custid
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = CAST(mi.emp_id AS VARCHAR(10))
        ${outer_apply}
        OUTER APPLY (
            SELECT SUM(do_quantity) AS do_total_quantity
            FROM DR_DO.dbo.tb_do_head WHERE dr_number = dr.dr_number
			GROUP BY dr_number
        ) do_total
        OUTER APPLY (
            SELECT SUM(do_quantity) AS do_complete_quantity
            FROM DR_DO.dbo.tb_do_head
            WHERE do_number = do.do_number AND do_status > 3
            GROUP BY do_number
        ) do_approve
        OUTER APPLY (
            SELECT
                vehicle_total.vehicle_confirm_quantity,
                tb_do_vehicle.vehicle_owner AS vehicle_owner_id,
                tb_do_vehicle.vehicle_licens AS vehicle_licens_id,
                tb_do_vehicle.vehicle_driver AS vehicle_driver_id,
                tb_do_vehicle.vehicle_follower,
                tb_do_vehicle.vehicle_quantity,
                tb_do_vehicle.vehicle_reject,
                tb_do_vehicle.vehicle_reject_remark,
                vehicle_owner.comp_name AS vehicle_owner,
                vehicle.vhregno AS vehicle_licens,
                hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS vehicle_driver_name
            FROM DR_DO.dbo.tb_do_vehicle
            LEFT JOIN mi.dbo.employeed_car_company AS vehicle_owner ON vehicle_owner.comp_id = tb_do_vehicle.vehicle_owner
            LEFT JOIN mi.dbo.vehicle ON vehicle.owner = tb_do_vehicle.vehicle_owner AND vehicle.id = tb_do_vehicle.vehicle_licens
            LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = tb_do_vehicle.vehicle_driver COLLATE Thai_CI_AS
            OUTER APPLY (
                SELECT (SUM(tb_do_vehicle.vehicle_quantity) - SUM(tb_do_vehicle.vehicle_reject)) AS vehicle_confirm_quantity
                FROM DR_DO.dbo.tb_dr_head
                LEFT JOIN DR_DO.dbo.tb_do_head ON tb_do_head.dr_number = dr.dr_number
                LEFT JOIN DR_DO.dbo.tb_do_vehicle ON tb_do_vehicle.do_number = tb_do_head.do_number
                WHERE tb_dr_head.dr_number = dr.dr_number AND tb_do_head.do_status > 3 
                GROUP BY tb_dr_head.dr_number
            ) vehicle_total
            WHERE do_number = do.do_number
        ) vehicle
        WHERE ISNULL(do_total.do_total_quantity, 0) >= dr.dr_quantity
        ${where_request_type}
        ORDER BY dr.created DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getVehicleModel = async (req, transaction) => {
    const { do_number } = req
    const sql = `
        SELECT
            vehicle_do.vehicle_owner AS vehicle_owner_id,
            vehicle_owner.comp_name AS vehicle_owner,
            vehicle_do.vehicle_licens AS vehicle_licens_id,
            vehicle.vhregno AS vehicle_licens,
            vehicle_do.vehicle_driver AS vehicle_driver_id,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS vehicle_driver_name,
            vehicle_do.vehicle_follower, vehicle_do.vehicle_quantity,
            vehicle_do.vehicle_reject, vehicle_do.vehicle_reject_remark,
            vehicle_do.created
        FROM DR_DO.dbo.tb_do_vehicle AS vehicle_do
        LEFT JOIN mi.dbo.employeed_car_company AS vehicle_owner ON vehicle_owner.comp_id = vehicle_do.vehicle_owner
        LEFT JOIN mi.dbo.vehicle ON vehicle.owner = vehicle_do.vehicle_owner AND vehicle.id = vehicle_do.vehicle_licens
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = vehicle_do.vehicle_driver COLLATE Thai_CI_AS
        WHERE do_number = '${do_number}'
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}


const getFGQuantityModel = async (req, transaction)=>{
    const sql = `
        SELECT jobid AS job_id, SUM(fg_quantity) AS fg_quantity
        FROM mi.dbo.mi_fg WHERE jobid IN (${req}) 
        GROUP BY jobid
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getMaterialsJOBModel = async (req, transaction)=>{
    const sql = `
        SELECT
            mi.is_wrap, mi_item.itid, mi_item.partName, mi_item.partTypeID,
            part_type.partTypeName, part_type.unit_id,
            unit.unit_name,
            mi_item.sig, mi_item.ups,
            mi_item.qty1 AS qty_per_sig,
            mi_item.totPaper1 AS total_paper,
            waste_press.qty1 AS waste_press_qty,
            waste_afterpress.qty1 AS waste_afterpress_qty,
            waste_popup.qty1 AS waste_popup_qty
        FROM mi.dbo.mi_item
        INNER JOIN mi.dbo.mi_item_part_type AS part_type ON mi_item.partTypeID = part_type.partTypeID
        LEFT JOIN DR_DO.dbo.tb_master_unit AS unit ON unit.unit_id = part_type.unit_id
        LEFT JOIN mi.dbo.mi ON mi.jobid = mi_item.jobid
        CROSS APPLY (
                SELECT mi_waste.qty1 FROM mi.dbo.mi_waste
                WHERE mi_waste.jobid IN (${req})
                AND mi_waste.itid = mi_item.itid AND wasteid = 1
        ) waste_press
        CROSS APPLY (
                SELECT mi_waste.qty1 FROM mi.dbo.mi_waste
                WHERE mi_waste.jobid IN (${req})
                AND mi_waste.itid = mi_item.itid AND wasteid = 2
        ) waste_afterpress
        CROSS APPLY (
                SELECT mi_waste.qty1 FROM mi.dbo.mi_waste
                WHERE mi_waste.jobid IN (${req})
                AND mi_waste.itid = mi_item.itid AND wasteid = 3
        ) waste_popup
        WHERE mi_item.deleted = 0 AND mi_item.jobid IN (${req})
        ORDER BY mi_item.rank ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getCompleteDoModel = async (req, transaction) => {
    const { dr_number } = req
    const sql = `
        SELECT
            SUM(tb_do_head.do_quantity) AS complete_do
        FROM DR_DO.dbo.tb_dr_head
        LEFT JOIN DR_DO.dbo.tb_do_head ON tb_do_head.dr_number = tb_dr_head.dr_number
        WHERE tb_dr_head.dr_number = '${dr_number}'
        GROUP BY tb_dr_head.dr_number
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data[0].complete_do
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getDetailDOModel = async (req, transaction) => {
    const { do_number } = req
    const sql = `SELECT * FROM DR_DO.dbo.tb_do_head WHERE do_number = '${do_number}'`
    return await connection.query(sql)
    .then(([data])=>{
        return data[0]
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const countDOModel = async (req, transaction) => {
    const { dr_number } = req
    const sql = `SELECT COUNT(*) AS count_do FROM DR_DO.dbo.tb_do_head WHERE tb_do_head.dr_number = '${dr_number}'`
    return await connection.query(sql)
    .then(([data])=>{
        return data[0].count_do
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const insertDOModel = async (req, transaction) => {
    const sql = ` INSERT INTO DR_DO.dbo.tb_do_head (
        unique_id, do_number, dr_number, created_emp_id, do_status, do_quantity, do_weight, distance, departed, arrived
    ) VALUES (
        '${req.unique_id}', '${req.do_number}', '${req.dr_number}', '${req.created_emp_id}', ${1},
         ${numeral(req.do_quantity).format('0')},
         ${numeral(req.do_weight).format('0 0.00')},
         ${numeral(req.distance).format('0 0.00')},
        '${moment(req.departed,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}',
        '${moment(req.arrived,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}'
    ) `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const updateDOModel = async (req, transaction) => {
    const sql = `
        UPDATE DR_DO.dbo.tb_do_head 
        SET
            updated_emp_id = '${req.updated_emp_id}',
            do_status = ${req.do_status_id},
            updated = GETDATE(),
            departed = '${moment(req.departed,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}',
            arrived = '${moment(req.arrived,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}',
            do_quantity = ${numeral(req.do_quantity).format('0')},
            do_weight = ${numeral(req.do_weight).format('0 0.00')}
        WHERE tb_do_head.do_number = '${req.do_number}'
    `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deleteDOHeadModel = async (req, transaction) => {
    const { do_number } = req
    const sql = `DELETE DR_DO.dbo.tb_do_head WHERE do_number = '${do_number}'`
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const insertPalletDOModel = async (req, transaction) => {
    let sql = ""
    let { lasted_number, do_number, pallet_barcode } = req
    if(typeof lasted_number !== 'undefined'){
        do_number = lasted_number
    }
    pallet_barcode.forEach(pallet =>{
       sql += `INSERT INTO DR_DO.dbo.tb_do_pallet (do_number, pallet_barcode) VALUES ('${do_number}', '${pallet}')` 
    })
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deletePalletDOModel = async (req, transaction) => {
    let { do_number} = req
    let sql = `DELETE DR_DO.dbo.tb_do_pallet WHERE do_number = '${do_number}'`
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const insertItemDOModel = async (req, transaction) => {
    let sql = ""
    let { lasted_number, do_number, unique_id, 
        pallet_barcode: item_name, 
        pallet_quantity: item_quantity, 
        pallet_unit_id: item_unit_id,
        pallet_part_type: item_part_type,
        pallet_sig: item_sig,
        pallet_edition: item_edition } = req
    typeof lasted_number !== 'undefined' && (do_number = lasted_number)
    item_name.forEach((name, i) =>{
        sql += `INSERT INTO DR_DO.dbo.tb_do_item (
            unique_id, do_number, item_name, item_quantity, item_unit_id, item_edition, item_part_type, item_sig)
        VALUES (
            '${unique_id}', '${do_number}', '${name}', ${item_quantity[i]},
            ${item_unit_id[i] !== "" ? item_unit_id[i] : 'NULL'},
            '${item_edition[i] !== "" ? item_edition[i] : ''}',
            ${item_part_type[i] !== "" ? item_part_type[i] : 'NULL'},
            ${item_sig[i] !== "" ? item_sig[i] : 'NULL'}
        )`
    })
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deleteItemDOModel = async (req, transaction) => {
    let { do_number} = req
    let sql = `DELETE DR_DO.dbo.tb_do_item WHERE do_number = '${do_number}'`
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const insertVehicleModel = async (req, transaction) => {
    let sql = "", x = 0
    let insert_vehicle_reject = 'NULL'
    let insert_vehicle_reject_remark = ''
    for(let i = 0; i < req.vehicle_owner.length; i++){
        let vehicle_follower = ""
        if(typeof req.vehicle_reject !== 'undefined'){
            if(typeof req.vehicle_reject[i] !== 'undefined'){
                insert_vehicle_reject = req.vehicle_reject[i]
            }
            if(typeof req.vehicle_reject_remark[i] !== 'undefined' && typeof req.vehicle_reject_remark[i] === 'string'){
                insert_vehicle_reject_remark = req.vehicle_reject_remark[i]
            }
        }
        typeof req.vehicle_follower !== 'undefined' && (
            typeof req.vehicle_follower[x] !== 'undefined' && (
                req.vehicle_follower[x].length > 0 && (
                    vehicle_follower = JSON.stringify(req.vehicle_follower[x])
                )
            )
        )
        x++
        sql += ` INSERT INTO DR_DO.dbo.tb_do_vehicle(
            do_number, vehicle_owner, vehicle_driver, vehicle_follower, vehicle_licens, vehicle_quantity,vehicle_reject, vehicle_reject_remark
        ) VALUES (
            '${req.do_number}', '${req.vehicle_owner_id[i]}', '${req.vehicle_driver_id[i]}', '${vehicle_follower}', ${req.vehicle_licens_id[i]},
            ${req.vehicle_quantity[i]}, ${insert_vehicle_reject}, '${insert_vehicle_reject_remark}'
        )`
    }
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deleteVehicleModel = async (req, transaction) => {
    const { do_number } = req
    const sql = ` DELETE DR_DO.dbo.tb_do_vehicle WHERE do_number = '${do_number}' `
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const updateDeliveryModel = async (req, transaction)=>{
    return await connection.query(`EXEC DR_DO.dbo.sp_update_status_delivery`, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const saveDOModel = async (req)=>{
    let pallet = false
    let transaction = await connection.transaction()
    let { action, request_type, vehicle_quantity, pallet_return, commercial_type_id, delivery_type_id } = req
    request_type === 'finish_goods' && commercial_type_id == 1 && delivery_type_id == 1 && (pallet = true)
    return Promise.all([     
        action === 'create' ? insertDOModel(req, transaction) : Promise.resolve(true),
        action === 'view' || action === 'edit' ? updateDOModel(req, transaction) : Promise.resolve(true),
        (action === 'view' || action === 'edit') && pallet === true ? deletePalletDOModel(req, transaction) : Promise.resolve(true),
        (action === 'view' || action === 'edit')  && pallet === false ? deleteItemDOModel(req, transaction) : Promise.resolve(true),
        pallet === true ? insertPalletDOModel(req, transaction) : Promise.resolve(true),
        pallet === false ? insertItemDOModel(req, transaction) : Promise.resolve(true),
        typeof vehicle_quantity !== 'undefined' ? deleteVehicleModel(req, transaction) : Promise.resolve(true),
        typeof vehicle_quantity !== 'undefined' ? insertVehicleModel(req, transaction) : Promise.resolve(true),
        typeof pallet_return !== 'undefined' ? insertPalletReturnModel(req, transaction) : Promise.resolve(true),
        typeof pallet_return !== 'undefined' ? deletePalletDRModel(req, transaction) : Promise.resolve(true),
    ])
    .then((data)=>{
        console.log(data)
        const notCompleted = data.some((item)=>{
            return item === false
        })
        if(notCompleted){
            throw 'Some table is not complete'
        }else{
            transaction.commit()
            return {
                success: true,
                message: 'Insert all table is successfull'
            }
        }
    }).catch((err)=>{
        transaction.rollback()
        return {
            success: false,
            message: err
        }
    })
}

const deleteDOModel = async (req)=>{
    let transaction = await connection.transaction()
    return Promise.all([
        deleteDOHeadModel(req, transaction),
        deletePalletDOModel(req, transaction),
        deletePalletReturnModel(req, transaction),
        deleteItemDOModel(req, transaction),
        deleteVehicleModel(req, transaction)
    ])
    .then((data)=>{
        console.log(data)
        const notCompleted = data.some((item)=>{
            return item === false
        })
        if(notCompleted){
            throw 'Some table is not complete'
        }else{
            transaction.commit()
            return {
                success: true,
                message: 'Insert all table is successfull'
            }
        }
    }).catch((err)=>{
        transaction.rollback()
        return {
            success: false,
            message: err
        }
    })
}

/* ---------- Delivery - Pallet ----------*/
const getPalletModel = async (req, transaction)=>{
    let sql = `
        SELECT
            CASE
                WHEN do_pallet.pallet_barcode = dr_pallet.pallet_barcode THEN 1
                ELSE 0
            END is_do_pallet,
            do_pallet.do_number,
            dr_pallet.pallet_barcode,
            fg_pallet.qty_pieces AS pallet_quantity,
            ISNULL(fg_pallet.weight_pack, 0) AS pallet_weight,
            fg_pallet.issue_status,
            fg_pallet.receive_date,
            fg_pallet.receive_by AS receive_emp_id,
            fg_pallet.pieces_per_pack,
            fg_pallet.packs_per_box,
            ISNULL(fg_pallet.boxs_per_pallet, 0) AS boxs_per_pallet,
            fg_pallet.location_id,
            CAST(fg_pallet.wide_pack AS VARCHAR(MAX))+'x'+CAST(fg_pallet.long_pack AS VARCHAR(MAX))+'x'+CAST(fg_pallet.height_pack AS VARCHAR(MAX)) AS dimension_per_pack,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS receive_emp_name,
            mi.dbo.getDescriptionByJobId(fg_pallet.pallet_barcode, fg_pallet.job_id) AS pallet_remark,
            location.location_code,
            location.location_name
        FROM DR_DO.dbo.tb_dr_pallet AS dr_pallet
        INNER JOIN mi.dbo.FG_Product_Pallet AS fg_pallet ON fg_pallet.pallet_barcode = dr_pallet.pallet_barcode
        LEFT JOIN mi.dbo.pallet_location AS location ON location.location_id = fg_pallet.location_id
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = fg_pallet.receive_by COLLATE Thai_CI_AS
        LEFT JOIN DR_DO.dbo.tb_do_pallet AS do_pallet ON do_pallet.pallet_barcode = dr_pallet.pallet_barcode
        WHERE dr_pallet.dr_number = '${req.dr_number}' AND fg_pallet.issue_status = 1
        ORDER BY fg_pallet.pallet_barcode ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getDeliveryPalletModel = async (req, transaction)=>{
    let sql = `
        ;WITH tb_pallet_delivery AS (
            SELECT
                fg_pallet.pallet_barcode,
                fg_pallet.qty_pieces AS pallet_quantity,
                fg_pallet.issue_status,
                fg_pallet.location_id,
                fg_pallet.receive_date, 
                fg_pallet.receive_by AS receive_emp_id,
                ISNULL(dr_pallet.dr_number, '') AS dr_number,
                ISNULL(do_pallet.do_number, '') AS do_number,
                ISNULL(do_pallet.do_status, 0) AS do_status,
                ISNULL(fg_pallet.weight_pack, 0) AS pallet_weight,
                hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS receive_emp_name,
                mi.dbo.getDescriptionByJobId(fg_pallet.pallet_barcode, fg_pallet.job_id) AS pallet_remark,
                location.location_code, location.location_name
            FROM mi.dbo.FG_Product_Pallet AS fg_pallet
            LEFT JOIN DR_DO.dbo.tb_dr_pallet AS dr_pallet ON fg_pallet.pallet_barcode = dr_pallet.pallet_barcode
            LEFT JOIN DR_DO.dbo.tb_pallet_return AS return_pallet ON fg_pallet.pallet_barcode = return_pallet.pallet_barcode
            OUTER APPLY (
                    SELECT tb_do_pallet.do_number, tb_do_pallet.pallet_barcode, tb_do_head.do_status
                    FROM DR_DO.dbo.tb_do_head
                    LEFT JOIN DR_DO.dbo.tb_do_pallet ON tb_do_pallet.do_number = tb_do_head.do_number
                    WHERE tb_do_head.dr_number = dr_pallet.dr_number
                    AND tb_do_pallet.pallet_barcode = dr_pallet.pallet_barcode
            ) AS do_pallet
            LEFT JOIN mi.dbo.pallet_location AS location ON location.location_id = fg_pallet.location_id
            LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = fg_pallet.receive_by COLLATE Thai_CI_AS
            WHERE fg_pallet.issue_status = 1
            AND NOT EXISTS (
                SELECT * FROM DR_DO.dbo.tb_pallet_return
                WHERE pallet_barcode = fg_pallet.pallet_barcode AND return_status_id = 1
            ) AND EXISTS (
                SELECT * FROM DR_DO.dbo.tb_dr_pallet
                WHERE pallet_barcode = fg_pallet.pallet_barcode
            )
        )
        SELECT * FROM tb_pallet_delivery WHERE do_status < 3
        GROUP BY
            pallet_barcode, pallet_quantity, pallet_weight, pallet_remark,
            issue_status, receive_date, receive_emp_id, receive_emp_name,
            dr_number, do_number, do_status, location_id, location_code, location_name
        ORDER BY receive_date DESC, dr_number ASC, pallet_barcode ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getTotalPalletRequestModel = async (req, transaction)=>{
    const sql = `
        SELECT
            SUM(ISNULL(fg_pallet.qty_pieces,0)) AS total_pallet_quantity
        FROM DR_DO.dbo.tb_dr_pallet AS dr_pallet
        INNER JOIN mi.dbo.FG_Product_Pallet AS fg_pallet ON fg_pallet.pallet_barcode = dr_pallet.pallet_barcode
        WHERE dr_pallet.dr_number = '${req}'
        AND fg_pallet.issue_status = 1
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data[0].total_pallet_quantity
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getPalletRequestModel = async (req, transaction)=>{
    let { dr_number, pallet_type } = req
    let query_table = 'tb_dr_pallet'
    let query_table_alias = 'dr_pallet'
    let query_field = 'dr_number'
    let pallet_condition = `AND dr_pallet.pallet_barcode NOT IN (SELECT pallet_barcode FROM DR_DO.dbo.tb_do_pallet)`
    let pallet_where = query_table_alias
    let field_do = ""
    let pallet_join = ""
    if(pallet_type === 'DO'){
        query_table = 'tb_do_pallet'
        query_table_alias = 'do_pallet'
        query_field = 'do_number'
        field_do = 'do.do_number, do.do_quantity,'
        pallet_join = `INNER JOIN DR_DO.dbo.tb_do_head AS do ON do.do_number = ${query_table_alias}.do_number`
        pallet_where = pallet_type.toLowerCase()
        pallet_condition = ""
    }
    const sql = `
        SELECT
            ${query_table_alias}.pallet_barcode,
            ${field_do}
            fg_pallet.qty_pieces AS pallet_quantity,
            ISNULL(fg_pallet.weight_pack, 0) AS pallet_weight,
            fg_pallet.issue_status,
            fg_pallet.receive_date,
            fg_pallet.receive_by AS receive_emp_id,
            fg_pallet.pieces_per_pack,
            fg_pallet.packs_per_box,
            ISNULL(fg_pallet.boxs_per_pallet, 0) AS boxs_per_pallet,
            fg_pallet.location_id,
            CAST(fg_pallet.wide_pack AS VARCHAR(MAX))+'x'+CAST(fg_pallet.long_pack AS VARCHAR(MAX))+'x'+CAST(fg_pallet.height_pack AS VARCHAR(MAX)) AS dimension_per_pack,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS receive_emp_name,
            mi.dbo.getDescriptionByJobId(fg_pallet.pallet_barcode, fg_pallet.job_id) AS pallet_remark,
            location.location_code, location.location_name
        FROM DR_DO.dbo.${query_table} AS ${query_table_alias}
        ${pallet_join}
        INNER JOIN mi.dbo.FG_Product_Pallet AS fg_pallet ON fg_pallet.pallet_barcode = ${query_table_alias}.pallet_barcode
        LEFT JOIN mi.dbo.pallet_location AS location ON location.location_id = fg_pallet.location_id
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = fg_pallet.receive_by COLLATE Thai_CI_AS
        WHERE ${pallet_where}.dr_number = '${dr_number}' 
        ${pallet_condition}
        AND fg_pallet.issue_status = 1
        ORDER BY fg_pallet.pallet_barcode ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getPalletOrderModel = async (req, transaction)=>{
    let { do_number } = req
    const sql = `
        SELECT
            do_pallet.pallet_barcode,
            fg_pallet.qty_pieces AS pallet_quantity,
            ISNULL(fg_pallet.weight_pack, 0) AS pallet_weight,
            fg_pallet.issue_status,
            fg_pallet.receive_date,
            fg_pallet.receive_by AS receive_emp_id,
            fg_pallet.pieces_per_pack,
            fg_pallet.packs_per_box,
            ISNULL(fg_pallet.boxs_per_pallet, 0) AS boxs_per_pallet,
            fg_pallet.location_id,
            CAST(fg_pallet.wide_pack AS VARCHAR(MAX))+'x'+CAST(fg_pallet.long_pack AS VARCHAR(MAX))+'x'+CAST(fg_pallet.height_pack AS VARCHAR(MAX)) AS dimension_per_pack,
            hrm_employee.emp_firstname_th +' '+ hrm_employee.emp_lastname_th AS receive_emp_name,
            mi.dbo.getDescriptionByJobId(fg_pallet.pallet_barcode, fg_pallet.job_id) AS pallet_remark,
            location.location_code, location.location_name
        FROM DR_DO.dbo.tb_do_pallet AS do_pallet
        INNER JOIN mi.dbo.FG_Product_Pallet AS fg_pallet ON fg_pallet.pallet_barcode = do_pallet.pallet_barcode
        LEFT JOIN mi.dbo.pallet_location AS location ON location.location_id = fg_pallet.location_id
        LEFT JOIN HRM.dbo.hrm_employee ON hrm_employee.emp_id = fg_pallet.receive_by COLLATE Thai_CI_AS
        WHERE do_pallet.do_number = '${do_number}' AND fg_pallet.issue_status = 1
        ORDER BY fg_pallet.pallet_barcode ASC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getItemRequestModel = async (req, transaction)=>{
    let { dr_number, item_type } = req
    let query_table, query_table_alias, query_field, pallet_condition, pallet_join, field_do, pallet_where
    if(item_type === 'DR'){
        query_table = 'tb_dr_item'
        query_table_alias = 'dr_item'
        query_field = 'dr_number'
        field_do = ""
        pallet_join = ""
        pallet_where = query_table_alias
        pallet_condition = `AND dr_item.item_name NOT IN (SELECT item_name FROM DR_DO.dbo.tb_do_item)`
    }
    if(item_type === 'DO'){
        query_table = 'tb_do_item'
        query_table_alias = 'do_item'
        query_field = 'do_number'
        field_do = 'do.do_number, do.do_quantity,'
        pallet_join = `INNER JOIN DR_DO.dbo.tb_do_head AS do ON do.do_number = ${query_table_alias}.do_number`
        pallet_where = item_type.toLowerCase()
        pallet_condition = ""
    }
    const sql = `
        SELECT
            ${query_table_alias}.id,
            ${field_do}
            ${query_table_alias}.item_name,
            ${query_table_alias}.item_quantity,
            ${query_table_alias}.item_unit_id
        FROM DR_DO.dbo.${query_table} AS ${query_table_alias}
        ${pallet_join}
        WHERE ${pallet_where}.dr_number = '${dr_number}'
        ${pallet_condition}
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getReturnPalletModel = async (req, transaction)=>{
    const sql = `
        SELECT
            pallet_return.pallet_barcode,
            pallet_return.return_status_id,
            ISNULL(pallet_return.do_number, '') AS do_number,
            pallet_return.dr_number,
            pallet_fg.qty_pieces AS pallet_quantity,
            pallet_fg.job_id,
            CASE WHEN pallet_return.updated IS NULL
                THEN pallet_return.created
                ELSE pallet_return.updated
            END delivery_date,
            ISNULL(dr.remark, '') AS dr_remark,
            ISNULL(dr.request_work_type_id, '') AS request_work_type_id,
            ISNULL(tb_master_request_type_work.request_work_type_name, '') AS request_work_type_name,
            tb_master_return_status.return_status_name,
            mi.job_name
        FROM DR_DO.dbo.tb_pallet_return AS pallet_return
        INNER JOIN mi.dbo.FG_Product_Pallet AS pallet_fg ON pallet_fg.pallet_barcode = pallet_return.pallet_barcode
        LEFT JOIN DR_DO.dbo.tb_do_head AS do ON do.do_number = pallet_return.do_number
        LEFT JOIN DR_DO.dbo.tb_dr_head AS dr ON dr.dr_number = pallet_return.dr_number
        LEFT JOIN mi.dbo.mi ON pallet_fg.job_id = mi.jobid
        LEFT JOIN DR_DO.dbo.tb_master_return_status ON tb_master_return_status.return_status_id = pallet_return.return_status_id
        LEFT JOIN DR_DO.dbo.tb_master_request_type_work ON tb_master_request_type_work.request_work_type_id = dr.request_work_type_id
        ORDER BY 
            CASE WHEN pallet_return.updated IS NULL
                THEN pallet_return.created
                ELSE pallet_return.updated
            END
        DESC
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const insertPalletReturnModel = async (req, transaction) => {
    let sql = ""
    let { dr_number, do_number, updated_emp_id, pallet_return, pallet_barcode} = req
    if(typeof pallet_return === 'undefined'){
        sql += `INSERT INTO DR_DO.dbo.tb_pallet_return (dr_number, do_number, pallet_barcode, created_emp_id)
            VALUES ('${dr_number}', ${typeof do_number === 'undefined' ? 'NULL' : "'"+do_number+"'"}, '${pallet_barcode}', '${updated_emp_id}')`
    }else{
        pallet_return.forEach(pallet =>{
            sql += `INSERT INTO DR_DO.dbo.tb_pallet_return (dr_number, do_number, pallet_barcode, created_emp_id) VALUES ('${dr_number}', '${do_number}', '${pallet}', '${updated_emp_id}')`
        })
    }
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deletePalletReturnModel = async (req, transaction) => {
    let { do_number, pallet_return } = req
    let condition = ""
    typeof pallet_return !== 'undefined' && (condition = `AND pallet_barcode IN ('${pallet_return.join(',')}')`)
    let sql = `DELETE DR_DO.dbo.tb_pallet_return WHERE do_number = '${do_number}' ${condition}`
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const deletePalletDRModel = async (req, transaction) => {
    let sql = ""
    let { dr_number, do_number, pallet_return, pallet_barcode} = req
    if(typeof pallet_return === 'undefined'){
        sql += `DELETE DR_DO.dbo.tb_dr_pallet WHERE pallet_barcode = '${pallet_barcode}'`
    }else{
        pallet_return.forEach(pallet =>{
            sql += `DELETE DR_DO.dbo.tb_dr_pallet WHERE pallet_barcode = '${pallet}'`
        })
    }
    return await connection.query(sql, {transaction})
    .then(()=>{
        return true
    })
    .catch((err)=>{
        return false
    })
}

const saveReturnPalletModel = async (req)=>{
    let transaction = await connection.transaction()
    return Promise.all([
        typeof req.do_number !== 'undefined' ? deleteDOHeadModel(req, transaction) : Promise.resolve(true),
        typeof req.do_number !== 'undefined' ? deletePalletDOModel(req, transaction) : Promise.resolve(true),
        typeof req.do_number !== 'undefined' ? deleteItemDOModel(req, transaction) : Promise.resolve(true),
        typeof req.do_number !== 'undefined' ? deleteVehicleModel(req, transaction) : Promise.resolve(true),
        insertPalletReturnModel(req, transaction),
        deletePalletDRModel(req, transaction),
    ])
    .then((data)=>{
        console.log(data)
        const notCompleted = data.some((item)=>{
            return item === false
        })
        if(notCompleted){
            throw 'Some table is not complete'
        }else{
            transaction.commit()
            return {
                success: true,
                message: 'Transaction all table is successfull'
            }
        }
    }).catch((err)=>{
        transaction.rollback()
        return {
            success: false,
            message: err
        }
    })
}

module.exports = {
    /* ---------- Delivery - Master ----------*/
    masterVehicleModel, masterVehicleEmployeeModel,
    //getRequestWorkTypeModel, //insertRequestWorkTypeModel,

    /* ---------- Delivery - JOB ----------*/
    getListJobModel, getDetailJobModel, saveWrapJOBModel, saveItemJOBModel,

    /* ---------- Delivery - Datalist ----------*/
    datalistContactModel, datalistAddressModel, 

    /* ---------- Delivery - DR ----------*/
    getDRModel, getDetailDRModel, getDetailDRItemModel, saveDRModel, deleteDRModel,
    getFinishGoodsModel, getMaterialsModel, 

    /* ---------- Delivery - DO ----------*/
    getDRRequestDOModel, getOrderDOModel, getCompleteDoModel, getDetailDOModel, 
    getFGQuantityModel, getMaterialsJOBModel, getItemRequestModel, getVehicleModel,
    saveDOModel, deleteDOModel, updateDeliveryModel,

    /* ---------- Delivery - Pallet ----------*/
    getReturnPalletModel, getDeliveryPalletModel, saveReturnPalletModel,
    getPalletModel, getTotalPalletRequestModel, getPalletRequestModel, getPalletOrderModel,
}