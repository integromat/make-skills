// PostgreSQL: selected App = PostgreSQL, selected connection = a Make PostgreSQL connection.
// Host, user, password, database, and TLS settings stay in the Make connection/proxy.
const result = await connection.sql.query(
  'select id, created_at from public.events order by created_at desc limit $1',
  [input.limit || 5]
);
return {
  rows: result.rows,
  rowCount: result.rowCount
};
