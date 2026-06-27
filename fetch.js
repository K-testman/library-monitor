const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

await page.goto(
  "https://www.library.city.himeji.hyogo.jp/winj/opac/newly.do"
);

await page.goto(
  "https://www.library.city.himeji.hyogo.jp/winj/opac/newly-list.do?key=0000056027"
);

  const books = await page.evaluate(() => {
    return [...document.querySelectorAll("ol.list-book > li")]
      .map(li => {
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
          li.querySelector("a[href*='execReserveBasket']")
            ?.href
            ?.match(/'(\d+)'/)?.[1];

        return {
          title,
          info,
          bibid: reserve
        };
      });
  });

  const old =
    fs.existsSync("books.json")
      ? JSON.parse(
          fs.readFileSync(
            "books.json",
            "utf8"
          )
        )
      : [];

  const oldIds =
    new Set(old.map(b => b.bibid));

  const added =
    books.filter(
      b => !oldIds.has(b.bibid)
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

  await browser.close();
})();
