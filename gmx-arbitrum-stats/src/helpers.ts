import { BigInt, TypedMap, log } from "@graphprotocol/graph-ts";
import { ChainlinkPrice, UniswapPrice } from "../generated/schema";

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000);
export let PRECISION = BigInt.fromI32(10).pow(30);

export let CANTO = "0x826551890dc65655a0aceca109ab11abdbd7a07b";
export let ATOM = "0xeceeefcee421d8062ef8d6b4d814efe4dc898265";
export let ETH = "0x5fd55a1b9fc24967c4db09c513c3ba0dfa7ff687";
export let cNOTE = "0xee602429ef7ece0a13e4ffe8dbc16e101049504c";

export function timestampToDay(timestamp: BigInt): BigInt {
  return (timestamp / BigInt.fromI32(86400)) * BigInt.fromI32(86400);
}

export function timestampToPeriod(timestamp: BigInt, period: string): BigInt {
  let periodTime: BigInt;

  if (period == "daily") {
    periodTime = BigInt.fromI32(86400);
  } else if (period == "hourly") {
    periodTime = BigInt.fromI32(3600);
  } else if (period == "weekly") {
    periodTime = BigInt.fromI32(86400 * 7);
  } else {
    throw new Error("Unsupported period " + period);
  }

  return (timestamp / periodTime) * periodTime;
}

export function getTokenSymbol(tokenAddress: string): string {
  let tokenSymbols = new Map<String, string>();
  tokenSymbols.set(CANTO, "CANTO");
  tokenSymbols.set(ATOM, "ATOM");
  tokenSymbols.set(ETH, "ETH");
  tokenSymbols.set(cNOTE, "cNOTE");
  return tokenSymbols.get(tokenAddress);
}

export function getTokenDecimals(tokenAddress: string): u8 {
  let tokenDecimals = new Map<String, i32>();
  tokenDecimals.set(ETH, 18);
  tokenDecimals.set(ATOM, 6);
  tokenDecimals.set(CANTO, 18);
  tokenDecimals.set(cNOTE, 18);
  return tokenDecimals.get(tokenAddress) as u8;
}

export function getTokenAmountUsd(
  tokenAddress: string,
  amount: BigInt
): BigInt {
  let decimals = getTokenDecimals(tokenAddress);
  let denominator = BigInt.fromString("10").pow(decimals);
  let price = getTokenPrice(tokenAddress);
  return (amount * price) / denominator;
}

export function getTokenPrice(tokenAddress: string): BigInt {
  let entity = ChainlinkPrice.load(tokenAddress);
  if (entity != null) {
    // all chainlink prices have 8 decimals
    // adjusting them to fit GMX 30 decimals USD values
    return entity.value * BigInt.fromString("10").pow(22);
  }
  let defaultPrices = new TypedMap<String, BigInt>();
  defaultPrices.set(ETH, BigInt.fromString("3300") * PRECISION);
  defaultPrices.set(ATOM, BigInt.fromString("11") * PRECISION);
  defaultPrices.set(
    CANTO,
    (BigInt.fromString("255") * PRECISION) / BigInt.fromString("10")
  );
  defaultPrices.set(cNOTE, PRECISION);

  return defaultPrices.get(tokenAddress) as BigInt;
}

export function getAggregatorAddr(tokenAddress: string): string {
  let aggregators = new Map<String, string>();
  aggregators.set(ETH, "0x6d882e6d7a04691fcbc5c3697e970597c68adf39");
  aggregators.set(ATOM, "0xce8937ef7f3874e71c65c55470253b6b86f7c1ab");
  aggregators.set(CANTO, "0x93063d743fc0082121aec5d183e40554468e1568");
  return aggregators.get(tokenAddress);
}
