// Visitor counter for hzinchenko.com, deployed as an AWS Lambda with a Function URL.
// POST ?id=90s increments the counter and returns it, GET ?id=90s only reads it.
// Each id in COUNTERS is its own row in DynamoDB, created by its first POST.
// GET ?id=weather returns the weather for the widget on the 90s homepage.
// GET ?id=poll returns the votes of the turtle poll, POST ?id=poll&vote=mikey adds one and returns them too.
// CORS is configured on the Function URL, not here.
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME;
const COUNTERS = new Set(["90s", "2077"]);
// Each turtle is its own row too, poll-leo and so on, created by its first vote.
const TURTLES = ["leo", "donnie", "raph", "mikey"];

// Fetched here and not in the browser, so the weather provider never sees a visitor.
// Open-Meteo: free for non-commercial use, no key, CC BY 4.0 (the widget credits it).
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
  + "?latitude=50.45,49.07&longitude=30.52,33.42" // Kyiv, Kremenchuk
  + "&current=temperature_2m,weather_code,is_day&timezone=Europe%2FKyiv";
// Open-Meteo refreshes the current weather every 15 minutes.
const WEATHER_TTL_SECONDS = 900;
let weather = { body: null, fetchedAt: 0 };

const fetchWeather = async () => {
  const response = await fetch(WEATHER_URL, { signal: AbortSignal.timeout(2000) });
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
  const [kyiv, kremenchuk] = (await response.json()).map(({ current }) => current);
  const city = ({ temperature_2m, weather_code, is_day }) => ({ temp: temperature_2m, code: weather_code, day: is_day === 1 });
  return JSON.stringify({
    updated: kyiv.time.slice(11, 16),
    kyiv: city(kyiv),
    kremenchuk: city(kremenchuk),
  });
};

const weatherResponse = async () => {
  if (Date.now() - weather.fetchedAt > WEATHER_TTL_SECONDS * 1000) {
    try {
      weather = { body: await fetchWeather(), fetchedAt: Date.now() };
    } catch (error) {
      // Slightly old weather beats no weather, so the last good copy keeps being served.
      console.error(error);
      if (!weather.body) return { statusCode: 502, headers: { "cache-control": "no-store" } };
    }
  }
  return {
    statusCode: 200,
    headers: { "content-type": "application/json", "cache-control": `public, max-age=${WEATHER_TTL_SECONDS}` },
    body: weather.body,
  };
};

const increment = async (id) => {
  const result = await db.send(new UpdateItemCommand({
    TableName: TABLE,
    Key: { id: { S: id } },
    UpdateExpression: "ADD #count :one",
    ExpressionAttributeNames: { "#count": "count" },
    ExpressionAttributeValues: { ":one": { N: "1" } },
    ReturnValues: "UPDATED_NEW",
  }));
  return Number(result.Attributes.count.N);
};

// ConsistentRead, so a voter's own vote is always in the results they get back.
const read = async (id) => {
  const result = await db.send(new GetItemCommand({ TableName: TABLE, Key: { id: { S: id } }, ConsistentRead: true }));
  return Number(result.Item?.count?.N ?? 0);
};

const jsonResponse = (body) => ({
  statusCode: 200,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});

// One GetItem per turtle rather than a BatchGetItem, so the function's role needs no new permission.
const pollResponse = async (event, isPost) => {
  if (isPost) {
    const vote = event.queryStringParameters?.vote;
    if (!TURTLES.includes(vote)) return { statusCode: 400 };
    await increment(`poll-${vote}`);
  }
  const counts = await Promise.all(TURTLES.map((turtle) => read(`poll-${turtle}`)));
  return jsonResponse(Object.fromEntries(TURTLES.map((turtle, i) => [turtle, counts[i]])));
};

export const handler = async (event) => {
  const id = event.queryStringParameters?.id;
  const isPost = event.requestContext?.http?.method === "POST";
  if (id === "weather") {
    return weatherResponse();
  }
  if (id === "poll") {
    return pollResponse(event, isPost);
  }
  if (!COUNTERS.has(id)) {
    return { statusCode: 404 };
  }

  const count = await (isPost ? increment(id) : read(id));
  return jsonResponse({ count });
};
