import { strict as assert } from 'assert';
import axios from 'axios';
import { normalizePair } from 'crypto-pair';
import { ExchangeInfo } from '../pojo/exchange_info';
import { BitstampPairInfo, convertArrayToMap, PairInfo } from '../pojo/pair_info';

function extractRawPair(pairInfo: BitstampPairInfo): string {
  return pairInfo.url_symbol;
}

function extractNormalizedPair(pairInfo: BitstampPairInfo): string {
  return pairInfo.name.replace('/', '_');
}

export async function getPairs(
  filter: 'All' | 'Spot' | 'Futures' | 'Swap' = 'All',
): Promise<{ [key: string]: PairInfo }> {
  const response = await axios.get('https://www.bitstamp.net/api/v2/trading-pairs-info/');
  assert.equal(response.status, 200);
  assert.equal(response.statusText, 'OK');

  let arr = response.data as BitstampPairInfo[];

  arr.forEach((p) => {
    /* eslint-disable no-param-reassign */
    p.exchange = 'Bitstamp';
    p.raw_pair = extractRawPair(p);
    p.normalized_pair = extractNormalizedPair(p);
    assert.equal(p.normalized_pair, normalizePair(p.raw_pair, 'Bitstamp'));
    p.price_precision = p.counter_decimals;
    p.base_precision = p.base_decimals;
    p.quote_precision = p.counter_decimals;
    p.min_quote_quantity = parseFloat(p.minimum_order.split(' ')[0]);
    p.spot_enabled = true;
    p.futures_enabled = false;
    p.swap_enabled = false;
    /* eslint-enable no-param-reassign */
  });

  if (filter !== 'All') {
    arr = arr.filter((x) => x.trading === 'Enabled');
    if (filter !== 'Spot') arr = [];
  }

  return convertArrayToMap(arr);
}

export async function getExchangeInfo(
  filter: 'All' | 'Spot' | 'Futures' | 'Swap' = 'All',
): Promise<ExchangeInfo> {
  const info: ExchangeInfo = {
    name: 'Bitstamp',
    api_doc: 'https://www.bitstamp.net/api/',
    websocket_endpoint: 'wss://ws.bitstamp.net',
    restful_endpoint: 'https://www.bitstamp.net/api/v2',
    is_dex: false,
    status: true,
    maker_fee: 0.005, // see https://www.bitstamp.net/fee-schedule/
    taker_fee: 0.005,
    pairs: {},
  };

  info.pairs = await getPairs(filter);
  return info;
}
