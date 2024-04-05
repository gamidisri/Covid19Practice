const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3005, () => {
      console.log('Server Running at http://localhost:3005/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertStateObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getstatesQuery = `SELECT * FROM state ORDER BY state_id;`
  const statesArray = await db.all(getstatesQuery)
  response.send(
    statesArray.map((eachstate) => convertStateObjectToResponseObject(eachstate)),
  )
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const adddistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
  `
  await db.run(adddistrictQuery)
  response.send('District Successfully Added')
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getstateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`
  const state = await db.get(getstateQuery)
  response.send(convertStateObjectToResponseObject(state))
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`
  const district = await db.get(getdistrictQuery)
  response.send(convertDistrictObjectToResponseObject(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deletedistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
  `
  await db.run(deletedistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updatedistrictQuery = `
    UPDATE 
    district
    SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases}
      cured = ${cured}
      active = ${active}
      deaths = ${deaths}
    WHERE district_id = ${districtId};
  `
  await db.run(updatedistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getstatestatsQuery = `
  SELECT 
    SUM(cases), 
    SUM(cured), 
    SUM(active), 
    SUM(deaths)
  FROM 
      district 
  WHERE 
      state_id = ${stateId};`
  const stats = await db.get(getstatestatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
SELECT state_id from district
WHERE district_id = ${districtId};
`
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)

  const getStateNameQuery = `
SELECT state_name as stateName from state
WHERE state_id = ${getDistrictIdQueryResponse.state_id};
`
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
})

module.exports = app
