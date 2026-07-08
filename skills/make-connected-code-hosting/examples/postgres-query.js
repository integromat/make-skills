// Postgres: selected App = Postgres, selected connection = a Make Postgres connection.
// Host, user, password, database, and TLS settings stay in the Make connection/proxy.
async function main(input, connection) {
  const result = await connection.sql.query(
    'select id, created_at from public.events order by created_at desc limit $1',
    [input.limit || 5]
  );
  return {
    rows: result.rows,
    rowCount: result.rowCount
  };
}
