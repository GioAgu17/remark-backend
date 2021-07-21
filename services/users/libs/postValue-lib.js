const values = require('../resources/averagePostValue');
export function calculateAveragePostValue(followers, engagementRate){
  const firstRangeStr = process.env.firstRange;
  if(firstRangeStr){
    const firstRange = firstRangeStr.split("-");
    if(followers > parseInt(firstRange[0]) && followers < parseInt(firstRange[1])){
        // HANDLE FIRST RANGE
        const valuesRange = values.first;
        return calculateTotalValue(parseInt(firstRange[0]), parseInt(firstRange[1]), valuesRange, followers, engagementRate);
    }else{
      const secondRangeStr = process.env.secondRange;
      if(secondRangeStr){
        const secondRange = secondRangeStr.split("-");
        if(followers > parseInt(secondRange[0]) && followers < parseInt(secondRange[1])){
          // HANDLE SECOND RANGE
          const valuesRange = values.second;
          return calculateTotalValue(parseInt(firstRange[0]), parseInt(firstRange[1]), valuesRange, followers, engagementRate);
        }else{
          const thirdRangeStr = process.env.thirdRange;
          if(thirdRangeStr){
            const thirdRange = thirdRangeStr.split("-");
            if(followers > parseInt(thirdRange[0]) && followers < parseInt(thirdRange[1])){
              // HANDLE THIRD RANGE
              const valuesRange = values.third;
              return calculateTotalValue(parseInt(firstRange[0]), parseInt(firstRange[1]), valuesRange, followers, engagementRate);
            }else{
              const fourthRangeStr = process.env.fourthRange;
              if(fourthRangeStr){
                const fourthRange = fourthRangeStr.split("-");
                if(followers > parseInt(fourthRange[0]) && followers < parseInt(fourthRange[1])){
                  // HANDLE FOURTH RANGE
                  const valuesRange = values.fourth;
                  return calculateTotalValue(parseInt(firstRange[0]), parseInt(firstRange[1]), valuesRange, followers, engagementRate);
                }else{
                  const fifthRangeStr = process.env.fifthRange;
                  if(fifthRangeStr){
                    const fifthRange = fifthRangeStr.split("-");
                    if(followers > parseInt(fifthRange[0]) && followers < parseInt(fifthRange[1])){
                      // HANDLE FIFTH RANGE
                      const valuesRange = values.fifth;
                      return calculateTotalValue(parseInt(firstRange[0]), parseInt(firstRange[1]), valuesRange, followers, engagementRate);
                    }else{
                      const sixthRangeStr = process.env.sixthRange;
                      if(sixthRangeStr){
                        const sixthRange = sixthRangeStr.split("-");
                        if(followers > parseInt(sixthRange[0]) && followers < parseInt(sixthRange[1])){
                          // HANDLE SIXTH RANGE
                          const valuesRange = values.sixth;
                          return calculateTotalValue(parseInt(firstRange[0]), parseInt(firstRange[1]), valuesRange, followers, engagementRate);
                        }else{
                          // HANDLE MAX VALUE
                          const value = values.seventh;
                          const erIncrease = engagementRate * 0.2;
                          return (value * erIncrease) + value;
                        }
                      }else{
                        throw new Error("Environment variable for sixth range is not present");
                      }
                    }
                  }else{
                    throw new Error("Environment variable for fifth range is not present");
                  }
                }
              }else{
                throw new Error("Environment variable for fourth range is not present");
              }
            }
          }else{
            throw new Error("Environment variable for third range is not present");
          }
        }
      }else{
        throw new Error("Environment variable for second range is not present");
      }
    }
  }else {
    throw new Error("Environment variable for first range is not present");
  }
}

function calculateTotalValue(x1, x2, valuesRange, followers, engagementRate){
  const y1 = valuesRange.min;
  const y2 = valuesRange.max;
  const m = calculateAngularCoeff(x1, x2, y1, y2);
  const q = calculateQ(x1, y1, m);
  const intermediateValue = (m * followers) + q;
  // increase for 2% for every engagementRate point
  const erIncrease = engagementRate * 0.2;
  const totalValue = (intermediateValue * erIncrease) + intermediateValue;
  return totalValue;
}

function calculateAngularCoeff(x1, x2, y1, y2){
  const num = y1 - y2;
  const denum = x1 - x2;
  return num / denum;
}

function calculateQ(x1, y1, m){
  return y1 - (m*x1);
}
