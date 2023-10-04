const setLastedNumber = async (req)=>{
    let obj = { docPrefix: '', colName: '', tableName: '', dbName: '', otherWHEREClaus: '' }
    switch(req){
        case 'DR':
            obj.docPrefix = 'DR'
            obj.colName = 'dr_number'
            obj.tableName = 'tb_dr_head'
            obj.dbName = 'DR_DO'
            obj.otherWHEREClaus = `AND LEFT(dr_number, 2) = ''DR''`
        break
        case 'DO':
            obj.docPrefix = 'DO'
            obj.colName = 'do_number'
            obj.tableName = 'tb_do_head'
            obj.dbName = 'DR_DO'
            obj.otherWHEREClaus = `AND LEFT(do_number, 2) = ''DO''`
        break
    }
    return obj
}

module.exports = {
    setLastedNumber
}