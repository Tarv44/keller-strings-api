const CompService = {
  insertCustomer(knex, newCustomer) {
    return knex
      .insert(newCustomer)
      .into('customers')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  getById(knex, id) {
    return knex
      .from('customers')
      .select('*')
      .where('id', id)
      .first()
  },

  getByEmail(knex, email) {
      return knex
        .from('customers')
        .select('*')
        .where('email', email)
        .first()
  },

  deleteCompany(knex, id) {
    return knex('customers')
      .where({ id })
      .delete()
  },

  updateCompany(knex, id, newCustomerFields) {
    return knex('customers')
      .where({ id })
      .update(newCustomerFields)
  },

  getFavorites(knex, id) {
    return knex('favorites')
      .where('customer', id)
      .returning('*')
  },

  insertFavorite(knex, newFavorite) {
    return knex
      .insert(newFavorite)
      .into('favorites')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },

  deleteFavorite(knex, customer, product_id) {
    return knex('customers')
      .where({ customer })
      .where({ product_id })
      .delete()
  },

  getOrders(knex, customer) {
    return knex('orders')
      .where({customer})
      .returning('*')
  },

  insertOrder(knex, newOrder) {
    return knex
      .insert(newOrder)
      .into('orders')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
}

module.exports = CompService