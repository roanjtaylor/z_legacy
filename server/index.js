// Server URL (hosted on Render): See components/payHandler.js
import express from "express";

// Use Environment variables to keep sensistive data hidden.
import Constants from "expo-constants";

const app = express();
const port = process.env.PORT || 4000;
const PUBLISHABLE_KEY = Constants.expoConfig?.extra?.publishableKey || "";
const SECRET_KEY = Constants.expoConfig?.extra?.secretKey || "";
import Stripe from "stripe";
import cors from "cors";

// Confirm the API version from your stripe dashboard
const stripe = Stripe(SECRET_KEY, { apiVersion: "2024-06-20" });

// Middleware
app.use(cors());

// Start Server.
app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});

// Basic route to display Hello World
app.get("/", (req, res) => {
  // Sends a HTML response to the client (laptop)
  res.send("<h1> Hello World! </h1>");
});

// Create Payment Intent Route
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
