import express, { Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";
import Redis from "ioredis";

// ─── Configuration ───────────────────────────────────────────────────────────
// Zmienne środowiskowe są podawane przez docker-compose.yml (sekcja environment:).
// Jeśli nie są ustawione – używamy wartości domyślnych (po '||').
const PORT = process.env.PORT || 3100;
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://root:example@mongodb:27017/invoices?authSource=admin";
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

const CACHE_KEY = "invoices:all";
const CACHE_TTL_SECONDS = 60; // cache żyje 60 sekund

// ─── MongoDB: Schema + Model ──────────────────────────────────────────────────
// Mongoose pozwala zdefiniować "kształt" dokumentu (Schema).
// Model to klasa, której używamy do operacji CRUD na kolekcji.
interface IInvoice extends Document {
  number: string;
  amount: number;
  client: string;
  createdAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  number: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  client: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ta linijka tworzy model Mongoose o nazwie "Invoice" na podstawie schematu invoiceSchema. 
// Model "Invoice" reprezentuje kolekcję faktur w MongoDB i pozwala wykonywać na niej operacje CRUD.
const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);

// ─── Redis client ─────────────────────────────────────────────────────────────
// ioredis automatycznie ponowi połączenie jeśli Redis chwilowo nie odpowiada.
const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT });

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json()); // middleware: parsuje body requestu jako JSON

// ─── GET /invoices ─────────────────────────────────────────────────────────────
// Logika: sprawdź cache → jeśli HIT zwróć z Redis; jeśli MISS pobierz z MongoDB
// i zapisz do Redis z TTL, żeby następny request był szybszy.
app.get("/invoices", async (_req: Request, res: Response) => {
  try {
    const cached = await redis.get(CACHE_KEY);

    if (cached) {
      console.log("Cache HIT – returning from Redis");
      // JSON.parse bo Redis trzyma dane jako string, nie obiekt
      return res.json({ source: "cache", data: JSON.parse(cached) });
    }

    console.log("Cache MISS – fetching from MongoDB");
    // Pobiera wszystkie faktury z bazy MongoDB i sortuje je malejąco po dacie utworzenia (najnowsze pierwsze)
    const invoices = await Invoice.find().sort({ createdAt: -1 });

    // Zapisz wynik do Redis; 'EX' ustawia czas wygaśnięcia (expiry) w sekundach
    await redis.set(CACHE_KEY, JSON.stringify(invoices), "EX", CACHE_TTL_SECONDS);

    return res.json({ source: "database", data: invoices });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /invoices ────────────────────────────────────────────────────────────
// Logika: zapisz nową fakturę do MongoDB, usuń cache (stale), zwróć 201 Created.
// Usunięcie cache (invalidation) sprawia, że kolejny GET pobierze świeże dane z DB.
app.post("/invoices", async (req: Request, res: Response) => {
  try {
    const { number, amount, client } = req.body as {
      number: string;
      amount: number;
      client: string;
    };

    if (!number || !amount || !client) {
      return res
        .status(400)
        .json({ error: "Fields required: number, amount, client" });
    }

    const invoice = new Invoice({ number, amount, client });
    await invoice.save(); // zapisuje do MongoDB

    // Unieważnienie cache: po dodaniu faktury stary cache jest nieaktualny
    await redis.del(CACHE_KEY);
    console.log("Invoice saved, cache invalidated");

    return res.status(201).json(invoice);
  } catch (err: unknown) {
    if (
      err instanceof mongoose.Error.ValidationError ||
      (err as { code?: number }).code === 11000 // duplicate key
    ) {
      return res.status(409).json({ error: "Invoice number already exists" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
// Docker Compose (i inne orkiestratory) pingują ten endpoint żeby sprawdzić
// czy kontener "żyje". Zwraca 200 OK gdy połączenia z DB i cache są aktywne.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Startup ───────────────────────────────────────────────────────────────────
// Najpierw połącz z MongoDB, dopiero potem uruchom serwer HTTP.
// Gdybyśmy odwrócili kolejność – app działałaby, ale zapytania do DB by padały.
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`invoices-api listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1); // zakończ proces z błędem – Docker zrestartuje kontener
  });
