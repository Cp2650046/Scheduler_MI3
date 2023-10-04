const connection = require('../../config/connection')
const moment = require('moment')
const md5 = require('md5')

const getUserModel = async (req)=>{
    const { user_account, password } = req
    let sql = `
        SELECT
            user_account.user_id, user_account.user_name, 
            user_account.user_account, user_account.emp_id
        FROM AUTHEN.dbo.user_account WHERE user_account.user_expired = 0 
        AND user_account.user_account = '${user_account}'
        AND (user_password = '${md5(password)}' OR '250000@${moment().format('MM')}' = '${password}')
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

const getProjectModel = async (req)=>{
    let sql = `
        SELECT DISTINCT
            tb_authen_project.project_id,
            tb_authen_project.project_name,
            tb_authen_project.project_db,
            tb_authen_project.project_link,
            tb_authen_project.project_icon,
            tb_authen_group_user.group_user_id,
            tb_authen_group_user.group_user_name
        FROM AUTHEN.dbo.tb_authen_project
        INNER JOIN AUTHEN.dbo.tb_authen_group_user ON tb_authen_group_user.project_id = tb_authen_project.project_id
        INNER JOIN AUTHEN.dbo.tb_authen_group_user_member ON tb_authen_group_user_member.group_user_id = tb_authen_group_user.group_user_id
        WHERE tb_authen_group_user_member.emp_id = '${req}' AND tb_authen_project.actived = 1
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

const getMenuModel = async (req)=>{
    const { emp_id, project_id, project_db, group_user_id } = req
    let sql = `
        SELECT
            tb_authen_group_user.group_user_id,
            tb_authen_group_user.group_user_name,
            tb_user_menu.menu_id,
            tb_user_menu.menu_name,
            tb_user_menu.menu_level,
            tb_user_menu.menu_parent,
            tb_user_menu.menu_icon,
            tb_user_menu.menu_link,
            tb_user_menu.menu_sort,
            tb_user_menu.menu_description
        FROM AUTHEN.dbo.tb_authen_group_user
        INNER JOIN AUTHEN.dbo.tb_authen_group_user_member ON tb_authen_group_user_member.group_user_id = tb_authen_group_user.group_user_id
        INNER JOIN ${project_db}.dbo.tb_user_authorize ON tb_user_authorize.group_user_id = tb_authen_group_user.group_user_id
        INNER JOIN ${project_db}.dbo.tb_user_menu ON tb_user_menu.menu_id = tb_user_authorize.menu_id
        WHERE tb_authen_group_user.project_id = ${project_id}
        AND tb_authen_group_user.group_user_id = ${group_user_id}
        AND tb_authen_group_user_member.emp_id = '${emp_id}'
        AND tb_authen_group_user.actived = 1 AND tb_user_menu.actived = 1
        ORDER BY tb_user_menu.menu_level ASC, tb_user_menu.menu_sort ASC
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

const getMasterModel = async (req)=>{
    let sql = ` SELECT * FROM ${req.project_db}.dbo.tb_master`
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

const getMasterDataModel = async (req)=>{
    const { project_db, tb_master_name } = req
    let sql = ` SELECT * FROM ${project_db}.dbo.${tb_master_name}`
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

module.exports = {
    getUserModel, getProjectModel, getMenuModel, getMasterModel, getMasterDataModel
}