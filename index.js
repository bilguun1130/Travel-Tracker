import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const app = express();
const port = 3000;


const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Ilove1130",
  port: 5432,
});
async function getCountries () {
  let countries = await db.query(
    "SELECT country_code FROM visited_countries"
    );
  countries = countries.rows.map((country) => country.country_code);
  return countries;
}
async function visited(countryName) {
  const countries = await getCountries();
  const country_code = await db.query(
    "SELECT country_code FROM country_names WHERE lower(country_name) LIKE '%' || $1 || '%'", [countryName.toLowerCase()]);
  if(country_code.rows.length === 0) {
    return false;
  }
  else {
    return countries.includes(country_code.rows[0].country_code);
  }
  
}
async function ifValid(countryName) {
  const country_code = await db.query(
    "SELECT country_code FROM country_names WHERE lower(country_name) LIKE '%' || $1 || '%'", [countryName.toLowerCase()]);
  return country_code.rows.length > 0;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
db.connect();
app.get("/", async (req, res) => {
  
  //Write your code here.
  const countries = await getCountries()
  try {
    res.render("index.ejs", { countries: countries, total: countries.length });
  }
  catch(err) {
    console.log(err);
  }
});

app.post("/add", async (req, res) => {
  //Write your code here.
  const country = req.body.country;
  // if(visited(country)) {
  //   res.redirect("/");
  //   return;
  // }
  const countries = await getCountries()
  const visitedOrNot = await visited(country);
  const valid = await ifValid(country);
  if(valid=== true) {
    try {      
      if(visitedOrNot === true) {
        res.render("index.ejs", {countries: countries, total: countries.length, error: "This country is already been added."});
      }
      else {
        const result = await db.query(
            "SELECT country_code FROM country_names WHERE lower(country_name) LIKE '%' || $1 || '%'", [country.toLowerCase()]
          );
        if(result.rows.length > 1) {
          let overlapped = []
          for (let i= 0; i < result.rows.length; i++) {
            const addingCountry = await db.query(
              "SELECT country_name FROM country_names WHERE country_code = $1", [result.rows[i].country_code]
            );
            overlapped.push(addingCountry.rows[0].country_name);
          }
          res.render("index.ejs", {countries: countries, total: countries.length, error: "There are multiple countries with this name. Please choose one of them: " + overlapped});
        }
        else {
          const country_code = result.rows[0].country_code;
          await db.query(
            "INSERT INTO visited_countries (country_code) VALUES ($1)", [country_code]
          );
          res.redirect("/");
        }
        
        
      }
    }
    catch (err) {
      console.log(err);
    }
  }
  else {
    try {
      res.render("index.ejs", {countries: countries, total: countries.length, error: "This country does not exist."});
    }
    catch(err) {
      console.log(err);
    }
  }

  // try {
  //   const result = await db.query(
  //     "SELECT country_code FROM country_names WHERE lower(country_name) = $1", [country.toLowerCase()]
  //   );
  //   if (result.rows.length !== 0) {
  //     const country_code = result.rows[0].country_code;
  //     await db.query(
  //       "INSERT INTO visited_countries (country_code) VALUES ($1)", [country_code]
  //     );
  //   }
  //   res.redirect("/");
  // }
  // catch(err) {
  //   console.log(err);
  // }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
