import BigNumber from 'bignumber.js';
import { BigNumber as BigNumberEther } from 'ethers';
import numeral from 'numeral';
import { EthNetworks } from 'services/web3/types';
import { shrinkToken } from 'utils/formulas';
import dayjs from './dayjs';
import { Pool } from 'services/observables/pools';
import { APIPool } from 'services/api/bancorApi/bancorApi.types';
import numbro from 'numbro';

const oneMillion = new BigNumber(1000000);

export const ppmToDec = (ppm: number | string | BigNumber) =>
  new BigNumber(ppm).div(oneMillion);

export const decToPpm = (dec: number | string | BigNumber): string =>
  new BigNumber(dec).times(oneMillion).toFixed(0);

const prettifyNumberAbbreviateFormat: numbro.Format = {
  average: true,
  mantissa: 1,
  optionalMantissa: true,
  lowPrecision: false,
  spaceSeparated: true,
  roundingFunction: (num) => Math.floor(num),
};

export function prettifyNumber(num: number | string | BigNumber): string;

export function prettifyNumber(
  num: number | string | BigNumber,
  usd: boolean
): string;

export function prettifyNumber(
  num: number | string | BigNumber,
  options?: { usd?: boolean; abbreviate?: boolean }
): string;

export function prettifyNumber(
  num: number | string | BigNumber,
  optionsOrUsd?: { usd?: boolean; abbreviate?: boolean } | boolean
): string {
  let usd, abbreviate;
  if (optionsOrUsd === undefined) {
    usd = false;
    abbreviate = false;
  } else if (typeof optionsOrUsd === 'boolean') {
    usd = optionsOrUsd;
    abbreviate = false;
  } else {
    usd = optionsOrUsd.usd;
    abbreviate = optionsOrUsd.abbreviate;
  }

  const bigNum = new BigNumber(num);
  if (usd) {
    if (bigNum.lte(0)) return '$0.00';
    if (bigNum.lt(0.01)) return '< $0.01';
    if (bigNum.gt(100)) return numeral(bigNum).format('$0,0', Math.floor);
    if (abbreviate && bigNum.gt(999999))
      return `$${numbro(bigNum).format(prettifyNumberAbbreviateFormat)}`;
    return numeral(bigNum).format('$0,0.00', Math.floor);
  }

  if (bigNum.lte(0)) return '0';
  if (abbreviate && bigNum.gt(999999))
    return numbro(bigNum).format(prettifyNumberAbbreviateFormat);
  if (bigNum.gte(1000)) return numeral(bigNum).format('0,0', Math.floor);
  if (bigNum.gte(2)) return numeral(bigNum).format('0,0.[00]', Math.floor);
  if (bigNum.lt(0.000001)) return '< 0.000001';
  return numeral(bigNum).format('0.[000000]', Math.floor);
}

export const formatDuration = (duration: plugin.Duration): string => {
  let sentence = '';
  const days = duration.days();
  const minutes = duration.minutes();
  const hours = duration.hours();
  if (days > 0) sentence += days + ' Days';
  if (hours > 0) sentence += ' ' + hours + ' Hours';
  if (minutes > 0) sentence += ' ' + minutes + ' Minutes';
  return sentence;
};

export const formatTime = (ms: number): string => {
  const countdown = dayjs.duration(ms).format('HH mm ss');
  let [hours, minutes, seconds] = countdown.split(' ').map((x) => parseInt(x));
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (!days && !hours && !minutes) {
    return `${seconds}s`;
  } else if (!days && !hours) {
    return `${minutes}m ${seconds}s`;
  } else if (!days) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
};

export const isUnsupportedNetwork = (
  network: EthNetworks | undefined
): boolean => {
  return !!network && !EthNetworks[network];
};

export const calculateBntNeededToOpenSpace = (
  bntBalance: string,
  tknBalance: string,
  networkTokensMinted: string,
  networkTokenMintingLimits: string
): string => {
  return new BigNumber(bntBalance)
    .div(tknBalance)
    .plus(networkTokensMinted)
    .minus(networkTokenMintingLimits)
    .toString();
};

export const calculatePriceDeviationTooHigh = (
  averageRate: BigNumber,
  primaryReserveBalance: BigNumber,
  secondaryReserveBalance: BigNumber,
  averageRateMaxDeviation: BigNumber
): boolean => {
  const spotRate = primaryReserveBalance.dividedBy(secondaryReserveBalance);

  const averageRateMaxDeviationBase = new BigNumber(oneMillion).minus(
    averageRateMaxDeviation
  );

  const threshold = averageRate.dividedBy(spotRate);

  const withinLowerThreshold = threshold.isGreaterThan(
    averageRateMaxDeviationBase.dividedBy(oneMillion)
  );

  const withinHigherThreshold = oneMillion
    .dividedBy(averageRateMaxDeviationBase)
    .isGreaterThan(threshold);

  return !(withinLowerThreshold && withinHigherThreshold);
};

export const rewindBlocksByDays = (
  currentBlock: number,
  days: number,
  secondsPerBlock = 13.3
) => {
  if (!Number.isInteger(currentBlock))
    throw new Error('Current block should be an integer');
  const secondsToRewind = dayjs.duration(days, 'days').asSeconds();
  const blocksToRewind = parseInt(String(secondsToRewind / secondsPerBlock));
  return currentBlock - blocksToRewind;
};

export const getFutureTime = (duration: plugin.Duration) =>
  dayjs().add(duration).unix();

export const calculateProgressLevel = (
  startTimeSeconds: number,
  endTimeSeconds: number
) => {
  if (endTimeSeconds < startTimeSeconds)
    throw new Error('End time should be greater than start time');
  const totalWaitingTime = endTimeSeconds - startTimeSeconds;
  const now = dayjs().unix();
  if (now >= endTimeSeconds) return 1;
  const timeWaited = now - startTimeSeconds;
  return timeWaited / totalWaitingTime;
};

export const calculateAPR = (
  roi: number | string | BigNumber,
  magnitude: number | string | BigNumber
) => ppmToDec(roi).minus(1).times(magnitude);

export const calcUsdPrice = (
  amount: number | string | BigNumber,
  price: string | number | BigNumber | null,
  decimals: number
) => new BigNumber(shrinkToken(amount, decimals)).times(price ?? 0).toString();

export const IS_IN_IFRAME = window.self !== window.top;

export const findPoolByConverter = (
  converter: string,
  pools: Pool[],
  apiPools: APIPool[]
): APIPool | Pool | undefined => {
  const poolExists = pools.find((x) => x.converter_dlt_id === converter);

  if (poolExists) {
    return poolExists;
  } else {
    return apiPools.find((x) => x.converter_dlt_id === converter);
  }
};

export const calcFiatValue = (
  amount: number | string | BigNumber,
  price: string | number | BigNumber | null
) =>
  new BigNumber(amount)
    .times(price ?? 0)
    .toFixed(2)
    .toString();

export const calcTknValue = (
  amount: number | string,
  price: string | number | BigNumber | null,
  decimals: number
) =>
  new BigNumber(amount)
    .div(price ?? 0)
    .toFixed(decimals)
    .toString();

export const toBigNumber = (
  num: BigNumberEther | string | number | BigNumber
): BigNumber => new BigNumber(num.toString());

export const compareWithTolerance = (
  a: string,
  b: string,
  tolerance: number
) => {
  return new BigNumber(a).minus(b).abs().isLessThanOrEqualTo(tolerance);
};
