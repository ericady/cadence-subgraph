import { BigInt, Address } from "@graphprotocol/graph-ts";

import {
  ChainlinkPrice,
  FastPrice,
  LastPriceFeedRound,
  UniswapPrice,
} from "../generated/schema";

import {
  WETH,
  BTC,
  LINK,
  UNI,
  MIM,
  SPELL,
  SUSHI,
  DAI,
  CAD,
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

export function handleAnswerUpdatedBTC(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    BTC,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedETH(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    WETH,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedUNI(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    UNI,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedLINK(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    LINK,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedSPELL(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    SPELL,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedMIM(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    MIM,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedDAI(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    DAI,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

export function handleAnswerUpdatedSUSHI(event: AnswerUpdatedEvent): void {
  _storeChainlinkPrice(
    SUSHI,
    event.params.current,
    event.block.timestamp,
    event.block.number
  );
}

function _storeUniswapPrice(
  id: string,
  token: string,
  price: BigInt,
  period: string,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let entity = UniswapPrice.load(id);
  if (entity == null) {
    entity = new UniswapPrice(id);
  }

  entity.timestamp = timestamp.toI32();
  entity.blockNumber = blockNumber.toI32();
  entity.value = price;
  entity.token = token;
  entity.period = period;
  entity.save();
}

export function handleUniswapGmxEthSwap(event: UniswapSwap): void {
  let ethPerGmx =
    (-(
      (event.params.amount0 * BigInt.fromI32(10).pow(18)) /
      event.params.amount1
    ) *
      BigInt.fromI32(100)) /
    BigInt.fromI32(99);
  let gmxPrice = getTokenAmountUsd(WETH, ethPerGmx);

  let totalId = CAD;
  _storeUniswapPrice(
    totalId,
    CAD,
    gmxPrice,
    "last",
    event.block.timestamp,
    event.block.number
  );

  let id = CAD + ":" + event.block.timestamp.toString();
  _storeUniswapPrice(
    id,
    CAD,
    gmxPrice,
    "any",
    event.block.timestamp,
    event.block.number
  );
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
  // TODO: Find matching aggregator addr
  const aggregatorAddr: Address = Address.fromString(
    "0xdDb6F90fFb4d3257dd666b69178e5B3c5Bf41136"
  );
  const aggregator = ChainlinkAggregator.bind(aggregatorAddr);

  const lastOnchainRound = aggregator.latestRound();
  const lastStoredRound = LastPriceFeedRound.load(token);

  if (!lastStoredRound) {
    // No entity found, just store last round data
    const lastRoundData = aggregator.getRoundData(lastOnchainRound);

    _storeChainlinkPrice(
      token,
      lastRoundData.value1,
      lastRoundData.value3,
      blockNumber
    );
  } else {
    // Iterate rounds from last stored round to last one and store them
    for (
      let round = lastStoredRound.round;
      round.equals(lastOnchainRound);
      round.plus(BigInt.fromI32(1))
    ) {
      const roundData = aggregator.getRoundData(round);
      _storeChainlinkPrice(
        token,
        roundData.value1,
        roundData.value3,
        blockNumber
      );
    }
  }
}
