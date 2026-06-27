const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    // 一度トップへ行く
    await page.goto(
      "https://www.library.city.himeji.hyogo.jp/winj/opac/newly.do",
      {
        waitUntil: "networkidle"
      }
    );

    // 新着一覧へ移動
    await page.goto(
      "https://www.library.city.himeji.hyogo.jp/winj/opac/newly-list.do?key=0000056027",
      {
        waitUntil: "networkidle"
      }
    );

    console.log("URL:", page.url());
    console.log("TITLE:", await page.title());

    const count =
      await page.locator("ol.list-book > li").count();

    console.log("BOOK COUNT:", count);

    // デバッグ用HTML保存
    fs.writeFileSync(
      "debug.html",
      await page.content()
    );

    // スクリーンショット保存
    await page.screenshot({
      path: "debug.png",
      fullPage: true
    });

    let books = [];

    if (count > 0) {
      books = await page.evaluate(() => {
        return [
          ...document.querySelectorAll(
            "ol.list-book > li"
          )
        ].map(li => {
          const title =
            li.querySelector(".title")
              ?.innerText
              .replace(/\n/g, " ")
              .trim();

          const info =
            li.querySelector(".column.info p")
              ?.innerText
              .trim();

          const reserve =
            li
              .querySelector(
                "a[href*='execReserveBasket']"
              )
              ?.href
              ?.match(/'(\d+)'/)?.[1];

          return {
            title,
            info,
            bibid: reserve
          };
        });
      });
    }

    console.log("books:", books.length);

    let old = [];

    if (fs.existsSync("books.json")) {
      try {
        old = JSON.parse(
          fs.readFileSync(
            "books.json",
            "utf8"
          )
        );
      } catch (e) {
        console.log(
          "books.json parse error"
        );
      }
    }

    const oldIds =
      new Set(
        old
          .filter(b => b.bibid)
          .map(b => b.bibid)
      );

    const added =
      books.filter(
        b =>
          b.bibid &&
          !oldIds.has(b.bibid)
      );

    console.log(
      "new books:",
      added.length
    );

    fs.writeFileSync(
      "books.json",
      JSON.stringify(
        books,
        null,
        2
      )
    );

    fs.writeFileSync(
      "new_books.json",
      JSON.stringify(
        added,
        null,
        2
      )
    );
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await browser.close();
  }
})();
