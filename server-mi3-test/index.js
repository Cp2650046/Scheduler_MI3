const express = require('express')
const cors = require('cors')
const path = require('path')
const bodyParser = require('body-parser')
const config = require('config')
const app = express()
const data = config.get('data')
const PORT = config.get('data').PORT
const { authentication } = require('./permission/authentication')
const permission = require('./permission/permission')
const mainModule = require('./modules/main')
const userModule = require('./modules/user')
const deliveryModule = require('./modules/delivery')
const timesheetModule = require('./modules/timesheet')
const plModule = require('./modules/pl')
const schedulerModule = require('./modules/scheduler')
const masterPlanModule = require('./modules/masterplans')

app.locals = { data }
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public'))
app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(authentication)

app.use("/main", mainModule)
app.use("/user", userModule)
app.use("/delivery", deliveryModule)
app.use("/timesheet", timesheetModule)
app.use("/pl", plModule)
app.use("/scheduler", schedulerModule)
app.use("/masterplans", masterPlanModule);


app.get("/", (req, res)=>{
    res.send('API-MI3 Connected')
})

app.listen(PORT, ()=>{
    console.log('server is running on '+PORT)
})