const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const { PDFDocument, StandardFonts } = require("pdf-lib");
const { Translate } = require("@google-cloud/translate").v2;
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fontkit = require("fontkit"); 
import path from "path";



dotenv.config();

const translate = new Translate({ key: process.env.GOOGLE_API_KEY });

const upload = multer({ dest: "uploads/" });

const app = express();
const port = 5000;
const __dirname = path.resolve();

app.use(
  cors({
    origin: "https://pdf-traslate.vercel.app",
    credentials: true,
  })
)



app.use(cors());
app.use(express.json());

app.post("/translate", upload.single("file"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);

    const [translation] = await translate.translate(pdfData.text, "hi");

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit); // Register fontkit before embedding fonts

    const fontBytes = fs.readFileSync(
      path.join(__dirname, "NotoSansDevanagari-Regular.ttf")
    );
    const customFont = await pdfDoc.embedFont(fontBytes, { subset: true });
    const page = pdfDoc.addPage();
    page.setFont(customFont);
    page.setFontSize(12);

    page.drawText(translation, { x: 50, y: 700, maxWidth: 500 });

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Disposition", "attachment; filename=translated.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (e) {
    console.error(e);
    res.status(500).send("Error processing the file");
  }
});

app.listen(port, () => {
  console.log("App is listening.....!!");
});
