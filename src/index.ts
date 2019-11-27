import { ExchangeInfo } from './pojo/exchange_info';

import * as Binance from './exchange/binance';
import * as Bitfinex from './exchange/bitfinex';
import * as Bitstamp from './exchange/bitstamp';
import * as BitFlyer from './exchange/bitflyer';
import * as Coinbase from './exchange/coinbase';
import * as Coincheck from './exchange/coincheck';
import * as Huobi from './exchange/huobi';
import * as Newdex from './exchange/newdex';
import * as WhaleEx from './exchange/whaleex';

export * from './pojo/pair_info';
export { ExchangeInfo } from './pojo/exchange_info';

export const EXCHANGES = [
  'Binance',
  'Bitfinex',
  'Bitstamp',
  'Coinbase',
  'Coincheck',
  'Huobi',
  'Newdex',
  'WhaleEx',
  'bitFlyer',
] as const;

export type SupportedExchange = typeof EXCHANGES[number];

/**
 * Get all informaton about a crypto exchange.
 *
 * @param exchangeName The name of the exchange
 */
export default async function getExchangeInfo(
  exchangeName: SupportedExchange,
): Promise<ExchangeInfo> {
  switch (exchangeName) {
    case 'Binance':
      return Binance.getExchangeInfo();
    case 'Bitfinex':
      return Bitfinex.getExchangeInfo();
    case 'Bitstamp':
      return Bitstamp.getExchangeInfo();
    case 'Coinbase':
      return Coinbase.getExchangeInfo();
    case 'Coincheck':
      return Coincheck.getExchangeInfo();
    case 'Huobi':
      return Huobi.getExchangeInfo();
    case 'Newdex':
      return Newdex.getExchangeInfo();
    case 'WhaleEx':
      return WhaleEx.getExchangeInfo();
    case 'bitFlyer':
      return BitFlyer.getExchangeInfo();
    default:
      throw new Error(`Unknown exchange: ${exchangeName}`);
  }
}
