/**
 * Chainlink Functions — Flight Status Source
 *
 * This JavaScript module is executed by the Chainlink DON (Decentralised Oracle
 * Network). It fetches live flight data from the AviationStack REST API and
 * returns the delay in minutes encoded as a uint256.
 *
 * Arguments (passed via FunctionsRequest.setArgs):
 *   args[0]  — IATA flight number, e.g. "AA123"
 *   args[1]  — Flight date in YYYY-MM-DD format, e.g. "2024-12-25"
 *
 * Secrets (stored encrypted in the Chainlink subscription):
 *   secrets.aviationKey — AviationStack API access key
 *
 * Return value:
 *   Functions.encodeUint256(delayMinutes)
 *   where delayMinutes is 0 when there is no delay or data is unavailable.
 */

// ── Input Validation ────────────────────────────────────────────────────── //

if (!args || args.length < 2) {
  throw new Error("Missing required arguments: flightNumber and flightDate");
}

const flightNumber = args[0].trim().toUpperCase();
const flightDate   = args[1].trim();

if (!flightNumber) throw new Error("flightNumber argument is empty");
if (!flightDate)   throw new Error("flightDate argument is empty");

// Validate date format (YYYY-MM-DD).
if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate)) {
  throw new Error(`Invalid flightDate format: "${flightDate}". Expected YYYY-MM-DD.`);
}

// ── AviationStack API Request ────────────────────────────────────────────── //

const apiKey = secrets.aviationKey;
if (!apiKey) throw new Error("Missing secret: aviationKey");

const apiResponse = await Functions.makeHttpRequest({
  url: "http://api.aviationstack.com/v1/flights",
  method: "GET",
  params: {
    access_key:  apiKey,
    flight_iata: flightNumber,
    flight_date: flightDate,
  },
  timeout: 9000, // ms — stay well within the 10 s DON timeout
});

// ── Response Parsing ─────────────────────────────────────────────────────── //

if (apiResponse.error) {
  console.error("HTTP error:", JSON.stringify(apiResponse.error));
  // Return 0 delay on network/API errors so we don't accidentally trigger
  // a payout; the Keeper will retry on the next upkeep cycle.
  return Functions.encodeUint256(0);
}

const data = apiResponse.data;

if (!data || !data.data || data.data.length === 0) {
  console.log("No flight data returned for", flightNumber, flightDate);
  return Functions.encodeUint256(0);
}

// Take the first matching flight record.
const flight = data.data[0];

// AviationStack returns delay in minutes; null means no delay reported.
const rawDelay = flight?.arrival?.delay ?? flight?.departure?.delay ?? null;

let delayMinutes = 0;
if (rawDelay !== null && rawDelay !== undefined) {
  const parsed = parseInt(rawDelay, 10);
  delayMinutes = isNaN(parsed) ? 0 : Math.max(0, parsed);
}

console.log(
  `Flight ${flightNumber} on ${flightDate}: delay = ${delayMinutes} minutes`
);

// ── Return Encoded Result ────────────────────────────────────────────────── //

return Functions.encodeUint256(delayMinutes);
