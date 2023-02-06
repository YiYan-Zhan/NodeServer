import express from "express";
import axios from "axios";
import { load } from "cheerio";
import moment from "moment";

const router = express.Router();

interface Return_Interface {
    state: number;
    data: any[];
    message: string;
    update_time: string;
}
//#region 匯率
let result: Return_Interface = {
    state: 200,
    data: [],
    message: "",
    update_time: moment().format("YYYY-MM-DD HH:mm:ss"),
};
// 台灣銀行: Bank of Taiwan
router.get("/exchange/bot", async (req, res) => {
    //#region 為避免短時間內執行太多次爬蟲遭到阻擋IP，以每五分鐘進行一次資料更新
    const current = moment().format("YYYY-MM-DD HH:mm:ss");
    const diff = moment(current).diff(time, "minute");
    const reload = diff >= 5 || result.data.length <= 0;

    if (reload) {
        try {
            const updateTime = moment().format("YYYY-MM-DD HH:mm:ss");
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
                            .find(
                                "[class='text-right display_none_print_show print_width']"
                            );
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

                        const name = i.currency.substring(
                            0,
                            i.currency.indexOf(" ")
                        );

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
            result.update_time = updateTime;
            // 存進buffer裡
            buffer.data = exchange;
            buffer.state = 200;
            buffer.update_time = updateTime;
        } catch (err: any) {
            result.data = [];
            result.message = err.message;
        } finally {
            time = moment().format("YYYY-MM-DD HH:mm:ss");
        }
    } else {
        result = buffer;
    }

    //#endregion

    res.status(result.state).send({
        data: result.data,
        message: result.message,
        update_time: result.update_time,
    });
});
// 華南銀行
interface HuaNan_Response {
    CUR_ID: string;
    DATE: string;
    DESC_CHI: string;
    DESC_ENG: string;
    SELL_AMT_BOARD: string;
    BUY_AMT_BOARD: string;
    TIME: string;
    TYPE: string;
}
router.get("/exchange/hncb", async (req, res) => {
    try {
        const { data } = await axios.get(
            "https://www.hncb.com.tw/hncb/rest/exRate/all"
        );

        res.status(200).send(data as HuaNan_Response[]);
    } catch (err) {
        // console.error(err);
        res.status(500).send([]);
    }
});

let time = moment().format("YYYY-MM-DD HH:mm:ss");
let buffer: Return_Interface = {
    data: [],
    state: 200,
    message: "",
    update_time: moment().format("YYYY-MM-DD HH:mm:ss"),
};

//#endregion

router.get("/", async (req, res) => {
    res.send("");
});

export default router;
