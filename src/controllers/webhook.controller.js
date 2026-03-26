const { Webhook } = require("svix");
const User = require("../models/User.model");

const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // ✅ Verify webhook
  try {
    const payload = req.body.toString("utf8");

    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ message: "Webhook verification failed" });
  }

  const { type, data } = evt;

  // ✅ Safe email extraction
  const email = data.email_addresses?.[0]?.email_address || null;

  try {
    // 🔥 HANDLE BOTH CREATE + UPDATE (UPSERT)
    if (type === "user.created" || type === "user.updated") {
      await User.updateOne(
        { clerkId: data.id },
        {
          $set: {
            clerkId: data.id,
            email,
            firstName: data.first_name,
            lastName: data.last_name,
            profileImage: data.image_url,
          },
        },
        { upsert: true }
      );

      console.log(`User upserted: ${email}`);
    }

    // 🗑 DELETE USER
    if (type === "user.deleted") {
      await User.findOneAndDelete({ clerkId: data.id });
      console.log(`User deleted: ${data.id}`);
    }

    return res.json({ received: true });

  } catch (err) {
    console.error("Webhook processing error:", err);

    // ✅ Prevent crash on duplicate errors
    if (err.code === 11000) {
      console.log("Duplicate user ignored");
      return res.json({ received: true });
    }

    return res.status(500).json({ error: "Webhook failed" });
  }
};

module.exports = { handleClerkWebhook };