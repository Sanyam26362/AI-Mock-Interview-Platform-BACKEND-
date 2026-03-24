const { Webhook } = require("svix");
const User = require("../models/User.model");

const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  const svix_id        = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ message: "Missing svix headers" });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    // req.body is a Buffer (raw) — convert to string for Svix
    evt = wh.verify(req.body.toString(), {
      "svix-id":        svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ message: "Webhook verification failed" });
  }

  const { type, data } = evt;
  console.log(`Clerk webhook received: ${type}`);

  try {
    if (type === "user.created") {
      const existing = await User.findOne({ clerkId: data.id });
      if (!existing) {
        await User.create({
          clerkId:      data.id,
          email:        data.email_addresses[0]?.email_address,
          firstName:    data.first_name,
          lastName:     data.last_name,
          profileImage: data.image_url,
        });
        console.log(`User created in MongoDB: ${data.id}`);
      }
    }

    if (type === "user.updated") {
      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          email:        data.email_addresses[0]?.email_address,
          firstName:    data.first_name,
          lastName:     data.last_name,
          profileImage: data.image_url,
        }
      );
      console.log(`User updated in MongoDB: ${data.id}`);
    }

    if (type === "user.deleted") {
      await User.findOneAndDelete({ clerkId: data.id });
      console.log(`User deleted from MongoDB: ${data.id}`);
    }
  } catch (err) {
    console.error("DB operation failed:", err.message);
    return res.status(500).json({ message: "Database error" });
  }

  res.json({ received: true });
};

module.exports = { handleClerkWebhook };
