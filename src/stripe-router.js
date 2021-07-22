const express = require('express')
const jsonParser = express.json()
const StripeRouter = express.Router()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

StripeRouter
  .route('/sessions')
  .post(jsonParser, async (req, res) => {
    console.log("Ran")
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
            return {
              price: stripePrice.id, 
              quantity: products[i].quantity, 
              tax_rates: ['txr_1JFrjYHbvDyG32Z9v1dusUrw']}
        })
    )
    const session = await stripe.checkout.sessions.create({
        success_url: 'http://localhost:8000/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:8000/cart/',
        payment_method_types: ['card'],
        line_items: stripePrices,
        mode: 'payment',
        tax_id_collection: {enabled: true},
        ...shippingDetails
    });
    res.send(session)
  })

StripeRouter
  .route('/sessions/:session_id')
  .get(async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.params.session_id);
    const customer = await stripe.customers.retrieve(session.customer);
    const lineItems = await stripe.checkout.sessions.listLineItems(req.params.session_id)
  
    res.send({session, customer, lineItems});
});

module.exports = StripeRouter;