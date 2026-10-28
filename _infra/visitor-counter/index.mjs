// Visitor counter for hzinchenko.com, deployed as an AWS Lambda with a Function URL.
// POST ?id=90s increments the counter and returns it, GET ?id=90s only reads it.
// CORS is configured on the Function URL, not here.
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const TABLE = process.env.TABLE_NAME;
const COUNTERS = new Set(["90s"]);

export const handler = async (event) => {
  const id = event.queryStringParameters?.id;
  if (!COUNTERS.has(id)) {
    return { statusCode: 404 };
  }

  const key = { id: { S: id } };
  let count;

  if (event.requestContext?.http?.method === "POST") {
    const result = await db.send(new UpdateItemCommand({
      TableName: TABLE,
      Key: key,
      UpdateExpression: "ADD #count :one",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":one": { N: "1" } },
      ReturnValues: "UPDATED_NEW",
    }));
    count = Number(result.Attributes.count.N);
  } else {
    const result = await db.send(new GetItemCommand({ TableName: TABLE, Key: key }));
    count = Number(result.Item?.count?.N ?? 0);
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: JSON.stringify({ count }),
  };
};
