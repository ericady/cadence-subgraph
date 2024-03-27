import { BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { ChainlinkPrice, UniswapPrice } from "../generated/schema";

export let BASIS_POINTS_DIVISOR = BigInt.fromI32(10000);
export let PRECISION = BigInt.fromI32(10).pow(30);

export let WETH = "0x826551890Dc65655a0Aceca109aB11AbDbD7a07B";
export let BTC = "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687";
export let LINK = "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265";
export let UNI = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
export let USDT = "0xEe602429Ef7eCe0a13e4FfE8dBC16e101049504C";
export let USDCe = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
export let USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
export let MIM = "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a";
export let SPELL = "0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af";
export let SUSHI = "0xd4d42f0b6def4ce0383636770ef773390d85c61a";
export let FRAX = "0x17fc002b466eec40dae837fc4be5c67993ddbd6f";
export let DAI = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1";
export let CAD = "0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a";

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

export function getTokenDecimals(token: String): u8 {
  let tokenDecimals = new Map<String, i32>();
  tokenDecimals.set(WETH, 18);
  tokenDecimals.set(BTC, 18);
  tokenDecimals.set(LINK, 18);
  tokenDecimals.set(UNI, 18);
  tokenDecimals.set(USDC, 6);
  tokenDecimals.set(USDCe, 6);
  tokenDecimals.set(USDT, 6);
  tokenDecimals.set(MIM, 18);
  tokenDecimals.set(SPELL, 18);
  tokenDecimals.set(SUSHI, 18);
  tokenDecimals.set(FRAX, 18);
  tokenDecimals.set(DAI, 18);
  tokenDecimals.set(CAD, 18);

  return tokenDecimals.get(token) as u8;
}

export function getTokenAmountUsd(token: String, amount: BigInt): BigInt {
  let decimals = getTokenDecimals(token);
  let denominator = BigInt.fromI32(10).pow(decimals);
  let price = getTokenPrice(token);
  return (amount * price) / denominator;
}

export function getTokenPrice(token: String): BigInt {
  if (token != CAD) {
    let chainlinkPriceEntity = ChainlinkPrice.load(token);
    if (chainlinkPriceEntity != null) {
      // all chainlink prices have 8 decimals
      // adjusting them to fit CAD 30 decimals USD values
      return chainlinkPriceEntity.value * BigInt.fromI32(10).pow(22);
    }
  }

  if (token == CAD) {
    let uniswapPriceEntity = UniswapPrice.load(CAD);

    if (uniswapPriceEntity != null) {
      return uniswapPriceEntity.value;
    }
  }

  let prices = new TypedMap<String, BigInt>();
  prices.set(WETH, BigInt.fromI32(3350) * PRECISION);
  prices.set(BTC, BigInt.fromI32(45000) * PRECISION);
  prices.set(LINK, BigInt.fromI32(25) * PRECISION);
  prices.set(UNI, BigInt.fromI32(23) * PRECISION);
  prices.set(USDC, PRECISION);
  prices.set(USDCe, PRECISION);
  prices.set(USDT, PRECISION);
  prices.set(MIM, PRECISION);
  prices.set(SPELL, PRECISION / BigInt.fromI32(50)); // ~2 cents
  prices.set(SUSHI, BigInt.fromI32(10) * PRECISION);
  prices.set(FRAX, PRECISION);
  prices.set(DAI, PRECISION);
  prices.set(CAD, BigInt.fromI32(30) * PRECISION);

  return prices.get(token) as BigInt;
}
