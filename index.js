const express = require("express");
const puppeteer = require("puppeteer");
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
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set a custom user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navigate to the Instagram profile
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
      timeout: 60000, // Increase timeout to 60 seconds
    });

    // Wait for either of the selectors
    const selectors = [
      `img[alt="${username}'s profile picture"]`,
      'img[alt="Profile photo"]',
      "header img", // This is a more general selector that might catch the profile image
    ];

    let imageUrl = null;

    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        imageUrl = await page.evaluate((sel) => {
          const imgElement = document.querySelector(sel);
          return imgElement ? imgElement.src : null;
        }, selector);

        if (imageUrl) break;
      } catch (error) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    await browser.close();

    if (imageUrl) {
      res.json({ imageUrl });
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
