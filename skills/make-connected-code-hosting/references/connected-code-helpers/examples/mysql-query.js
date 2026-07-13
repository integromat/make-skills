// MySQL: selected App = MySQL, selected connection = your MySQL connection.
// Host, user, password, database, and TLS settings stay in the Make connection/proxy sandbox.
const result = await connection.sql.query(
  'select ? as message, database() as database',
  ['hello from connected code']
);
return result.rows;
