const map = require('../resources/autoFillMap');
test('auto fill offer', () => {
  const offerValue = "90";
  var suggestions = [];
  if(offerValue <50){
    suggestions = map.firstTier;
  }else if(offerValue > 50 && offerValue < 100){
    suggestions = map.secondTier;
  }else if(offerValue > 100 && offerValue < 200){
    suggestion = map.thirdTier;
  }
  console.log(suggestions);
  const suggestion = suggestions[0];
  console.log(suggestion);
  const numberOfFollowers = suggestion.numberOfFollowers;
  expect(numberOfFollowers).toEqual("3000-4000");
  // and so on........
});
