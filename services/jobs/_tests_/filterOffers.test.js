import * as moveOffers from '../libs/filterExpiredOffers-lib';
const offers = require('../resources/filterExpiredOffersTest');
test('offers are correctly filtered by date', () => {
    expect(moveOffers.filterExpiredOffers(offers)).toHaveLength(2);
});
