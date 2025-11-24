/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('token', 191).notNullable().unique()
    table.dateTime('expires_at').notNullable()
    table.boolean('used').notNullable().defaultTo(false)
    table.dateTime('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('password_resets')
}
