import { BigInt, Address, log } from "@graphprotocol/graph-ts";

import {
  ChainlinkPrice,
  FastPrice,
  LastPriceFeedRound,
  UniswapPrice,
} from "../generated/schema";

import {
  CANTO,
  cNOTE,
  getAggregatorAddr,
  getTokenAmountUsd,
  timestampToPeriod,
} from "./helpers";

import {
  AnswerUpdated as AnswerUpdatedEvent,
  ChainlinkAggregator,
} from "../generated/ChainlinkAggregator/ChainlinkAggregator";

import { SetPrice } from "../generated/FastPriceFeed/FastPriceFeed";

import { PriceUpdate } from "../generated/FastPriceEvents/FastPriceEvents";

import { Swap as UniswapSwap } from "../generated/UniswapPool/UniswapPoolV3";

export function handleAnswerUpdated(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    CANTO,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

function _storeChainlinkPrice(
  token: string,
  value: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let id = token + ":" + timestamp.toString();
  let entity = new ChainlinkPrice(id);
  entity.value = value;
  entity.period = "any";
  entity.token = token;
  entity.timestamp = timestamp.toI32();
  entity.blockNumber = blockNumber.toI32();
  entity.save();

  let totalId = token;
  let totalEntity = new ChainlinkPrice(token);
  totalEntity.value = value;
  totalEntity.period = "last";
  totalEntity.token = token;
  totalEntity.timestamp = timestamp.toI32();
  totalEntity.blockNumber = blockNumber.toI32();
  totalEntity.save();
}

function _handleFastPriceUpdate(
  token: Address,
  price: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let dailyTimestampGroup = timestampToPeriod(timestamp, "daily");
  _storeFastPrice(
    dailyTimestampGroup.toString() + ":daily:" + token.toHexString(),
    token,
    price,
    dailyTimestampGroup,
    blockNumber,
    "daily"
  );

  let hourlyTimestampGroup = timestampToPeriod(timestamp, "hourly");
  _storeFastPrice(
    hourlyTimestampGroup.toString() + ":hourly:" + token.toHexString(),
    token,
    price,
    hourlyTimestampGroup,
    blockNumber,
    "hourly"
  );

  _storeFastPrice(
    timestamp.toString() + ":any:" + token.toHexString(),
    token,
    price,
    timestamp,
    blockNumber,
    "any"
  );
  _storeFastPrice(
    token.toHexString(),
    token,
    price,
    timestamp,
    blockNumber,
    "last"
  );
}

function _storeFastPrice(
  id: string,
  token: Address,
  price: BigInt,
  timestampGroup: BigInt,
  blockNumber: BigInt,
  period: string
): void {
  let entity = new FastPrice(id);
  entity.period = period;
  entity.value = price;
  entity.token = token.toHexString();
  entity.timestamp = timestampGroup.toI32();
  entity.blockNumber = blockNumber.toI32();
  entity.save();
}

export function handlePriceUpdate(event: PriceUpdate): void {
  _handleFastPriceUpdate(
    event.params.token,
    event.params.price,
    event.block.timestamp,
    event.block.number
  );
}

export function handleSetPrice(event: SetPrice): void {
  _handleFastPriceUpdate(
    event.params.token,
    event.params.price,
    event.block.timestamp,
    event.block.number
  );
}

export function updatePriceFeeds(token: string, blockNumber: BigInt): void {
  if (token == cNOTE) return;
  let aggregatorAddr = getAggregatorAddr(token);
  const aggregator = ChainlinkAggregator.bind(
    Address.fromString(aggregatorAddr)
  );

  const lastOnchainRound = aggregator.latestRound();
  const lastRoundData = aggregator.getRoundData(lastOnchainRound);

  _storeChainlinkPrice(
    token,
    lastRoundData.value1,
    lastRoundData.value3,
    blockNumber
  );
}
