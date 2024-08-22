const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const app = express();

app.use(express.json());

const PORT = 5000;

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Hello World",
  });
});

app.get("/profile-image", async (req, res) => {
  let browser;
  const username = req.query.username;

  if (!username || username === "") {
    return res.status(400).json({
      message: "Please provide a username",
    });
  }

  try {
    browser = await puppeteer.launch({
      // headless: true,
      // args: ["--no-sandbox", "--disable-setuid-sandbox"],
      args: [...chromium.args, "--no-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Set a custom user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navigate to the Instagram profile
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle0",
      timeout: 60000, // Increase timeout to 60 seconds
    });

    const validAlt = ["Profile photo", `${username}'s profile picture`];

    // Extract image src if alt text is valid
    const profileImage = await page.evaluate((validAlt) => {
      const imgs = document.getElementsByTagName("img");
      for (let img of imgs) {
        if (validAlt.includes(img.alt)) {
          return {
            src: img.src,
          };
        }
      }
      return null;
    }, validAlt);

    await browser.close();

    if (profileImage) {
      res.json({ src: profileImage?.src });
    } else {
      res.status(404).json({ error: "Profile image not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
