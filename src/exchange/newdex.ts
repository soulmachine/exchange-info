import { strict as assert } from 'assert';
import { normalizePair } from 'crypto-pair';
import { EOS_API_ENDPOINTS, getTableRows, TableRows } from 'eos-utils';
import { ExchangeInfo } from '../pojo/exchange_info';
import { convertArrayToMap, NewdexPairInfo, PairInfo } from '../pojo/pair_info';

const promiseAny = require('promise.any');

async function getTableRowsRobust(table: string, lower_bound?: number): Promise<TableRows> {
  return promiseAny(
    EOS_API_ENDPOINTS.map((url) =>
      getTableRows(
        {
          code: 'newdexpublic',
          scope: 'newdexpublic',
          table,
          lower_bound,
        },
        url,
      ),
    ),
  );
}

export async function getGlobalConfig(): Promise<{
  status: boolean;
  maker_fee: number;
  taker_fee: number;
}> {
  const tableRows = await getTableRowsRobust('globalconfig');
  assert.ok(!tableRows.more);

  const arr = tableRows.rows as Array<{
    global_id: number;
    key: string;
    value: string;
    memo: string;
  }>;

  const result = {
    status: arr[1].value === '1', // 交易所运行状态(1-正常，0-维护)
    taker_fee: parseInt(arr[2].value, 10) / 10000,
    maker_fee: parseInt(arr[3].value, 10) / 10000,
  };
  return result;
}

/* eslint-disable no-param-reassign */
function populateCommonFields(pairInfo: NewdexPairInfo): void {
  pairInfo.exchange = 'Newdex';
  pairInfo.raw_pair = pairInfo.pair_symbol;
  let baseSymbol = pairInfo.base_symbol.sym.split(',')[1];
  if (baseSymbol === 'KEY') baseSymbol = 'MYKEY';
  pairInfo.normalized_pair = `${baseSymbol}_${pairInfo.quote_symbol.sym.split(',')[1]}`;
  assert.equal(pairInfo.normalized_pair, normalizePair(pairInfo.raw_pair, 'Newdex'));
  pairInfo.base_precision = parseInt(pairInfo.base_symbol.sym.split(',')[0], 10);
  pairInfo.min_quote_quantity = 0.01; // TODO
  pairInfo.quote_precision = parseInt(pairInfo.quote_symbol.sym.split(',')[0], 10); // 4
  pairInfo.base_contract = pairInfo.base_symbol.contract;
  pairInfo.quote_contract = pairInfo.quote_symbol.contract;
  pairInfo.spot_enabled = true;

  delete pairInfo.current_price;
}
/* eslint-enable no-param-reassign */

export async function getPairs(
  filter: 'All' | 'Spot' | 'Futures' | 'Swap' = 'All',
): Promise<{ [key: string]: PairInfo }> {
  const arr: NewdexPairInfo[] = [];
  let more = true;
  let lowerBound = 1;
  while (more) {
    // eslint-disable-next-line no-await-in-loop
    const result = await getTableRowsRobust('exchangepair', lowerBound);
    let pairs = result.rows as NewdexPairInfo[];
    if (filter !== 'All') pairs = pairs.filter((x) => x.status === 0);
    arr.push(...pairs);
    more = result.more;
    if (pairs.length > 0) {
      lowerBound = Math.max(...pairs.map((x) => x.pair_id)) + 1;
    }
  }

  arr.forEach((p) => populateCommonFields(p));

  return convertArrayToMap(arr);
}

export async function getExchangeInfo(
  filter: 'All' | 'Spot' | 'Futures' | 'Swap' = 'All',
): Promise<ExchangeInfo> {
  const info: ExchangeInfo = {
    name: 'Newdex',
    api_doc: 'https://github.com/newdex/api-docs',
    websocket_endpoint: 'wss://ws.newdex.io',
    restful_endpoint: 'https://api.newdex.io/v1',
    is_dex: true,
    blockchain: 'EOS',
    status: true,
    maker_fee: 0.002, // see https://newdex.zendesk.com/hc/en-us/articles/360015745751-Rate-standard
    taker_fee: 0.002,
    pairs: {},
  };

  const globalConfig = await getGlobalConfig();
  info.status = globalConfig.status;
  info.maker_fee = globalConfig.maker_fee;
  info.taker_fee = globalConfig.taker_fee;

  info.pairs = await getPairs(filter);
  return info;
}
