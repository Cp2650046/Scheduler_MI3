const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require('config')
const PORT = config.get('data').PORT
const data = config.get('data')
const dashboardRouter = require('./routes/dashboard')
const deliveryRouter = require('./routes/delivery')
const timesheetRouter = require('./routes/timesheet')
const scheduler = require('./routes/scheduler');
const masterplans = require('./routes/masterplans');


app.locals = { data }
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'public'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/dashboard', dashboardRouter)
app.use('/delivery', deliveryRouter)
app.use('/timesheet', timesheetRouter)
app.use('/scheduler',scheduler)
app.use('/masterplans',masterplans);

app.get('/', (req, res)=>{
    res.render('./index')
})

app.get('/login', (req, res)=>{
    res.render('./login')
})

// app.get('/masterplans', (req, res)=>{
//     res.render('./masterplans')
// })

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
})