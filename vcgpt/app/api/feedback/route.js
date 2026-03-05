import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  try {
    const { rating, comment, timestamp } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return new Response("Invalid rating", { status: 400 });
    }

    await redis.lpush(
      "vcgpt:feedback",
      JSON.stringify({ rating, comment, timestamp })
    );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Feedback error:", error);
    return new Response("Failed to save feedback", { status: 500 });
  }
}

export async function GET() {
  try {
    const feedback = await redis.lrange("vcgpt:feedback", 0, -1);
    const parsed = feedback.map((f) =>
      typeof f === "string" ? JSON.parse(f) : f
    );

    return new Response(
      JSON.stringify({ count: parsed.length, feedback: parsed }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return new Response(
      JSON.stringify({ count: 0, feedback: [] }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
