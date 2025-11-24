/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('bookmarks', 'is_public')
  if (!hasColumn) {
    await knex.schema.alterTable('bookmarks', (table) => {
      table.boolean('is_public').notNullable().defaultTo(false).after('deleted')
    })
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('bookmarks', 'is_public')
  if (hasColumn) {
    await knex.schema.alterTable('bookmarks', (table) => {
      table.dropColumn('is_public')
    })
  }
}
