const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.use(express.json());

// ** Constant
const PORT = 5000;
app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Hello World",
  });
});

app.get("/profile-image", async (req, res) => {
  const username = req.query.username;

  if (!username || username === "") {
    return res.status(400).json({
      message: "Please provide a username",
    });
  }

  try {
    // Launch a headless browser using Puppeteer
    const browser = await puppeteer.launch({
      defaultViewport: null,
    });

    // Create a new page in the browser
    const page = await browser.newPage();

    // Navigate to the Instagram profile
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle2",
    });

    // Wait for the profile picture using the first alt tag
    await page
      .waitForSelector(`img[alt="${username}\'s profile picture"]`, {
        timeout: 5000,
      })
      .catch(() => {});

    // Extract the image URL using page.evaluate
    let imageUrl = await page.evaluate((username) => {
      const imgElement = document.querySelector(
        `img[alt="${username}\'s profile picture"]`
      );
      if (imgElement) {
        return imgElement.src; // Return the image URL
      }
      return null; // Return null if image element is not found
    });

    // If image URL is not found, try with the second alt tag
    if (!imageUrl) {
      await page.waitForSelector('img[alt="Profile photo"]');
      imageUrl = await page.evaluate(() => {
        const imgElement = document.querySelector('img[alt="Profile photo"]');
        if (imgElement) {
          return imgElement.src; // Return the image URL
        }
        return null; // Return null if image element is not found
      });
    }

    // Close the browser
    await browser.close();
    // Send the response with the extracted numbers as JSON
    res.json({ imageUrl } || { error: "Numbers not found" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ** Server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
