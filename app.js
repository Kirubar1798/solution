const express = require("express");
const app = express();
const path = require("path");
const dpPath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

let DataBase = null;
const connectingDatabase = async () => {
  try {
    DataBase = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Successfully http:/localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error ${error.message}`);
    process.exit(1);
  }
};
connectingDatabase();

const stateConversionCase = (eachCase) => {
  return {
    stateId: eachCase.state_id,
    stateName: eachCase.state_name,
    population: eachCase.population,
  };
};

//get all state

app.get("/states/", async (request, response) => {
  const getState = `SELECT *
    FROM state`;
  const detail = await DataBase.all(getState);
  response.send(detail.map((val) => stateConversionCase(val)));
});

//get stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const state = `SELECT *
    FROM state
    WHERE state_id = '${stateId}'`;
  const stateData = await DataBase.get(state);
  response.send(stateConversionCase(stateData));
});

const districtCaseConversion = (each) => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    cured: each.cured,
    active: each.active,
    deaths: each.deaths,
  };
};

//post
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const post_district = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}')`;
  const newDistrict = await DataBase.run(post_district);
  response.send("District Successfully Added");
});

//get district
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT *
    FROM district
    WHERE district_id = ${districtId}`;
  const getDistrictDetail = await DataBase.get(getDistrict);
  response.send(districtCaseConversion(getDistrictDetail));
});

//delete district
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district
    WHERE district_id = '${districtId}'`;
  await DataBase.run(deleteDistrict);
  response.send("District Removed");
});

//district put
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putDistrict = `UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    WHERE district_id = '${districtId}'
    `;
  await DataBase.run(putDistrict);
  response.send("District Details Updated");
});

//state get
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stats = `SELECT SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM district
    WHERE state_id = ${stateId}`;
  const getStats = await DataBase.get(stats);
  response.send(getStats);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictName = `SELECT *
    FROM district
    WHERE district_id = ${districtId}`;
  const getState = await DataBase.get(getDistrictName);

  const getStateName = `SELECT state_name as stateName
  FROM state
  WHERE state_id = ${getState.state_id}`;
  const gotStateName = await DataBase.get(getStateName);
  response.send(gotStateName);
});

module.exports = app;
