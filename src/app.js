require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV, CLIENT_ORIGIN } = require('./config')
const jsonParser = express.json()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.post('/create-checkout-session', jsonParser, async (req, res) => {
    const {products, pickingUp} = req.body
    const over100 = products.map(p => p.unit_amount).reduce((a, c) => a+c)/100 >= 10000
    const shippingDetails = !pickingUp && {
        shipping_address_collection: {
            allowed_countries: ['US']
        },
        shipping_rates: over100 ? ['shr_1JFTdVHbvDyG32Z94gjal3wd'] : ['shr_1JFTCOHbvDyG32Z9Ib4cpWZY']
    }
    const stripeProducts = await Promise.all(products.map(async p => {
        const {name, image} = p
        const product = await stripe.products.create({
            name,
            images: [image]
        });
        return product
    }))
    const stripePrices = await Promise.all(
        products.map(async (p,i) => {
            const stripePrice = await stripe.prices.create({
                unit_amount: p.unit_amount,
                currency: 'usd',
                product: stripeProducts[i].id,
            })
            return {price: stripePrice.id, quantity: products[i].quantity}
        })
    )
    const session = await stripe.checkout.sessions.create({
        success_url: 'http://localhost:8000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:8000/cart/',
        payment_method_types: ['card'],
        line_items: stripePrices,
        mode: 'payment',
        ...shippingDetails
    });
    res.send(session)
})

app.post('/success', jsonParser, async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.body.session_id);
    const customer = await stripe.customers.retrieve(session.customer);
  
    res.send({session, customer});
});

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