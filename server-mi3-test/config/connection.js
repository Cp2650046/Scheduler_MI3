const { Sequelize } = require('sequelize')
const connection = new Sequelize('AUTHEN', 'mi', 'miadmin', {
    host: '192.168.5.10',
    dialect: 'mssql',
    Encrypt:false
})

module.exports = connection