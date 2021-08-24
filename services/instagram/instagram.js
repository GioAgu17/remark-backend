import handler from "../../libs/handler-lib";
export const main = handler(async (event, context) => {
  // add code here
  console.log("Hello world");
  return { status: true };
});