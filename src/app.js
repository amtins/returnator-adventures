const binanceURL = 'https://api.binance.com/api/v3/';
const cryptoList = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'SOLUSDT',
  'ADAUSDT',
  'LUNAUSDT',
  'AVAXUSDT',
  'DOGEUSDT',
];

const monthList = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 *
 * @param {*} data
 * @returns
 */
const loadMoreListener = (data) => {
  return (e) => {
    e.preventDefault();
    e.target.disabled = true;

    document.querySelector('.loader').classList.remove('hide');

    if (!data.length) {
      //TODO Improve user experience
      e.target.disabled = true;
      e.target.textContent = 'Data loaded';
      document.querySelector('.loader').classList.add('hide');

      return;
    }

    e.target.textContent = 'Loading ...';

    buildTemplate(data.shift()).then(() => {
      e.target.disabled = false;
      e.target.textContent = 'Load more';

      if (!data.length) {
        e.target.classList.add('hide');
        e.target.disabled = true;
      }

      document.querySelector('.loader').classList.add('hide');
    });
  };
};

/**
 *
 * @param {Object} param0
 */
const searchListener = ({ target: { value: searchValue = '' } }) => {
  //TODO improve search performance
  document.querySelectorAll('.crypto-currency').forEach((cryptoCurrency) => {
    const hasCrypto = cryptoCurrency.textContent
      .toLocaleLowerCase()
      .startsWith(searchValue.toLocaleLowerCase());

    cryptoCurrency
      .closest('.chart-container')
      .classList.toggle('hide', !hasCrypto);
  });
};

/**
 *
 * @param {*} months
 * @returns
 */
const createMonthHeaders = (months = monthList) => {
  const fragment = document.createDocumentFragment();

  months.forEach((month) => {
    const th = document.createElement('th');
    th.textContent = month;

    fragment.append(th);
  });

  return fragment;
};

/**
 *
 * @param {*} data
 * @param {*} months
 * @returns
 */
const createReturnsByMonth = (data, months = monthList) => {
  const fragment = document.createDocumentFragment();

  months.forEach((_month, i) => {
    const td = document.createElement('td');
    const monthlyData = data.find(({ OpenDate }) => OpenDate.getMonth() === i);

    if (monthlyData) {
      td.textContent = monthlyData.FormattedPercent;
    }

    if (monthlyData && monthlyData.Percent !== 0) {
      let cssClass =
        monthlyData.Percent > 0
          ? 'chart__percentage--up'
          : 'chart__percentage--down';

      td.classList.add(cssClass);
    }

    fragment.append(td);
  });

  return fragment;
};

/**
 *
 * @param {*} data
 * @returns
 */
const createContentElement = (data) => {
  const fragment = document.createDocumentFragment();
  const dataByYear = groupBy(data, 'FullYear');
  const years = extractYears(data);

  years.forEach((year) => {
    const dataByMonth = dataByYear[year];
    const returns = createReturnsByMonth(dataByMonth);
    const tr = document.createElement('tr');
    const th = document.createElement('th');

    th.textContent = year;

    tr.append(th);
    tr.append(returns);

    fragment.append(tr);
  });

  return fragment;
};

/**
 *
 * @param {Array} symbols
 * @returns
 */
const buildTemplate = (symbols) => {
  return fetchSymbols(symbols).then((results) => {
    results.forEach(({ symbol, data }) => {
      const chartTemplate = document
        .getElementById('chart-template')
        .content.cloneNode(true);
      const chartTable = chartTemplate.querySelector('.chart');
      const chartHeaderEl = chartTemplate.querySelector('.chart__row-header');
      const cryptoCurrencyEl = chartTemplate.querySelector('.crypto-currency');
      const chartBodyEl = chartTemplate.querySelector('.chart__content');
      const cryptoCurrencyName = extractCryptoNameFromSymbol(symbol);

      chartTable.classList.add(cryptoCurrencyName);
      cryptoCurrencyEl.textContent = cryptoCurrencyName;
      chartHeaderEl.append(createMonthHeaders());
      chartBodyEl.append(createContentElement(formatData(data)));

      document.querySelector('main').append(chartTemplate);
    });
  });
};

