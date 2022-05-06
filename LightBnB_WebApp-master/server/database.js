const { Pool } = require("pg");

const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb",
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  const params = email || null; 
    return pool
    .query(`SELECT * FROM users WHERE users.email = $1`, [params])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE users.id = $1`, [id])
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  const params = [user.name, user.email, user.password];
  const queryString = (`INSERT INTO users (name, email, password) VALUES ($1, $2, $3 ) RETURNING *;`)
  return pool
    .query(queryString, params)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `
                      SELECT reservations.id, properties.*, reservations.start_date, AVG(rating) AS average_rating 
                      FROM reservations
                      JOIN properties ON reservations.property_id = properties.id
                      JOIN property_reviews ON properties.id = property_reviews.property_id
                      WHERE reservations.guest_id = $1
                      GROUP BY properties.id, reservations.id, property_reviews.id
                      ORDER BY reservations.start_date
                      LIMIT $2;
                      `;
  const params = [guest_id, limit];
  return pool
    .query(queryString, params)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log("err", err);
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  let queryParams = [];
  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  } 
  `AND`
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams} `;//?????????????????
  }
  `AND`;
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `WHERE cost_per_night >= $${queryParams} `; //?????????????????
  }
  `AND`;
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `WHERE cost_per_night <= $${queryParams} `; //?????????????????
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `WHERE cost_per_night <= $${queryParams} `; //?????????????????
  }
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  HAVING AVG(property_reviews.rating) >= 4
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;             
  console.log(queryString, queryParams);
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
 
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
