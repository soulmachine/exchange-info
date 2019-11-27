import { strict as assert } from 'assert';
import axios from 'axios';
import { ExchangeInfo } from '../pojo/exchange_info';
import { ZBPairInfo } from '../pojo/pair_info';

export async function getPairs(): Promise<ZBPairInfo[]> {
  const response = await axios.get('http://api.zb.plus/data/v1/markets');
  assert.equal(response.status, 200);
  assert.equal(response.statusText, 'OK');

  const arr: ZBPairInfo[] = [];
  const myMap = response.data as { [key: string]: ZBPairInfo };
  Object.keys(myMap).forEach(key => {
    const value = myMap[key];
    value.raw_pair = key;
    value.normalized_pair = key.toUpperCase();
    arr.push(value);
  });

  return arr;
}

export async function getExchangeInfo(): Promise<ExchangeInfo> {
  const info = {
    name: 'ZB',
    api_doc: 'https://web.zb.com/i/developer',
    websocket_endpoint: 'wss://api.zb.cn/websocket',
    restful_endpoint: 'http://api.zb.plus/data/v1',
    is_dex: false,
    status: true,
    maker_fee: 0.001, // see https://whaleex.zendesk.com/hc/zh-cn/articles/360015324891-%E4%BA%A4%E6%98%93%E6%89%8B%E7%BB%AD%E8%B4%B9
    taker_fee: 0.001,
    pairs: [],
  } as ExchangeInfo;

  info.pairs = await getPairs();
  return info;
}
