import express from "express";
import axios from "axios";
import { load } from "cheerio";
const router = express.Router();

interface Return_Interface {
  state: number;
  data: any;
  message: string;
}
//#region 匯率
router.get("/exchange", async (req, res) => {
  const result: Return_Interface = {
    state: 200,
    data: [],
    message: "",
  };
  try {
    const exchange = await axios
      .get("https://rate.bot.com.tw/xrt?Lang=zh-TW")
      //#region 轉資料
      .then((result) => {
        const response = result.data;
        const $ = load(response);
        // 爬蟲獲取資料
        const list = $(".table-bordered tbody tr"); //尋找 class>tbody>tr
        // console.log(list.length);
        const data = [];
        for (let i = 0; i < list.length; i++) {
          const currency = list
            .eq(i)
            .find("[class='hidden-phone print_show']")
            .text()
            .replace(/\n/g, "")
            .trim();
          const cash = list
            .eq(i)
            .find("[class='text-right display_none_print_show print_width']");
          const cash_bid = cash.eq(0).text();
          const cash_ask = cash.eq(1).text();
          const spot_bid = cash.eq(2).text();
          const spot_ask = cash.eq(3).text();
          data.push({
            currency,
            cash_bid,
            cash_ask,
            spot_bid,
            spot_ask,
          });
        }
        return data.map((i) => {
          const start = i.currency.indexOf("(") + 1;
          const end = i.currency.indexOf(")");
          const currencyCode = i.currency.substring(start, end);

          const name = i.currency.substring(0, i.currency.indexOf(" "));

          return {
            ID: currencyCode,
            Name: name,
            cash_ask: parseFloat(i.cash_ask),
            cash_bid: parseFloat(i.cash_bid),
            spot_bid: parseFloat(i.spot_bid),
            spot_ask: parseFloat(i.spot_ask),
          };
        });
      });
    //#endregion
    result.data = exchange;
    result.state = 200;
  } catch (err: any) {
    result.data = [];
    result.message = err.message;
  }
  res.status(result.state).send({
    data: result.data,
    message: result.message,
  });
});
//#endregion

router.get("/", async (req, res) => {
  res.send("");
});

export default router;
