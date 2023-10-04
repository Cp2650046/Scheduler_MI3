const connection = require('../../config/connection')

const getUniqueIdModel = async (req, transaction) => {
    const sql = `SELECT AUTHEN.dbo.get_unique_id () AS random_code`
    return await connection.query(sql)
    .then(([data])=>{
        return data[0].random_code
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

const getLastedNumberModel = async (req, transaction) => {
    const { docPrefix, colName, tableName, dbName, otherWHEREClaus } = req
    const sql = ` EXEC AUTHEN.dbo.sp_get_lasted_number 
        @docPrefix = '${docPrefix}', 
        @colName = '${colName}', 
        @tableName = '${tableName}', 
        @dbName = '${dbName}', 
        @otherWHEREClaus = '${otherWHEREClaus}'
    `
    return await connection.query(sql)
    .then(([data])=>{
        return data[0].lasted_number
    })
    .catch((err)=>{
        return {
            success: false,
            message: err
        }
    })
}

module.exports = {
    getUniqueIdModel, getLastedNumberModel
}