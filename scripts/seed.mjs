import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const DB_NAME = "eventbrite_ref";
const URI = process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${DB_NAME}`;

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
  },
  { timestamps: true },
);

const ticketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    remaining: { type: Number, required: true },
  },
  { _id: true },
);

const eventSchema = new mongoose.Schema(
  {
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    description: String,
    category: String,
    venue: String,
    location: String,
    start: Date,
    end: Date,
    capacity: Number,
    ticketTypes: [ticketTypeSchema],
    ticketsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { timestamps: true },
);
eventSchema.index({ organizer: 1, start: 1 });
eventSchema.index({ category: 1, start: 1 });
eventSchema.index({ location: 1, start: 1 });
eventSchema.index({ title: "text", description: "text", venue: "text", location: "text" });

const orderSchema = new mongoose.Schema(
  {
    user: mongoose.Schema.Types.ObjectId,
    event: mongoose.Schema.Types.ObjectId,
    items: [
      {
        ticketType: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    total: Number,
  },
  { timestamps: true },
);
orderSchema.index({ user: 1, createdAt: -1 });

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    event: mongoose.Schema.Types.ObjectId,
    ticketType: mongoose.Schema.Types.ObjectId,
    order: mongoose.Schema.Types.ObjectId,
    owner: mongoose.Schema.Types.ObjectId,
    pricePaid: Number,
    status: { type: String, enum: ["valid", "used"], default: "valid" },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true },
);
ticketSchema.index({ owner: 1, createdAt: -1 });
ticketSchema.index({ event: 1, status: 1 });

const savedEventSchema = new mongoose.Schema(
  { user: mongoose.Schema.Types.ObjectId, event: mongoose.Schema.Types.ObjectId },
  { timestamps: { createdAt: true, updatedAt: false } },
);
savedEventSchema.index({ user: 1, event: 1 }, { unique: true });

const reviewSchema = new mongoose.Schema(
  {
    user: mongoose.Schema.Types.ObjectId,
    event: mongoose.Schema.Types.ObjectId,
    rating: Number,
    comment: String,
  },
  { timestamps: true },
);
reviewSchema.index({ user: 1, event: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
const Event = mongoose.model("Event", eventSchema);
const Order = mongoose.model("Order", orderSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);
const SavedEvent = mongoose.model("SavedEvent", savedEventSchema);
const Review = mongoose.model("Review", reviewSchema);

const DAY = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY);

const people = [
  { email: "organizer@example.com", name: "Ava Organizer" },
  { email: "cole@example.com", name: "Cole Conference" },
  { email: "attendee@example.com", name: "Sam Attendee" },
  { email: "priya@example.com", name: "Priya Purchaser" },
  { email: "marcus@example.com", name: "Marcus Miller" },
];

const makeEvent = (organizer, data) => ({
  organizer: organizer._id,
  ...data,
  start: inDays(data.startIn),
  end: inDays(data.endIn),
  ticketsSold: 0,
  revenue: 0,
});

const eventData = [
  {
    title: "React Conf 2026",
    description:
      "A full day of talks and hands-on sessions about React 19, Server Components, and modern front-end architecture. Includes lunch, coffee, and a networking reception.",
    category: "Tech",
    venue: "Moscone Center",
    location: "San Francisco, CA",
    capacity: 500,
    startIn: 30,
    endIn: 30.4,
    ticketTypes: [
      { name: "General Admission", price: 99, quantity: 200, remaining: 200 },
      { name: "VIP + Workshop", price: 299, quantity: 20, remaining: 20 },
    ],
  },
  {
    title: "Jazz in the Park",
    description:
      "An evening of live jazz under the stars. Bring a blanket, grab food from local vendors, and enjoy three sets from award-winning musicians.",
    category: "Music",
    venue: "Central Park Bandshell",
    location: "New York, NY",
    capacity: 200,
    startIn: 14,
    endIn: 14.3,
    ticketTypes: [
      { name: "General Admission", price: 45, quantity: 150, remaining: 150 },
      { name: "Premium Seating", price: 75, quantity: 30, remaining: 30 },
    ],
  },
  {
    title: "Design Systems Workshop",
    description:
      "A practical, small-group workshop on building and scaling a design system. Early bird tickets are completely sold out; a limited number of standard tickets remain.",
    category: "Workshop",
    venue: "Studio 12",
    location: "Seattle, WA",
    capacity: 50,
    startIn: 21,
    endIn: 21.4,
    ticketTypes: [
      { name: "Early Bird", price: 0, quantity: 20, remaining: 20 },
      { name: "Standard", price: 49, quantity: 30, remaining: 30 },
    ],
  },
  {
    title: "City Marathon Kickoff",
    description:
      "Kick off race weekend with a group warm-up, gear expo, and talks from professional runners. Free entry for kids under 12.",
    category: "Sports",
    venue: "Riverside Stadium",
    location: "Boston, MA",
    capacity: 1000,
    startIn: 60,
    endIn: 60.25,
    ticketTypes: [
      { name: "Participant", price: 25, quantity: 500, remaining: 500 },
      { name: "Spectator", price: 0, quantity: 400, remaining: 400 },
    ],
  },
  {
    title: "Street Food Festival",
    description:
      "Taste dishes from more than thirty food trucks, watch live cooking demos, and vote for your favorite vendor of the year.",
    category: "Food & Drink",
    venue: "Waterfront Park",
    location: "Austin, TX",
    capacity: 800,
    startIn: 45,
    endIn: 45.5,
    ticketTypes: [
      { name: "Entry + Tastings", price: 15, quantity: 600, remaining: 600 },
      { name: "All-Access Pass", price: 60, quantity: 100, remaining: 100 },
    ],
  },
  {
    title: "Art & Wine Evening",
    description:
      "A relaxed gallery opening with local artists, wine tasting, and a guided tour of the new exhibition.",
    category: "Arts & Culture",
    venue: "Riverfront Gallery",
    location: "Chicago, IL",
    capacity: 120,
    startIn: 7,
    endIn: 7.3,
    ticketTypes: [
      { name: "General Admission", price: 35, quantity: 100, remaining: 100 },
    ],
  },
  {
    title: "Board Game Night",
    description:
      "Casual tabletop evening with dozens of games, friendly hosts, and free snacks. No experience needed.",
    category: "Other",
    venue: "Community Hall",
    location: "Denver, CO",
    capacity: 40,
    startIn: 3,
    endIn: 3.25,
    ticketTypes: [{ name: "Free Entry", price: 0, quantity: 40, remaining: 40 }],
  },
  {
    title: "DevOps Summit (Past Edition)",
    description:
      "A recap event from last year covering observability, deployment pipelines, and incident response. This event has already ended.",
    category: "Conference",
    venue: "Convention Center",
    location: "Portland, OR",
    capacity: 300,
    startIn: -10,
    endIn: -9.7,
    ticketTypes: [
      { name: "General Admission", price: 129, quantity: 200, remaining: 200 },
    ],
  },
  {
    title: "Vintage Fair (Past Edition)",
    description:
      "A past edition of our vintage fair with collectibles, retro clothing, and live music. This event has already ended.",
    category: "Other",
    venue: "Old Town Square",
    location: "Austin, TX",
    capacity: 150,
    startIn: -30,
    endIn: -29.7,
    ticketTypes: [{ name: "Entry", price: 10, quantity: 150, remaining: 150 }],
  },
];

const makeCode = () => `EV-${randomBytes(5).toString("hex").toUpperCase()}`;

async function purchase(
  user,
  event,
  typeIndex,
  quantity,
  statuses = [],
  allowPast = false,
) {
  const type = event.ticketTypes[typeIndex];
  const reserved = await Event.updateOne(
    {
      _id: event._id,
      "ticketTypes._id": type._id,
      "ticketTypes.remaining": { $gte: quantity },
      ...(allowPast ? {} : { end: { $gt: new Date() } }),
    },
    {
      $inc: {
        "ticketTypes.$.remaining": -quantity,
        ticketsSold: quantity,
        revenue: type.price * quantity,
      },
    },
  );
  if (reserved.modifiedCount !== 1) {
    throw new Error(`Seed reservation failed for ${event.title}`);
  }

  const order = await Order.create({
    user: user._id,
    event: event._id,
    items: [
      {
        ticketType: type._id,
        name: type.name,
        quantity,
        unitPrice: type.price,
      },
    ],
    total: type.price * quantity,
  });

  const tickets = [];
  for (let index = 0; index < quantity; index += 1) {
    const used = statuses[index] === "used";
    tickets.push({
      code: makeCode(),
      event: event._id,
      ticketType: type._id,
      order: order._id,
      owner: user._id,
      pricePaid: type.price,
      status: used ? "used" : "valid",
      checkedInAt: used ? new Date() : null,
    });
  }
  await Ticket.insertMany(tickets);
  return tickets.length;
}

async function main() {
  await mongoose.connect(URI, { dbName: DB_NAME });
  if (mongoose.connection.name !== DB_NAME) {
    throw new Error(`Refusing to seed database ${mongoose.connection.name}`);
  }

  await Promise.all([
    User.createIndexes(),
    Event.createIndexes(),
    Order.createIndexes(),
    Ticket.createIndexes(),
    SavedEvent.createIndexes(),
    Review.createIndexes(),
  ]);

  await Promise.all([
    Ticket.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    SavedEvent.deleteMany({}),
    Event.deleteMany({}),
    User.deleteMany({}),
  ]);

  const password = await bcrypt.hash("password123", 12);
  const [ava, cole, sam, priya, marcus] = await User.create(
    people.map((person) => ({ ...person, password })),
  );

  const events = await Event.create(
    eventData.map((data, index) =>
      makeEvent(index === 7 ? cole : ava, data),
    ),
  );
  const [reactConf, jazz, workshop, marathon, food, art, games, devops, vintage] =
    events;

  let ticketCount = 0;
  ticketCount += await purchase(sam, reactConf, 0, 2);
  ticketCount += await purchase(priya, reactConf, 1, 1);
  ticketCount += await purchase(marcus, jazz, 0, 2);
  ticketCount += await purchase(marcus, workshop, 0, 20);
  ticketCount += await purchase(sam, workshop, 1, 1);
  ticketCount += await purchase(priya, art, 0, 1);
  ticketCount += await purchase(marcus, devops, 0, 2, ["used", "valid"], true);
  ticketCount += await purchase(sam, games, 0, 1);

  await Ticket.updateOne(
    { event: reactConf._id, status: "valid" },
    { $set: { status: "used", checkedInAt: new Date() } },
  );

  await SavedEvent.create([
    { user: sam._id, event: reactConf._id },
    { user: sam._id, event: jazz._id },
    { user: priya._id, event: workshop._id },
    { user: marcus._id, event: food._id },
  ]);

  await Review.create([
    {
      user: sam._id,
      event: devops._id,
      rating: 5,
      comment: "Great speakers and a very well organized event.",
    },
    {
      user: marcus._id,
      event: devops._id,
      rating: 4,
      comment: "Solid content, would attend again next year.",
    },
    {
      user: priya._id,
      event: vintage._id,
      rating: 4,
      comment: "Loved the vintage clothing section.",
    },
    {
      user: sam._id,
      event: jazz._id,
      rating: 5,
      comment: "The third set was incredible.",
    },
    {
      user: marcus._id,
      event: reactConf._id,
      rating: 5,
      comment: "Clear explanations and excellent workshops.",
    },
  ]);

  const counts = {
    users: await User.countDocuments(),
    events: await Event.countDocuments(),
    orders: await Order.countDocuments(),
    tickets: await Ticket.countDocuments(),
    saves: await SavedEvent.countDocuments(),
    reviews: await Review.countDocuments(),
  };
  console.log(
    `Seeded ${counts.users} users, ${counts.events} events, ${counts.orders} orders, ${counts.tickets} tickets, ${counts.saves} saves, ${counts.reviews} reviews.`,
  );
  console.log(
    "Demo accounts (password123): organizer@example.com (organizer), cole@example.com (organizer), attendee@example.com, priya@example.com, marcus@example.com",
  );
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
