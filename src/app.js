require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const jsonParser = express.json()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.post('/create-checkout-session', jsonParser, async (req, res) => {
    const {products} = req.body

    console.log(products)
    const stripeProducts = await Promise.all(products.map(async p => {
        const {name, image} = p
        const product = await stripe.products.create({
            name,
            images: ['https:' + image]
        });
        return product
    }))
    const stripePrices = await Promise.all(
        products.map(async (p,i) => {
            const stripePrice = await stripe.prices.create({
                unit_amount: 2000,
                currency: 'usd',
                product: stripeProducts[i].id,
            })
            return {price: stripePrice.id, quantity: products[i].quantity}
        })
    ) 
    const session = await stripe.checkout.sessions.create({
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        payment_method_types: ['card'],
        line_items: stripePrices,
        mode: 'payment',
    });
    res.send(session)
})

app.use((error, req, res, next) => {
    let response
    if (NODE_ENV === 'production') {
        response = {error: {message: 'server error'}}
    } else {
        console.error(error)
        response = {message: error.message, error}
    }
    res.status(500).json(response)
})

module.exports = app