const path = require('path')
const bcrypt = require('bcrypt')
const saltRounds = 10
const express = require('express')
const CustomerService = require('./customer-service')

const CustRouter = express.Router()
const jsonParser = express.json()

CustRouter
  .route('/')
  //Create new customer account
  .post(jsonParser, async (req, res, next) => {
    const db = req.app.get('db')
      const { fullname, email, password } = req.body
      const newCust = { fullname, password, email}
      for (const [key, value] of Object.entries(newCust)) {
          if (!value) {
            return res.status(400).json({
                error: { message: `Missing ${key} in request body.` }
            })
          }
      }
      newCust.email = email.toLowerCase()
      const emailExists = await CustomerService.getByEmail(db, newCust.email)
      console.log(emailExists)
      if (emailExists) {
        res.status(404).json({message: 'Account with email already exists'})
      } else {
        const hashedPw = await bcrypt.hash(password, saltRounds)
        newCust.password = hashedPw
        const newAccount = await CustomerService.insertCustomer(db, newCust)
        const response = { id: newAccount.id, fullname, email }
        res
            .status(201)
            .json(response)
      }
  })

CustRouter
  .route('/login')
  .post(jsonParser, async (req, res, next) => {
    const account  = await CustomerService.getByEmail(
      req.app.get('db'),
      req.body.email.toLowerCase() 
    )
    if (!account) {
      res.status(404).json({message: 'Customer with email does not exist'})
    } else {
      const {id, fullname, email, password} = account
      const isCorrectPw = await bcrypt
        .compare(req.body.password, password)
      if (!isCorrectPw) {
        res.status(401).json({message: 'Incorrect Password'})
      } else {
        response = { id, fullname, email }
        res.status(201).json(response)
      }
    }
  })

CustRouter
  .route('/:cust_id/favorites')
  .get(async (req, res, next) => {
    const favorites = await CustomerService.getOrders(
      req.app.get('db'),
      req.params.cust_id
    )
    res.status(200).json(favorites)
  })
  .post(jsonParser, async (req, res, next) => {
    const favoriteData = {
      customer: req.params.cust_id,
      product_id: req.body.product_id
    }
    const newFavorite = await CustomerService.insertFavorite(
      req.app.get('db'),
      favoriteData
    )
    res.status(201).json(newFavorite)
  })

CustRouter
  .route('/:cust_id/orders')
  .get(async (req, res, next) => {
    const orders = await CustomerService.getOrders(
      req.app.get('db'),
      req.params.cust_id
    )
    res.status(200).json(orders)
  })
  .post(jsonParser, async (req, res, next) => {
    const orderData = {
      customer: req.params.cust_id,
      stripe_session: req.body.stripe_session
    }
    const newOrder = await CustomerService.insertOrder(
      req.app.get('db'),
      orderData
    )
    res.status(201).json(newOrder)
  })

module.exports = CustRouter;