export function filterExpiredOffers(items){
  var expiredOffers = [];
  const today = Date.now();
  for(let offer of items){
    const convDate = Date.parse(offer.offerDetails.expiryDate);
    if(convDate  < today )
      expiredOffers.push(offer);
  }
  return expiredOffers;
}
