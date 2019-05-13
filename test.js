const config = require("dotenv").config();
const fetch = require("node-fetch");
const qs = require("querystring");

// (async function test() {
//   if (config.error) {
//     console.log(config.error);
//   }

//refacto cette merde, fqire une fonction qui englobe le tout

const host = "https://sync.bankin.com/v2/";

const credentials = {
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET
};

async function authenticateUser(options) {
  const queryString = qs.stringify(credentials);
  const url = host + "authenticate?" + queryString;

  try {
    const res = await fetch(url, options);

    const json = await res.json();

    const { access_token } = json;
    if (access_token) {
      return { queryString, access_token };
    }
  } catch (error) {
    console.log("shittttt", error);
  }
}

async function listAccounts(options) {
  try {
    const res = await fetch(options);
    const json = await res.json();
    const resArray = [];

    // gestion d'errur maybe
    const { resources, pagination } = json;

    if (pagination && pagination.next_uri) {
      let next = pagination.next_uri;
      resArray.push(resources);

      while (next !== null) {
        try {
          const res = await fetch(next);
          const json = await res.json();

          resArray.push(json.resources); // gestion d'errur maybe
          next = json.pagination.next_uri;
        } catch (error) {
          console.log(error);
        }
      }
    }
    //tant que next uri n'est pas === NULL fetch la suite et push ça
    //Promise.all les res.json et retourner les comptes

    return resArray.length > 0 ? resArray : resources;
  } catch (error) {
    console.log(error);
  }
}

async function sumTheAccounts() {
  //authenticate our user with the credentials

  const queryString = qs.stringify(credentials);
  const headers = {
    "Bankin-Version": "2018-06-15",
    "Content-Type": "application/json"
  };

  //lambda to create the endpoint
  const url = action => {
    return host + action + "?" + queryString;
  };

  const options = (method, body, headers) => {
    if (typeof body === "undefined") {
      return { method, headers };
    }
    return { method, body, headers };
  };

  const access_token = authenticateUser(
    url("authenticate"),
    options("POST", JSON.stringify(credentials), headers)
  );

  headers.access_token = access_token;

  const accounts = listAccounts(url("accounts"), "GET", headers);
  if (typeof accounts === "array") {
    //loop sur accounts et sum
  }
  return 10;
}