/**
 *
 * @param {Array} array
 * @param {Number} size
 * @returns
 */
const chunk = (array, size = 10) => {
  const chunks = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
};

/**
 *
 * @param {Object} data
 * @param {String} property
 * @returns
 */
const groupBy = (data, property) => {
  return data.reduce((acc, obj) => {
    let key = obj[property];

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(obj);

    return acc;
  }, {});
};

/**
 * Extract a set of years.
 *
 * @param {Array} data
 *
 * @returns {Set} years set
 */
const extractYears = (data) => {
  return new Set(data.map(({ FullYear }) => FullYear));
};

/**
 * Extract crypto currency name from symbol.
 *
 * @param {String} symbol
 *
 * @returns {String} crypto currency name
 */
const extractCryptoNameFromSymbol = (symbol) =>
  symbol.replace('USDT', '').toLocaleLowerCase();

/**
 * Calculate the percentage change between two numbers.
 *
 * @param {Number} a
 * @param {Number} b
 *
 * @returns {String} percentage change between two numbers fixed to two decimals
 */
const calculateReturns = (a, b) => {
  if (b === 0) {
    return (0).toFixed(2);
  }

  return (((a - b) / b) * 100).toFixed(2);
};

/**
 *
 * @param {*} data
 * @returns
 */
const formatData = (data) => {
  return data
    .map(
      ([
        OpenTime,
        Open,
        High,
        Low,
        Close,
        Volume,
        CloseTime,
        QuoteAssetVolume,
        NumberOfTrades,
        TakerBuyBaseAssetVolume,
        TakerBuyQuoteAssetVolume,
        Ignore,
      ]) => {
        const percent = +calculateReturns(+Close, +Open);
        const OpenDate = new Date(OpenTime);
        const CloseDate = new Date(CloseTime);

        return {
          Percent: percent,
          FormattedPercent: `${percent.toFixed(2)}%`,
          FullYear: OpenDate.getFullYear(),
          OpenTime,
          OpenDate,
          Open,
          High,
          Low,
          Close,
          Volume,
          CloseTime,
          CloseDate,
          QuoteAssetVolume,
          NumberOfTrades,
          TakerBuyBaseAssetVolume,
          TakerBuyQuoteAssetVolume,
          Ignore,
        };
      }
    )
    .reverse();
};

/**
 *
 * @returns
 */
const listSymbols = async () => {
  const response = await fetch(`${binanceURL}exchangeInfo`);
  const { symbols } = await response.json();

  return symbols.filter(
    ({ quoteAsset, status, permissions }) =>
      quoteAsset === 'USDT' &&
      status === 'TRADING' &&
      permissions.includes('SPOT')
  );
};

/**
 *
 * @param {Array} symbols
 * @returns {Promise}
 */
const fetchSymbols = async (symbols = []) => {
  return await Promise.all(
    symbols.map(async (symbol) => {
      const response = await fetch(
        `${binanceURL}klines?symbol=${symbol}&interval=1M&startTime=0`
      );
      const json = await response.json();

      return {
        symbol,
        data: json,
      };
    })
  );
};

buildTemplate(cryptoList).then(() => {
  document.querySelector('.loader').classList.add('hide');
  document
    .querySelector('.search-bar__input')
    .addEventListener('input', searchListener);

  listSymbols()
    .then((result) => {
      const data = result
        .filter((entry) => !cryptoList.includes(entry.symbol))
        .map(({ symbol }) => symbol);

      return chunk(data);
    })
    .then((data) => {
      document
        .querySelector('.footer__btn')
        .addEventListener('click', loadMoreListener(data));
    });
});
