/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary()
    table.string('email', 191).notNullable().unique()
    table.string('password_hash', 191).notNullable()
    table.dateTime('created_at').notNullable()
    table.dateTime('updated_at').notNullable()
  })
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('users')
}
