import express from "express";

const app = express();
const port = 3000; //add your port here
const PUBLISHABLE_KEY =
  "pk_live_51Q1loc1Q7y4yydlCjTjFHYnVSwOgyoij5VbmZ0flHj5e8VGDzzObioZYpyi9JzW0xX4iFInk2pnW9diP2C0P2uS800wY41yR3x";
const SECRET_KEY =
  "REMOVED_STRIPE_SECRET";
import Stripe from "stripe";

// Confirm the API version from your stripe dashboard
const stripe = Stripe(SECRET_KEY, { apiVersion: "2024-06-20" });

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500, //lowest denomination of particular currency, ie. 500 pence, = £5.00
      currency: "gbp",
      payment_method_types: ["card"], //by default
    });

    const clientSecret = paymentIntent.client_secret;

    res.json({
      clientSecret: clientSecret,
    });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
});
