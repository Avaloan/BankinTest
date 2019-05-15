const config = require("dotenv").config();
const fetch = require("node-fetch");
const qs = require("querystring");

const BRIDGE_BASE_URL = "https://sync.bankin.com/";

const endpoints = {
  authenticate: BRIDGE_BASE_URL + "v2/" + "authenticate?",
  accounts: BRIDGE_BASE_URL + "v2/" + "accounts?"
};

const credentials = qs.stringify({
  email: process.env.USER_EMAIL,
  password: process.env.USER_PASSWORD,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET
});

/**
 * @returns {string} accessToken
 * This function log our user with his credentials
 * and return the access_token used to authorize all subsquent request
 *
 */
async function authenticate() {
  const url = endpoints.authenticate + credentials;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Bankin-Version": "2018-06-15"
      }
    });

    const { access_token } = await res.json();

    if (!access_token) {
      throw new Error("Wrong credentials");
    }

    return access_token;
  } catch (error) {
    throw new Error(`An error occured while fetching access: ${error.message}`);
  }
}

/**
 *
 * @param {string} accessToken
 * @returns {array}
 * It takes an accessToken as input which is a string
 * and returns an array which contain the users's accounts
 */
async function listAccounts(accessToken) {
  const url = endpoints.accounts + credentials;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Bankin-Version": process.env.BANKIN_VERSION,
        Authorization: `Bearer ${accessToken}`
      }
    });

    const { resources, pagination } = await res.json();

    if (!resources) {
      throw new Error("An error occured");
    }

    if (!resources.length) {
      return { resources };
    }

    if (pagination && pagination.next_uri) {
      let data = resources;
      let nextUri = pagination.next_uri;

      while (nextUri !== null) {
        const res = await fetch(BRIDGE_BASE_URL + nextUri, {
          method: "GET",
          headers: {
            "Bankin-Version": process.env.BANKIN_VERSION,
            "Content-Type": "application/json",
            access_token: `Bearer ${accessToken}`
          }
        });

        const { resources, pagination } = await res.json();

        data = [...data, ...resources];

        if (pagination && pagination.next_uri) {
          nextUri = pagination.next_uri;
        } else {
          nextUri = null;
        }
      }

      return { resources: data };
    } else {
      return { resources };
    }
  } catch (error) {
    throw new Error(
      `An error occured while listing accounts: ${error.message}`
    );
  }
}

/**
 * This functions print the sum of the user's accounts
 */
async function sumTheAccounts() {
  if (config.error) {
    throw new Error(`Unexpected error ${config.error}`);
  }

  const accessToken = await authenticate();
  const { resources } = await listAccounts(accessToken);

  const sum = resources.reduce((prev, current) => prev + current.balance, 0);

  console.log(sum);
}

sumTheAccounts();
