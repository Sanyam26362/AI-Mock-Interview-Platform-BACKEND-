const { Webhook } = require("svix");
const User = require("../models/User.model");

const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;
  try {
    evt = wh.verify(JSON.stringify(req.body), { "svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature });
  } catch (err) {
    return res.status(400).json({ message: "Webhook verification failed" });
  }

  const { type, data } = evt;

  if (type === "user.created") {
    await User.create({
      clerkId: data.id,
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImage: data.image_url,
    });
  }

  if (type === "user.updated") {
    await User.findOneAndUpdate({ clerkId: data.id }, {
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      profileImage: data.image_url,
    });
  }

  if (type === "user.deleted") {
    await User.findOneAndDelete({ clerkId: data.id });
  }

  res.json({ received: true });
};

module.exports = { handleClerkWebhook };
