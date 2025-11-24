/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('bookmarks', (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('title', 512).notNullable()
    table.string('url', 1024).notNullable()
    table.text('description').nullable()
    table.string('folder_path', 512).nullable()
    table.string('browser_id', 128).notNullable().defaultTo('chrome')
    table.string('browser_bookmark_id', 128).nullable()
    table.boolean('deleted').notNullable().defaultTo(false)
    table.boolean('is_public').notNullable().defaultTo(false)
    table.dateTime('created_at').notNullable()
    table.dateTime('updated_at').notNullable()

    // regular index on browser_bookmark_id
    table.index(['user_id', 'browser_bookmark_id'])
  })

  // composite index with prefix to satisfy utf8mb4 key length limits
  await knex.schema.raw(
    'CREATE INDEX bookmarks_user_id_url_index ON bookmarks (user_id, url(191))',
  )
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  // drop index first if exists to avoid errors
  await knex.schema.raw('DROP INDEX IF EXISTS bookmarks_user_id_url_index ON bookmarks')
  await knex.schema.dropTableIfExists('bookmarks')
}
